import * as Ably from 'ably';
import { NextResponse } from 'next/server';

const rest = new Ably.Rest(process.env.ABLY_API_KEY!);

export async function GET(): Promise<NextResponse> {
  const tokenRequest = await rest.auth.createTokenRequest({
    clientId: 'frontend-user',
    ttl: 3600 * 1000,
  });
  return NextResponse.json(tokenRequest);
}
