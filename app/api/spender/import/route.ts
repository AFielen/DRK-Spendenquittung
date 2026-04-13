import { NextRequest, NextResponse } from 'next/server';
import { getSession, requireSchreibrecht } from '@/lib/auth';
import { prisma } from '@/lib/db';

/** CSV-Zeile parsen mit Unterstützung für Quoted Fields */
function parseCsvLine(line: string, delimiter: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      fields.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });
  if (!requireSchreibrecht(session)) return NextResponse.json({ error: 'Keine Berechtigung.' }, { status: 403 });

  const body = await req.json();
  const csv = body.csv as string;

  if (!csv) {
    return NextResponse.json({ error: 'CSV-Daten erforderlich.' }, { status: 400 });
  }

  const MAX_CSV_LINES = 5000;
  const lines = csv.split(/\r?\n/).filter((l: string) => l.trim());
  if (lines.length < 2) {
    return NextResponse.json({ error: 'CSV muss mindestens eine Kopfzeile und eine Datenzeile enthalten.' }, { status: 400 });
  }
  if (lines.length > MAX_CSV_LINES + 1) {
    return NextResponse.json({ error: `CSV darf maximal ${MAX_CSV_LINES} Datenzeilen enthalten.` }, { status: 400 });
  }

  // Delimiter erkennen
  const headerLine = lines[0];
  const delimiter = headerLine.includes(';') ? ';' : ',';
  const headers = parseCsvLine(headerLine, delimiter).map((h: string) => h.trim().toLowerCase());

  // Pflichtfelder finden
  const idxVorname = headers.findIndex((h) => h === 'vorname');
  const idxNachname = headers.findIndex((h) => h === 'nachname');
  const idxStrasse = headers.findIndex((h) => ['strasse', 'straße', 'str'].includes(h));
  const idxPlz = headers.findIndex((h) => h === 'plz');
  const idxOrt = headers.findIndex((h) => h === 'ort');
  const idxAnrede = headers.findIndex((h) => h === 'anrede');
  const idxSteuerIdNr = headers.findIndex((h) => ['steueridnr', 'steuer-id', 'steuerid'].includes(h));

  if (idxVorname === -1 || idxNachname === -1 || idxStrasse === -1 || idxPlz === -1 || idxOrt === -1) {
    return NextResponse.json({ error: 'CSV muss Spalten für Vorname, Nachname, Strasse, PLZ, Ort enthalten.' }, { status: 400 });
  }

  // Bestehende Spender laden für Duplikat-Erkennung
  const existing = await prisma.spender.findMany({
    where: { kreisverbandId: session.kreisverbandId },
    select: { vorname: true, nachname: true, plz: true },
  });
  const existingKeys = new Set(
    existing.map((s) => `${(s.vorname ?? '').toLowerCase()}|${s.nachname.toLowerCase()}|${s.plz}`),
  );

  let erstellt = 0;
  let duplikate = 0;
  const fehler: string[] = [];

  // Alle Zeilen parsen und validieren
  interface SpenderRow { vorname: string; nachname: string; strasse: string; plz: string; ort: string; anrede: string | null; steuerIdNr: string | null }
  const toCreate: SpenderRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i], delimiter).map((c: string) => c.trim());

    const vorname = cols[idxVorname] || '';
    const nachname = cols[idxNachname] || '';
    const strasse = cols[idxStrasse] || '';
    const plz = cols[idxPlz] || '';
    const ort = cols[idxOrt] || '';

    if (!vorname || !nachname || !strasse || !plz || !ort) {
      fehler.push(`Zeile ${i + 1}: Pflichtfelder fehlen.`);
      continue;
    }

    const key = `${vorname.toLowerCase()}|${nachname.toLowerCase()}|${plz}`;
    if (existingKeys.has(key)) {
      duplikate++;
      continue;
    }

    toCreate.push({
      vorname,
      nachname,
      strasse,
      plz,
      ort,
      anrede: idxAnrede !== -1 ? cols[idxAnrede] || null : null,
      steuerIdNr: idxSteuerIdNr !== -1 ? cols[idxSteuerIdNr] || null : null,
    });
    existingKeys.add(key);
  }

  // Alle Spender in einer Transaktion erstellen
  if (toCreate.length > 0) {
    await prisma.$transaction(
      toCreate.map((row) =>
        prisma.spender.create({
          data: { ...row, kreisverbandId: session.kreisverbandId },
        }),
      ),
    );
  }
  erstellt = toCreate.length;

  return NextResponse.json({ erstellt, duplikate, fehler });
}
