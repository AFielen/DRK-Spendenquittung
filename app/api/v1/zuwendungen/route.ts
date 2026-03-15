import { NextRequest, NextResponse } from 'next/server';
import { withApiKey } from '@/lib/api-v1-helpers';
import { prisma } from '@/lib/db';
import { Prisma } from '@/lib/generated/prisma/client';

export async function GET(req: NextRequest) {
  return withApiKey(req, 'zuwendungen:read', async (ctx) => {
    const url = new URL(req.url);
    const spenderId = url.searchParams.get('spenderId');
    const jahr = url.searchParams.get('jahr');
    const art = url.searchParams.get('art');
    const status = url.searchParams.get('status');
    const zugangsweg = url.searchParams.get('zugangsweg');

    const where: Prisma.ZuwendungWhereInput = {
      kreisverbandId: ctx.kreisverbandId,
    };

    if (spenderId) where.spenderId = spenderId;
    if (art && art !== 'alle') where.art = art;
    if (status === 'offen') where.bestaetigungErstellt = false;
    if (status === 'bestaetigt') where.bestaetigungErstellt = true;
    if (status === 'zweckgebunden_offen') {
      where.zweckgebunden = true;
      where.zweckVerwendet = false;
    }
    if (zugangsweg && zugangsweg !== 'alle') where.zugangsweg = zugangsweg;

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
          select: { id: true, istFirma: true, firmenname: true, vorname: true, nachname: true },
        },
      },
      orderBy: { datum: 'desc' },
    });

    return NextResponse.json(zuwendungen);
  });
}

export async function POST(req: NextRequest) {
  return withApiKey(req, 'zuwendungen:write', async (ctx) => {
    const body = await req.json();

    if (!body.spenderId || !body.art || !body.verwendung || !body.betrag || !body.datum) {
      return NextResponse.json(
        { error: { code: 'VALIDATION', message: 'Pflichtfelder: spenderId, art, verwendung, betrag, datum.' } },
        { status: 400 },
      );
    }

    if (body.art === 'sach' && !body.sachUnterlagenVorhanden) {
      return NextResponse.json(
        { error: { code: 'VALIDATION', message: 'Bei Sachspenden müssen die Unterlagen zur Wertermittlung vorliegen.' } },
        { status: 400 },
      );
    }

    // Spender-Mandantenisolation prüfen
    const spender = await prisma.spender.findFirst({
      where: { id: body.spenderId, kreisverbandId: ctx.kreisverbandId },
    });
    if (!spender) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Spender nicht gefunden.' } },
        { status: 404 },
      );
    }

    const zuwendung = await prisma.zuwendung.create({
      data: {
        art: body.art,
        verwendung: body.verwendung,
        betrag: body.betrag,
        datum: new Date(body.datum),
        zugangsweg: body.zugangsweg ?? null,
        sachBezeichnung: body.sachBezeichnung ?? null,
        sachAlter: body.sachAlter ?? null,
        sachZustand: body.sachZustand ?? null,
        sachKaufpreis: body.sachKaufpreis ?? null,
        sachWert: body.sachWert ?? null,
        sachHerkunft: body.sachHerkunft ?? null,
        sachWertermittlung: body.sachWertermittlung ?? null,
        sachBewertungsgrundlage: body.sachBewertungsgrundlage ?? null,
        sachEntnahmewert: body.sachEntnahmewert ?? null,
        sachUmsatzsteuer: body.sachUmsatzsteuer ?? null,
        sachUnterlagenVorhanden: body.sachUnterlagenVorhanden ?? false,
        verzicht: body.verzicht ?? false,
        bemerkung: body.bemerkung ?? null,
        zweckgebunden: body.zweckgebunden ?? false,
        zweckbindung: body.zweckbindung ?? null,
        spenderId: body.spenderId,
        kreisverbandId: ctx.kreisverbandId,
      },
      include: {
        spender: { select: { id: true, istFirma: true, firmenname: true, vorname: true, nachname: true } },
      },
    });

    return NextResponse.json(zuwendung, { status: 201 });
  });
}
