import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });
  if (session.rolle !== 'admin') {
    return NextResponse.json({ error: 'Keine Berechtigung.' }, { status: 403 });
  }

  const nutzer = await prisma.nutzer.findMany({
    where: { kreisverbandId: session.kreisverbandId },
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

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });
  if (session.rolle !== 'admin') {
    return NextResponse.json({ error: 'Keine Berechtigung.' }, { status: 403 });
  }

  const body = await req.json();

  if (!body.email || !body.name) {
    return NextResponse.json({ error: 'E-Mail und Name erforderlich.' }, { status: 400 });
  }

  // Prüfe ob E-Mail bereits existiert
  const existing = await prisma.nutzer.findUnique({ where: { email: body.email.toLowerCase() } });
  if (existing) {
    return NextResponse.json({ error: 'Ein Nutzer mit dieser E-Mail existiert bereits.' }, { status: 409 });
  }

  const nutzer = await prisma.nutzer.create({
    data: {
      email: body.email.toLowerCase().trim(),
      name: body.name,
      rolle: body.rolle || 'schatzmeister',
      kreisverbandId: session.kreisverbandId,
    },
  });

  return NextResponse.json({
    id: nutzer.id,
    email: nutzer.email,
    name: nutzer.name,
    rolle: nutzer.rolle,
  }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });
  if (session.rolle !== 'admin') {
    return NextResponse.json({ error: 'Keine Berechtigung.' }, { status: 403 });
  }

  const body = await req.json();
  if (!body.id) {
    return NextResponse.json({ error: 'Nutzer-ID erforderlich.' }, { status: 400 });
  }

  // Nicht sich selbst löschen
  if (body.id === session.nutzerId) {
    return NextResponse.json({ error: 'Sie können sich nicht selbst entfernen.' }, { status: 409 });
  }

  // Mandantenisolation
  const nutzer = await prisma.nutzer.findFirst({
    where: { id: body.id, kreisverbandId: session.kreisverbandId },
  });
  if (!nutzer) {
    return NextResponse.json({ error: 'Nutzer nicht gefunden.' }, { status: 404 });
  }

  await prisma.nutzer.delete({ where: { id: body.id } });

  return NextResponse.json({ success: true });
}
