import { Hono } from 'hono';
import { validateSignature } from '@line/bot-sdk';
import * as customerService from '../services/customer.service.ts';
import { lineClient } from '../lib/line.ts';

export const webhookRoute = new Hono();

webhookRoute.post('/webhook', async (c) => {
  const rawBody = await c.req.text();
  const signature = c.req.header('x-line-signature') ?? '';

  if (
    !validateSignature(
      rawBody,
      process.env.LINE_CHANNEL_SECRET!,
      signature,
    )
  ) {
    return c.text('Unauthorized', 400);
  }

  const body = JSON.parse(rawBody);
  const events = body.events as Array<{
    type: string;
    source: { userId: string };
    postback?: { data: string };
  }>;

  void processEvents(events).catch((e: unknown) =>
    console.error('Webhook event processing failed:', e),
  );

  return c.text('OK');
});

async function processEvents(
  events: Array<{
    type: string;
    source: { userId: string };
    postback?: { data: string };
  }>,
) {
  for (const event of events) {
    if (event.type === 'postback' && event.postback?.data === 'check_balance') {
      const customer = await customerService.findByLineUserId(event.source.userId);
      if (!customer) continue;

      await lineClient.pushMessage({
        to: event.source.userId,
        messages: [
          {
            type: 'text',
            text: `ยอดคงเหลือ: ฿${customer.remainingBalance}\nงวดถัดไป: ${customer.dueDate ?? 'ไม่ระบุ'}`,
          },
        ],
      });
    }
  }
}
