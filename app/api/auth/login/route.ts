import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/db';
import { sendMagicCode } from '@/lib/mail';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const email = (body.email || '').trim().toLowerCase();

  if (!email) {
    return NextResponse.json({ error: 'E-Mail-Adresse erforderlich.' }, { status: 400 });
  }

  const nutzer = await prisma.nutzer.findUnique({ where: { email } });

  if (!nutzer) {
    return NextResponse.json(
      { error: 'Kein Konto mit dieser E-Mail-Adresse gefunden.' },
      { status: 404 },
    );
  }

  const code = crypto.randomInt(100000, 999999).toString();
  const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 Minuten

  await prisma.nutzer.update({
    where: { id: nutzer.id },
    data: { magicCode: code, magicCodeExpiry: expiry },
  });

  await sendMagicCode(email, code);

  return NextResponse.json({ success: true });
}
