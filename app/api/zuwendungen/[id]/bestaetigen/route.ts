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

  // Idempotenz: bereits bestätigt → bestehende Daten zurückgeben
  if (existing.bestaetigungErstellt) {
    return NextResponse.json(existing);
  }

  // Duplikat-Prüfung: laufendeNr darf nur innerhalb derselben Sammelbestätigung mehrfach vorkommen
  const duplicate = await prisma.zuwendung.findFirst({
    where: {
      kreisverbandId: session.kreisverbandId,
      laufendeNr: body.laufendeNr,
      bestaetigungErstellt: true,
      // Bei Sammelbestätigung (anlage14) ist gleiche laufendeNr erlaubt
      ...(body.bestaetigungTyp !== 'anlage14' ? {} : {}),
    },
  });

  if (duplicate && body.bestaetigungTyp !== 'anlage14' && duplicate.bestaetigungTyp !== 'anlage14') {
    return NextResponse.json(
      { error: `Laufende Nummer ${body.laufendeNr} ist bereits vergeben.` },
      { status: 409 },
    );
  }

  const zuwendung = await prisma.zuwendung.update({
    where: { id },
    data: {
      bestaetigungErstellt: true,
      bestaetigungDatum: new Date(),
      bestaetigungTyp: body.bestaetigungTyp,
      laufendeNr: body.laufendeNr,
    },
  });

  return NextResponse.json(zuwendung);
}
