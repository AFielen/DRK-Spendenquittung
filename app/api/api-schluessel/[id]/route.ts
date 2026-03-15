import { NextRequest, NextResponse } from 'next/server';
import { getSession, requireSchreibrecht } from '@/lib/auth';
import { prisma } from '@/lib/db';

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });
  if (!requireSchreibrecht(session)) return NextResponse.json({ error: 'Keine Berechtigung.' }, { status: 403 });

  const { id } = await params;

  const existing = await prisma.apiKey.findFirst({
    where: { id, kreisverbandId: session.kreisverbandId },
  });

  if (!existing) return NextResponse.json({ error: 'API-Schlüssel nicht gefunden.' }, { status: 404 });

  await prisma.apiKey.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
