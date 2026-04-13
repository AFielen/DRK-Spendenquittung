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
  PageBreak,
} from 'docx';
import type { Verein, Spender, Zuwendung } from '@/lib/types';
import { spenderAnzeigename } from '@/lib/types';
import { formatDatum, formatBetrag } from '@/lib/format';
import { betragInWorten } from './betrag-in-worten';
import { createDocxHeader, createDocxFooter, createDoppelParagraph } from './briefbogen';
import {
  TITEL_SAMMELBESTAETIGUNG,
  freistellungTextA,
  freistellungTextB,
  VERWENDUNGSBESTAETIGUNG_PREFIX,
  VERWENDUNGSBESTAETIGUNG_SUFFIX,
  MITGLIEDSBEITRAG_HINWEIS,
  SAMMEL_DOPPELBESTAETIGUNG,
  SAMMEL_VERZICHTHINWEIS,
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
const cellBordersStyled = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder };

const cellBorder = {
  top: { style: BorderStyle.SINGLE, size: 1 },
  bottom: { style: BorderStyle.SINGLE, size: 1 },
  left: { style: BorderStyle.SINGLE, size: 1 },
  right: { style: BorderStyle.SINGLE, size: 1 },
} as const;

function borderedBox(label: string, contentLines: string[]): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: cellBordersStyled,
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
              borders: cellBordersStyled,
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

function makeCell(text: string, bold = false, alignment: (typeof AlignmentType)[keyof typeof AlignmentType] = AlignmentType.LEFT): TableCell {
  return new TableCell({
    borders: cellBorder,
    children: [
      new Paragraph({
        alignment,
        children: [new TextRun({ text, font: 'Arial', size: 18, bold })],
      }),
    ],
  });
}

export async function generateSammelbestaetigung(
  verein: Verein,
  spender: Spender,
  zuwendungen: Zuwendung[],
  zeitraumVon: string,
  zeitraumBis: string,
  laufendeNr: string,
  doppel = false
): Promise<Blob> {
  const gesamtbetrag = zuwendungen.reduce((s, z) => s + z.betrag, 0);
  const sections: (Paragraph | Table)[] = [];

  if (doppel) {
    sections.push(createDoppelParagraph());
  }

  // Briefbogen-Header
  const header = await createDocxHeader(
    verein,
    spenderAnschrift(spender),
    formatDatum(zeitraumBis)
  );
  sections.push(...header);

  // Titel
  for (const zeile of TITEL_SAMMELBESTAETIGUNG.split('\n')) {
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

  // Gesamtbetrag + Buchstaben (bordered data row)
  sections.push(
    dataRow([
      { label: 'Gesamtbetrag der Zuwendung – in Ziffern', value: `${formatBetrag(gesamtbetrag)} €` },
      { label: 'in Buchstaben', value: betragInWorten(gesamtbetrag) },
    ])
  );
  sections.push(new Paragraph({ children: [], spacing: { after: 60 } }));

  // Zeitraum
  sections.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Zeitraum der Sammelbestätigung: ${formatDatum(zeitraumVon)} bis ${formatDatum(zeitraumBis)}`,
          font: 'Arial', size: 20,
        }),
      ],
      spacing: { after: 120 },
    })
  );

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
              borders: cellBordersStyled,
              shading: { fill: 'f5f5f5' },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: VERWENDUNGSBESTAETIGUNG_PREFIX + zwecke + VERWENDUNGSBESTAETIGUNG_SUFFIX,
                      font: 'Arial', size: 18, bold: true,
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
          font: 'Arial', size: 16, italics: true,
        }),
      ],
      spacing: { after: 20 },
    })
  );
  sections.push(checkbox(false, MITGLIEDSBEITRAG_HINWEIS, 16));
  sections.push(new Paragraph({ children: [], spacing: { after: 60 } }));

  // Sammelbestätigungs-Pflicht-Texte
  sections.push(
    new Paragraph({
      children: [new TextRun({ text: SAMMEL_DOPPELBESTAETIGUNG, font: 'Arial', size: 18 })],
      spacing: { after: 60 },
    })
  );
  sections.push(
    new Paragraph({
      children: [new TextRun({ text: SAMMEL_VERZICHTHINWEIS, font: 'Arial', size: 18 })],
      spacing: { after: 120 },
    })
  );

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

  // Seite 2 — Anlage
  const anlageChildren: (Paragraph | Table)[] = [];

  anlageChildren.push(new Paragraph({ children: [new PageBreak()] }));

  anlageChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'Anlage zur Sammelbestätigung', font: 'Arial', size: 22, bold: true })],
      spacing: { after: 200 },
    })
  );

  anlageChildren.push(
    new Paragraph({
      children: [
        new TextRun({ text: spenderAnzeigename(spender), font: 'Arial', size: 20 }),
      ],
      spacing: { after: 200 },
    })
  );

  // Tabelle
  const headerRow = new TableRow({
    children: [
      makeCell('Datum der Zuwendung', true),
      makeCell('Art der Zuwendung', true),
      makeCell('Verzicht auf Erstattung', true),
      makeCell('Betrag', true, AlignmentType.RIGHT),
    ],
  });

  const dataRows = zuwendungen.map(
    (z) =>
      new TableRow({
        children: [
          makeCell(formatDatum(z.datum)),
          makeCell(z.verwendung === 'spende' ? 'Geldzuwendung' : 'Mitgliedsbeitrag'),
          makeCell(z.verzicht ? 'ja' : 'nein'),
          makeCell(`${formatBetrag(z.betrag)} €`, false, AlignmentType.RIGHT),
        ],
      })
  );

  const sumRow = new TableRow({
    children: [
      makeCell('Gesamtsumme', true),
      makeCell(''),
      makeCell(''),
      makeCell(`${formatBetrag(gesamtbetrag)} €`, true, AlignmentType.RIGHT),
    ],
  });

  const table = new Table({
    rows: [headerRow, ...dataRows, sumRow],
    width: { size: 100, type: WidthType.PERCENTAGE },
  });

  anlageChildren.push(table);

  const doc = new Document({
    sections: [
      {
        properties: { page: { margin: { top: 850, bottom: 1134, left: 1418, right: 1418 } } },
        children: [...sections, ...anlageChildren],
        footers: {
          default: createDocxFooter(verein, laufendeNr),
        },
      },
    ],
  });

  return Packer.toBlob(doc);
}
