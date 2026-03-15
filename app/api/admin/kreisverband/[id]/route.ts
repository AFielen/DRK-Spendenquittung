import { NextRequest, NextResponse } from 'next/server';
import { getSession, isSuperadmin } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });
  if (!isSuperadmin(session)) return NextResponse.json({ error: 'Keine Berechtigung.' }, { status: 403 });

  const { id } = await params;

  const kv = await prisma.kreisverband.findUnique({
    where: { id },
    include: {
      _count: {
        select: { nutzer: true, spender: true, zuwendungen: true },
      },
    },
  });

  if (!kv) return NextResponse.json({ error: 'Kreisverband nicht gefunden.' }, { status: 404 });

  const summe = await prisma.zuwendung.aggregate({
    where: { kreisverbandId: id },
    _sum: { betrag: true },
  });

  return NextResponse.json({
    ...kv,
    logoBase64: undefined,
    zuwendungenSumme: summe._sum.betrag?.toString() ?? '0',
  });
}
