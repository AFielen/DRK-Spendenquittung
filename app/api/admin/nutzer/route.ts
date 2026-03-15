import { NextResponse } from 'next/server';
import { getSession, isSuperadmin } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });
  if (!isSuperadmin(session)) return NextResponse.json({ error: 'Keine Berechtigung.' }, { status: 403 });

  const nutzer = await prisma.nutzer.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      rolle: true,
      letztesLogin: true,
      erstelltAm: true,
      kreisverband: {
        select: { id: true, name: true },
      },
    },
    orderBy: { name: 'asc' },
  });

  return NextResponse.json(nutzer);
}
