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
