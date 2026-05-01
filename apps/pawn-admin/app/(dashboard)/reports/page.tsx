'use client';

import { useState, useEffect } from 'react';
import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from 'recharts';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { MonthlyTable } from '@/components/reports/MonthlyTable';
import { ExportButton } from '@/components/reports/ExportButton';
import { getMonthlyReport } from '@/lib/api';
import type { MonthlyReport } from '@/types/api';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Receipt, Users, Wallet } from 'lucide-react';

const chartConfig = {
  totalAmount: {
    label: 'ยอดรวม (฿)',
    color: 'var(--chart-2)',
  },
} satisfies ChartConfig;

export default function ReportsPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData] = useState<MonthlyReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getMonthlyReport(year, month).then((result) => {
      if (!cancelled) {
        setData(result);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [year, month]);

  const chartData = data.map((r) => ({
    date: r.date,
    totalAmount: Number(r.totalAmount.replace(/,/g, '')),
  }));

  const totalRevenue = chartData.reduce((sum, d) => sum + d.totalAmount, 0);
  const totalPayments = data.reduce((sum, d) => sum + d.paymentCount, 0);
  const totalCustomers = data.reduce((sum, d) => sum + d.customerCount, 0);
  const avgPerDay = data.length > 0 ? totalRevenue / data.filter((d) => d.paymentCount > 0).length : 0;

  const years = Array.from(
    { length: 5 },
    (_, i) => now.getFullYear() - i,
  );
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Reports</h1>
        <ExportButton year={year} month={month} />
      </div>

      <div className="flex gap-2">
        <Select
          value={String(year)}
          onValueChange={(v) => setYear(Number(v))}
        >
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={String(month)}
          onValueChange={(v) => setMonth(Number(v))}
        >
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {months.map((m) => (
              <SelectItem key={m} value={String(m)}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Wallet className="size-3.5" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              ฿{totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Receipt className="size-3.5" />
              Total Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{totalPayments}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Users className="size-3.5" />
              Unique Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{totalCustomers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <TrendingUp className="size-3.5" />
              Avg / Active Day
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              ฿{avgPerDay.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : (
        <>
          <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
            <BarChart data={chartData}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
              <YAxis tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="totalAmount" fill="var(--color-totalAmount)" radius={4} />
            </BarChart>
          </ChartContainer>

          <MonthlyTable data={data} />
        </>
      )}
    </div>
  );
}
