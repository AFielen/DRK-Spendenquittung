import { NextResponse } from 'next/server';
import { getSession, isSuperadmin } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });
  if (!isSuperadmin(session)) return NextResponse.json({ error: 'Keine Berechtigung.' }, { status: 403 });

  const kvList = await prisma.kreisverband.findMany({
    select: {
      id: true,
      slug: true,
      name: true,
      ort: true,
      finanzamt: true,
      erstelltAm: true,
      _count: {
        select: {
          nutzer: true,
          spender: true,
          zuwendungen: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  // Summe pro KV separat aggregieren
  const summen = await prisma.zuwendung.groupBy({
    by: ['kreisverbandId'],
    _sum: { betrag: true },
  });

  const summenMap = new Map(summen.map((s) => [s.kreisverbandId, s._sum.betrag?.toString() ?? '0']));

  const result = kvList.map((kv) => ({
    ...kv,
    zuwendungenSumme: summenMap.get(kv.id) ?? '0',
  }));

  return NextResponse.json(result);
}
