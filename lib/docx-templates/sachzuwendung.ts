import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  ImageRun,
  Footer,
} from 'docx';
import type { Verein, Spender, Zuwendung } from '@/lib/types';
import { betragInWorten } from './betrag-in-worten';
import { getLogoBytes } from './default-logo';
import {
  TITEL_SACHZUWENDUNG,
  freistellungTextA,
  freistellungTextB,
  VERWENDUNGSBESTAETIGUNG_PREFIX,
  VERWENDUNGSBESTAETIGUNG_SUFFIX,
  HAFTUNGSHINWEIS,
  GUELTIGKEITSHINWEIS,
  SACHSPENDE_BETRIEBSVERMOEGEN,
  SACHSPENDE_PRIVATVERMOEGEN,
  SACHSPENDE_KEINE_ANGABE,
  SACHSPENDE_UNTERLAGEN,
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

export async function generateSachzuwendung(
  verein: Verein,
  spender: Spender,
  zuwendung: Zuwendung,
  laufendeNr: string,
  doppel = false
): Promise<Blob> {
  const sections: Paragraph[] = [];
  const wert = zuwendung.sachWert ?? zuwendung.betrag;

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
      children: [
        ...ausstellerChildren,
        new TextRun({ text: verein.name, font: 'Arial', size: 20, bold: true }),
      ],
    })
  );
  sections.push(
    new Paragraph({
      children: [new TextRun({ text: `${verein.strasse}, ${verein.plz} ${verein.ort}`, font: 'Arial', size: 20 })],
    })
  );
  sections.push(new Paragraph({ children: [] }));

  // Titel
  for (const zeile of TITEL_SACHZUWENDUNG.split('\n')) {
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

  // Wert
  sections.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'Wert der Zuwendung  - in Ziffern -  ', font: 'Arial', size: 20 }),
        new TextRun({ text: `${formatBetrag(wert)} €`, font: 'Arial', size: 20, bold: true }),
        new TextRun({ text: '  - in Buchstaben -  ', font: 'Arial', size: 20 }),
        new TextRun({ text: betragInWorten(wert), font: 'Arial', size: 20, bold: true }),
      ],
    })
  );

  sections.push(
    new Paragraph({
      children: [new TextRun({ text: `Tag der Zuwendung: ${formatDatum(zuwendung.datum)}`, font: 'Arial', size: 20 })],
    })
  );
  sections.push(new Paragraph({ children: [] }));

  // Genaue Bezeichnung
  sections.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'Genaue Bezeichnung der Sachzuwendung mit Alter, Zustand, Kaufpreis usw.',
          font: 'Arial', size: 20, bold: true,
        }),
      ],
    })
  );

  const beschreibungTeile: string[] = [];
  if (zuwendung.sachBezeichnung) beschreibungTeile.push(zuwendung.sachBezeichnung);
  if (zuwendung.sachAlter) beschreibungTeile.push(`Alter: ${zuwendung.sachAlter}`);
  if (zuwendung.sachZustand) beschreibungTeile.push(`Zustand: ${zuwendung.sachZustand}`);
  if (zuwendung.sachKaufpreis) beschreibungTeile.push(`Kaufpreis: ${formatBetrag(zuwendung.sachKaufpreis)} €`);

  sections.push(
    new Paragraph({
      children: [new TextRun({ text: beschreibungTeile.join('; '), font: 'Arial', size: 20 })],
    })
  );
  sections.push(new Paragraph({ children: [] }));

  // Checkboxen Herkunft
  const herkunftItems: Array<{ text: string; checked: boolean }> = [
    { text: SACHSPENDE_BETRIEBSVERMOEGEN, checked: zuwendung.sachHerkunft === 'betriebsvermoegen' },
    { text: SACHSPENDE_PRIVATVERMOEGEN, checked: zuwendung.sachHerkunft === 'privatvermoegen' },
    { text: SACHSPENDE_KEINE_ANGABE, checked: zuwendung.sachHerkunft === 'keine_angabe' },
    { text: SACHSPENDE_UNTERLAGEN, checked: zuwendung.sachUnterlagenVorhanden },
  ];

  for (const item of herkunftItems) {
    sections.push(
      new Paragraph({
        children: [
          new TextRun({ text: item.checked ? '☑ ' : '☐ ', font: 'Arial', size: 18 }),
          new TextRun({ text: item.text, font: 'Arial', size: 18 }),
        ],
      })
    );
  }
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

  const doc = new Document({
    sections: [{
      properties: { page: { margin: { top: 1134, bottom: 1134, left: 1418, right: 1134 } } },
      children: sections,
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
    }],
  });

  return Packer.toBlob(doc);
}
