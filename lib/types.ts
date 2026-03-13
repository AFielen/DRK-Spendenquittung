// ── Gemeinsame Typen für DRK-Apps ──

/** Unterstützte Sprachen */
export type Locale = 'de' | 'en';

/** API Health Response */
export interface HealthResponse {
  status: 'ok' | 'error';
  version: string;
  timestamp: string;
}

/** Standard API Error */
export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}

// ── App-spezifische Typen ──

/** Vereinsdaten (einmalig pro Verband/Ortsverein) */
export interface Verein {
  id: string;
  name: string;
  strasse: string;
  plz: string;
  ort: string;

  // Steuerliche Daten
  finanzamt: string;
  steuernummer: string;
  freistellungsart: 'freistellungsbescheid' | 'feststellungsbescheid';
  freistellungDatum: string; // ISO-Date
  letzterVeranlagungszeitraum: string; // z.B. "2023" (nur bei Freistellungsbescheid)
  beguenstigteZwecke: string[];

  // Optional
  vereinsregister?: string;
  unterschriftName?: string;
  unterschriftFunktion?: string;

  // Anpassung
  logoBase64?: string;

  erstelltAm: string;
  aktualisiertAm: string;
}

/** Spender */
export interface Spender {
  id: string;
  anrede?: 'Herr' | 'Frau' | '';
  vorname: string;
  nachname: string;
  strasse: string;
  plz: string;
  ort: string;

  steuerIdNr?: string;

  erstelltAm: string;
  aktualisiertAm: string;
}

/** Einzelne Zuwendung */
export interface Zuwendung {
  id: string;
  spenderId: string;

  art: 'geld' | 'sach';
  verwendung: 'spende' | 'mitgliedsbeitrag';

  // Geldzuwendung
  betrag: number;
  datum: string; // ISO-Date
  zahlungsart?: 'ueberweisung' | 'bar' | 'lastschrift' | 'paypal' | 'sonstige';

  // Sachzuwendung (nur bei art === 'sach')
  sachBezeichnung?: string;
  sachAlter?: string;
  sachZustand?: string;
  sachKaufpreis?: number;
  sachWert?: number;
  sachHerkunft?: 'privatvermoegen' | 'betriebsvermoegen' | 'keine_angabe';
  sachWertermittlung?: string;
  sachEntnahmewert?: number;
  sachUmsatzsteuer?: number;
  sachUnterlagenVorhanden: boolean;

  // Verwaltung
  verzicht: boolean;

  // Status
  bestaetigungErstellt: boolean;
  bestaetigungDatum?: string;
  bestaetigungTyp?: 'anlage3' | 'anlage4' | 'anlage14' | 'vereinfacht';
  laufendeNr?: string;

  erstelltAm: string;
  aktualisiertAm: string;
}

/** App-Einstellungen */
export interface AppSettings {
  laufendeNrFormat: string;
  laufendeNrAktuell: number;
  laufendeNrJahr: number;
  sammelbestaetigungJahr: number;
  showKleinspenden: boolean;
  letztesBackup?: string;
  letzterBatchExport?: string;
}
