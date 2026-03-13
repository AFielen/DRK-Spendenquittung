import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createSession } from '@/lib/auth';

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

  if (nutzer.magicCode !== code) {
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
