'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { createCustomer, getActiveDeviceLabels } from '@/lib/api';
import { ArrowLeft, Save, Upload } from 'lucide-react';
import Link from 'next/link';

export default function NewCustomerPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [deviceModel, setDeviceModel] = useState('');
  const [totalPrice, setTotalPrice] = useState('');
  const [downPayment, setDownPayment] = useState('');
  const [totalInstallments, setTotalInstallments] = useState('6');
  const [deviceLabels, setDeviceLabels] = useState<string[]>([]);

  useEffect(() => {
    setDeviceLabels(getActiveDeviceLabels());
  }, []);

  const [faceFile, setFaceFile] = useState<File | null>(null);
  const [idFrontFile, setIdFrontFile] = useState<File | null>(null);
  const [idBackFile, setIdBackFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name || !phone || !deviceModel || !totalPrice || !downPayment) {
      setError('Please fill all required fields');
      return;
    }

    setSaving(true);
    try {
      const customer = await createCustomer({
        name,
        phone,
        deviceModel,
        totalPrice,
        downPayment,
        totalInstallments: Number(totalInstallments),
      });
      router.push(`/customers/${customer.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create customer');
      setSaving(false);
    }
  };

  const total = Number(totalPrice.replace(/,/g, '')) || 0;
  const down = Number(downPayment.replace(/,/g, '')) || 0;
  const installments = Number(totalInstallments) || 1;
  const remaining = total - down;
  const monthly = remaining / installments;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/customers" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-lg font-semibold">New Customer</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Customer Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Name *
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ชื่อ นามสกุล"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Phone *
                </label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="08X-XXX-XXXX"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Device Model *
                </label>
                <Select value={deviceModel} onValueChange={setDeviceModel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select device" />
                  </SelectTrigger>
                  <SelectContent>
                    {deviceLabels.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Contract Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Total Price (฿) *
                </label>
                <Input
                  type="number"
                  value={totalPrice}
                  onChange={(e) => setTotalPrice(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Down Payment (฿) *
                </label>
                <Input
                  type="number"
                  value={downPayment}
                  onChange={(e) => setDownPayment(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Total Installments
                </label>
                <Select value={totalInstallments} onValueChange={setTotalInstallments}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[3, 4, 5, 6, 9, 10, 12].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n} งวด
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {total > 0 && (
                <div className="mt-4 space-y-1 rounded border bg-muted p-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Remaining</span>
                    <span className="font-semibold">
                      ฿{remaining.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Monthly</span>
                    <span className="font-semibold text-primary">
                      ฿{monthly.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-sm">Identity Documents (Optional)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <FileUploadField
                label="Face Photo"
                file={faceFile}
                onChange={setFaceFile}
              />
              <FileUploadField
                label="ID Card (Front)"
                file={idFrontFile}
                onChange={setIdFrontFile}
              />
              <FileUploadField
                label="ID Card (Back)"
                file={idBackFile}
                onChange={setIdBackFile}
              />
            </div>
          </CardContent>
        </Card>

        {error && (
          <p className="mt-4 text-xs text-destructive">{error}</p>
        )}

        <div className="mt-6 flex gap-3">
          <Button type="submit" disabled={saving}>
            <Save className="mr-1.5 size-4" />
            {saving ? 'Creating...' : 'Create Customer'}
          </Button>
          <Link href="/customers">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}

function FileUploadField({
  label,
  file,
  onChange,
}: {
  label: string;
  file: File | null;
  onChange: (f: File | null) => void;
}) {
  const previewUrl = file ? URL.createObjectURL(file) : null;

  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-muted-foreground">{label}</label>
      <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50">
        {previewUrl ? (
          <>
            <img
              src={previewUrl}
              alt={label}
              className="size-full object-cover"
            />
            <button
              type="button"
              onClick={() => onChange(null)}
              className="absolute right-1 top-1 rounded-full bg-black/50 px-1.5 py-0.5 text-[10px] text-white hover:bg-black/70"
            >
              Remove
            </button>
          </>
        ) : (
          <label className="flex cursor-pointer flex-col items-center gap-1.5 text-muted-foreground hover:text-foreground">
            <Upload className="size-5" />
            <span className="text-[10px]">Click to upload</span>
            <input
              type="file"
              accept="image/jpeg,image/png"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onChange(f);
              }}
            />
          </label>
        )}
      </div>
      {file && (
        <p className="truncate text-[10px] text-muted-foreground">{file.name}</p>
      )}
    </div>
  );
}
