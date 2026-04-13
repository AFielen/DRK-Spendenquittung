import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
} from 'docx';
import type { Verein, Zuwendung } from '@/lib/types';
import { spenderAnzeigename } from '@/lib/types';
import { formatDatum, formatBetrag } from '@/lib/format';
import { createDocxHeader, createDocxFooter } from './briefbogen';

const BEWERTUNGSGRUNDLAGE_LABELS: Record<string, string> = {
  rechnung: 'Originalrechnung / Kaufbeleg',
  eigene_ermittlung: 'Eigene Wertermittlung (Vergleichsrecherche)',
  gutachten: 'Gutachten / Sachverständiger',
};

const noBorder = {
  top: { style: BorderStyle.NONE, size: 0 },
  bottom: { style: BorderStyle.NONE, size: 0 },
  left: { style: BorderStyle.NONE, size: 0 },
  right: { style: BorderStyle.NONE, size: 0 },
} as const;

function labelValueRow(label: string, value: string): TableRow {
  return new TableRow({
    children: [
      new TableCell({
        width: { size: 3500, type: WidthType.DXA },
        borders: noBorder,
        children: [
          new Paragraph({
            children: [new TextRun({ text: label, font: 'Arial', size: 20, bold: true })],
          }),
        ],
      }),
      new TableCell({
        borders: noBorder,
        children: [
          new Paragraph({
            children: [new TextRun({ text: value, font: 'Arial', size: 20 })],
          }),
        ],
      }),
    ],
  });
}

function spenderAnschrift(spender: NonNullable<Zuwendung['spender']>): string {
  if (spender.istFirma && spender.firmenname) {
    return `${spender.firmenname}\n${spender.strasse ?? ''}\n${spender.plz ?? ''} ${spender.ort ?? ''}`;
  }
  const name = spender.vorname ? `${spender.vorname} ${spender.nachname}` : spender.nachname;
  return `${name}\n${spender.strasse ?? ''}\n${spender.plz ?? ''} ${spender.ort ?? ''}`;
}

export async function erstelleEmpfangsbestaetigung(
  verein: Verein,
  zuwendung: Zuwendung
): Promise<Blob> {
  const sections: (Paragraph | Table)[] = [];
  const spender = zuwendung.spender;
  if (!spender) throw new Error('Spender-Daten fehlen.');

  // Briefbogen-Header
  const header = await createDocxHeader(
    verein,
    spenderAnschrift(spender),
    formatDatum(zuwendung.datum)
  );
  sections.push(...header);

  // Titel
  sections.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'Empfangsbestätigung / Übergabeprotokoll Sachspende', font: 'Arial', size: 24, bold: true })],
    })
  );
  sections.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [new TextRun({ text: verein.name, font: 'Arial', size: 20 })],
    })
  );
  sections.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({ text: 'Internes Dokument – Nicht zur Vorlage beim Finanzamt', font: 'Arial', size: 18, italics: true, color: '999999' })],
    })
  );
  sections.push(new Paragraph({ children: [] }));

  // Abschnitt 1: Spenderdaten
  sections.push(
    new Paragraph({
      spacing: { after: 100 },
      children: [new TextRun({ text: '1. Spenderdaten', font: 'Arial', size: 22, bold: true })],
    })
  );

  const spenderName = spenderAnzeigename(spender);
  const spenderAddr = spenderAnschrift(spender);
  sections.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'Name: ', font: 'Arial', size: 20, bold: true }),
        new TextRun({ text: spenderName, font: 'Arial', size: 20 }),
      ],
    })
  );
  for (const line of spenderAddr.split('\n').slice(1)) {
    if (line.trim()) {
      sections.push(
        new Paragraph({
          children: [new TextRun({ text: line, font: 'Arial', size: 20 })],
        })
      );
    }
  }
  sections.push(new Paragraph({ children: [] }));

  // Abschnitt 2: Gegenstand der Sachspende
  sections.push(
    new Paragraph({
      spacing: { after: 100 },
      children: [new TextRun({ text: '2. Gegenstand der Sachspende', font: 'Arial', size: 22, bold: true })],
    })
  );

  const detailRows: TableRow[] = [];
  if (zuwendung.sachBezeichnung) detailRows.push(labelValueRow('Bezeichnung:', zuwendung.sachBezeichnung));
  if (zuwendung.sachAlter || zuwendung.sachZustand) {
    const val = [zuwendung.sachAlter, zuwendung.sachZustand].filter(Boolean).join(', ');
    detailRows.push(labelValueRow('Alter/Zustand:', val));
  }
  detailRows.push(labelValueRow('Anzahl:', '1'));
  if (zuwendung.sachWert != null) {
    detailRows.push(labelValueRow('Geschätzter Wert:', `${formatBetrag(zuwendung.sachWert)} €`));
  }

  const herkunftLabel = zuwendung.sachHerkunft === 'privatvermoegen' ? 'Privatvermögen'
    : zuwendung.sachHerkunft === 'betriebsvermoegen' ? 'Betriebsvermögen'
    : 'Keine Angabe';
  detailRows.push(labelValueRow('Herkunft:', herkunftLabel));

  if (zuwendung.sachBewertungsgrundlage) {
    detailRows.push(labelValueRow('Bewertungsgrundlage:', BEWERTUNGSGRUNDLAGE_LABELS[zuwendung.sachBewertungsgrundlage] ?? zuwendung.sachBewertungsgrundlage));
  }

  sections.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: detailRows,
    })
  );
  sections.push(new Paragraph({ children: [] }));

  // Abschnitt 3: Übernahme
  sections.push(
    new Paragraph({
      spacing: { after: 100 },
      children: [new TextRun({ text: '3. Übernahme', font: 'Arial', size: 22, bold: true })],
    })
  );

  const uebernahmeRows: TableRow[] = [
    labelValueRow('Datum der Übernahme:', formatDatum(zuwendung.datum)),
    labelValueRow('Empfangende Stelle:', verein.name),
    labelValueRow('Empfangende Person:', '__________________'),
  ];

  const verwendung = zuwendung.zweckbindung || zuwendung.bemerkung;
  if (verwendung) {
    uebernahmeRows.push(labelValueRow('Geplante Verwendung:', verwendung));
  }

  sections.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: uebernahmeRows,
    })
  );
  sections.push(new Paragraph({ children: [] }));
  sections.push(new Paragraph({ children: [] }));

  // Abschnitt 4: Unterschriften
  sections.push(
    new Paragraph({
      spacing: { after: 100 },
      children: [new TextRun({ text: '4. Unterschriften', font: 'Arial', size: 22, bold: true })],
    })
  );

  sections.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              borders: noBorder,
              children: [
                new Paragraph({ children: [] }),
                new Paragraph({ children: [] }),
                new Paragraph({
                  children: [new TextRun({ text: '________________________________', font: 'Arial', size: 18 })],
                }),
                new Paragraph({
                  children: [new TextRun({ text: 'Spender/in', font: 'Arial', size: 18, bold: true })],
                }),
                new Paragraph({
                  children: [new TextRun({ text: 'Ort, Datum', font: 'Arial', size: 16, color: '999999' })],
                }),
              ],
            }),
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              borders: noBorder,
              children: [
                new Paragraph({ children: [] }),
                new Paragraph({ children: [] }),
                new Paragraph({
                  children: [new TextRun({ text: '________________________________', font: 'Arial', size: 18 })],
                }),
                new Paragraph({
                  children: [new TextRun({ text: 'Empfänger/in (DRK)', font: 'Arial', size: 18, bold: true })],
                }),
                new Paragraph({
                  children: [new TextRun({ text: 'Ort, Datum', font: 'Arial', size: 16, color: '999999' })],
                }),
              ],
            }),
          ],
        }),
      ],
    })
  );

  sections.push(new Paragraph({ children: [] }));
  sections.push(new Paragraph({ children: [] }));

  // Fußzeile
  sections.push(
    new Paragraph({
      children: [new TextRun({ text: 'Dieses Dokument dient der internen Dokumentation des Eigentumsübergangs.', font: 'Arial', size: 16, italics: true, color: '999999' })],
    })
  );

  const doc = new Document({
    sections: [{
      properties: { page: { margin: { top: 850, bottom: 1134, left: 1418, right: 1418 } } },
      children: sections,
      footers: {
        default: createDocxFooter(verein),
      },
    }],
  });

  return Packer.toBlob(doc);
}
