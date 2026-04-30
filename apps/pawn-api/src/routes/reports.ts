import { Hono } from 'hono';
import * as reportService from '../services/report.service.ts';

export const reportsRoute = new Hono();

reportsRoute.get('/monthly', async (c) => {
  const year = Number(c.req.query('year') ?? new Date().getFullYear());
  const month = Number(c.req.query('month') ?? new Date().getMonth() + 1);

  const result = await reportService.getMonthlySummary(year, month);
  return c.json(result);
});

reportsRoute.get('/export', async (c) => {
  const year = Number(c.req.query('year') ?? new Date().getFullYear());
  const month = Number(c.req.query('month') ?? new Date().getMonth() + 1);

  const buffer = await reportService.exportToExcel(year, month);

  c.header(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  );
  c.header(
    'Content-Disposition',
    `attachment; filename="report-${year}-${month}.xlsx"`,
  );
  return c.body(new Uint8Array(buffer));
});
