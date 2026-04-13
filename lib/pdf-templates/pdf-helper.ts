import type { TDocumentDefinitions } from 'pdfmake/interfaces';

/**
 * Creates a PDF buffer from a pdfmake document definition.
 * Uses the server-side pdfmake module with built-in Helvetica fonts.
 */
export async function generatePdfBuffer(docDefinition: TDocumentDefinitions): Promise<Buffer> {
  // Dynamic import to avoid issues with client-side bundling
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfmake = require('pdfmake/js/index') as {
    fonts: Record<string, { normal?: string; bold?: string; italics?: string; bolditalics?: string }>;
    createPdf: (dd: TDocumentDefinitions) => { getBuffer: () => Promise<Buffer> };
  };

  // Register standard PDF fonts (built into pdfmake)
  pdfmake.fonts = {
    Helvetica: {
      normal: 'Helvetica',
      bold: 'Helvetica-Bold',
      italics: 'Helvetica-Oblique',
      bolditalics: 'Helvetica-BoldOblique',
    },
  };

  const doc = pdfmake.createPdf(docDefinition);
  return doc.getBuffer();
}

export { formatDatum, formatBetrag } from '@/lib/format';

// ── Design Helpers for Certificate Templates ──

import type { Content } from 'pdfmake/interfaces';

/** Creates a bordered box with a label header and content */
export function createBorderedBox(label: string, contentLines: string[]): Content {
  return {
    table: {
      widths: ['*'],
      body: [
        [
          {
            stack: [
              { text: label, fontSize: 8, color: '#666666', margin: [0, 0, 0, 2] },
              ...contentLines.map((line) => ({ text: line, fontSize: 10 })),
            ],
            margin: [4, 4, 4, 4],
          },
        ],
      ],
    },
    layout: {
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
      hLineColor: () => '#999999',
      vLineColor: () => '#999999',
    },
    margin: [0, 0, 0, 6] as [number, number, number, number],
  };
}

/** Creates a bordered row of cells (e.g., Betrag | Buchstaben | Tag) */
export function createDataRow(cells: Array<{ label: string; value: string; width?: string | number }>): Content {
  return {
    table: {
      widths: cells.map((c) => c.width ?? '*'),
      body: [
        cells.map((c) => ({
          stack: [
            { text: c.label, fontSize: 8, color: '#666666', margin: [0, 0, 0, 2] },
            { text: c.value, fontSize: 10, bold: true },
          ],
          margin: [4, 4, 4, 4],
        })),
      ],
    },
    layout: {
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
      hLineColor: () => '#999999',
      vLineColor: () => '#999999',
    },
    margin: [0, 0, 0, 6] as [number, number, number, number],
  };
}

/** Creates a checkbox element with consistent formatting */
export function createCheckbox(checked: boolean, text: string, fontSize = 9): Content {
  return {
    text: [
      { text: checked ? '[X] ' : '[ ] ', fontSize, bold: true },
      { text, fontSize },
    ],
    margin: [0, 1, 0, 1] as [number, number, number, number],
  };
}

/** Creates the "Aussteller:" section */
export function createAusstellerBlock(verein: { name: string; strasse: string; plz: string; ort: string }): Content[] {
  return [
    {
      text: [
        { text: 'Aussteller:', fontSize: 10, bold: true },
      ],
      margin: [0, 0, 0, 1] as [number, number, number, number],
    },
    {
      text: `${verein.name}, ${verein.strasse}, ${verein.plz} ${verein.ort}`,
      fontSize: 10,
      margin: [0, 0, 0, 6] as [number, number, number, number],
    },
  ];
}

/** Creates the signature block */
export function createSignatureBlock(verein: { name: string; unterschriftName?: string; unterschriftFunktion?: string }): Content[] {
  return [
    { text: verein.name, fontSize: 10, margin: [0, 8, 0, 0] as [number, number, number, number] },
    { text: ' ', fontSize: 16 },
    {
      canvas: [
        { type: 'line' as const, x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 0.5, lineColor: '#000000' },
      ],
      margin: [0, 0, 0, 2] as [number, number, number, number],
    },
    {
      columns: [
        {
          width: 'auto' as const,
          stack: [
            {
              text: `${verein.unterschriftName ?? ''}`,
              fontSize: 9,
              bold: true,
            },
            {
              text: verein.unterschriftFunktion ?? '',
              fontSize: 9,
            },
          ],
        },
        {
          width: '*' as const,
          text: '',
        },
        {
          width: 'auto' as const,
          stack: [
            {
              text: '·················',
              fontSize: 9,
              color: '#999999',
              alignment: 'center' as const,
            },
            {
              text: '(Stempel)',
              fontSize: 7,
              color: '#999999',
              alignment: 'center' as const,
            },
          ],
        },
      ],
      margin: [0, 0, 0, 2] as [number, number, number, number],
    },
    {
      text: '(Ort, Datum und Unterschrift des Zuwendungsempfängers)',
      fontSize: 8,
      color: '#666666',
      margin: [0, 0, 0, 6] as [number, number, number, number],
    },
  ];
}

/** Build spender address lines */
export function spenderAnschrift(spender: {
  istFirma?: boolean;
  firmenname?: string | null;
  anrede?: string | null;
  vorname?: string | null;
  nachname: string;
  strasse?: string;
  plz?: string;
  ort?: string;
}): string {
  if (spender.istFirma && spender.firmenname) {
    return `${spender.firmenname}\n${spender.strasse ?? ''}\n${spender.plz ?? ''} ${spender.ort ?? ''}`;
  }
  const anrede = spender.anrede ? `${spender.anrede} ` : '';
  return `${anrede}${spender.vorname ?? ''} ${spender.nachname}\n${spender.strasse ?? ''}\n${spender.plz ?? ''} ${spender.ort ?? ''}`;
}
