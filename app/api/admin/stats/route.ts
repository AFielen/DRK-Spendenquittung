import { NextResponse } from 'next/server';
import { getSession, isSuperadmin } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });
  if (!isSuperadmin(session)) return NextResponse.json({ error: 'Keine Berechtigung.' }, { status: 403 });

  const [kvCount, nutzerCount, spenderCount, zuwendungenCount, zuwendungenSumme] = await Promise.all([
    prisma.kreisverband.count(),
    prisma.nutzer.count(),
    prisma.spender.count(),
    prisma.zuwendung.count(),
    prisma.zuwendung.aggregate({ _sum: { betrag: true } }),
  ]);

  return NextResponse.json({
    kreisverband: kvCount,
    nutzer: nutzerCount,
    spender: spenderCount,
    zuwendungen: zuwendungenCount,
    zuwendungenSumme: zuwendungenSumme._sum.betrag?.toString() ?? '0',
  });
}
