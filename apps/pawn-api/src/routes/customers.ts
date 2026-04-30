import { Hono } from 'hono';
import { z } from 'zod';
import * as customerService from '../services/customer.service.ts';

export const customersRoute = new Hono();

const createCustomerSchema = z.object({
  installmentCode: z.string().min(1),
  name: z.string().min(1),
  phone: z.string().min(1),
  totalPrice: z.string().min(1),
  downPayment: z.string().min(1),
  monthlyPayment: z.string().min(1),
  totalInstallments: z.number().int().positive(),
  dueDate: z.string().optional(),
});

const updateCustomerSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  monthlyPayment: z.string().min(1).optional(),
  dueDate: z.string().nullable().optional(),
  status: z.enum(['active', 'paid', 'overdue', 'due_soon']).optional(),
});

customersRoute.get('/', async (c) => {
  const search = c.req.query('search');
  const status = c.req.query('status');
  const page = Number(c.req.query('page') ?? '1');

  const result = await customerService.listCustomers({ search, status, page });
  return c.json(result);
});

customersRoute.get('/by-line/:lineUserId', async (c) => {
  const lineUserId = c.req.param('lineUserId');
  const customer = await customerService.findByLineUserId(lineUserId);
  if (!customer) return c.json({ error: 'Customer not found' }, 404);
  return c.json({
    installmentCode: customer.installmentCode,
    remainingBalance: customer.remainingBalance,
    dueDate: customer.dueDate,
    status: customer.status,
  });
});

customersRoute.get('/:id', async (c) => {
  const id = c.req.param('id');
  try {
    const result = await customerService.getCustomer(id);
    return c.json(result);
  } catch (err) {
    if (err instanceof Error && err.message === 'NOT_FOUND') {
      return c.json({ error: 'Customer not found' }, 404);
    }
    throw err;
  }
});

customersRoute.post('/', async (c) => {
  const body = await c.req.json();
  const parsed = createCustomerSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.issues }, 400);
  }
  const result = await customerService.createCustomer(parsed.data);
  return c.json(result, 201);
});

customersRoute.patch('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const parsed = updateCustomerSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.issues }, 400);
  }
  try {
    const result = await customerService.updateCustomer(id, parsed.data);
    return c.json(result);
  } catch (err) {
    if (err instanceof Error && err.message === 'NOT_FOUND') {
      return c.json({ error: 'Customer not found' }, 404);
    }
    throw err;
  }
});
