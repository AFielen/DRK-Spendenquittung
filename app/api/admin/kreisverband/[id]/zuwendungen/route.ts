import { NextRequest, NextResponse } from 'next/server';
import { getSession, isSuperadmin } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });
  if (!isSuperadmin(session)) return NextResponse.json({ error: 'Keine Berechtigung.' }, { status: 403 });

  const { id } = await params;

  const zuwendungen = await prisma.zuwendung.findMany({
    where: { kreisverbandId: id },
    select: {
      id: true,
      art: true,
      verwendung: true,
      betrag: true,
      datum: true,
      bestaetigungErstellt: true,
      laufendeNr: true,
      spender: {
        select: {
          id: true,
          vorname: true,
          nachname: true,
          firmenname: true,
          istFirma: true,
        },
      },
    },
    orderBy: { datum: 'desc' },
    take: 200,
  });

  return NextResponse.json(zuwendungen);
}
