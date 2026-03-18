import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });

  const kv = await prisma.kreisverband.findUnique({
    where: { id: session.kreisverbandId },
  });

  if (!kv) return NextResponse.json({ error: 'Kreisverband nicht gefunden.' }, { status: 404 });

  return NextResponse.json(kv);
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });
  if (session.rolle !== 'admin') {
    return NextResponse.json({ error: 'Keine Berechtigung.' }, { status: 403 });
  }

  const body = await req.json();

  const kv = await prisma.kreisverband.update({
    where: { id: session.kreisverbandId },
    data: {
      name: body.name,
      strasse: body.strasse,
      plz: body.plz,
      ort: body.ort,
      vereinsregister: body.vereinsregister ?? null,
      telefon: body.telefon ?? null,
      email: body.email ?? null,
      bankName: body.bankName ?? null,
      bankIban: body.bankIban ?? null,
      bankBic: body.bankBic ?? null,
      logoBase64: body.logoBase64 ?? null,
      finanzamt: body.finanzamt,
      steuernummer: body.steuernummer,
      freistellungsart: body.freistellungsart,
      freistellungDatum: new Date(body.freistellungDatum),
      letzterVZ: body.letzterVZ ?? null,
      beguenstigteZwecke: body.beguenstigteZwecke,
      unterschriftName: body.unterschriftName,
      unterschriftFunktion: body.unterschriftFunktion,
      laufendeNrFormat: body.laufendeNrFormat,
    },
  });

  return NextResponse.json(kv);
}
