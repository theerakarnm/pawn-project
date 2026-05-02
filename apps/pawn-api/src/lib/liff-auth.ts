interface LineVerifyResponse {
  sub: string;
  aud: string;
  name?: string;
  picture?: string;
  email?: string;
}

export interface VerifiedLineUser {
  lineUserId: string;
  displayName: string;
  pictureUrl: string | null;
  email: string | null;
}

export async function verifyLiffIdToken(idToken: string): Promise<VerifiedLineUser> {
  const channelId = process.env.LINE_LOGIN_CHANNEL_ID;
  if (!channelId) throw new Error('LINE_LOGIN_CHANNEL_ID not configured');

  const res = await fetch('https://api.line.me/oauth2/v2.1/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ id_token: idToken, client_id: channelId }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error('LINE ID token verification failed:', res.status, body);
    throw new Error('INVALID_ID_TOKEN');
  }

  const data = (await res.json()) as LineVerifyResponse;

  if (data.aud !== channelId) {
    throw new Error('INVALID_ID_TOKEN_AUD');
  }

  return {
    lineUserId: data.sub,
    displayName: data.name ?? '',
    pictureUrl: data.picture ?? null,
    email: data.email ?? null,
  };
}

export function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  return parts[1] ?? null;
}
