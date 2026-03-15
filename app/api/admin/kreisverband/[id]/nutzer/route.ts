import { NextRequest, NextResponse } from 'next/server';
import { getSession, isSuperadmin } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });
  if (!isSuperadmin(session)) return NextResponse.json({ error: 'Keine Berechtigung.' }, { status: 403 });

  const { id } = await params;

  const nutzer = await prisma.nutzer.findMany({
    where: { kreisverbandId: id },
    select: {
      id: true,
      email: true,
      name: true,
      rolle: true,
      letztesLogin: true,
      erstelltAm: true,
    },
    orderBy: { name: 'asc' },
  });

  return NextResponse.json(nutzer);
}
