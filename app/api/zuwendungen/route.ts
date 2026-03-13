import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Prisma } from '@/lib/generated/prisma/client';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });

  const url = new URL(req.url);
  const spenderId = url.searchParams.get('spenderId');
  const jahr = url.searchParams.get('jahr');
  const art = url.searchParams.get('art');
  const status = url.searchParams.get('status');

  const where: Prisma.ZuwendungWhereInput = {
    kreisverbandId: session.kreisverbandId,
  };

  if (spenderId) where.spenderId = spenderId;
  if (art && art !== 'alle') where.art = art;
  if (status === 'offen') where.bestaetigungErstellt = false;
  if (status === 'bestaetigt') where.bestaetigungErstellt = true;

  if (jahr) {
    const y = parseInt(jahr);
    where.datum = {
      gte: new Date(`${y}-01-01`),
      lt: new Date(`${y + 1}-01-01`),
    };
  }

  const zuwendungen = await prisma.zuwendung.findMany({
    where,
    include: {
      spender: {
        select: { id: true, vorname: true, nachname: true },
      },
    },
    orderBy: { datum: 'desc' },
  });

  return NextResponse.json(zuwendungen);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });

  const body = await req.json();

  if (!body.spenderId || !body.art || !body.verwendung || !body.betrag || !body.datum) {
    return NextResponse.json({ error: 'Pflichtfelder: spenderId, art, verwendung, betrag, datum.' }, { status: 400 });
  }

  // Sachspende: Unterlagen-Pflicht
  if (body.art === 'sach' && !body.sachUnterlagenVorhanden) {
    return NextResponse.json(
      { error: 'Bei Sachspenden müssen die Unterlagen zur Wertermittlung vorliegen.' },
      { status: 400 },
    );
  }

  // Spender-Mandantenisolation prüfen
  const spender = await prisma.spender.findFirst({
    where: { id: body.spenderId, kreisverbandId: session.kreisverbandId },
  });
  if (!spender) {
    return NextResponse.json({ error: 'Spender nicht gefunden.' }, { status: 404 });
  }

  const zuwendung = await prisma.zuwendung.create({
    data: {
      art: body.art,
      verwendung: body.verwendung,
      betrag: body.betrag,
      datum: new Date(body.datum),
      zahlungsart: body.zahlungsart ?? null,
      sachBezeichnung: body.sachBezeichnung ?? null,
      sachAlter: body.sachAlter ?? null,
      sachZustand: body.sachZustand ?? null,
      sachKaufpreis: body.sachKaufpreis ?? null,
      sachWert: body.sachWert ?? null,
      sachHerkunft: body.sachHerkunft ?? null,
      sachWertermittlung: body.sachWertermittlung ?? null,
      sachEntnahmewert: body.sachEntnahmewert ?? null,
      sachUmsatzsteuer: body.sachUmsatzsteuer ?? null,
      sachUnterlagenVorhanden: body.sachUnterlagenVorhanden ?? false,
      verzicht: body.verzicht ?? false,
      spenderId: body.spenderId,
      kreisverbandId: session.kreisverbandId,
    },
    include: {
      spender: { select: { id: true, vorname: true, nachname: true } },
    },
  });

  return NextResponse.json(zuwendung, { status: 201 });
}
