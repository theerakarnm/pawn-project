'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createDevice } from '@/lib/api';
import { DeviceForm } from '@/components/devices/DeviceForm';
import { ArrowLeft } from 'lucide-react';

export default function NewDevicePage() {
  const router = useRouter();

  const handleSubmit = async (data: {
    brand: string;
    model: string;
    storage: string;
    price?: string;
  }) => {
    const device = await createDevice(data);
    router.push(`/devices/${device.id}/edit`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/devices" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-lg font-semibold">Add Device</h1>
      </div>

      <DeviceForm onSubmit={handleSubmit} submitLabel="Create Device" />
    </div>
  );
}
