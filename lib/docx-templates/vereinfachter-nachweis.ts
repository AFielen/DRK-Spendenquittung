import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
} from 'docx';
import type { Verein, Spender, Zuwendung } from '@/lib/types';
import { spenderAnzeigename } from '@/lib/types';
import { formatDatum, formatBetrag } from '@/lib/format';
import { betragInWorten } from './betrag-in-worten';
import { createDocxHeader, createDocxFooter } from './briefbogen';

function spenderAnschrift(spender: Spender): string {
  if (spender.istFirma && spender.firmenname) {
    return `${spender.firmenname}\n${spender.strasse}\n${spender.plz} ${spender.ort}`;
  }
  const anrede = spender.anrede ? `${spender.anrede} ` : '';
  return `${anrede}${spender.vorname ?? ''} ${spender.nachname}\n${spender.strasse}\n${spender.plz} ${spender.ort}`;
}

export async function generateVereinfachterNachweis(
  verein: Verein,
  spender: Spender,
  zuwendung: Zuwendung
): Promise<Blob> {
  const sections: Paragraph[] = [];

  // Briefbogen-Header
  const header = await createDocxHeader(
    verein,
    spenderAnschrift(spender),
    formatDatum(zuwendung.datum)
  );
  sections.push(...header);

  // Titel
  sections.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'Vereinfachter Zuwendungsnachweis',
          font: 'Arial', size: 22, bold: true,
        }),
      ],
    })
  );
  sections.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'gemäß § 50 Abs. 4 EStDV (für Zuwendungen bis 300 €)',
          font: 'Arial', size: 18,
        }),
      ],
    })
  );
  sections.push(new Paragraph({ children: [] }));

  // Freistellungsdaten
  const bescheidDatum = formatDatum(verein.freistellungDatum);
  sections.push(
    new Paragraph({
      children: [new TextRun({ text: 'Freistellungsangaben:', font: 'Arial', size: 20, bold: true })],
    })
  );
  sections.push(
    new Paragraph({
      children: [new TextRun({ text: `Finanzamt: ${verein.finanzamt}`, font: 'Arial', size: 20 })],
    })
  );
  sections.push(
    new Paragraph({
      children: [new TextRun({ text: `Steuernummer: ${verein.steuernummer}`, font: 'Arial', size: 20 })],
    })
  );
  sections.push(
    new Paragraph({
      children: [new TextRun({ text: `Datum des Bescheids: ${bescheidDatum}`, font: 'Arial', size: 20 })],
    })
  );
  if (verein.freistellungsart === 'freistellungsbescheid' && verein.letzterVZ) {
    sections.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Letzter Veranlagungszeitraum: ${verein.letzterVZ}`,
            font: 'Arial', size: 20,
          }),
        ],
      })
    );
  }
  sections.push(new Paragraph({ children: [] }));

  // Steuerbegünstigter Zweck
  sections.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'Steuerbegünstigter Zweck: ', font: 'Arial', size: 20, bold: true }),
        new TextRun({ text: verein.beguenstigteZwecke.join(', '), font: 'Arial', size: 20 }),
      ],
    })
  );
  sections.push(new Paragraph({ children: [] }));

  // Art der Zuwendung
  sections.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'Art: ', font: 'Arial', size: 20, bold: true }),
        new TextRun({
          text: zuwendung.verwendung === 'spende' ? 'Spende' : 'Mitgliedsbeitrag',
          font: 'Arial', size: 20,
        }),
      ],
    })
  );
  sections.push(new Paragraph({ children: [] }));

  // Spender
  sections.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'Name des Spenders: ', font: 'Arial', size: 20, bold: true }),
        new TextRun({
          text: spenderAnzeigename(spender),
          font: 'Arial', size: 20,
        }),
      ],
    })
  );

  // Betrag und Datum
  sections.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'Betrag: ', font: 'Arial', size: 20, bold: true }),
        new TextRun({ text: `${formatBetrag(zuwendung.betrag)} € (${betragInWorten(zuwendung.betrag)})`, font: 'Arial', size: 20 }),
      ],
    })
  );
  sections.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'Datum: ', font: 'Arial', size: 20, bold: true }),
        new TextRun({ text: formatDatum(zuwendung.datum), font: 'Arial', size: 20 }),
      ],
    })
  );
  sections.push(new Paragraph({ children: [] }));
  sections.push(new Paragraph({ children: [] }));

  // Hinweis
  sections.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'Dieser Beleg dient zusammen mit Ihrem Kontoauszug als vereinfachter Zuwendungsnachweis gemäß § 50 Abs. 4 EStDV.',
          font: 'Arial', size: 18, italics: true,
        }),
      ],
    })
  );

  const doc = new Document({
    sections: [{
      properties: { page: { margin: { top: 850, bottom: 1134, left: 1418, right: 1418 } } },
      children: sections,
      footers: {
        default: createDocxFooter(verein),
      },
    }],
  });

  return Packer.toBlob(doc);
}
