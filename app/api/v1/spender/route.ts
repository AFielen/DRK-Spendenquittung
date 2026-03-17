import { NextRequest, NextResponse } from 'next/server';
import { withApiKey } from '@/lib/api-v1-helpers';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  return withApiKey(req, 'spender:read', async (ctx) => {
    const { searchParams } = new URL(req.url);
    const includeArchived = searchParams.get('includeArchived') === 'true';

    const spender = await prisma.spender.findMany({
      where: {
        kreisverbandId: ctx.kreisverbandId,
        ...(includeArchived ? {} : { archiviert: false }),
      },
      include: {
        _count: { select: { zuwendungen: true } },
        zuwendungen: { select: { betrag: true, datum: true } },
      },
      orderBy: { nachname: 'asc' },
    });

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
        archiviert: s.archiviert,
        archiviertAm: s.archiviertAm,
        zuwendungenCount: s._count.zuwendungen,
        jahresSumme,
        erstelltAm: s.erstelltAm,
        aktualisiertAm: s.aktualisiertAm,
      };
    });

    return NextResponse.json(result);
  });
}

export async function POST(req: NextRequest) {
  return withApiKey(req, 'spender:write', async (ctx) => {
    const body = await req.json();
    const istFirma = body.istFirma === true;

    if (istFirma) {
      if (!body.firmenname || !body.strasse || !body.plz || !body.ort) {
        return NextResponse.json(
          { error: { code: 'VALIDATION', message: 'Pflichtfelder für Firmen: firmenname, strasse, plz, ort.' } },
          { status: 400 },
        );
      }
    } else {
      if (!body.vorname || !body.nachname || !body.strasse || !body.plz || !body.ort) {
        return NextResponse.json(
          { error: { code: 'VALIDATION', message: 'Pflichtfelder: vorname, nachname, strasse, plz, ort.' } },
          { status: 400 },
        );
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
        kreisverbandId: ctx.kreisverbandId,
      },
    });

    return NextResponse.json(spender, { status: 201 });
  });
}
