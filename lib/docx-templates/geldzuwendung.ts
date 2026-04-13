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
  TITEL_GELDZUWENDUNG,
  freistellungTextA,
  freistellungTextB,
  VERWENDUNGSBESTAETIGUNG_PREFIX,
  VERWENDUNGSBESTAETIGUNG_SUFFIX,
  MITGLIEDSBEITRAG_HINWEIS,
  HAFTUNGSHINWEIS,
  GUELTIGKEITSHINWEIS,
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

/** Creates a bordered box with label and content */
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

/** Creates a bordered data row with multiple cells */
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

/** Creates a checkbox paragraph */
function checkbox(checked: boolean, text: string, fontSize = 18): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({ text: checked ? '☑ ' : '☐ ', font: 'Arial', size: fontSize }),
      new TextRun({ text, font: 'Arial', size: fontSize }),
    ],
    spacing: { after: 20 },
  });
}

export async function generateGeldzuwendung(
  verein: Verein,
  spender: Spender,
  zuwendung: Zuwendung,
  laufendeNr: string,
  doppel = false
): Promise<Blob> {
  const sections: (Paragraph | Table)[] = [];

  // Doppel-Kennzeichnung
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
  const titelZeilen = TITEL_GELDZUWENDUNG.split('\n');
  for (const zeile of titelZeilen) {
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
      children: [
        new TextRun({ text: 'Aussteller:', font: 'Arial', size: 20, bold: true }),
      ],
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

  // Betrag + Buchstaben + Tag (bordered data row)
  sections.push(
    dataRow([
      { label: 'Betrag der Zuwendung – in Ziffern', value: `${formatBetrag(zuwendung.betrag)} €` },
      { label: 'in Buchstaben', value: betragInWorten(zuwendung.betrag) },
      { label: 'Tag der Zuwendung', value: formatDatum(zuwendung.datum) },
    ])
  );
  sections.push(new Paragraph({ children: [], spacing: { after: 60 } }));

  // Verzicht
  const ja = zuwendung.verzicht ? '☑' : '☐';
  const nein = zuwendung.verzicht ? '☐' : '☑';
  sections.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Es handelt sich um den Verzicht auf Erstattung von Aufwendungen  Ja ${ja}  Nein ${nein}`,
          font: 'Arial',
          size: 18,
        }),
      ],
      spacing: { after: 120 },
    })
  );

  // Freistellungsstatus
  const zwecke = verein.beguenstigteZwecke.join(', ');
  const datum = formatDatum(verein.freistellungDatum);
  const freiText =
    verein.freistellungsart === 'freistellungsbescheid'
      ? freistellungTextA(verein.finanzamt, verein.steuernummer, datum, verein.letzterVZ || '', zwecke)
      : freistellungTextB(verein.finanzamt, verein.steuernummer, datum, zwecke);

  sections.push(checkbox(true, freiText, 18));
  sections.push(new Paragraph({ children: [], spacing: { after: 60 } }));

  // Satzungsmäßige Voraussetzungen (unchecked)
  sections.push(checkbox(false, 'Die Einhaltung der satzungsmäßigen Voraussetzungen nach den §§ 51, 59, 60 und 61 AO wurde vom Finanzamt…… St.Nr.…… mit Bescheid von…… nach § 60a AO gesondert festgestellt. Wir fördern nach unserer Satzung (Angabe des begünstigten Zwecks / der begünstigten Zwecke).', 16));
  sections.push(new Paragraph({ children: [], spacing: { after: 60 } }));

  // Verwendungsbestätigung (bordered box with shading)
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
                      text:
                        VERWENDUNGSBESTAETIGUNG_PREFIX +
                        zwecke +
                        VERWENDUNGSBESTAETIGUNG_SUFFIX,
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
  sections.push(new Paragraph({ children: [], spacing: { after: 60 } }));

  // Mitgliedsbeitrag-Hinweis
  sections.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'Nur für steuerbegünstigte Einrichtungen, bei denen die Mitgliedsbeiträge steuerlich nicht abziehbar sind:',
          font: 'Arial',
          size: 16,
          italics: true,
        }),
      ],
      spacing: { after: 20 },
    })
  );
  sections.push(checkbox(false, MITGLIEDSBEITRAG_HINWEIS, 16));
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

  // Haftungshinweis
  sections.push(
    new Paragraph({
      children: [new TextRun({ text: 'Hinweis:', font: 'Arial', size: 16, bold: true })],
    })
  );
  sections.push(
    new Paragraph({
      children: [new TextRun({ text: HAFTUNGSHINWEIS, font: 'Arial', size: 16 })],
    })
  );
  sections.push(new Paragraph({ children: [], spacing: { after: 40 } }));
  sections.push(
    new Paragraph({
      children: [new TextRun({ text: GUELTIGKEITSHINWEIS, font: 'Arial', size: 16 })],
    })
  );

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 850, bottom: 1134, left: 1418, right: 1418 },
          },
        },
        children: sections,
        footers: {
          default: createDocxFooter(verein, laufendeNr),
        },
      },
    ],
  });

  return Packer.toBlob(doc);
}
