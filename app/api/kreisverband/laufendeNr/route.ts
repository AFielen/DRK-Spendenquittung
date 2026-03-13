import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });

  // Atomare Operation per Transaction
  const result = await prisma.$transaction(async (tx) => {
    const kv = await tx.kreisverband.findUnique({
      where: { id: session.kreisverbandId },
    });

    if (!kv) throw new Error('Kreisverband nicht gefunden.');

    const currentYear = new Date().getFullYear();
    let nr = kv.laufendeNrAktuell;
    let jahr = kv.laufendeNrJahr;

    // Jahreswechsel: Reset auf 1
    if (jahr !== currentYear) {
      nr = 1;
      jahr = currentYear;
    }

    const formatted = kv.laufendeNrFormat
      .replace('{JAHR}', String(jahr))
      .replace('{NR}', String(nr).padStart(3, '0'));

    // Nächste Nummer speichern
    await tx.kreisverband.update({
      where: { id: session.kreisverbandId },
      data: {
        laufendeNrAktuell: nr + 1,
        laufendeNrJahr: jahr,
      },
    });

    return formatted;
  });

  return NextResponse.json({ laufendeNr: result });
}
