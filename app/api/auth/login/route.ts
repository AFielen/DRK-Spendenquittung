import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/db';
import { sendMagicCode } from '@/lib/mail';
import { checkRateLimit } from '@/lib/rate-limit';

// Max 5 Login-Code-Anfragen pro E-Mail pro Minute
const LOGIN_RATE_LIMIT = 5;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = (body.email || '').trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: 'E-Mail-Adresse erforderlich.' }, { status: 400 });
    }

    // Rate Limiting: Verhindert E-Mail-Flooding
    const rl = checkRateLimit(`auth:login:${email}`, LOGIN_RATE_LIMIT);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Zu viele Anfragen. Bitte warten Sie einen Moment.' },
        { status: 429 },
      );
    }

    const nutzer = await prisma.nutzer.findUnique({ where: { email } });

    if (nutzer) {
      const code = crypto.randomInt(100000, 999999).toString();
      const codeHash = crypto.createHash('sha256').update(code).digest('hex');
      const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 Minuten

      await prisma.nutzer.update({
        where: { id: nutzer.id },
        data: { magicCode: codeHash, magicCodeExpiry: expiry, magicCodeVersuche: 0 },
      });

      await sendMagicCode(email, code);
    }

    // Opportunistisches Cleanup: Abgelaufene Magic Codes und Registrierungscodes löschen
    const now = new Date();
    await Promise.allSettled([
      prisma.nutzer.updateMany({
        where: { magicCodeExpiry: { lt: now }, magicCode: { not: null } },
        data: { magicCode: null, magicCodeExpiry: null, magicCodeVersuche: 0 },
      }),
      prisma.registrierungCode.deleteMany({
        where: { expiresAt: { lt: now } },
      }),
    ]);

    // Generische Antwort – verhindert User Enumeration
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Auth login error:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler. Bitte versuchen Sie es später erneut.' },
      { status: 500 },
    );
  }
}
