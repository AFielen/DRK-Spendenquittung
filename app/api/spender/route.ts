import { NextRequest, NextResponse } from 'next/server';
import { getSession, requireSchreibrecht } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const includeArchived = searchParams.get('includeArchived') === 'true';

  const currentYear = new Date().getFullYear();
  const jahresStart = new Date(`${currentYear}-01-01T00:00:00.000Z`);
  const jahresEnde = new Date(`${currentYear + 1}-01-01T00:00:00.000Z`);

  const spender = await prisma.spender.findMany({
    where: {
      kreisverbandId: session.kreisverbandId,
      ...(includeArchived ? {} : { archiviert: false }),
    },
    include: {
      _count: { select: { zuwendungen: true } },
      zuwendungen: {
        where: { datum: { gte: jahresStart, lt: jahresEnde } },
        select: { betrag: true },
      },
    },
    orderBy: { nachname: 'asc' },
  });

  const result = spender.map((s) => {
    const jahresSumme = s.zuwendungen.reduce((sum, z) => sum + Number(z.betrag), 0);

    return {
      id: s.id,
      istFirma: s.istFirma,
      firmenname: s.firmenname,
      anrede: s.anrede,
      vorname: s.vorname,
      nachname: s.nachname,
      strasse: s.strasse,
      plz: s.plz,
      ort: s.ort,
      steuerIdNr: s.steuerIdNr,
      archiviert: s.archiviert,
      archiviertAm: s.archiviertAm,
      zuwendungenCount: s._count.zuwendungen,
      jahresSumme,
      erstelltAm: s.erstelltAm,
      aktualisiertAm: s.aktualisiertAm,
    };
  });

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });
  if (!requireSchreibrecht(session)) return NextResponse.json({ error: 'Keine Berechtigung.' }, { status: 403 });

  const body = await req.json();

  const istFirma = body.istFirma === true;
  const trim = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

  const firmenname = trim(body.firmenname);
  const vorname = trim(body.vorname);
  const nachname = trim(body.nachname);
  const strasse = trim(body.strasse);
  const plz = trim(body.plz);
  const ort = trim(body.ort);
  const anrede = trim(body.anrede) || null;
  const steuerIdNr = trim(body.steuerIdNr) || null;

  if (istFirma) {
    if (!firmenname || !strasse || !plz || !ort) {
      return NextResponse.json({ error: 'Pflichtfelder für Firmen: Firmenname, Straße, PLZ, Ort.' }, { status: 400 });
    }
  } else {
    if (!vorname || !nachname || !strasse || !plz || !ort) {
      return NextResponse.json({ error: 'Pflichtfelder: Vorname, Nachname, Straße, PLZ, Ort.' }, { status: 400 });
    }
  }

  const spender = await prisma.spender.create({
    data: {
      istFirma,
      firmenname: istFirma ? firmenname : null,
      vorname: vorname || null,
      nachname: istFirma ? (nachname || firmenname) : nachname,
      strasse,
      plz,
      ort,
      anrede,
      steuerIdNr,
      kreisverbandId: session.kreisverbandId,
    },
  });

  return NextResponse.json(spender, { status: 201 });
}
