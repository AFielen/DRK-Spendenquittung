import type { Content } from 'pdfmake/interfaces';
import type { Verein, Spender, Zuwendung } from '@/lib/types';
import { spenderAnzeigename } from '@/lib/types';
import { betragInWorten } from '@/lib/docx-templates/betrag-in-worten';
import { createBriefbogenLayout } from './briefbogen';
import { generatePdfBuffer, formatDatum, formatBetrag, spenderAnschrift } from './pdf-helper';

export async function generateVereinfachterNachweisPdf(
  verein: Verein,
  spender: Spender,
  zuwendung: Zuwendung
): Promise<Buffer> {
  const content: Content[] = [];

  // Titel
  content.push({
    text: 'Vereinfachter Zuwendungsnachweis',
    style: 'title',
  });
  content.push({
    text: 'gemäß § 50 Abs. 4 EStDV (für Zuwendungen bis 300 €)',
    fontSize: 9,
    alignment: 'center',
  });
  content.push({ text: ' ', fontSize: 6 });

  // Freistellungsdaten
  const bescheidDatum = formatDatum(verein.freistellungDatum);
  content.push({ text: 'Freistellungsangaben:', fontSize: 10, bold: true });
  content.push({ text: `Finanzamt: ${verein.finanzamt}`, fontSize: 10 });
  content.push({ text: `Steuernummer: ${verein.steuernummer}`, fontSize: 10 });
  content.push({ text: `Datum des Bescheids: ${bescheidDatum}`, fontSize: 10 });

  if (verein.freistellungsart === 'freistellungsbescheid' && verein.letzterVZ) {
    content.push({ text: `Letzter Veranlagungszeitraum: ${verein.letzterVZ}`, fontSize: 10 });
  }
  content.push({ text: ' ', fontSize: 6 });

  // Steuerbegünstigter Zweck
  content.push({
    text: [
      { text: 'Steuerbegünstigter Zweck: ', fontSize: 10, bold: true },
      { text: verein.beguenstigteZwecke.join(', '), fontSize: 10 },
    ],
  });
  content.push({ text: ' ', fontSize: 6 });

  // Art der Zuwendung
  content.push({
    text: [
      { text: 'Art: ', fontSize: 10, bold: true },
      { text: zuwendung.verwendung === 'spende' ? 'Spende' : 'Mitgliedsbeitrag', fontSize: 10 },
    ],
  });
  content.push({ text: ' ', fontSize: 6 });

  // Spender
  content.push({
    text: [
      { text: 'Name des Spenders: ', fontSize: 10, bold: true },
      { text: spenderAnzeigename(spender), fontSize: 10 },
    ],
  });

  // Betrag und Datum
  content.push({
    text: [
      { text: 'Betrag: ', fontSize: 10, bold: true },
      { text: `${formatBetrag(zuwendung.betrag)} € (${betragInWorten(zuwendung.betrag)})`, fontSize: 10 },
    ],
  });
  content.push({
    text: [
      { text: 'Datum: ', fontSize: 10, bold: true },
      { text: formatDatum(zuwendung.datum), fontSize: 10 },
    ],
  });
  content.push({ text: ' ', fontSize: 10 });
  content.push({ text: ' ', fontSize: 10 });

  // Hinweis
  content.push({
    text: 'Dieser Beleg dient zusammen mit Ihrem Kontoauszug als vereinfachter Zuwendungsnachweis gemäß § 50 Abs. 4 EStDV.',
    fontSize: 9,
    italics: true,
  });

  const docDefinition = createBriefbogenLayout(content, {
    verein,
    empfaenger: spenderAnschrift(spender),
    datum: formatDatum(zuwendung.datum),
  });

  return generatePdfBuffer(docDefinition);
}
