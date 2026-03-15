import { NextResponse } from 'next/server';
import { getSession, isSuperadmin } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });
  }

  const nutzer = await prisma.nutzer.findUnique({
    where: { id: session.nutzerId },
    include: { kreisverband: true },
  });

  if (!nutzer) {
    return NextResponse.json({ error: 'Nutzer nicht gefunden.' }, { status: 404 });
  }

  return NextResponse.json({
    nutzer: {
      id: nutzer.id,
      email: nutzer.email,
      name: nutzer.name,
      rolle: nutzer.rolle,
      isSuperadmin: isSuperadmin(session),
    },
    kreisverband: {
      id: nutzer.kreisverband.id,
      slug: nutzer.kreisverband.slug,
      name: nutzer.kreisverband.name,
      strasse: nutzer.kreisverband.strasse,
      plz: nutzer.kreisverband.plz,
      ort: nutzer.kreisverband.ort,
      vereinsregister: nutzer.kreisverband.vereinsregister,
      logoBase64: nutzer.kreisverband.logoBase64,
      finanzamt: nutzer.kreisverband.finanzamt,
      steuernummer: nutzer.kreisverband.steuernummer,
      freistellungsart: nutzer.kreisverband.freistellungsart,
      freistellungDatum: nutzer.kreisverband.freistellungDatum,
      letzterVZ: nutzer.kreisverband.letzterVZ,
      beguenstigteZwecke: nutzer.kreisverband.beguenstigteZwecke,
      unterschriftName: nutzer.kreisverband.unterschriftName,
      unterschriftFunktion: nutzer.kreisverband.unterschriftFunktion,
      laufendeNrFormat: nutzer.kreisverband.laufendeNrFormat,
    },
  });
}
