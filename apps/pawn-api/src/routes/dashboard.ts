import { Hono } from 'hono';
import * as dashboardService from '../services/dashboard.service.ts';

export const dashboardRoute = new Hono();

dashboardRoute.get('/', async (c) => {
  const stats = await dashboardService.getStats();
  return c.json(stats);
});
