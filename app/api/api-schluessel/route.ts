import { NextRequest, NextResponse } from 'next/server';
import { getSession, requireSchreibrecht } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { generateApiKey } from '@/lib/api-key';
import { ALL_SCOPES } from '@/lib/api-key-types';
import type { ApiKeyScope } from '@/lib/api-key-types';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });
  if (!requireSchreibrecht(session)) return NextResponse.json({ error: 'Keine Berechtigung.' }, { status: 403 });

  const keys = await prisma.apiKey.findMany({
    where: { kreisverbandId: session.kreisverbandId },
    select: {
      id: true,
      name: true,
      prefix: true,
      berechtigungen: true,
      letzteNutzung: true,
      ablaufDatum: true,
      erstelltAm: true,
      nutzer: { select: { name: true, email: true } },
    },
    orderBy: { erstelltAm: 'desc' },
  });

  return NextResponse.json(keys);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });
  if (!requireSchreibrecht(session)) return NextResponse.json({ error: 'Keine Berechtigung.' }, { status: 403 });

  const body = await req.json();

  if (!body.name?.trim()) {
    return NextResponse.json({ error: 'Name ist erforderlich.' }, { status: 400 });
  }

  const berechtigungen: string[] = body.berechtigungen || [];
  const invalidScopes = berechtigungen.filter((s: string) => !ALL_SCOPES.includes(s as ApiKeyScope));
  if (invalidScopes.length > 0) {
    return NextResponse.json({ error: `Ungültige Berechtigungen: ${invalidScopes.join(', ')}` }, { status: 400 });
  }

  if (berechtigungen.length === 0) {
    return NextResponse.json({ error: 'Mindestens eine Berechtigung ist erforderlich.' }, { status: 400 });
  }

  const { fullKey, keyHash, prefix } = generateApiKey();

  const apiKey = await prisma.apiKey.create({
    data: {
      name: body.name.trim(),
      keyHash,
      prefix,
      berechtigungen,
      ablaufDatum: body.ablaufDatum ? new Date(body.ablaufDatum) : null,
      kreisverbandId: session.kreisverbandId,
      nutzerId: session.nutzerId,
    },
  });

  return NextResponse.json({
    id: apiKey.id,
    name: apiKey.name,
    prefix: apiKey.prefix,
    berechtigungen: apiKey.berechtigungen,
    ablaufDatum: apiKey.ablaufDatum,
    fullKey, // Nur bei Erstellung!
  }, { status: 201 });
}
