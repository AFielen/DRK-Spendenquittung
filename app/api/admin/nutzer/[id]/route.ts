import { NextRequest, NextResponse } from 'next/server';
import { getSession, isSuperadmin } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });
  if (!isSuperadmin(session)) return NextResponse.json({ error: 'Keine Berechtigung.' }, { status: 403 });

  const { id } = await params;
  const body = await req.json();

  if (!body.rolle || !['admin', 'schatzmeister', 'leser'].includes(body.rolle)) {
    return NextResponse.json({ error: 'Ungültige Rolle.' }, { status: 400 });
  }

  const nutzer = await prisma.nutzer.findUnique({ where: { id } });
  if (!nutzer) return NextResponse.json({ error: 'Nutzer nicht gefunden.' }, { status: 404 });

  const updated = await prisma.nutzer.update({
    where: { id },
    data: { rolle: body.rolle },
    select: { id: true, email: true, name: true, rolle: true },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });
  if (!isSuperadmin(session)) return NextResponse.json({ error: 'Keine Berechtigung.' }, { status: 403 });

  const { id } = await params;

  // Superadmin darf sich nicht selbst löschen
  if (id === session.nutzerId) {
    return NextResponse.json({ error: 'Sie können sich nicht selbst löschen.' }, { status: 409 });
  }

  const nutzer = await prisma.nutzer.findUnique({ where: { id } });
  if (!nutzer) return NextResponse.json({ error: 'Nutzer nicht gefunden.' }, { status: 404 });

  await prisma.nutzer.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
