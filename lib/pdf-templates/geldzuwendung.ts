import type { Content } from 'pdfmake/interfaces';
import type { Verein, Spender, Zuwendung } from '@/lib/types';
import { betragInWorten } from '@/lib/docx-templates/betrag-in-worten';
import {
  TITEL_GELDZUWENDUNG,
  freistellungTextA,
  freistellungTextB,
  VERWENDUNGSBESTAETIGUNG_PREFIX,
  VERWENDUNGSBESTAETIGUNG_SUFFIX,
  MITGLIEDSBEITRAG_HINWEIS,
  HAFTUNGSHINWEIS,
  GUELTIGKEITSHINWEIS,
} from '@/lib/docx-templates/shared';
import { createBriefbogenLayout } from './briefbogen';
import { generatePdfBuffer, formatDatum, formatBetrag, spenderAnschrift } from './pdf-helper';

export async function generateGeldzuwendungPdf(
  verein: Verein,
  spender: Spender,
  zuwendung: Zuwendung,
  laufendeNr: string,
  doppel = false
): Promise<Buffer> {
  const content: Content[] = [];

  // Aussteller
  content.push({ text: verein.name, fontSize: 10, bold: true });
  content.push({ text: `${verein.strasse}, ${verein.plz} ${verein.ort}`, fontSize: 10 });
  content.push({ text: ' ', fontSize: 6 });

  // Titel
  const titelZeilen = TITEL_GELDZUWENDUNG.split('\n');
  for (const zeile of titelZeilen) {
    content.push({ text: zeile, style: 'title' });
  }
  content.push({ text: ' ', fontSize: 6 });

  // Name und Anschrift
  content.push({ text: 'Name und Anschrift des Zuwendenden:', fontSize: 10, bold: true });
  for (const line of spenderAnschrift(spender).split('\n')) {
    content.push({ text: line, fontSize: 10 });
  }
  content.push({ text: ' ', fontSize: 6 });

  // Betrag
  content.push({
    text: [
      { text: 'Betrag der Zuwendung  - in Ziffern -  ', fontSize: 10 },
      { text: `${formatBetrag(zuwendung.betrag)} €`, fontSize: 10, bold: true },
      { text: '  - in Buchstaben -  ', fontSize: 10 },
      { text: betragInWorten(zuwendung.betrag), fontSize: 10, bold: true },
    ],
  });

  // Tag der Zuwendung
  content.push({ text: `Tag der Zuwendung: ${formatDatum(zuwendung.datum)}`, fontSize: 10 });
  content.push({ text: ' ', fontSize: 6 });

  // Verzicht
  const ja = zuwendung.verzicht ? '☑' : '☐';
  const nein = zuwendung.verzicht ? '☐' : '☑';
  content.push({
    text: `Es handelt sich um den Verzicht auf Erstattung von Aufwendungen  Ja ${ja} / Nein ${nein}`,
    fontSize: 10,
  });
  content.push({ text: ' ', fontSize: 6 });

  // Freistellungsstatus
  const zwecke = verein.beguenstigteZwecke.join(', ');
  const datum = formatDatum(verein.freistellungDatum);
  const freiText =
    verein.freistellungsart === 'freistellungsbescheid'
      ? freistellungTextA(verein.finanzamt, verein.steuernummer, datum, verein.letzterVZ || '', zwecke)
      : freistellungTextB(verein.finanzamt, verein.steuernummer, datum, zwecke);

  content.push({ text: `☑ ${freiText}`, fontSize: 9 });
  content.push({ text: ' ', fontSize: 6 });

  // Verwendungsbestätigung
  content.push({
    text: VERWENDUNGSBESTAETIGUNG_PREFIX + zwecke + VERWENDUNGSBESTAETIGUNG_SUFFIX,
    fontSize: 10,
    bold: true,
  });
  content.push({ text: ' ', fontSize: 6 });

  // Mitgliedsbeitrag-Hinweis
  content.push({
    text: 'Nur für steuerbegünstigte Einrichtungen, bei denen die Mitgliedsbeiträge steuerlich nicht abziehbar sind:',
    fontSize: 8,
    italics: true,
  });
  content.push({ text: `☐ ${MITGLIEDSBEITRAG_HINWEIS}`, fontSize: 9 });
  content.push({ text: ' ', fontSize: 10 });
  content.push({ text: ' ', fontSize: 10 });

  // Unterschriftenzeile
  content.push({ text: '________________________________', fontSize: 9 });
  content.push({
    text: '(Ort, Datum und Unterschrift des Zuwendungsempfängers)',
    fontSize: 9,
  });
  content.push({
    text: `${verein.unterschriftName ?? ''}, ${verein.unterschriftFunktion ?? ''}`,
    fontSize: 9,
  });
  content.push({ text: ' ', fontSize: 6 });

  // Haftungshinweis
  content.push({ text: 'Hinweis:', fontSize: 8, bold: true });
  content.push({ text: HAFTUNGSHINWEIS, fontSize: 8 });
  content.push({ text: ' ', fontSize: 4 });
  content.push({ text: GUELTIGKEITSHINWEIS, fontSize: 8 });

  const docDefinition = createBriefbogenLayout(content, {
    verein,
    laufendeNr,
    doppel,
  });

  return generatePdfBuffer(docDefinition);
}
