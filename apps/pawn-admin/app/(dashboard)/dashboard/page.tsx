import { StatsCard } from '@/components/dashboard/StatsCard';
import { WeeklyBarChart } from '@/components/dashboard/WeeklyBarChart';
import { ActivityTimeline } from '@/components/admin/ActivityTimeline';
import { DueTodayList } from '@/components/admin/DueTodayList';
import { StaffSummary } from '@/components/admin/StaffSummary';
import { getDashboard, getStaff } from '@/lib/api';
import { AlertTriangle, Clock, FileQuestion, TrendingUp, Users, Wallet } from 'lucide-react';
import Link from 'next/link';

export default async function DashboardPage() {
  const stats = await getDashboard();
  const staff = await getStaff();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Operations Dashboard</h1>
        <span className="text-xs text-muted-foreground">
          {new Date().toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </span>
      </div>

      <div className="grid grid-cols-6 gap-4">
        <StatsCard
          title="ลูกค้าทั้งหมด"
          value={stats.totalCustomers}
          icon={<Users className="size-4" />}
        />
        <StatsCard
          title="ค้างชำระ"
          value={stats.overdueCount}
          icon={<AlertTriangle className="size-4 text-red-500" />}
          className={stats.overdueCount > 0 ? 'border-red-200' : ''}
        />
        <StatsCard
          title="ใกล้ครบกำหนด"
          value={stats.dueSoonCount}
          icon={<Clock className="size-4 text-amber-500" />}
        />
        <StatsCard
          title="สลิปรอตรวจ"
          value={stats.pendingSlips}
          icon={<FileQuestion className="size-4 text-blue-500" />}
          className={stats.pendingSlips > 0 ? 'border-blue-200' : ''}
        />
        <StatsCard
          title="รับวันนี้"
          value={`฿${stats.todayReceipts.total}`}
          subtext={`${stats.todayReceipts.count} รายการ`}
          icon={<Wallet className="size-4 text-green-500" />}
        />
        <StatsCard
          title="Collection Rate"
          value={`${stats.collectionRate}%`}
          icon={<TrendingUp className="size-4" />}
        />
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <h2 className="mb-3 text-sm font-medium">ยอดรับ 7 วันล่าสุด</h2>
          <WeeklyBarChart data={stats.weeklyChart} />
        </div>
        <div className="space-y-4">
          {stats.pendingSlips > 0 && (
            <Link
              href="/queue"
              className="block rounded-lg border border-blue-200 bg-blue-50 p-4 transition-colors hover:bg-blue-100"
            >
              <div className="flex items-center gap-2">
                <FileQuestion className="size-5 text-blue-600" />
                <span className="text-sm font-semibold text-blue-900">
                  {stats.pendingSlips} สลิปรอตรวจสอบ
                </span>
              </div>
              <p className="mt-1 text-xs text-blue-700">คลิกเพื่อไปยัง Slip Queue</p>
            </Link>
          )}

          <div>
            <h3 className="mb-2 text-sm font-medium">ยอดรับเดือนนี้</h3>
            <div className="rounded-lg border p-4">
              <div className="text-2xl font-bold">฿{stats.monthlyReceipts.total}</div>
              <p className="text-xs text-muted-foreground">{stats.monthlyReceipts.count} รายการ</p>
            </div>
          </div>

          <StaffSummary staff={staff} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <ActivityTimeline activities={stats.recentActivity} />
        <DueTodayList items={stats.dueToday} />
      </div>
    </div>
  );
}
