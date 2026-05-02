import { messagingApi } from '@line/bot-sdk';

export const lineClient = new messagingApi.MessagingApiClient({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN!,
});

export function buildPaymentConfirmFlex({
  amount,
  remainingBalance,
  nextDueDate,
  installmentCode,
}: {
  amount: string;
  remainingBalance: string;
  nextDueDate: string | null;
  installmentCode: string;
}): messagingApi.PushMessageRequest {
  const bodyContents: messagingApi.FlexText[] = [
    {
      type: 'text',
      text: `รหัสผ่อน: ${installmentCode}`,
      size: 'sm',
      color: '#666666',
    },
    {
      type: 'text',
      text: `฿${amount}`,
      size: 'lg',
      weight: 'bold',
      margin: 'md',
    },
    {
      type: 'text',
      text: `คงเหลือ: ฿${remainingBalance}`,
      size: 'md',
      color: '#E74C3C',
      margin: 'sm',
    },
  ];

  if (nextDueDate) {
    bodyContents.push({
      type: 'text',
      text: `ครบกำหนดชำระครั้งถัดไป: ${nextDueDate}`,
      size: 'sm',
      color: '#999999',
      margin: 'sm',
    });
  }

  return {
    to: '',
    messages: [
      {
        type: 'flex',
        altText: 'ชำระเงินสำเร็จ',
        contents: {
          type: 'bubble',
          header: {
            type: 'box',
            layout: 'vertical',
            backgroundColor: '#00B900',
            contents: [
              {
                type: 'text',
                text: 'ชำระเงินสำเร็จ',
                color: '#FFFFFF',
                weight: 'bold',
                size: 'xl',
              },
            ],
            paddingAll: '20px',
          },
          body: {
            type: 'box',
            layout: 'vertical',
            contents: bodyContents,
            paddingAll: '20px',
          },
        },
      },
    ],
  };
}

export function buildBalanceFlex(customer: {
  installmentCode: string;
  remainingBalance: string;
  totalInstallments: number;
  paidInstallments: number;
  dueDate: string | null;
}): messagingApi.Message {
  const remaining = customer.totalInstallments - customer.paidInstallments;
  const bodyContents: messagingApi.FlexComponent[] = [
    {
      type: 'text',
      text: `฿${Number(customer.remainingBalance).toLocaleString('th-TH')}`,
      size: 'xxl',
      weight: 'bold',
      align: 'center',
      color: '#1A73E8',
    },
    {
      type: 'separator',
    },
    {
      type: 'text',
      text: `เหลืออีก ${remaining} งวด`,
      align: 'center',
      color: '#555555',
    },
  ];

  if (customer.dueDate) {
    bodyContents.push({
      type: 'text',
      text: `กำหนดชำระ: ${customer.dueDate}`,
      align: 'center',
      color: '#888888',
      size: 'sm',
    });
  }

  return {
    type: 'flex',
    altText: `ยอดคงเหลือ ฿${customer.remainingBalance}`,
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#1A73E8',
        contents: [
          {
            type: 'text',
            text: '💰 ยอดคงเหลือ',
            color: '#FFFFFF',
            weight: 'bold',
            size: 'lg',
          },
        ],
        paddingAll: '20px',
      },
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'md',
        paddingAll: '20px',
        contents: bodyContents,
      },
    },
  };
}
