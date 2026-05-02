import { db } from './index.ts';
import { customers, payments } from './schema.ts';
import { sql } from 'drizzle-orm';
import { normalizePhone } from '../services/liff.service.ts';

const CUSTOMER_SEEDS = [
  { installmentCode: 'P001', name: 'สมชาย ใจดี', phone: '0812345678', totalPrice: '30000', downPayment: '5000', monthlyPayment: '2500', totalInstallments: 10, paidInstallments: 3, remainingBalance: '17500', status: 'active' as const, dueDate: '2026-06-01' },
  { installmentCode: 'P002', name: 'สมหญิง รักเรียน', phone: '0823456789', totalPrice: '25000', downPayment: '3000', monthlyPayment: '2200', totalInstallments: 10, paidInstallments: 5, remainingBalance: '11000', status: 'active' as const, dueDate: '2026-05-15' },
  { installmentCode: 'P003', name: 'วิชัย มั่นคง', phone: '0834567890', totalPrice: '45000', downPayment: '10000', monthlyPayment: '3500', totalInstallments: 10, paidInstallments: 8, remainingBalance: '7000', status: 'active' as const, dueDate: '2026-05-20' },
  { installmentCode: 'P004', name: 'นภา แสงจันทร์', phone: '0845678901', totalPrice: '20000', downPayment: '2000', monthlyPayment: '1800', totalInstallments: 10, paidInstallments: 2, remainingBalance: '16400', status: 'active' as const, dueDate: '2026-06-10' },
  { installmentCode: 'P005', name: 'ธนกร เจริญสุข', phone: '0856789012', totalPrice: '35000', downPayment: '5000', monthlyPayment: '3000', totalInstallments: 10, paidInstallments: 4, remainingBalance: '18000', status: 'active' as const, dueDate: '2026-06-05' },
  { installmentCode: 'P006', name: 'ปรียา ดีงาม', phone: '0867890123', totalPrice: '28000', downPayment: '4000', monthlyPayment: '2400', totalInstallments: 10, paidInstallments: 6, remainingBalance: '9600', status: 'active' as const, dueDate: '2026-05-25' },
  { installmentCode: 'P007', name: 'กิตติ พงษ์เสถียร', phone: '0878901234', totalPrice: '50000', downPayment: '15000', monthlyPayment: '3500', totalInstallments: 10, paidInstallments: 1, remainingBalance: '31500', status: 'active' as const, dueDate: '2026-06-15' },
  { installmentCode: 'P008', name: 'รัตนา สุขสันต์', phone: '0889012345', totalPrice: '22000', downPayment: '3000', monthlyPayment: '1900', totalInstallments: 10, paidInstallments: 7, remainingBalance: '5700', status: 'active' as const, dueDate: '2026-05-30' },
  { installmentCode: 'P009', name: 'สุรชัย บุญมาก', phone: '0890123456', totalPrice: '32000', downPayment: '6000', monthlyPayment: '2600', totalInstallments: 10, paidInstallments: 0, remainingBalance: '26000', status: 'active' as const, dueDate: '2026-06-20' },
  { installmentCode: 'P010', name: 'จันทร์เพ็ญ แก้วใส', phone: '0801234567', totalPrice: '40000', downPayment: '8000', monthlyPayment: '3200', totalInstallments: 10, paidInstallments: 9, remainingBalance: '3200', status: 'active' as const, dueDate: '2026-05-10' },
  { installmentCode: 'P011', name: 'พิชัย ศรีสุข', phone: '081-234-5679', totalPrice: '27000', downPayment: '4000', monthlyPayment: '2300', totalInstallments: 10, paidInstallments: 3, remainingBalance: '16100', status: 'active' as const, dueDate: '2026-06-08' },
  { installmentCode: 'P012', name: 'มาลี วงศ์ดี', phone: '082-345-6780', totalPrice: '33000', downPayment: '5000', monthlyPayment: '2800', totalInstallments: 10, paidInstallments: 5, remainingBalance: '14000', status: 'active' as const, dueDate: '2026-06-12' },
  { installmentCode: 'P013', name: 'อดุลย์ ทรงเกียรติ', phone: '083-456-7891', totalPrice: '18000', downPayment: '2000', monthlyPayment: '1600', totalInstallments: 10, paidInstallments: 2, remainingBalance: '12800', status: 'overdue' as const, dueDate: '2026-03-15' },
  { installmentCode: 'P014', name: 'วรรณา ภูมิพัฒน์', phone: '084-567-8902', totalPrice: '26000', downPayment: '3000', monthlyPayment: '2300', totalInstallments: 10, paidInstallments: 1, remainingBalance: '20700', status: 'overdue' as const, dueDate: '2026-02-28' },
  { installmentCode: 'P015', name: 'ชาตรี นามสกุล', phone: '085-678-9013', totalPrice: '38000', downPayment: '8000', monthlyPayment: '3000', totalInstallments: 10, paidInstallments: 4, remainingBalance: '18000', status: 'overdue' as const, dueDate: '2026-04-01' },
  { installmentCode: 'P016', name: 'ดวงใจ มูลคำ', phone: '086-789-0124', totalPrice: '21000', downPayment: '2000', monthlyPayment: '1900', totalInstallments: 10, paidInstallments: 0, remainingBalance: '19000', status: 'overdue' as const, dueDate: '2026-03-01' },
  { installmentCode: 'P017', name: 'เกรียงศักดิ์ พลเมือง', phone: '087-890-1235', totalPrice: '29000', downPayment: '4000', monthlyPayment: '2500', totalInstallments: 10, paidInstallments: 8, remainingBalance: '5000', status: 'due_soon' as const, dueDate: '2026-05-05' },
  { installmentCode: 'P018', name: 'สำราญ ใจบุญ', phone: '088-901-2346', totalPrice: '36000', downPayment: '6000', monthlyPayment: '3000', totalInstallments: 10, paidInstallments: 6, remainingBalance: '12000', status: 'due_soon' as const, dueDate: '2026-05-08' },
  { installmentCode: 'P019', name: 'อรุณ เช้าใหม่', phone: '089-012-3477', totalPrice: '24000', downPayment: '3000', monthlyPayment: '2100', totalInstallments: 10, paidInstallments: 4, remainingBalance: '12600', status: 'due_soon' as const, dueDate: '2026-05-03' },
  { installmentCode: 'P020', name: 'สมศักดิ์ ชำนาญ', phone: '080-234-5678', totalPrice: '15000', downPayment: '5000', monthlyPayment: '1000', totalInstallments: 10, paidInstallments: 10, remainingBalance: '0', status: 'paid' as const, dueDate: null },
];

async function seed() {
  const existing = await db.select({ count: sql<number>`count(*)::int` }).from(customers);
  if ((existing[0]?.count ?? 0) > 0) {
    console.log('DB already seeded — skipping');
    return;
  }

  const insertedCustomers = await db.insert(customers).values(
    CUSTOMER_SEEDS.map((s) => ({ ...s, phoneNormalized: normalizePhone(s.phone) })),
  ).returning({ id: customers.id });
  if (insertedCustomers.length < CUSTOMER_SEEDS.length) throw new Error('INSERT_FAILED');

  const cid = (i: number) => {
    const row = insertedCustomers[i];
    if (!row) throw new Error('Missing seeded customer');
    return row.id;
  };

  const paymentSeeds = [
    { customerId: cid(0), lineUserId: null, amount: '2500', slipUrl: 'https://example.com/slip/p001-1.jpg', status: 'confirmed' as const, confirmedBy: 'admin', confirmedAt: new Date('2026-01-15'), rejectedBy: null, rejectedAt: null, rejectReason: null },
    { customerId: cid(0), lineUserId: null, amount: '2500', slipUrl: 'https://example.com/slip/p001-2.jpg', status: 'confirmed' as const, confirmedBy: 'admin', confirmedAt: new Date('2026-02-15'), rejectedBy: null, rejectedAt: null, rejectReason: null },
    { customerId: cid(0), lineUserId: null, amount: '2500', slipUrl: 'https://example.com/slip/p001-3.jpg', status: 'confirmed' as const, confirmedBy: 'admin', confirmedAt: new Date('2026-03-15'), rejectedBy: null, rejectedAt: null, rejectReason: null },
    { customerId: cid(1), lineUserId: null, amount: '2200', slipUrl: 'https://example.com/slip/p002-1.jpg', status: 'confirmed' as const, confirmedBy: 'admin', confirmedAt: new Date('2026-01-10'), rejectedBy: null, rejectedAt: null, rejectReason: null },
    { customerId: cid(1), lineUserId: null, amount: '2200', slipUrl: 'https://example.com/slip/p002-2.jpg', status: 'confirmed' as const, confirmedBy: 'admin', confirmedAt: new Date('2026-02-10'), rejectedBy: null, rejectedAt: null, rejectReason: null },
    { customerId: cid(1), lineUserId: null, amount: '2200', slipUrl: 'https://example.com/slip/p002-3.jpg', status: 'confirmed' as const, confirmedBy: 'staff1', confirmedAt: new Date('2026-03-10'), rejectedBy: null, rejectedAt: null, rejectReason: null },
    { customerId: cid(2), lineUserId: null, amount: '3500', slipUrl: 'https://example.com/slip/p003-1.jpg', status: 'confirmed' as const, confirmedBy: 'admin', confirmedAt: new Date('2026-01-20'), rejectedBy: null, rejectedAt: null, rejectReason: null },
    { customerId: cid(2), lineUserId: null, amount: '3500', slipUrl: 'https://example.com/slip/p003-2.jpg', status: 'confirmed' as const, confirmedBy: 'admin', confirmedAt: new Date('2026-02-20'), rejectedBy: null, rejectedAt: null, rejectReason: null },
    { customerId: cid(3), lineUserId: null, amount: '1800', slipUrl: 'https://example.com/slip/p004-1.jpg', status: 'pending_verification' as const, confirmedBy: null, confirmedAt: null, rejectedBy: null, rejectedAt: null, rejectReason: null },
    { customerId: cid(4), lineUserId: null, amount: '3000', slipUrl: 'https://example.com/slip/p005-1.jpg', status: 'pending_verification' as const, confirmedBy: null, confirmedAt: null, rejectedBy: null, rejectedAt: null, rejectReason: null },
    { customerId: cid(5), lineUserId: null, amount: '2400', slipUrl: 'https://example.com/slip/p006-1.jpg', status: 'pending_verification' as const, confirmedBy: null, confirmedAt: null, rejectedBy: null, rejectedAt: null, rejectReason: null },
    { customerId: cid(6), lineUserId: null, amount: '3500', slipUrl: 'https://example.com/slip/p007-1.jpg', status: 'pending_verification' as const, confirmedBy: null, confirmedAt: null, rejectedBy: null, rejectedAt: null, rejectReason: null },
    { customerId: cid(7), lineUserId: null, amount: '1900', slipUrl: 'https://example.com/slip/p008-1.jpg', status: 'pending_verification' as const, confirmedBy: null, confirmedAt: null, rejectedBy: null, rejectedAt: null, rejectReason: null },
    { customerId: cid(0), lineUserId: null, amount: '2500', slipUrl: 'https://example.com/slip/p001-rej1.jpg', status: 'rejected' as const, confirmedBy: null, confirmedAt: null, rejectedBy: 'admin', rejectedAt: new Date('2026-03-20'), rejectReason: 'สลิปไม่ชัด' },
    { customerId: cid(1), lineUserId: null, amount: '2200', slipUrl: 'https://example.com/slip/p002-rej1.jpg', status: 'rejected' as const, confirmedBy: null, confirmedAt: null, rejectedBy: 'staff1', rejectedAt: new Date('2026-04-10'), rejectReason: 'ยอดไม่ตรง' },
  ];

  await db.insert(payments).values(paymentSeeds);

  console.log(`Seeded ${insertedCustomers.length} customers and ${paymentSeeds.length} payments`);
}

seed().catch(console.error).finally(() => process.exit(0));
