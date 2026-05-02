import { Hono } from 'hono';
import { z } from 'zod';
import { verifyLiffIdToken, extractBearerToken, type VerifiedLineUser } from '../lib/liff-auth.ts';
import * as liffService from '../services/liff.service.ts';

type LiffEnv = {
  Variables: { lineUser: VerifiedLineUser };
};

export const liffRoute = new Hono<LiffEnv>();

liffRoute.use('*', async (c, next) => {
  const token = extractBearerToken(c.req.header('Authorization'));
  if (!token) {
    return c.json({ error: 'Missing Authorization header' }, 401);
  }
  try {
    const user = await verifyLiffIdToken(token);
    c.set('lineUser', user);
    await next();
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('INVALID_ID_TOKEN')) {
      return c.json({ error: 'Invalid ID token' }, 401);
    }
    throw err;
  }
});

liffRoute.get('/me', async (c) => {
  const user = c.get('lineUser');
  const session = await liffService.getLiffSession(user.lineUserId);
  return c.json({ ...session, lineDisplayName: user.displayName });
});

const phoneKycSchema = z.object({
  phone: z.string().min(8),
});

liffRoute.post('/kyc/phone', async (c) => {
  const user = c.get('lineUser');
  const body = await c.req.json();
  const parsed = phoneKycSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.issues }, 400);
  }

  try {
    const result = await liffService.submitPhoneKyc(
      user.lineUserId,
      parsed.data.phone,
      user.displayName,
      user.pictureUrl,
    );
    return c.json(result);
  } catch (err) {
    if (err instanceof Error && err.message === 'PHONE_LINKED_TO_ANOTHER_LINE') {
      return c.json({ error: 'เบอร์โทรนี้เชื่อมต่อกับ LINE อื่นแล้ว กรุณาติดต่อร้าน' }, 409);
    }
    throw err;
  }
});

const profileSchema = z.object({
  name: z.string().min(1),
  birthdate: z.string().min(1),
  email: z.string().email().optional(),
});

liffRoute.post('/kyc/profile', async (c) => {
  const user = c.get('lineUser');
  const body = await c.req.json();
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.issues }, 400);
  }

  try {
    await liffService.submitPendingProfile(
      user.lineUserId,
      parsed.data.name,
      parsed.data.birthdate,
      parsed.data.email,
    );
    return c.json({ ok: true });
  } catch (err) {
    if (err instanceof Error && err.message === 'PROFILE_NOT_FOUND') {
      return c.json({ error: 'กรุณายืนยันเบอร์โทรก่อน' }, 400);
    }
    if (err instanceof Error && err.message === 'ALREADY_LINKED') {
      return c.json({ error: 'Already linked' }, 409);
    }
    throw err;
  }
});

liffRoute.get('/installments/:id', async (c) => {
  const user = c.get('lineUser');
  const customerId = c.req.param('id');

  try {
    const detail = await liffService.getInstallmentDetail(user.lineUserId, customerId);
    return c.json(detail);
  } catch (err) {
    if (err instanceof Error && err.message === 'NOT_FOUND') {
      return c.json({ error: 'Installment not found' }, 404);
    }
    throw err;
  }
});

liffRoute.post('/payments', async (c) => {
  const user = c.get('lineUser');
  const formData = await c.req.formData();

  const customerId = formData.get('customerId') as string | null;
  const amount = formData.get('amount') as string | null;
  const file = formData.get('slip') as File | null;

  if (!customerId) {
    return c.json({ error: 'customerId is required' }, 400);
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
    const result = await liffService.submitLinkedPayment(
      user.lineUserId,
      customerId,
      amount,
      buffer,
    );
    return c.json(result, 201);
  } catch (err) {
    if (err instanceof Error && err.message === 'NOT_FOUND') {
      return c.json({ error: 'Installment not found' }, 404);
    }
    if (err instanceof Error && err.message.startsWith('Invalid file type')) {
      return c.json({ error: err.message }, 400);
    }
    throw err;
  }
});
