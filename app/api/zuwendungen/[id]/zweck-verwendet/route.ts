import { NextRequest, NextResponse } from 'next/server';
import { getSession, requireSchreibrecht } from '@/lib/auth';
import { prisma } from '@/lib/db';

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });
  if (!requireSchreibrecht(session)) return NextResponse.json({ error: 'Keine Berechtigung.' }, { status: 403 });

  const { id } = await params;
  const existing = await prisma.zuwendung.findFirst({
    where: { id, kreisverbandId: session.kreisverbandId },
  });

  if (!existing) return NextResponse.json({ error: 'Zuwendung nicht gefunden.' }, { status: 404 });
  if (!existing.zweckgebunden) {
    return NextResponse.json({ error: 'Zuwendung ist nicht zweckgebunden.' }, { status: 400 });
  }

  const body = await req.json();

  if (!body.zweckVerwendetNotiz) {
    return NextResponse.json({ error: 'Verwendungsnotiz ist Pflicht.' }, { status: 400 });
  }

  const zuwendung = await prisma.zuwendung.update({
    where: { id },
    data: {
      zweckVerwendet: true,
      zweckVerwendetDatum: body.zweckVerwendetDatum ? new Date(body.zweckVerwendetDatum) : new Date(),
      zweckVerwendetNotiz: body.zweckVerwendetNotiz,
    },
  });

  return NextResponse.json(zuwendung);
}
