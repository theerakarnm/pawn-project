'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search } from 'lucide-react';

interface CustomerFiltersProps {
  currentSearch?: string;
  currentStatus?: string;
}

const statusOptions = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'due_soon', label: 'Due Soon' },
  { value: 'paid', label: 'Paid' },
];

const modeOptions = [
  { value: 'all', label: 'All Modes' },
  { value: 'savings', label: 'ออมมือถือ' },
  { value: 'installment', label: 'ผ่อนเป็นงวด' },
];

export function CustomerFilters({ currentSearch, currentStatus }: CustomerFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== 'all') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete('page');
    router.push(`/customers?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search name, phone, code..."
          className="pl-9"
          defaultValue={currentSearch}
          onChange={(e) => {
            const timeout = setTimeout(() => updateFilter('search', e.target.value), 300);
            return () => clearTimeout(timeout);
          }}
        />
      </div>
      <Select
        value={currentStatus ?? 'all'}
        onValueChange={(v) => updateFilter('status', v)}
      >
        <SelectTrigger className="w-40">
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
      <Select
        value={searchParams.get('mode') ?? 'all'}
        onValueChange={(v) => updateFilter('mode', v)}
      >
        <SelectTrigger className="w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {modeOptions.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
