import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { customersRoute } from './routes/customers.ts';
import { paymentsRoute } from './routes/payments.ts';
import { webhookRoute } from './routes/webhook.ts';
import { dashboardRoute } from './routes/dashboard.ts';
import { reportsRoute } from './routes/reports.ts';

const app = new Hono();

app.use('*', logger());
app.use('/api/*', cors({ origin: '*' }));

app.route('/api/customers', customersRoute);
app.route('/api/payments', paymentsRoute);
app.route('/api/dashboard', dashboardRoute);
app.route('/api/reports', reportsRoute);
app.route('/', webhookRoute);

app.onError((err, c) => {
  console.error(err);
  return c.json({ error: 'Internal server error' }, 500);
});

export default { port: Number(process.env.PORT ?? 3001), fetch: app.fetch };
