import type {
  CustomerDetail,
  CustomerIdentityDocument,
  CustomerStatus,
  DashboardStats,
  DeviceDetail,
  DeviceListItem,
  DeviceStatus,
  IdentityDocumentType,
  MonthlyReport,
  PaymentItem,
  PaymentQueueItem,
  PaymentStatus,
  ShopSettings,
  StaffMember,
} from '@/types/api';

function fmt(n: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function encodeSvg(svg: string): string {
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const SLIP_COLORS = [
  { header: '#1a56db', accent: '#1e40af', bank: 'KTB' },
  { header: '#7c3aed', accent: '#6d28d9', bank: 'KPLUS' },
  { header: '#059669', accent: '#047857', bank: 'SCB' },
  { header: '#2563eb', accent: '#1d4ed8', bank: 'BBL' },
  { header: '#dc2626', accent: '#b91c1c', bank: 'KBANK' },
];

function slipSvg(customerName: string, amount: string, date: string, _index: number): string {
  const ref = `TXN${Math.floor(Math.random() * 900000 + 100000)}`;
  const time = `${String(Math.floor(Math.random() * 12 + 7)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`;
  const color = SLIP_COLORS[_index % SLIP_COLORS.length];

  const qrCells = Array.from({ length: 9 }, (_, row) =>
    Array.from({ length: 9 }, (_, col) => {
      const isBorder = row === 0 || row === 8 || col === 0 || col === 8;
      const isCorner = (row <= 2 || row >= 6) && (col <= 2 || col >= 6);
      const isCenter = row === 4 && col === 4;
      if (isBorder || isCorner || isCenter) return true;
      return Math.random() > 0.45;
    })
  );

  const qrRects = qrCells.map((row, r) =>
    row.map((filled, c) =>
      filled
        ? `<rect x="${140 + c * 5}" y="${155 + r * 5}" width="5" height="5" fill="#1f2937" rx="0.5"/>`
        : ''
    ).join('')
  ).join('');

  const initials = customerName.split(' ').map(w => w.charAt(0)).slice(0, 2).join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="500" viewBox="0 0 320 500">
  <defs>
    <linearGradient id="hg" x1="0" y1="0" x2="320" y2="0" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${color.header}"/>
      <stop offset="100%" stop-color="${color.accent}"/>
    </linearGradient>
    <filter id="shadow" x="-2%" y="-2%" width="104%" height="104%">
      <feDropShadow dx="0" dy="1" stdDeviation="2" flood-opacity="0.1"/>
    </filter>
  </defs>

  <rect width="320" height="500" fill="#ffffff" rx="12" filter="url(#shadow)"/>
  <rect width="320" height="68" fill="url(#hg)" rx="12"/>
  <rect y="56" width="320" height="12" fill="url(#hg)"/>

  <circle cx="32" cy="34" r="16" fill="rgba(255,255,255,0.2)"/>
  <text x="32" y="38" text-anchor="middle" fill="white" font-size="11" font-weight="bold" font-family="sans-serif">${initials}</text>

  <text x="58" y="30" fill="white" font-size="14" font-weight="bold" font-family="sans-serif">${color.bank} Mobile Banking</text>
  <text x="58" y="48" fill="rgba(255,255,255,0.8)" font-size="10" font-family="sans-serif">PromptPay Transfer</text>

  <text x="24" y="96" fill="#6b7280" font-size="9" font-family="sans-serif">Amount</text>
  <rect x="20" y="102" width="280" height="44" fill="#f0f5ff" rx="6"/>
  <text x="160" y="132" text-anchor="middle" fill="${color.header}" font-size="24" font-weight="bold" font-family="sans-serif">${amount} THB</text>

  <line x1="20" y1="158" x2="300" y2="158" stroke="#e5e7eb" stroke-width="0.5"/>

  <text x="24" y="178" fill="#6b7280" font-size="9" font-family="sans-serif">From</text>
  <text x="24" y="194" fill="#111827" font-size="11" font-weight="600" font-family="sans-serif">${customerName}</text>

  <text x="24" y="220" fill="#6b7280" font-size="9" font-family="sans-serif">To (PromptPay)</text>
  <text x="24" y="236" fill="#111827" font-size="11" font-family="sans-serif">PAWN Demo Shop</text>
  <text x="24" y="252" fill="#6b7280" font-size="9" font-family="sans-serif">x-x56789-0</text>

  <line x1="20" y1="264" x2="300" y2="264" stroke="#e5e7eb" stroke-width="0.5"/>

  <text x="24" y="284" fill="#6b7280" font-size="9" font-family="sans-serif">Transaction Ref.</text>
  <text x="24" y="300" fill="#111827" font-size="10" font-family="monospace">${ref}</text>

  <text x="24" y="326" fill="#6b7280" font-size="9" font-family="sans-serif">Date / Time</text>
  <text x="24" y="342" fill="#111827" font-size="10" font-family="sans-serif">${date}  ${time}</text>

  <text x="24" y="368" fill="#6b7280" font-size="9" font-family="sans-serif">Remark</text>
  <text x="24" y="384" fill="#111827" font-size="10" font-family="sans-serif">${customerName}</text>

  <rect x="128" y="150" width="52" height="52" fill="white" rx="4" stroke="#e5e7eb" stroke-width="0.5"/>
  ${qrRects}
  <rect x="130" y="152" width="48" height="48" fill="none" rx="2" stroke="#9ca3af" stroke-width="0.5"/>

  <rect x="20" y="406" width="280" height="32" fill="#f9fafb" rx="6"/>
  <text x="160" y="426" text-anchor="middle" fill="#9ca3af" font-size="8" font-family="sans-serif">This is a mock slip for demo purposes only</text>

  <circle cx="160" cy="466" r="14" fill="#e5e7eb"/>
  <text x="160" y="470" text-anchor="middle" fill="#6b7280" font-size="8" font-weight="bold" font-family="sans-serif">OK</text>

  <rect x="150" y="486" width="20" height="6" fill="#e5e7eb" rx="3"/>
</svg>`;

  return encodeSvg(svg);
}

function identityDocSvg(type: IdentityDocumentType): string {
  const label: Record<IdentityDocumentType, string> = {
    face: 'Face Photo',
    id_card_front: 'ID Card (Front)',
    id_card_back: 'ID Card (Back)',
    other: 'Document',
  };
  const colors: Record<IdentityDocumentType, string> = {
    face: '#2563eb',
    id_card_front: '#059669',
    id_card_back: '#7c3aed',
    other: '#6b7280',
  };
  const c = colors[type];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="140" viewBox="0 0 200 140">
  <rect width="200" height="140" fill="#f9fafb" rx="8" stroke="${c}" stroke-width="1.5"/>
  <rect x="0" y="0" width="200" height="36" fill="${c}" rx="8"/>
  <rect x="0" y="24" width="200" height="12" fill="${c}"/>
  <text x="100" y="24" text-anchor="middle" fill="white" font-size="10" font-weight="bold" font-family="sans-serif">${label[type]}</text>
  <circle cx="100" cy="82" r="20" fill="#e5e7eb" stroke="${c}" stroke-width="1"/>
  <text x="100" y="87" text-anchor="middle" fill="${c}" font-size="14" font-family="sans-serif">${type === 'face' ? '\u{1F464}' : type.startsWith('id') ? '\u{1F4C3}' : '\u{1F4CE}'}</text>
  <text x="100" y="122" text-anchor="middle" fill="#9ca3af" font-size="8" font-family="sans-serif">Mock preview</text>
</svg>`;

  return encodeSvg(svg);
}

const STAFF: StaffMember[] = [
  { id: 'staff-1', name: 'สมชาย ใจดี', role: 'Admin', confirmedToday: 5 },
  { id: 'staff-2', name: 'สมหญิง รักเรียน', role: 'Staff', confirmedToday: 3 },
  { id: 'staff-3', name: 'พร้อม ศรีสุข', role: 'Staff', confirmedToday: 2 },
];

const SHOP_SETTINGS: ShopSettings = {
  shopName: 'ร้านมือถือ PAWN Demo',
  bankName: 'กรุงไทย',
  bankAccount: '123-4-56789-0',
  staffName: 'สมชาย ใจดี',
  lineOfficialAccount: '@pawn-demo',
};

interface MockCustomerSeed {
  id: string;
  installmentCode: string;
  name: string;
  phone: string;
  status: CustomerStatus;
  totalPrice: number;
  downPayment: number;
  monthlyPayment: number;
  totalInstallments: number;
  paidInstallments: number;
  dueDate: string | null;
  deviceModel: string;
  lineDisplayName: string | null;
  linePictureUrl: string | null;
  notes: string;
  createdAt: string;
  identityDocuments: { type: IdentityDocumentType; uploadedBy: 'admin' | 'customer' }[];
  payments: MockPaymentSeed[];
}

interface MockPaymentSeed {
  id: string;
  amount: number;
  status: PaymentStatus;
  createdAt: string;
  confirmedBy?: string;
  confirmedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectReason?: string;
}

const now = new Date();
const day = (offset: number) => {
  const d = new Date(now);
  d.setDate(d.getDate() + offset);
  return d.toISOString().split('T')[0];
};
const ts = (dayOffset: number, hour = 12) => {
  const d = new Date(now);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};

const SEEDS: MockCustomerSeed[] = [
  {
    id: 'cus-001',
    installmentCode: 'INS-001',
    name: 'สมชาย สุขใจ',
    phone: '081-234-5678',
    status: 'active',
    totalPrice: 25900,
    downPayment: 5000,
    monthlyPayment: 3490,
    totalInstallments: 6,
    paidInstallments: 2,
    dueDate: day(5),
    deviceModel: 'iPhone 15 128GB',
    lineDisplayName: 'Somchai S.',
    linePictureUrl: null,
    notes: 'ลูกค้าประจำ ชอบมาซื้อทุกปี',
    createdAt: '2025-10-15T10:00:00.000Z',
    identityDocuments: [
      { type: 'face', uploadedBy: 'admin' },
      { type: 'id_card_front', uploadedBy: 'admin' },
      { type: 'id_card_back', uploadedBy: 'admin' },
    ],
    payments: [
      { id: 'pay-001', amount: 5000, status: 'confirmed', createdAt: ts(-45, 9), confirmedBy: 'สมชาย ใจดี', confirmedAt: ts(-45, 14) },
      { id: 'pay-002', amount: 3490, status: 'confirmed', createdAt: ts(-30, 10), confirmedBy: 'สมหญิง รักเรียน', confirmedAt: ts(-30, 15) },
      { id: 'pay-003', amount: 3490, status: 'confirmed', createdAt: ts(-15, 11), confirmedBy: 'สมชาย ใจดี', confirmedAt: ts(-15, 16) },
      { id: 'pay-004', amount: 3490, status: 'pending_verification', createdAt: ts(0, 8) },
    ],
  },
  {
    id: 'cus-002',
    installmentCode: 'INS-002',
    name: 'สมหญิง มาลี',
    phone: '082-345-6789',
    status: 'overdue',
    totalPrice: 18900,
    downPayment: 3000,
    monthlyPayment: 2650,
    totalInstallments: 6,
    paidInstallments: 3,
    dueDate: day(-3),
    deviceModel: 'Samsung Galaxy S24 128GB',
    lineDisplayName: 'Ooy Malee',
    linePictureUrl: null,
    notes: 'ค้าง 3 วันแล้ว ติดต่อทาง LINE แล้ว',
    createdAt: '2025-09-20T08:00:00.000Z',
    identityDocuments: [
      { type: 'face', uploadedBy: 'customer' },
      { type: 'id_card_front', uploadedBy: 'customer' },
    ],
    payments: [
      { id: 'pay-005', amount: 3000, status: 'confirmed', createdAt: ts(-60, 9), confirmedBy: 'สมชาย ใจดี', confirmedAt: ts(-60, 11) },
      { id: 'pay-006', amount: 2650, status: 'confirmed', createdAt: ts(-45, 10), confirmedBy: 'พร้อม ศรีสุข', confirmedAt: ts(-45, 14) },
      { id: 'pay-007', amount: 2650, status: 'confirmed', createdAt: ts(-30, 9), confirmedBy: 'สมหญิง รักเรียน', confirmedAt: ts(-30, 12) },
      { id: 'pay-008', amount: 2650, status: 'rejected', createdAt: ts(-20, 11), rejectedBy: 'สมชาย ใจดี', rejectedAt: ts(-20, 15), rejectReason: 'สลิปไม่ชัด' },
      { id: 'pay-009', amount: 2650, status: 'confirmed', createdAt: ts(-18, 13), confirmedBy: 'สมชาย ใจดี', confirmedAt: ts(-18, 16) },
    ],
  },
  {
    id: 'cus-003',
    installmentCode: 'INS-003',
    name: 'พิชัย รุ่งเรือง',
    phone: '083-456-7890',
    status: 'due_soon',
    totalPrice: 32900,
    downPayment: 6000,
    monthlyPayment: 4482,
    totalInstallments: 6,
    paidInstallments: 5,
    dueDate: day(2),
    deviceModel: 'iPhone 15 Pro 256GB',
    lineDisplayName: 'Pichai R.',
    linePictureUrl: null,
    notes: 'เหลืองวดสุดท้าย จะปิดบัญชีเร็วๆ นี้',
    createdAt: '2025-06-01T09:00:00.000Z',
    identityDocuments: [
      { type: 'face', uploadedBy: 'admin' },
      { type: 'id_card_front', uploadedBy: 'admin' },
      { type: 'id_card_back', uploadedBy: 'admin' },
    ],
    payments: [
      { id: 'pay-010', amount: 6000, status: 'confirmed', createdAt: ts(-180, 9), confirmedBy: 'สมชาย ใจดี', confirmedAt: ts(-180, 11) },
      { id: 'pay-011', amount: 4482, status: 'confirmed', createdAt: ts(-150, 10), confirmedBy: 'สมหญิง รักเรียน', confirmedAt: ts(-150, 13) },
      { id: 'pay-012', amount: 4482, status: 'confirmed', createdAt: ts(-120, 9), confirmedBy: 'พร้อม ศรีสุข', confirmedAt: ts(-120, 12) },
      { id: 'pay-013', amount: 4482, status: 'confirmed', createdAt: ts(-90, 11), confirmedBy: 'สมชาย ใจดี', confirmedAt: ts(-90, 15) },
      { id: 'pay-014', amount: 4482, status: 'confirmed', createdAt: ts(-60, 10), confirmedBy: 'สมหญิง รักเรียน', confirmedAt: ts(-60, 14) },
    ],
  },
  {
    id: 'cus-004',
    installmentCode: 'INS-004',
    name: 'วิภาดา สว่าง',
    phone: '084-567-8901',
    status: 'paid',
    totalPrice: 15900,
    downPayment: 3000,
    monthlyPayment: 2580,
    totalInstallments: 5,
    paidInstallments: 5,
    dueDate: null,
    deviceModel: 'OPPO Reno 11 256GB',
    lineDisplayName: null,
    linePictureUrl: null,
    notes: 'ชำระครบแล้ว ปิดบัญชี',
    createdAt: '2025-04-10T10:00:00.000Z',
    identityDocuments: [
      { type: 'face', uploadedBy: 'admin' },
      { type: 'id_card_front', uploadedBy: 'admin' },
      { type: 'id_card_back', uploadedBy: 'admin' },
    ],
    payments: [
      { id: 'pay-015', amount: 3000, status: 'confirmed', createdAt: ts(-300, 9), confirmedBy: 'สมชาย ใจดี', confirmedAt: ts(-300, 11) },
      { id: 'pay-016', amount: 2580, status: 'confirmed', createdAt: ts(-270, 10), confirmedBy: 'สมหญิง รักเรียน', confirmedAt: ts(-270, 14) },
      { id: 'pay-017', amount: 2580, status: 'confirmed', createdAt: ts(-240, 9), confirmedBy: 'พร้อม ศรีสุข', confirmedAt: ts(-240, 12) },
      { id: 'pay-018', amount: 2580, status: 'confirmed', createdAt: ts(-210, 11), confirmedBy: 'สมชาย ใจดี', confirmedAt: ts(-210, 15) },
      { id: 'pay-019', amount: 2580, status: 'confirmed', createdAt: ts(-180, 10), confirmedBy: 'สมหญิง รักเรียน', confirmedAt: ts(-180, 14) },
    ],
  },
  {
    id: 'cus-005',
    installmentCode: 'INS-005',
    name: 'ธนกร ศรีทอง',
    phone: '085-678-9012',
    status: 'active',
    totalPrice: 22900,
    downPayment: 4000,
    monthlyPayment: 3150,
    totalInstallments: 6,
    paidInstallments: 1,
    dueDate: day(25),
    deviceModel: 'vivo V30 256GB',
    lineDisplayName: 'Tanon S.',
    linePictureUrl: null,
    notes: '',
    createdAt: '2025-12-01T11:00:00.000Z',
    identityDocuments: [
      { type: 'id_card_front', uploadedBy: 'admin' },
    ],
    payments: [
      { id: 'pay-020', amount: 4000, status: 'confirmed', createdAt: ts(-30, 9), confirmedBy: 'สมชาย ใจดี', confirmedAt: ts(-30, 11) },
      { id: 'pay-021', amount: 3150, status: 'pending_verification', createdAt: ts(0, 7) },
    ],
  },
  {
    id: 'cus-006',
    installmentCode: 'INS-006',
    name: 'นภัสสร แสงจันทร์',
    phone: '086-789-0123',
    status: 'overdue',
    totalPrice: 45900,
    downPayment: 10000,
    monthlyPayment: 5980,
    totalInstallments: 6,
    paidInstallments: 2,
    dueDate: day(-7),
    deviceModel: 'iPhone 16 Pro Max 512GB',
    lineDisplayName: 'Napasorn S.',
    linePictureUrl: null,
    notes: 'ค้าง 7 วัน โทรแล้วไม่รับ ส่ง LINE แล้ว',
    createdAt: '2025-08-15T14:00:00.000Z',
    identityDocuments: [
      { type: 'face', uploadedBy: 'customer' },
      { type: 'id_card_front', uploadedBy: 'customer' },
      { type: 'id_card_back', uploadedBy: 'customer' },
    ],
    payments: [
      { id: 'pay-022', amount: 10000, status: 'confirmed', createdAt: ts(-90, 9), confirmedBy: 'สมชาย ใจดี', confirmedAt: ts(-90, 12) },
      { id: 'pay-023', amount: 5980, status: 'confirmed', createdAt: ts(-60, 10), confirmedBy: 'สมหญิง รักเรียน', confirmedAt: ts(-60, 14) },
      { id: 'pay-024', amount: 5980, status: 'rejected', createdAt: ts(-35, 11), rejectedBy: 'พร้อม ศรีสุข', rejectedAt: ts(-35, 15), rejectReason: 'ยอดเงินไม่ตรง' },
    ],
  },
  {
    id: 'cus-007',
    installmentCode: 'INS-007',
    name: 'อดิศร วงศ์เจริญ',
    phone: '087-890-1234',
    status: 'active',
    totalPrice: 19900,
    downPayment: 3500,
    monthlyPayment: 2733,
    totalInstallments: 6,
    paidInstallments: 3,
    dueDate: day(15),
    deviceModel: 'Redmi Note 13 Pro 256GB',
    lineDisplayName: 'Adisorn W.',
    linePictureUrl: null,
    notes: 'จ่ายตรงเวลาทุกงวด',
    createdAt: '2025-08-20T09:00:00.000Z',
    identityDocuments: [
      { type: 'face', uploadedBy: 'admin' },
      { type: 'id_card_front', uploadedBy: 'admin' },
      { type: 'id_card_back', uploadedBy: 'admin' },
    ],
    payments: [
      { id: 'pay-025', amount: 3500, status: 'confirmed', createdAt: ts(-90, 9), confirmedBy: 'สมชาย ใจดี', confirmedAt: ts(-90, 11) },
      { id: 'pay-026', amount: 2733, status: 'confirmed', createdAt: ts(-60, 10), confirmedBy: 'สมหญิง รักเรียน', confirmedAt: ts(-60, 13) },
      { id: 'pay-027', amount: 2733, status: 'confirmed', createdAt: ts(-30, 9), confirmedBy: 'พร้อม ศรีสุข', confirmedAt: ts(-30, 12) },
    ],
  },
  {
    id: 'cus-008',
    installmentCode: 'INS-008',
    name: 'จิราภรณ์ แสงดาว',
    phone: '088-901-2345',
    status: 'due_soon',
    totalPrice: 28900,
    downPayment: 5000,
    monthlyPayment: 3983,
    totalInstallments: 6,
    paidInstallments: 4,
    dueDate: day(1),
    deviceModel: 'Samsung Galaxy S24 FE 256GB',
    lineDisplayName: 'Jiraporn S.',
    linePictureUrl: null,
    notes: 'เตือนครั้งล่าสุดแล้ว',
    createdAt: '2025-05-10T10:00:00.000Z',
    identityDocuments: [
      { type: 'face', uploadedBy: 'admin' },
      { type: 'id_card_front', uploadedBy: 'admin' },
    ],
    payments: [
      { id: 'pay-028', amount: 5000, status: 'confirmed', createdAt: ts(-180, 9), confirmedBy: 'สมชาย ใจดี', confirmedAt: ts(-180, 11) },
      { id: 'pay-029', amount: 3983, status: 'confirmed', createdAt: ts(-150, 10), confirmedBy: 'สมหญิง รักเรียน', confirmedAt: ts(-150, 13) },
      { id: 'pay-030', amount: 3983, status: 'confirmed', createdAt: ts(-120, 9), confirmedBy: 'พร้อม ศรีสุข', confirmedAt: ts(-120, 12) },
      { id: 'pay-031', amount: 3983, status: 'confirmed', createdAt: ts(-90, 11), confirmedBy: 'สมชาย ใจดี', confirmedAt: ts(-90, 15) },
    ],
  },
  {
    id: 'cus-009',
    installmentCode: 'INS-009',
    name: 'กิตติพงศ์ รักไทย',
    phone: '089-012-3456',
    status: 'active',
    totalPrice: 12900,
    downPayment: 2000,
    monthlyPayment: 1817,
    totalInstallments: 6,
    paidInstallments: 0,
    dueDate: day(28),
    deviceModel: 'realme 12 128GB',
    lineDisplayName: null,
    linePictureUrl: null,
    notes: 'ลูกค้าใหม่ ผ่อนเพิ่งเริ่ม',
    createdAt: '2026-04-25T13:00:00.000Z',
    identityDocuments: [],
    payments: [
      { id: 'pay-032', amount: 2000, status: 'confirmed', createdAt: ts(-5, 10), confirmedBy: 'สมชาย ใจดี', confirmedAt: ts(-5, 12) },
    ],
  },
  {
    id: 'cus-010',
    installmentCode: 'INS-010',
    name: 'ประภาส ชัยพฤกษ์',
    phone: '080-123-4567',
    status: 'active',
    totalPrice: 37900,
    downPayment: 8000,
    monthlyPayment: 4983,
    totalInstallments: 6,
    paidInstallments: 3,
    dueDate: day(10),
    deviceModel: 'iPhone 16 Pro 256GB',
    lineDisplayName: 'Prapas C.',
    linePictureUrl: null,
    notes: '',
    createdAt: '2025-09-01T08:00:00.000Z',
    identityDocuments: [
      { type: 'face', uploadedBy: 'admin' },
      { type: 'id_card_front', uploadedBy: 'admin' },
      { type: 'id_card_back', uploadedBy: 'admin' },
    ],
    payments: [
      { id: 'pay-033', amount: 8000, status: 'confirmed', createdAt: ts(-120, 9), confirmedBy: 'สมชาย ใจดี', confirmedAt: ts(-120, 11) },
      { id: 'pay-034', amount: 4983, status: 'confirmed', createdAt: ts(-90, 10), confirmedBy: 'สมหญิง รักเรียน', confirmedAt: ts(-90, 13) },
      { id: 'pay-035', amount: 4983, status: 'confirmed', createdAt: ts(-60, 9), confirmedBy: 'พร้อม ศรีสุข', confirmedAt: ts(-60, 12) },
    ],
  },
  {
    id: 'cus-011',
    installmentCode: 'INS-011',
    name: 'มนัสนันท์ บุญมา',
    phone: '091-234-5678',
    status: 'overdue',
    totalPrice: 16900,
    downPayment: 2500,
    monthlyPayment: 2400,
    totalInstallments: 6,
    paidInstallments: 1,
    dueDate: day(-14),
    deviceModel: 'Samsung Galaxy A55 128GB',
    lineDisplayName: 'Manasanan B.',
    linePictureUrl: null,
    notes: 'ค้างนาน อาจต้องตามเก็บเพิ่ม',
    createdAt: '2025-11-01T12:00:00.000Z',
    identityDocuments: [
      { type: 'id_card_front', uploadedBy: 'customer' },
    ],
    payments: [
      { id: 'pay-036', amount: 2500, status: 'confirmed', createdAt: ts(-60, 9), confirmedBy: 'สมชาย ใจดี', confirmedAt: ts(-60, 11) },
    ],
  },
  {
    id: 'cus-012',
    installmentCode: 'INS-012',
    name: 'เกรียงศักดิ์ พลเมือง',
    phone: '092-345-6789',
    status: 'paid',
    totalPrice: 21900,
    downPayment: 4000,
    monthlyPayment: 2983,
    totalInstallments: 6,
    paidInstallments: 6,
    dueDate: null,
    deviceModel: 'iPhone 15 256GB',
    lineDisplayName: 'Kriangsak P.',
    linePictureUrl: null,
    notes: 'ชำระครบแล้ว',
    createdAt: '2025-02-01T09:00:00.000Z',
    identityDocuments: [
      { type: 'face', uploadedBy: 'admin' },
      { type: 'id_card_front', uploadedBy: 'admin' },
      { type: 'id_card_back', uploadedBy: 'admin' },
    ],
    payments: [
      { id: 'pay-037', amount: 4000, status: 'confirmed', createdAt: ts(-365, 9), confirmedBy: 'สมชาย ใจดี', confirmedAt: ts(-365, 11) },
      { id: 'pay-038', amount: 2983, status: 'confirmed', createdAt: ts(-335, 10), confirmedBy: 'สมหญิง รักเรียน', confirmedAt: ts(-335, 13) },
      { id: 'pay-039', amount: 2983, status: 'confirmed', createdAt: ts(-305, 9), confirmedBy: 'พร้อม ศรีสุข', confirmedAt: ts(-305, 12) },
      { id: 'pay-040', amount: 2983, status: 'confirmed', createdAt: ts(-275, 11), confirmedBy: 'สมชาย ใจดี', confirmedAt: ts(-275, 15) },
      { id: 'pay-041', amount: 2983, status: 'confirmed', createdAt: ts(-245, 10), confirmedBy: 'สมหญิง รักเรียน', confirmedAt: ts(-245, 14) },
      { id: 'pay-042', amount: 2983, status: 'confirmed', createdAt: ts(-215, 9), confirmedBy: 'พร้อม ศรีสุข', confirmedAt: ts(-215, 12) },
    ],
  },
];

function buildPayments(seeds: MockPaymentSeed[], customerName: string, customerIndex: number): PaymentItem[] {
  return seeds.map((p, pIdx) => ({
    id: p.id,
    amount: fmt(p.amount),
    slipUrl: slipSvg(customerName, fmt(p.amount), new Date(p.createdAt).toLocaleDateString('th-TH'), customerIndex + pIdx),
    status: p.status,
    confirmedBy: p.confirmedBy ?? null,
    confirmedAt: p.confirmedAt ?? null,
    rejectedBy: p.rejectedBy ?? null,
    rejectedAt: p.rejectedAt ?? null,
    rejectReason: p.rejectReason ?? null,
    createdAt: p.createdAt,
  }));
}

function buildIdentityDocuments(
  docs: { type: IdentityDocumentType; uploadedBy: 'admin' | 'customer' }[],
  customerId: string,
): CustomerIdentityDocument[] {
  return docs.map((d, i) => ({
    id: `doc-${customerId}-${i}`,
    type: d.type,
    url: identityDocSvg(d.type),
    uploadedBy: d.uploadedBy,
    createdAt: new Date(now.getTime() - (SEEDS.findIndex((s) => s.id === customerId) + 1) * 86400000).toISOString(),
  }));
}

export function getMockCustomers(): CustomerDetail[] {
  return SEEDS.map((s, sIdx) => {
    const paid = s.payments.filter((p) => p.status === 'confirmed').reduce((sum, p) => sum + p.amount, 0);
    const remaining = Math.max(0, s.totalPrice - s.downPayment - paid);
    const paidInstallments = s.payments.filter((p) => p.status === 'confirmed').length - 1;
    return {
      id: s.id,
      installmentCode: s.installmentCode,
      name: s.name,
      phone: s.phone,
      status: s.status,
      totalPrice: fmt(s.totalPrice),
      downPayment: fmt(s.downPayment),
      monthlyPayment: fmt(s.monthlyPayment),
      totalInstallments: s.totalInstallments,
      paidInstallments: Math.max(0, paidInstallments),
      remainingBalance: fmt(remaining),
      dueDate: s.dueDate,
      lineUserId: s.lineDisplayName ? `line-${s.id}` : null,
      lineDisplayName: s.lineDisplayName,
      linePictureUrl: s.linePictureUrl,
      deviceModel: s.deviceModel,
      notes: s.notes,
      createdAt: s.createdAt,
      identityDocuments: buildIdentityDocuments(s.identityDocuments, s.id),
      payments: buildPayments(s.payments, s.name, sIdx),
    };
  });
}

export function getMockCustomerById(id: string): CustomerDetail | undefined {
  return getMockCustomers().find((c) => c.id === id);
}

export function getMockPendingPayments(): PaymentQueueItem[] {
  const customers = getMockCustomers();
  const items: PaymentQueueItem[] = [];
  for (const c of customers) {
    for (const p of c.payments) {
      if (p.status === 'pending_verification') {
        items.push({
          id: p.id,
          customerId: c.id,
          customerName: c.name,
          installmentCode: c.installmentCode,
          phone: c.phone,
          amount: p.amount,
          slipUrl: p.slipUrl,
          status: p.status,
          createdAt: p.createdAt,
        });
      }
    }
  }
  return items;
}

export function getMockDashboard(): DashboardStats {
  const customers = getMockCustomers();
  const overdue = customers.filter((c) => c.status === 'overdue');
  const dueSoon = customers.filter((c) => c.status === 'due_soon');
  const todayPayments = customers.flatMap((c) => c.payments).filter((p) => p.status === 'confirmed');
  const totalToday = todayPayments.reduce((sum, p) => sum + Number(p.amount.replace(/,/g, '')), 0);
  const allPayments = customers.flatMap((c) => c.payments);
  const confirmedPayments = allPayments.filter((p) => p.status === 'confirmed');
  const totalMonth = confirmedPayments.reduce((sum, p) => sum + Number(p.amount.replace(/,/g, '')), 0);
  const pendingSlips = allPayments.filter((p) => p.status === 'pending_verification').length;
  const totalDue = customers.reduce((sum, c) => sum + Number(c.remainingBalance.replace(/,/g, '')), 0);
  const paidTotal = confirmedPayments.reduce((sum, p) => sum + Number(p.amount.replace(/,/g, '')), 0);
  const collectionRate = totalDue + paidTotal > 0 ? Math.round((paidTotal / (totalDue + paidTotal)) * 100) : 0;

  const weeklyChart = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const dayTotal = Math.floor(Math.random() * 15000 + 3000);
    return { date: dateStr, total: dayTotal };
  });

  const recentActivity = [
    { id: 'act-1', type: 'payment_submitted' as const, description: 'ส่งสลิปแจ้งชำระ ฿3,490', timestamp: ts(0, 8), customerName: 'สมชาย สุขใจ' },
    { id: 'act-2', type: 'payment_submitted' as const, description: 'ส่งสลิปแจ้งชำระ ฿3,150', timestamp: ts(0, 7), customerName: 'ธนกร ศรีทอง' },
    { id: 'act-3', type: 'payment_confirmed' as const, description: 'ยืนยันชำระ ฿2,733', timestamp: ts(-1, 16), staffName: 'สมชาย ใจดี', customerName: 'อดิศร วงศ์เจริญ' },
    { id: 'act-4', type: 'payment_rejected' as const, description: 'ปฏิเสธสลิป ฿5,980 (ยอดเงินไม่ตรง)', timestamp: ts(-1, 14), staffName: 'พร้อม ศรีสุข', customerName: 'นภัสสร แสงจันทร์' },
    { id: 'act-5', type: 'payment_confirmed' as const, description: 'ยืนยันชำระ ฿4,482', timestamp: ts(-1, 11), staffName: 'สมหญิง รักเรียน', customerName: 'พิชัย รุ่งเรือง' },
    { id: 'act-6', type: 'customer_created' as const, description: 'สร้างสัญญาใหม่', timestamp: ts(-5, 13), staffName: 'สมชาย ใจดี', customerName: 'กิตติพงศ์ รักไทย' },
  ];

  const dueToday = customers
    .filter((c) => c.dueDate && c.status !== 'paid')
    .filter((c) => {
      const diff = Math.ceil((new Date(c.dueDate!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return diff >= -3 && diff <= 3;
    })
    .map((c) => ({
      id: c.id,
      customerName: c.name,
      installmentCode: c.installmentCode,
      amount: c.monthlyPayment,
      status: c.status,
    }));

  return {
    totalCustomers: customers.length,
    overdueCount: overdue.length,
    dueSoonCount: dueSoon.length,
    todayReceipts: { count: todayPayments.length, total: fmt(totalToday) },
    monthlyReceipts: { count: confirmedPayments.length, total: fmt(totalMonth) },
    pendingSlips,
    collectionRate,
    weeklyChart,
    recentActivity,
    dueToday,
  };
}

export function getMockMonthlyReport(year: number, month: number): MonthlyReport[] {
  const daysInMonth = new Date(year, month, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, i) => {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`;
    const isWeekend = new Date(year, month - 1, i + 1).getDay() % 6 === 0;
    const paymentCount = isWeekend ? Math.floor(Math.random() * 2) : Math.floor(Math.random() * 5 + 1);
    const totalAmount = fmt(paymentCount * (Math.random() * 4000 + 1500));
    return {
      date: dateStr,
      paymentCount,
      totalAmount,
      customerCount: Math.max(1, paymentCount - Math.floor(Math.random() * 2)),
    };
  });
}

export function getMockStaff(): StaffMember[] {
  return STAFF;
}

export function getMockSettings(): ShopSettings {
  return SHOP_SETTINGS;
}

export function getMockAllPayments(): PaymentQueueItem[] {
  const customers = getMockCustomers();
  const items: PaymentQueueItem[] = [];
  for (const c of customers) {
    for (const p of c.payments) {
      items.push({
        id: p.id,
        customerId: c.id,
        customerName: c.name,
        installmentCode: c.installmentCode,
        phone: c.phone,
        amount: p.amount,
        slipUrl: p.slipUrl,
        status: p.status,
        createdAt: p.createdAt,
      });
    }
  }
  return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

interface MockDeviceSeed {
  id: string;
  brand: string;
  model: string;
  storage: string;
  price: number | null;
  status: DeviceStatus;
  createdAt: string;
  updatedAt: string;
}

const DEVICE_SEEDS: MockDeviceSeed[] = [
  { id: 'dev-001', brand: 'Apple', model: 'iPhone 15', storage: '128GB', price: 25900, status: 'active', createdAt: '2025-01-10T10:00:00.000Z', updatedAt: '2025-01-10T10:00:00.000Z' },
  { id: 'dev-002', brand: 'Apple', model: 'iPhone 15', storage: '256GB', price: 29900, status: 'active', createdAt: '2025-01-10T10:00:00.000Z', updatedAt: '2025-01-10T10:00:00.000Z' },
  { id: 'dev-003', brand: 'Apple', model: 'iPhone 15 Pro', storage: '256GB', price: 38900, status: 'active', createdAt: '2025-01-10T10:00:00.000Z', updatedAt: '2025-01-10T10:00:00.000Z' },
  { id: 'dev-004', brand: 'Apple', model: 'iPhone 15 Pro Max', storage: '512GB', price: 48900, status: 'active', createdAt: '2025-01-10T10:00:00.000Z', updatedAt: '2025-01-10T10:00:00.000Z' },
  { id: 'dev-005', brand: 'Apple', model: 'iPhone 16', storage: '128GB', price: 27900, status: 'active', createdAt: '2025-01-10T10:00:00.000Z', updatedAt: '2025-01-10T10:00:00.000Z' },
  { id: 'dev-006', brand: 'Apple', model: 'iPhone 16 Pro', storage: '256GB', price: 41900, status: 'active', createdAt: '2025-01-10T10:00:00.000Z', updatedAt: '2025-01-10T10:00:00.000Z' },
  { id: 'dev-007', brand: 'Apple', model: 'iPhone 16 Pro Max', storage: '512GB', price: 51900, status: 'active', createdAt: '2025-01-10T10:00:00.000Z', updatedAt: '2025-01-10T10:00:00.000Z' },
  { id: 'dev-008', brand: 'Samsung', model: 'Galaxy S24', storage: '128GB', price: 25900, status: 'active', createdAt: '2025-01-10T10:00:00.000Z', updatedAt: '2025-01-10T10:00:00.000Z' },
  { id: 'dev-009', brand: 'Samsung', model: 'Galaxy S24 FE', storage: '256GB', price: 16900, status: 'active', createdAt: '2025-01-10T10:00:00.000Z', updatedAt: '2025-01-10T10:00:00.000Z' },
  { id: 'dev-010', brand: 'Samsung', model: 'Galaxy A55', storage: '128GB', price: 11900, status: 'active', createdAt: '2025-01-10T10:00:00.000Z', updatedAt: '2025-01-10T10:00:00.000Z' },
  { id: 'dev-011', brand: 'OPPO', model: 'Reno 11', storage: '256GB', price: 11900, status: 'active', createdAt: '2025-01-10T10:00:00.000Z', updatedAt: '2025-01-10T10:00:00.000Z' },
  { id: 'dev-012', brand: 'vivo', model: 'V30', storage: '256GB', price: 12900, status: 'active', createdAt: '2025-01-10T10:00:00.000Z', updatedAt: '2025-01-10T10:00:00.000Z' },
  { id: 'dev-013', brand: 'Xiaomi', model: 'Redmi Note 13 Pro', storage: '256GB', price: 8990, status: 'active', createdAt: '2025-01-10T10:00:00.000Z', updatedAt: '2025-01-10T10:00:00.000Z' },
  { id: 'dev-014', brand: 'realme', model: '12', storage: '128GB', price: 7990, status: 'active', createdAt: '2025-01-10T10:00:00.000Z', updatedAt: '2025-01-10T10:00:00.000Z' },
];

let deviceMutations: MockDeviceSeed[] = [];

function getDevicePool(): MockDeviceSeed[] {
  return [...DEVICE_SEEDS, ...deviceMutations];
}

function deviceLabel(d: MockDeviceSeed): string {
  return `${d.model} ${d.storage}`;
}

export function getMockDevices(): DeviceListItem[] {
  return getDevicePool().map((d) => ({
    id: d.id,
    brand: d.brand,
    model: d.model,
    storage: d.storage,
    price: d.price !== null ? fmt(d.price) : null,
    status: d.status,
    createdAt: d.createdAt,
  }));
}

export function getMockActiveDeviceLabels(): string[] {
  return getDevicePool()
    .filter((d) => d.status === 'active')
    .map(deviceLabel)
    .sort();
}

export function getMockDeviceById(id: string): DeviceDetail | undefined {
  const d = getDevicePool().find((d) => d.id === id);
  if (!d) return undefined;
  return {
    id: d.id,
    brand: d.brand,
    model: d.model,
    storage: d.storage,
    price: d.price !== null ? fmt(d.price) : null,
    status: d.status,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };
}

export function createMockDevice(data: {
  brand: string;
  model: string;
  storage: string;
  price?: string;
}): DeviceDetail {
  const pool = getDevicePool();
  const nextNum = pool.length + 1;
  const id = `dev-${String(nextNum).padStart(3, '0')}`;
  const nowTs = new Date().toISOString();
  const seed: MockDeviceSeed = {
    id,
    brand: data.brand,
    model: data.model,
    storage: data.storage,
    price: data.price ? Number(data.price.replace(/,/g, '')) : null,
    status: 'active',
    createdAt: nowTs,
    updatedAt: nowTs,
  };
  deviceMutations.push(seed);
  return {
    id: seed.id,
    brand: seed.brand,
    model: seed.model,
    storage: seed.storage,
    price: seed.price !== null ? fmt(seed.price) : null,
    status: seed.status,
    createdAt: seed.createdAt,
    updatedAt: seed.updatedAt,
  };
}

export function updateMockDevice(
  id: string,
  data: {
    brand?: string;
    model?: string;
    storage?: string;
    price?: string | null;
    status?: DeviceStatus;
  },
): DeviceDetail | undefined {
  const pool = getDevicePool();
  const existing = pool.find((d) => d.id === id);
  if (!existing) return undefined;
  existing.brand = data.brand ?? existing.brand;
  existing.model = data.model ?? existing.model;
  existing.storage = data.storage ?? existing.storage;
  if (data.price !== undefined) {
    existing.price = data.price ? Number(data.price.replace(/,/g, '')) : null;
  }
  existing.status = data.status ?? existing.status;
  existing.updatedAt = new Date().toISOString();
  return {
    id: existing.id,
    brand: existing.brand,
    model: existing.model,
    storage: existing.storage,
    price: existing.price !== null ? fmt(existing.price) : null,
    status: existing.status,
    createdAt: existing.createdAt,
    updatedAt: existing.updatedAt,
  };
}

export function deleteMockDevice(id: string): boolean {
  const pool = getDevicePool();
  const existing = pool.find((d) => d.id === id);
  if (!existing) return false;
  existing.status = 'inactive';
  existing.updatedAt = new Date().toISOString();
  return true;
}
