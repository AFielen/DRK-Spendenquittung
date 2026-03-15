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
 * Layout matches the official DRK letterhead template:
 * - Logo + "Deutsches Rotes Kreuz" top-right
 * - Sender line (small, underlined) above recipient
 * - Recipient address in envelope window area
 * - Right sidebar with structured org details
 * - Fold marks at 10.5cm and 14.85cm
 * - Date line below recipient
 * - Footer with page numbers and laufende Nr.
 * - Optional DOPPEL header
 */
export function createBriefbogenLayout(
  content: Content[],
  options: BriefbogenOptions
): TDocumentDefinitions {
  const { verein, laufendeNr, doppel, empfaenger, datum } = options;
  const logoDataUri = getLogoBytesServer(verein.logoBase64);

  // Build full content array with letterhead elements
  const fullContent: Content[] = [];

  // DOPPEL header
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

  // 1. Logo + "Deutsches Rotes Kreuz" — right-aligned
  const logoColumn: Content[] = [];
  if (logoDataUri) {
    logoColumn.push({
      image: logoDataUri,
      width: cm(1.8),
      margin: [0, 0, 8, 0],
    });
  }
  logoColumn.push({
    stack: [
      { text: 'Deutsches', fontSize: 16, bold: true, color: '#000000' },
      { text: 'Rotes', fontSize: 16, bold: true, color: '#000000' },
      { text: 'Kreuz', fontSize: 16, bold: true, color: '#000000' },
    ],
  });

  fullContent.push({
    columns: [
      { width: '*', text: '' },
      {
        width: 'auto',
        columns: logoColumn,
      },
    ],
    margin: [0, 0, 0, cm(1.2)],
  } as Content);

  // 2. Sender line (Absenderzeile) — small, with bottom border
  const senderLine = `${verein.name} \u00B7 ${verein.strasse} \u00B7 ${verein.plz}  ${verein.ort}`;
  fullContent.push({
    stack: [
      {
        text: senderLine,
        fontSize: 7,
        color: '#555555',
        bold: true,
      },
      {
        canvas: [
          { type: 'line', x1: 0, y1: 0, x2: cm(10), y2: 0, lineWidth: 0.5, lineColor: '#999999' },
        ],
        margin: [0, 2, 0, 0],
      },
    ],
    margin: [0, 0, 0, cm(0.5)],
  } as Content);

  // 3. Recipient address (Empfänger)
  if (empfaenger) {
    const empfaengerLines = empfaenger.split('\n').filter((l) => l.trim());
    fullContent.push({
      stack: empfaengerLines.map((line) => ({
        text: line,
        fontSize: 10,
      })),
      margin: [0, 0, 0, cm(1.5)],
    } as Content);
  } else {
    fullContent.push({ text: ' ', fontSize: 10, margin: [0, 0, 0, cm(1.5)] } as Content);
  }

  // 4. Date line
  if (datum) {
    fullContent.push({
      text: `${verein.ort}, den ${datum}`,
      fontSize: 10,
      margin: [0, 0, 0, cm(1)],
    });
  }

  // Append template content
  fullContent.push(...content);

  // Background: fold marks + right sidebar (absolute positioned)
  const background: DynamicBackground = (currentPage: number): Content => {
    const elements: ContentCanvas['canvas'] = [
      // Fold mark at 10.5cm
      { type: 'line', x1: 0, y1: cm(10.5), x2: cm(0.6), y2: cm(10.5), lineWidth: 0.5, lineColor: '#BABABA' },
      // Fold mark at 14.85cm
      { type: 'line', x1: 0, y1: cm(14.85), x2: cm(0.6), y2: cm(14.85), lineWidth: 0.5, lineColor: '#BABABA' },
    ];

    const result: Content[] = [{ canvas: elements }];

    // Right sidebar on first page only
    if (currentPage === 1) {
      const sidebarItems: Content[] = [];

      // Org name — bold, slightly larger
      const nameParts = splitOrgName(verein.name);
      for (const part of nameParts) {
        sidebarItems.push({ text: part, fontSize: 9, bold: true, color: '#000000' });
      }

      sidebarItems.push({ text: ' ', fontSize: 6 });

      // Address
      sidebarItems.push({ text: verein.strasse, fontSize: 7.5, color: '#333333' });
      sidebarItems.push({ text: `${verein.plz} ${verein.ort}`, fontSize: 7.5, color: '#333333' });

      sidebarItems.push({ text: ' ', fontSize: 6 });

      // Vorsitzender / Unterschrift
      if (verein.unterschriftFunktion) {
        sidebarItems.push({ text: verein.unterschriftFunktion, fontSize: 7.5, bold: true, color: '#333333' });
      }
      if (verein.unterschriftName) {
        sidebarItems.push({ text: verein.unterschriftName, fontSize: 7.5, color: '#333333' });
      }

      // Vereinsregister
      if (verein.vereinsregister) {
        sidebarItems.push({ text: ' ', fontSize: 6 });
        // Try to extract Amtsgericht from vereinsregister or use finanzamt location
        const vrText = verein.vereinsregister;
        sidebarItems.push({ text: 'Amtsgericht', fontSize: 7.5, bold: true, color: '#333333' });
        sidebarItems.push({ text: `Vereinsregister-Nr. ${vrText}`, fontSize: 7.5, color: '#333333' });
      }

      // Steuernummer
      sidebarItems.push({ text: ' ', fontSize: 6 });
      sidebarItems.push({ text: 'Steuernummer', fontSize: 7.5, bold: true, color: '#333333' });
      sidebarItems.push({ text: verein.steuernummer, fontSize: 7.5, color: '#333333' });

      result.push({
        stack: sidebarItems,
        absolutePosition: { x: cm(15), y: cm(4) },
        width: cm(5),
      } as Content);
    }

    return result;
  };

  const docDefinition: TDocumentDefinitions = {
    pageSize: 'A4',
    pageMargins: [cm(2.5), cm(1.5), cm(5.5), cm(2)],

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
        text: `Seite ${currentPage}/${pageCount}`,
        alignment: 'right',
        fontSize: 7,
        color: '#999999',
        margin: [0, 0, cm(2.5), 0],
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

/**
 * Split organization name into two lines for the sidebar.
 * Tries to break at common patterns like "e.V.", "e. V." etc.
 */
function splitOrgName(name: string): string[] {
  // Try splitting at "e.V." or "e. V."
  const evMatch = name.match(/^(.+?)\s+(e\.\s*V\..*)$/);
  if (evMatch) {
    return [evMatch[1], evMatch[2]];
  }
  // If name is long, try splitting at a space near the middle
  if (name.length > 25) {
    const mid = Math.floor(name.length / 2);
    const spaceIdx = name.indexOf(' ', mid);
    if (spaceIdx > 0) {
      return [name.substring(0, spaceIdx), name.substring(spaceIdx + 1)];
    }
  }
  return [name];
}
