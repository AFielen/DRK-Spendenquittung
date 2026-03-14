import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });

  const spender = await prisma.spender.findMany({
    where: { kreisverbandId: session.kreisverbandId },
    include: {
      _count: { select: { zuwendungen: true } },
      zuwendungen: {
        select: { betrag: true, datum: true },
      },
    },
    orderBy: { nachname: 'asc' },
  });

  // Berechne Jahressumme für jeden Spender
  const currentYear = new Date().getFullYear();
  const result = spender.map((s) => {
    const jahresSumme = s.zuwendungen
      .filter((z) => new Date(z.datum).getFullYear() === currentYear)
      .reduce((sum, z) => sum + Number(z.betrag), 0);

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

  const body = await req.json();

  const istFirma = body.istFirma === true;

  if (istFirma) {
    if (!body.firmenname || !body.strasse || !body.plz || !body.ort) {
      return NextResponse.json({ error: 'Pflichtfelder für Firmen: Firmenname, Straße, PLZ, Ort.' }, { status: 400 });
    }
  } else {
    if (!body.vorname || !body.nachname || !body.strasse || !body.plz || !body.ort) {
      return NextResponse.json({ error: 'Pflichtfelder: Vorname, Nachname, Straße, PLZ, Ort.' }, { status: 400 });
    }
  }

  const spender = await prisma.spender.create({
    data: {
      istFirma,
      firmenname: istFirma ? body.firmenname : null,
      vorname: body.vorname || null,
      nachname: istFirma ? (body.nachname || body.firmenname) : body.nachname,
      strasse: body.strasse,
      plz: body.plz,
      ort: body.ort,
      anrede: body.anrede ?? null,
      steuerIdNr: body.steuerIdNr ?? null,
      kreisverbandId: session.kreisverbandId,
    },
  });

  return NextResponse.json(spender, { status: 201 });
}
