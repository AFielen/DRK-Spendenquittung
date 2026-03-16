import { NextRequest, NextResponse } from 'next/server';
import { withApiKey } from '@/lib/api-v1-helpers';
import { prisma } from '@/lib/db';

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  return withApiKey(req, 'zuwendungen:read', async (ctx) => {
    const { id } = await params;
    const zuwendung = await prisma.zuwendung.findFirst({
      where: { id, kreisverbandId: ctx.kreisverbandId },
      include: {
        spender: {
          select: {
            id: true, istFirma: true, firmenname: true, vorname: true, nachname: true,
            strasse: true, plz: true, ort: true, anrede: true, steuerIdNr: true,
          },
        },
      },
    });

    if (!zuwendung) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Zuwendung nicht gefunden.' } },
        { status: 404 },
      );
    }

    return NextResponse.json(zuwendung);
  });
}

export async function PUT(req: NextRequest, { params }: Params) {
  return withApiKey(req, 'zuwendungen:write', async (ctx) => {
    const { id } = await params;

    const existing = await prisma.zuwendung.findFirst({
      where: { id, kreisverbandId: ctx.kreisverbandId },
    });
    if (!existing) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Zuwendung nicht gefunden.' } },
        { status: 404 },
      );
    }
    if (existing.bestaetigungErstellt) {
      return NextResponse.json(
        { error: { code: 'CONFLICT', message: 'Bereits bestätigte Zuwendungen können nicht bearbeitet werden.' } },
        { status: 409 },
      );
    }

    const body = await req.json();

    const zuwendung = await prisma.zuwendung.update({
      where: { id },
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
      },
    });

    return NextResponse.json(zuwendung);
  });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  return withApiKey(req, 'zuwendungen:write', async (ctx) => {
    const { id } = await params;

    const existing = await prisma.zuwendung.findFirst({
      where: { id, kreisverbandId: ctx.kreisverbandId },
    });
    if (!existing) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Zuwendung nicht gefunden.' } },
        { status: 404 },
      );
    }
    if (existing.bestaetigungErstellt) {
      return NextResponse.json(
        { error: { code: 'CONFLICT', message: 'Bereits bestätigte Zuwendungen können nicht gelöscht werden.' } },
        { status: 409 },
      );
    }

    await prisma.zuwendung.delete({ where: { id } });

    return NextResponse.json({ success: true });
  });
}
