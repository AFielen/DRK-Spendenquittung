import { NextRequest, NextResponse } from 'next/server';
import { withApiKey } from '@/lib/api-v1-helpers';
import { prisma } from '@/lib/db';

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  return withApiKey(req, 'spender:read', async (ctx) => {
    const { id } = await params;
    const spender = await prisma.spender.findFirst({
      where: { id, kreisverbandId: ctx.kreisverbandId },
      include: { zuwendungen: { orderBy: { datum: 'desc' } } },
    });

    if (!spender) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Spender nicht gefunden.' } },
        { status: 404 },
      );
    }

    return NextResponse.json(spender);
  });
}

export async function PUT(req: NextRequest, { params }: Params) {
  return withApiKey(req, 'spender:write', async (ctx) => {
    const { id } = await params;

    const existing = await prisma.spender.findFirst({
      where: { id, kreisverbandId: ctx.kreisverbandId },
    });
    if (!existing) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Spender nicht gefunden.' } },
        { status: 404 },
      );
    }

    const body = await req.json();
    const istFirma = body.istFirma === true;

    const spender = await prisma.spender.update({
      where: { id },
      data: {
        istFirma,
        firmenname: istFirma ? body.firmenname : null,
        vorname: body.vorname || null,
        nachname: istFirma ? (body.nachname || body.firmenname) : body.nachname,
        strasse: body.strasse,
        plz: body.plz,
        ort: body.ort,
        anrede: body.anrede ?? null,
        steuerIdNr: body.steuerIdNr ?? null,
      },
    });

    return NextResponse.json(spender);
  });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  return withApiKey(req, 'spender:write', async (ctx) => {
    const { id } = await params;
    const url = new URL(req.url);
    const confirm = url.searchParams.get('confirm') === 'true';

    const existing = await prisma.spender.findFirst({
      where: { id, kreisverbandId: ctx.kreisverbandId },
      include: { _count: { select: { zuwendungen: true } } },
    });

    if (!existing) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Spender nicht gefunden.' } },
        { status: 404 },
      );
    }

    if (existing._count.zuwendungen > 0 && !confirm) {
      return NextResponse.json(
        { error: { code: 'CONFIRM_REQUIRED', message: `Spender hat ${existing._count.zuwendungen} Zuwendung(en). ?confirm=true zum Bestätigen.` } },
        { status: 409 },
      );
    }

    await prisma.spender.delete({ where: { id } });

    return NextResponse.json({ success: true });
  });
}
