import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });

  const body = await req.json();
  const csv = body.csv as string;

  if (!csv) {
    return NextResponse.json({ error: 'CSV-Daten erforderlich.' }, { status: 400 });
  }

  const lines = csv.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) {
    return NextResponse.json({ error: 'CSV muss mindestens eine Kopfzeile und eine Datenzeile enthalten.' }, { status: 400 });
  }

  // Delimiter erkennen
  const headerLine = lines[0];
  const delimiter = headerLine.includes(';') ? ';' : ',';
  const headers = headerLine.split(delimiter).map((h) => h.trim().toLowerCase());

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
    existing.map((s) => `${s.vorname.toLowerCase()}|${s.nachname.toLowerCase()}|${s.plz}`),
  );

  let erstellt = 0;
  let duplikate = 0;
  const fehler: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(delimiter).map((c) => c.trim());

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

    await prisma.spender.create({
      data: {
        vorname,
        nachname,
        strasse,
        plz,
        ort,
        anrede: idxAnrede !== -1 ? cols[idxAnrede] || null : null,
        steuerIdNr: idxSteuerIdNr !== -1 ? cols[idxSteuerIdNr] || null : null,
        kreisverbandId: session.kreisverbandId,
      },
    });
    existingKeys.add(key);
    erstellt++;
  }

  return NextResponse.json({ erstellt, duplikate, fehler });
}
