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

/** Vereinsdaten / Kreisverband (kommt aus DB via API) */
export interface Verein {
  id: string;
  slug?: string;
  name: string;
  strasse: string;
  plz: string;
  ort: string;

  // Steuerliche Daten
  finanzamt: string;
  steuernummer: string;
  freistellungsart: 'freistellungsbescheid' | 'feststellungsbescheid';
  freistellungDatum: string; // ISO-Date
  letzterVZ?: string | null; // Letzter Veranlagungszeitraum
  beguenstigteZwecke: string[];

  // Optional
  vereinsregister?: string | null;
  unterschriftName: string;
  unterschriftFunktion: string;

  // Anpassung
  logoBase64?: string | null;

  // Laufende Nummer
  laufendeNrFormat?: string;
}

/** Spender */
export interface Spender {
  id: string;
  anrede?: string | null;
  vorname: string;
  nachname: string;
  strasse: string;
  plz: string;
  ort: string;

  steuerIdNr?: string | null;

  // Aggregierte Daten (von API)
  zuwendungenCount?: number;
  jahresSumme?: number;

  erstelltAm?: string;
  aktualisiertAm?: string;
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
  zahlungsart?: string | null;

  // Sachzuwendung (nur bei art === 'sach')
  sachBezeichnung?: string | null;
  sachAlter?: string | null;
  sachZustand?: string | null;
  sachKaufpreis?: number | null;
  sachWert?: number | null;
  sachHerkunft?: 'privatvermoegen' | 'betriebsvermoegen' | 'keine_angabe' | null;
  sachWertermittlung?: string | null;
  sachEntnahmewert?: number | null;
  sachUmsatzsteuer?: number | null;
  sachUnterlagenVorhanden: boolean;

  // Verwaltung
  verzicht: boolean;

  // Status
  bestaetigungErstellt: boolean;
  bestaetigungDatum?: string | null;
  bestaetigungTyp?: 'anlage3' | 'anlage4' | 'anlage14' | 'vereinfacht' | null;
  laufendeNr?: string | null;

  // Spender-Info (von API mit include)
  spender?: {
    id: string;
    vorname: string;
    nachname: string;
    strasse?: string;
    plz?: string;
    ort?: string;
    anrede?: string | null;
    steuerIdNr?: string | null;
  };

  erstelltAm?: string;
  aktualisiertAm?: string;
}
