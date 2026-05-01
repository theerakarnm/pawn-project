'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getDevices, removeDevice } from '@/lib/api';
import type { DeviceListItem, DeviceStatus } from '@/types/api';
import { DeviceTable } from '@/components/devices/DeviceTable';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Search } from 'lucide-react';

const statusOptions = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

export default function DevicesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = searchParams.get('search') ?? '';
  const statusFilter = searchParams.get('status') ?? 'all';

  const [devices, setDevices] = useState<DeviceListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loaded, setLoaded] = useState(false);

  if (!loaded) {
    getDevices({
      search: search || undefined,
      status: statusFilter !== 'all' ? (statusFilter as DeviceStatus) : undefined,
    }).then(({ devices: d, total: t }) => {
      setDevices(d);
      setTotal(t);
      setLoaded(true);
    });
  }

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== 'all') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete('page');
    router.push(`/devices?${params.toString()}`);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Deactivate this device? It will no longer appear in the device selector.')) return;
    await removeDevice(id);
    setLoaded(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Devices</h1>
          <p className="text-xs text-muted-foreground">{total} total</p>
        </div>
        <Link
          href="/devices/new"
          className="flex items-center gap-1.5 rounded bg-primary px-3 py-2 text-xs font-medium text-primary-foreground"
        >
          <Plus className="size-3.5" />
          Add Device
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search brand, model, storage..."
            className="pl-9"
            defaultValue={search}
            onChange={(e) => {
              const timeout = setTimeout(() => updateFilter('search', e.target.value), 300);
              return () => clearTimeout(timeout);
            }}
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => updateFilter('status', v)}
        >
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loaded && <DeviceTable devices={devices} onDelete={handleDelete} />}
    </div>
  );
}
