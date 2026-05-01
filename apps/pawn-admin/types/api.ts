export type CustomerStatus = 'active' | 'paid' | 'overdue' | 'due_soon';
export type PaymentStatus = 'pending_verification' | 'confirmed' | 'rejected';
export type IdentityDocumentType = 'face' | 'id_card_front' | 'id_card_back' | 'other';

export interface CustomerListItem {
  id: string;
  installmentCode: string;
  name: string;
  phone: string;
  remainingBalance: string;
  status: CustomerStatus;
  dueDate: string | null;
}

export interface CustomerIdentityDocument {
  id: string;
  type: IdentityDocumentType;
  url: string;
  uploadedBy: 'admin' | 'customer';
  createdAt: string;
}

export interface CustomerDetail extends CustomerListItem {
  totalPrice: string;
  downPayment: string;
  monthlyPayment: string;
  totalInstallments: number;
  paidInstallments: number;
  lineUserId: string | null;
  lineDisplayName: string | null;
  linePictureUrl: string | null;
  deviceModel: string;
  createdAt: string;
  notes: string;
  identityDocuments: CustomerIdentityDocument[];
  payments: PaymentItem[];
}

export interface PaymentItem {
  id: string;
  amount: string;
  slipUrl: string;
  status: PaymentStatus;
  confirmedBy: string | null;
  confirmedAt: string | null;
  rejectedBy: string | null;
  rejectedAt: string | null;
  rejectReason: string | null;
  createdAt: string;
}

export interface PaymentQueueItem {
  id: string;
  customerId: string;
  customerName: string;
  installmentCode: string;
  phone: string;
  amount: string;
  slipUrl: string;
  status: PaymentStatus;
  createdAt: string;
}

export interface DashboardStats {
  totalCustomers: number;
  overdueCount: number;
  dueSoonCount: number;
  todayReceipts: { count: number; total: string };
  monthlyReceipts: { count: number; total: string };
  pendingSlips: number;
  collectionRate: number;
  weeklyChart: { date: string; total: number }[];
  recentActivity: ActivityItem[];
  dueToday: DueTodayItem[];
}

export interface ActivityItem {
  id: string;
  type: 'payment_confirmed' | 'payment_rejected' | 'payment_submitted' | 'customer_created';
  description: string;
  timestamp: string;
  staffName?: string;
  customerName: string;
}

export interface DueTodayItem {
  id: string;
  customerName: string;
  installmentCode: string;
  amount: string;
  status: CustomerStatus;
}

export interface MonthlyReport {
  date: string;
  paymentCount: number;
  totalAmount: string;
  customerCount: number;
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  confirmedToday: number;
}

export interface ShopSettings {
  shopName: string;
  bankName: string;
  bankAccount: string;
  staffName: string;
  lineOfficialAccount: string;
}

export type DeviceStatus = 'active' | 'inactive';

export interface DeviceListItem {
  id: string;
  brand: string;
  model: string;
  storage: string;
  price: string | null;
  status: DeviceStatus;
  createdAt: string;
}

export interface DeviceDetail extends DeviceListItem {
  updatedAt: string;
}
