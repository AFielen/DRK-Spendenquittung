import { NextRequest, NextResponse } from 'next/server';
import { withApiKey } from '@/lib/api-v1-helpers';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  return withApiKey(req, 'kreisverband:read', async (ctx) => {
    const kv = await prisma.kreisverband.findUnique({
      where: { id: ctx.kreisverbandId },
      select: {
        id: true,
        slug: true,
        name: true,
        strasse: true,
        plz: true,
        ort: true,
        vereinsregister: true,
        finanzamt: true,
        steuernummer: true,
        freistellungsart: true,
        freistellungDatum: true,
        letzterVZ: true,
        beguenstigteZwecke: true,
        unterschriftName: true,
        unterschriftFunktion: true,
        // logoBase64 bewusst ausgelassen (zu groß)
      },
    });

    if (!kv) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Kreisverband nicht gefunden.' } },
        { status: 404 },
      );
    }

    return NextResponse.json(kv);
  });
}
