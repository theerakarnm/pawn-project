'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getDevice, updateDevice } from '@/lib/api';
import type { DeviceDetail, DeviceStatus } from '@/types/api';
import { DeviceForm } from '@/components/devices/DeviceForm';
import { ArrowLeft } from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditDevicePage({ params }: PageProps) {
  const router = useRouter();
  const [device, setDevice] = useState<DeviceDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!device) {
    params.then(({ id }) => {
      getDevice(id)
        .then(setDevice)
        .catch(() => setError('Device not found'));
    });
  }

  const handleSubmit = async (data: {
    brand: string;
    model: string;
    storage: string;
    price?: string;
    status?: DeviceStatus;
  }) => {
    if (!device) return;
    await updateDevice(device.id, data);
    router.push('/devices');
    router.refresh();
  };

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/devices" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-5" />
          </Link>
          <h1 className="text-lg font-semibold">Edit Device</h1>
        </div>
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  if (!device) {
    return (
      <div className="py-6 text-center text-sm text-muted-foreground">
        Loading...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/devices" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-lg font-semibold">
          Edit: {device.brand} {device.model} {device.storage}
        </h1>
      </div>

      <DeviceForm
        initial={{
          brand: device.brand,
          model: device.model,
          storage: device.storage,
          price: device.price,
          status: device.status,
        }}
        onSubmit={handleSubmit}
        submitLabel="Update Device"
      />
    </div>
  );
}
