import type { Content } from 'pdfmake/interfaces';
import type { Verein, Spender, Zuwendung } from '@/lib/types';
import { spenderAnzeigename } from '@/lib/types';
import { betragInWorten } from '@/lib/docx-templates/betrag-in-worten';
import {
  TITEL_SAMMELBESTAETIGUNG,
  freistellungTextA,
  freistellungTextB,
  VERWENDUNGSBESTAETIGUNG_PREFIX,
  VERWENDUNGSBESTAETIGUNG_SUFFIX,
  MITGLIEDSBEITRAG_HINWEIS,
  SAMMEL_DOPPELBESTAETIGUNG,
  SAMMEL_VERZICHTHINWEIS,
  HAFTUNGSHINWEIS,
  GUELTIGKEITSHINWEIS,
} from '@/lib/docx-templates/shared';
import { createBriefbogenLayout } from './briefbogen';
import { generatePdfBuffer, formatDatum, formatBetrag, spenderAnschrift } from './pdf-helper';

export async function generateSammelbestaetigungPdf(
  verein: Verein,
  spender: Spender,
  zuwendungen: Zuwendung[],
  zeitraumVon: string,
  zeitraumBis: string,
  laufendeNr: string,
  doppel = false
): Promise<Buffer> {
  const gesamtbetrag = zuwendungen.reduce((s, z) => s + z.betrag, 0);
  const content: Content[] = [];

  // Titel
  for (const zeile of TITEL_SAMMELBESTAETIGUNG.split('\n')) {
    content.push({ text: zeile, style: 'title' });
  }
  content.push({ text: ' ', fontSize: 6 });

  // Name und Anschrift
  content.push({ text: 'Name und Anschrift des Zuwendenden:', fontSize: 10, bold: true });
  for (const line of spenderAnschrift(spender).split('\n')) {
    content.push({ text: line, fontSize: 10 });
  }
  content.push({ text: ' ', fontSize: 6 });

  // Gesamtbetrag
  content.push({
    text: [
      { text: 'Gesamtbetrag der Zuwendung  - in Ziffern -  ', fontSize: 10 },
      { text: `${formatBetrag(gesamtbetrag)} €`, fontSize: 10, bold: true },
      { text: '  - in Buchstaben -  ', fontSize: 10 },
      { text: betragInWorten(gesamtbetrag), fontSize: 10, bold: true },
    ],
  });

  // Zeitraum
  content.push({
    text: `Zeitraum der Sammelbestätigung: ${formatDatum(zeitraumVon)} bis ${formatDatum(zeitraumBis)}`,
    fontSize: 10,
  });
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
  content.push({ text: ' ', fontSize: 6 });

  // Mitgliedsbeitrag-Hinweis
  content.push({
    text: 'Nur für steuerbegünstigte Einrichtungen, bei denen die Mitgliedsbeiträge steuerlich nicht abziehbar sind:',
    fontSize: 8,
    italics: true,
  });
  content.push({ text: `☐ ${MITGLIEDSBEITRAG_HINWEIS}`, fontSize: 9 });
  content.push({ text: ' ', fontSize: 6 });

  // Sammelbestätigungs-Pflicht-Texte
  content.push({ text: SAMMEL_DOPPELBESTAETIGUNG, fontSize: 10 });
  content.push({ text: ' ', fontSize: 4 });
  content.push({ text: SAMMEL_VERZICHTHINWEIS, fontSize: 10 });
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

  // Page break — Anlage
  content.push({ text: '', pageBreak: 'after' });

  // Anlage Seite 2
  content.push({
    text: 'Anlage zur Sammelbestätigung',
    style: 'title',
    margin: [0, 0, 0, 10],
  });

  content.push({
    text: spenderAnzeigename(spender),
    fontSize: 10,
    margin: [0, 0, 0, 10],
  });

  // Tabelle
  const tableBody: Content[][] = [
    [
      { text: 'Datum der Zuwendung', bold: true, fontSize: 9 },
      { text: 'Art der Zuwendung', bold: true, fontSize: 9 },
      { text: 'Verzicht auf Erstattung', bold: true, fontSize: 9 },
      { text: 'Betrag', bold: true, fontSize: 9, alignment: 'right' as const },
    ],
  ];

  for (const z of zuwendungen) {
    tableBody.push([
      { text: formatDatum(z.datum), fontSize: 9 },
      { text: z.verwendung === 'spende' ? 'Geldzuwendung' : 'Mitgliedsbeitrag', fontSize: 9 },
      { text: z.verzicht ? 'ja' : 'nein', fontSize: 9 },
      { text: `${formatBetrag(z.betrag)} €`, fontSize: 9, alignment: 'right' as const },
    ]);
  }

  tableBody.push([
    { text: 'Gesamtsumme', bold: true, fontSize: 9 },
    { text: '', fontSize: 9 },
    { text: '', fontSize: 9 },
    { text: `${formatBetrag(gesamtbetrag)} €`, bold: true, fontSize: 9, alignment: 'right' as const },
  ]);

  content.push({
    table: {
      headerRows: 1,
      widths: ['*', '*', '*', 'auto'],
      body: tableBody,
    },
    layout: {
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
      hLineColor: () => '#CCCCCC',
      vLineColor: () => '#CCCCCC',
    },
  });

  const docDefinition = createBriefbogenLayout(content, {
    verein,
    laufendeNr,
    doppel,
    empfaenger: spenderAnschrift(spender),
    datum: formatDatum(zeitraumBis),
  });

  return generatePdfBuffer(docDefinition);
}
