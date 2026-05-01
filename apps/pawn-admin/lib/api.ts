import type {
  CustomerDetail,
  CustomerListItem,
  DashboardStats,
  DeviceDetail,
  DeviceListItem,
  DeviceStatus,
  MonthlyReport,
  PaymentQueueItem,
  ShopSettings,
  StaffMember,
} from '@/types/api';

import {
  getMockCustomers,
  getMockCustomerById,
  getMockPendingPayments,
  getMockDashboard,
  getMockMonthlyReport,
  getMockStaff,
  getMockSettings,
  getMockAllPayments,
  getMockDevices,
  getMockActiveDeviceLabels,
  getMockDeviceById,
  createMockDevice,
  updateMockDevice,
  deleteMockDevice,
} from '@/lib/mock-data';

export async function getDashboard(): Promise<DashboardStats> {
  return getMockDashboard();
}

export async function getCustomers(params?: {
  search?: string;
  status?: string;
  page?: number;
}): Promise<{ customers: CustomerListItem[]; total: number }> {
  const all = getMockCustomers();
  let filtered = all;

  if (params?.search) {
    const q = params.search.toLowerCase();
    filtered = filtered.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.installmentCode.toLowerCase().includes(q),
    );
  }

  if (params?.status) {
    filtered = filtered.filter((c) => c.status === params.status);
  }

  const page = params?.page ?? 1;
  const pageSize = 20;
  const start = (page - 1) * pageSize;
  const customers: CustomerListItem[] = filtered.slice(start, start + pageSize).map((c) => ({
    id: c.id,
    installmentCode: c.installmentCode,
    name: c.name,
    phone: c.phone,
    remainingBalance: c.remainingBalance,
    status: c.status,
    dueDate: c.dueDate,
  }));

  return { customers, total: filtered.length };
}

export async function getCustomer(id: string): Promise<CustomerDetail> {
  const customer = getMockCustomerById(id);
  if (!customer) throw new Error('Customer not found');
  return customer;
}

export async function getPendingPayments(): Promise<PaymentQueueItem[]> {
  return getMockPendingPayments();
}

export async function getAllPayments(): Promise<PaymentQueueItem[]> {
  return getMockAllPayments();
}

export async function confirmPayment(id: string, confirmedBy: string): Promise<void> {
  console.log(`[MOCK] Confirmed payment ${id} by ${confirmedBy}`);
}

export async function rejectPayment(
  id: string,
  rejectedBy: string,
  reason: string,
): Promise<void> {
  console.log(`[MOCK] Rejected payment ${id} by ${rejectedBy}: ${reason}`);
}

export async function getMonthlyReport(
  year: number,
  month: number,
): Promise<MonthlyReport[]> {
  return getMockMonthlyReport(year, month);
}

export function getExportUrl(year: number, month: number): string {
  const data = getMockMonthlyReport(year, month);
  const header = 'Date,Payments,Total (฿),Customers';
  const rows = data.map((r) => `${r.date},${r.paymentCount},${r.totalAmount},${r.customerCount}`);
  const csv = [header, ...rows].join('\n');
  return `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
}

export async function getStaff(): Promise<StaffMember[]> {
  return getMockStaff();
}

export async function getSettings(): Promise<ShopSettings> {
  return getMockSettings();
}

export async function createCustomer(data: {
  name: string;
  phone: string;
  deviceModel: string;
  totalPrice: string;
  downPayment: string;
  totalInstallments: number;
}): Promise<CustomerDetail> {
  const customers = getMockCustomers();
  const lastCode = customers[customers.length - 1]?.installmentCode ?? 'INS-000';
  const nextNum = Number.parseInt(lastCode.split('-')[1], 10) + 1;
  const installmentCode = `INS-${String(nextNum).padStart(3, '0')}`;
  const total = Number(data.totalPrice.replace(/,/g, ''));
  const down = Number(data.downPayment.replace(/,/g, ''));
  const remaining = total - down;
  const monthly = remaining / data.totalInstallments;

  const newCustomer: CustomerDetail = {
    id: `cus-${String(customers.length + 1).padStart(3, '0')}`,
    installmentCode,
    name: data.name,
    phone: data.phone,
    totalPrice: data.totalPrice,
    downPayment: data.downPayment,
    monthlyPayment: monthly.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    totalInstallments: data.totalInstallments,
    paidInstallments: 0,
    remainingBalance: remaining.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    status: 'active',
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    lineUserId: null,
    lineDisplayName: null,
    linePictureUrl: null,
    deviceModel: data.deviceModel,
    createdAt: new Date().toISOString(),
    notes: '',
    identityDocuments: [],
    payments: [],
  };

  console.log('[MOCK] Created customer', newCustomer.id, newCustomer.name);
  return newCustomer;
}

export async function getDevices(params?: {
  search?: string;
  status?: DeviceStatus;
}): Promise<{ devices: DeviceListItem[]; total: number }> {
  let filtered = getMockDevices();
  if (params?.search) {
    const q = params.search.toLowerCase();
    filtered = filtered.filter(
      (d) =>
        d.brand.toLowerCase().includes(q) ||
        d.model.toLowerCase().includes(q) ||
        d.storage.toLowerCase().includes(q),
    );
  }
  if (params?.status) {
    filtered = filtered.filter((d) => d.status === params.status);
  }
  return { devices: filtered, total: filtered.length };
}

export function getActiveDeviceLabels(): string[] {
  return getMockActiveDeviceLabels();
}

export async function getDevice(id: string): Promise<DeviceDetail> {
  const device = getMockDeviceById(id);
  if (!device) throw new Error('Device not found');
  return device;
}

export async function createDevice(data: {
  brand: string;
  model: string;
  storage: string;
  price?: string;
}): Promise<DeviceDetail> {
  return createMockDevice(data);
}

export async function updateDevice(
  id: string,
  data: {
    brand?: string;
    model?: string;
    storage?: string;
    price?: string | null;
    status?: DeviceStatus;
  },
): Promise<DeviceDetail> {
  const result = updateMockDevice(id, data);
  if (!result) throw new Error('Device not found');
  return result;
}

export async function removeDevice(id: string): Promise<void> {
  const ok = deleteMockDevice(id);
  if (!ok) throw new Error('Device not found');
}
