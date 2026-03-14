import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/db';
import { createSession } from '@/lib/auth';
import { sendMagicCode } from '@/lib/mail';
import { isValidDrkEmail } from '@/lib/domain-check';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = base;
  let suffix = 2;
  while (await prisma.kreisverband.findUnique({ where: { slug } })) {
    slug = `${base}-${suffix}`;
    suffix++;
  }
  return slug;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const step = body.step as string;

  if (step === 'send-code') {
    return handleSendCode(body);
  }

  if (step === 'verify-and-create') {
    return handleVerifyAndCreate(body);
  }

  return NextResponse.json({ error: 'Ungültiger Schritt.' }, { status: 400 });
}

async function handleSendCode(body: Record<string, unknown>) {
  const email = ((body.email as string) || '').trim().toLowerCase();
  const name = ((body.name as string) || '').trim();

  if (!email || !name) {
    return NextResponse.json({ error: 'Name und E-Mail erforderlich.' }, { status: 400 });
  }

  if (!isValidDrkEmail(email)) {
    return NextResponse.json(
      { error: 'Nur E-Mail-Adressen mit @drk-*.de Domain sind erlaubt.' },
      { status: 400 },
    );
  }

  // Prüfe ob E-Mail bereits als Nutzer existiert
  const existing = await prisma.nutzer.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: 'Ein Konto mit dieser E-Mail existiert bereits. Bitte melden Sie sich an.' },
      { status: 409 },
    );
  }

  const code = crypto.randomInt(100000, 999999).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 Minuten

  // Abgelaufene Codes aufräumen + neuen Code speichern (upsert)
  await prisma.registrierungCode.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });

  await prisma.registrierungCode.upsert({
    where: { email },
    update: { name, code, expiresAt },
    create: { email, name, code, expiresAt },
  });

  await sendMagicCode(email, code);

  return NextResponse.json({ success: true });
}

async function handleVerifyAndCreate(body: Record<string, unknown>) {
  const email = ((body.email as string) || '').trim().toLowerCase();
  const code = ((body.code as string) || '').trim();
  const name = ((body.name as string) || '').trim();
  const kv = body.kreisverband as Record<string, unknown> | undefined;

  if (!email || !code || !name || !kv) {
    return NextResponse.json({ error: 'Alle Felder erforderlich.' }, { status: 400 });
  }

  if (!isValidDrkEmail(email)) {
    return NextResponse.json(
      { error: 'Nur E-Mail-Adressen mit @drk-*.de Domain sind erlaubt.' },
      { status: 400 },
    );
  }

  // Code verifizieren
  const regCode = await prisma.registrierungCode.findUnique({ where: { email } });

  if (!regCode || regCode.code !== code) {
    return NextResponse.json({ error: 'Ungültiger Code.' }, { status: 401 });
  }

  if (regCode.expiresAt < new Date()) {
    return NextResponse.json(
      { error: 'Code abgelaufen. Bitte fordern Sie einen neuen Code an.' },
      { status: 401 },
    );
  }

  // Nochmal prüfen ob E-Mail nicht zwischenzeitlich vergeben
  const existingNutzer = await prisma.nutzer.findUnique({ where: { email } });
  if (existingNutzer) {
    return NextResponse.json(
      { error: 'Ein Konto mit dieser E-Mail existiert bereits.' },
      { status: 409 },
    );
  }

  // Pflichtfelder des Kreisverbands prüfen
  const kvName = ((kv.name as string) || '').trim();
  if (!kvName || !kv.finanzamt || !kv.steuernummer || !kv.freistellungsart || !kv.freistellungDatum || !kv.unterschriftName || !kv.unterschriftFunktion) {
    return NextResponse.json({ error: 'Alle Vereinsdaten erforderlich.' }, { status: 400 });
  }

  const slug = await uniqueSlug(slugify(kvName));

  // Transaktion: Kreisverband + Admin-Nutzer erstellen + Code löschen
  const result = await prisma.$transaction(async (tx) => {
    const kreisverband = await tx.kreisverband.create({
      data: {
        slug,
        name: kvName,
        strasse: ((kv.strasse as string) || '').trim(),
        plz: ((kv.plz as string) || '').trim(),
        ort: ((kv.ort as string) || '').trim(),
        vereinsregister: ((kv.vereinsregister as string) || '').trim() || null,
        logoBase64: (kv.logoBase64 as string) || null,
        finanzamt: ((kv.finanzamt as string) || '').trim(),
        steuernummer: ((kv.steuernummer as string) || '').trim(),
        freistellungsart: (kv.freistellungsart as string),
        freistellungDatum: new Date(kv.freistellungDatum as string),
        letzterVZ: ((kv.letzterVZ as string) || '').trim() || null,
        beguenstigteZwecke: (kv.beguenstigteZwecke as string[]) || [],
        unterschriftName: ((kv.unterschriftName as string) || '').trim(),
        unterschriftFunktion: ((kv.unterschriftFunktion as string) || '').trim(),
      },
    });

    const nutzer = await tx.nutzer.create({
      data: {
        email,
        name,
        rolle: 'admin',
        kreisverbandId: kreisverband.id,
        letztesLogin: new Date(),
      },
    });

    await tx.registrierungCode.delete({ where: { email } });

    return { kreisverband, nutzer };
  });

  // Session erstellen
  await createSession({
    nutzerId: result.nutzer.id,
    kreisverbandId: result.kreisverband.id,
    email: result.nutzer.email,
    name: result.nutzer.name,
    rolle: result.nutzer.rolle,
  });

  return NextResponse.json({ success: true, kreisverbandId: result.kreisverband.id });
}
