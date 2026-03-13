// BMF-Pflicht-Textbausteine — EXAKTER WORTLAUT (BMF Nr. 2)!

export const TITEL_GELDZUWENDUNG =
  'Bestätigung über Geldzuwendungen/Mitgliedsbeitrag\nim Sinne des § 10b des Einkommensteuergesetzes an eine der in § 5 Abs. 1 Nr. 9 des Körperschaftsteuergesetzes bezeichneten Körperschaften, Personenvereinigungen oder Vermögensmassen';

export const TITEL_SACHZUWENDUNG =
  'Bestätigung über Sachzuwendungen\nim Sinne des § 10b des Einkommensteuergesetzes an eine der in § 5 Abs. 1 Nr. 9 des Körperschaftsteuergesetzes bezeichneten Körperschaften, Personenvereinigungen oder Vermögensmassen';

export const TITEL_SAMMELBESTAETIGUNG =
  'Sammelbestätigung über Geldzuwendungen/Mitgliedsbeiträge\nim Sinne des § 10b des Einkommensteuergesetzes an eine der in § 5 Abs. 1 Nr. 9 des Körperschaftsteuergesetzes bezeichneten Körperschaften, Personenvereinigungen oder Vermögensmassen';

export function freistellungTextA(
  finanzamt: string,
  stNr: string,
  datum: string,
  veranlagungszeitraum: string,
  zwecke: string
): string {
  return `Wir sind wegen Förderung ${zwecke} nach dem Freistellungsbescheid bzw. nach der Anlage zum Körperschaftsteuerbescheid des Finanzamtes ${finanzamt} StNr. ${stNr}, vom ${datum} für den letzten Veranlagungszeitraum ${veranlagungszeitraum} nach § 5 Abs. 1 Nr. 9 des Körperschaftsteuergesetzes von der Körperschaftsteuer und nach § 3 Nr. 6 des Gewerbesteuergesetzes von der Gewerbesteuer befreit.`;
}

export function freistellungTextB(
  finanzamt: string,
  stNr: string,
  datum: string,
  zwecke: string
): string {
  return `Die Einhaltung der satzungsmäßigen Voraussetzungen nach den §§ 51, 59, 60 und 61 AO wurde vom Finanzamt ${finanzamt}, StNr. ${stNr} mit Bescheid vom ${datum} nach § 60a AO gesondert festgestellt. Wir fördern nach unserer Satzung ${zwecke}.`;
}

export const VERWENDUNGSBESTAETIGUNG_PREFIX =
  'Es wird bestätigt, dass die Zuwendung nur zur Förderung ';

export const VERWENDUNGSBESTAETIGUNG_SUFFIX = ' verwendet wird.';

export const MITGLIEDSBEITRAG_HINWEIS =
  'Es wird bestätigt, dass es sich nicht um einen Mitgliedsbeitrag handelt, dessen Abzug nach § 10b Abs. 1 des Einkommensteuergesetzes ausgeschlossen ist.';

export const SAMMEL_DOPPELBESTAETIGUNG =
  'Es wird bestätigt, dass über die in der Gesamtsumme enthaltenen Zuwendungen keine weiteren Bestätigungen, weder formelle Zuwendungsbestätigungen noch Beitragsquittungen oder Ähnliches ausgestellt wurden und werden.';

export const SAMMEL_VERZICHTHINWEIS =
  'Ob es sich um den Verzicht auf Erstattung von Aufwendungen handelt, ist der Anlage zur Sammelbestätigung zu entnehmen.';

export const HAFTUNGSHINWEIS =
  'Wer vorsätzlich oder grob fahrlässig eine unrichtige Zuwendungsbestätigung erstellt oder veranlasst, dass Zuwendungen nicht zu den in der Zuwendungsbestätigung angegebenen steuerbegünstigten Zwecken verwendet werden, haftet für die entgangene Steuer (§ 10b Abs. 4 EStG, § 9 Abs. 3 KStG, § 9 Nr. 5 GewStG).';

export const GUELTIGKEITSHINWEIS =
  'Diese Bestätigung wird nicht als Nachweis für die steuerliche Berücksichtigung der Zuwendung anerkannt, wenn das Datum des Freistellungsbescheides länger als 5 Jahre bzw. das Datum der Feststellung der Einhaltung der satzungsmäßigen Voraussetzungen nach § 60a Abs. 1 AO länger als 3 Jahre seit Ausstellung des Bescheides zurückliegt (§ 63 Abs. 5 AO).';

export const SACHSPENDE_BETRIEBSVERMOEGEN =
  'Die Sachzuwendung stammt nach den Angaben des Zuwendenden aus dem Betriebsvermögen. Die Zuwendung wurde nach dem Wert der Entnahme (ggf. mit dem niedrigeren gemeinen Wert) und nach der Umsatzsteuer, die auf die Entnahme entfällt, bewertet.';

export const SACHSPENDE_PRIVATVERMOEGEN =
  'Die Sachzuwendung stammt nach den Angaben des Zuwendenden aus dem Privatvermögen.';

export const SACHSPENDE_KEINE_ANGABE =
  'Der Zuwendende hat trotz Aufforderung keine Angaben zur Herkunft der Sachzuwendung gemacht.';

export const SACHSPENDE_UNTERLAGEN =
  'Geeignete Unterlagen, die zur Wertermittlung gedient haben, z. B. Rechnung, Gutachten, liegen vor.';
