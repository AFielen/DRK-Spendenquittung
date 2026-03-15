import type { Content } from 'pdfmake/interfaces';
import type { Verein, Zuwendung } from '@/lib/types';
import { spenderAnzeigename } from '@/lib/types';
import { createBriefbogenLayout } from './briefbogen';
import { generatePdfBuffer, formatDatum, formatBetrag, spenderAnschrift } from './pdf-helper';

const BEWERTUNGSGRUNDLAGE_LABELS: Record<string, string> = {
  rechnung: 'Originalrechnung / Kaufbeleg',
  eigene_ermittlung: 'Eigene Wertermittlung (Vergleichsrecherche)',
  gutachten: 'Gutachten / Sachverständiger',
};

export async function erstelleEmpfangsbestaetigungPdf(
  verein: Verein,
  zuwendung: Zuwendung
): Promise<Buffer> {
  const spender = zuwendung.spender;
  if (!spender) throw new Error('Spender-Daten fehlen.');

  const content: Content[] = [];

  // Titel
  content.push({
    text: 'Empfangsbestätigung / Übergabeprotokoll Sachspende',
    style: 'title',
    fontSize: 12,
  });
  content.push({
    text: verein.name,
    fontSize: 10,
    alignment: 'center',
  });
  content.push({
    text: 'Internes Dokument – Nicht zur Vorlage beim Finanzamt',
    fontSize: 9,
    italics: true,
    color: '#999999',
    alignment: 'center',
    margin: [0, 2, 0, 10],
  });

  // 1. Spenderdaten
  content.push({ text: '1. Spenderdaten', fontSize: 11, bold: true, margin: [0, 5, 0, 3] });
  content.push({
    text: [
      { text: 'Name: ', bold: true },
      { text: spenderAnzeigename(spender) },
    ],
    fontSize: 10,
  });
  if (spender.strasse) content.push({ text: spender.strasse, fontSize: 10 });
  if (spender.plz || spender.ort) content.push({ text: `${spender.plz ?? ''} ${spender.ort ?? ''}`, fontSize: 10 });
  content.push({ text: ' ', fontSize: 6 });

  // 2. Gegenstand der Sachspende
  content.push({ text: '2. Gegenstand der Sachspende', fontSize: 11, bold: true, margin: [0, 5, 0, 3] });

  const detailBody: Content[][] = [];
  if (zuwendung.sachBezeichnung) {
    detailBody.push([{ text: 'Bezeichnung:', bold: true, fontSize: 10 }, { text: zuwendung.sachBezeichnung, fontSize: 10 }]);
  }
  if (zuwendung.sachAlter || zuwendung.sachZustand) {
    const val = [zuwendung.sachAlter, zuwendung.sachZustand].filter(Boolean).join(', ');
    detailBody.push([{ text: 'Alter/Zustand:', bold: true, fontSize: 10 }, { text: val, fontSize: 10 }]);
  }
  detailBody.push([{ text: 'Anzahl:', bold: true, fontSize: 10 }, { text: '1', fontSize: 10 }]);
  if (zuwendung.sachWert != null) {
    detailBody.push([{ text: 'Geschätzter Wert:', bold: true, fontSize: 10 }, { text: `${formatBetrag(zuwendung.sachWert)} €`, fontSize: 10 }]);
  }

  const herkunftLabel =
    zuwendung.sachHerkunft === 'privatvermoegen' ? 'Privatvermögen'
    : zuwendung.sachHerkunft === 'betriebsvermoegen' ? 'Betriebsvermögen'
    : 'Keine Angabe';
  detailBody.push([{ text: 'Herkunft:', bold: true, fontSize: 10 }, { text: herkunftLabel, fontSize: 10 }]);

  if (zuwendung.sachBewertungsgrundlage) {
    detailBody.push([
      { text: 'Bewertungsgrundlage:', bold: true, fontSize: 10 },
      { text: BEWERTUNGSGRUNDLAGE_LABELS[zuwendung.sachBewertungsgrundlage] ?? zuwendung.sachBewertungsgrundlage, fontSize: 10 },
    ]);
  }

  content.push({
    table: { widths: [120, '*'], body: detailBody },
    layout: 'noBorders',
  });
  content.push({ text: ' ', fontSize: 6 });

  // 3. Übernahme
  content.push({ text: '3. Übernahme', fontSize: 11, bold: true, margin: [0, 5, 0, 3] });

  const uebernahmeBody: Content[][] = [
    [{ text: 'Datum der Übernahme:', bold: true, fontSize: 10 }, { text: formatDatum(zuwendung.datum), fontSize: 10 }],
    [{ text: 'Empfangende Stelle:', bold: true, fontSize: 10 }, { text: verein.name, fontSize: 10 }],
    [{ text: 'Empfangende Person:', bold: true, fontSize: 10 }, { text: '__________________', fontSize: 10 }],
  ];

  const verwendung = zuwendung.zweckbindung || zuwendung.bemerkung;
  if (verwendung) {
    uebernahmeBody.push([{ text: 'Geplante Verwendung:', bold: true, fontSize: 10 }, { text: verwendung, fontSize: 10 }]);
  }

  content.push({
    table: { widths: [120, '*'], body: uebernahmeBody },
    layout: 'noBorders',
  });
  content.push({ text: ' ', fontSize: 10 });
  content.push({ text: ' ', fontSize: 10 });

  // 4. Unterschriften
  content.push({ text: '4. Unterschriften', fontSize: 11, bold: true, margin: [0, 5, 0, 3] });

  content.push({
    columns: [
      {
        width: '*',
        stack: [
          { text: ' ', fontSize: 20 },
          { text: '________________________________', fontSize: 9 },
          { text: 'Spender/in', fontSize: 9, bold: true },
          { text: 'Ort, Datum', fontSize: 8, color: '#999999' },
        ],
      },
      {
        width: '*',
        stack: [
          { text: ' ', fontSize: 20 },
          { text: '________________________________', fontSize: 9 },
          { text: 'Empfänger/in (DRK)', fontSize: 9, bold: true },
          { text: 'Ort, Datum', fontSize: 8, color: '#999999' },
        ],
      },
    ],
  });
  content.push({ text: ' ', fontSize: 10 });
  content.push({ text: ' ', fontSize: 10 });

  // Fußzeile
  content.push({
    text: 'Dieses Dokument dient der internen Dokumentation des Eigentumsübergangs.',
    fontSize: 8,
    italics: true,
    color: '#999999',
  });
  content.push({
    text: `${verein.name} · ${verein.strasse}, ${verein.plz} ${verein.ort}`,
    fontSize: 8,
    color: '#999999',
  });

  const docDefinition = createBriefbogenLayout(content, {
    verein,
    empfaenger: spenderAnschrift(spender),
    datum: formatDatum(zuwendung.datum),
  });

  return generatePdfBuffer(docDefinition);
}
