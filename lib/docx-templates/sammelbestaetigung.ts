import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  ImageRun,
  Footer,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  PageBreak,
} from 'docx';
import type { Verein, Spender, Zuwendung } from '@/lib/types';
import { spenderAnzeigename } from '@/lib/types';
import { betragInWorten } from './betrag-in-worten';
import { getLogoBytes } from './default-logo';
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

function formatDatum(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

function formatBetrag(n: number): string {
  return n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function spenderAnschrift(spender: Spender): string {
  if (spender.istFirma && spender.firmenname) {
    return `${spender.firmenname}\n${spender.strasse}\n${spender.plz} ${spender.ort}`;
  }
  const anrede = spender.anrede ? `${spender.anrede} ` : '';
  return `${anrede}${spender.vorname ?? ''} ${spender.nachname}\n${spender.strasse}\n${spender.plz} ${spender.ort}`;
}

const cellBorder = {
  top: { style: BorderStyle.SINGLE, size: 1 },
  bottom: { style: BorderStyle.SINGLE, size: 1 },
  left: { style: BorderStyle.SINGLE, size: 1 },
  right: { style: BorderStyle.SINGLE, size: 1 },
} as const;

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
  const sections: Paragraph[] = [];

  if (doppel) {
    sections.push(
      new Paragraph({
        children: [
          new TextRun({
            text: '— DOPPEL — Kopie für die Vereinsakte (Aufbewahrungspflicht: 10 Jahre gemäß § 50 Abs. 7 EStDV)',
            font: 'Arial', size: 18, color: '999999', bold: true,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      })
    );
  }

  // Aussteller (DRK-Kompaktlogo als Standard)
  const ausstellerChildren: (TextRun | ImageRun)[] = [];
  const logoBytes = await getLogoBytes(verein.logoBase64);
  if (logoBytes) {
    ausstellerChildren.push(
      new ImageRun({ data: logoBytes, transformation: { width: 57, height: 57 }, type: 'png' })
    );
    ausstellerChildren.push(new TextRun({ text: '  ', font: 'Arial', size: 20 }));
  }

  sections.push(
    new Paragraph({
      children: [...ausstellerChildren, new TextRun({ text: verein.name, font: 'Arial', size: 20, bold: true })],
    })
  );
  sections.push(
    new Paragraph({
      children: [new TextRun({ text: `${verein.strasse}, ${verein.plz} ${verein.ort}`, font: 'Arial', size: 20 })],
    })
  );
  sections.push(new Paragraph({ children: [] }));

  // Titel
  for (const zeile of TITEL_SAMMELBESTAETIGUNG.split('\n')) {
    sections.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: zeile, font: 'Arial', size: 22, bold: true })],
      })
    );
  }
  sections.push(new Paragraph({ children: [] }));

  // Name und Anschrift
  sections.push(
    new Paragraph({
      children: [new TextRun({ text: 'Name und Anschrift des Zuwendenden:', font: 'Arial', size: 20, bold: true })],
    })
  );
  for (const line of spenderAnschrift(spender).split('\n')) {
    sections.push(new Paragraph({ children: [new TextRun({ text: line, font: 'Arial', size: 20 })] }));
  }
  sections.push(new Paragraph({ children: [] }));

  // Gesamtbetrag
  sections.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'Gesamtbetrag der Zuwendung  - in Ziffern -  ', font: 'Arial', size: 20 }),
        new TextRun({ text: `${formatBetrag(gesamtbetrag)} €`, font: 'Arial', size: 20, bold: true }),
        new TextRun({ text: '  - in Buchstaben -  ', font: 'Arial', size: 20 }),
        new TextRun({ text: betragInWorten(gesamtbetrag), font: 'Arial', size: 20, bold: true }),
      ],
    })
  );

  // Zeitraum
  sections.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Zeitraum der Sammelbestätigung: ${formatDatum(zeitraumVon)} bis ${formatDatum(zeitraumBis)}`,
          font: 'Arial', size: 20,
        }),
      ],
    })
  );
  sections.push(new Paragraph({ children: [] }));

  // Freistellungsstatus
  const zwecke = verein.beguenstigteZwecke.join(', ');
  const bescheidDatum = formatDatum(verein.freistellungDatum);
  const freiText =
    verein.freistellungsart === 'freistellungsbescheid'
      ? freistellungTextA(verein.finanzamt, verein.steuernummer, bescheidDatum, verein.letzterVZ || '', zwecke)
      : freistellungTextB(verein.finanzamt, verein.steuernummer, bescheidDatum, zwecke);

  sections.push(
    new Paragraph({
      children: [
        new TextRun({ text: '☑ ', font: 'Arial', size: 18 }),
        new TextRun({ text: freiText, font: 'Arial', size: 18 }),
      ],
    })
  );
  sections.push(new Paragraph({ children: [] }));

  // Verwendungsbestätigung
  sections.push(
    new Paragraph({
      children: [
        new TextRun({
          text: VERWENDUNGSBESTAETIGUNG_PREFIX + zwecke + VERWENDUNGSBESTAETIGUNG_SUFFIX,
          font: 'Arial', size: 20, bold: true,
        }),
      ],
    })
  );
  sections.push(new Paragraph({ children: [] }));

  // Mitgliedsbeitrag-Hinweis
  sections.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'Nur für steuerbegünstigte Einrichtungen, bei denen die Mitgliedsbeiträge steuerlich nicht abziehbar sind:',
          font: 'Arial', size: 16, italics: true,
        }),
      ],
    })
  );
  sections.push(
    new Paragraph({
      children: [
        new TextRun({ text: '☐ ', font: 'Arial', size: 18 }),
        new TextRun({ text: MITGLIEDSBEITRAG_HINWEIS, font: 'Arial', size: 18 }),
      ],
    })
  );
  sections.push(new Paragraph({ children: [] }));

  // Sammelbestätigungs-Pflicht-Texte
  sections.push(
    new Paragraph({
      children: [new TextRun({ text: SAMMEL_DOPPELBESTAETIGUNG, font: 'Arial', size: 20 })],
    })
  );
  sections.push(new Paragraph({ children: [] }));
  sections.push(
    new Paragraph({
      children: [new TextRun({ text: SAMMEL_VERZICHTHINWEIS, font: 'Arial', size: 20 })],
    })
  );
  sections.push(new Paragraph({ children: [] }));
  sections.push(new Paragraph({ children: [] }));

  // Unterschrift
  sections.push(new Paragraph({ children: [new TextRun({ text: '________________________________', font: 'Arial', size: 18 })] }));
  sections.push(
    new Paragraph({
      children: [new TextRun({ text: '(Ort, Datum und Unterschrift des Zuwendungsempfängers)', font: 'Arial', size: 18 })],
    })
  );
  sections.push(
    new Paragraph({
      children: [new TextRun({ text: `${verein.unterschriftName ?? ''}, ${verein.unterschriftFunktion ?? ''}`, font: 'Arial', size: 18 })],
    })
  );
  sections.push(new Paragraph({ children: [] }));

  // Hinweis
  sections.push(new Paragraph({ children: [new TextRun({ text: 'Hinweis:', font: 'Arial', size: 16, bold: true })] }));
  sections.push(new Paragraph({ children: [new TextRun({ text: HAFTUNGSHINWEIS, font: 'Arial', size: 16 })] }));
  sections.push(new Paragraph({ children: [] }));
  sections.push(new Paragraph({ children: [new TextRun({ text: GUELTIGKEITSHINWEIS, font: 'Arial', size: 16 })] }));

  // Seite 2 — Anlage
  const anlageChildren: (Paragraph | Table)[] = [];

  anlageChildren.push(
    new Paragraph({
      children: [new PageBreak()],
    })
  );

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
        new TextRun({
          text: spenderAnzeigename(spender),
          font: 'Arial', size: 20,
        }),
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
        properties: { page: { margin: { top: 1134, bottom: 1134, left: 1418, right: 1134 } } },
        children: [...sections, ...anlageChildren],
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [new TextRun({ text: `Lfd. Nr.: ${laufendeNr}`, font: 'Arial', size: 14 })],
              }),
            ],
          }),
        },
      },
    ],
  });

  return Packer.toBlob(doc);
}
