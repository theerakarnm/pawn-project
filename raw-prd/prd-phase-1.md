## FEATURE:

**PAWN Phase 1 — LINE OA & Payment Submission System**

Build the complete customer-facing flow for the PAWN installment payment system. This is a **demo build** — all data is in-memory mock (no real DB), but LINE integration is real.

### 1. Rich Menu (LINE OA)
Set up a LINE Rich Menu with 3 tap areas:
- **แจ้งชำระ** → opens LIFF WebView (`pawn-liff`)
- **เช็กยอดคงเหลือ** → sends `postback` event with `data: "check_balance"` to `pawn-api`
- **ติดต่อเจ้าหน้าที่** → sends `postback` event with `data: "contact_staff"`

Rich Menu layout: 2 columns top row, 1 column bottom row. Size: 2500×1686px. Background `#00B900`, text `#FFFFFF`. Register via LINE Developers Console — this is config, not code.

### 2. pawn-liff (Vite + React) — Payment Form
Single-page app with 3 conditional screens rendered by state (not routing):

**Screen: PaymentForm**
- Field: รหัสผ่อน OR เบอร์โทร (one of two required, not both)
- Field: ยอดโอน (บาท) — number only, max 2 decimal places
- Field: แนบสลิป — file input, accept `image/jpeg,image/png,image/heic`, max 5MB client-side
- Submit button disabled until all 3 fields have values
- On submit: disable button immediately (prevent double-tap), show loading spinner, POST to `pawn-api` as `multipart/form-data`

**Screen: SuccessScreen**
- Show after `201` response
- Message: ส่งข้อมูลสำเร็จ รอพนักงานตรวจสอบสลิปภายใน 24 ชั่วโมง
- Button: ปิดหน้าต่าง → calls `liff.closeWindow()`

**Screen: ErrorScreen**
- Show on API error or LIFF init failure
- Display error message from API or generic fallback

### 3. pawn-api (Hono.js + Bun) — API Routes

**`POST /api/payments`** — receive payment submission from LIFF
- Parse `multipart/form-data`
- Validate with Zod
- Lookup customer from mock data by `installmentCode` or `phone`
- Stub slip upload: accept file, skip actual R2 upload, store a fake URL `https://r2.example.com/slip/{uuid}.jpg`
- Save payment to mock `payments` array with `status: "pending_verification"`
- **Do NOT mutate `remaining_balance`** at this step
- Return `201` with `{ paymentId, status, message }`

**`POST /api/webhook/line`** — receive LINE events
- Verify `x-line-signature` with `validateSignature()` — return `400` immediately if invalid
- Return `200 OK` before processing events (respond within 1s rule)
- Handle `postback` event `data: "check_balance"`: lookup customer by `lineUserId`, push balance Flex Message
- Handle `postback` event `data: "contact_staff"`: push a text message with shop contact info

**`GET /api/customers/lookup`** — internal use only (called by payment route, not exposed to LIFF directly)
- Query param `?q=` accepts installmentCode or phone
- Normalize phone: strip `-`, spaces before lookup
- Match installmentCode case-insensitively
- If multiple active contracts found by phone, return the most recent `status: "active"` one

### 4. Flex Message Builders (pawn-api)
Build and export two Flex Message builder functions. Phase 2 will call these — do not couple them to route handlers:

**`buildPaymentConfirmFlex(payment, customer)`** — used by Phase 2 confirm endpoint
Shows: รหัสผ่อน, ยอดชำระ, วันที่ชำระ, ยอดคงเหลือ (red), งวดถัดไป (gray)

**`buildBalanceFlex(customer)`** — used by webhook `check_balance` handler
Shows: ยอดคงเหลือ, งวดที่เหลือ, วันกำหนดชำระถัดไป

### 5. Mock Data (pawn-api/src/mock/)
Two in-memory arrays loaded from JSON files. Mutated directly in memory — no persistence, resets on restart.

`customers.json` — 20 records covering all status types:
- 12 × `active`, 4 × `overdue`, 3 × `active` with `nextDueDate` within 7 days, 1 × `completed`

`payments.json` — 15 records: 8 × `confirmed`, 5 × `pending_verification`, 2 × `rejected`

---

## EXAMPLES:

### LIFF Init + Login Guard (`pawn-liff/src/hooks/useLiff.ts`)

The single most common mistake with LIFF in Vite is treating it like a normal React app. LIFF must init before anything renders, and login must complete before calling `getProfile()`:

```ts
import liff from "@line/liff";
import { useEffect, useState } from "react";

interface LiffState {
  ready: boolean;
  lineUserId: string | null;
  displayName: string | null;
  error: string | null;
}

export function useLiff(): LiffState {
  const [state, setState] = useState<LiffState>({
    ready: false, lineUserId: null, displayName: null, error: null,
  });

  useEffect(() => {
    liff
      .init({ liffId: import.meta.env.VITE_LIFF_ID })
      .then(async () => {
        if (!liff.isLoggedIn()) {
          liff.login(); // redirects — nothing after this runs
          return;
        }
        const profile = await liff.getProfile();
        setState({ ready: true, lineUserId: profile.userId, displayName: profile.displayName, error: null });
      })
      .catch(() => {
        setState({ ready: false, lineUserId: null, displayName: null,
          error: "ไม่สามารถเชื่อมต่อ LINE ได้ กรุณาเปิดผ่าน LINE เท่านั้น" });
      });
  }, []);

  return state;
}
```

Use in App.tsx with 3-screen conditional render:

```tsx
// pawn-liff/src/App.tsx
import { useLiff } from "./hooks/useLiff";
import { PaymentForm } from "./components/PaymentForm";
import { SuccessScreen } from "./components/SuccessScreen";
import { ErrorScreen } from "./components/ErrorScreen";
import { useState } from "react";

type Screen = "form" | "success" | "error";

export default function App() {
  const { ready, lineUserId, error } = useLiff();
  const [screen, setScreen] = useState<Screen>("form");
  const [apiError, setApiError] = useState<string | null>(null);

  if (error) return <ErrorScreen message={error} />;
  if (!ready) return <div className="flex items-center justify-center min-h-screen">กำลังโหลด...</div>;
  if (screen === "success") return <SuccessScreen />;
  if (screen === "error") return <ErrorScreen message={apiError ?? "เกิดข้อผิดพลาด"} />;

  return (
    <PaymentForm
      lineUserId={lineUserId!}
      onSuccess={() => setScreen("success")}
      onError={(msg) => { setApiError(msg); setScreen("error"); }}
    />
  );
}
```

---

### Payment Form with Validation (`pawn-liff/src/components/PaymentForm.tsx`)

Use `react-hook-form` + `zod`. Note the custom validator for FileList — zod has no built-in File type:

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/heic"];

const schema = z.object({
  query: z.string().min(1, "กรุณากรอกรหัสผ่อนหรือเบอร์โทร"),
  amount: z.string().min(1, "กรุณากรอกยอดโอน")
    .refine((v) => !isNaN(Number(v)) && Number(v) > 0, "ยอดโอนต้องมากกว่า 0"),
  slip: z.instanceof(FileList)
    .refine((f) => f.length > 0, "กรุณาแนบสลิปการโอนเงิน")
    .refine((f) => f[0]?.size <= MAX_FILE_SIZE, "ไฟล์ใหญ่เกินไป กรุณาใช้ไฟล์ขนาดไม่เกิน 5MB")
    .refine((f) => ACCEPTED_TYPES.includes(f[0]?.type), "รองรับเฉพาะไฟล์ jpg, png, heic เท่านั้น"),
});

type FormValues = z.infer<typeof schema>;

export function PaymentForm({ lineUserId, onSuccess, onError }: {
  lineUserId: string; onSuccess: () => void; onError: (msg: string) => void;
}) {
  const { register, handleSubmit, formState: { errors, isSubmitting, isValid } } =
    useForm<FormValues>({ resolver: zodResolver(schema), mode: "onChange" });

  async function onSubmit(data: FormValues) {
    const formData = new FormData();
    const isPhone = /^\d{9,10}$/.test(data.query.replace(/[-\s]/g, ""));
    formData.append(isPhone ? "phone" : "installmentCode", data.query.replace(/[-\s]/g, ""));
    formData.append("amount", data.amount);
    formData.append("slip", data.slip[0]);
    formData.append("lineUserId", lineUserId);

    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/payments`, {
      method: "POST", body: formData,
    });

    if (res.ok) {
      onSuccess();
    } else {
      const body = await res.json().catch(() => ({ error: "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง" }));
      onError(body.error ?? "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    }
  }

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-xl font-semibold mb-6">แจ้งชำระเงินงวด</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">รหัสผ่อน หรือ เบอร์โทร</label>
          <input {...register("query")} className="w-full border rounded-lg px-3 py-2" placeholder="P001 หรือ 0812345678" />
          {errors.query && <p className="text-red-500 text-sm mt-1">{errors.query.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">ยอดโอน (บาท)</label>
          <input {...register("amount")} type="number" inputMode="decimal" step="0.01" className="w-full border rounded-lg px-3 py-2" placeholder="2000" />
          {errors.amount && <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">แนบสลิปการโอนเงิน</label>
          <input {...register("slip")} type="file" accept="image/jpeg,image/png,image/heic" className="w-full" />
          {errors.slip && <p className="text-red-500 text-sm mt-1">{errors.slip.message as string}</p>}
        </div>
        <button type="submit" disabled={!isValid || isSubmitting}
          className="w-full py-3 rounded-lg text-white font-semibold disabled:opacity-50"
          style={{ backgroundColor: "#00B900" }}>
          {isSubmitting ? "กำลังส่งข้อมูล..." : "ยืนยันการชำระ"}
        </button>
      </form>
    </div>
  );
}
```

---

### LINE Webhook Handler (`pawn-api/src/routes/webhook.ts`)

Two critical rules: verify signature first, return `200 OK` before any async work:

```ts
import { Hono } from "hono";
import { validateSignature, messagingApi } from "@line/bot-sdk";
import { lookupCustomerByLineUserId } from "../services/customers";
import { buildBalanceFlex } from "../services/flexMessages";

const lineClient = new messagingApi.MessagingApiClient({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN!,
});

export const webhookRoute = new Hono().post("/webhook/line", async (c) => {
  const signature = c.req.header("x-line-signature") ?? "";
  const rawBody = await c.req.text(); // must read as text for signature verification

  if (!validateSignature(rawBody, process.env.LINE_CHANNEL_SECRET!, signature)) {
    return c.text("Unauthorized", 400);
  }

  const body = JSON.parse(rawBody);

  // Return 200 IMMEDIATELY — process events after
  void (async () => {
    for (const event of body.events ?? []) {
      try { await handleEvent(event); }
      catch (err) { console.error("Webhook event error:", err); }
    }
  })();

  return c.text("OK", 200);
});

async function handleEvent(event: any) {
  if (event.type !== "postback") return;
  const lineUserId = event.source?.userId;
  if (!lineUserId) return;

  switch (event.postback.data) {
    case "check_balance": {
      const customer = lookupCustomerByLineUserId(lineUserId);
      if (!customer) {
        await lineClient.replyMessage({ replyToken: event.replyToken,
          messages: [{ type: "text", text: "ไม่พบข้อมูลการผ่อน กรุณาติดต่อร้าน" }] });
        return;
      }
      await lineClient.replyMessage({ replyToken: event.replyToken,
        messages: [buildBalanceFlex(customer)] });
      break;
    }
    case "contact_staff": {
      await lineClient.replyMessage({ replyToken: event.replyToken,
        messages: [{ type: "text", text: "ติดต่อร้านได้ที่ โทร 02-XXX-XXXX\nวันจันทร์–เสาร์ 09:00–18:00" }] });
      break;
    }
  }
}
```

---

### Payment Submission Route (`pawn-api/src/routes/payments.ts`)

Parse `multipart/form-data` with `c.req.formData()` — never `c.req.json()` for file uploads:

```ts
import { Hono } from "hono";
import { z } from "zod";
import { lookupCustomer } from "../services/customers";
import { addPayment } from "../services/payments";
import { randomUUID } from "crypto";

const submitSchema = z.object({
  amount: z.string().refine((v) => !isNaN(Number(v)) && Number(v) > 0, "ยอดโอนต้องมากกว่า 0"),
  lineUserId: z.string().min(1),
}).and(z.union([
  z.object({ installmentCode: z.string().min(1), phone: z.string().optional() }),
  z.object({ phone: z.string().min(9), installmentCode: z.string().optional() }),
]));

export const paymentsRoute = new Hono().post("/payments", async (c) => {
  const formData = await c.req.formData(); // NOT c.req.json() — file upload
  const raw = {
    installmentCode: formData.get("installmentCode") as string | null,
    phone: formData.get("phone") as string | null,
    amount: formData.get("amount") as string,
    lineUserId: formData.get("lineUserId") as string,
  };
  const slip = formData.get("slip") as File | null;

  if (!slip || slip.size === 0) return c.json({ error: "กรุณาแนบสลิปการโอนเงิน" }, 400);
  if (slip.size > 5 * 1024 * 1024) return c.json({ error: "ไฟล์ใหญ่เกินไป กรุณาใช้ไฟล์ขนาดไม่เกิน 5MB" }, 400);
  if (!["image/jpeg", "image/png", "image/heic"].includes(slip.type))
    return c.json({ error: "รองรับเฉพาะไฟล์ jpg, png, heic เท่านั้น" }, 400);

  const parsed = submitSchema.safeParse(raw);
  if (!parsed.success) return c.json({ error: parsed.error.errors[0].message }, 400);

  const query = raw.installmentCode || raw.phone!;
  const customer = lookupCustomer(query);
  if (!customer) return c.json({ error: "ไม่พบข้อมูล กรุณาตรวจสอบรหัสผ่อนหรือเบอร์โทร" }, 404);
  if (customer.remainingBalance <= 0) return c.json({ error: "ไม่พบยอดค้างชำระ กรุณาติดต่อร้าน" }, 400);

  // Stub slip upload — Phase 3 replaces this with real R2 upload
  const slipUrl = `https://r2.example.com/slips/${randomUUID()}.jpg`;

  const payment = addPayment({ customerId: customer.id, amount: Number(raw.amount), slipUrl, lineUserId: raw.lineUserId });

  return c.json({ paymentId: payment.id, status: payment.status, message: "ส่งข้อมูลสำเร็จ รอพนักงานตรวจสอบสลิป" }, 201);
});
```

---

### Customer Service (`pawn-api/src/services/customers.ts`)

Encapsulate all mock data access here. Phase 2 calls `updateCustomer()` — define it now:

```ts
import customersData from "../mock/customers.json";
import type { Customer } from "../types";

const customers: Customer[] = customersData as Customer[];

export function lookupCustomer(query: string): Customer | undefined {
  const normalized = query.replace(/[-\s]/g, "").toLowerCase();
  const byCode = customers.find(
    (c) => c.installmentCode.toLowerCase() === normalized && c.status === "active"
  );
  if (byCode) return byCode;
  const byPhone = customers.filter(
    (c) => c.phone.replace(/[-\s]/g, "") === normalized && c.status === "active"
  );
  return byPhone.at(-1); // most recent active contract if multiple
}

export function lookupCustomerByLineUserId(lineUserId: string): Customer | undefined {
  return customers.find((c) => c.lineUserId === lineUserId && c.status === "active");
}

export function findCustomerById(id: string): Customer | undefined {
  return customers.find((c) => c.id === id);
}

export function getAllCustomers(): Customer[] {
  return customers;
}

// Phase 2 calls this — do not implement balance logic here, let Phase 2 own it
export function updateCustomer(id: string, patch: Partial<Customer>): Customer {
  const idx = customers.findIndex((c) => c.id === id);
  if (idx === -1) throw new Error(`Customer ${id} not found`);
  customers[idx] = { ...customers[idx], ...patch };
  return customers[idx];
}
```

---

### Payment Service (`pawn-api/src/services/payments.ts`)

Phase 1 implements `addPayment`. Phase 2 stubs are defined but throw — prevents accidental early implementation:

```ts
import paymentsData from "../mock/payments.json";
import type { Payment } from "../types";
import { randomUUID } from "crypto";

const payments: Payment[] = paymentsData as Payment[];

export function addPayment(input: {
  customerId: string; amount: number; slipUrl: string; lineUserId: string;
}): Payment {
  const payment: Payment = {
    id: `pay_${randomUUID().slice(0, 8)}`,
    ...input,
    submittedAt: new Date().toISOString(),
    confirmedAt: null,
    confirmedBy: null,
    status: "pending_verification",
    rejectionReason: null,
  };
  payments.push(payment);
  return payment;
}

export function getPaymentById(id: string): Payment | undefined {
  return payments.find((p) => p.id === id);
}

export function getAllPayments(): Payment[] {
  return payments;
}

// Phase 2 implements these — do NOT implement in Phase 1
export function confirmPayment(_id: string, _employeeId: string): Payment {
  throw new Error("Not implemented — Phase 2");
}

export function rejectPayment(_id: string, _employeeId: string, _reason: string): Payment {
  throw new Error("Not implemented — Phase 2");
}
```

---

### Flex Message Builders (`pawn-api/src/services/flexMessages.ts`)

Export both builders. `buildPaymentConfirmFlex` is called by Phase 2 — keep signature stable:

```ts
import type { FlexMessage } from "@line/bot-sdk";
import type { Customer, Payment } from "../types";

export function buildPaymentConfirmFlex(payment: Payment, customer: Customer): FlexMessage {
  return {
    type: "flex",
    altText: `ชำระเงินสำเร็จ ฿${payment.amount.toLocaleString("th-TH")}`,
    contents: {
      type: "bubble",
      header: {
        type: "box", layout: "vertical", backgroundColor: "#00B900",
        contents: [{ type: "text", text: "✅ ชำระเงินสำเร็จ", color: "#FFFFFF", weight: "bold", size: "xl" }],
      },
      body: {
        type: "box", layout: "vertical", spacing: "md",
        contents: [
          { type: "text", text: `รหัสผ่อน: ${customer.installmentCode}`, color: "#555555", size: "sm" },
          { type: "separator" },
          { type: "box", layout: "horizontal", contents: [
            { type: "text", text: "ยอดชำระ", color: "#555555", flex: 2 },
            { type: "text", text: `฿${payment.amount.toLocaleString("th-TH")}`, weight: "bold", size: "lg", flex: 3, align: "end" },
          ]},
          { type: "box", layout: "horizontal", contents: [
            { type: "text", text: "วันที่ชำระ", color: "#555555", flex: 2 },
            { type: "text", text: new Date(payment.confirmedAt!).toLocaleDateString("th-TH"), flex: 3, align: "end" },
          ]},
          { type: "separator" },
          { type: "box", layout: "horizontal", contents: [
            { type: "text", text: "ยอดคงเหลือ", color: "#555555", flex: 2 },
            { type: "text", text: `฿${customer.remainingBalance.toLocaleString("th-TH")}`, color: "#E74C3C", weight: "bold", flex: 3, align: "end" },
          ]},
          { type: "box", layout: "horizontal", contents: [
            { type: "text", text: "งวดถัดไป", color: "#555555", flex: 2 },
            { type: "text", text: new Date(customer.nextDueDate).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" }), color: "#888888", size: "sm", flex: 3, align: "end" },
          ]},
        ],
      },
    },
  };
}

export function buildBalanceFlex(customer: Customer): FlexMessage {
  const remaining = customer.installmentMonths - customer.paidMonths;
  return {
    type: "flex",
    altText: `ยอดคงเหลือ ฿${customer.remainingBalance.toLocaleString("th-TH")}`,
    contents: {
      type: "bubble",
      header: {
        type: "box", layout: "vertical", backgroundColor: "#1A73E8",
        contents: [{ type: "text", text: "💰 ยอดคงเหลือ", color: "#FFFFFF", weight: "bold", size: "lg" }],
      },
      body: {
        type: "box", layout: "vertical", spacing: "md",
        contents: [
          { type: "text", text: `฿${customer.remainingBalance.toLocaleString("th-TH")}`, size: "xxl", weight: "bold", align: "center", color: "#1A73E8" },
          { type: "separator" },
          { type: "text", text: `เหลืออีก ${remaining} งวด`, align: "center", color: "#555555" },
          { type: "text", text: `กำหนดชำระ: ${new Date(customer.nextDueDate).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}`, align: "center", color: "#888888", size: "sm" },
        ],
      },
    },
  };
}
```

---

### Shared Types + App Entry

```ts
// pawn-api/src/types.ts
export interface Customer {
  id: string;
  installmentCode: string;
  name: string;
  phone: string;
  lineUserId: string;
  productName: string;
  totalAmount: number;
  remainingBalance: number;
  installmentMonths: number;
  paidMonths: number;
  nextDueDate: string;       // "2025-06-01"
  status: "active" | "completed" | "overdue";
}

export interface Payment {
  id: string;
  customerId: string;
  amount: number;
  slipUrl: string;
  lineUserId: string;
  submittedAt: string;
  confirmedAt: string | null;
  confirmedBy: string | null;
  status: "pending_verification" | "confirmed" | "rejected";
  rejectionReason: string | null;
}
```

```ts
// pawn-api/src/index.ts
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { paymentsRoute } from "./routes/payments";
import { webhookRoute } from "./routes/webhook";

const app = new Hono();
app.use("*", logger());
app.use("*", cors()); // open for demo — tighten in Phase 3
app.get("/health", (c) => c.json({ ok: true }));
app.route("/api", paymentsRoute);
app.route("/api", webhookRoute);

export default { port: process.env.PORT ?? 3001, fetch: app.fetch };
```

---

## DOCUMENTATION:

| What | URL |
|---|---|
| LIFF SDK overview | https://developers.line.biz/en/docs/liff/overview/ |
| `liff.init()` reference | https://developers.line.biz/en/reference/liff/#initialize-liff-app |
| `liff.getProfile()` | https://developers.line.biz/en/reference/liff/#get-profile |
| `liff.closeWindow()` | https://developers.line.biz/en/reference/liff/#close-window |
| LINE Messaging API reference | https://developers.line.biz/en/reference/messaging-api/ |
| Flex Message overview | https://developers.line.biz/en/docs/messaging-api/using-flex-messages/ |
| Flex Message Simulator | https://developers.line.biz/flex-simulator/ |
| LINE bot-sdk-nodejs (v8) | https://line.github.io/line-bot-sdk-nodejs/ |
| Webhook signature verification | https://developers.line.biz/en/docs/messaging-api/receiving-messages/#verifying-signatures |
| Rich Menu docs | https://developers.line.biz/en/docs/messaging-api/using-rich-menus/ |
| Hono.js docs | https://hono.dev/docs/ |
| Hono `c.req.formData()` | https://hono.dev/docs/api/request#formdata |
| react-hook-form | https://react-hook-form.com/docs |
| zod | https://zod.dev |
| Vite env variables | https://vitejs.dev/guide/env-and-mode |

---

## OTHER CONSIDERATIONS:

### LIFF Gotchas

**`import.meta.env.VITE_LIFF_ID` — not `process.env`.**
pawn-liff is Vite. Any env var not prefixed with `VITE_` is silently `undefined` at runtime. No error, no warning — the app just breaks in a confusing way.

**`liff.login()` redirects the entire page — code after it does not run.**
Do not put cleanup logic or state updates after `liff.login()`. The `useLiff` hook above handles this correctly — do not inline LIFF calls outside the hook.

**`liff.getProfile()` throws if called before `liff.init()` resolves or when not logged in.**
Always gate behind `liff.isLoggedIn()`. Never call it at the top level of a component.

**LIFF requires HTTPS — `liff.init()` throws on `http://` including localhost.**
Use `ngrok` or Cloudflare Tunnel during local development. Register the HTTPS URL in LINE Developers Console → LIFF → Endpoint URL. Update every time ngrok restarts (or use a paid static domain).

**File input `accept="image/heic"` may not show in file picker on Android.**
This is a browser limitation, not a bug. Keep it anyway — HEIC files shared from iOS Camera Roll still pass through. Do not remove it.

### LINE Webhook Gotchas

**Webhook must return `200 OK` within 1 second or LINE will retry.**
Use the fire-and-forget void IIFE pattern shown in the example. Never `await` event processing before returning the response.

**`replyToken` expires in 30 seconds.**
`check_balance` is an immediate response — `replyToken` is fine. `buildPaymentConfirmFlex` (Phase 2) must use `lineClient.pushMessage(lineUserId, ...)` because the employee confirms minutes or hours later. Mixing up reply vs push is the most common Phase 2 bug.

**`rawBody` must be read as `c.req.text()` — not `c.req.json()` — before `validateSignature`.**
LINE signs the raw bytes. Parsing to JSON first changes the string (whitespace, key order) and breaks signature verification.

### Multipart / File Upload Gotchas

**Use `c.req.formData()` for endpoints with file uploads — not `c.req.json()`.**
`c.req.json()` will throw or silently return empty on multipart requests.

**`slip.type` from FormData can be spoofed by the client.**
For Phase 1 demo, this is acceptable. Phase 3 production should read the first 4 bytes (magic bytes) to verify MIME type. Do not add this complexity now.

**`File` from `formData.get("slip")` is a Web API `File`, not a Node.js `Buffer`.**
Use `await slip.arrayBuffer()` to read bytes. Bun supports the Web File API natively.

### Mock Data Gotchas

**Do not import mock JSON inside route handlers — always go through service layer.**
Phase 2 adds `confirmPayment()` and `updateCustomer()` to the services. If routes import the JSON arrays directly, Phase 2 cannot update them atomically.

**`confirmPayment()` and `rejectPayment()` throw `"Not implemented — Phase 2"` intentionally.**
Do not implement them. Do not delete them. The stubs are contracts that Phase 2 fulfills.

### Phase 2 / Phase 3 Forward Compatibility

**Do not change these — Phase 2 depends on them directly:**

- `Payment.status` values: `"pending_verification" | "confirmed" | "rejected"` — Phase 2 filters queue by `"pending_verification"` and transitions to the other two
- `Payment.confirmedAt` and `Payment.confirmedBy` must exist as `null` in Phase 1 records — Phase 2 sets them on confirm
- `buildPaymentConfirmFlex(payment, customer)` — Phase 2 calls this after updating `customer.remainingBalance`; the function reads `payment.confirmedAt` and `customer.remainingBalance` at call time, both must be already updated before calling
- `updateCustomer(id, patch)` exported from `customers.ts` — Phase 2 calls this to deduct balance and increment `paidMonths`
- `getAllPayments()` exported from `payments.ts` — Phase 2 uses it for the queue; Phase 3 uses it for reports
- `getAllCustomers()` exported from `customers.ts` — Phase 2 uses it for the customer list and dashboard stats

**Phase 3 replaces only the slip upload stub.**
The fake URL `https://r2.example.com/slips/{uuid}.jpg` is isolated inside `payments.ts → addPayment()`. Phase 3 replaces that one line with a real R2 upload call. Do not spread the stub URL logic into other files.

**CORS is wide open for demo.**
`app.use("*", cors())` with no origin restriction. Phase 3 will restrict this to specific origins. Do not hardcode `*` in any other place.