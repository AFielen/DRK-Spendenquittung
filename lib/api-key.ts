import { createHash, randomBytes } from 'crypto';
import { NextRequest } from 'next/server';
import { prisma } from './db';
import type { ApiKeyContext } from './api-key-types';

export function generateApiKey(): { fullKey: string; keyHash: string; prefix: string } {
  const random = randomBytes(20).toString('hex');
  const fullKey = `sq_live_${random}`;
  const keyHash = createHash('sha256').update(fullKey).digest('hex');
  const prefix = fullKey.substring(0, 16);
  return { fullKey, keyHash, prefix };
}

export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

export async function validateApiKey(request: NextRequest): Promise<ApiKeyContext | null> {
  const auth = request.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return null;

  const token = auth.slice(7).trim();
  if (!token.startsWith('sq_live_')) return null;

  const keyHash = hashApiKey(token);

  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash },
    select: {
      id: true,
      kreisverbandId: true,
      nutzerId: true,
      berechtigungen: true,
      ablaufDatum: true,
    },
  });

  if (!apiKey) return null;

  // Ablaufdatum prüfen
  if (apiKey.ablaufDatum && apiKey.ablaufDatum < new Date()) return null;

  // Letzte Nutzung aktualisieren (fire-and-forget)
  prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { letzteNutzung: new Date() },
  }).catch(() => { /* ignorieren */ });

  return {
    kreisverbandId: apiKey.kreisverbandId,
    nutzerId: apiKey.nutzerId,
    berechtigungen: apiKey.berechtigungen,
  };
}

export function requireScope(context: ApiKeyContext, scope: string): boolean {
  return context.berechtigungen.includes(scope);
}
