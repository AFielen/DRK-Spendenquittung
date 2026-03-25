import { NextRequest, NextResponse } from 'next/server';
import { getSession, requireSchreibrecht } from '@/lib/auth';
import { prisma } from '@/lib/db';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });

  const { id } = await params;
  const spender = await prisma.spender.findFirst({
    where: { id, kreisverbandId: session.kreisverbandId },
    include: { zuwendungen: { orderBy: { datum: 'desc' } } },
  });

  if (!spender) return NextResponse.json({ error: 'Spender nicht gefunden.' }, { status: 404 });

  return NextResponse.json(spender);
}

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });
  if (!requireSchreibrecht(session)) return NextResponse.json({ error: 'Keine Berechtigung.' }, { status: 403 });

  const { id } = await params;

  // Mandantenisolation prüfen
  const existing = await prisma.spender.findFirst({
    where: { id, kreisverbandId: session.kreisverbandId },
  });
  if (!existing) return NextResponse.json({ error: 'Spender nicht gefunden.' }, { status: 404 });

  const body = await req.json();

  const istFirma = body.istFirma === true;
  const trim = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

  const spender = await prisma.spender.update({
    where: { id },
    data: {
      istFirma,
      firmenname: istFirma ? trim(body.firmenname) : null,
      vorname: trim(body.vorname) || null,
      nachname: istFirma ? (trim(body.nachname) || trim(body.firmenname)) : trim(body.nachname),
      strasse: trim(body.strasse),
      plz: trim(body.plz),
      ort: trim(body.ort),
      anrede: trim(body.anrede) || null,
      steuerIdNr: trim(body.steuerIdNr) || null,
    },
  });

  return NextResponse.json(spender);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });
  if (!requireSchreibrecht(session)) return NextResponse.json({ error: 'Keine Berechtigung.' }, { status: 403 });

  const { id } = await params;

  // Mandantenisolation prüfen
  const existing = await prisma.spender.findFirst({
    where: { id, kreisverbandId: session.kreisverbandId },
    include: { _count: { select: { zuwendungen: true } } },
  });
  if (!existing) return NextResponse.json({ error: 'Spender nicht gefunden.' }, { status: 404 });

  // Spender mit Zuwendungen archivieren statt löschen
  if (existing._count.zuwendungen > 0) {
    await prisma.spender.update({
      where: { id },
      data: { archiviert: true, archiviertAm: new Date() },
    });

    return NextResponse.json({ success: true, archiviert: true });
  }

  await prisma.spender.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
