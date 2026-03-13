import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  ImageRun,
  Footer,
  TabStopPosition,
  TabStopType,
} from 'docx';
import type { Verein, Spender, Zuwendung } from '@/lib/types';
import { betragInWorten } from './betrag-in-worten';
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
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

function formatBetrag(n: number): string {
  return n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function spenderAnschrift(spender: Spender): string {
  const anrede = spender.anrede ? `${spender.anrede} ` : '';
  return `${anrede}${spender.vorname} ${spender.nachname}\n${spender.strasse}\n${spender.plz} ${spender.ort}`;
}

function freistellungAbsatz(verein: Verein): Paragraph {
  const zwecke = verein.beguenstigteZwecke.join(', ');
  const datum = formatDatum(verein.freistellungDatum);

  const text =
    verein.freistellungsart === 'freistellungsbescheid'
      ? freistellungTextA(
          verein.finanzamt,
          verein.steuernummer,
          datum,
          verein.letzterVZ || '',
          zwecke
        )
      : freistellungTextB(verein.finanzamt, verein.steuernummer, datum, zwecke);

  return new Paragraph({
    children: [
      new TextRun({ text: '☑ ', font: 'Arial', size: 18 }),
      new TextRun({ text, font: 'Arial', size: 18 }),
    ],
  });
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
    sections.push(
      new Paragraph({
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
      })
    );
  }

  // Aussteller-Block
  const ausstellerChildren: (TextRun | ImageRun)[] = [];
  if (verein.logoBase64) {
    try {
      const base64Data = verein.logoBase64.split(',')[1];
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      ausstellerChildren.push(
        new ImageRun({
          data: bytes,
          transformation: { width: 57, height: 57 },
          type: 'png',
        })
      );
      ausstellerChildren.push(new TextRun({ text: '  ', font: 'Arial', size: 20 }));
    } catch {
      // Logo-Fehler ignorieren
    }
  }

  sections.push(
    new Paragraph({
      children: [
        ...ausstellerChildren,
        new TextRun({ text: verein.name, font: 'Arial', size: 20, bold: true }),
      ],
    })
  );
  sections.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `${verein.strasse}, ${verein.plz} ${verein.ort}`,
          font: 'Arial',
          size: 20,
        }),
      ],
    })
  );

  // Leerzeile
  sections.push(new Paragraph({ children: [] }));

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

  // Leerzeile
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

  // Leerzeile
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

  // Leerzeile
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

  // Leerzeile
  sections.push(new Paragraph({ children: [] }));

  // Freistellungsstatus
  sections.push(freistellungAbsatz(verein));

  // Leerzeile
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

  // Leerzeile
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

  // Leerzeilen
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

  // Leerzeile
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
            margin: { top: 1134, bottom: 1134, left: 1418, right: 1134 },
          },
        },
        children: sections,
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: `Lfd. Nr.: ${laufendeNr}`,
                    font: 'Arial',
                    size: 14,
                  }),
                ],
              }),
            ],
          }),
        },
      },
    ],
  });

  return Packer.toBlob(doc);
}
