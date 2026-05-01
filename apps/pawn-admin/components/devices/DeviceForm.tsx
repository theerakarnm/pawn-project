'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { DeviceStatus } from '@/types/api';
import { Save } from 'lucide-react';

interface DeviceFormProps {
  initial?: {
    brand?: string;
    model?: string;
    storage?: string;
    price?: string | null;
    status?: DeviceStatus;
  };
  onSubmit: (data: {
    brand: string;
    model: string;
    storage: string;
    price?: string;
    status?: DeviceStatus;
  }) => Promise<void>;
  submitLabel?: string;
}

const BRANDS = [
  'Apple',
  'Samsung',
  'OPPO',
  'vivo',
  'Xiaomi',
  'realme',
];

const STORAGES = ['64GB', '128GB', '256GB', '512GB', '1TB'];

export function DeviceForm({
  initial,
  onSubmit,
  submitLabel = 'Save',
}: DeviceFormProps) {
  const [brand, setBrand] = useState(initial?.brand ?? '');
  const [customBrand, setCustomBrand] = useState(
    initial?.brand && !BRANDS.includes(initial.brand) ? initial.brand : '',
  );
  const [model, setModel] = useState(initial?.model ?? '');
  const [storage, setStorage] = useState(initial?.storage ?? '');
  const [price, setPrice] = useState(initial?.price ?? '');
  const [status, setStatus] = useState<DeviceStatus>(
    initial?.status ?? 'active',
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolvedBrand = brand === '__other__' ? customBrand : brand;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!resolvedBrand || !model || !storage) {
      setError('Brand, model, and storage are required');
      return;
    }

    setSaving(true);
    try {
      await onSubmit({
        brand: resolvedBrand,
        model,
        storage,
        price: price || undefined,
        status,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Device Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Brand *
              </label>
              <Select value={brand} onValueChange={setBrand}>
                <SelectTrigger>
                  <SelectValue placeholder="Select brand" />
                </SelectTrigger>
                <SelectContent>
                  {BRANDS.map((b) => (
                    <SelectItem key={b} value={b}>
                      {b}
                    </SelectItem>
                  ))}
                  <SelectItem value="__other__">Other...</SelectItem>
                </SelectContent>
              </Select>
              {brand === '__other__' && (
                <Input
                  className="mt-2"
                  value={customBrand}
                  onChange={(e) => setCustomBrand(e.target.value)}
                  placeholder="Enter brand name"
                />
              )}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Model *
              </label>
              <Input
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="e.g. iPhone 16 Pro"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Storage *
              </label>
              <Select value={storage} onValueChange={setStorage}>
                <SelectTrigger>
                  <SelectValue placeholder="Select storage" />
                </SelectTrigger>
                <SelectContent>
                  {STORAGES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Default Price (฿)
              </label>
              <Input
                type="number"
                value={price ?? ''}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0"
              />
            </div>
            {initial?.status && (
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Status
                </label>
                <Select value={status} onValueChange={(v) => setStatus(v as DeviceStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {error && <p className="mt-4 text-xs text-destructive">{error}</p>}

      <div className="mt-6 flex gap-3">
        <Button type="submit" disabled={saving}>
          <Save className="mr-1.5 size-4" />
          {saving ? 'Saving...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
