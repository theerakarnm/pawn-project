# PRP: PAWN Phase 1 — LINE OA & Payment Submission System

## Confidence Score: 9/10

---

## Goal

Complete Phase 1 of the PAWN installment payment system. The codebase skeleton exists but has **critical bugs and missing features** that prevent end-to-end operation. This PRP identifies every gap and specifies exactly what to implement.

---

## Why

- LINE OA Rich Menu must route customers to LIFF and webhook handlers
- LIFF payment form is broken (installmentCode lookup never finds a customer)
- Webhook handles `check_balance` with plain text instead of Flex Message
- `contact_staff` postback is silently dropped (no handler)
- Demo requires seed data so DB has records to test against
- `ErrorScreen` component referenced in PRD design is absent

---

## What (Current State vs Target)

### Bugs (blocking — nothing works without fixing these first)

| # | Location | Bug |
|---|----------|-----|
| 1 | `pawn-liff/src/components/PaymentForm.tsx:47` | Sends `customerId` with installmentCode VALUE (e.g. "P001"), but service queries `customers.id` (UUID) → always 404 |
| 2 | `pawn-api/src/routes/payments.ts:40` | No lookup by `installmentCode` column — only `customers.id` (UUID) or `phone` |
| 3 | `pawn-api/src/routes/webhook.ts:48` | `check_balance` uses `pushMessage` + plain text, not `replyMessage` + Flex |

### Missing Features

| # | Location | Missing |
|---|----------|---------|
| 4 | `pawn-api/src/lib/line.ts` | `buildBalanceFlex()` function |
| 5 | `pawn-api/src/routes/webhook.ts` | `contact_staff` postback handler |
| 6 | `pawn-liff/src/components/` | `ErrorScreen` component |
| 7 | `pawn-liff/src/components/PaymentForm.tsx` | HEIC in `accept`, `isValid` disables button, MIME type Zod validation |
| 8 | `pawn-api/src/db/seed.ts` | Seed script — 20 customers + 15 payments for demo |

---

## All Needed Context

### Documentation References

```yaml
- url: https://developers.line.biz/en/reference/liff/#initialize-liff-app
  why: liff.init() must complete before any liff.* call; login() redirects — nothing after it runs

- url: https://developers.line.biz/en/docs/messaging-api/receiving-messages/#verifying-signatures
  why: rawBody must be c.req.text() — NOT parsed JSON — before validateSignature()

- url: https://developers.line.biz/en/docs/messaging-api/using-flex-messages/
  why: Flex Message schema for buildBalanceFlex bubble structure

- url: https://developers.line.biz/flex-simulator/
  why: Test Flex Message JSON visually before committing

- url: https://hono.dev/docs/api/request#formdata
  why: c.req.formData() — NOT c.req.json() — for multipart file uploads

- url: https://react-hook-form.com/docs
  why: formState.isValid requires mode: "onChange" to update on every keystroke
```

### Current Codebase Tree (source files only)

```
apps/
├── pawn-api/
│   └── src/
│       ├── db/
│       │   ├── index.ts          # drizzle({ connection: DATABASE_URL, schema })
│       │   └── schema.ts         # customers + payments pgTable definitions
│       ├── lib/
│       │   ├── line.ts           # lineClient, buildPaymentConfirmFlex — MISSING buildBalanceFlex
│       │   └── r2.ts             # uploadSlip(buffer) → R2 URL (magic-byte MIME detection)
│       ├── routes/
│       │   ├── customers.ts      # GET /, GET /by-line/:lineUserId, GET /:id, POST /, PATCH /:id
│       │   ├── dashboard.ts      # GET /
│       │   ├── payments.ts       # POST /, GET /, POST /:id/confirm, POST /:id/reject
│       │   ├── reports.ts        # GET /
│       │   └── webhook.ts        # POST /webhook — MISSING contact_staff, BROKEN check_balance
│       ├── services/
│       │   ├── customer.service.ts   # listCustomers, getCustomer, createCustomer, updateCustomer, findByLineUserId
│       │   ├── dashboard.service.ts
│       │   ├── payment.service.ts    # submitPayment, confirmPayment, rejectPayment, listPendingPayments
│       │   └── report.service.ts
│       └── index.ts              # Hono app, routes mounted
│
└── pawn-liff/
    └── src/
        ├── components/
        │   ├── BalanceScreen.tsx  # ✅ complete
        │   ├── PaymentForm.tsx    # BROKEN: sends wrong field, missing HEIC, no isValid
        │   └── SuccessScreen.tsx  # ✅ complete
        ├── hooks/
        │   └── useLiff.ts         # ✅ complete
        ├── App.tsx                # 3-screen state machine — MISSING ErrorScreen wiring
        └── main.tsx
```

### Desired File Changes

```
MODIFY  pawn-api/src/lib/line.ts          — add buildBalanceFlex()
MODIFY  pawn-api/src/routes/webhook.ts    — add contact_staff, fix check_balance
MODIFY  pawn-api/src/routes/payments.ts   — add installmentCode field handling
MODIFY  pawn-api/src/services/payment.service.ts — add installmentCode lookup + phone normalization
CREATE  pawn-api/src/db/seed.ts           — 20 customers + 15 payments
MODIFY  pawn-liff/src/components/PaymentForm.tsx — fix field name, HEIC, isValid
CREATE  pawn-liff/src/components/ErrorScreen.tsx  — error display component
MODIFY  pawn-liff/src/App.tsx             — wire ErrorScreen
```

### Schema Reference (do not change)

```ts
// customers columns relevant to Phase 1:
id: uuid (PK)
installmentCode: varchar(50) UNIQUE — e.g. "P001"
name: varchar(100)
phone: varchar(20)                   — stored without normalization
lineUserId: varchar(100)
remainingBalance: decimal(12,2)
totalInstallments: integer
paidInstallments: integer
status: 'active' | 'paid' | 'overdue' | 'due_soon'
dueDate: date                        — "YYYY-MM-DD"

// payments columns:
id: uuid (PK)
customerId: uuid FK → customers.id
lineUserId: varchar(100)
amount: decimal(12,2)
slipUrl: varchar(500)
status: 'pending_verification' | 'confirmed' | 'rejected'
confirmedBy/confirmedAt/rejectedBy/rejectedAt/rejectReason
createdAt: timestamp
```

---

## Known Gotchas

```ts
// CRITICAL: pawn-liff uses Zod v4 (package.json: "zod": "^4.4.1")
// z.instanceof(File) syntax is unchanged but FileList is not directly supported
// Use .refine() to validate f.length > 0 after registering as FileList

// CRITICAL: react-hook-form isValid only tracks touched fields with mode: "onChange"
// Without mode: "onChange", isValid is false until first submit attempt

// CRITICAL: Vite env — VITE_API_URL not process.env.API_URL
// Already correct in App.tsx line 15: import.meta.env.VITE_API_URL

// CRITICAL: LINE replyToken expires in 30 seconds
// check_balance is immediate postback → use replyMessage (replyToken still valid)
// confirmPayment (Phase 2, async) → must use pushMessage

// CRITICAL: c.req.text() must be called BEFORE any JSON parsing for webhook signature
// Already correct in webhook.ts — do not change this order

// CRITICAL: Bun SQL driver — drizzle-orm/bun-sql (NOT pg or postgres.js)
// Seed script must import db from '../db/index.ts' — same client

// CRITICAL: Phone normalization before DB lookup
// DB stores phone as-entered (e.g. "081-234-5678" or "0812345678")
// LIFF strips hyphens/spaces before sending, so normalize both sides:
// query: normalized = input.replace(/[-\s]/g, "")
// DB: cannot normalize at query time with exact eq() — use ilike or normalize stored value
// SOLUTION: In service, try exact match first, then try with/without dashes

// CRITICAL: installmentCode lookup — LIFF form currently sends:
// formData.append('customerId', data.lookupValue) ← WRONG (treats code as UUID)
// Must change to: formData.append('installmentCode', data.lookupValue)
// AND update payment route + service to handle 'installmentCode' field

// CRITICAL: Webhook route is mounted at '/' not '/api':
// app.route('/', webhookRoute) → path is /webhook (not /api/webhook)
// LINE Developers Console endpoint must point to /webhook (not /api/webhook/line)
```

---

## Implementation Blueprint

### Task 1 — Fix `buildBalanceFlex` in pawn-api

**File:** `apps/pawn-api/src/lib/line.ts`

Add `buildBalanceFlex` export. The existing `buildPaymentConfirmFlex` is already there — add below it:

```ts
// Pseudocode — match exact FlexMessage type from @line/bot-sdk
export function buildBalanceFlex(customer: {
  installmentCode: string;
  remainingBalance: string;
  totalInstallments: number;
  paidInstallments: number;
  dueDate: string | null;
}): messagingApi.Message {
  const remaining = customer.totalInstallments - customer.paidInstallments;
  return {
    type: 'flex',
    altText: `ยอดคงเหลือ ฿${customer.remainingBalance}`,
    contents: {
      type: 'bubble',
      header: {
        type: 'box', layout: 'vertical', backgroundColor: '#1A73E8',
        contents: [{ type: 'text', text: '💰 ยอดคงเหลือ', color: '#FFFFFF', weight: 'bold', size: 'lg' }],
        paddingAll: '20px',
      },
      body: {
        type: 'box', layout: 'vertical', spacing: 'md', paddingAll: '20px',
        contents: [
          { type: 'text', text: `฿${Number(customer.remainingBalance).toLocaleString('th-TH')}`,
            size: 'xxl', weight: 'bold', align: 'center', color: '#1A73E8' },
          { type: 'separator' },
          { type: 'text', text: `เหลืออีก ${remaining} งวด`, align: 'center', color: '#555555' },
          // conditional: only if dueDate exists
          ...(customer.dueDate ? [{ type: 'text', text: `กำหนดชำระ: ${customer.dueDate}`, align: 'center', color: '#888888', size: 'sm' }] : []),
        ],
      },
    },
  };
}
```

Return type is `messagingApi.Message` (not `FlexMessage`). Check `@line/bot-sdk` types — `messagingApi.Message` is the correct union type for items in the `messages` array.

---

### Task 2 — Fix webhook `check_balance` + add `contact_staff`

**File:** `apps/pawn-api/src/routes/webhook.ts`

Import `buildBalanceFlex` from `../lib/line.ts`.

Change the `check_balance` handler:
```ts
// BEFORE (broken):
await lineClient.pushMessage({ to: event.source.userId, messages: [{ type: 'text', text: '...' }] });

// AFTER (correct):
const customer = await customerService.findByLineUserId(lineUserId);
if (!customer) {
  // use replyToken for not-found message too
  await lineClient.replyMessage({ replyToken: event.replyToken,
    messages: [{ type: 'text', text: 'ไม่พบข้อมูลการผ่อน กรุณาติดต่อร้าน' }] });
  return;
}
await lineClient.replyMessage({ replyToken: event.replyToken,
  messages: [buildBalanceFlex({
    installmentCode: customer.installmentCode,
    remainingBalance: customer.remainingBalance,
    totalInstallments: customer.totalInstallments,
    paidInstallments: customer.paidInstallments,
    dueDate: customer.dueDate,
  })] });
```

Add `contact_staff` case in the switch:
```ts
case 'contact_staff':
  await lineClient.replyMessage({ replyToken: event.replyToken,
    messages: [{ type: 'text', text: 'ติดต่อร้านได้ที่\nโทร 02-XXX-XXXX\nวันจันทร์–เสาร์ 09:00–18:00' }] });
  break;
```

The event type needs `replyToken` added to the TypeScript type:
```ts
// Add replyToken to the event type:
type WebhookEvent = {
  type: string;
  replyToken: string;  // ADD THIS
  source: { userId: string };
  postback?: { data: string };
};
```

---

### Task 3 — Fix installmentCode lookup in payment route + service

**File:** `apps/pawn-api/src/routes/payments.ts`

Change line 19-20 to also accept `installmentCode`:
```ts
// BEFORE:
const customerId = formData.get('customerId') as string | null;
// AFTER: remove customerId, add installmentCode
const installmentCode = formData.get('installmentCode') as string | null;
const phone = formData.get('phone') as string | null;

// BEFORE validation guard:
if (!customerId && !phone) { ... }
// AFTER:
if (!installmentCode && !phone) { ... }

// BEFORE service call:
paymentService.submitPayment({ customerId, phone, amount, ... })
// AFTER:
paymentService.submitPayment({ installmentCode, phone, amount, ... })
```

**File:** `apps/pawn-api/src/services/payment.service.ts`

Change `submitPayment` signature and lookup:
```ts
// BEFORE:
export async function submitPayment(data: {
  customerId?: string;  // was UUID lookup
  phone?: string;
  ...
})

// AFTER:
export async function submitPayment(data: {
  installmentCode?: string;  // lookup by installment_code column
  phone?: string;
  ...
})

// Lookup logic — replace entire customer lookup block:
let customer;
if (data.installmentCode) {
  const normalized = data.installmentCode.trim().toLowerCase();
  const result = await db.select().from(customers)
    .where(ilike(customers.installmentCode, normalized));
  customer = result.at(0);
} else if (data.phone) {
  // Phone normalization: try exact first, then stripped
  const normalizedPhone = data.phone.replace(/[-\s]/g, '');
  const result = await db.select().from(customers)
    .where(or(
      eq(customers.phone, data.phone),
      eq(customers.phone, normalizedPhone),
    ));
  customer = result.at(0);
}
if (!customer) throw new Error('NOT_FOUND');
```

Add missing imports to payment.service.ts: `ilike`, `or` from `drizzle-orm`.

---

### Task 4 — Fix pawn-liff PaymentForm

**File:** `apps/pawn-liff/src/components/PaymentForm.tsx`

**Fix 1: Field name**
```tsx
// Line 47-50 — BEFORE:
if (data.lookupType === 'installmentCode') {
  formData.append('customerId', data.lookupValue);  // ← WRONG

// AFTER:
if (data.lookupType === 'installmentCode') {
  formData.append('installmentCode', data.lookupValue);  // ← CORRECT
```

**Fix 2: HEIC file support**
```tsx
// Line 123 — BEFORE:
accept="image/jpeg,image/png"
// AFTER:
accept="image/jpeg,image/png,image/heic"
```

**Fix 3: Zod schema — add MIME validation**
```ts
// BEFORE:
slip: z.instanceof(File).refine((f) => f.size <= 5 * 1024 * 1024, 'ไฟล์ต้องไม่เกิน 5MB'),

// AFTER:
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/heic'];
slip: z.instanceof(File)
  .refine((f) => f.size <= 5 * 1024 * 1024, 'ไฟล์ต้องไม่เกิน 5MB')
  .refine((f) => ACCEPTED_TYPES.includes(f.type), 'รองรับเฉพาะ jpg, png, heic'),
```

**Fix 4: `isValid` for button disabled state**
```tsx
// Add isValid to formState destructure:
const { register, handleSubmit, watch, setValue,
  formState: { errors, isSubmitting, isValid } } = useForm<FormValues>({
  resolver: zodResolver(schema),
  mode: 'onChange',  // ← REQUIRED for isValid to update on every field change
  defaultValues: { lookupType: 'installmentCode', lookupValue: '', amount: '' },
});

// Button:
// BEFORE:
disabled={isSubmitting}
// AFTER:
disabled={isSubmitting || !isValid}
```

**Note:** The `slip` field uses `z.instanceof(File)` but `register('slip')` returns a FileList from the DOM. The `onSubmit` receives `data.slip` as a File because `zodResolver` validates the FileList but the form value is the File object... Actually wait. Let me think about this.

The form registers `slip` as a file input. When `register('slip')` is used, the value in `data.slip` after validation is actually whatever was in the form input. With `type="file"`, `data.slip` would be a `FileList`, not a `File`. But the Zod schema says `z.instanceof(File)`.

Looking at line 13-16 in current PaymentForm.tsx:
```ts
slip: z.instanceof(File).refine(...)
```

And in onSubmit (line 53):
```ts
formData.append('slip', data.slip);
```

For this to work correctly, we need either:
- Keep `z.instanceof(File)` but transform the input (react-hook-form passes the first file from the input event)
- Or use FileList and validate differently

Actually, with react-hook-form + `register('slip')`, the file input stores the File object directly because react-hook-form normalizes `FileList` for type="file" inputs — it gives you the FileList actually. The `z.instanceof(File)` might fail because it gets a FileList.

Looking at the PRD example more carefully:
```ts
slip: z.instanceof(FileList)
  .refine((f) => f.length > 0, ...)
  .refine((f) => f[0]?.size <= MAX_FILE_SIZE, ...)
  .refine((f) => ACCEPTED_TYPES.includes(f[0]?.type), ...)
```

And in submit:
```ts
formData.append('slip', data.slip[0]);
```

The existing code uses `z.instanceof(File)` which is wrong — should be `z.instanceof(FileList)`. Let me note this as the correct fix. But also need to change `formData.append('slip', data.slip)` to `formData.append('slip', data.slip[0])`.

So the complete Zod fix is:
```ts
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/heic'];
slip: z.instanceof(FileList)  // ← FileList not File
  .refine((f) => f.length > 0, 'กรุณาแนบสลิปการโอนเงิน')
  .refine((f) => f[0]?.size <= 5 * 1024 * 1024, 'ไฟล์ต้องไม่เกิน 5MB')
  .refine((f) => ACCEPTED_TYPES.includes(f[0]?.type), 'รองรับเฉพาะ jpg, png, heic'),
```

And the FormValues type becomes `slip: FileList` so onSubmit needs:
```ts
formData.append('slip', data.slip[0]);  // ← [0] to get first File
```

Wait — looking at the Zod version. The pawn-liff package.json shows `"zod": "^4.4.1"` (Zod v4). In Zod v4, `z.instanceof` still works the same way. The `FileList` instanceof check should work in browser context.

---

### Task 5 — Create ErrorScreen component

**File:** `apps/pawn-liff/src/components/ErrorScreen.tsx` (CREATE)

```tsx
interface ErrorScreenProps {
  message: string;
}

export function ErrorScreen({ message }: ErrorScreenProps) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center gap-4 p-6 text-center min-h-screen">
      <div className="flex size-16 items-center justify-center rounded-full bg-red-100">
        <svg className="size-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      <h1 className="text-lg font-semibold text-destructive">เกิดข้อผิดพลาด</h1>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
```

---

### Task 6 — Wire ErrorScreen into App.tsx

**File:** `apps/pawn-liff/src/App.tsx`

Import ErrorScreen and render it when `error` is non-null:
```tsx
import { ErrorScreen } from './components/ErrorScreen.tsx';

// BEFORE (line 44-48):
if (error) {
  return (
    <div className="...">
      <p className="text-center text-sm text-destructive">{error}</p>
    </div>
  );
}

// AFTER:
if (error) return <ErrorScreen message={error} />;
```

Also add error state for API errors (optional but matches PRD spec):
```tsx
const [apiError, setApiError] = useState<string | null>(null);
// ...
// In PaymentForm onSuccess prop — already works
// Add error fallback: if screen becomes 'error', show ErrorScreen
```

---

### Task 7 — Seed Script

**File:** `apps/pawn-api/src/db/seed.ts` (CREATE)

```ts
import { db } from './index.ts';
import { customers, payments } from './schema.ts';

// Generate 20 customers: 12 active, 4 overdue, 3 due-soon (active within 7d), 1 completed
// Generate 15 payments: 8 confirmed, 5 pending_verification, 2 rejected

// Pattern: use crypto.randomUUID() for all IDs
// Do not insert if data already exists (check count first)

async function seed() {
  const existing = await db.select({ count: sql`count(*)::int` }).from(customers);
  if ((existing[0]?.count ?? 0) > 0) {
    console.log('DB already seeded — skipping');
    process.exit(0);
  }
  // Insert customers...
  // Insert payments (customerId must reference inserted customer IDs)...
}

seed().catch(console.error).finally(() => process.exit(0));
```

Run with: `cd apps/pawn-api && bun run src/db/seed.ts`

Add to package.json scripts: `"db:seed": "bun run src/db/seed.ts"`

---

### Task 8 — Rich Menu (Config-only, not code)

Document in a comment block or README that the Rich Menu must be registered via LINE Developers Console:

```
Size: 2500×1686px
Areas (3 tap zones):
  - Top-left  (0,0 → 1250,843):    action type=uri, uri=liff://channel/{LIFF_ID}
  - Top-right (1250,0 → 2500,843): action type=postback, data="check_balance"
  - Bottom    (0,843 → 2500,1686): action type=postback, data="contact_staff"

Register via: LINE Developers Console → Messaging API → Rich menus → Create
Upload the 2500×1686 image then set areas manually via API or console.
```

---

## Integration Points

```yaml
WEBHOOK_URL:
  - Mounted at: app.route('/', webhookRoute)
  - Accessible at: POST /webhook
  - Register in LINE Developers Console → Messaging API → Webhook URL → https://your-domain/webhook

LIFF_ENV:
  - VITE_LIFF_ID: from LINE Developers Console → LIFF tab
  - VITE_API_URL: the pawn-api public HTTPS URL (ngrok or tunnel for local dev)

CORS:
  - pawn-api: app.use('/api/*', cors({ origin: '*' })) — already set
  - Webhook path (/) is NOT under /api/* — no CORS needed for LINE webhooks

DRIZZLE_DB:
  - Driver: drizzle-orm/bun-sql (Bun native — no pg package needed)
  - Seed: bun run src/db/seed.ts
  - Migrate: bunx drizzle-kit migrate
```

---

## Validation Gates

### Level 1 — TypeScript check

```bash
cd apps/pawn-api && bun run typecheck
cd apps/pawn-liff && bun run typecheck
```

Expected: 0 errors. Fix all type errors before proceeding.

### Level 2 — API smoke tests (requires running pawn-api + seeded DB)

```bash
# Start API
cd apps/pawn-api && bun run dev

# Health check
curl http://localhost:3001/health
# Expected: {"ok":true}  ← but note: health route is not currently in index.ts, skip if 404

# Test installmentCode lookup (use a seeded installmentCode e.g. "P001")
curl -X POST http://localhost:3001/api/payments \
  -F "installmentCode=P001" \
  -F "amount=2000" \
  -F "slip=@/tmp/test.jpg" \
  -F "lineUserId=Utest123"
# Expected: 201 with { id, customerId, amount, status: "pending_verification", ... }
# FAIL means: installmentCode lookup still broken

# Test phone lookup
curl -X POST http://localhost:3001/api/payments \
  -F "phone=0812345678" \
  -F "amount=1500" \
  -F "slip=@/tmp/test.jpg" \
  -F "lineUserId=Utest456"
# Expected: 201 or 404 (depends on seeded phone)

# Test webhook contact_staff
curl -X POST http://localhost:3001/webhook \
  -H "x-line-signature: FAKESIG" \
  -H "Content-Type: application/json" \
  -d '{"events":[{"type":"postback","replyToken":"test","source":{"userId":"U123"},"postback":{"data":"contact_staff"}}]}'
# Expected: 400 (invalid signature) — correct! Signature guard works.
# For real test: use LINE CLI or actual LINE app
```

### Level 3 — LIFF type check

```bash
cd apps/pawn-liff && bun run typecheck
# Expected: 0 errors
```

### Level 4 — Manual LIFF test (requires ngrok + LINE app)

```bash
# Terminal 1: tunnel
ngrok http 3001  # → https://abc123.ngrok.io

# Terminal 2: API
cd apps/pawn-api && bun run dev

# Terminal 3: LIFF
cd apps/pawn-liff && bun run dev
# → http://localhost:5173 (Vite)
# → use ngrok for LIFF HTTPS: register https://abc123.ngrok.io/liff-path in LINE Console

# Checklist:
# [ ] LIFF opens in LINE app
# [ ] Loading spinner shows, then form appears
# [ ] Tab toggle between รหัสผ่อน / เบอร์โทร
# [ ] Submit disabled until all 3 fields filled (installmentCode, amount, slip)
# [ ] File picker shows HEIC in iOS
# [ ] Submit sends correct fields (check Network tab: installmentCode not customerId)
# [ ] 201 → SuccessScreen with amount shown
# [ ] API error → error message in form (submitError state)
# [ ] LIFF init failure → ErrorScreen
```

---

## Final Validation Checklist

- [ ] `bun run typecheck` passes in both pawn-api and pawn-liff (0 errors)
- [ ] POST /api/payments with `installmentCode=P001` returns 201 (not 404)
- [ ] POST /api/payments with phone (seeded number) returns 201
- [ ] POST /api/payments with invalid installmentCode returns 404
- [ ] Webhook `contact_staff` postback returns 200 immediately
- [ ] Webhook `check_balance` handler builds balance Flex (verify in LINE app or Flex Simulator)
- [ ] LIFF form: submit button disabled until installmentCode/phone + amount + slip all filled
- [ ] LIFF form: HEIC visible in file picker on iOS
- [ ] LIFF form: file > 5MB shows Thai error message
- [ ] LIFF success: SuccessScreen shows correct amount
- [ ] LIFF error: ErrorScreen shows for LIFF init failure
- [ ] Seed script runs without errors: `bun run db:seed`
- [ ] No TypeScript `any` introduced

---

## Anti-Patterns to Avoid

- ❌ Don't use `eq(customers.id, installmentCode)` — installmentCode is not a UUID
- ❌ Don't put DB queries inside route handlers — keep in service layer
- ❌ Don't call `c.req.json()` in the webhook route — rawBody must stay as text for signature verification
- ❌ Don't use `pushMessage` for postback-triggered replies — use `replyMessage` (replyToken still valid for immediate postbacks)
- ❌ Don't use `process.env` in pawn-liff — must be `import.meta.env.VITE_*`
- ❌ Don't add `await` before the fire-and-forget void IIFE in webhook — 1-second rule
- ❌ Don't edit files in `components/ui/` — shadcn generated

---

## Ordered Task List

```yaml
Task 1:
  MODIFY apps/pawn-api/src/lib/line.ts
  - ADD: export function buildBalanceFlex(customer: {...}): messagingApi.Message
  - KEEP: existing buildPaymentConfirmFlex and lineClient unchanged

Task 2:
  MODIFY apps/pawn-api/src/routes/webhook.ts
  - ADD replyToken to event type definition
  - FIX: check_balance handler → use replyMessage + buildBalanceFlex
  - ADD: contact_staff case → replyMessage with shop contact text
  - IMPORT buildBalanceFlex from '../lib/line.ts'

Task 3:
  MODIFY apps/pawn-api/src/services/payment.service.ts
  - RENAME param: customerId → installmentCode
  - FIX: lookup block — use ilike(customers.installmentCode, ...) for code, or(eq phone, eq normalized phone) for phone
  - ADD imports: ilike, or from 'drizzle-orm'

Task 4:
  MODIFY apps/pawn-api/src/routes/payments.ts
  - RENAME field: customerId → installmentCode (formData.get)
  - UPDATE: validation guard (!customerId && !phone) → (!installmentCode && !phone)
  - UPDATE: service call params

Task 5:
  CREATE apps/pawn-liff/src/components/ErrorScreen.tsx
  - Simple error display with X icon, Thai error title, message prop

Task 6:
  MODIFY apps/pawn-liff/src/App.tsx
  - IMPORT ErrorScreen
  - REPLACE inline error div → <ErrorScreen message={error} />

Task 7:
  MODIFY apps/pawn-liff/src/components/PaymentForm.tsx
  - FIX: installmentCode lookup field name (customerId → installmentCode)
  - FIX: accept="image/jpeg,image/png,image/heic"
  - FIX: Zod schema → z.instanceof(FileList) with length/size/type refines
  - FIX: mode: 'onChange' on useForm
  - FIX: add isValid to formState destructure
  - FIX: button disabled={isSubmitting || !isValid}
  - FIX: formData.append('slip', data.slip[0]) (index 0 of FileList)

Task 8:
  CREATE apps/pawn-api/src/db/seed.ts
  - 20 customers (12 active, 4 overdue, 3 active w/ dueDate within 7d, 1 paid)
  - 15 payments (8 confirmed, 5 pending_verification, 2 rejected)
  - Add "db:seed" to package.json scripts
  - Guard: skip if customers table already has rows
```
