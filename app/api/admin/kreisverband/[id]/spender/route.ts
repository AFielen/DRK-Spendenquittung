import { NextRequest, NextResponse } from 'next/server';
import { getSession, isSuperadmin } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });
  if (!isSuperadmin(session)) return NextResponse.json({ error: 'Keine Berechtigung.' }, { status: 403 });

  const { id } = await params;

  const spender = await prisma.spender.findMany({
    where: { kreisverbandId: id },
    select: {
      id: true,
      istFirma: true,
      firmenname: true,
      vorname: true,
      nachname: true,
      ort: true,
      _count: { select: { zuwendungen: true } },
    },
    orderBy: { nachname: 'asc' },
  });

  return NextResponse.json(spender);
}
