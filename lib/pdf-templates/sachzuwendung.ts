import type { Content } from 'pdfmake/interfaces';
import type { Verein, Spender, Zuwendung } from '@/lib/types';
import { betragInWorten } from '@/lib/docx-templates/betrag-in-worten';
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
} from '@/lib/docx-templates/shared';
import { createBriefbogenLayout } from './briefbogen';
import {
  generatePdfBuffer,
  formatDatum,
  formatBetrag,
  spenderAnschrift,
  createBorderedBox,
  createDataRow,
  createCheckbox,
  createAusstellerBlock,
  createSignatureBlock,
} from './pdf-helper';

export async function generateSachzuwendungPdf(
  verein: Verein,
  spender: Spender,
  zuwendung: Zuwendung,
  laufendeNr: string,
  doppel = false
): Promise<Buffer> {
  const content: Content[] = [];
  const wert = zuwendung.sachWert ?? zuwendung.betrag;

  // Titel
  for (const zeile of TITEL_SACHZUWENDUNG.split('\n')) {
    content.push({ text: zeile, style: 'title' });
  }
  content.push({ text: ' ', fontSize: 4 });

  // Aussteller
  content.push(...createAusstellerBlock(verein));

  // Name und Anschrift (bordered box)
  const adressLines = spenderAnschrift(spender).split('\n').filter((l) => l.trim());
  content.push(createBorderedBox('Name und Anschrift des Zuwendenden:', adressLines));

  // Wert + Buchstaben + Tag (bordered data row)
  content.push(
    createDataRow([
      { label: 'Wert der Zuwendung – in Ziffern', value: `${formatBetrag(wert)} €` },
      { label: 'in Buchstaben', value: betragInWorten(wert) },
      { label: 'Tag der Zuwendung', value: formatDatum(zuwendung.datum) },
    ])
  );

  // Genaue Bezeichnung (bordered box)
  const beschreibungTeile: string[] = [];
  if (zuwendung.sachBezeichnung) beschreibungTeile.push(zuwendung.sachBezeichnung);
  if (zuwendung.sachAlter) beschreibungTeile.push(`Alter: ${zuwendung.sachAlter}`);
  if (zuwendung.sachZustand) beschreibungTeile.push(`Zustand: ${zuwendung.sachZustand}`);
  if (zuwendung.sachKaufpreis) beschreibungTeile.push(`Kaufpreis: ${formatBetrag(zuwendung.sachKaufpreis)} €`);

  content.push(
    createBorderedBox(
      'Genaue Bezeichnung der Sachzuwendung mit Alter, Zustand, Kaufpreis usw.',
      [beschreibungTeile.join('; ') || '–']
    )
  );

  // Checkboxen Herkunft
  const herkunftItems = [
    { text: SACHSPENDE_BETRIEBSVERMOEGEN, checked: zuwendung.sachHerkunft === 'betriebsvermoegen' },
    { text: SACHSPENDE_PRIVATVERMOEGEN, checked: zuwendung.sachHerkunft === 'privatvermoegen' },
    { text: SACHSPENDE_KEINE_ANGABE, checked: zuwendung.sachHerkunft === 'keine_angabe' },
    { text: SACHSPENDE_UNTERLAGEN, checked: zuwendung.sachUnterlagenVorhanden },
  ];

  for (const item of herkunftItems) {
    content.push(createCheckbox(item.checked, item.text, 9));
  }
  content.push({ text: ' ', fontSize: 4 });

  // Freistellungsstatus
  const zwecke = verein.beguenstigteZwecke.join(', ');
  const bescheidDatum = formatDatum(verein.freistellungDatum);
  const freiText =
    verein.freistellungsart === 'freistellungsbescheid'
      ? freistellungTextA(verein.finanzamt, verein.steuernummer, bescheidDatum, verein.letzterVZ || '', zwecke)
      : freistellungTextB(verein.finanzamt, verein.steuernummer, bescheidDatum, zwecke);

  content.push(createCheckbox(true, freiText, 9));
  content.push({ text: ' ', fontSize: 4 });

  // Verwendungsbestätigung (bordered box with gray background)
  content.push({
    table: {
      widths: ['*'],
      body: [
        [
          {
            text: VERWENDUNGSBESTAETIGUNG_PREFIX + zwecke + VERWENDUNGSBESTAETIGUNG_SUFFIX,
            fontSize: 9,
            bold: true,
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
      fillColor: () => '#f5f5f5',
    },
    margin: [0, 0, 0, 6],
  } as Content);

  // Unterschriftenbereich
  content.push(...createSignatureBlock(verein));

  // Hinweis
  content.push({ text: 'Hinweis:', fontSize: 8, bold: true });
  content.push({ text: HAFTUNGSHINWEIS, fontSize: 8 });
  content.push({ text: ' ', fontSize: 3 });
  content.push({ text: GUELTIGKEITSHINWEIS, fontSize: 8 });

  const docDefinition = createBriefbogenLayout(content, {
    verein,
    laufendeNr,
    doppel,
    empfaenger: spenderAnschrift(spender),
    datum: formatDatum(zuwendung.datum),
  });

  return generatePdfBuffer(docDefinition);
}
