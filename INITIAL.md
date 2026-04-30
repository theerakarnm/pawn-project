## FEATURE:

ระบบผ่อนมือถือเชื่อม LINE OA (Mobile Installment Payment System with LINE OA Integration)

A full-stack installment payment management system consisting of two surfaces:

**LINE OA (Customer-facing)**
1. Customer opens Rich Menu in LINE and taps "แจ้งชำระ" (Report Payment)
2. LIFF WebView opens — customer fills in installment code OR phone number, transfer amount, and uploads a slip image
3. System looks up the customer record by phone number or installment code
4. Payment is saved with status `pending_verification` — balance is NOT deducted yet
5. Employee reviews the slip in the Admin Web and clicks "ยืนยัน" (Confirm)
6. On confirmation: balance is deducted automatically and a Flex Message is sent back to the customer's LINE with the amount paid and remaining balance

**Admin Web (Staff-facing, desktop browser)**
7. Dashboard: total customers, overdue count, today's receipts, monthly receipts, weekly bar chart
8. Customer list: searchable by name/phone, filterable by status (all / paid / overdue / due-soon)
9. Customer profile: installment progress bar, full payment history timeline, slip thumbnails (click to enlarge)
10. Slip verification queue: pending slips waiting for employee confirmation before balance is cut
11. Reports: monthly summary table + bar chart, exportable to Excel/CSV

---

## EXAMPLES:

All example files live in `examples/`. Reference them when implementing the corresponding module.

### `examples/liff-form.tsx`
A Next.js client component for the LIFF payment form. Demonstrates:
- `@line/liff` SDK initialization inside `useEffect` with `liff.init({ liffId })` — must guard against SSR (use `"use client"` and check `typeof window !== "undefined"`)
- Getting the LINE User ID for the request: `liff.getProfile()` returns `{ userId, displayName }` — attach `userId` to the form payload
- File input for slip upload: accept `image/jpeg,image/png`, max 5 MB client-side guard before upload
- Form validation with `zod` — all fields required, amount must be a positive number
- `fetch` POST to `/api/payments` with `multipart/form-data` (use `FormData`, not JSON, when slip is included)
- Loading / success / error states — show LINE-styled success card on success, never redirect out of LIFF

```tsx
"use client";
import liff from "@line/liff";
import { useEffect, useState } from "react";

export default function PaymentForm() {
  const [lineUserId, setLineUserId] = useState<string | null>(null);

  useEffect(() => {
    liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! }).then(async () => {
      if (!liff.isLoggedIn()) liff.login();
      const profile = await liff.getProfile();
      setLineUserId(profile.userId);
    });
  }, []);

  async function handleSubmit(formData: FormData) {
    formData.append("lineUserId", lineUserId!);
    const res = await fetch("/api/payments", { method: "POST", body: formData });
    // handle res...
  }
  // ...
}
```

---

### `examples/line-webhook.ts`
Hono.js route handler for LINE Messaging API webhooks. Demonstrates:
- Signature verification with `@line/bot-sdk`: `validateSignature(rawBody, channelSecret, signature)` — MUST verify before processing; return 400 if invalid
- Parsing `events[]` array — filter for `type === "message"` and `type === "postback"`
- Replying with `client.replyMessage(replyToken, messages)` — replyToken expires in 30 seconds, do not await DB operations before calling reply
- Quick Reply buttons for Rich Menu fallback

```ts
import { Hono } from "hono";
import { validateSignature, Client } from "@line/bot-sdk";

const lineClient = new Client({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN!,
});

export const webhookRoute = new Hono().post("/webhook", async (c) => {
  const signature = c.req.header("x-line-signature") ?? "";
  const rawBody = await c.req.text();

  if (!validateSignature(rawBody, process.env.LINE_CHANNEL_SECRET!, signature)) {
    return c.text("Unauthorized", 400);
  }

  const body = JSON.parse(rawBody);
  for (const event of body.events) {
    if (event.type === "postback" && event.postback.data === "check_balance") {
      // handle balance check
    }
  }
  return c.text("OK");
});
```

---

### `examples/flex-message.ts`
Builder function for the payment confirmation Flex Message. Demonstrates:
- Flex Message structure: `{ type: "flex", altText, contents: { type: "bubble", ... } }`
- Header with LINE green background (`#00B900`), body with payment details, footer with remaining balance
- Text color contrast rules — use `#FFFFFF` on green, `#333333` on white
- `push` vs `reply`: use `client.pushMessage(userId, message)` when sending AFTER async DB operations (reply token is expired by then); use `replyMessage` only for instant responses

```ts
export function buildPaymentConfirmFlex(params: {
  amount: number;
  remainingBalance: number;
  nextDueDate: string;
  installmentCode: string;
}): FlexMessage {
  return {
    type: "flex",
    altText: `ชำระเงินสำเร็จ ฿${params.amount.toLocaleString()}`,
    contents: {
      type: "bubble",
      header: {
        type: "box", layout: "vertical",
        backgroundColor: "#00B900",
        contents: [{ type: "text", text: "ชำระเงินสำเร็จ", color: "#FFFFFF", weight: "bold", size: "xl" }]
      },
      body: {
        type: "box", layout: "vertical", spacing: "md",
        contents: [
          { type: "text", text: `รหัสผ่อน: ${params.installmentCode}`, color: "#555555" },
          { type: "text", text: `ยอดชำระ: ฿${params.amount.toLocaleString()}`, weight: "bold", size: "lg" },
          { type: "text", text: `ยอดคงเหลือ: ฿${params.remainingBalance.toLocaleString()}`, color: "#E74C3C" },
          { type: "text", text: `งวดถัดไป: ${params.nextDueDate}`, color: "#888888", size: "sm" },
        ]
      }
    }
  };
}
```

---

### `examples/payment-service.ts`
Business logic layer. Demonstrates the two-step payment flow:

**Step 1 — Submit (customer):** Save payment with `status: "pending_verification"`, store slip URL, do NOT touch `remaining_balance`

**Step 2 — Confirm (employee):** Wrap in a DB transaction — deduct balance, mark payment `status: "confirmed"`, then call LINE push message. If LINE push fails, still commit the DB transaction (payment is real); log the error separately.

```ts
// Step 2: employee confirms slip
async function confirmPayment(paymentId: string, employeeId: string) {
  await db.transaction(async (tx) => {
    const payment = await tx.query.payments.findFirst({ where: eq(payments.id, paymentId) });
    if (!payment || payment.status !== "pending_verification") throw new Error("Invalid payment");

    // deduct balance
    await tx.update(customers)
      .set({ remainingBalance: sql`remaining_balance - ${payment.amount}` })
      .where(eq(customers.id, payment.customerId));

    // mark confirmed
    await tx.update(payments)
      .set({ status: "confirmed", confirmedBy: employeeId, confirmedAt: new Date() })
      .where(eq(payments.id, paymentId));
  });

  // push LINE message AFTER tx commits — if this fails, log only
  try {
    await pushPaymentConfirmMessage(payment.lineUserId, payment);
  } catch (err) {
    console.error("LINE push failed after confirm:", err);
  }
}
```

---

### `examples/admin-slip-queue.tsx`
Admin React component for the pending slip verification queue. Demonstrates:
- Optimistic UI: mark slip as confirmed in local state immediately, rollback on API error
- Slip lightbox: clicking thumbnail opens full-size image in an overlay (`min-height: 400px` wrapper, not `position: fixed`)
- Keyboard shortcut: `Enter` to confirm, `Escape` to close lightbox

---

## DOCUMENTATION:

| Resource | URL |
|---|---|
| LINE Messaging API reference | https://developers.line.biz/en/reference/messaging-api/ |
| LINE Flex Message simulator | https://developers.line.biz/flex-simulator/ |
| LIFF SDK docs | https://developers.line.biz/en/docs/liff/overview/ |
| LIFF `liff.init()` reference | https://developers.line.biz/en/reference/liff/#initialize-liff-app |
| LINE Bot SDK for Node.js | https://github.com/line/line-bot-sdk-nodejs |
| Next.js 14 App Router docs | https://nextjs.org/docs/app |
| Next.js Route Handlers | https://nextjs.org/docs/app/building-your-application/routing/route-handlers |
| Drizzle ORM docs | https://orm.drizzle.team/docs/overview |
| Drizzle transactions | https://orm.drizzle.team/docs/transactions |
| Hono.js docs | https://hono.dev/docs/ |
| Cloudflare R2 S3-compatible API | https://developers.cloudflare.com/r2/api/s3/api/ |
| Bun runtime docs | https://bun.sh/docs |

---

## OTHER CONSIDERATIONS:

### LINE / LIFF Gotchas

**LIFF requires HTTPS — always.** `liff.init()` will throw on `http://` origins, including `localhost`. During development use `ngrok` or Cloudflare Tunnel to get an HTTPS URL, then register it in LINE Developers Console under LIFF → Endpoint URL.

**`liff.getProfile()` only works after `liff.isLoggedIn()` is true.** Always call `liff.login()` first if not logged in. Do not assume the user is logged in just because the LIFF app opened.

**replyToken expires in 30 seconds.** Never `await` a database write or external call before calling `client.replyMessage()`. For the payment confirmation flow (which is async — employee confirms later), always use `client.pushMessage(lineUserId, ...)` instead.

**LINE webhook must return HTTP 200 within 1 second.** Process events asynchronously — acknowledge the webhook immediately, queue the heavy work (DB lookups, image processing) to run after the response is sent.

**Signature verification is not optional.** Always call `validateSignature()` on every incoming webhook. Without it, anyone can POST fake events to your endpoint.

**Rich Menu image dimensions are strict.** LINE requires exactly one of the predefined sizes (e.g. 2500×1686 px for full-width). Wrong dimensions cause the Rich Menu to silently fail to display.

---

### Payment Flow Gotchas

**Never deduct balance at submission time.** Balance must only be deducted in Step 2 (employee confirmation), inside a DB transaction. If you deduct on submit and the slip turns out to be invalid, you have no clean rollback.

**Slip image must be stored before confirmation.** Upload the slip to Cloudflare R2 at submission time and store the URL in the `payments` table. Do not rely on LINE's image URL — LINE image URLs expire.

**Idempotency on confirmation.** The confirm endpoint must check `payment.status === "pending_verification"` before proceeding. A double-click or retry must not deduct balance twice. Use a DB-level unique constraint or optimistic locking.

**Remaining balance can reach zero but should not go negative.** Add a DB check constraint: `remaining_balance >= 0`. Also validate server-side that `payment.amount <= customer.remainingBalance` before confirming.

---

### Database / Drizzle Gotchas

**Always use transactions for the confirm step.** The balance deduction + status update must be atomic. A partial failure (e.g. balance deducted but status not updated) will corrupt the ledger silently.

**Use `sql` tagged template for arithmetic updates** to avoid race conditions:
```ts
// CORRECT — atomic SQL update
.set({ remainingBalance: sql`remaining_balance - ${amount}` })

// WRONG — read-modify-write race condition
.set({ remainingBalance: customer.remainingBalance - amount })
```

**Index columns used for search:** Add indexes on `customers.phone`, `customers.installment_code`, `payments.status`, and `payments.customer_id`. Without them, the admin search over 1,000 customers will do a full table scan.

---

### File Upload Gotchas

**Validate file type server-side, not just client-side.** Check the MIME type from the file buffer (magic bytes), not from the `Content-Type` header or filename extension — these can be spoofed.

**Generate a unique R2 key per upload.** Use `crypto.randomUUID()` as the filename prefix. Never trust the original filename from the user.

**Multipart form data in Hono.js:** Use `c.req.formData()` to parse — do NOT use `c.req.json()` for endpoints that receive file uploads.

---

### Admin / Reporting Gotchas

**Report queries should use date range filters with indexes.** Monthly reports that scan all `payments` rows will be slow as data grows. Always filter with `WHERE confirmed_at >= :start AND confirmed_at < :end` and ensure `confirmed_at` is indexed.

**Export to Excel:** Use `exceljs` (not `xlsx` / SheetJS) for server-side generation — it produces cleaner output and handles Thai characters in column headers without encoding issues.

**Admin web is desktop-only for this project.** Do not spend time on mobile responsive for Admin pages — only the LIFF form (customer-facing) needs to be mobile-first.

---

### Tech Stack Summary

```
Runtime:     Bun
Backend:     Hono.js (API server + LINE webhook)
Frontend:    Next.js 14 App Router (Admin web), Vite + React (LIFF)
Database:    PostgreSQL + Drizzle ORM
Storage:     Cloudflare R2 (slip images)
LINE:        Messaging API + LIFF
Deploy:      DigitalOcean Droplet, Docker Compose, Nginx reverse proxy
```