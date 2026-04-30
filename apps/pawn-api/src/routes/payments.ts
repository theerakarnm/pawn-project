import { Hono } from 'hono';
import { z } from 'zod';
import * as paymentService from '../services/payment.service.ts';

export const paymentsRoute = new Hono();

const confirmSchema = z.object({
  confirmedBy: z.string().min(1),
});

const rejectSchema = z.object({
  rejectedBy: z.string().min(1),
  reason: z.string().min(1),
});

paymentsRoute.post('/', async (c) => {
  const formData = await c.req.formData();

  const customerId = formData.get('customerId') as string | null;
  const phone = formData.get('phone') as string | null;
  const amount = formData.get('amount') as string | null;
  const lineUserId = formData.get('lineUserId') as string | null;
  const file = formData.get('slip') as File | null;

  if (!customerId && !phone) {
    return c.json({ error: 'customerId or phone is required' }, 400);
  }
  if (!amount || Number(amount) <= 0) {
    return c.json({ error: 'amount must be positive' }, 400);
  }
  if (!file) {
    return c.json({ error: 'slip file is required' }, 400);
  }
  if (file.size > 5 * 1024 * 1024) {
    return c.json({ error: 'file must be under 5MB' }, 400);
  }

  const buffer = new Uint8Array(await file.arrayBuffer());

  try {
    const result = await paymentService.submitPayment({
      customerId: customerId ?? undefined,
      phone: phone ?? undefined,
      amount,
      slipBuffer: buffer,
      lineUserId: lineUserId ?? undefined,
    });
    return c.json(result, 201);
  } catch (err) {
    if (err instanceof Error && err.message === 'NOT_FOUND') {
      return c.json({ error: 'Customer not found' }, 404);
    }
    if (err instanceof Error && err.message.startsWith('Invalid file type')) {
      return c.json({ error: err.message }, 400);
    }
    throw err;
  }
});

paymentsRoute.get('/', async (c) => {
  const status = c.req.query('status');
  if (status === 'pending_verification') {
    const result = await paymentService.listPendingPayments();
    return c.json(result);
  }
  return c.json([]);
});

paymentsRoute.post('/:id/confirm', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const parsed = confirmSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.issues }, 400);
  }

  try {
    const result = await paymentService.confirmPayment(id, parsed.data.confirmedBy);
    return c.json(result);
  } catch (err) {
    if (err instanceof Error && err.message === 'NOT_FOUND') {
      return c.json({ error: 'Payment not found' }, 404);
    }
    if (err instanceof Error && err.message === 'INVALID_STATUS') {
      return c.json({ error: 'Payment is not pending verification' }, 409);
    }
    if (err instanceof Error && err.message === 'INSUFFICIENT_BALANCE') {
      return c.json({ error: 'Insufficient balance' }, 422);
    }
    throw err;
  }
});

paymentsRoute.post('/:id/reject', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const parsed = rejectSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.issues }, 400);
  }

  try {
    const result = await paymentService.rejectPayment(
      id,
      parsed.data.rejectedBy,
      parsed.data.reason,
    );
    return c.json(result);
  } catch (err) {
    if (err instanceof Error && err.message === 'NOT_FOUND') {
      return c.json({ error: 'Payment not found' }, 404);
    }
    if (err instanceof Error && err.message === 'INVALID_STATUS') {
      return c.json({ error: 'Payment is not pending verification' }, 409);
    }
    throw err;
  }
});
