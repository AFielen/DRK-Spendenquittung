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

export async function generateGeldzuwendungPdf(
  verein: Verein,
  spender: Spender,
  zuwendung: Zuwendung,
  laufendeNr: string,
  doppel = false
): Promise<Buffer> {
  const content: Content[] = [];

  // Titel
  const titelZeilen = TITEL_GELDZUWENDUNG.split('\n');
  for (const zeile of titelZeilen) {
    content.push({ text: zeile, style: 'title' });
  }
  content.push({ text: ' ', fontSize: 4 });

  // Aussteller
  content.push(...createAusstellerBlock(verein));

  // Name und Anschrift (bordered box)
  const adressLines = spenderAnschrift(spender).split('\n').filter((l) => l.trim());
  content.push(createBorderedBox('Name und Anschrift des Zuwendenden:', adressLines));

  // Betrag + Buchstaben + Tag (bordered data row)
  content.push(
    createDataRow([
      { label: 'Betrag der Zuwendung – in Ziffern', value: `${formatBetrag(zuwendung.betrag)} €` },
      { label: 'in Buchstaben', value: betragInWorten(zuwendung.betrag) },
      { label: 'Tag der Zuwendung', value: formatDatum(zuwendung.datum) },
    ])
  );

  // Verzicht
  const ja = zuwendung.verzicht ? '[X]' : '[ ]';
  const nein = zuwendung.verzicht ? '[ ]' : '[X]';
  content.push({
    text: `Es handelt sich um den Verzicht auf Erstattung von Aufwendungen  Ja ${ja}  Nein ${nein}`,
    fontSize: 9,
    margin: [0, 0, 0, 6],
  } as Content);

  // Freistellungsstatus
  const zwecke = verein.beguenstigteZwecke.join(', ');
  const datum = formatDatum(verein.freistellungDatum);
  const freiText =
    verein.freistellungsart === 'freistellungsbescheid'
      ? freistellungTextA(verein.finanzamt, verein.steuernummer, datum, verein.letzterVZ || '', zwecke)
      : freistellungTextB(verein.finanzamt, verein.steuernummer, datum, zwecke);

  content.push(createCheckbox(true, freiText, 9));
  content.push({ text: ' ', fontSize: 4 });

  // Satzungsmäßige Voraussetzungen (unchecked)
  content.push(createCheckbox(false, 'Die Einhaltung der satzungsmäßigen Voraussetzungen nach den §§ 51, 59, 60 und 61 AO wurde vom Finanzamt…… St.Nr.…… mit Bescheid von…… nach § 60a AO gesondert festgestellt. Wir fördern nach unserer Satzung (Angabe des begünstigten Zwecks / der begünstigten Zwecke).', 8));
  content.push({ text: ' ', fontSize: 4 });

  // Verwendungsbestätigung (in bordered box with gray background)
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
    margin: [0, 0, 0, 4],
  } as Content);

  // Mitgliedsbeitrag-Hinweis
  content.push({
    text: 'Nur für steuerbegünstigte Einrichtungen, bei denen die Mitgliedsbeiträge steuerlich nicht abziehbar sind:',
    fontSize: 8,
    italics: true,
    margin: [0, 0, 0, 1],
  } as Content);
  content.push(createCheckbox(false, MITGLIEDSBEITRAG_HINWEIS, 8));

  // Unterschriftenbereich
  content.push(...createSignatureBlock(verein));

  // Haftungshinweis
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
