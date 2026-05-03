# PAWN — Mobile Installment Payment System PRD v1

## Overview

LINE OA + LIFF Installment Payment System สำหรับร้านมือถือ Single-shop, Single-branch
ลูกค้าใช้งานผ่าน LINE LIFF เป็นแอปหลักโดยไม่ต้องติดตั้งแอปเพิ่ม
Admin ใช้งานผ่าน Web Dashboard

Monorepo: 3 Apps — `pawn-api` (Hono/Bun), `pawn-admin` (Next.js 14), `pawn-liff` (Vite + React)

---

## 1. User Roles

| Role | หน้าที่ |
|---|---|
| ลูกค้า | Add LINE, ยืนยันตัวตนผ่าน LIFF, ดูยอด/งวด, แจ้งชำระ, รับแจ้งเตือน |
| Admin | จัดการทุกอย่างในระบบ |
| Staff | ตรวจสลิป, บันทึกชำระ, ดูลูกค้า, จัดการค่าปรับ |
| Viewer | ดูข้อมูลและรายงานเท่านั้น |
| ระบบอัตโนมัติ | แจ้งเตือน LINE, คำนวณค้างจ่าย, คำนวณค่าปรับ, อัปเดตสถานะ |

---

## 2. LINE OA Setup

### 2.1 Rich Menu

ต้องมีเมนูให้ลูกค้าใช้งานแทนการติดตั้งแอป

| เมนู | Action | หมายเหตุ |
|---|---|---|
| Dashboard | เปิด LIFF | ดูบัญชี/สัญญาทั้งหมด |
| แจ้งชำระ | เปิด LIFF | เลือกสัญญา + ส่งสลิป |
| เช็กยอด | postback `check_balance` | แสดง Flex Message ยอดคงเหลือ/สะสม |
| ติดต่อเจ้าหน้าที่ | postback `contact_staff` | แสดงข้อมูลติดต่อร้าน |

Design: 2 columns top, 1 column bottom, background `#00B900`, text `#FFFFFF`

### 2.2 LINE LIFF App

- เปิดผ่าน LINE LIFF เท่านั้น
- ต้อง init LIFF + login guard ก่อนแสดง UI
- ใช้ LINE ID Token ยืนยันตัวตนกับ backend
- LIFF endpoint ต้องเป็น HTTPS (ngrok/Cloudflare Tunnel สำหรับ dev)

### 2.3 LINE Webhook

- ต้อง verify `x-line-signature` ก่อน process ทุก event
- ต้อง return `200 OK` ภายใน 1 วินาที (process events async)
- `replyMessage` ใช้กับ immediate response เท่านั้น (replyToken หมดอายุ 30s)
- `pushMessage` ใช้กับ async flows (admin confirm/reject, reminder)

---

## 3. ระบบยืนยันตัวตน (KYC / Onboarding)

### 3.1 First-time Onboarding

ลูกค้าต้องกรอก 2 ข้อมูล:
- **เบอร์มือถือ** — ที่ลงทะเบียนกับร้าน
- **รหัสผ่อนหรือรหัสออม 1 รายการ** — `INS-XXXXXX` หรือ `SAV-XXXXXX`

ระบบต้องตรวจสอบ:
- เบอร์และรหัสตรงกันในระบบ → ผูก LINE UID กับรหัสนั้น
- รหัสนั้นถูกผูกกับ LINE UID อื่นแล้ว → ปฏิเสธ (409 Conflict)
- ไม่พบข้อมูล → เก็บเป็น `pending_customer` (รอ admin สร้างสัญญา)

### 3.2 Adding More Codes Later

ลูกค้าที่ผ่าน onboarding แล้วสามารถเพิ่มรหัสอื่นได้จากหน้า Dashboard:
- ระบบต้องตรวจ `เบอร์ + รหัส` ว่าตรงกันก่อนผูก
- ห้าม auto-link ทุกรหัสที่ใช้เบอร์เดียวกันโดยไม่ยืนยัน

### 3.3 KYC Flow

```
LIFF opens → init + login → get ID token → GET /api/liff/me
  ├── status: needs_kyc → แสดงหน้า KYC (กรอกเบอร์ + รหัส)
  ├── status: pending_customer → แสดงหน้าแจ้งรอ admin
  └── status: linked → แสดง Dashboard
```

---

## 4. ระบบบัญชี (Accounts / Contracts)

### 4.1 รหัส Prefix

| ประเภท | Prefix | ตัวอย่าง |
|---|---|---|
| ผ่อนเป็นงวด (Installment) | `INS` | `INS-000001` |
| ออมมือถือ (Savings) | `SAV` | `SAV-000001` |

รหัสต้อง unique ทั้งระบบ ระบบรู้ประเภทจาก field `paymentMode` ใน DB (ไม่ rely prefix alone)

### 4.2 Customer Entity

| Field | Type | Required |
|---|---|---|
| id | UUID | PK |
| name | string | Yes |
| phone | string | Yes |
| phoneNormalized | string | Yes |
| lineUserId | string | nullable |
| lineDisplayName | string | nullable |
| status | active/paid/overdue/due_soon/ready_for_pickup | Yes |
| createdAt | timestamp | Yes |
| updatedAt | timestamp | Yes |

### 4.3 Account/Contract Entity

| Field | Type | Required |
|---|---|---|
| id | UUID | PK |
| customerId | UUID FK | Yes |
| accountCode | string (unique) | Yes |
| paymentMode | savings / installment | Yes |
| deviceModel | string | Yes |
| totalPrice | decimal | Yes |
| downPayment | decimal | Yes |
| targetAmount | decimal | Yes (ใช้กับ savings) |
| monthlyPayment | decimal | installment only |
| totalInstallments | integer | installment only |
| paidInstallments | integer | installment only |
| remainingBalance | decimal | installment only |
| accumulatedAmount | decimal | savings only |
| lastPaymentDate | timestamp | Yes |
| dueDate | date | nullable (installment) / null (savings) |
| status | active/overdue/paid/due_soon/ready_for_pickup | Yes |
| devicePickedUp | boolean | default false |
| devicePickedUpAt | timestamp | nullable |
| devicePickedUpBy | string | nullable |
| createdAt | timestamp | Yes |
| updatedAt | timestamp | Yes |

Relation: 1 Customer มี many Accounts

---

## 5. โหมดการชำระเงิน

### 5.1 ออมมือถือ (Savings — `SAV`)

- ลูกค้าจ่ายยอดไม่ตายตัวตามสะดวก
- ทุก payment ที่ admin confirm → บวก `accumulatedAmount`
- ไม่มีค่างวดตายตัว
- ไม่มีค่าปรับอัตโนมัติ (TBD)
- ใช้วันที่ชำระล่าสุด (`lastPaymentDate`) เพื่อตรวจ inactive
- เมื่อ `accumulatedAmount >= targetAmount` → status เป็น `ready_for_pickup`
- Admin mark `devicePickedUp = true` เมื่อลูกค้ามารับเครื่อง

**Wait Decision:**
- ออมมือถือมี due date หรือไม่
- ถ้าไม่มี due date inactive threshold กี่วัน (default: 30)

### 5.2 ผ่อนเป็นงวด (Installment — `INS`)

- มีค่างวดต่อรอบ (`monthlyPayment`)
- มีวันครบกำหนด (`dueDate`)
- เมื่อ admin confirm → ตัด `remainingBalance`, เพิ่ม `paidInstallments`
- ตรวจค้างชำระจาก `dueDate`
- เมื่อ `remainingBalance <= 0` → status เป็น `ready_for_pickup`

**Wait Decision:**
- ลูกค้าสามารถจ่ายเกินยอดคงเหลือได้ไหม
- ค่าปรับต้องบังคับจ่ายก่อนตัดเงินต้นหรือไม่

---

## 6. ระบบแจ้งชำระเงิน

### 6.1 Customer Submits Payment (LIFF)

Flow:
1. ลูกค้าเลือกสัญญาจาก Dashboard
2. กรอกยอดโอน + แนบสลิป
3. Submit → POST `/api/liff/payments` (multipart/form-data)
4. Backend เก็บ payment เป็น `pending_verification`
5. สลิปอัปโหลดไป Cloudflare R2 (magic bytes MIME validation)
6. **ห้ามตัดยอดทันที**
7. แสดง Success Screen: "รอพนักงานตรวจสอบสลิป"

Validation:
- File: jpeg, png, heic | max 5MB
- Amount: > 0, max 2 decimals
- Auth: LINE ID Token required

### 6.2 Admin Review Flow

Admin sees slip queue → clicks slip image (lightbox) → action:
- **Confirm**: DB transaction (deduct/add balance + mark payment confirmed) → push LINE Flex Message
- **Reject**: mark payment rejected + reason → push LINE message

### 6.3 Manual Payment Entry (Admin)

Admin บันทึกการชำระเองกรณีลูกค้าจ่ายหน้าร้าน:
- เลือกลูกค้า/สัญญา
- กรอกยอด
- ไม่ต้องใช้สลิป (optional)
- ยืนยันทันที → ตัดยอด + ส่ง LINE message

---

## 7. ระบบตัดยอดอัตโนมัติ

### 7.1 Confirm Payment Transaction

ต้องทำใน `db.transaction()` เดียว:
1. ตรวจ `payment.status === 'pending_verification'` (กัน confirm ซ้ำ)
2. ตรวจยอดไม่เกินเงื่อนไข (ไม่ติดลบสำหรับ installment)
3. อัปเดต Account:
   - **Installment**: `remainingBalance -= amount`, `paidInstallments += 1`, คำนวณ `dueDate` ใหม่
   - **Savings**: `accumulatedAmount += amount`, `lastPaymentDate = now`
4. อัปเดต payment: `status = 'confirmed'`, `confirmedBy`, `confirmedAt`
5. ถ้าชำระครบ: status → `ready_for_pickup`

### 7.2 LINE Push หลัง Confirm

- สำเร็จ: push Flex Message (ยอดที่ชำระ, ยอดคงเหลือ/สะสม, งวดถัดไป)
- ปฏิเสธ: push text message (ยอด, เหตุผล)
- LINE push failure **ห้าม rollback payment**

---

## 8. ระบบค่าปรับ (Penalty)

### 8.1 กฎค่าปรับ

- ใช้กับ **Installment เท่านั้น**
- ค่าปรับ = จำนวนวันที่เกินกำหนด × 100 บาท/วัน
- จำนวนวันที่เกิน: `dueDate` ถึงวันที่ admin ตรวจ
- ห้ามติดลบ

### 8.2 Admin Penalty Actions

Admin ต้องเลือก 1 ใน 3 เมื่อ confirm payment ที่ overdue:

| Action | ความหมาย |
|---|---|
| **full** | เก็บค่าปรับเต็มตามที่ระบบคำนวณ |
| **reduced** | ลดค่าปรับ — admin กรอกยอดที่เก็บจริง |
| **waived** | ยกเว้นค่าปรับ — ไม่เก็บเลย |

### 8.3 Penalty Data Fields

| Field | Type |
|---|---|
| overdueDays | integer |
| calculatedPenalty | decimal |
| penaltyAction | full / reduced / waived |
| penaltyCollected | decimal |
| penaltyAdjustedBy | string |
| penaltyAdjustedAt | timestamp |

ค่าปรับที่เก็บต้องบันทึกแยกจากยอดเงินต้นใน payment record เพื่อให้รายงานแยกประเภทได้

---

## 9. ระบบแจ้งเตือน LINE (Notification)

### 9.1 Reminder Types

| ประเภท | กำหนดส่ง | หมายเหตุ |
|---|---|---|
| Overdue Reminder | หลังเลย due date 1 วัน | ส่งเพียงครั้งเดียว |
| Payment Confirmed | หลัง admin confirm | Immediate push |
| Payment Rejected | หลัง admin reject | Immediate push |
| Ready for Pickup | เมื่อ status เปลี่ยนเป็น ready_for_pickup | Immediate push |

### 9.2 Notification Log

ทุกการส่งต้องบันทึก:

| Field | Type |
|---|---|
| id | UUID |
| accountId | UUID FK |
| lineUserId | string |
| notificationType | enum |
| status | success / failed |
| errorMessage | string (nullable) |
| createdAt | timestamp |

ใช้ป้องกันส่งซ้ำในวันเดียวกันสำหรับ reminder ประเภทเดียวกัน

### 9.3 Execution

- Scheduled job หรือ cron endpoint
- Admin ควรมองเห็น notification history ได้ในอนาคต

---

## 10. Admin Web Dashboard

### 10.1 Auth

- Login ด้วย username/password
- Password hashed (bcrypt/argon2)
- Session-based (cookie)
- Mutation endpoints require session
- No public mutation endpoints

### 10.2 Roles

| Role | สิทธิ์ |
|---|---|
| Admin | ทุกอย่าง |
| Staff | ตรวจสลิป, บันทึกชำระ, ดูลูกค้า, จัดการค่าปรับ |
| Viewer | ดูข้อมูลและรายงานอย่างเดียว (read-only) |

### 10.3 Dashboard Home

KPI Cards:
- ลูกค้าทั้งหมด (active)
- ลูกค้าเกินกำหนด (overdue)
- ลูกค้าถึงกำหนดวันนี้
- สลิปรอตรวจ (pending verification)
- รายรับวันนี้
- รายรับเดือนนี้
- ลูกค้าพร้อมรับเครื่อง

Charts:
- Weekly revenue bar chart

List:
- Due Today customers
- Recent activity timeline

### 10.4 Customer Management

ค้นหาจาก: เบอร์, รหัสบัญชี, ชื่อ
Filter: status, paymentMode

CRUD:
- เพิ่มลูกค้าใหม่
- เพิ่มบัญชี/สัญญาใหม่
- แก้ไขข้อมูล (เบอร์, due date, ฯลฯ)
- ดูรายละเอียด + payment history + slip images
- ผูก/ยกเลิก LINE UID

### 10.5 Slip Queue

- ตารางรายการ `pending_verification` เรียงตามเวลา
- Click รูปสลิป → Lightbox ขยาย
- ปุ่ม Confirm / Reject
- Confirm: เลือก penalty action (ถ้ามีค่าปรับ)
- Reject: กรอกเหตุผล

### 10.6 Payment Ledger

- ตาราง payment ทั้งหมด
- Filter: วันที่, status, ประเภท
- ดูรายละเอียด payment รายตัว

---

## 11. ระบบรายงาน (Reports)

### 11.1 Report Tabs

| Tab | คำอธิบาย |
|---|---|
| ถึงกำหนดจ่าย | ลูกค้า installment ที่ due date = today |
| เกินกำหนดจ่าย | ลูกค้า installment ที่ overdue (due date past, not paid) |
| ค่าปรับ | ลูกค้า overdue พร้อมค่าปรับที่คำนวณ + เลือก penalty action |
| หายจากการออม | ลูกค้า savings ที่ไม่ได้จ่ายเกินกำหนด (default 30 วัน) |
| รายรับ | Revenue summary: daily/monthly breakdown |
| พร้อมรับเครื่อง | ลูกค้าที่ชำระครบแต่ยังไม่ mark picked up |

### 11.2 Revenue Report

- Daily receipt: count + total per day
- Monthly receipt: count + total per month
- Bar chart visualization
- Export: Excel (xlsx)

### 11.3 Export

- CSV download สำหรับแต่ละ report tab
- Excel download สำหรับรายรับ

---

## 12. Client LIFF Dashboard

### 12.1 Screens

| Screen | Description |
|---|---|
| Loading | LIFF init + ID token check |
| KYC Phone | กรอกเบอร์ + รหัสบัญชี |
| KYC Profile | ถ้าไม่พบข้อมูล → กรอกชื่อ/วันเกิด (pending) |
| Pending Customer | แจ้งว่าไม่มีสัญญา รอ admin สร้าง |
| Dashboard | รายการบัญชี/สัญญาทั้งหมดที่ผูกไว้ |
| Detail | รายละเอียดสัญญา + payment history |
| Payment Form | แจ้งชำระ: เลือกบัญชี, ยอด, แนบสลิป |
| Success | ส่งสลิปสำเร็จ |
| Error | แสดง error |

### 12.2 Dashboard Content

แต่ละ Account แสดง:
- รหัส (INS-xxx / SAV-xxx)
- ประเภท (ออมมือถือ / ผ่อนเป็นงวด)
- รุ่นมือถือ
- ยอดคงเหลือ (installment) หรือยอดสะสม/เป้าหมาย (savings)
- ค่างวด (installment only)
- งวดที่จ่ายแล้ว/ทั้งหมด (installment only)
- วันครบกำหนดถัดไป (installment only)
- สถานะ: ปกติ, ใกล้ครบกำหนด, เกินกำหนด, ชำระครบ, พร้อมรับเครื่อง

---

## 13. Data Entities Summary

| Entity | Table | Purpose |
|---|---|---|
| Customer | customers | ข้อมูลลูกค้า |
| Account | accounts | บัญชีออม/สัญญาผ่อน |
| Payment | payments | รายการชำระ |
| Line Profile | line_profiles | LINE UID + profile |
| Staff | staff | ผู้ใช้งาน admin |
| Notification Log | notification_logs | ประวัติส่ง LINE |
| Settings | settings | ค่าตั้งค่าร้าน |
| Penalty | (embedded in payments) | ข้อมูลค่าปรับ |

---

## 14. API Endpoints

### 14.1 LIFF (Auth: Bearer ID Token)

| Method | Path | Purpose |
|---|---|---|
| GET | /api/liff/me | Get LIFF session status + accounts |
| POST | /api/liff/kyc/phone | Submit phone + account code |
| POST | /api/liff/kyc/profile | Submit pending customer profile |
| GET | /api/liff/accounts/:id | Get account detail + payments |
| POST | /api/liff/payments | Submit payment with slip |
| POST | /api/liff/link | Add another account code |

### 14.2 Admin

| Method | Path | Purpose |
|---|---|---|
| POST | /api/admin/login | Login |
| POST | /api/admin/logout | Logout |
| GET | /api/admin/me | Current staff session |
| GET | /api/dashboard | Dashboard stats |
| GET | /api/customers | List/search customers |
| GET | /api/customers/:id | Customer detail |
| POST | /api/customers | Create customer |
| PATCH | /api/customers/:id | Update customer |
| GET | /api/payments | List pending payments |
| POST | /api/payments | Manual payment entry |
| POST | /api/payments/:id/confirm | Confirm payment |
| POST | /api/payments/:id/reject | Reject payment |
| GET | /api/reports/due | Due customers |
| GET | /api/reports/overdue | Overdue customers |
| GET | /api/reports/penalty | Penalty customers |
| GET | /api/reports/inactive-savings | Inactive savings |
| GET | /api/reports/revenue | Revenue summary |
| GET | /api/reports/ready-pickup | Ready for pickup |
| GET | /api/reports/export | Excel export |
| POST | /api/notifications/send | Trigger reminder send |

### 14.3 LINE Webhook

| Method | Path | Purpose |
|---|---|---|
| POST | /webhook | Receive LINE events |

---

## 15. Security Requirements

- LINE webhook: verify `x-line-signature` ทุก request
- LIFF endpoints: verify LINE ID Token ทุก request
- Admin: session-based auth, password hashed
- File uploads: MIME validated from magic bytes, max 5MB
- No hardcoded secrets — all from env vars
- Mutation endpoints must not be public
- SQL: parameterized queries only (Drizzle ORM)
- Balance update: use `sql` tagged template for atomic arithmetic
- Confirm payment: single DB transaction, check status inside tx

---

## 16. Two-Payment Flow (Safety)

```
Customer submits → status: pending_verification
  Balance: unchanged
  Slip: uploaded to R2

Admin confirms → DB transaction:
  1. Validate payment.status === pending_verification
  2. Validate balance won't go negative
  3. Update account balance
  4. Update payment: confirmed
  5. Push LINE Flex Message (best-effort, no rollback)

Admin rejects:
  1. Update payment: rejected + reason
  2. Push LINE text message
  Balance: unchanged
```

---

## 17. MVP Implementation Phases

### Phase 1: Core Flow
- LINE LIFF onboarding (phone + account code)
- Client dashboard (account list, detail, payment history)
- Payment submission with slip upload (R2)
- Admin slip queue (confirm/reject)
- Balance deduction (installment) / accumulation (savings)
- LINE confirm/reject push messages
- Penalty calculation + admin action (full/reduced/waived)
- Admin auth (username/password)

### Phase 2: Reports + Notifications
- All 6 report tabs with real data
- Revenue daily/monthly with Excel export
- LINE overdue reminder (D+1, once)
- Notification log
- Ready for pickup → device picked up flow

### Phase 3: Polish
- LINE reminder before due date (TBD)
- Manual payment entry by admin
- Payment ledger / audit log
- Staff roles (Admin/Staff/Viewer)
- Shop settings config

---

## 18. Open Decisions (Need Confirmation)

| # | Question | Status |
|---|---|---|
| 1 | ออมมือถือมี due date หรือไม่ | Wait |
| 2 | ถ้าไม่มี due date → inactive threshold default กี่วัน | 30 days |
| 3 | ลูกค้าสามารถจ่ายเกินยอดคงเหลือได้ไหม | Wait |
| 4 | ค่าปรับต้องบังคับจ่ายก่อนตัดเงินต้นหรือไม่ | Wait |
| 5 | ต้องแจ้งเตือนก่อน due date กี่วัน | TBD |
| 6 | วันครบกำหนดต้องส่ง reminder ด้วยไหม | TBD |
| 7 | Admin ยกเว้น/ลดค่าปรับต้องบังคับกรอกเหตุผลไหม | TBD |
| 8 | ข้อความแจ้งเตือนใช้ template ทางการหรือกันเอง | TBD |

---

## 19. Success Criteria

- [ ] ลูกค้า add LINE → ยืนยันตัวตนด้วยเบอร์ + รหัส → เข้า Dashboard ได้
- [ ] 1 LINE UID รองรับหลายรหัส, 1 เบอร์รองรับหลายรหัส
- [ ] แจ้งชำระผ่าน LIFF → ขึ้น pending → admin confirm → ตัดยอด → LINE push
- [ ] ค่าปรับคำนวณอัตโนมัติ + admin action (full/reduced/waived)
- [ ] สลิปเก็บใน R2, MIME validated จาก magic bytes
- [ ] Confirm ต้องทำใน transaction, ไม่ confirm ซ้ำ, ไม่ทำให้ยอดติดลบ
- [ ] LINE webhook verify signature, return 200 in <1s
- [ ] Overdue reminder ส่ง D+1 ครั้งเดียว, ไม่ส่งซ้ำ
- [ ] Admin report ครบ 6 tabs + Excel export
- [ ] Admin auth with username/password
- [ ] TypeScript strict: no `any`, `bun run typecheck` passes
