'use client';

import { useState } from 'react';
import type { PaymentQueueItem } from '@/types/api';
import { confirmPayment, rejectPayment } from '@/lib/api';
import { SlipLightbox } from './SlipLightbox';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { CheckCircle2, XCircle, Clock, User, CreditCard } from 'lucide-react';

interface SlipQueueProps {
  initialPayments: PaymentQueueItem[];
  staffName?: string;
}

const STAFF = 'สมชาย ใจดี';

export function SlipQueue({ initialPayments, staffName = STAFF }: SlipQueueProps) {
  const [payments, setPayments] = useState(initialPayments);
  const [rejectDialogId, setRejectDialogId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<string[]>([]);
  const [rejected, setRejected] = useState<string[]>([]);

  const handleConfirm = async (id: string) => {
    setError(null);
    setConfirmed((prev) => [...prev, id]);
    const prev = payments;
    setPayments((p) => p.filter((item) => item.id !== id));
    try {
      await confirmPayment(id, staffName);
    } catch {
      setPayments(prev);
      setConfirmed((prev) => prev.filter((x) => x !== id));
      setError('Confirm failed');
    }
  };

  const handleReject = async () => {
    if (!rejectDialogId || !rejectReason.trim()) return;
    setError(null);
    const id = rejectDialogId;
    setRejected((prev) => [...prev, id]);
    setPayments((p) => p.filter((item) => item.id !== id));
    setRejectDialogId(null);
    setRejectReason('');
    try {
      await rejectPayment(id, staffName, rejectReason);
    } catch {
      setRejected((prev) => prev.filter((x) => x !== id));
      setError('Reject failed');
    }
  };

  return (
    <div className="space-y-4">
      {error && <p className="text-xs text-destructive">{error}</p>}

      {payments.length === 0 && confirmed.length === 0 && rejected.length === 0 && (
        <div className="py-8 text-center text-sm text-muted-foreground">
          No pending slips
        </div>
      )}

      {payments.map((p) => (
        <div key={p.id} className="rounded-lg border p-4">
          <div className="flex gap-4">
            <SlipLightbox slipUrl={p.slipUrl} />
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <User className="size-4 text-muted-foreground" />
                <span className="font-medium">{p.customerName}</span>
                <span className="text-xs text-muted-foreground">{p.installmentCode}</span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <CreditCard className="size-3.5" />
                  ฿{p.amount}
                </span>
                <span className="text-xs text-muted-foreground">{p.phone}</span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="size-3" />
                  {new Date(p.createdAt).toLocaleString('th-TH', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Button size="sm" onClick={() => handleConfirm(p.id)} className="gap-1">
                <CheckCircle2 className="size-3.5" />
                Confirm
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setRejectDialogId(p.id)}
                className="gap-1"
              >
                <XCircle className="size-3.5" />
                Reject
              </Button>
            </div>
          </div>
        </div>
      ))}

      {confirmed.length > 0 && (
        <div className="space-y-1">
          <h3 className="text-xs font-medium text-muted-foreground">Just Confirmed</h3>
          {confirmed.map((id) => {
            const p = initialPayments.find((x) => x.id === id);
            return p ? (
              <div key={id} className="flex items-center gap-2 rounded bg-green-50 px-3 py-2 text-xs text-green-800">
                <CheckCircle2 className="size-3.5" />
                <span>{p.customerName}</span>
                <span>·</span>
                <span>฿{p.amount}</span>
                <span className="ml-auto text-green-600">✓ LINE notification sent (mock)</span>
              </div>
            ) : null;
          })}
        </div>
      )}

      {rejected.length > 0 && (
        <div className="space-y-1">
          <h3 className="text-xs font-medium text-muted-foreground">Just Rejected</h3>
          {rejected.map((id) => {
            const p = initialPayments.find((x) => x.id === id);
            return p ? (
              <div key={id} className="flex items-center gap-2 rounded bg-red-50 px-3 py-2 text-xs text-red-800">
                <XCircle className="size-3.5" />
                <span>{p.customerName}</span>
                <span>·</span>
                <span>฿{p.amount}</span>
                <span className="ml-auto text-red-600">✗ LINE rejection sent (mock)</span>
              </div>
            ) : null;
          })}
        </div>
      )}

      <Dialog
        open={rejectDialogId !== null}
        onOpenChange={(open) => {
          if (!open) setRejectDialogId(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Payment</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Reason for rejection..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject}>
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
