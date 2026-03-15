import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });

  const { id } = await params;
  const zuwendung = await prisma.zuwendung.findFirst({
    where: { id, kreisverbandId: session.kreisverbandId },
    include: {
      spender: { select: { id: true, istFirma: true, firmenname: true, vorname: true, nachname: true, strasse: true, plz: true, ort: true, anrede: true, steuerIdNr: true } },
    },
  });

  if (!zuwendung) return NextResponse.json({ error: 'Zuwendung nicht gefunden.' }, { status: 404 });

  return NextResponse.json(zuwendung);
}

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.zuwendung.findFirst({
    where: { id, kreisverbandId: session.kreisverbandId },
  });

  if (!existing) return NextResponse.json({ error: 'Zuwendung nicht gefunden.' }, { status: 404 });
  if (existing.bestaetigungErstellt) {
    return NextResponse.json({ error: 'Bereits bestätigte Zuwendungen können nicht bearbeitet werden.' }, { status: 409 });
  }

  const body = await req.json();

  const zuwendung = await prisma.zuwendung.update({
    where: { id },
    data: {
      art: body.art,
      verwendung: body.verwendung,
      betrag: body.betrag,
      datum: new Date(body.datum),
      zahlungsart: body.zahlungsart ?? null,
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
      zweckVerwendet: body.zweckVerwendet ?? false,
      zweckVerwendetDatum: body.zweckVerwendetDatum ? new Date(body.zweckVerwendetDatum) : null,
      zweckVerwendetNotiz: body.zweckVerwendetNotiz ?? null,
    },
  });

  return NextResponse.json(zuwendung);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.zuwendung.findFirst({
    where: { id, kreisverbandId: session.kreisverbandId },
  });

  if (!existing) return NextResponse.json({ error: 'Zuwendung nicht gefunden.' }, { status: 404 });
  if (existing.bestaetigungErstellt) {
    return NextResponse.json({ error: 'Bereits bestätigte Zuwendungen können nicht gelöscht werden.' }, { status: 409 });
  }

  await prisma.zuwendung.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
