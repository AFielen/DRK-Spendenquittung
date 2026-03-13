import { PrismaClient } from '../lib/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  // Erstelle einen Demo-Kreisverband
  const kv = await prisma.kreisverband.upsert({
    where: { slug: 'aachen' },
    update: {},
    create: {
      slug: 'aachen',
      name: 'DRK Kreisverband StädteRegion Aachen e.V.',
      strasse: 'Henry-Dunant-Platz 1',
      plz: '52146',
      ort: 'Würselen',
      finanzamt: 'Finanzamt Aachen-Stadt',
      steuernummer: '201/5770/0000',
      freistellungsart: 'freistellungsbescheid',
      freistellungDatum: new Date('2023-01-15'),
      letzterVZ: '2021',
      beguenstigteZwecke: [
        'Förderung des öffentlichen Gesundheitswesens',
        'Förderung der Hilfe für politisch, rassistisch oder religiös Verfolgte',
      ],
      unterschriftName: 'Max Mustermann',
      unterschriftFunktion: 'Schatzmeister',
      laufendeNrFormat: 'SQ-{JAHR}-{NR}',
      laufendeNrAktuell: 1,
      laufendeNrJahr: new Date().getFullYear(),
    },
  });

  console.log(`Kreisverband erstellt: ${kv.name} (${kv.id})`);

  // Erstelle einen Admin-Nutzer
  const admin = await prisma.nutzer.upsert({
    where: { email: 'admin@drk-aachen.de' },
    update: {},
    create: {
      email: 'admin@drk-aachen.de',
      name: 'Administrator',
      rolle: 'admin',
      kreisverbandId: kv.id,
    },
  });

  console.log(`Admin-Nutzer erstellt: ${admin.email} (${admin.id})`);
  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
