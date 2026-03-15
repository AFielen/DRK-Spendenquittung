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
}

/**
 * Loads logo bytes for server-side PDF generation.
 * Uses verein.logoBase64 if available, otherwise reads public/logo.png.
 */
export function getLogoBytesServer(logoBase64?: string | null): string | null {
  if (logoBase64) {
    // Already a data URI or raw base64
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
 * Layout:
 * - Logo top-right (absolute)
 * - Fold marks at 10.5cm and 14.8cm
 * - Right sidebar with org details
 * - Footer with page numbers and laufende Nr.
 * - Optional DOPPEL header
 */
export function createBriefbogenLayout(
  content: Content[],
  options: BriefbogenOptions
): TDocumentDefinitions {
  const { verein, laufendeNr, doppel } = options;
  const logoDataUri = getLogoBytesServer(verein.logoBase64);

  // Build full content array
  const fullContent: Content[] = [];

  // DOPPEL header
  if (doppel) {
    fullContent.push({
      text: '— DOPPEL — Kopie für die Vereinsakte (Aufbewahrungspflicht: 10 Jahre gemäß § 50 Abs. 7 EStDV)',
      alignment: 'center',
      fontSize: 9,
      bold: true,
      color: '#999999',
      margin: [0, 0, 0, 10],
    });
  }

  fullContent.push(...content);

  // Background: fold marks + logo
  const background: DynamicBackground = (currentPage: number): Content => {
    const elements: ContentCanvas['canvas'] = [
      // Fold mark at 10.5cm
      { type: 'line', x1: 0, y1: cm(10.5), x2: cm(0.6), y2: cm(10.5), lineWidth: 0.5, lineColor: '#BABABA' },
      // Fold mark at 14.85cm (letter fold)
      { type: 'line', x1: 0, y1: cm(14.85), x2: cm(0.6), y2: cm(14.85), lineWidth: 0.5, lineColor: '#BABABA' },
      // Center mark at 14.85cm
      { type: 'line', x1: 0, y1: cm(14.85), x2: cm(0.6), y2: cm(14.85), lineWidth: 0.5, lineColor: '#BABABA' },
    ];

    const result: Content[] = [{ canvas: elements }];

    // Logo on first page
    if (currentPage === 1 && logoDataUri) {
      result.push({
        image: logoDataUri,
        width: cm(2),
        absolutePosition: { x: cm(16.5), y: cm(1.2) },
      });
    }

    // Right sidebar on first page
    if (currentPage === 1) {
      const sidebarLines: string[] = [
        verein.name,
        '',
        verein.strasse,
        `${verein.plz} ${verein.ort}`,
      ];

      if (verein.vereinsregister) {
        sidebarLines.push('', `VR: ${verein.vereinsregister}`);
      }
      sidebarLines.push('', `FA: ${verein.finanzamt}`, `StNr: ${verein.steuernummer}`);

      result.push({
        stack: sidebarLines.map((line) =>
          line === ''
            ? { text: ' ', fontSize: 4 }
            : { text: line, fontSize: 7.5, color: '#555555' }
        ),
        absolutePosition: { x: cm(15.2), y: cm(4) },
        width: cm(4.5),
      } as Content);
    }

    return result;
  };

  const docDefinition: TDocumentDefinitions = {
    pageSize: 'A4',
    pageMargins: [cm(2.5), cm(3), cm(5), cm(2)],

    background,

    content: fullContent,

    footer: (currentPage: number, pageCount: number): Content => {
      const footerContent: Content[] = [];

      if (laufendeNr) {
        footerContent.push({
          text: `Lfd. Nr.: ${laufendeNr}`,
          alignment: 'right',
          fontSize: 7,
          margin: [cm(2.5), 0, cm(2.5), 0],
        });
      }

      footerContent.push({
        text: `Seite ${currentPage} / ${pageCount}`,
        alignment: 'center',
        fontSize: 7,
        color: '#999999',
      });

      return { stack: footerContent };
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
