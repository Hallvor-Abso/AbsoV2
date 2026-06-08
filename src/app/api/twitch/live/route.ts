import { NextResponse } from 'next/server';
import { getStreamStatus } from '@/lib/twitch';

// Statut live de la chaîne, mis en cache 60 s côté serveur (limite les appels Helix).
export const revalidate = 60;

export async function GET() {
  const status = await getStreamStatus().catch(() => ({ live: false, login: '' }));
  return NextResponse.json(status, {
    headers: { 'Cache-Control': 'public, max-age=30, s-maxage=60' },
  });
}
