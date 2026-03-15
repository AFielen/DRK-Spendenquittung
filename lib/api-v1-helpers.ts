import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, requireScope } from './api-key';
import { checkRateLimit, rateLimitHeaders } from './rate-limit';
import type { ApiKeyContext, ApiKeyScope } from './api-key-types';

function jsonError(code: string, message: string, status: number, extraHeaders?: Record<string, string>) {
  return NextResponse.json(
    { error: { code, message } },
    { status, headers: extraHeaders },
  );
}

export async function withApiKey(
  request: NextRequest,
  requiredScope: ApiKeyScope,
  handler: (context: ApiKeyContext) => Promise<NextResponse>,
): Promise<NextResponse> {
  // 1. API-Key validieren
  const context = await validateApiKey(request);
  if (!context) {
    return jsonError('UNAUTHORIZED', 'Ungültiger oder fehlender API-Schlüssel.', 401);
  }

  // 2. Rate Limit prüfen
  const rateResult = checkRateLimit(context.nutzerId);
  const rlHeaders = rateLimitHeaders(rateResult);

  if (!rateResult.allowed) {
    return jsonError('RATE_LIMITED', 'Zu viele Anfragen. Bitte warten.', 429, rlHeaders);
  }

  // 3. Berechtigung prüfen
  if (!requireScope(context, requiredScope)) {
    return jsonError(
      'FORBIDDEN',
      `Fehlende Berechtigung: ${requiredScope}`,
      403,
      rlHeaders,
    );
  }

  // 4. Handler ausführen
  const response = await handler(context);

  // Rate-Limit-Headers zu erfolgreicher Antwort hinzufügen
  for (const [key, value] of Object.entries(rlHeaders)) {
    response.headers.set(key, value);
  }

  return response;
}
