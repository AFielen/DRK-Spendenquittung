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
import { generatePdfBuffer, formatDatum, formatBetrag, spenderAnschrift } from './pdf-helper';

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
  content.push({ text: ' ', fontSize: 6 });

  // Name und Anschrift
  content.push({ text: 'Name und Anschrift des Zuwendenden:', fontSize: 10, bold: true });
  for (const line of spenderAnschrift(spender).split('\n')) {
    content.push({ text: line, fontSize: 10 });
  }
  content.push({ text: ' ', fontSize: 6 });

  // Wert
  content.push({
    text: [
      { text: 'Wert der Zuwendung  - in Ziffern -  ', fontSize: 10 },
      { text: `${formatBetrag(wert)} €`, fontSize: 10, bold: true },
      { text: '  - in Buchstaben -  ', fontSize: 10 },
      { text: betragInWorten(wert), fontSize: 10, bold: true },
    ],
  });

  content.push({ text: `Tag der Zuwendung: ${formatDatum(zuwendung.datum)}`, fontSize: 10 });
  content.push({ text: ' ', fontSize: 6 });

  // Genaue Bezeichnung
  content.push({
    text: 'Genaue Bezeichnung der Sachzuwendung mit Alter, Zustand, Kaufpreis usw.',
    fontSize: 10,
    bold: true,
  });

  const beschreibungTeile: string[] = [];
  if (zuwendung.sachBezeichnung) beschreibungTeile.push(zuwendung.sachBezeichnung);
  if (zuwendung.sachAlter) beschreibungTeile.push(`Alter: ${zuwendung.sachAlter}`);
  if (zuwendung.sachZustand) beschreibungTeile.push(`Zustand: ${zuwendung.sachZustand}`);
  if (zuwendung.sachKaufpreis) beschreibungTeile.push(`Kaufpreis: ${formatBetrag(zuwendung.sachKaufpreis)} €`);

  content.push({ text: beschreibungTeile.join('; '), fontSize: 10 });
  content.push({ text: ' ', fontSize: 6 });

  // Checkboxen Herkunft
  const herkunftItems = [
    { text: SACHSPENDE_BETRIEBSVERMOEGEN, checked: zuwendung.sachHerkunft === 'betriebsvermoegen' },
    { text: SACHSPENDE_PRIVATVERMOEGEN, checked: zuwendung.sachHerkunft === 'privatvermoegen' },
    { text: SACHSPENDE_KEINE_ANGABE, checked: zuwendung.sachHerkunft === 'keine_angabe' },
    { text: SACHSPENDE_UNTERLAGEN, checked: zuwendung.sachUnterlagenVorhanden },
  ];

  for (const item of herkunftItems) {
    content.push({ text: `${item.checked ? '☑' : '☐'} ${item.text}`, fontSize: 9 });
  }
  content.push({ text: ' ', fontSize: 6 });

  // Freistellungsstatus
  const zwecke = verein.beguenstigteZwecke.join(', ');
  const bescheidDatum = formatDatum(verein.freistellungDatum);
  const freiText =
    verein.freistellungsart === 'freistellungsbescheid'
      ? freistellungTextA(verein.finanzamt, verein.steuernummer, bescheidDatum, verein.letzterVZ || '', zwecke)
      : freistellungTextB(verein.finanzamt, verein.steuernummer, bescheidDatum, zwecke);

  content.push({ text: `☑ ${freiText}`, fontSize: 9 });
  content.push({ text: ' ', fontSize: 6 });

  // Verwendungsbestätigung
  content.push({
    text: VERWENDUNGSBESTAETIGUNG_PREFIX + zwecke + VERWENDUNGSBESTAETIGUNG_SUFFIX,
    fontSize: 10,
    bold: true,
  });
  content.push({ text: ' ', fontSize: 10 });
  content.push({ text: ' ', fontSize: 10 });

  // Unterschrift
  content.push({ text: '________________________________', fontSize: 9 });
  content.push({ text: '(Ort, Datum und Unterschrift des Zuwendungsempfängers)', fontSize: 9 });
  content.push({
    text: `${verein.unterschriftName ?? ''}, ${verein.unterschriftFunktion ?? ''}`,
    fontSize: 9,
  });
  content.push({ text: ' ', fontSize: 6 });

  // Hinweis
  content.push({ text: 'Hinweis:', fontSize: 8, bold: true });
  content.push({ text: HAFTUNGSHINWEIS, fontSize: 8 });
  content.push({ text: ' ', fontSize: 4 });
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
