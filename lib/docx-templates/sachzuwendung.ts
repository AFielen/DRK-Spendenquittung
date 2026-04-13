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
import type { Verein, Spender, Zuwendung } from '@/lib/types';
import { formatDatum, formatBetrag } from '@/lib/format';
import { betragInWorten } from './betrag-in-worten';
import { createDocxHeader, createDocxFooter, createDoppelParagraph } from './briefbogen';
import {
  TITEL_SACHZUWENDUNG,
  freistellungTextA,
  freistellungTextB,
  VERWENDUNGSBESTAETIGUNG_PREFIX,
  VERWENDUNGSBESTAETIGUNG_SUFFIX,
  HAFTUNGSHINWEIS,
  GUELTIGKEITSHINWEIS,
  SACHSPENDE_BETRIEBSVERMOEGEN,
  SACHSPENDE_PRIVATVERMOEGEN,
  SACHSPENDE_KEINE_ANGABE,
  SACHSPENDE_UNTERLAGEN,
} from './shared';

function spenderAnschrift(spender: Spender): string {
  if (spender.istFirma && spender.firmenname) {
    return `${spender.firmenname}\n${spender.strasse}\n${spender.plz} ${spender.ort}`;
  }
  const anrede = spender.anrede ? `${spender.anrede} ` : '';
  return `${anrede}${spender.vorname ?? ''} ${spender.nachname}\n${spender.strasse}\n${spender.plz} ${spender.ort}`;
}

const thinBorder = { style: BorderStyle.SINGLE, size: 1, color: '999999' } as const;
const cellBorders = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder };

function borderedBox(label: string, contentLines: string[]): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: cellBorders,
            children: [
              new Paragraph({
                children: [new TextRun({ text: label, font: 'Arial', size: 16, color: '666666' })],
                spacing: { after: 40 },
              }),
              ...contentLines.map(
                (line) =>
                  new Paragraph({
                    children: [new TextRun({ text: line, font: 'Arial', size: 20 })],
                  })
              ),
            ],
          }),
        ],
      }),
    ],
  });
}

function dataRow(cells: Array<{ label: string; value: string }>): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: cells.map(
          (c) =>
            new TableCell({
              borders: cellBorders,
              children: [
                new Paragraph({
                  children: [new TextRun({ text: c.label, font: 'Arial', size: 16, color: '666666' })],
                  spacing: { after: 40 },
                }),
                new Paragraph({
                  children: [new TextRun({ text: c.value, font: 'Arial', size: 20, bold: true })],
                }),
              ],
            })
        ),
      }),
    ],
  });
}

function checkbox(checked: boolean, text: string, fontSize = 18): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({ text: checked ? '☑ ' : '☐ ', font: 'Arial', size: fontSize }),
      new TextRun({ text, font: 'Arial', size: fontSize }),
    ],
    spacing: { after: 20 },
  });
}

export async function generateSachzuwendung(
  verein: Verein,
  spender: Spender,
  zuwendung: Zuwendung,
  laufendeNr: string,
  doppel = false
): Promise<Blob> {
  const sections: (Paragraph | Table)[] = [];
  const wert = zuwendung.sachWert ?? zuwendung.betrag;

  if (doppel) {
    sections.push(createDoppelParagraph());
  }

  // Briefbogen-Header
  const header = await createDocxHeader(
    verein,
    spenderAnschrift(spender),
    formatDatum(zuwendung.datum)
  );
  sections.push(...header);

  // Titel
  for (const zeile of TITEL_SACHZUWENDUNG.split('\n')) {
    sections.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: zeile, font: 'Arial', size: 22, bold: true })],
      })
    );
  }
  sections.push(new Paragraph({ children: [], spacing: { after: 60 } }));

  // Aussteller
  sections.push(
    new Paragraph({
      children: [new TextRun({ text: 'Aussteller:', font: 'Arial', size: 20, bold: true })],
      spacing: { after: 20 },
    })
  );
  sections.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `${verein.name}, ${verein.strasse}, ${verein.plz} ${verein.ort}`,
          font: 'Arial',
          size: 20,
        }),
      ],
      spacing: { after: 120 },
    })
  );

  // Name und Anschrift (bordered box)
  const adressLines = spenderAnschrift(spender).split('\n').filter((l) => l.trim());
  sections.push(borderedBox('Name und Anschrift des Zuwendenden:', adressLines));
  sections.push(new Paragraph({ children: [], spacing: { after: 60 } }));

  // Wert + Buchstaben + Tag
  sections.push(
    dataRow([
      { label: 'Wert der Zuwendung – in Ziffern', value: `${formatBetrag(wert)} €` },
      { label: 'in Buchstaben', value: betragInWorten(wert) },
      { label: 'Tag der Zuwendung', value: formatDatum(zuwendung.datum) },
    ])
  );
  sections.push(new Paragraph({ children: [], spacing: { after: 60 } }));

  // Genaue Bezeichnung (bordered box)
  const beschreibungTeile: string[] = [];
  if (zuwendung.sachBezeichnung) beschreibungTeile.push(zuwendung.sachBezeichnung);
  if (zuwendung.sachAlter) beschreibungTeile.push(`Alter: ${zuwendung.sachAlter}`);
  if (zuwendung.sachZustand) beschreibungTeile.push(`Zustand: ${zuwendung.sachZustand}`);
  if (zuwendung.sachKaufpreis) beschreibungTeile.push(`Kaufpreis: ${formatBetrag(zuwendung.sachKaufpreis)} €`);

  sections.push(
    borderedBox(
      'Genaue Bezeichnung der Sachzuwendung mit Alter, Zustand, Kaufpreis usw.',
      [beschreibungTeile.join('; ') || '–']
    )
  );
  sections.push(new Paragraph({ children: [], spacing: { after: 60 } }));

  // Checkboxen Herkunft
  const herkunftItems: Array<{ text: string; checked: boolean }> = [
    { text: SACHSPENDE_BETRIEBSVERMOEGEN, checked: zuwendung.sachHerkunft === 'betriebsvermoegen' },
    { text: SACHSPENDE_PRIVATVERMOEGEN, checked: zuwendung.sachHerkunft === 'privatvermoegen' },
    { text: SACHSPENDE_KEINE_ANGABE, checked: zuwendung.sachHerkunft === 'keine_angabe' },
    { text: SACHSPENDE_UNTERLAGEN, checked: zuwendung.sachUnterlagenVorhanden },
  ];

  for (const item of herkunftItems) {
    sections.push(checkbox(item.checked, item.text, 18));
  }
  sections.push(new Paragraph({ children: [], spacing: { after: 60 } }));

  // Freistellungsstatus
  const zwecke = verein.beguenstigteZwecke.join(', ');
  const bescheidDatum = formatDatum(verein.freistellungDatum);
  const freiText =
    verein.freistellungsart === 'freistellungsbescheid'
      ? freistellungTextA(verein.finanzamt, verein.steuernummer, bescheidDatum, verein.letzterVZ || '', zwecke)
      : freistellungTextB(verein.finanzamt, verein.steuernummer, bescheidDatum, zwecke);

  sections.push(checkbox(true, freiText, 18));
  sections.push(new Paragraph({ children: [], spacing: { after: 60 } }));

  // Verwendungsbestätigung (bordered + shaded)
  sections.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              borders: cellBorders,
              shading: { fill: 'f5f5f5' },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: VERWENDUNGSBESTAETIGUNG_PREFIX + zwecke + VERWENDUNGSBESTAETIGUNG_SUFFIX,
                      font: 'Arial',
                      size: 18,
                      bold: true,
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    })
  );
  sections.push(new Paragraph({ children: [], spacing: { after: 120 } }));

  // Unterschriftenbereich
  sections.push(
    new Paragraph({
      children: [new TextRun({ text: verein.name, font: 'Arial', size: 20 })],
      spacing: { after: 200 },
    })
  );
  sections.push(
    new Paragraph({
      children: [new TextRun({ text: '________________________________', font: 'Arial', size: 18 })],
    })
  );
  sections.push(
    new Paragraph({
      children: [
        new TextRun({ text: `${verein.unterschriftName ?? ''}`, font: 'Arial', size: 18, bold: true }),
        new TextRun({ text: `    ${verein.unterschriftFunktion ?? ''}`, font: 'Arial', size: 18 }),
      ],
    })
  );
  sections.push(
    new Paragraph({
      children: [
        new TextRun({
          text: '(Ort, Datum und Unterschrift des Zuwendungsempfängers)',
          font: 'Arial',
          size: 16,
          color: '666666',
        }),
      ],
      spacing: { after: 120 },
    })
  );

  // Hinweis
  sections.push(new Paragraph({ children: [new TextRun({ text: 'Hinweis:', font: 'Arial', size: 16, bold: true })] }));
  sections.push(new Paragraph({ children: [new TextRun({ text: HAFTUNGSHINWEIS, font: 'Arial', size: 16 })] }));
  sections.push(new Paragraph({ children: [], spacing: { after: 40 } }));
  sections.push(new Paragraph({ children: [new TextRun({ text: GUELTIGKEITSHINWEIS, font: 'Arial', size: 16 })] }));

  const doc = new Document({
    sections: [{
      properties: { page: { margin: { top: 850, bottom: 1134, left: 1418, right: 1418 } } },
      children: sections,
      footers: {
        default: createDocxFooter(verein, laufendeNr),
      },
    }],
  });

  return Packer.toBlob(doc);
}
