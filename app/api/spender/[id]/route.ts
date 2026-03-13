import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
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

  const { id } = await params;

  // Mandantenisolation prüfen
  const existing = await prisma.spender.findFirst({
    where: { id, kreisverbandId: session.kreisverbandId },
  });
  if (!existing) return NextResponse.json({ error: 'Spender nicht gefunden.' }, { status: 404 });

  const body = await req.json();

  const spender = await prisma.spender.update({
    where: { id },
    data: {
      vorname: body.vorname,
      nachname: body.nachname,
      strasse: body.strasse,
      plz: body.plz,
      ort: body.ort,
      anrede: body.anrede ?? null,
      steuerIdNr: body.steuerIdNr ?? null,
    },
  });

  return NextResponse.json(spender);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  // Mandantenisolation prüfen
  const existing = await prisma.spender.findFirst({
    where: { id, kreisverbandId: session.kreisverbandId },
    include: { _count: { select: { zuwendungen: true } } },
  });
  if (!existing) return NextResponse.json({ error: 'Spender nicht gefunden.' }, { status: 404 });

  if (existing._count.zuwendungen > 0 && !body.confirm) {
    return NextResponse.json(
      { error: `Spender hat ${existing._count.zuwendungen} Zuwendung(en). Bestätigung erforderlich.`, requireConfirm: true },
      { status: 409 },
    );
  }

  await prisma.spender.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
