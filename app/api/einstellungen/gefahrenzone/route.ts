import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function DELETE() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });
  if (session.rolle !== 'admin') {
    return NextResponse.json({ error: 'Keine Berechtigung. Nur Admins können Daten löschen.' }, { status: 403 });
  }

  const kvId = session.kreisverbandId;

  // Lösche in korrekter Reihenfolge (FK-Constraints)
  await prisma.zuwendung.deleteMany({ where: { kreisverbandId: kvId } });
  await prisma.spender.deleteMany({ where: { kreisverbandId: kvId } });

  // Laufende Nummer zurücksetzen
  await prisma.kreisverband.update({
    where: { id: kvId },
    data: {
      laufendeNrAktuell: 1,
      laufendeNrJahr: new Date().getFullYear(),
    },
  });

  return NextResponse.json({ success: true });
}
