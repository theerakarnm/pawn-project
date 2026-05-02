import { Hono } from 'hono';
import { validateSignature } from '@line/bot-sdk';
import * as customerService from '../services/customer.service.ts';
import { lineClient, buildBalanceFlex } from '../lib/line.ts';

export const webhookRoute = new Hono();

type WebhookEvent = {
  type: string;
  replyToken: string;
  source: { userId: string };
  postback?: { data: string };
};

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
  const events = body.events as WebhookEvent[];

  void processEvents(events).catch((e: unknown) =>
    console.error('Webhook event processing failed:', e),
  );

  return c.text('OK');
});

async function processEvents(events: WebhookEvent[]) {
  for (const event of events) {
    if (event.type !== 'postback' || !event.postback) continue;

    switch (event.postback.data) {
      case 'check_balance': {
        const allCustomers = await customerService.findAllByLineUserId(event.source.userId);

        if (allCustomers.length === 0) {
          await lineClient.replyMessage({
            replyToken: event.replyToken,
            messages: [{ type: 'text', text: 'ไม่พบข้อมูลการผ่อน กรุณาติดต่อร้าน' }],
          });
          return;
        }

        if (allCustomers.length === 1) {
          const customer = allCustomers[0]!;
          await lineClient.replyMessage({
            replyToken: event.replyToken,
            messages: [buildBalanceFlex({
              installmentCode: customer.installmentCode,
              remainingBalance: customer.remainingBalance,
              totalInstallments: customer.totalInstallments,
              paidInstallments: customer.paidInstallments,
              dueDate: customer.dueDate,
            })],
          });
          return;
        }

        const bubbles = allCustomers.map((c) => ({
          type: 'bubble' as const,
          header: {
            type: 'box' as const,
            layout: 'vertical' as const,
            backgroundColor: '#1A73E8',
            contents: [
              {
                type: 'text' as const,
                text: c.installmentCode,
                color: '#FFFFFF',
                weight: 'bold' as const,
                size: 'md' as const,
              },
            ],
            paddingAll: '12px',
          },
          body: {
            type: 'box' as const,
            layout: 'vertical' as const,
            spacing: 'sm' as const,
            paddingAll: '12px',
            contents: [
              {
                type: 'text' as const,
                text: `฿${Number(c.remainingBalance).toLocaleString('th-TH')}`,
                weight: 'bold' as const,
                size: 'lg' as const,
                color: '#E74C3C',
              },
              {
                type: 'text' as const,
                text: `เหลือ ${c.totalInstallments - c.paidInstallments} งวด`,
                size: 'sm' as const,
                color: '#555555',
              },
              ...(c.dueDate
                ? [{
                    type: 'text' as const,
                    text: `ครบกำหนด: ${c.dueDate}`,
                    size: 'xs' as const,
                    color: '#888888',
                  }]
                : []),
            ],
          },
        }));

        await lineClient.replyMessage({
          replyToken: event.replyToken,
          messages: [
            {
              type: 'flex',
              altText: `มี ${allCustomers.length} รายการผ่อน`,
              contents: {
                type: 'carousel',
                contents: bubbles,
              },
            },
          ],
        });
        break;
      }
      case 'contact_staff':
        await lineClient.replyMessage({
          replyToken: event.replyToken,
          messages: [{ type: 'text', text: 'ติดต่อร้านได้ที่\nโทร 02-XXX-XXXX\nวันจันทร์–เสาร์ 09:00–18:00' }],
        });
        break;
    }
  }
}
