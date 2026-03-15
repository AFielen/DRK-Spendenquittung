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

/** Format ISO date to DD.MM.YYYY */
export function formatDatum(iso: string): string {
  const dateOnly = iso.substring(0, 10);
  const [y, m, d] = dateOnly.split('-');
  return `${d}.${m}.${y}`;
}

/** Format number as German currency string */
export function formatBetrag(n: number): string {
  return n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
