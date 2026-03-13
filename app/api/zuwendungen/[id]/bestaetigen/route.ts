import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  if (!body.bestaetigungTyp || !body.laufendeNr) {
    return NextResponse.json({ error: 'bestaetigungTyp und laufendeNr erforderlich.' }, { status: 400 });
  }

  const existing = await prisma.zuwendung.findFirst({
    where: { id, kreisverbandId: session.kreisverbandId },
  });

  if (!existing) return NextResponse.json({ error: 'Zuwendung nicht gefunden.' }, { status: 404 });

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
