# PRP: Mobile Installment Payment System (PAWN)

## Goal

Build a full-stack LINE OA-integrated installment payment system for mobile phone shops. Three apps — `pawn-api` (Hono/Bun REST + LINE webhook), `pawn-admin` (Next.js 16 staff dashboard), `pawn-liff` (Vite + React customer LIFF form) — all greenfield scaffolds that need full implementation.

## Why

- Mobile phone shops need a LINE-native way for customers to report monthly payments
- Staff need a web UI to verify slips and confirm payments before balance deduction
- Balance deduction must be atomic and auditable — never at submission time, only at confirmation

## What

### Customer flow (pawn-liff → pawn-api → LINE push)
1. Customer taps Rich Menu → LIFF opens
2. Fills form: installment code OR phone, amount, uploads slip image
3. API saves payment as `pending_verification`, uploads slip to R2, balance unchanged
4. Staff confirms in admin web → DB transaction deducts balance + marks `confirmed`
5. LINE push message (Flex) sent to customer with amount paid + remaining balance

### Staff flow (pawn-admin → pawn-api)
- Dashboard: KPI cards + weekly bar chart
- Customer list: searchable/filterable table
- Customer profile: progress bar + payment history timeline + slip thumbnails
- Slip queue: pending slips with confirm/reject actions (optimistic UI)
- Reports: monthly summary table + bar chart + Excel export

### Success Criteria
- [ ] `pawn-api`: All REST endpoints respond correctly with Zod-validated inputs
- [ ] `pawn-api`: LINE webhook verifies signature, processes postbacks, returns 200 in <1s
- [ ] `pawn-api`: Confirm payment runs in a single DB transaction; balance never goes negative
- [ ] `pawn-api`: Slip images stored in R2 with UUID keys; MIME validated from magic bytes
- [ ] `pawn-liff`: LIFF init + login guard works; form submits with multipart/form-data
- [ ] `pawn-admin`: All pages load data from pawn-api; slip queue has optimistic UI
- [ ] All apps: `bun run typecheck` passes with zero errors

---

## All Needed Context

### Documentation & References

```yaml
- url: https://hono.dev/docs/getting-started/bun
  why: How to run Hono on Bun — export default app pattern

- url: https://hono.dev/docs/guides/middleware
  why: Hono middleware chaining, c.req.text() for raw body

- url: https://orm.drizzle.team/docs/get-started/bun-new
  why: Drizzle + Bun.sql setup — drizzle-orm/bun-sql adapter

- url: https://orm.drizzle.team/docs/transactions
  why: db.transaction(async (tx) => { ... }) for atomic confirm

- url: https://orm.drizzle.team/docs/sql
  why: sql`remaining_balance - ${amount}` tagged template for arithmetic

- url: https://developers.line.biz/en/reference/messaging-api/
  why: pushMessage, Flex Message structure, replyMessage

- url: https://developers.line.biz/en/docs/liff/overview/
  why: liff.init(), liff.isLoggedIn(), liff.getProfile()

- url: https://developers.line.biz/en/reference/liff/#initialize-liff-app
  why: liff.init({ liffId }) API reference and error codes

- url: https://github.com/line/line-bot-sdk-nodejs
  why: validateSignature(), Client class, FlexMessage type

- url: https://developers.cloudflare.com/r2/api/s3/api/
  why: PutObjectCommand, bucket name, endpoint pattern

- url: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
  why: Next.js App Router route handlers (for revalidation only)

- url: https://react-hook-form.com/docs/useform
  why: useForm with zodResolver in pawn-liff PaymentForm

- file: INITIAL.md
  why: Full feature spec, code examples for liff-form, webhook, flex-message, payment-service, admin-slip-queue
```

### Current Codebase Tree

```
apps/pawn-api/
├── src/index.ts          ← only "console.log('Hello via Bun!')"
├── package.json          ← only @types/bun, NO hono/drizzle/etc.
├── tsconfig.json         ← strict, noUncheckedIndexedAccess ON, verbatimModuleSyntax ON
└── CLAUDE.md             ← use Bun.sql (not pg), bun test (not jest)

apps/pawn-admin/
├── app/
│   ├── layout.tsx        ← root layout with ThemeProvider, Nunito Sans
│   ├── page.tsx          ← default Next.js page (needs redirect to /dashboard)
│   └── globals.css
├── components/
│   ├── ui/button.tsx     ← only shadcn component installed
│   └── theme-provider.tsx
├── lib/utils.ts          ← cn() helper
├── components.json       ← shadcn style "radix-sera", baseColor "zinc"
└── package.json          ← next@16.1.7, NO recharts, NO zod

apps/pawn-liff/
├── src/
│   ├── App.tsx           ← "Project ready!" placeholder
│   ├── main.tsx          ← createRoot wrapping ThemeProvider + App
│   ├── lib/utils.ts      ← cn() helper
│   └── index.css
├── vite.config.ts        ← @tailwindcss/vite, alias @/* → ./src/*
├── components.json       ← shadcn style "radix-sera", rsc:false
└── package.json          ← NO @line/liff, NO react-hook-form, NO zod
```

### Desired Codebase Tree

```
apps/pawn-api/
├── src/
│   ├── db/
│   │   ├── schema.ts         # customers + payments Drizzle tables
│   │   └── index.ts          # drizzle(Bun.sql) client export
│   ├── lib/
│   │   ├── line.ts           # LINE Client singleton
│   │   └── r2.ts             # Cloudflare R2 upload (S3-compatible)
│   ├── services/
│   │   ├── customer.service.ts
│   │   ├── payment.service.ts
│   │   ├── dashboard.service.ts
│   │   └── report.service.ts
│   ├── routes/
│   │   ├── customers.ts
│   │   ├── payments.ts
│   │   ├── webhook.ts
│   │   ├── dashboard.ts
│   │   └── reports.ts
│   └── index.ts              # Hono app, mount routes, export default
├── drizzle/                  # generated migrations (after db:generate)
├── drizzle.config.ts
├── .env.example
└── package.json              # + hono drizzle-orm drizzle-kit zod @line/bot-sdk @aws-sdk/client-s3 exceljs

apps/pawn-admin/
├── app/
│   ├── layout.tsx            # (unchanged)
│   ├── page.tsx              # redirect → /dashboard
│   └── (dashboard)/
│       ├── layout.tsx        # sidebar nav
│       ├── dashboard/page.tsx
│       ├── customers/
│       │   ├── page.tsx
│       │   └── [id]/page.tsx
│       ├── queue/page.tsx
│       └── reports/page.tsx
├── components/
│   ├── ui/                   # shadcn generated (add card, table, badge, dialog, input, select, progress, chart)
│   ├── dashboard/
│   │   ├── StatsCard.tsx
│   │   └── WeeklyBarChart.tsx
│   ├── customers/
│   │   ├── CustomerTable.tsx
│   │   └── CustomerStatusBadge.tsx
│   ├── payments/
│   │   ├── SlipQueue.tsx
│   │   └── SlipLightbox.tsx
│   └── reports/
│       ├── MonthlyTable.tsx
│       └── ExportButton.tsx
├── lib/
│   ├── utils.ts              # (unchanged)
│   └── api.ts                # typed fetch wrappers to pawn-api
└── types/
    └── api.ts                # shared response types

apps/pawn-liff/
├── src/
│   ├── components/
│   │   ├── PaymentForm.tsx
│   │   ├── SuccessScreen.tsx
│   │   └── BalanceScreen.tsx
│   ├── hooks/
│   │   └── useLiff.ts
│   ├── lib/utils.ts          # (unchanged)
│   ├── App.tsx               # screen router: form | success | balance
│   ├── main.tsx              # (unchanged)
│   └── index.css             # (unchanged)
└── .env.example
```

---

## Known Gotchas

```ts
// ─── pawn-api: Bun.sql, not pg ─────────────────────────────────────────────
// CLAUDE.md forbids pg/postgres.js. Use drizzle-orm/bun-sql adapter.
// Bun.sql is built into Bun runtime — no extra install needed.
import { drizzle } from 'drizzle-orm/bun-sql';
export const db = drizzle({ connection: process.env.DATABASE_URL! });

// ─── pawn-api: noUncheckedIndexedAccess ─────────────────────────────────────
// tsconfig has noUncheckedIndexedAccess:true — arr[0] returns T | undefined.
// Use: const item = results.at(0); if (!item) throw new Error(...)
// Never: results[0].field  ← TypeScript error

// ─── pawn-api: verbatimModuleSyntax ─────────────────────────────────────────
// Type-only imports must use "import type". Value imports must be "import".
import type { Customer } from './db/schema.ts';  // types
import { customers } from './db/schema.ts';       // values (table reference)

// ─── pawn-api: raw body for LINE webhook signature ──────────────────────────
// Must read raw text BEFORE any body parsing middleware.
// In Hono: const rawBody = await c.req.text(); parse manually after.
// Do NOT use c.req.json() on webhook route.

// ─── pawn-api: Hono on Bun entry pattern ────────────────────────────────────
// Bun uses export default with fetch property:
export default { port: 3001, fetch: app.fetch };

// ─── pawn-api: LINE push after DB commit ─────────────────────────────────────
// replyToken expires in 30s. For async flows (employee confirms later),
// ALWAYS use lineClient.pushMessage(lineUserId, messages).
// If LINE push fails after a successful DB commit: catch + log only, don't throw.

// ─── pawn-api: Confirm idempotency ──────────────────────────────────────────
// Check payment.status === "pending_verification" inside the tx before deducting.
// Never deduct twice — a retry must be a no-op.

// ─── pawn-api: Magic bytes MIME validation ───────────────────────────────────
// Check buffer[0..3], not Content-Type header or filename.
// JPEG: 0xFF 0xD8 0xFF  |  PNG: 0x89 0x50 0x4E 0x47

// ─── pawn-api: sql tagged template for arithmetic ───────────────────────────
// CORRECT: .set({ remainingBalance: sql`remaining_balance - ${payment.amount}` })
// WRONG (race condition): .set({ remainingBalance: customer.remainingBalance - amount })

// ─── pawn-api: R2 endpoint pattern ───────────────────────────────────────────
// endpoint: `https://${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`
// region: "auto"  |  forcePathStyle: true

// ─── pawn-liff: Vite env prefix ──────────────────────────────────────────────
// VITE_LIFF_ID  (NOT NEXT_PUBLIC_LIFF_ID)
// import.meta.env.VITE_LIFF_ID  (not process.env)

// ─── pawn-liff: No SSR guard needed ─────────────────────────────────────────
// Pure client-side Vite app — useEffect always runs client-side.
// No "typeof window !== 'undefined'" check needed (unlike Next.js example).

// ─── pawn-liff: liff.getProfile() guard ─────────────────────────────────────
// Call liff.login() if !liff.isLoggedIn() before getProfile().
// getProfile() throws if not logged in.

// ─── pawn-liff: multipart/form-data, not JSON ───────────────────────────────
// Slip upload uses FormData. Do NOT set Content-Type header manually —
// browser sets it automatically with the correct boundary.

// ─── pawn-admin: shadcn shadcn@latest add ────────────────────────────────────
// Never edit components/ui/* manually. Use: bunx shadcn@latest add <name>
// components.json style is "radix-sera" — use that style, not "new-york"

// ─── pawn-admin: Desktop only ────────────────────────────────────────────────
// No mobile breakpoints. Min-width assumption: 1024px.

// ─── pawn-admin: Server Components for data ──────────────────────────────────
// Fetch from pawn-api in async Server Components. "use client" only for
// interactivity (SlipQueue optimistic UI, charts, search inputs).

// ─── pawn-admin: API routes only for revalidation ────────────────────────────
// No business logic in app/api/. All data goes through pawn-api.

// ─── Drizzle: db:generate vs db:migrate ──────────────────────────────────────
// db:generate → creates SQL migration files in ./drizzle/
// db:migrate  → applies them to the database
// Always run db:generate after schema changes before db:migrate.
```

---

## Data Models

### `src/db/schema.ts` (pawn-api)

```ts
import { pgTable, uuid, varchar, decimal, integer, pgEnum,
         timestamp, date, index, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const customerStatusEnum = pgEnum('customer_status',
  ['active', 'paid', 'overdue', 'due_soon']);
export const paymentStatusEnum = pgEnum('payment_status',
  ['pending_verification', 'confirmed', 'rejected']);

export const customers = pgTable('customers', {
  id: uuid('id').primaryKey().defaultRandom(),
  installmentCode: varchar('installment_code', { length: 50 }).unique().notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  phone: varchar('phone', { length: 20 }).notNull(),
  lineUserId: varchar('line_user_id', { length: 100 }),
  totalPrice: decimal('total_price', { precision: 12, scale: 2 }).notNull(),
  downPayment: decimal('down_payment', { precision: 12, scale: 2 }).notNull(),
  monthlyPayment: decimal('monthly_payment', { precision: 12, scale: 2 }).notNull(),
  totalInstallments: integer('total_installments').notNull(),
  paidInstallments: integer('paid_installments').notNull().default(0),
  remainingBalance: decimal('remaining_balance', { precision: 12, scale: 2 }).notNull(),
  status: customerStatusEnum('status').notNull().default('active'),
  dueDate: date('due_date'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (t) => [
  index('idx_customers_phone').on(t.phone),
  index('idx_customers_status').on(t.status),
  check('remaining_balance_non_negative', sql`${t.remainingBalance} >= 0`),
]);

export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  customerId: uuid('customer_id').notNull().references(() => customers.id),
  lineUserId: varchar('line_user_id', { length: 100 }),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  slipUrl: varchar('slip_url', { length: 500 }).notNull(),
  status: paymentStatusEnum('status').notNull().default('pending_verification'),
  confirmedBy: varchar('confirmed_by', { length: 100 }),
  confirmedAt: timestamp('confirmed_at'),
  rejectedBy: varchar('rejected_by', { length: 100 }),
  rejectedAt: timestamp('rejected_at'),
  rejectReason: varchar('reject_reason', { length: 500 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => [
  index('idx_payments_customer_id').on(t.customerId),
  index('idx_payments_status').on(t.status),
  index('idx_payments_confirmed_at').on(t.confirmedAt),
]);

// TypeScript types derived from schema
export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;
export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
```

### `types/api.ts` (pawn-admin)

```ts
// Mirror service return types here for use in Server Components and API wrappers
export interface CustomerListItem {
  id: string; installmentCode: string; name: string; phone: string;
  remainingBalance: string; status: string; dueDate: string | null;
}
export interface PaymentQueueItem {
  id: string; customerId: string; customerName: string; phone: string;
  amount: string; slipUrl: string; status: string; createdAt: string;
}
export interface DashboardStats {
  totalCustomers: number; overdueCount: number;
  todayReceipts: { count: number; total: string };
  monthlyReceipts: { count: number; total: string };
  weeklyChart: { date: string; total: number }[];
}
export interface MonthlyReport {
  month: string; paymentCount: number; totalAmount: string;
  customerCount: number;
}
```

---

## Implementation Blueprint

### Phase 1: pawn-api

#### Task 1 — Install pawn-api dependencies

```bash
cd apps/pawn-api
bun add hono drizzle-orm zod @line/bot-sdk @aws-sdk/client-s3 @aws-sdk/s3-request-presigner exceljs
bun add -d drizzle-kit
```

#### Task 2 — Environment config

CREATE `apps/pawn-api/.env.example`:
```
DATABASE_URL=postgresql://user:pass@localhost:5432/pawn
LINE_CHANNEL_ACCESS_TOKEN=
LINE_CHANNEL_SECRET=
CLOUDFLARE_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=pawn-slips
R2_PUBLIC_URL=https://your-r2-public-url.com
PORT=3001
```

CREATE `apps/pawn-api/drizzle.config.ts`:
```ts
import { defineConfig } from 'drizzle-kit';
export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL! },
});
```

UPDATE `apps/pawn-api/package.json` scripts:
```json
"scripts": {
  "dev": "bun run --hot src/index.ts",
  "start": "bun run src/index.ts",
  "typecheck": "tsc --noEmit",
  "db:generate": "drizzle-kit generate",
  "db:migrate": "drizzle-kit migrate",
  "db:studio": "drizzle-kit studio"
}
```

#### Task 3 — DB schema

CREATE `apps/pawn-api/src/db/schema.ts` — use the full schema defined in the Data Models section above.

#### Task 4 — DB client

CREATE `apps/pawn-api/src/db/index.ts`:
```ts
import { drizzle } from 'drizzle-orm/bun-sql';
import * as schema from './schema.ts';

export const db = drizzle({
  connection: process.env.DATABASE_URL!,
  schema,
});
```

#### Task 5 — LINE client singleton

CREATE `apps/pawn-api/src/lib/line.ts`:
```ts
import { Client } from '@line/bot-sdk';

export const lineClient = new Client({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN!,
  channelSecret: process.env.LINE_CHANNEL_SECRET!,
});
```

#### Task 6 — R2 upload service

CREATE `apps/pawn-api/src/lib/r2.ts`:
```ts
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID!}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true,  // required for R2
});

// Validate MIME type from magic bytes (not filename/Content-Type)
function detectMimeType(buffer: Uint8Array): string {
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return 'image/png';
  throw new Error('Invalid file type: only JPEG and PNG accepted');
}

export async function uploadSlip(buffer: Uint8Array): Promise<string> {
  const mimeType = detectMimeType(buffer);
  const ext = mimeType === 'image/jpeg' ? 'jpg' : 'png';
  const key = `slips/${crypto.randomUUID()}.${ext}`;

  await s3.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
  }));

  return `${process.env.R2_PUBLIC_URL!}/${key}`;
}
```

#### Task 7 — Customer service

CREATE `apps/pawn-api/src/services/customer.service.ts`:

```ts
// Pseudocode — implement fully:

// listCustomers(query?: { search?: string, status?: string, page?: number })
//   → SELECT from customers WHERE (name LIKE %search% OR phone LIKE %search%)
//     AND (status = status if provided)
//     ORDER BY createdAt DESC, LIMIT 20, OFFSET page*20
//   → return { customers: CustomerListItem[], total: number }

// getCustomer(id: string)
//   → SELECT customer + recent 20 payments (JOIN or separate query)
//   → throw Error('NOT_FOUND') if not found

// createCustomer(data: NewCustomer)
//   → INSERT into customers
//   → remainingBalance = totalPrice - downPayment (calculated before insert)

// updateCustomer(id: string, data: Partial<NewCustomer>)
//   → UPDATE customers SET ...data WHERE id = id
//   → updatedAt = new Date()

// linkLineUser(customerId: string, lineUserId: string)
//   → UPDATE customers SET line_user_id = lineUserId WHERE id = customerId
```

Key Drizzle patterns:
```ts
import { ilike, or, eq, and } from 'drizzle-orm';
// Search: where(and(eq(customers.status, status), or(ilike(customers.name, `%${search}%`), ilike(customers.phone, `%${search}%`))))
// noUncheckedIndexedAccess: const result = await db.select()...; const row = result.at(0); if (!row) throw new Error('NOT_FOUND');
```

#### Task 8 — Customer routes

CREATE `apps/pawn-api/src/routes/customers.ts`:
```ts
// GET /api/customers?search=&status=&page=  → customerService.listCustomers()
// GET /api/customers/:id                    → customerService.getCustomer()
// POST /api/customers                       → validate with Zod → customerService.createCustomer()
// PATCH /api/customers/:id                  → validate with Zod → customerService.updateCustomer()

// Zod schema for create:
const createCustomerSchema = z.object({
  installmentCode: z.string().min(1),
  name: z.string().min(1),
  phone: z.string().min(1),
  totalPrice: z.number().positive(),
  downPayment: z.number().nonnegative(),
  monthlyPayment: z.number().positive(),
  totalInstallments: z.number().int().positive(),
  dueDate: z.string().optional(),
});

// Error pattern:
try {
  return c.json(await customerService.getCustomer(id));
} catch (err) {
  if (err instanceof Error && err.message === 'NOT_FOUND') return c.json({ error: 'Customer not found' }, 404);
  throw err;
}
```

#### Task 9 — Payment service

CREATE `apps/pawn-api/src/services/payment.service.ts`:

```ts
// submitPayment(data: { customerId | phone, amount, slipBuffer, lineUserId? })
//   1. Look up customer by id OR phone (throw NOT_FOUND if missing)
//   2. Upload slip buffer to R2 → get slipUrl
//   3. INSERT into payments: { customerId, lineUserId, amount, slipUrl, status: 'pending_verification' }
//   4. Return created payment

// confirmPayment(paymentId: string, confirmedBy: string)
//   1. SELECT payment (verify status === 'pending_verification', else throw INVALID_STATUS)
//   2. SELECT customer, verify payment.amount <= customer.remainingBalance (else throw INSUFFICIENT_BALANCE)
//   3. db.transaction(async (tx) => {
//       tx.update(customers).set({ remainingBalance: sql`remaining_balance - ${payment.amount}`, paidInstallments: sql`paid_installments + 1` }).where(eq(customers.id, payment.customerId))
//       tx.update(payments).set({ status: 'confirmed', confirmedBy, confirmedAt: new Date() }).where(eq(payments.id, paymentId))
//     })
//   4. After tx: fetch updated customer, push LINE Flex Message
//      try { await pushConfirmMessage(payment.lineUserId, ...) } catch (e) { console.error('LINE push failed:', e) }

// rejectPayment(paymentId: string, rejectedBy: string, reason: string)
//   → UPDATE payments SET status='rejected', rejectedBy, rejectedAt, rejectReason

// listPendingPayments()
//   → SELECT payments JOIN customers WHERE payments.status = 'pending_verification' ORDER BY createdAt ASC

// getPaymentsByCustomer(customerId: string)
//   → SELECT payments WHERE customerId ORDER BY createdAt DESC LIMIT 50
```

Flex Message builder (add to `src/lib/line.ts`):
```ts
// buildPaymentConfirmFlex({ amount, remainingBalance, nextDueDate, installmentCode })
// Returns FlexMessage with:
// - header: backgroundColor #00B900, text "ชำระเงินสำเร็จ" white bold xl
// - body: installmentCode, amount (bold lg), remainingBalance (#E74C3C), nextDueDate (grey sm)
// See INITIAL.md examples/flex-message.ts for exact structure
```

#### Task 10 — Payment routes

CREATE `apps/pawn-api/src/routes/payments.ts`:
```ts
// POST /api/payments  (LIFF submission — multipart/form-data)
//   const formData = await c.req.formData();
//   const file = formData.get('slip') as File;
//   const buffer = new Uint8Array(await file.arrayBuffer());
//   Validate: customerId or phone required, amount positive, file max 5MB
//   → paymentService.submitPayment(...)

// GET /api/payments?status=pending_verification
//   → paymentService.listPendingPayments()

// POST /api/payments/:id/confirm
//   Body: { confirmedBy: string }
//   → paymentService.confirmPayment(id, confirmedBy)

// POST /api/payments/:id/reject
//   Body: { rejectedBy: string, reason: string }
//   → paymentService.rejectPayment(id, rejectedBy, reason)

// Error mapping:
// 'NOT_FOUND'             → 404
// 'INVALID_STATUS'        → 409
// 'INSUFFICIENT_BALANCE'  → 422
// 'Invalid file type'     → 400
```

#### Task 11 — Webhook route

CREATE `apps/pawn-api/src/routes/webhook.ts`:
```ts
import { validateSignature } from '@line/bot-sdk';

// POST /webhook
// 1. rawBody = await c.req.text()  ← MUST be first, before any parsing
// 2. signature = c.req.header('x-line-signature') ?? ''
// 3. if (!validateSignature(rawBody, process.env.LINE_CHANNEL_SECRET!, signature)) return c.text('Unauthorized', 400)
// 4. Return 200 OK immediately
// 5. Process events asynchronously (no waitUntil in Bun — use Promise without await)

// Event handling (fire-and-forget after response):
// event.type === 'postback' && event.postback.data === 'check_balance'
//   → look up customer by event.source.userId (lineUserId field)
//   → push Flex or text message with remaining balance

// CRITICAL: Return c.text('OK') BEFORE any await on DB/LINE calls
// Use: void processEvents(events).catch(e => console.error(e))
```

#### Task 12 — Dashboard service + route

CREATE `apps/pawn-api/src/services/dashboard.service.ts`:
```ts
// getStats() → DashboardStats
//   - totalCustomers: COUNT(customers)
//   - overdueCount: COUNT(customers WHERE status = 'overdue')
//   - todayReceipts: COUNT + SUM(payments WHERE status='confirmed' AND confirmed_at >= today 00:00)
//   - monthlyReceipts: COUNT + SUM(payments WHERE status='confirmed' AND confirmed_at >= month start)
//   - weeklyChart: last 7 days, group by date, SUM(amount) per day
//     Use: sql`DATE(confirmed_at)` for grouping
```

CREATE `apps/pawn-api/src/routes/dashboard.ts`:
```ts
// GET /api/dashboard → dashboardService.getStats()
```

#### Task 13 — Report service + route

CREATE `apps/pawn-api/src/services/report.service.ts`:
```ts
// getMonthlySummary(year: number, month: number)
//   → SELECT date, COUNT, SUM from payments WHERE status='confirmed'
//     AND confirmed_at >= YYYY-MM-01 AND confirmed_at < YYYY-MM+1-01
//   → group by week or by individual payment (daily)

// exportToExcel(year: number, month: number) → Buffer
//   Use ExcelJS: new Workbook(), addWorksheet, columns with Thai headers
//   Fill rows from getMonthlySummary data
//   return workbook.xlsx.writeBuffer()
```

CREATE `apps/pawn-api/src/routes/reports.ts`:
```ts
// GET /api/reports/monthly?year=&month= → JSON summary
// GET /api/reports/export?year=&month=
//   → c.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
//   → c.header('Content-Disposition', `attachment; filename="report-${year}-${month}.xlsx"`)
//   → return c.body(buffer)
```

#### Task 14 — Wire up pawn-api index.ts

REPLACE `apps/pawn-api/src/index.ts`:
```ts
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { customersRoute } from './routes/customers.ts';
import { paymentsRoute } from './routes/payments.ts';
import { webhookRoute } from './routes/webhook.ts';
import { dashboardRoute } from './routes/dashboard.ts';
import { reportsRoute } from './routes/reports.ts';

const app = new Hono();

app.use('*', logger());
app.use('/api/*', cors({ origin: '*' }));  // tighten in production

app.route('/api/customers', customersRoute);
app.route('/api/payments', paymentsRoute);
app.route('/api/dashboard', dashboardRoute);
app.route('/api/reports', reportsRoute);
app.route('/', webhookRoute);

app.onError((err, c) => {
  console.error(err);
  return c.json({ error: 'Internal server error' }, 500);
});

export default { port: Number(process.env.PORT ?? 3001), fetch: app.fetch };
```

---

#### Phase 1 Checkpoint (run before moving to Phase 2)

```bash
cd apps/pawn-api
bun run typecheck
# Expected: 0 errors

bun run dev
# Confirm: server starts on port 3001

# Basic smoke test (no DB needed):
curl http://localhost:3001/api/customers
# Expected: 500 or connection error (DB not connected) — not a 404
```

---

### Phase 2: pawn-liff

#### Task 15 — Install pawn-liff dependencies

```bash
cd apps/pawn-liff
bun add @line/liff react-hook-form zod @hookform/resolvers
```

#### Task 16 — Environment config

CREATE `apps/pawn-liff/.env.example`:
```
VITE_LIFF_ID=
VITE_API_URL=http://localhost:3001
```

#### Task 17 — useLiff hook

CREATE `apps/pawn-liff/src/hooks/useLiff.ts`:
```ts
// Returns: { liffReady: boolean, lineUserId: string | null, error: string | null }
// useEffect:
//   1. liff.init({ liffId: import.meta.env.VITE_LIFF_ID })
//   2. if (!liff.isLoggedIn()) { liff.login(); return; }
//   3. const profile = await liff.getProfile()
//   4. setLineUserId(profile.userId)
//   5. setLiffReady(true)
// Catch errors: set error state, don't crash

// Note: No SSR guard needed — Vite is client-only
// liff.init() accepts HTTPS URLs only in production; use ngrok locally
```

#### Task 18 — PaymentForm component

CREATE `apps/pawn-liff/src/components/PaymentForm.tsx`:
```ts
// Props: { lineUserId: string; onSuccess: (payment: SubmitResult) => void }

// Form fields (react-hook-form + zod):
const schema = z.object({
  lookupType: z.enum(['installmentCode', 'phone']),
  lookupValue: z.string().min(1, 'กรุณากรอกข้อมูล'),
  amount: z.number({ coerce: true }).positive('ยอดชำระต้องมากกว่า 0'),
  slip: z.instanceof(File).refine(f => f.size <= 5 * 1024 * 1024, 'ไฟล์ต้องไม่เกิน 5MB'),
});

// Submit handler:
//   1. Build FormData: append lookupType, lookupValue, amount, slip, lineUserId
//   2. POST to `${import.meta.env.VITE_API_URL}/api/payments`
//   3. On success: call onSuccess(result)
//   4. On error: show error message (never redirect out of LIFF)

// UI: max-w-md mx-auto, LINE-styled card
// Loading state: disable submit button, show spinner
// Toggle between installmentCode / phone lookup type
```

#### Task 19 — SuccessScreen

CREATE `apps/pawn-liff/src/components/SuccessScreen.tsx`:
```ts
// Props: { amount: number; customerName: string; onClose?: () => void }
// Show: checkmark icon (green #00B900), amount, customerName
// "ระบบได้รับแจ้งชำระของคุณแล้ว" message
// "ปิด" button → liff.closeWindow() if in LIFF, else onClose()
```

#### Task 20 — BalanceScreen

CREATE `apps/pawn-liff/src/components/BalanceScreen.tsx`:
```ts
// Props: { remainingBalance: number; nextDueDate: string; installmentCode: string }
// Show remaining balance, next due date, installment code
// Back button to return to PaymentForm
```

#### Task 21 — Update App.tsx

REPLACE `apps/pawn-liff/src/App.tsx`:
```ts
// Screen state: 'form' | 'success' | 'balance'
// useLiff() for init
// Show loading spinner while !liffReady
// Show error if liff init fails
// Render PaymentForm | SuccessScreen | BalanceScreen based on screen state
// max-w-md mx-auto min-h-svh — mobile-first
```

#### Phase 2 Checkpoint

```bash
cd apps/pawn-liff
bun run typecheck
# Expected: 0 errors
```

---

### Phase 3: pawn-admin

#### Task 22 — Install pawn-admin dependencies

```bash
cd apps/pawn-admin
bun add recharts zod
```

#### Task 23 — Add shadcn components

```bash
cd apps/pawn-admin
bunx shadcn@latest add card table badge dialog input select progress
# charts component (wraps recharts):
bunx shadcn@latest add chart
```

#### Task 24 — Create lib/api.ts and types/api.ts

CREATE `apps/pawn-admin/types/api.ts` — use the types defined in the Data Models section above.

CREATE `apps/pawn-admin/lib/api.ts`:
```ts
// Base URL from env:
const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

// Typed fetch wrappers (all throw on non-ok):
export async function getDashboard(): Promise<DashboardStats> { ... }
export async function getCustomers(params?: { search?: string; status?: string; page?: number }): Promise<{ customers: CustomerListItem[]; total: number }> { ... }
export async function getCustomer(id: string): Promise<CustomerDetail> { ... }
export async function getPendingPayments(): Promise<PaymentQueueItem[]> { ... }
export async function confirmPayment(id: string): Promise<void> { ... }
export async function rejectPayment(id: string, reason: string): Promise<void> { ... }
export async function getMonthlyReport(year: number, month: number): Promise<MonthlyReport[]> { ... }
// For Excel export: return the URL string — let <a href> handle download
export function getExportUrl(year: number, month: number): string { return `${BASE}/api/reports/export?year=${year}&month=${month}`; }
```

Add `NEXT_PUBLIC_API_URL` to `.env.local` template.

#### Task 25 — Dashboard route group layout + sidebar

CREATE `apps/pawn-admin/app/(dashboard)/layout.tsx`:
```tsx
// Server Component layout with sidebar nav
// Nav links: Dashboard (/dashboard), Customers (/customers), Queue (/queue), Reports (/reports)
// Fixed left sidebar 240px, content fills remaining width
// No mobile responsive (desktop-only, min 1024px)
```

UPDATE `apps/pawn-admin/app/page.tsx`:
```ts
import { redirect } from 'next/navigation';
export default function Home() { redirect('/dashboard'); }
```

#### Task 26 — Dashboard page

CREATE `apps/pawn-admin/app/(dashboard)/dashboard/page.tsx`:
```tsx
// async Server Component
// const stats = await getDashboard()
// Render: 4 StatsCard + WeeklyBarChart

// StatsCard props: { title, value, subtext }
// WeeklyBarChart: "use client", recharts BarChart with weeklyChart data
// Use shadcn Card for StatsCard wrapper
```

#### Task 27 — Customer list page + components

CREATE `apps/pawn-admin/app/(dashboard)/customers/page.tsx`:
```tsx
// async Server Component
// searchParams: { search, status, page }
// const { customers, total } = await getCustomers(searchParams)
// Render: CustomerSearch (client, updates URL params), CustomerTable (server)

// CustomerTable columns: Code, Name, Phone, Remaining Balance, Status, Due Date, Actions
// CustomerStatusBadge: green/red/amber based on status
// Clicking row → /customers/[id]
```

#### Task 28 — Customer profile page

CREATE `apps/pawn-admin/app/(dashboard)/customers/[id]/page.tsx`:
```tsx
// async Server Component
// const customer = await getCustomer(params.id)
// Layout: header (name, phone, status badge) + two columns
// Left: progress bar (paidInstallments / totalInstallments), stats
// Right: payment history timeline (list of payments with date, amount, status, slip thumbnail)
// Slip thumbnail: <img> clicking opens SlipLightbox (client component)
// SlipLightbox: overlay with full-size image, Escape to close
```

#### Task 29 — Slip verification queue page

CREATE `apps/pawn-admin/app/(dashboard)/queue/page.tsx`:
```tsx
// Initial data fetch (server), but SlipQueue is "use client" for optimistic UI

// SlipQueue component:
// - State: payments list (initialized from server props)
// - Confirm: immediately remove from list (optimistic), POST /confirm, rollback on error
// - Reject: show reason dialog, then remove (optimistic), POST /reject, rollback on error
// - Keyboard: Enter to confirm focused slip, Escape to close lightbox
// - Slip thumbnail → SlipLightbox overlay

// SlipCard: customer name, phone, amount, submission date, slip thumb, Confirm/Reject buttons
```

#### Task 30 — Reports page

CREATE `apps/pawn-admin/app/(dashboard)/reports/page.tsx`:
```tsx
// "use client" (needs year/month state for interactive filter)
// Default: current year + month
// MonthlyTable: shows payment count, total amount, customer count per month
// BarChart: monthly totals visualization (recharts, wrapped in shadcn Chart)
// ExportButton: <a href={getExportUrl(year, month)} download> wrapped in Button
```

---

#### Phase 3 Checkpoint

```bash
cd apps/pawn-admin
bun run typecheck
# Expected: 0 errors

bun run dev
# Visit http://localhost:3000
# Verify: /dashboard, /customers, /queue, /reports all render without crash
```

---

## Integration Points

```yaml
DATABASE:
  - Run: cd apps/pawn-api && bun run db:generate && bun run db:migrate
  - Required: PostgreSQL running with DATABASE_URL set in .env
  - Check constraint: remaining_balance >= 0 (in schema.ts)

ENV VARS:
  - pawn-api/.env: DATABASE_URL, LINE_*, R2_*, PORT
  - pawn-liff/.env.local: VITE_LIFF_ID, VITE_API_URL
  - pawn-admin/.env.local: NEXT_PUBLIC_API_URL

CORS:
  - pawn-api allows all origins in dev (tighten to specific URLs in production)
  - pawn-admin and pawn-liff both call pawn-api directly

LINE DEVELOPER CONSOLE (manual setup, not code):
  - Register LIFF endpoint URL (must be HTTPS — use ngrok for local dev)
  - Set webhook URL to https://your-domain/webhook
  - Create Rich Menu with postback "แจ้งชำระ" triggering LIFF open
  - Enable messaging API + LIFF API

PORTS (local dev):
  - pawn-api: 3001
  - pawn-admin: 3000 (next dev)
  - pawn-liff: 5173 (vite dev)
```

---

## Validation Loop

### Level 1: TypeScript (run per app)

```bash
cd apps/pawn-api && bun run typecheck
cd apps/pawn-admin && bun run typecheck
cd apps/pawn-liff && bun run typecheck
# All must pass with 0 errors before proceeding
```

### Level 2: API smoke tests (requires running pawn-api + PostgreSQL)

```bash
# Start pawn-api
cd apps/pawn-api && bun run dev

# Dashboard endpoint
curl http://localhost:3001/api/dashboard
# Expected: { totalCustomers, overdueCount, todayReceipts, monthlyReceipts, weeklyChart }

# Create customer
curl -X POST http://localhost:3001/api/customers \
  -H "Content-Type: application/json" \
  -d '{"installmentCode":"INS-001","name":"Test User","phone":"0812345678","totalPrice":15000,"downPayment":3000,"monthlyPayment":2000,"totalInstallments":6}'
# Expected: 200 + customer object

# List customers
curl http://localhost:3001/api/customers
# Expected: { customers: [...], total: 1 }

# Pending payments queue
curl 'http://localhost:3001/api/payments?status=pending_verification'
# Expected: []

# Webhook signature test (invalid signature → 400)
curl -X POST http://localhost:3001/webhook \
  -H "x-line-signature: invalid" \
  -H "Content-Type: application/json" \
  -d '{"events":[]}'
# Expected: 400 Unauthorized
```

### Level 3: End-to-end payment flow

```bash
# 1. Create customer (see Level 2)
# 2. Submit payment via multipart (replace CUSTOMER_ID):
curl -X POST http://localhost:3001/api/payments \
  -F "customerId=<CUSTOMER_ID>" \
  -F "amount=2000" \
  -F "slip=@/tmp/test.jpg" \
  -F "lineUserId=test-user"
# Expected: payment with status pending_verification

# 3. Confirm payment (replace PAYMENT_ID):
curl -X POST http://localhost:3001/api/payments/<PAYMENT_ID>/confirm \
  -H "Content-Type: application/json" \
  -d '{"confirmedBy":"staff1"}'
# Expected: 200 + updated customer with decremented remainingBalance
# Note: LINE push will fail without real credentials — that's OK, check logs only

# 4. Verify double-confirm is rejected:
curl -X POST http://localhost:3001/api/payments/<PAYMENT_ID>/confirm \
  -H "Content-Type: application/json" \
  -d '{"confirmedBy":"staff1"}'
# Expected: 409 Conflict
```

## Final Validation Checklist

- [ ] `bun run typecheck` passes in all 3 apps
- [ ] pawn-api: all REST endpoints respond with correct status codes
- [ ] pawn-api: webhook returns 400 for invalid signature, 200 for valid
- [ ] pawn-api: confirm payment is atomic (DB transaction), balance never negative
- [ ] pawn-api: double-confirm returns 409
- [ ] pawn-api: slip file validated from magic bytes, UUID key in R2
- [ ] pawn-liff: LIFF init + form renders, submits multipart to pawn-api
- [ ] pawn-admin: all 4 pages render without TypeScript errors
- [ ] pawn-admin: slip queue has optimistic UI (confirm removes card immediately)
- [ ] pawn-admin: Excel export endpoint returns correct Content-Type header

---

## Anti-Patterns to Avoid

- ❌ `import { db } from '../db'` in route files — only in service files
- ❌ `c.req.json()` on the webhook route — must use `c.req.text()` first
- ❌ `await lineClient.pushMessage(...)` inside the DB transaction
- ❌ `customer.remainingBalance - amount` for balance deduction (use `sql` template)
- ❌ `results[0].field` — use `results.at(0)` with null check (noUncheckedIndexedAccess)
- ❌ Editing `components/ui/*` files manually — use `bunx shadcn@latest add`
- ❌ `import X from 'module'` for type-only imports — use `import type` (verbatimModuleSyntax)
- ❌ Mobile breakpoints in pawn-admin — desktop only
- ❌ `process.env.VITE_*` in pawn-liff — use `import.meta.env.VITE_*`
- ❌ `NEXT_PUBLIC_*` in pawn-liff — that's Next.js; Vite uses `VITE_*`

---

## PRP Confidence Score: 7.5/10

**Strengths:** Greenfield (no breakage risk), complete schema, all gotchas documented, phased execution with checkpoints, executable validation gates.

**Risks:** (1) Very large scope — execute one phase at a time; (2) `drizzle-orm/bun-sql` API may differ slightly from pseudocode — check `node_modules/drizzle-orm/bun-sql` for actual exports; (3) `@line/liff` compatibility with React 19 is untested — if issues arise, wrap in a dynamic import or check the GitHub issues; (4) LINE/R2 require real credentials for full E2E — partial testing without them is sufficient.

**Recommendation:** Execute in 3 separate `/execute-prp` sessions — one per Phase — to stay within context limits.
