import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  TabStopPosition,
  TabStopType,
} from 'docx';
import type { Verein, Spender, Zuwendung } from '@/lib/types';
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

function formatDatum(iso: string): string {
  const dateOnly = iso.substring(0, 10);
  const [y, m, d] = dateOnly.split('-');
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

export async function generateGeldzuwendung(
  verein: Verein,
  spender: Spender,
  zuwendung: Zuwendung,
  laufendeNr: string,
  doppel = false
): Promise<Blob> {
  const sections: Paragraph[] = [];

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
  sections.push(new Paragraph({ children: [] }));

  // Name und Anschrift
  sections.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'Name und Anschrift des Zuwendenden:',
          font: 'Arial',
          size: 20,
          bold: true,
        }),
      ],
    })
  );
  for (const line of spenderAnschrift(spender).split('\n')) {
    sections.push(
      new Paragraph({
        children: [new TextRun({ text: line, font: 'Arial', size: 20 })],
      })
    );
  }
  sections.push(new Paragraph({ children: [] }));

  // Betrag
  sections.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'Betrag der Zuwendung  - in Ziffern -  ', font: 'Arial', size: 20 }),
        new TextRun({
          text: `${formatBetrag(zuwendung.betrag)} €`,
          font: 'Arial',
          size: 20,
          bold: true,
        }),
        new TextRun({ text: '  - in Buchstaben -  ', font: 'Arial', size: 20 }),
        new TextRun({
          text: betragInWorten(zuwendung.betrag),
          font: 'Arial',
          size: 20,
          bold: true,
        }),
      ],
    })
  );

  // Tag der Zuwendung
  sections.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Tag der Zuwendung: ${formatDatum(zuwendung.datum)}`,
          font: 'Arial',
          size: 20,
        }),
      ],
    })
  );
  sections.push(new Paragraph({ children: [] }));

  // Verzicht
  const ja = zuwendung.verzicht ? '☑' : '☐';
  const nein = zuwendung.verzicht ? '☐' : '☑';
  sections.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Es handelt sich um den Verzicht auf Erstattung von Aufwendungen  Ja ${ja} / Nein ${nein}`,
          font: 'Arial',
          size: 20,
        }),
      ],
    })
  );
  sections.push(new Paragraph({ children: [] }));

  // Freistellungsstatus
  const zwecke = verein.beguenstigteZwecke.join(', ');
  const datum = formatDatum(verein.freistellungDatum);
  const freiText =
    verein.freistellungsart === 'freistellungsbescheid'
      ? freistellungTextA(verein.finanzamt, verein.steuernummer, datum, verein.letzterVZ || '', zwecke)
      : freistellungTextB(verein.finanzamt, verein.steuernummer, datum, zwecke);

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
          text:
            VERWENDUNGSBESTAETIGUNG_PREFIX +
            verein.beguenstigteZwecke.join(', ') +
            VERWENDUNGSBESTAETIGUNG_SUFFIX,
          font: 'Arial',
          size: 20,
          bold: true,
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
          font: 'Arial',
          size: 16,
          italics: true,
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
  sections.push(new Paragraph({ children: [] }));

  // Unterschriftenzeile
  sections.push(
    new Paragraph({
      tabStops: [{ type: TabStopType.LEFT, position: TabStopPosition.MAX }],
      children: [
        new TextRun({ text: '________________________________', font: 'Arial', size: 18 }),
      ],
    })
  );
  sections.push(
    new Paragraph({
      children: [
        new TextRun({
          text: '(Ort, Datum und Unterschrift des Zuwendungsempfängers)',
          font: 'Arial',
          size: 18,
        }),
      ],
    })
  );
  sections.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `${verein.unterschriftName ?? ''}, ${verein.unterschriftFunktion ?? ''}`,
          font: 'Arial',
          size: 18,
        }),
      ],
    })
  );
  sections.push(new Paragraph({ children: [] }));

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
  sections.push(new Paragraph({ children: [] }));
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
