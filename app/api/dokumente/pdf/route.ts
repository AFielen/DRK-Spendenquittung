import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import type { Verein, Spender, Zuwendung } from '@/lib/types';
import { generateGeldzuwendungPdf } from '@/lib/pdf-templates/geldzuwendung';
import { generateSachzuwendungPdf } from '@/lib/pdf-templates/sachzuwendung';
import { generateSammelbestaetigungPdf } from '@/lib/pdf-templates/sammelbestaetigung';
import { generateVereinfachterNachweisPdf } from '@/lib/pdf-templates/vereinfachter-nachweis';
import { erstelleEmpfangsbestaetigungPdf } from '@/lib/pdf-templates/empfangsbestaetigung';

interface PdfRequest {
  typ: 'geldzuwendung' | 'sachzuwendung' | 'sammelbestaetigung' | 'vereinfacht' | 'empfangsbestaetigung';
  spenderId: string;
  zuwendungIds: string[];
  laufendeNr?: string;
  doppel?: boolean;
  zeitraum?: { von: string; bis: string };
}

function mapKreisverband(kv: Record<string, unknown>): Verein {
  return {
    id: kv.id as string,
    name: kv.name as string,
    strasse: kv.strasse as string,
    plz: kv.plz as string,
    ort: kv.ort as string,
    finanzamt: kv.finanzamt as string,
    steuernummer: kv.steuernummer as string,
    freistellungsart: kv.freistellungsart as Verein['freistellungsart'],
    freistellungDatum: (kv.freistellungDatum as Date).toISOString(),
    letzterVZ: (kv.letzterVZ as string) || null,
    beguenstigteZwecke: kv.beguenstigteZwecke as string[],
    vereinsregister: (kv.vereinsregister as string) || null,
    unterschriftName: kv.unterschriftName as string,
    unterschriftFunktion: kv.unterschriftFunktion as string,
    logoBase64: (kv.logoBase64 as string) || null,
    laufendeNrFormat: (kv.laufendeNrFormat as string) || undefined,
  };
}

function mapSpender(s: Record<string, unknown>): Spender {
  return {
    id: s.id as string,
    istFirma: s.istFirma as boolean | undefined,
    firmenname: s.firmenname as string | null,
    anrede: s.anrede as string | null,
    vorname: s.vorname as string | null,
    nachname: s.nachname as string,
    strasse: s.strasse as string,
    plz: s.plz as string,
    ort: s.ort as string,
  };
}

function mapZuwendung(z: Record<string, unknown>): Zuwendung {
  return {
    id: z.id as string,
    spenderId: z.spenderId as string,
    art: z.art as Zuwendung['art'],
    verwendung: z.verwendung as Zuwendung['verwendung'],
    betrag: Number(z.betrag),
    datum: (z.datum as Date).toISOString(),
    sachBezeichnung: z.sachBezeichnung as string | null,
    sachAlter: z.sachAlter as string | null,
    sachZustand: z.sachZustand as string | null,
    sachKaufpreis: z.sachKaufpreis != null ? Number(z.sachKaufpreis) : null,
    sachWert: z.sachWert != null ? Number(z.sachWert) : null,
    sachHerkunft: z.sachHerkunft as Zuwendung['sachHerkunft'],
    sachWertermittlung: z.sachWertermittlung as string | null,
    sachEntnahmewert: z.sachEntnahmewert != null ? Number(z.sachEntnahmewert) : null,
    sachUmsatzsteuer: z.sachUmsatzsteuer != null ? Number(z.sachUmsatzsteuer) : null,
    sachBewertungsgrundlage: z.sachBewertungsgrundlage as Zuwendung['sachBewertungsgrundlage'],
    sachUnterlagenVorhanden: z.sachUnterlagenVorhanden as boolean,
    verzicht: z.verzicht as boolean,
    bemerkung: z.bemerkung as string | null,
    zweckgebunden: z.zweckgebunden as boolean,
    zweckbindung: z.zweckbindung as string | null,
    zweckVerwendet: z.zweckVerwendet as boolean,
    bestaetigungErstellt: z.bestaetigungErstellt as boolean,
    bestaetigungDatum: z.bestaetigungDatum ? (z.bestaetigungDatum as Date).toISOString() : null,
    bestaetigungTyp: z.bestaetigungTyp as Zuwendung['bestaetigungTyp'],
    laufendeNr: z.laufendeNr as string | null,
    spender: z.spender ? mapSpender(z.spender as Record<string, unknown>) as Zuwendung['spender'] : undefined,
  };
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });
  }

  let body: PdfRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Ungültiger Request-Body.' }, { status: 400 });
  }

  const { typ, spenderId, zuwendungIds, laufendeNr, doppel, zeitraum } = body;

  if (!typ || !spenderId || !zuwendungIds || zuwendungIds.length === 0) {
    return NextResponse.json({ error: 'Fehlende Pflichtfelder: typ, spenderId, zuwendungIds.' }, { status: 400 });
  }

  // Load Kreisverband
  const kv = await prisma.kreisverband.findUnique({
    where: { id: session.kreisverbandId },
  });
  if (!kv) {
    return NextResponse.json({ error: 'Kreisverband nicht gefunden.' }, { status: 404 });
  }
  const verein = mapKreisverband(kv as unknown as Record<string, unknown>);

  // Load Spender
  const spenderRaw = await prisma.spender.findUnique({
    where: { id: spenderId, kreisverbandId: session.kreisverbandId },
  });
  if (!spenderRaw) {
    return NextResponse.json({ error: 'Spender nicht gefunden.' }, { status: 404 });
  }
  const spender = mapSpender(spenderRaw as unknown as Record<string, unknown>);

  // Load Zuwendungen
  const zuwendungenRaw = await prisma.zuwendung.findMany({
    where: {
      id: { in: zuwendungIds },
      kreisverbandId: session.kreisverbandId,
    },
    include: { spender: true },
  });
  const zuwendungenList = zuwendungenRaw.map((z: unknown) => mapZuwendung(z as Record<string, unknown>));

  if (zuwendungenList.length === 0) {
    return NextResponse.json({ error: 'Keine Zuwendungen gefunden.' }, { status: 404 });
  }

  try {
    let pdfBuffer: Buffer;
    let filename: string;
    const lfdNr = laufendeNr ?? '';

    switch (typ) {
      case 'geldzuwendung':
        pdfBuffer = await generateGeldzuwendungPdf(verein, spender, zuwendungenList[0], lfdNr, doppel);
        filename = `Geldzuwendung_${spender.nachname}.pdf`;
        break;

      case 'sachzuwendung':
        pdfBuffer = await generateSachzuwendungPdf(verein, spender, zuwendungenList[0], lfdNr, doppel);
        filename = `Sachzuwendung_${spender.nachname}.pdf`;
        break;

      case 'sammelbestaetigung':
        if (!zeitraum) {
          return NextResponse.json({ error: 'Zeitraum erforderlich für Sammelbestätigung.' }, { status: 400 });
        }
        pdfBuffer = await generateSammelbestaetigungPdf(
          verein, spender, zuwendungenList,
          zeitraum.von, zeitraum.bis,
          lfdNr, doppel
        );
        filename = `Sammelbestaetigung_${spender.nachname}.pdf`;
        break;

      case 'vereinfacht':
        pdfBuffer = await generateVereinfachterNachweisPdf(verein, spender, zuwendungenList[0]);
        filename = `Nachweis_${spender.nachname}.pdf`;
        break;

      case 'empfangsbestaetigung':
        pdfBuffer = await erstelleEmpfangsbestaetigungPdf(verein, zuwendungenList[0]);
        filename = `Empfangsbestaetigung_${spender.nachname}.pdf`;
        break;

      default:
        return NextResponse.json({ error: `Unbekannter Dokumenttyp: ${typ}` }, { status: 400 });
    }

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
      },
    });
  } catch (err) {
    console.error('PDF-Generierung fehlgeschlagen:', err);
    return NextResponse.json(
      { error: 'PDF-Generierung fehlgeschlagen.', message: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
