'use client';

import { useState, useEffect } from 'react';
import { DueCustomersTable } from '@/components/reports/DueCustomersTable';
import { OverdueCustomersTable } from '@/components/reports/OverdueCustomersTable';
import { PenaltyCustomersTable } from '@/components/reports/PenaltyCustomersTable';
import { InactiveSavingsTable } from '@/components/reports/InactiveSavingsTable';
import { RevenueSummaryCard } from '@/components/reports/RevenueSummaryCard';
import { ReadyForPickupTable } from '@/components/reports/ReadyForPickupTable';
import {
  getDueCustomers,
  getOverdueCustomers,
  getPenaltyCustomers,
  getInactiveSavingsCustomers,
  getRevenueSummary,
  getReadyForPickupCustomers,
  applyPenaltyAction,
  markDevicePickedUp,
} from '@/lib/api';
import type {
  DueCustomerItem,
  OverdueCustomerItem,
  PenaltyCustomerItem,
  InactiveSavingsItem,
  RevenueSummary,
  ReadyForPickupItem,
  PenaltyAction,
} from '@/types/api';
import {
  CalendarClock,
  CalendarX,
  AlertTriangle,
  UserX,
  Wallet,
  PackageCheck,
} from 'lucide-react';

type TabKey = 'due' | 'overdue' | 'penalty' | 'inactive' | 'revenue' | 'pickup';

const tabs: Array<{ key: TabKey; label: string; icon: React.ReactNode }> = [
  { key: 'due', label: 'ถึงกำหนดจ่าย', icon: <CalendarClock className="size-3.5" /> },
  { key: 'overdue', label: 'เกินกำหนดจ่าย', icon: <CalendarX className="size-3.5" /> },
  { key: 'penalty', label: 'ค่าปรับ', icon: <AlertTriangle className="size-3.5" /> },
  { key: 'inactive', label: 'หายจากการออม', icon: <UserX className="size-3.5" /> },
  { key: 'revenue', label: 'รายรับ', icon: <Wallet className="size-3.5" /> },
  { key: 'pickup', label: 'พร้อมรับเครื่อง', icon: <PackageCheck className="size-3.5" /> },
];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('due');
  const [dueData, setDueData] = useState<DueCustomerItem[]>([]);
  const [overdueData, setOverdueData] = useState<OverdueCustomerItem[]>([]);
  const [penaltyData, setPenaltyData] = useState<PenaltyCustomerItem[]>([]);
  const [inactiveData, setInactiveData] = useState<InactiveSavingsItem[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueSummary | null>(null);
  const [pickupData, setPickupData] = useState<ReadyForPickupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getDueCustomers(),
      getOverdueCustomers(),
      getPenaltyCustomers(),
      getInactiveSavingsCustomers(),
      getRevenueSummary(),
      getReadyForPickupCustomers(),
    ]).then(([due, overdue, penalty, inactive, revenue, pickup]) => {
      if (!cancelled) {
        setDueData(due);
        setOverdueData(overdue);
        setPenaltyData(penalty);
        setInactiveData(inactive);
        setRevenueData(revenue);
        setPickupData(pickup);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [refreshKey]);

  const refresh = () => setRefreshKey((k) => k + 1);

  const handlePenaltyAction = (customerId: string, action: PenaltyAction, reducedAmount?: number) => {
    applyPenaltyAction(customerId, action, reducedAmount);
    refresh();
  };

  const handlePickup = (customerId: string, pickedUp: boolean) => {
    markDevicePickedUp(customerId, pickedUp);
    refresh();
  };

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">รายงาน</h1>

      <div className="flex gap-1 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-medium transition-colors ${
              activeTab === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">กำลังโหลด...</p>
      ) : (
        <>
          {activeTab === 'due' && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                ลูกค้าที่ถึงกำหนดจ่ายวันนี้ ({dueData.length} คน)
              </p>
              <DueCustomersTable data={dueData} />
            </div>
          )}

          {activeTab === 'overdue' && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                ลูกค้าที่เกินกำหนดจ่าย ({overdueData.length} คน)
              </p>
              <OverdueCustomersTable data={overdueData} />
            </div>
          )}

          {activeTab === 'penalty' && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                ลูกค้าที่มีค่าปรับ — คิดวันละ 100 บาท ({penaltyData.length} คน)
              </p>
              <PenaltyCustomersTable data={penaltyData} onAction={handlePenaltyAction} />
            </div>
          )}

          {activeTab === 'inactive' && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                ลูกค้าออมมือถือที่ไม่ชำระเกิน 30 วัน ({inactiveData.length} คน)
              </p>
              <InactiveSavingsTable data={inactiveData} />
            </div>
          )}

          {activeTab === 'revenue' && revenueData && (
            <RevenueSummaryCard data={revenueData} />
          )}

          {activeTab === 'pickup' && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                ลูกค้าที่ชำระครบแล้ว ({pickupData.length} คน)
              </p>
              <ReadyForPickupTable data={pickupData} onPickup={handlePickup} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
