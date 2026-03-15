import {
  Paragraph,
  TextRun,
  ImageRun,
  AlignmentType,
  Footer,
  BorderStyle,
} from 'docx';
import type { Verein } from '@/lib/types';
import { getLogoBytes } from './default-logo';

/**
 * Creates the DRK letterhead header paragraphs for DOCX documents.
 *
 * Layout matches the PDF briefbogen:
 * - Logo + org name on same line
 * - Org address below
 * - Red accent line (bottom border)
 * - Sender line (small)
 * - Recipient address
 * - Date (right-aligned)
 */
export async function createDocxHeader(
  verein: Verein,
  empfaenger?: string,
  datum?: string
): Promise<Paragraph[]> {
  const paragraphs: Paragraph[] = [];
  const logoBytes = await getLogoBytes(verein.logoBase64);

  // Logo + Org name
  const headerChildren: (TextRun | ImageRun)[] = [];
  if (logoBytes) {
    headerChildren.push(
      new ImageRun({ data: logoBytes, transformation: { width: 42, height: 42 }, type: 'png' })
    );
    headerChildren.push(new TextRun({ text: '  ', font: 'Arial', size: 20 }));
  }
  headerChildren.push(new TextRun({ text: verein.name, font: 'Arial', size: 24, bold: true }));

  paragraphs.push(new Paragraph({ children: headerChildren }));

  // Address
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `${verein.strasse}, ${verein.plz} ${verein.ort}`,
          font: 'Arial',
          size: 18,
          color: '444444',
        }),
      ],
    })
  );

  // Red accent line (paragraph with thick red bottom border)
  paragraphs.push(
    new Paragraph({
      children: [new TextRun({ text: '', font: 'Arial', size: 4 })],
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 6, color: 'e30613' },
      },
      spacing: { after: 120 },
    })
  );

  // Sender line (small)
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `${verein.name} \u00B7 ${verein.strasse} \u00B7 ${verein.plz} ${verein.ort}`,
          font: 'Arial',
          size: 14,
          color: '666666',
        }),
      ],
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 1, color: 'BABABA' },
      },
      spacing: { after: 60 },
    })
  );

  // Recipient address
  if (empfaenger) {
    for (const line of empfaenger.split('\n').filter((l) => l.trim())) {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: line, font: 'Arial', size: 20 })],
        })
      );
    }
  }

  paragraphs.push(new Paragraph({ children: [] }));

  // Date (right-aligned)
  if (datum) {
    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          new TextRun({
            text: `${verein.ort}, den ${datum}`,
            font: 'Arial',
            size: 20,
          }),
        ],
        spacing: { after: 200 },
      })
    );
  }

  return paragraphs;
}

/**
 * Creates the DRK footer for DOCX documents.
 *
 * Layout: Red line + org details (Name · VR · StNr) + Lfd. Nr.
 */
export function createDocxFooter(verein: Verein, laufendeNr?: string): Footer {
  const orgParts: string[] = [verein.name];
  if (verein.vereinsregister) {
    orgParts.push(`VR ${verein.vereinsregister}`);
  }
  orgParts.push(`StNr ${verein.steuernummer}`);

  const footerText = laufendeNr
    ? `${orgParts.join(' \u00B7 ')}     Lfd. Nr.: ${laufendeNr}`
    : orgParts.join(' \u00B7 ');

  return new Footer({
    children: [
      new Paragraph({
        children: [new TextRun({ text: '', font: 'Arial', size: 4 })],
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 2, color: 'e30613' },
        },
        spacing: { after: 60 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: footerText,
            font: 'Arial',
            size: 14,
            color: '666666',
          }),
        ],
      }),
    ],
  });
}

/**
 * Creates the DOPPEL (copy) header paragraph.
 */
export function createDoppelParagraph(): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: '— DOPPEL — Kopie für die Vereinsakte (Aufbewahrungspflicht: 10 Jahre gemäß § 50 Abs. 7 EStDV)',
        font: 'Arial',
        size: 18,
        color: '999999',
        bold: true,
      }),
    ],
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
  });
}
