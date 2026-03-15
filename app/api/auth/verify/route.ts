import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/db';
import { createSession } from '@/lib/auth';

const MAX_VERSUCHE = 5;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const email = (body.email || '').trim().toLowerCase();
  const code = (body.code || '').trim();

  if (!email || !code) {
    return NextResponse.json({ error: 'E-Mail und Code erforderlich.' }, { status: 400 });
  }

  const nutzer = await prisma.nutzer.findUnique({
    where: { email },
    include: { kreisverband: true },
  });

  if (!nutzer || !nutzer.magicCode || !nutzer.magicCodeExpiry) {
    return NextResponse.json({ error: 'Ungültiger Code.' }, { status: 401 });
  }

  // Rate-Limiting: Max Fehlversuche
  if ((nutzer.magicCodeVersuche ?? 0) >= MAX_VERSUCHE) {
    // Code invalidieren
    await prisma.nutzer.update({
      where: { id: nutzer.id },
      data: { magicCode: null, magicCodeExpiry: null, magicCodeVersuche: 0 },
    });
    return NextResponse.json(
      { error: 'Zu viele Fehlversuche. Bitte fordern Sie einen neuen Code an.' },
      { status: 429 },
    );
  }

  // Code-Hash vergleichen
  const codeHash = crypto.createHash('sha256').update(code).digest('hex');
  if (nutzer.magicCode !== codeHash) {
    // Fehlversuch zählen
    await prisma.nutzer.update({
      where: { id: nutzer.id },
      data: { magicCodeVersuche: { increment: 1 } },
    });
    return NextResponse.json({ error: 'Ungültiger Code.' }, { status: 401 });
  }

  if (nutzer.magicCodeExpiry < new Date()) {
    return NextResponse.json({ error: 'Code abgelaufen. Bitte fordern Sie einen neuen Code an.' }, { status: 401 });
  }

  // Code verbrauchen und Login-Zeitstempel setzen
  await prisma.nutzer.update({
    where: { id: nutzer.id },
    data: {
      magicCode: null,
      magicCodeExpiry: null,
      magicCodeVersuche: 0,
      letztesLogin: new Date(),
    },
  });

  // Session erstellen
  await createSession({
    nutzerId: nutzer.id,
    kreisverbandId: nutzer.kreisverbandId,
    email: nutzer.email,
    name: nutzer.name,
    rolle: nutzer.rolle,
  });

  return NextResponse.json({ success: true });
}
