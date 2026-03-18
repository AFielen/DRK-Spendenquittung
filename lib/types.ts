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
  telefon?: string | null;
  email?: string | null;
  bankName?: string | null;
  bankIban?: string | null;
  bankBic?: string | null;
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
  istFirma?: boolean;
  firmenname?: string | null;
  anrede?: string | null;
  vorname?: string | null;
  nachname: string;
  strasse: string;
  plz: string;
  ort: string;

  steuerIdNr?: string | null;

  // Archivierung
  archiviert?: boolean;
  archiviertAm?: string | null;

  // Aggregierte Daten (von API)
  zuwendungenCount?: number;
  jahresSumme?: number;

  erstelltAm?: string;
  aktualisiertAm?: string;
}

/** Helper: Anzeigename eines Spenders */
export function spenderAnzeigename(s: { istFirma?: boolean; firmenname?: string | null; vorname?: string | null; nachname: string }): string {
  if (s.istFirma && s.firmenname) return s.firmenname;
  return s.vorname ? `${s.vorname} ${s.nachname}` : s.nachname;
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
  zugangsweg?: 'ueberweisung' | 'bar' | 'online' | 'lastschrift' | 'paypal' | 'scheck' | 'sonstig' | null;

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
  sachBewertungsgrundlage?: 'rechnung' | 'eigene_ermittlung' | 'gutachten' | null;
  sachUnterlagenVorhanden: boolean;

  // Verwaltung
  verzicht: boolean;

  // Interne Notiz (nicht auf Zuwendungsbestätigung)
  bemerkung?: string | null;

  // Zweckbindung
  zweckgebunden: boolean;
  zweckbindung?: string | null;
  zweckVerwendet: boolean;
  zweckVerwendetDatum?: string | null;
  zweckVerwendetNotiz?: string | null;

  // Status
  bestaetigungErstellt: boolean;
  bestaetigungDatum?: string | null;
  bestaetigungTyp?: 'anlage3' | 'anlage4' | 'anlage14' | 'vereinfacht' | null;
  laufendeNr?: string | null;

  // Spender-Info (von API mit include)
  spender?: {
    id: string;
    istFirma?: boolean;
    firmenname?: string | null;
    vorname?: string | null;
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
