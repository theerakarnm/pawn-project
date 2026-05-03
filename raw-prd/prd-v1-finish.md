# Product Requirements Document
## LINE OA + LIFF Installment Payment System
### ระบบผ่อนชำระ/ออมมือถือสำหรับร้านโทรศัพท์

---

**Version:** 1.0.0  
**Status:** Draft  
**Last Updated:** 2025-05-04  
**Author:** System Architect  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Overview](#2-system-overview)
3. [User Roles & Permissions](#3-user-roles--permissions)
4. [LINE OA Setup](#4-line-oa-setup)
5. [Authentication & KYC Onboarding](#5-authentication--kyc-onboarding)
6. [Account & Contract Management](#6-account--contract-management)
7. [Payment Modes](#7-payment-modes)
8. [Payment Submission Flow](#8-payment-submission-flow)
9. [Admin Review & Confirmation Flow](#9-admin-review--confirmation-flow)
10. [Payment Reversal Flow](#10-payment-reversal-flow)
11. [Penalty System](#11-penalty-system)
12. [Notification System](#12-notification-system)
13. [Admin Web Dashboard](#13-admin-web-dashboard)
14. [Reports Module](#14-reports-module)
15. [Client LIFF Application](#15-client-liff-application)
16. [Data Model](#16-data-model)
17. [API Specification](#17-api-specification)
18. [System Settings](#18-system-settings)
19. [Non-Functional Requirements](#19-non-functional-requirements)
20. [Open Decisions Log](#20-open-decisions-log)
21. [Architecture & Tech Stack](#21-architecture--tech-stack)

---

## 1. Executive Summary

ระบบนี้เป็น **LINE-first Installment & Savings Payment Platform** สำหรับธุรกิจร้านมือถือขนาดเล็ก-กลาง ที่รองรับ 2 โหมดการขาย:

- **ผ่อนเป็นงวด (Installment)** — ลูกค้าจ่ายยอดตายตัวรายเดือน มี due date, ค่าปรับ
- **ออมมือถือ (Savings)** — ลูกค้าสะสมเงินตามสะดวกจนครบเป้าหมาย ไม่มีค่าปรับ

ลูกค้าใช้งานผ่าน **LINE LIFF** ไม่ต้องติดตั้งแอปเพิ่ม Admin/Staff ใช้ผ่าน **Web Dashboard**

**Business Value:**
- ลดภาระ admin ในการติดตามการชำระ
- ลูกค้าตรวจสอบยอดได้เอง 24/7 ผ่าน LINE
- บันทึกและ audit trail ครบถ้วน
- ลดความเสี่ยงจากการ confirm ผิดพลาดผ่าน 2-step verification

---

## 2. System Overview

### 2.1 Monorepo Structure

```
/
├── pawn-api/          # Hono.js on Bun — REST API + Webhook
├── pawn-admin/        # Next.js 14 (App Router) — Admin Dashboard
└── pawn-liff/         # Vite + React — Customer LIFF App
```

### 2.2 High-Level Architecture

```
LINE Platform
  ├── Rich Menu → LIFF URL
  ├── Webhook Events → pawn-api /webhook
  └── Push/Reply Messages ← pawn-api

Customer Device
  └── LINE App → LIFF → pawn-liff (Vite/React)
                              ↕ REST API
Admin Browser
  └── pawn-admin (Next.js) ↔ pawn-api

pawn-api
  ├── PostgreSQL (via Drizzle ORM)
  ├── Cloudflare R2 (slip storage)
  └── LINE Messaging API

```

### 2.3 Scope — Single Shop, Single Branch

ระบบออกแบบสำหรับร้านเดียว ไม่มี multi-branch ใน version นี้

---

## 3. User Roles & Permissions

### 3.1 Role Matrix

| Permission | Admin | Staff | Viewer | ลูกค้า (LIFF) |
|---|:---:|:---:|:---:|:---:|
| ดูข้อมูลลูกค้าทั้งหมด | ✅ | ✅ | ✅ | ❌ |
| เพิ่ม/แก้ไขลูกค้า | ✅ | ❌ | ❌ | ❌ |
| เพิ่ม/แก้ไขสัญญา | ✅ | ❌ | ❌ | ❌ |
| ตรวจสลิป (Confirm/Reject) | ✅ | ✅ | ❌ | ❌ |
| เลือก Penalty Action | ✅ | ✅ | ❌ | ❌ |
| บันทึกชำระหน้าร้าน | ✅ | ✅ | ❌ | ❌ |
| **Reverse Payment** | ✅ | ❌ | ❌ | ❌ |
| ดูรายงาน | ✅ | ✅ | ✅ | ❌ |
| Export รายงาน | ✅ | ✅ | ❌ | ❌ |
| จัดการ Staff accounts | ✅ | ❌ | ❌ | ❌ |
| จัดการ Settings | ✅ | ❌ | ❌ | ❌ |
| ผูก/ยกเลิก LINE UID | ✅ | ❌ | ❌ | ❌ |
| ดูยอด/สัญญาตัวเอง | ❌ | ❌ | ❌ | ✅ |
| แจ้งชำระ + ส่งสลิป | ❌ | ❌ | ❌ | ✅ |

### 3.2 Role Escalation

ไม่มี self-service role escalation — Admin จัดการ role ของ Staff/Viewer ผ่าน Dashboard เท่านั้น

---

## 4. LINE OA Setup

### 4.1 Rich Menu

**Layout:** 2×2 grid (2 columns บน, 2 columns ล่าง)  
**Background:** `#00B900`  
**Text Color:** `#FFFFFF`

| Position | Label | Type | Action |
|---|---|---|---|
| Top-Left | 🏠 Dashboard | URI | เปิด LIFF URL (หน้า Dashboard) |
| Top-Right | 💸 แจ้งชำระ | URI | เปิด LIFF URL (หน้า Payment Form) |
| Bottom-Left | 💰 เช็กยอด | Postback | `action=check_balance` |
| Bottom-Right | 📞 ติดต่อร้าน | Postback | `action=contact_staff` |

**Postback Response: `check_balance`**

ระบบ lookup LINE UID → ดึง accounts ทั้งหมด → ส่ง Flex Message สรุปยอดทุกสัญญา (ดู Section 12 สำหรับ template)

**Postback Response: `contact_staff`**

ส่ง text message แสดงข้อมูลติดต่อร้านจาก settings (`shopName`, `shopPhone`, `shopHours`)

### 4.2 LINE LIFF Application

```
LIFF Size: Full (ใช้เต็มหน้าจอ)
LIFF Endpoint: https://<domain>/liff
LIFF Scope: profile, openid
```

**Init Flow:**

```javascript
// 1. liff.init({ liffId })
// 2. if (!liff.isLoggedIn()) → liff.login()
// 3. const idToken = liff.getIDToken()
// 4. GET /api/liff/me (Authorization: Bearer <idToken>)
// 5. Route based on status response
```

**LIFF Guard Rules:**
- ถ้าเปิดผ่าน browser ปกติ (ไม่ใช่ LINE) → แสดงหน้า "กรุณาเปิดผ่าน LINE"
- ถ้า token หมดอายุ → re-login อัตโนมัติ
- LIFF endpoint ต้องเป็น HTTPS เสมอ (production: Cloudflare Tunnel / ngrok ใช้ dev เท่านั้น)

### 4.3 LINE Webhook

**Endpoint:** `POST /api/webhook/line`

**Security:**
```
1. ตรวจ x-line-signature header ก่อนทุก request
   HMAC-SHA256(channelSecret, requestBody) → base64
   ถ้าไม่ match → return 400 ทันที
2. Return 200 OK ทันทีก่อน process (async)
3. ห้าม block main thread ด้วย LINE API calls
```

**Supported Events:**

| Event Type | Action |
|---|---|
| `follow` | บันทึก LINE UID ใน DB (ถ้ายังไม่มี), ส่ง welcome message |
| `unfollow` | mark lineUserId = null สำหรับ customer ที่ผูกอยู่ |
| `postback` | route ตาม `data` field (check_balance, contact_staff) |
| `message` | ไม่ process (optional: แนะนำให้ใช้ rich menu) |

**Reply vs Push Rule:**
- `replyMessage` — ใช้กับ immediate postback response เท่านั้น (replyToken TTL = 30s)
- `pushMessage` — ใช้กับ async flows: payment confirmed/rejected, reminders

---

## 5. Authentication & KYC Onboarding

### 5.1 LIFF Authentication Flow

```
GET /api/liff/me
  Header: Authorization: Bearer <LINE ID Token>

Response:
  { status: "needs_kyc" }       → แสดงหน้า KYC
  { status: "pending_customer" } → แสดงหน้ารอ Admin
  { status: "linked", customer: {...}, accounts: [...] } → Dashboard
```

**ID Token Verification:**
- ส่ง ID Token ไปยืนยันกับ LINE API: `POST https://api.line.me/oauth2/v2.1/verify`
- ดึง `sub` (LINE UID) จาก verified payload
- ห้าม trust client-side LINE UID โดยตรง

### 5.2 First-time KYC (Onboarding)

**Input ที่ลูกค้าต้องกรอก:**
1. เบอร์มือถือ (ที่ลงทะเบียนกับร้าน)
2. รหัสบัญชี 1 รายการ (`INS-XXXXXX` หรือ `SAV-XXXXXX`)

**Validation Logic:**

```
POST /api/liff/kyc
{
  phone: "0891234567",
  accountCode: "INS-000001"
}

Step 1: normalize phone (strip +66, leading 0)
Step 2: find customer WHERE phoneNormalized = ? AND accountCode matches account.accountCode
Step 3:
  Case A: ไม่พบ customer + ไม่พบ account → create pending_customer record → return { status: "pending_created" }
  Case B: พบ customer + account match → check if account.lineUserId already exists
    B1: lineUserId ≠ null AND lineUserId ≠ current UID → return 409 { error: "account_already_linked" }
    B2: lineUserId = null → link LINE UID → return { status: "linked", ... }
    B3: lineUserId = current UID → return { status: "linked", ... } (idempotent)
  Case C: พบ customer แต่ account ไม่ match → return 404 { error: "not_found" }
```

**Phone Normalization:**

```typescript
function normalizePhone(phone: string): string {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  // Handle +66 prefix
  if (digits.startsWith('66') && digits.length === 11) {
    return '0' + digits.slice(2);
  }
  return digits;
}
```

### 5.3 Adding More Account Codes

ลูกค้าที่ผ่าน onboarding แล้วสามารถเพิ่มสัญญาอื่นได้จาก Dashboard:

```
POST /api/liff/accounts/link
{
  phone: "0891234567",   // ต้องตรงกับ phone ที่ลงทะเบียน
  accountCode: "SAV-000002"
}

Rule: ตรวจ phone + accountCode ตรงกันก่อน
Rule: ห้าม auto-link ทุก account ที่ใช้เบอร์เดียวกัน
Rule: 1 account สามารถผูกได้แค่ 1 LINE UID
```

### 5.4 pending_customer → Active Flow

```
1. Admin เพิ่ม Customer + Account ใหม่ใน Dashboard
2. ถ้า pending_customer record มี LINE UID อยู่
   → ระบบ push LINE notification: "สัญญาของคุณพร้อมแล้ว [accountCode]"
   → ลูกค้าเปิด LIFF → status = linked → Dashboard
3. Admin จะเห็น pending_customers list ใน Dashboard พร้อม alert
```

---

## 6. Account & Contract Management

### 6.1 Account Code Format

| ประเภท | Prefix | Format | ตัวอย่าง |
|---|---|---|---|
| ผ่อนเป็นงวด | `INS` | `INS-{6digits}` | `INS-000001` |
| ออมมือถือ | `SAV` | `SAV-{6digits}` | `SAV-000001` |

- รหัสต้อง unique ทั้งระบบ (unique constraint บน `account_code` column)
- ระบบ auto-generate running number แยกต่อ prefix
- `paymentMode` field เป็น source of truth สำหรับ business logic (ไม่ใช่ prefix)

### 6.2 Customer States

```
new → active → overdue (installment only)
                    ↓
               ready_for_pickup → picked_up
```

| Status | ความหมาย |
|---|---|
| `active` | บัญชีปกติ ยังไม่ถึง due |
| `due_soon` | installment: due date ใน X วัน (configurable) |
| `overdue` | installment: เลย due date แล้ว ยังไม่ชำระ |
| `inactive` | savings: ไม่ได้ชำระมากกว่า threshold วัน |
| `ready_for_pickup` | ชำระครบแล้ว รอรับเครื่อง |
| `paid` | ชำระครบ + รับเครื่องแล้ว (archived) |

### 6.3 dueDate Logic (Installment)

**Fixed Billing Cycle** — วันที่ 1 ของทุกเดือน (default, configurable ผ่าน settings)

```
Contract created: 15 Jan
First dueDate: 1 Feb

After confirmed payment on any date:
  Next dueDate = 1st of following month

Example:
  Paid 25 Jan → next due: 1 Mar
  Paid 5 Feb (overdue) → next due: 1 Mar
  Paid 28 Feb → next due: 1 Apr
```

**Settings key:** `billing_cycle_day` (default: 1, range: 1-28)

### 6.4 Customer Status Auto-Update

Scheduled job (cron) ทุกวันเวลา 00:01 Thailand time:

```
FOR EACH installment account WHERE status IN (active, due_soon):
  IF dueDate < TODAY → status = overdue

FOR EACH installment account WHERE status = active:
  IF dueDate <= TODAY + preDueDays → status = due_soon

FOR EACH savings account WHERE status = active:
  IF lastPaymentDate < TODAY - inactiveThresholdDays → status = inactive
```

---

## 7. Payment Modes

### 7.1 Savings (ออมมือถือ — `SAV`)

| Field | Rule |
|---|---|
| `accumulatedAmount` | บวกทุกครั้งที่ admin confirm |
| `targetAmount` | ยอดเป้าหมาย ตั้งตอนสร้างสัญญา |
| `lastPaymentDate` | อัปเดตทุก confirmed payment |
| Due Date | ไม่มี |
| Penalty | ไม่มี |
| Inactive Threshold | ไม่ได้ชำระนาน > `inactiveThresholdDays` (default: 30) |

**Overpayment Rule:**
- ถ้า `accumulatedAmount + paymentAmount > targetAmount` → **ปฏิเสธ**
- Admin/LIFF แสดงข้อความ: "ยอดที่โอนเกินเป้าหมายสะสม กรุณาโอนไม่เกิน X บาท"
- Maximum acceptable amount = `targetAmount - accumulatedAmount`

**Completion:**
- เมื่อ `accumulatedAmount >= targetAmount` → `status = ready_for_pickup`
- Push LINE notification ทันที

### 7.2 Installment (ผ่อนเป็นงวด — `INS`)

| Field | Rule |
|---|---|
| `monthlyPayment` | ยอดงวดต่อเดือน คงที่ |
| `totalInstallments` | จำนวนงวดทั้งหมด |
| `paidInstallments` | งวดที่จ่ายแล้ว |
| `remainingBalance` | ยอดที่เหลือต้องชำระ |
| `dueDate` | วันครบกำหนดชำระปัจจุบัน |
| Penalty | 100 บาท/วันที่เกิน (configurable) |

**Overpayment Rule:**
- ถ้า `paymentAmount > remainingBalance` → **ปฏิเสธ**
- แสดงข้อความ: "ยอดที่โอนเกินยอดคงเหลือ กรุณาโอนไม่เกิน X บาท"
- ไม่รับการจ่ายเกิน (ไม่มี credit/refund flow ใน v1)

**Penalty-First Rule (ถ้ามีค่าปรับ):**
```
payment.amount = X บาท
penalty.collected = Y บาท (ที่ admin กำหนด)

effective_principal = X - Y
account.remainingBalance -= effective_principal
account.paidInstallments += 1
payment.principalAmount = effective_principal
payment.penaltyCollected = Y
```

**Completion:**
- เมื่อ `remainingBalance <= 0` → `status = ready_for_pickup`
- Push LINE notification ทันที

---

## 8. Payment Submission Flow

### 8.1 LIFF Payment Submission

```
POST /api/liff/payments
Content-Type: multipart/form-data
Authorization: Bearer <LINE ID Token>

Fields:
  accountId: UUID
  amount: decimal (> 0, max 2 decimal places)
  slipFile: File (jpeg/png/heic, max 5MB)
  note: string (optional)
```

**Validation Chain:**

```
1. Verify LINE ID Token → get lineUserId
2. Verify accountId belongs to this lineUserId
3. Validate file:
   a. Read magic bytes (ไม่ trust MIME type จาก client)
      - JPEG: FF D8 FF
      - PNG: 89 50 4E 47
      - HEIC: ดู ftyp box
   b. Size ≤ 5MB
4. Validate amount:
   a. > 0
   b. ≤ 2 decimal places
   c. Installment: amount ≤ remainingBalance
   d. Savings: amount ≤ (targetAmount - accumulatedAmount)
5. Check pending lock:
   ถ้า account มี payment.status = 'pending_verification' อยู่แล้ว
   → return 409 { error: "pending_exists", message: "มีรายการรอตรวจสอบอยู่แล้ว" }
```

**Slip Upload to R2:**

```
Key format: slips/{accountId}/{paymentId}/{timestamp}.{ext}
ACL: private (access ผ่าน signed URL เท่านั้น)
Signed URL TTL: 15 นาที (สำหรับ admin lightbox)
```

**Response:**

```json
{
  "success": true,
  "paymentId": "uuid",
  "message": "รับสลิปเรียบร้อย รอพนักงานตรวจสอบ"
}
```

**Pending Lock Behavior:**
- ลูกค้าที่มี pending อยู่แล้ว → แสดง warning banner ในหน้า Payment Form
- ปุ่ม "ส่งสลิป" จะ disabled พร้อม tooltip "มีรายการรอตรวจสอบ"
- ลูกค้าสามารถดูสถานะ pending payment ได้จากหน้า Detail

### 8.2 Manual Payment Entry (Admin/Staff)

```
POST /api/admin/payments/manual
Auth: Admin or Staff session required

Body:
{
  accountId: UUID,
  amount: decimal,
  note: string (optional),
  paymentDate: date (default: today),
  // ถ้า overdue: penaltyAction required
  penaltyAction: "full" | "reduced" | "waived",
  penaltyCollected: decimal // required if action = "reduced"
}
```

- ไม่ต้องใช้สลิป (slip = optional)
- ยืนยันทันที (ไม่ผ่าน pending queue)
- ใช้ transaction เดียวกับ Section 9 confirm flow
- ส่ง LINE notification หลัง confirm

---

## 9. Admin Review & Confirmation Flow

### 9.1 Confirm Payment Transaction

**Endpoint:** `POST /api/admin/payments/:id/confirm`

**Full DB Transaction:**

```typescript
await db.transaction(async (tx) => {
  // Step 1: Lock and validate payment
  const payment = await tx
    .select()
    .from(payments)
    .where(eq(payments.id, paymentId))
    .for('update') // Row-level lock
    .limit(1);

  if (payment.status !== 'pending_verification') {
    throw new ConflictError('Payment already processed');
  }

  // Step 2: Validate balance
  const account = await tx.select().from(accounts)
    .where(eq(accounts.id, payment.accountId))
    .for('update').limit(1);

  const effectivePrincipal = payment.amount - (penaltyCollected ?? 0);

  if (account.paymentMode === 'installment') {
    if (effectivePrincipal > account.remainingBalance) {
      throw new ValidationError('Amount exceeds remaining balance');
    }
  } else { // savings
    if (payment.amount > (account.targetAmount - account.accumulatedAmount)) {
      throw new ValidationError('Amount exceeds savings target');
    }
  }

  // Step 3: Update account
  if (account.paymentMode === 'installment') {
    const nextDueDate = calculateNextDueDate(settings.billing_cycle_day);
    await tx.update(accounts).set({
      remainingBalance: account.remainingBalance - effectivePrincipal,
      paidInstallments: account.paidInstallments + 1,
      dueDate: nextDueDate,
      lastPaymentDate: new Date(),
      status: (account.remainingBalance - effectivePrincipal <= 0)
        ? 'ready_for_pickup' : recalculateStatus(account, nextDueDate),
    }).where(eq(accounts.id, account.id));
  } else {
    const newAccumulated = account.accumulatedAmount + payment.amount;
    await tx.update(accounts).set({
      accumulatedAmount: newAccumulated,
      lastPaymentDate: new Date(),
      status: newAccumulated >= account.targetAmount ? 'ready_for_pickup' : 'active',
    }).where(eq(accounts.id, account.id));
  }

  // Step 4: Update payment record
  await tx.update(payments).set({
    status: 'confirmed',
    confirmedBy: staffId,
    confirmedAt: new Date(),
    principalAmount: effectivePrincipal,
    penaltyAction,
    penaltyCollected: penaltyCollected ?? 0,
    overdueDays,
    calculatedPenalty,
    penaltyAdjustedBy: staffId,
    penaltyAdjustedAt: new Date(),
  }).where(eq(payments.id, paymentId));

  // Step 5: Audit log
  await tx.insert(auditLogs).values({
    action: 'payment_confirmed',
    entityType: 'payment',
    entityId: paymentId,
    performedBy: staffId,
    metadata: { before: {...}, after: {...} },
  });
});

// Outside transaction: Push LINE (best-effort, no rollback)
await sendLineConfirmMessage(payment, account).catch(logError);
```

### 9.2 Reject Payment

**Endpoint:** `POST /api/admin/payments/:id/reject`

```typescript
// Simple update, no balance change
await db.update(payments).set({
  status: 'rejected',
  rejectedBy: staffId,
  rejectedAt: new Date(),
  rejectionReason: reason, // required field
}).where(eq(payments.id, paymentId));

// Push LINE notification
await sendLineRejectMessage(payment, reason).catch(logError);
```

**Rule:** `rejectionReason` เป็น required field — staff ต้องกรอกก่อน reject ได้

### 9.3 Slip Lightbox

- Admin click รูปสลิปใน queue → แสดง lightbox
- รูปโหลดผ่าน signed URL จาก R2 (TTL 15 นาที)
- Signed URL generated on-demand (ไม่เก็บ URL ใน DB)
- รองรับ pinch-zoom บน mobile

---

## 10. Payment Reversal Flow

### 10.1 Overview

- **ใครทำได้:** Admin เท่านั้น
- **เงื่อนไข:** payment status = `confirmed`
- **ไม่มี time limit** แต่ต้องกรอกเหตุผล
- **ผลกระทบ:** roll back balance + สร้าง audit trail

### 10.2 Reversal Transaction

**Endpoint:** `POST /api/admin/payments/:id/reverse`  
**Auth:** Admin session required

```typescript
await db.transaction(async (tx) => {
  // Step 1: Validate
  const payment = await tx.select().from(payments)
    .where(eq(payments.id, paymentId)).for('update').limit(1);

  if (payment.status !== 'confirmed') {
    throw new ConflictError('Only confirmed payments can be reversed');
  }
  if (payment.reversedAt) {
    throw new ConflictError('Payment already reversed');
  }

  // Step 2: Re-validate account state (ต้องไม่ทำให้ติดลบ)
  const account = await tx.select().from(accounts)
    .where(eq(accounts.id, payment.accountId)).for('update').limit(1);

  // Step 3: Reverse account balance
  if (account.paymentMode === 'installment') {
    const restoredBalance = account.remainingBalance + payment.principalAmount;
    await tx.update(accounts).set({
      remainingBalance: restoredBalance,
      paidInstallments: Math.max(0, account.paidInstallments - 1),
      status: recalculateStatusAfterReversal(account, restoredBalance),
      // dueDate: restore previous dueDate (stored in payment.previousDueDate)
      dueDate: payment.previousDueDate,
    }).where(eq(accounts.id, account.id));
  } else {
    await tx.update(accounts).set({
      accumulatedAmount: account.accumulatedAmount - payment.amount,
      status: 'active',
    }).where(eq(accounts.id, account.id));
  }

  // Step 4: Mark payment as reversed
  await tx.update(payments).set({
    status: 'reversed',
    reversedBy: adminId,
    reversedAt: new Date(),
    reversalReason: reason,
  }).where(eq(payments.id, paymentId));

  // Step 5: Audit log
  await tx.insert(auditLogs).values({
    action: 'payment_reversed',
    entityType: 'payment',
    entityId: paymentId,
    performedBy: adminId,
    metadata: { reason, beforeBalance: account.remainingBalance, afterBalance: ... },
  });
});

// Notify customer via LINE
await sendLineReversalMessage(payment, reason).catch(logError);
```

### 10.3 Payment Status State Machine

```
pending_verification
  ├── [confirm] → confirmed
  │                   └── [reverse] → reversed
  └── [reject] → rejected
```

Rule: `reversed` และ `rejected` เป็น terminal states (ไม่สามารถ reopen ได้)

### 10.4 Audit Log

ทุก action ที่เปลี่ยน balance ต้องบันทึก:

| Field | Type | Description |
|---|---|---|
| id | UUID | PK |
| action | enum | payment_confirmed, payment_rejected, payment_reversed, manual_payment |
| entityType | string | payment, account, customer |
| entityId | UUID | FK to affected entity |
| performedBy | UUID | Staff/Admin ID |
| performedAt | timestamp | |
| metadata | jsonb | { before, after, reason } |

`previousDueDate` ต้องบันทึกใน payment record ตอน confirm เพื่อใช้ restore ตอน reverse

---

## 11. Penalty System

### 11.1 Scope

ค่าปรับใช้กับ **Installment เท่านั้น** — Savings ไม่มีค่าปรับ

### 11.2 Penalty Calculation

```typescript
function calculatePenalty(dueDate: Date, confirmDate: Date): {
  overdueDays: number;
  calculatedPenalty: number;
} {
  const daysOverdue = Math.max(0,
    differenceInDays(confirmDate, dueDate)
  );
  return {
    overdueDays: daysOverdue,
    calculatedPenalty: daysOverdue * PENALTY_RATE_PER_DAY, // default: 100 บาท/วัน
  };
}
```

- `PENALTY_RATE_PER_DAY` — configurable ผ่าน settings (default: 100)
- `overdueDays` — วันจาก `dueDate` ถึงวัน **admin กด confirm** (ไม่ใช่วันที่ลูกค้าส่ง)
- ค่าปรับห้ามติดลบ (Math.max(0, ...))
- ถ้า `dueDate = null` หรือ payment ไม่ overdue → `penalty = 0`, ไม่ต้องให้ admin เลือก action

### 11.3 Admin Penalty Actions

แสดงเฉพาะเมื่อ `overdueDays > 0`:

| Action | ความหมาย | Fields Required |
|---|---|---|
| `full` | เก็บค่าปรับเต็มตามที่คำนวณ | - |
| `reduced` | ลดค่าปรับ | `penaltyCollected` (ต้องกรอก) |
| `waived` | ยกเว้นค่าปรับ | - |

**Validation:**
- `reduced`: `penaltyCollected` ต้องมากกว่า 0 และน้อยกว่า `calculatedPenalty`
- `full`: `penaltyCollected = calculatedPenalty` (auto-fill)
- `waived`: `penaltyCollected = 0` (auto-fill)

**UI Flow:**

```
Admin กด Confirm บน overdue slip
→ ระบบแสดง Penalty Dialog:
  "ค่าปรับ: 300 บาท (3 วัน × 100 บาท/วัน)"
  [○] เก็บเต็ม (300 บาท)
  [○] ลดค่าปรับ → input: [___] บาท
  [○] ยกเว้น
  [ยืนยัน]
```

### 11.4 Payment Record Fields (Penalty)

```typescript
{
  overdueDays: number,
  calculatedPenalty: Decimal,
  penaltyAction: 'full' | 'reduced' | 'waived' | null,
  penaltyCollected: Decimal,     // ค่าปรับที่เก็บจริง
  principalAmount: Decimal,      // amount - penaltyCollected
  penaltyAdjustedBy: string,     // staffId
  penaltyAdjustedAt: timestamp,
}
```

เก็บแยกจากยอดเงินต้น เพื่อให้ report แยกประเภทได้

---

## 12. Notification System

### 12.1 Notification Types & Triggers

| Type | Trigger | Channel | Dedup Rule |
|---|---|---|---|
| `account_ready` | pending_customer → contract created | Push | ไม่ dedup |
| `payment_confirmed` | Admin confirm | Push | ไม่ dedup (event-driven) |
| `payment_rejected` | Admin reject | Push | ไม่ dedup (event-driven) |
| `ready_for_pickup` | balance = 0 / accumulated = target | Push | ครั้งเดียวต่อ account |
| `pre_due_reminder` | `dueDate - preDueDays <= today` | Push | 1 ครั้งต่อ billing cycle |
| `overdue_reminder` | `dueDate + 1 day` | Push | 1 ครั้งต่อ billing cycle |

**billing cycle** = ต่อ `dueDate` ที่ระบบ track อยู่ (ไม่ใช่ per calendar month)

### 12.2 Flex Message Templates

**Payment Confirmed (Installment):**

```json
{
  "type": "bubble",
  "header": {
    "contents": [{ "type": "text", "text": "✅ รับชำระเงินแล้ว", "weight": "bold", "color": "#00B900" }]
  },
  "body": {
    "contents": [
      { "type": "text", "text": "สัญญา: INS-000001" },
      { "type": "text", "text": "ยอดที่ชำระ: ฿{amount}" },
      { "type": "text", "text": "ยอดคงเหลือ: ฿{remainingBalance}" },
      { "type": "text", "text": "งวดถัดไป: {nextDueDate}" },
      { "type": "text", "text": "งวดที่จ่าย: {paidInstallments}/{totalInstallments}" }
    ]
  },
  "footer": {
    "contents": [{ "type": "button", "action": { "type": "uri", "label": "ดูรายละเอียด", "uri": "{liffUrl}" }}]
  }
}
```

**Payment Confirmed (Savings):**

```json
{
  "body": {
    "contents": [
      { "type": "text", "text": "สัญญา: SAV-000001" },
      { "type": "text", "text": "ยอดที่ชำระ: ฿{amount}" },
      { "type": "text", "text": "ยอดสะสม: ฿{accumulatedAmount} / ฿{targetAmount}" },
      { "type": "text", "text": "คงเหลือ: ฿{remaining}" }
    ]
  }
}
```

**Payment Rejected:**

```
❌ ไม่สามารถรับสลิปได้

สัญญา: {accountCode}
ยอด: ฿{amount}
เหตุผล: {rejectionReason}

กรุณาติดต่อร้านหรือส่งสลิปใหม่
```

**Ready for Pickup:**

```
🎉 ชำระครบแล้ว! พร้อมรับเครื่อง

สัญญา: {accountCode}
รุ่น: {deviceModel}
กรุณามารับเครื่องที่ร้านภายในเวลาทำการ
{shopName} | {shopPhone}
```

**Pre-Due Reminder:**

```
⏰ แจ้งเตือนชำระเงิน

สัญญา: {accountCode} | {deviceModel}
ยอดงวดนี้: ฿{monthlyPayment}
ครบกำหนด: {dueDate}
ยอดคงเหลือ: ฿{remainingBalance}

[ชำระเงิน →]
```

**Overdue Reminder:**

```
⚠️ เกินกำหนดชำระแล้ว

สัญญา: {accountCode}
ครบกำหนด: {dueDate}
ค้างชำระ: {overdueDays} วัน
ค่าปรับปัจจุบัน: ฿{estimatedPenalty}

กรุณาชำระโดยเร็ว

[ชำระเงิน →]
```

### 12.3 Notification Log

```typescript
table notification_logs {
  id: UUID PK
  accountId: UUID FK → accounts.id
  customerId: UUID FK → customers.id
  lineUserId: string
  notificationType: enum (account_ready | payment_confirmed | payment_rejected | ready_for_pickup | pre_due_reminder | overdue_reminder)
  status: enum (success | failed)
  errorMessage: string nullable
  messageId: string nullable   // LINE message ID จาก response
  metadata: jsonb              // { paymentId, amount, etc. }
  createdAt: timestamp
}
```

**Dedup Check:**

```typescript
async function shouldSendReminder(
  accountId: string,
  type: 'pre_due_reminder' | 'overdue_reminder',
  dueDate: Date
): Promise<boolean> {
  const existing = await db.select().from(notificationLogs)
    .where(and(
      eq(notificationLogs.accountId, accountId),
      eq(notificationLogs.notificationType, type),
      eq(notificationLogs.status, 'success'),
      // ต้องเป็น due date เดียวกัน (billing cycle นี้)
      gte(notificationLogs.createdAt, startOfBillingCycle(dueDate))
    ));
  return existing.length === 0;
}
```

### 12.4 LINE Push Failure Policy

- LINE push failure **ห้าม rollback** payment/account changes
- บันทึก `status = 'failed'` + `errorMessage` ใน notification_logs
- Admin สามารถ retry push ได้จาก Dashboard (future feature)

### 12.5 Scheduled Reminder Job

**Cron:** ทุกวัน 09:00 Thailand (UTC+7)

```
1. Pre-due reminders:
   SELECT accounts WHERE paymentMode = installment
     AND status IN (active, due_soon)
     AND dueDate = TODAY + preDueDays

2. Overdue reminders:
   SELECT accounts WHERE paymentMode = installment
     AND status = overdue
     AND dueDate = YESTERDAY (หลังเลย 1 วัน)

3. For each: check dedup → push LINE → log result
```

---

## 13. Admin Web Dashboard

### 13.1 Authentication

```
POST /api/admin/auth/login
{ username, password }

- Password hashed: argon2id
- Session: httpOnly cookie (session ID → Redis or DB-backed)
- Session TTL: 8 ชั่วโมง (configurable)
- CSRF: SameSite=Strict cookie
- Rate limit: 5 attempts / 15 minutes per IP
```

**Session Middleware:**

```typescript
// ทุก mutation endpoint
app.use('/api/admin', async (c, next) => {
  const session = await getSession(c);
  if (!session) return c.json({ error: 'Unauthorized' }, 401);
  c.set('staff', session.staff);
  await next();
});
```

### 13.2 Dashboard Home

**KPI Cards (real-time):**

| Card | Query |
|---|---|
| ลูกค้า Active | COUNT customers WHERE status = active |
| ลูกค้า Overdue | COUNT accounts WHERE status = overdue |
| ถึงกำหนดวันนี้ | COUNT accounts WHERE dueDate = TODAY |
| สลิปรอตรวจ | COUNT payments WHERE status = pending_verification |
| รายรับวันนี้ | SUM payments.amount WHERE date = TODAY AND status = confirmed |
| รายรับเดือนนี้ | SUM payments.amount WHERE month = THIS_MONTH AND status = confirmed |
| รอรับเครื่อง | COUNT accounts WHERE status = ready_for_pickup |

**Charts:**
- Weekly Revenue Bar Chart (7 วันย้อนหลัง) — แยก installment / savings

**Lists:**
- Due Today: แสดง 10 รายการล่าสุด พร้อม link ไปหน้า customer detail
- Recent Activity: Timeline ของ payments/events 20 รายการล่าสุด

### 13.3 Customer Management

**Search:** เบอร์โทร, รหัสบัญชี, ชื่อลูกค้า (full-text search)  
**Filters:** status, paymentMode, hasLineLinked

**Customer List Columns:**
ชื่อ | เบอร์ | รหัสสัญญา | รุ่นมือถือ | ประเภท | ยอดคงเหลือ | สถานะ | due date | LINE linked

**Customer Detail Page:**
- ข้อมูลลูกค้า (edit inline)
- รายการสัญญาทั้งหมด
- Payment history (table + filter by date/status)
- Slip images (thumbnail → lightbox)
- LINE profile (UID, display name, avatar)
- ปุ่ม "ยกเลิกการผูก LINE" (Admin only)

**Create/Edit Customer:**
- Form: ชื่อ, เบอร์, หมายเหตุ
- เพิ่มสัญญาใหม่: เลือก INS/SAV, ราคา, ดาวน์, งวด, รุ่นมือถือ
- ระบบ auto-generate accountCode

### 13.4 Slip Queue

**Layout:** ตาราง sorted by `createdAt ASC` (เก่าสุดก่อน)

**Columns:** เวลาส่ง | ชื่อลูกค้า | สัญญา | ยอด | สลิป (thumbnail) | Action

**Action Flow:**

```
Click [ตรวจสอบ] → Drawer/Modal เปิด:
  - แสดงรูปสลิปขนาดเต็ม (lightbox)
  - ข้อมูลสัญญา: ยอดคงเหลือ, due date, status
  
  ถ้ามีค่าปรับ (overdueDays > 0):
    - แสดง "ค่าปรับ: X วัน × 100 = Y บาท"
    - เลือก penalty action
  
  [Confirm] / [Reject]
  
  Reject → required reason input
```

**Badge:** จำนวน pending ใน queue แสดงที่ navigation badge

### 13.5 Payment Ledger

**Filters:** วันที่ (range picker), status, paymentMode, accountCode

**Columns:** วันที่ | ลูกค้า | สัญญา | ยอดชำระ | ค่าปรับ | เงินต้น | status | ตรวจโดย

**Detail Row Expand:**
- slip image (ถ้ามี)
- audit trail สำหรับ payment นั้น
- ปุ่ม Reverse (Admin only, เฉพาะ confirmed)

**Reverse Payment Flow:**

```
Admin คลิก [Reverse] → Confirm Dialog:
  "ต้องการยกเลิกรายการชำระนี้ใช่ไหม?
   ยอด: ฿{amount} | วันที่: {date} | สัญญา: {code}"
  กรุณาระบุเหตุผล: [text input — required]
  [ยืนยันการยกเลิก] / [ยกเลิก]
```

---

## 14. Reports Module

### 14.1 Report Tabs

| Tab | คำอธิบาย | Export |
|---|---|---|
| ถึงกำหนดจ่าย | Installment ที่ dueDate = today | CSV |
| เกินกำหนดจ่าย | Installment overdue + จำนวนวัน + ค่าปรับสะสม | CSV |
| ค่าปรับ | Overdue + คำนวณค่าปรับ + เลือก penalty action | CSV |
| หายจากการออม | Savings inactive > threshold | CSV |
| รายรับ | Revenue breakdown daily/monthly | CSV + Excel |
| พร้อมรับเครื่อง | status = ready_for_pickup + ยังไม่ mark picked_up | CSV |

### 14.2 Revenue Report Detail

**Daily View:**
| วันที่ | จำนวนรายการ | รายรับรวม | แยก: ผ่อน | แยก: ออม | ค่าปรับรวม |

**Monthly View:**
| เดือน | จำนวนรายการ | รายรับรวม | แยก: ผ่อน | แยก: ออม | ค่าปรับรวม |

**Bar Chart:** monthly revenue visualization (recharts หรือ Chart.js)

### 14.3 Export

- **CSV:** ทุก tab (UTF-8 with BOM เพื่อรองรับ Excel Thai)
- **Excel (.xlsx):** เฉพาะ Revenue tab (ใช้ `exceljs` หรือ `xlsx`)
- Filename format: `report_{tab}_{YYYYMMDD}.csv`

### 14.4 Ready for Pickup Workflow

Admin สามารถ mark "รับเครื่องแล้ว" ได้จากตารางนี้:

```
POST /api/admin/accounts/:id/pickup
{ pickedUpBy: string } // ชื่อพนักงานที่ส่งมอบ

→ account.devicePickedUp = true
→ account.devicePickedUpAt = now
→ account.devicePickedUpBy = name
→ account.status = 'paid'
→ customer.status recalculate
```

---

## 15. Client LIFF Application

### 15.1 Screen Flow

```
App Start
  └── LIFF Init + Login Guard
        ├── [Loading] ← ระหว่าง init
        └── GET /api/liff/me
              ├── needs_kyc → [KYC Screen]
              │     ├── กรอกเบอร์ + รหัส → POST /api/liff/kyc
              │     │     ├── success → [Dashboard]
              │     │     ├── pending → [Pending Screen]
              │     │     └── error → [Error Screen]
              ├── pending_customer → [Pending Screen]
              └── linked → [Dashboard]
                    ├── tap account → [Detail Screen]
                    └── tap "แจ้งชำระ" → [Payment Form]
                          ├── success → [Success Screen]
                          └── error → [Error Screen]
```

### 15.2 Screen Specifications

**Loading Screen:**
- LINE-themed spinner (สีเขียว `#00B900`)
- ข้อความ: "กำลังโหลด..."

**KYC Screen:**
- Title: "ยืนยันตัวตน"
- Input: เบอร์มือถือ (tel keyboard)
- Input: รหัสบัญชี (INS-XXXXXX / SAV-XXXXXX) — uppercase auto-format
- ปุ่ม: "ยืนยัน"
- Error states: not found / already linked / validation errors

**Pending Screen:**
- ข้อความ: "ขอบคุณสำหรับข้อมูลของคุณ"
- Sub: "กรุณารอพนักงานดำเนินการ เราจะแจ้งเตือนทาง LINE เมื่อสัญญาพร้อมแล้ว"
- ปุ่ม: "ติดต่อร้าน" (link to shopPhone)

**Dashboard Screen:**

```
Header: ชื่อลูกค้า | LINE profile picture

Each Account Card:
  ┌─────────────────────────────┐
  │ INS-000001  │ 📱 iPhone 15  │
  │ ผ่อนเป็นงวด                 │
  │ ยอดคงเหลือ: ฿12,500        │
  │ งวดที่: 3/12               │
  │ ค่างวด: ฿2,500/เดือน       │
  │ ครบกำหนด: 1 ก.พ. 2568     │
  │ [สถานะ badge]              │
  └─────────────────────────────┘

Status Badges:
  ● ปกติ (green)
  ● ใกล้ครบกำหนด (orange)  
  ● เกินกำหนด (red)
  ● รอรับเครื่อง (blue)
  
Pending Payment Banner (ถ้ามี):
  ⏳ มีรายการรอตรวจสอบ — ยอด ฿2,500

+ ปุ่ม "เพิ่มสัญญา" (link account)
```

**Detail Screen:**
- ข้อมูลสัญญาครบถ้วน
- Payment history (5 รายการล่าสุด, load more)
- ปุ่ม "แจ้งชำระ" (ถ้า status ไม่ใช่ paid/reversed)

**Payment Form Screen:**

```
เลือกสัญญา (dropdown — ถ้ามีหลายสัญญา)

ยอดที่ต้องชำระ: ฿2,500 (pre-filled แต่ editable)
Max amount hint: "ชำระได้สูงสุด ฿{maxAllowed}"

[แนบสลิป] 
  → เปิด native file picker (camera + gallery)
  → preview thumbnail หลัง select

[ส่งสลิป]
  → Loading state
  → Success / Error
```

**Success Screen:**
- ✅ icon
- "ส่งสลิปเรียบร้อยแล้ว"
- "พนักงานจะตรวจสอบและแจ้งผลทาง LINE"
- ปุ่ม "กลับหน้าหลัก"

### 15.3 LIFF UX Rules

- ทุก action มี loading state + disable button ระหว่าง request
- Error messages แสดงเป็น Thai user-friendly (ไม่แสดง stack trace)
- รองรับ dark mode ตาม LINE theme
- ไม่มี horizontal scroll
- Touch targets ≥ 44px

---

## 16. Data Model

### 16.1 Entity Relationship Overview

```
customers (1) ──── (*) accounts (1) ──── (*) payments
    │                      │
    │               notification_logs
    │
line_profiles (1:1)

staff ──── audit_logs
       └── payments (confirmedBy, rejectedBy)

settings (global KV store)
```

### 16.2 Table Definitions

**`customers`**

| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK, default gen_random_uuid() |
| name | varchar(255) | NOT NULL |
| phone | varchar(20) | NOT NULL |
| phoneNormalized | varchar(15) | NOT NULL, INDEX |
| lineUserId | varchar(100) | UNIQUE, nullable |
| lineDisplayName | varchar(255) | nullable |
| linePictureUrl | text | nullable |
| status | varchar(30) | NOT NULL, default 'active' |
| notes | text | nullable |
| isPending | boolean | NOT NULL, default false |
| createdAt | timestamptz | NOT NULL, default now() |
| updatedAt | timestamptz | NOT NULL, default now() |

**`accounts`**

| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| customerId | UUID | FK → customers.id, NOT NULL, INDEX |
| accountCode | varchar(20) | UNIQUE, NOT NULL, INDEX |
| paymentMode | varchar(20) | NOT NULL — 'installment' / 'savings' |
| deviceModel | varchar(255) | NOT NULL |
| totalPrice | decimal(12,2) | NOT NULL |
| downPayment | decimal(12,2) | NOT NULL, default 0 |
| targetAmount | decimal(12,2) | NOT NULL |
| monthlyPayment | decimal(12,2) | nullable (installment only) |
| totalInstallments | integer | nullable |
| paidInstallments | integer | NOT NULL, default 0 |
| remainingBalance | decimal(12,2) | nullable (installment only) |
| accumulatedAmount | decimal(12,2) | NOT NULL, default 0 |
| lastPaymentDate | timestamptz | nullable |
| dueDate | date | nullable |
| previousDueDate | date | nullable (stored at confirm for reversal) |
| status | varchar(30) | NOT NULL, default 'active' |
| devicePickedUp | boolean | NOT NULL, default false |
| devicePickedUpAt | timestamptz | nullable |
| devicePickedUpBy | varchar(255) | nullable |
| createdAt | timestamptz | NOT NULL, default now() |
| updatedAt | timestamptz | NOT NULL, default now() |

**`payments`**

| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| accountId | UUID | FK → accounts.id, NOT NULL, INDEX |
| customerId | UUID | FK → customers.id, NOT NULL |
| amount | decimal(12,2) | NOT NULL |
| principalAmount | decimal(12,2) | nullable (set at confirm) |
| slipUrl | text | nullable (R2 key, not full URL) |
| status | varchar(30) | NOT NULL — pending_verification/confirmed/rejected/reversed |
| source | varchar(20) | NOT NULL — 'liff' / 'manual' |
| note | text | nullable |
| submittedAt | timestamptz | NOT NULL, default now() |
| confirmedBy | UUID | FK → staff.id, nullable |
| confirmedAt | timestamptz | nullable |
| rejectedBy | UUID | FK → staff.id, nullable |
| rejectedAt | timestamptz | nullable |
| rejectionReason | text | nullable |
| reversedBy | UUID | FK → staff.id, nullable |
| reversedAt | timestamptz | nullable |
| reversalReason | text | nullable |
| overdueDays | integer | NOT NULL, default 0 |
| calculatedPenalty | decimal(12,2) | NOT NULL, default 0 |
| penaltyAction | varchar(20) | nullable — full/reduced/waived |
| penaltyCollected | decimal(12,2) | NOT NULL, default 0 |
| penaltyAdjustedBy | UUID | FK → staff.id, nullable |
| penaltyAdjustedAt | timestamptz | nullable |
| previousDueDate | date | nullable (snapshot ตอน confirm) |
| createdAt | timestamptz | NOT NULL, default now() |

**Index:**
- `(accountId, status)` — สำหรับ pending lock check
- `(status, createdAt)` — สำหรับ slip queue

**`staff`**

| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| username | varchar(100) | UNIQUE, NOT NULL |
| passwordHash | text | NOT NULL |
| displayName | varchar(255) | NOT NULL |
| role | varchar(20) | NOT NULL — admin/staff/viewer |
| isActive | boolean | NOT NULL, default true |
| lastLoginAt | timestamptz | nullable |
| createdAt | timestamptz | NOT NULL |

**`notification_logs`**

| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| accountId | UUID | FK → accounts.id, nullable |
| customerId | UUID | FK → customers.id, NOT NULL |
| lineUserId | varchar(100) | NOT NULL |
| notificationType | varchar(50) | NOT NULL |
| status | varchar(20) | NOT NULL |
| errorMessage | text | nullable |
| messageId | varchar(100) | nullable |
| metadata | jsonb | nullable |
| createdAt | timestamptz | NOT NULL, default now() |

**`audit_logs`**

| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| action | varchar(50) | NOT NULL, INDEX |
| entityType | varchar(50) | NOT NULL |
| entityId | UUID | NOT NULL, INDEX |
| performedBy | UUID | FK → staff.id, NOT NULL |
| performedAt | timestamptz | NOT NULL, default now() |
| metadata | jsonb | NOT NULL |

**`settings`**

| Column | Type | Constraints |
|---|---|---|
| key | varchar(100) | PK |
| value | text | NOT NULL |
| description | text | nullable |
| updatedAt | timestamptz | NOT NULL |
| updatedBy | UUID | FK → staff.id |

**`pending_customers`**

| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| lineUserId | varchar(100) | nullable |
| phone | varchar(20) | NOT NULL |
| phoneNormalized | varchar(15) | NOT NULL |
| accountCodeAttempted | varchar(20) | NOT NULL |
| resolvedAt | timestamptz | nullable |
| resolvedBy | UUID | FK → staff.id, nullable |
| createdAt | timestamptz | NOT NULL |

---

## 17. API Specification

### 17.1 LIFF Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/liff/me` | LINE Token | ตรวจสอบ KYC status |
| POST | `/api/liff/kyc` | LINE Token | ยืนยันตัวตน |
| GET | `/api/liff/accounts` | LINE Token | ดูสัญญาทั้งหมด |
| GET | `/api/liff/accounts/:id` | LINE Token | ดูรายละเอียดสัญญา |
| GET | `/api/liff/accounts/:id/payments` | LINE Token | payment history |
| POST | `/api/liff/accounts/link` | LINE Token | เพิ่มรหัสสัญญา |
| POST | `/api/liff/payments` | LINE Token | แจ้งชำระ + ส่งสลิป |

### 17.2 Admin Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/admin/auth/login` | - | Login |
| POST | `/api/admin/auth/logout` | Session | Logout |
| GET | `/api/admin/dashboard` | Session | KPI + summary |
| GET | `/api/admin/customers` | Session | List + search |
| POST | `/api/admin/customers` | Admin | สร้างลูกค้าใหม่ |
| GET | `/api/admin/customers/:id` | Session | Customer detail |
| PATCH | `/api/admin/customers/:id` | Admin | แก้ไขลูกค้า |
| POST | `/api/admin/customers/:id/accounts` | Admin | เพิ่มสัญญา |
| PATCH | `/api/admin/accounts/:id` | Admin | แก้ไขสัญญา |
| GET | `/api/admin/payments/queue` | Session | Slip queue |
| GET | `/api/admin/payments/:id/slip` | Session | Slip signed URL |
| POST | `/api/admin/payments/:id/confirm` | Staff/Admin | Confirm payment |
| POST | `/api/admin/payments/:id/reject` | Staff/Admin | Reject payment |
| POST | `/api/admin/payments/:id/reverse` | Admin | Reverse payment |
| POST | `/api/admin/payments/manual` | Staff/Admin | Manual payment |
| GET | `/api/admin/payments` | Session | Payment ledger |
| GET | `/api/admin/reports/:tab` | Session | Report data |
| GET | `/api/admin/reports/:tab/export` | Staff/Admin | Export CSV/XLSX |
| POST | `/api/admin/accounts/:id/pickup` | Staff/Admin | Mark picked up |
| GET | `/api/admin/settings` | Admin | อ่าน settings |
| PATCH | `/api/admin/settings` | Admin | อัปเดต settings |
| GET | `/api/admin/staff` | Admin | List staff |
| POST | `/api/admin/staff` | Admin | สร้าง staff |
| PATCH | `/api/admin/staff/:id` | Admin | แก้ไข staff / role |
| DELETE | `/api/admin/staff/:id` | Admin | deactivate staff |

### 17.3 Webhook

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/webhook/line` | HMAC Signature | LINE events |

### 17.4 Error Response Format

```json
{
  "error": "error_code",
  "message": "Human readable message in Thai",
  "details": {} // optional additional context
}
```

**Common Error Codes:**

| Code | HTTP | ความหมาย |
|---|---|---|
| `unauthorized` | 401 | ไม่มี session / token ไม่ถูกต้อง |
| `forbidden` | 403 | Role ไม่มีสิทธิ์ |
| `not_found` | 404 | ไม่พบข้อมูล |
| `account_already_linked` | 409 | สัญญาผูก LINE อื่นแล้ว |
| `pending_exists` | 409 | มี pending payment อยู่แล้ว |
| `payment_already_processed` | 409 | Payment ถูก process แล้ว |
| `amount_exceeds_balance` | 422 | ยอดเกิน remaining balance |
| `amount_exceeds_target` | 422 | ยอดเกิน savings target |
| `invalid_file_type` | 422 | ไฟล์ไม่ใช่รูปภาพ |
| `file_too_large` | 422 | ไฟล์เกิน 5MB |
| `validation_error` | 422 | ข้อมูลไม่ถูกต้อง |

---

## 18. System Settings

Settings เก็บใน `settings` table — Admin เปลี่ยนได้ผ่าน Dashboard

| Key | Type | Default | Description |
|---|---|---|---|
| `shop_name` | string | "ร้านของเรา" | ชื่อร้าน |
| `shop_phone` | string | "" | เบอร์โทรร้าน |
| `shop_hours` | string | "" | เวลาทำการ |
| `shop_address` | string | "" | ที่อยู่ร้าน |
| `billing_cycle_day` | integer | 1 | วันที่ตัดยอดทุกเดือน (1-28) |
| `penalty_rate_per_day` | decimal | 100 | ค่าปรับต่อวัน (บาท) |
| `inactive_threshold_days` | integer | 30 | วันที่ไม่ชำระก่อน mark inactive (savings) |
| `pre_due_reminder_days` | integer | 3 | ส่ง reminder กี่วันก่อน due |
| `liff_id` | string | "" | LINE LIFF ID |
| `line_channel_id` | string | "" | LINE Channel ID |
| `line_channel_secret` | string | "" | LINE Channel Secret (encrypted at rest) |
| `line_channel_access_token` | string | "" | LINE Channel Access Token (encrypted at rest) |
| `r2_bucket_name` | string | "" | Cloudflare R2 bucket |
| `session_ttl_hours` | integer | 8 | Admin session TTL |
| `max_login_attempts` | integer | 5 | Login rate limit |

**Sensitive values** (line secrets, r2 credentials) ต้อง encrypt ก่อนเก็บ (AES-256-GCM)

---

## 19. Non-Functional Requirements

### 19.1 Performance

| Metric | Target |
|---|---|
| API response time (p95) | < 500ms |
| LINE webhook response | < 1,000ms (ส่ง 200 OK ทันที) |
| LIFF initial load | < 3s (LTE) |
| Slip upload | < 10s (5MB file) |
| Dashboard load | < 2s |

### 19.2 Security

- HTTPS everywhere (no HTTP in production)
- LINE webhook signature verification (mandatory)
- LINE ID Token verification (ไม่ trust client-side UID)
- SQL injection protection (Drizzle ORM parameterized queries)
- Sensitive files ใน R2 ต้อง access ผ่าน signed URL เท่านั้น (ไม่ public)
- Admin passwords: argon2id
- Sensitive settings: encrypted at rest
- Session: httpOnly, Secure, SameSite=Strict cookies
- Rate limiting บน login endpoint
- Magic bytes validation สำหรับไฟล์อัปโหลด

### 19.3 Reliability

- DB transactions สำหรับทุก balance mutation
- Row-level locking ป้องกัน double-confirm
- LINE push failure ไม่ affect payment flow
- Retry logic สำหรับ R2 uploads (3 retries, exponential backoff)

### 19.4 Observability

- Structured JSON logging (ทุก API request/response)
- Error tracking (Sentry หรือ equivalent)
- Notification failure tracking ผ่าน notification_logs
- Audit trail ครบสำหรับทุก balance mutation

### 19.5 Scalability (v1 scope)

- Single shop, single branch
- PostgreSQL connection pooling (PgBouncer)
- ออกแบบ DB schema รองรับ multi-branch ในอนาคต (เพิ่ม `branchId` field ได้)

---

## 20. Open Decisions Log

| # | คำถาม | Resolution | หมายเหตุ |
|---|---|---|---|
| 1 | Multiple pending per account | Lock: แสดง warning + block submission ถ้ามี pending อยู่ | 1 pending per account |
| 2 | Payment reversal | ✅ Admin only, require reason, audit trail, push LINE | ไม่มี time limit |
| 3 | จ่ายเกินยอดคงเหลือ | ✅ ห้าม: validate ก่อน, reject ถ้ายอดเกิน | ทั้ง installment + savings |
| 4 | ค่าปรับก่อนเงินต้น | ✅ Option A: ตัดค่าปรับก่อน, เหลือตัดเงินต้น | บันทึกแยก principalAmount |
| 5 | แจ้ง pending_customer | ✅ Push LINE เมื่อ admin สร้างสัญญา | |
| 6 | dueDate recalc | ✅ Fixed cycle: วันที่ 1 ของเดือน (configurable) | billing_cycle_day setting |
| 7 | Pre-due reminder | ✅ 3 วันก่อน (configurable via settings) | pre_due_reminder_days |
| 8 | Savings overpay | ✅ Block: ไม่รับยอดที่เกิน targetAmount | แสดง max amount hint |
| 9 | Staff + penalty action | ✅ Staff เลือก penalty action ได้ | Admin เท่านั้นที่ reverse |
| 10 | Savings status | ✅ ใช้ inactive (ไม่ใช่ overdue) | overdue เฉพาะ installment |
| 11 | Reminder dedup | ✅ 1 ครั้งต่อ billing cycle per account | event-driven ไม่ dedup |
| 12 | Penalty reason required | ✅ ไม่ required สำหรับ full/waived, required สำหรับ reduced | admin กรอก optional note |

---

## 21. Architecture & Tech Stack

### 21.1 Tech Stack

| Layer | Technology |
|---|---|
| API Runtime | Bun |
| API Framework | Hono.js |
| Admin Frontend | Next.js 14 (App Router) |
| Customer Frontend | Vite + React |
| ORM | Drizzle ORM |
| Database | PostgreSQL 16 |
| File Storage | Cloudflare R2 |
| Styling | Tailwind CSS + shadcn/ui |
| Container | Docker / Podman |
| Deploy | DigitalOcean |

### 21.2 Environment Variables

```env
# Database
DATABASE_URL=postgresql://...

# LINE
LINE_CHANNEL_ID=
LINE_CHANNEL_SECRET=
LINE_CHANNEL_ACCESS_TOKEN=
LINE_LIFF_ID=

# Cloudflare R2
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_URL=

# App
APP_SECRET_KEY=         # session signing
SETTINGS_ENCRYPTION_KEY= # AES key for sensitive settings
NODE_ENV=production
```

### 21.3 Deployment Architecture

```
DigitalOcean Droplet
  ├── Nginx (reverse proxy + SSL termination)
  │     ├── /api → pawn-api (Bun, port 3001)
  │     ├── /admin → pawn-admin (Next.js, port 3000)
  │     └── /liff → pawn-liff (Nginx static, port 3002)
  ├── PostgreSQL (port 5432, internal only)
  └── Certbot (Let's Encrypt SSL)

Cloudflare
  ├── R2 (slip storage)
  └── DNS
```


---
*Document End — Version 1.0.0*