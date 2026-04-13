import { NextRequest, NextResponse } from 'next/server';
import { getSession, requireSchreibrecht } from '@/lib/auth';
import { prisma } from '@/lib/db';

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });
  if (!requireSchreibrecht(session)) return NextResponse.json({ error: 'Keine Berechtigung.' }, { status: 403 });

  const { id } = await params;
  const body = await req.json();

  if (!body.bestaetigungTyp || !body.laufendeNr) {
    return NextResponse.json({ error: 'bestaetigungTyp und laufendeNr erforderlich.' }, { status: 400 });
  }

  const existing = await prisma.zuwendung.findFirst({
    where: { id, kreisverbandId: session.kreisverbandId },
  });

  if (!existing) return NextResponse.json({ error: 'Zuwendung nicht gefunden.' }, { status: 404 });

  // Idempotenz: bereits bestätigt → bestehende Daten zurückgeben (gleicher Typ)
  // Typwechsel verhindern (z.B. Einzelbestätigung → Sammelbestätigung)
  if (existing.bestaetigungErstellt) {
    if (existing.bestaetigungTyp === body.bestaetigungTyp) {
      return NextResponse.json(existing);
    }
    return NextResponse.json(
      { error: `Zuwendung wurde bereits als ${existing.bestaetigungTyp} bestätigt und kann nicht überschrieben werden.` },
      { status: 409 },
    );
  }

  // Duplikat-Prüfung + Update in Transaktion (verhindert Race-Condition)
  try {
    const zuwendung = await prisma.$transaction(async (tx) => {
      // laufendeNr darf nicht doppelt vergeben sein (außer bei Sammelbestätigungen)
      if (body.bestaetigungTyp !== 'anlage14') {
        const duplicate = await tx.zuwendung.findFirst({
          where: {
            kreisverbandId: session.kreisverbandId,
            laufendeNr: body.laufendeNr,
            bestaetigungErstellt: true,
            bestaetigungTyp: { not: 'anlage14' },
            id: { not: id },
          },
        });

        if (duplicate) {
          throw new Error(`DUPLICATE:Laufende Nummer ${body.laufendeNr} ist bereits vergeben.`);
        }
      }

      return tx.zuwendung.update({
        where: { id },
        data: {
          bestaetigungErstellt: true,
          bestaetigungDatum: new Date(),
          bestaetigungTyp: body.bestaetigungTyp,
          laufendeNr: body.laufendeNr,
        },
      });
    });

    return NextResponse.json(zuwendung);
  } catch (e) {
    const msg = e instanceof Error ? e.message : '';
    if (msg.startsWith('DUPLICATE:')) {
      return NextResponse.json({ error: msg.slice('DUPLICATE:'.length) }, { status: 409 });
    }
    return NextResponse.json({ error: 'Interner Fehler beim Bestätigen.' }, { status: 500 });
  }
}
