import type { TDocumentDefinitions, Content, DynamicBackground, ContentCanvas } from 'pdfmake/interfaces';
import type { Verein } from '@/lib/types';
import fs from 'fs';
import path from 'path';

/** Convert centimeters to PDF points (1cm = 28.35pt) */
export function cm(val: number): number {
  return Math.round(val * 28.35);
}

export interface BriefbogenOptions {
  verein: Verein;
  laufendeNr?: string;
  doppel?: boolean;
  empfaenger?: string;
  datum?: string;
}

/**
 * Loads logo bytes for server-side PDF generation.
 * Uses verein.logoBase64 if available, otherwise reads public/logo.png.
 */
export function getLogoBytesServer(logoBase64?: string | null): string | null {
  if (logoBase64) {
    if (logoBase64.startsWith('data:')) return logoBase64;
    return `data:image/png;base64,${logoBase64}`;
  }

  try {
    const logoPath = path.join(process.cwd(), 'public', 'logo.png');
    const buf = fs.readFileSync(logoPath);
    return `data:image/png;base64,${buf.toString('base64')}`;
  } catch {
    return null;
  }
}

/**
 * Wraps content in DRK Briefbogen layout (A4 letterhead).
 *
 * Clean professional report layout:
 * - Header: Logo left + org name/address right
 * - Red accent line (#e30613) below header
 * - Sender line, recipient address, date
 * - Fold marks at 10.5cm and 14.85cm (DIN 5008)
 * - Footer: red line + org details + page number
 * - Optional DOPPEL header for copies
 */
export function createBriefbogenLayout(
  content: Content[],
  options: BriefbogenOptions
): TDocumentDefinitions {
  const { verein, laufendeNr, doppel, empfaenger, datum } = options;
  const logoDataUri = getLogoBytesServer(verein.logoBase64);

  const fullContent: Content[] = [];

  // DOPPEL header for copies
  if (doppel) {
    fullContent.push({
      text: '— DOPPEL — Kopie für die Vereinsakte (Aufbewahrungspflicht: 10 Jahre gemäß § 50 Abs. 7 EStDV)',
      alignment: 'center',
      fontSize: 9,
      bold: true,
      color: '#999999',
      margin: [0, 0, 0, 6],
    });
  }

  // ── Header: Logo left + Org name right ──
  const headerLeft: Content[] = [];
  if (logoDataUri) {
    headerLeft.push({
      image: logoDataUri,
      fit: [cm(1.5), cm(1.5)],
    });
  }

  fullContent.push({
    columns: [
      ...(headerLeft.length > 0 ? [{
        width: 'auto' as const,
        stack: headerLeft,
        margin: [0, 0, 10, 0] as [number, number, number, number],
      }] : []),
      {
        width: '*' as const,
        stack: [
          { text: verein.name, fontSize: 12, bold: true, color: '#000000' },
          { text: verein.strasse, fontSize: 9, color: '#444444', margin: [0, 2, 0, 0] as [number, number, number, number] },
          { text: `${verein.plz} ${verein.ort}`, fontSize: 9, color: '#444444' },
        ],
        margin: [0, 3, 0, 0] as [number, number, number, number],
      },
    ],
    margin: [0, 0, 0, cm(0.4)],
  } as Content);

  // ── Red accent line (2pt) ──
  fullContent.push({
    canvas: [
      {
        type: 'line',
        x1: 0,
        y1: 0,
        x2: cm(16),
        y2: 0,
        lineWidth: 2,
        lineColor: '#e30613',
      },
    ],
    margin: [0, 0, 0, cm(0.6)],
  } as Content);

  // ── Sender line (Absenderzeile) ──
  const senderLine = `${verein.name} \u00B7 ${verein.strasse} \u00B7 ${verein.plz} ${verein.ort}`;
  fullContent.push({
    stack: [
      {
        text: senderLine,
        fontSize: 7,
        color: '#666666',
      },
      {
        canvas: [
          { type: 'line', x1: 0, y1: 0, x2: cm(8.5), y2: 0, lineWidth: 0.5, lineColor: '#BABABA' },
        ],
        margin: [0, 2, 0, 0],
      },
    ],
    margin: [0, 0, 0, cm(0.3)],
  } as Content);

  // ── Recipient address ──
  if (empfaenger) {
    const empfaengerLines = empfaenger.split('\n').filter((l) => l.trim());
    fullContent.push({
      stack: empfaengerLines.map((line) => ({
        text: line,
        fontSize: 10,
      })),
      margin: [0, 0, 0, cm(1.2)],
    } as Content);
  } else {
    fullContent.push({ text: ' ', fontSize: 10, margin: [0, 0, 0, cm(1.2)] } as Content);
  }

  // ── Date line (right-aligned) ──
  if (datum) {
    fullContent.push({
      text: `${verein.ort}, den ${datum}`,
      fontSize: 10,
      alignment: 'right',
      margin: [0, 0, 0, cm(0.8)],
    });
  }

  // ── Template content ──
  fullContent.push(...content);

  // ── Background: fold marks only ──
  const background: DynamicBackground = (): Content => {
    const elements: ContentCanvas['canvas'] = [
      { type: 'line', x1: 0, y1: cm(10.5), x2: cm(0.6), y2: cm(10.5), lineWidth: 0.5, lineColor: '#BABABA' },
      { type: 'line', x1: 0, y1: cm(14.85), x2: cm(0.6), y2: cm(14.85), lineWidth: 0.5, lineColor: '#BABABA' },
    ];
    return { canvas: elements };
  };

  const docDefinition: TDocumentDefinitions = {
    pageSize: 'A4',
    pageMargins: [cm(2.5), cm(1.5), cm(2.5), cm(2.5)],

    background,

    content: fullContent,

    // ── Footer: red line + org details + page number ──
    footer: (currentPage: number, pageCount: number): Content => {
      const orgParts: string[] = [verein.name];
      if (verein.vereinsregister) {
        orgParts.push(`VR ${verein.vereinsregister}`);
      }
      orgParts.push(`StNr ${verein.steuernummer}`);

      const rightParts: Content[] = [];
      if (laufendeNr) {
        rightParts.push({ text: `Lfd. Nr.: ${laufendeNr}  \u00B7  `, fontSize: 7, color: '#666666' });
      }
      rightParts.push({ text: `Seite ${currentPage}/${pageCount}`, fontSize: 7, color: '#999999' });

      return {
        stack: [
          {
            canvas: [
              {
                type: 'line',
                x1: 0,
                y1: 0,
                x2: cm(16),
                y2: 0,
                lineWidth: 0.5,
                lineColor: '#e30613',
              },
            ],
            margin: [cm(2.5), 0, cm(2.5), 4],
          },
          {
            columns: [
              {
                text: orgParts.join(' \u00B7 '),
                fontSize: 7,
                color: '#666666',
                width: '*',
              },
              {
                text: rightParts,
                width: 'auto',
                alignment: 'right' as const,
              },
            ],
            margin: [cm(2.5), 0, cm(2.5), 0],
          },
        ],
      };
    },

    defaultStyle: {
      font: 'Helvetica',
      fontSize: 10,
    },

    styles: {
      title: { fontSize: 11, bold: true, alignment: 'center' },
      sectionTitle: { fontSize: 10, bold: true, margin: [0, 5, 0, 3] },
      hint: { fontSize: 8, color: '#666666' },
      hinweis: { fontSize: 8 },
    },
  };

  return docDefinition;
}
