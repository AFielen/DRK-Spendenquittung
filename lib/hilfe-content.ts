// lib/hilfe-content.ts

// ── Types ──

export type HilfeKategorie =
  | 'erste-schritte'
  | 'spenderverwaltung'
  | 'zuwendungen'
  | 'zuwendungsbestaetigungen'
  | 'freistellung-steuern'
  | 'export-archivierung'
  | 'api-integration'
  | 'sicherheit-datenschutz';

export interface HilfeEintrag {
  id: string;
  kategorie: HilfeKategorie;
  frage: string;
  antwort: string;
  tags: string[];
  seiten: string[];
}

export interface KategorieInfo {
  id: HilfeKategorie;
  titel: string;
  beschreibung: string;
  icon: string;
}

export interface TourStep {
  target: string;
  titel: string;
  text: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

export interface Tour {
  id: string;
  seite: string;
  titel: string;
  steps: TourStep[];
}

// ── Categories ──

export const kategorien: KategorieInfo[] = [
  {
    id: 'erste-schritte',
    titel: 'Erste Schritte',
    beschreibung: 'Login, Einrichtung, Rollen',
    icon: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
  },
  {
    id: 'spenderverwaltung',
    titel: 'Spenderverwaltung',
    beschreibung: 'Anlegen, Bearbeiten, CSV-Import, Archivieren',
    icon: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75',
  },
  {
    id: 'zuwendungen',
    titel: 'Zuwendungen',
    beschreibung: 'Geld- und Sachspenden erfassen, Zweckbindung',
    icon: 'M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6',
  },
  {
    id: 'zuwendungsbestaetigungen',
    titel: 'Zuwendungsbestätigungen',
    beschreibung: 'Einzel, Sammel, Vereinfacht, PDF/DOCX, Unterschrift',
    icon: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8',
  },
  {
    id: 'freistellung-steuern',
    titel: 'Freistellung & Steuern',
    beschreibung: 'Gültigkeit, Ablauf, Prüfung, gesetzliche Grundlagen',
    icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  },
  {
    id: 'export-archivierung',
    titel: 'Export & Archivierung',
    beschreibung: 'Batch-Export, Doppel, Aufbewahrungsfristen',
    icon: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3',
  },
  {
    id: 'api-integration',
    titel: 'API & Integration',
    beschreibung: 'API-Schlüssel, Scopes, Nutzung',
    icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4',
  },
  {
    id: 'sicherheit-datenschutz',
    titel: 'Sicherheit & Datenschutz',
    beschreibung: 'Daten, DSGVO, Löschung',
    icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  },
];

// ── FAQ Entries ──

export const hilfeEintraege: HilfeEintrag[] = [
  // ── Erste Schritte ──
  {
    id: 'login-anmeldung',
    kategorie: 'erste-schritte',
    frage: 'Wie melde ich mich an?',
    antwort: 'Sie geben Ihre E-Mail-Adresse ein und erhalten einen 6-stelligen Anmeldecode per E-Mail. Es gibt kein Passwort — der Code ist 10 Minuten gültig. Ein Administrator muss Ihre E-Mail-Adresse vorab als Nutzer angelegt haben.',
    tags: ['login', 'anmelden', 'code', 'e-mail', 'passwort', 'zugang'],
    seiten: ['/login'],
  },
  {
    id: 'rollen-erklaerung',
    kategorie: 'erste-schritte',
    frage: 'Welche Rollen gibt es?',
    antwort: 'Es gibt drei Rollen: <strong>Admin</strong> — kann Nutzer verwalten und alle Einstellungen ändern. <strong>Schatzmeister</strong> — kann Spender, Zuwendungen und Bestätigungen verwalten. <strong>Leser</strong> — kann nur Daten ansehen, nichts ändern.',
    tags: ['rolle', 'admin', 'schatzmeister', 'leser', 'berechtigung', 'rechte'],
    seiten: ['/einrichtung', '/'],
  },
  {
    id: 'einrichtung-starten',
    kategorie: 'erste-schritte',
    frage: 'Wie richte ich die App ein?',
    antwort: 'Gehen Sie auf <strong>Einrichtung</strong> und durchlaufen Sie den 3-Schritte-Wizard: 1. Basisdaten (Name, Adresse, Finanzamt), 2. Steuer-Rechtliches (Freistellungsbescheid, Aktenzeichen), 3. Unterschrift (Name und Funktion des Zeichnungsberechtigten). Erst wenn alle Pflichtfelder ausgefüllt sind, können Bestätigungen erstellt werden.',
    tags: ['einrichtung', 'setup', 'wizard', 'konfiguration', 'starten', 'anfang'],
    seiten: ['/einrichtung', '/'],
  },
  {
    id: 'gleichzeitig-arbeiten',
    kategorie: 'erste-schritte',
    frage: 'Können mehrere Personen gleichzeitig arbeiten?',
    antwort: 'Ja. Da die Daten zentral gespeichert werden, können mehrere Nutzer gleichzeitig auf die Anwendung zugreifen. Jeder Nutzer hat ein eigenes Login mit einer zugewiesenen Rolle.',
    tags: ['mehrere nutzer', 'gleichzeitig', 'team', 'zusammenarbeit'],
    seiten: ['/'],
  },
  {
    id: 'dashboard-ueberblick',
    kategorie: 'erste-schritte',
    frage: 'Was zeigt mir das Dashboard?',
    antwort: 'Das Dashboard gibt einen Überblick über Ihre Spender, Zuwendungen und erstellte Bestätigungen. Über die Schnellzugriff-Buttons erreichen Sie die wichtigsten Funktionen direkt. Wenn die Einrichtung noch nicht abgeschlossen ist, werden Sie darauf hingewiesen.',
    tags: ['dashboard', 'startseite', 'übersicht', 'home'],
    seiten: ['/'],
  },
  // ── Spenderverwaltung ──
  {
    id: 'spender-anlegen',
    kategorie: 'spenderverwaltung',
    frage: 'Wie lege ich einen neuen Spender an?',
    antwort: 'Klicken Sie auf <strong>+ Neuer Spender</strong> in der Spenderverwaltung. Füllen Sie Name und Adresse aus. Pflichtfelder sind Nachname (oder Firmenname), Straße, PLZ und Ort. Sie können zwischen Person und Firma umschalten.',
    tags: ['spender', 'anlegen', 'erstellen', 'neu', 'person', 'firma'],
    seiten: ['/spender'],
  },
  {
    id: 'spender-bearbeiten',
    kategorie: 'spenderverwaltung',
    frage: 'Wie bearbeite ich einen Spender?',
    antwort: 'Klicken Sie auf den Bearbeiten-Button (Stift-Symbol) neben dem Spender in der Tabelle. Es öffnet sich das gleiche Formular wie beim Anlegen, mit den vorausgefüllten Daten.',
    tags: ['spender', 'bearbeiten', 'ändern', 'editieren', 'aktualisieren'],
    seiten: ['/spender'],
  },
  {
    id: 'csv-import',
    kategorie: 'spenderverwaltung',
    frage: 'Wie importiere ich Spender per CSV?',
    antwort: 'Klicken Sie auf <strong>CSV-Import</strong> in der Spenderverwaltung. Die CSV-Datei muss diese Spalten enthalten: <code>Vorname, Nachname, Strasse, PLZ, Ort</code>. Optionale Spalten: <code>Anrede, Titel, Land, SteuerIdNr</code>. Trennzeichen: Semikolon oder Komma. Bereits vorhandene Spender (gleicher Name + PLZ) werden automatisch erkannt und übersprungen. Maximal 5.000 Zeilen pro Import.',
    tags: ['csv', 'import', 'excel', 'datei', 'hochladen', 'massenimport'],
    seiten: ['/spender'],
  },
  {
    id: 'spender-archivieren',
    kategorie: 'spenderverwaltung',
    frage: 'Kann ich Spender archivieren statt löschen?',
    antwort: 'Ja. Archivierte Spender werden standardmäßig ausgeblendet, können aber über den Filter „Archivierte anzeigen" wieder sichtbar gemacht werden. So bleiben historische Daten erhalten, ohne die aktive Liste zu überfrachten.',
    tags: ['archiv', 'archivieren', 'ausblenden', 'löschen', 'entfernen'],
    seiten: ['/spender'],
  },
  {
    id: 'spender-suche',
    kategorie: 'spenderverwaltung',
    frage: 'Wie finde ich einen bestimmten Spender?',
    antwort: 'Nutzen Sie das Suchfeld über der Spendertabelle. Es durchsucht Vor- und Nachname, Firma und Ort. Die Tabelle filtert live beim Tippen.',
    tags: ['suche', 'finden', 'filtern', 'spender suchen'],
    seiten: ['/spender'],
  },
  // ── Zuwendungen ──
  {
    id: 'zuwendung-geld',
    kategorie: 'zuwendungen',
    frage: 'Wie erfasse ich eine Geldspende?',
    antwort: 'Gehen Sie auf <strong>Zuwendungen</strong> und klicken Sie <strong>+ Neue Zuwendung</strong>. Wählen Sie einen Spender, setzen Sie den Typ auf „Geld", geben Sie Betrag, Datum und Zugangsweg (z.B. Überweisung, Bar, Online) an. Wählen Sie den Zweck: Spende oder Mitgliedsbeitrag.',
    tags: ['geldspende', 'betrag', 'erfassen', 'eintragen', 'überweisung', 'bar'],
    seiten: ['/zuwendungen'],
  },
  {
    id: 'zuwendung-sach',
    kategorie: 'zuwendungen',
    frage: 'Wie erfasse ich eine Sachspende?',
    antwort: 'Wählen Sie den Typ „Sach" bei der Zuwendungserfassung. Pflichtfelder: Bezeichnung des Gegenstands, geschätzter Wert. Empfohlen: Alter, Zustand, historischer Kaufpreis, Art der Wertermittlung (Rechnung, eigene Ermittlung, Gutachten) und Herkunft (Privatvermögen, Betriebsvermögen). Je vollständiger die Angaben, desto rechtssicherer die Bestätigung.',
    tags: ['sachspende', 'gegenstand', 'wert', 'bewertung', 'sachzuwendung'],
    seiten: ['/zuwendungen'],
  },
  {
    id: 'zweckbindung',
    kategorie: 'zuwendungen',
    frage: 'Was bedeutet Zweckbindung?',
    antwort: 'Wenn ein Spender eine Zuwendung für einen bestimmten Zweck gibt (z.B. „nur für Katastrophenhilfe"), können Sie das als Zweckbindung erfassen. In der Zuwendungsbestätigung wird der Hinweis aufgenommen, dass es sich um eine zweckgebundene Zuwendung handelt.',
    tags: ['zweckbindung', 'zweck', 'gebunden', 'verwendungszweck'],
    seiten: ['/zuwendungen'],
  },
  {
    id: 'zuwendung-status',
    kategorie: 'zuwendungen',
    frage: 'Was bedeuten die Status-Symbole bei Zuwendungen?',
    antwort: 'Ein grüner Haken bedeutet: Zuwendungsbestätigung wurde erstellt. Kein Symbol: Noch keine Bestätigung erstellt. In der Detailansicht sehen Sie den genauen Typ (Anlage 3, 4, 14 oder Vereinfacht) und die laufende Nummer.',
    tags: ['status', 'bestätigt', 'offen', 'symbol', 'haken'],
    seiten: ['/zuwendungen'],
  },
  {
    id: 'aufwandsverzicht',
    kategorie: 'zuwendungen',
    frage: 'Was ist ein Aufwandsverzicht?',
    antwort: 'Ein Aufwandsverzicht liegt vor, wenn ein ehrenamtlich Tätiger auf die Erstattung seiner Aufwendungen verzichtet. Voraussetzungen: Der Anspruch auf Erstattung muss <strong>vor</strong> der Tätigkeit rechtswirksam eingeräumt worden sein (z.B. durch Satzung, Vorstandsbeschluss oder Vertrag) und der Verzicht muss zeitnah erfolgen.',
    tags: ['aufwandsverzicht', 'verzicht', 'ehrenamt', 'erstattung', 'aufwand'],
    seiten: ['/zuwendungen'],
  },
  // ── Zuwendungsbestätigungen ──
  {
    id: 'was-ist-zuwendungsbestaetigung',
    kategorie: 'zuwendungsbestaetigungen',
    frage: 'Was ist eine Zuwendungsbestätigung?',
    antwort: 'Eine Zuwendungsbestätigung (umgangssprachlich „Spendenquittung") ist ein steuerlich anerkannter Nachweis über eine Geld- oder Sachzuwendung an eine steuerbegünstigte Körperschaft. Sie berechtigt den Spender zum Spendenabzug gemäß § 10b EStG. Das BMF schreibt verbindliche Muster vor.',
    tags: ['zuwendungsbestätigung', 'spendenquittung', 'nachweis', 'steuer', 'abzug'],
    seiten: ['/bestaetigung'],
  },
  {
    id: 'bmf-muster',
    kategorie: 'zuwendungsbestaetigungen',
    frage: 'Welche BMF-Muster werden verwendet?',
    antwort: 'Diese App verwendet die Anlagen 3, 4 und 14 des BMF-Schreibens vom 07.11.2013 (BStBl I S. 1333): <strong>Anlage 3</strong> für Geldspenden/Mitgliedsbeiträge, <strong>Anlage 4</strong> für Sachspenden und <strong>Anlage 14</strong> für Sammelbestätigungen. Die Texte werden exakt nach BMF-Vorgabe übernommen.',
    tags: ['bmf', 'muster', 'anlage', 'vorlage', 'formular'],
    seiten: ['/bestaetigung'],
  },
  {
    id: 'einzelbestaetigung',
    kategorie: 'zuwendungsbestaetigungen',
    frage: 'Wie erstelle ich eine Einzelbestätigung?',
    antwort: 'Gehen Sie auf <strong>Bestätigung</strong> → Tab <strong>Einzelbestätigung</strong>. Wählen Sie einen Spender, dann die offene Zuwendung. Klicken Sie auf PDF oder DOCX herunterladen. Die Zuwendung wird automatisch als bestätigt markiert und erhält eine laufende Nummer.',
    tags: ['einzelbestätigung', 'anlage 3', 'anlage 4', 'einzeln', 'erstellen'],
    seiten: ['/bestaetigung'],
  },
  {
    id: 'sammelbestaetigung',
    kategorie: 'zuwendungsbestaetigungen',
    frage: 'Was ist eine Sammelbestätigung?',
    antwort: 'Eine Sammelbestätigung (Anlage 14) fasst alle Geldspenden eines Spenders in einem Zeitraum zusammen. Wählen Sie den Tab <strong>Sammelbestätigung</strong>, einen Spender und den Zeitraum (Von/Bis). Alle unbestätigten Geldspenden im Zeitraum werden aufgelistet und können gemeinsam bestätigt werden.',
    tags: ['sammelbestätigung', 'anlage 14', 'jahresbestätigung', 'sammeln', 'zeitraum'],
    seiten: ['/bestaetigung'],
  },
  {
    id: 'vereinfacht',
    kategorie: 'zuwendungsbestaetigungen',
    frage: 'Wann reicht eine vereinfachte Bestätigung?',
    antwort: 'Für Spenden bis 300 € reicht ein vereinfachter Spendennachweis in Kombination mit dem Kontoauszug (§ 50 Abs. 4 EStDV). Die App bietet unter dem Tab <strong>Vereinfacht</strong> diese Option an. Es wird keine laufende Nummer vergeben.',
    tags: ['vereinfacht', '300 euro', 'vereinfachter nachweis', 'klein', 'kontoauszug'],
    seiten: ['/bestaetigung'],
  },
  {
    id: 'pdf-vs-docx',
    kategorie: 'zuwendungsbestaetigungen',
    frage: 'Was ist der Unterschied zwischen PDF und DOCX?',
    antwort: '<strong>PDF</strong> wird serverseitig generiert und enthält das vollständige Layout mit DRK-Briefpapier-Design. <strong>DOCX</strong> ist ein vorausgefülltes Word-Dokument — ideal zum Ausdrucken und händischen Unterschreiben. Beide Formate enthalten den exakt gleichen rechtlichen Text.',
    tags: ['pdf', 'docx', 'word', 'format', 'herunterladen', 'download'],
    seiten: ['/bestaetigung'],
  },
  {
    id: 'unterschrift',
    kategorie: 'zuwendungsbestaetigungen',
    frage: 'Muss ich die Bestätigung unterschreiben?',
    antwort: 'Ja, eigenhändig. Diese App generiert ein vorausgefülltes Dokument. Es muss ausgedruckt und vom Unterschriftsberechtigten des Vereins händisch unterschrieben werden. Eine maschinelle Erstellung ohne Unterschrift erfordert eine Genehmigung des Finanzamts.',
    tags: ['unterschrift', 'unterschreiben', 'handschriftlich', 'signatur', 'druck'],
    seiten: ['/bestaetigung'],
  },
  {
    id: 'laufende-nummer',
    kategorie: 'zuwendungsbestaetigungen',
    frage: 'Was ist die laufende Nummer?',
    antwort: 'Jede Zuwendungsbestätigung erhält automatisch eine fortlaufende Nummer (z.B. 2026-001, 2026-002). Diese dient der Nachvollziehbarkeit und wird in den Bestätigungen und im Export aufgeführt. Vereinfachte Nachweise erhalten keine laufende Nummer.',
    tags: ['laufende nummer', 'nummerierung', 'reihenfolge', 'fortlaufend'],
    seiten: ['/bestaetigung'],
  },
  // ── Freistellung & Steuern ──
  {
    id: 'freistellung-gueltigkeit',
    kategorie: 'freistellung-steuern',
    frage: 'Wie lange ist mein Freistellungsbescheid gültig?',
    antwort: '5 Jahre ab Bescheiddatum (Freistellungsbescheid) bzw. 3 Jahre (Feststellungsbescheid nach § 60a AO). Nach Ablauf dürfen <strong>keine</strong> Zuwendungsbestätigungen mehr ausgestellt werden. Die App blockiert den Download automatisch.',
    tags: ['freistellung', 'gültigkeit', 'ablauf', 'bescheid', 'finanzamt', '5 jahre', '3 jahre'],
    seiten: ['/einrichtung', '/bestaetigung'],
  },
  {
    id: 'freistellung-warnung',
    kategorie: 'freistellung-steuern',
    frage: 'Was bedeuten die Farbcodes bei der Freistellung?',
    antwort: '<strong>Grün</strong>: Gültig. <strong>Gelb</strong>: Weniger als 6 Monate verbleibend — neuen Bescheid beantragen. <strong>Rot</strong>: Weniger als 3 Monate verbleibend — dringend handeln. <strong>Blockiert</strong>: Abgelaufen — keine Bestätigungen möglich, bis ein neuer Bescheid eingetragen ist.',
    tags: ['warnung', 'ampel', 'grün', 'gelb', 'rot', 'blockiert', 'freistellung'],
    seiten: ['/einrichtung', '/', '/bestaetigung'],
  },
  {
    id: 'steuerbeguenstigung',
    kategorie: 'freistellung-steuern',
    frage: 'Was bedeutet steuerbegünstigte Zwecke?',
    antwort: 'Als DRK-Kreisverband verfolgen Sie gemeinnützige, mildtätige und ggf. kirchliche Zwecke. Diese werden im Freistellungsbescheid aufgeführt und müssen in der Einrichtung der App korrekt eingetragen werden, da sie wortwörtlich auf den Bestätigungen erscheinen.',
    tags: ['steuerbegünstigt', 'gemeinnützig', 'mildtätig', 'zwecke', 'satzung'],
    seiten: ['/einrichtung'],
  },
  {
    id: 'sachspenden-steuer',
    kategorie: 'freistellung-steuern',
    frage: 'Was muss ich bei Sachspenden steuerlich beachten?',
    antwort: 'Bei Sachspenden muss der Gegenstand genau beschrieben werden (Bezeichnung, Alter, Zustand, historischer Kaufpreis). Der angesetzte Wert muss nachvollziehbar sein. Die Wertermittlungsunterlagen (z.B. Originalrechnung, Gutachten) müssen dem Doppel der Zuwendungsbestätigung in der Vereinsakte beigefügt werden (BMF Nr. 6). Bei Betriebsvermögen: Entnahmewert + Umsatzsteuer angeben.',
    tags: ['sachspende', 'steuer', 'bewertung', 'wertermittlung', 'betriebsvermögen'],
    seiten: ['/zuwendungen', '/bestaetigung'],
  },
  // ── Export & Archivierung ──
  {
    id: 'batch-export',
    kategorie: 'export-archivierung',
    frage: 'Wie erstelle ich einen Jahresexport?',
    antwort: 'Gehen Sie auf <strong>Export</strong>, wählen Sie das Steuerjahr und die gewünschten Optionen (Sammelbestätigungen, Einzelbestätigungen, Vereinfachte). Klicken Sie auf „Export starten". Die App erstellt eine ZIP-Datei mit allen Bestätigungen, Doppeln und einer CSV-Übersicht.',
    tags: ['export', 'zip', 'jahresexport', 'herunterladen', 'batch', 'massenexport'],
    seiten: ['/export'],
  },
  {
    id: 'doppel-aufbewahrung',
    kategorie: 'export-archivierung',
    frage: 'Wie lange muss ich die Doppel aufbewahren?',
    antwort: '10 Jahre gemäß § 50 Abs. 7 EStDV. Der Batch-Export erstellt automatisch Doppel-Kopien aller Bestätigungen. Bewahren Sie die ZIP-Datei sicher auf (z.B. Vereins-NAS, USB-Stick, externer Datenträger).',
    tags: ['doppel', 'aufbewahrung', 'kopie', '10 jahre', 'frist', 'archiv'],
    seiten: ['/export'],
  },
  {
    id: 'doppel-pflicht',
    kategorie: 'export-archivierung',
    frage: 'Was ist ein Doppel?',
    antwort: 'Ein Doppel ist eine identische Kopie der Zuwendungsbestätigung, die der Verein für seine eigenen Unterlagen aufbewahren muss. Das Doppel wird beim Export automatisch erstellt — es ist keine optionale Funktion, sondern gesetzliche Pflicht.',
    tags: ['doppel', 'kopie', 'pflicht', 'vereinsakte'],
    seiten: ['/export', '/bestaetigung'],
  },
  {
    id: 'datenspeicherung',
    kategorie: 'export-archivierung',
    frage: 'Wo sind meine Daten gespeichert?',
    antwort: 'Alle Daten werden sicher in einer PostgreSQL-Datenbank auf dem Server gespeichert. Im Gegensatz zu einer Browser-Lösung gehen Ihre Daten nicht verloren, wenn Sie den Browser wechseln oder den Cache leeren. Zugriff erfolgt über Ihr persönliches Login.',
    tags: ['datenbank', 'server', 'speicherung', 'postgresql', 'sicherung'],
    seiten: ['/'],
  },
  // ── API & Integration ──
  {
    id: 'api-schluessel-erstellen',
    kategorie: 'api-integration',
    frage: 'Wie erstelle ich einen API-Schlüssel?',
    antwort: 'Gehen Sie auf <strong>API-Schlüssel</strong> in den Einstellungen. Klicken Sie „Neuen Schlüssel erstellen", wählen Sie die gewünschten Berechtigungen (Scopes) und vergeben Sie einen Namen. Der Schlüssel wird nur einmal angezeigt — kopieren Sie ihn sofort.',
    tags: ['api', 'schlüssel', 'key', 'token', 'erstellen', 'zugang'],
    seiten: ['/api-schluessel'],
  },
  {
    id: 'api-scopes',
    kategorie: 'api-integration',
    frage: 'Was sind API-Scopes?',
    antwort: 'Scopes definieren, was ein API-Schlüssel darf: <code>spender:read</code> — Spenderdaten lesen. <code>spender:write</code> — Spender anlegen/ändern. <code>zuwendungen:read</code> — Zuwendungen lesen. <code>zuwendungen:write</code> — Zuwendungen anlegen/ändern. <code>kreisverband:read</code> — Vereinsdaten lesen. Geben Sie nur die Berechtigungen, die tatsächlich benötigt werden.',
    tags: ['scope', 'berechtigung', 'api', 'zugriff', 'lesen', 'schreiben'],
    seiten: ['/api-schluessel'],
  },
  {
    id: 'api-rate-limit',
    kategorie: 'api-integration',
    frage: 'Gibt es ein Rate-Limit für die API?',
    antwort: 'Ja, maximal 100 Anfragen pro Minute pro API-Schlüssel. Bei Überschreitung erhalten Sie einen HTTP 429-Fehler. Warten Sie eine Minute und versuchen Sie es erneut.',
    tags: ['rate limit', 'limit', 'drosselung', '429', 'anfragen'],
    seiten: ['/api-schluessel', '/api-dokumentation'],
  },
  {
    id: 'api-authentifizierung',
    kategorie: 'api-integration',
    frage: 'Wie authentifiziere ich API-Anfragen?',
    antwort: 'Senden Sie den API-Schlüssel als Bearer-Token im Authorization-Header: <code>Authorization: Bearer sk_live_...</code>. Alle API-Endpunkte sind unter <code>/api/v1/</code> erreichbar. Details finden Sie in der API-Dokumentation.',
    tags: ['bearer', 'token', 'header', 'authorization', 'authentifizierung'],
    seiten: ['/api-schluessel', '/api-dokumentation'],
  },
  // ── Sicherheit & Datenschutz ──
  {
    id: 'dsgvo-konformitaet',
    kategorie: 'sicherheit-datenschutz',
    frage: 'Ist die App DSGVO-konform?',
    antwort: 'Ja. Es werden keine Cookies gesetzt, keine externen Tracking-Dienste verwendet und keine Daten an Dritte übermittelt. Alle Daten werden auf einem Server in Deutschland gespeichert. Es gibt keine Verbindung zu US-Diensten (Google, Meta, etc.).',
    tags: ['dsgvo', 'datenschutz', 'konform', 'cookies', 'tracking'],
    seiten: ['/datenschutz'],
  },
  {
    id: 'daten-loeschen',
    kategorie: 'sicherheit-datenschutz',
    frage: 'Wie lösche ich Spenderdaten?',
    antwort: 'Spender können über den Löschen-Button in der Spenderverwaltung entfernt werden. Achtung: Damit werden auch alle zugehörigen Zuwendungen und Bestätigungen gelöscht. Alternativ können Sie Spender archivieren, um sie auszublenden ohne Daten zu verlieren.',
    tags: ['löschen', 'entfernen', 'daten', 'spender', 'dsgvo', 'recht auf löschung'],
    seiten: ['/spender'],
  },
  {
    id: 'session-sicherheit',
    kategorie: 'sicherheit-datenschutz',
    frage: 'Wie sicher ist die Anmeldung?',
    antwort: 'Die App nutzt Magic-Link-Authentifizierung (6-stellige Codes per E-Mail). Codes sind 10 Minuten gültig und können nur einmal verwendet werden. Sessions werden serverseitig verwaltet (HttpOnly Cookies). Es gibt Schutz gegen Brute-Force-Angriffe durch Rate-Limiting.',
    tags: ['sicherheit', 'session', 'cookie', 'brute force', 'anmeldung'],
    seiten: ['/login'],
  },
  {
    id: 'hosting-standort',
    kategorie: 'sicherheit-datenschutz',
    frage: 'Wo wird die App gehostet?',
    antwort: 'Die App wird auf einem Server in Deutschland gehostet (Hetzner). Es werden keine Cloud-Dienste von US-Anbietern verwendet. Der Quellcode ist Open Source und kann jederzeit auf GitHub eingesehen werden.',
    tags: ['hosting', 'server', 'standort', 'deutschland', 'hetzner', 'open source'],
    seiten: ['/datenschutz', '/impressum'],
  },
  {
    id: 'open-source',
    kategorie: 'sicherheit-datenschutz',
    frage: 'Ist die App Open Source?',
    antwort: 'Ja, der Quellcode ist auf GitHub frei verfügbar. Die App steht unter der MIT-Lizenz. Jeder kann den Code einsehen, prüfen und eigene Änderungen vorschlagen.',
    tags: ['open source', 'github', 'quellcode', 'lizenz', 'mit'],
    seiten: [],
  },
];

// ── Tours ──

export const tours: Tour[] = [
  {
    id: 'einrichtung',
    seite: '/einrichtung',
    titel: 'Einrichtung Schritt für Schritt',
    steps: [
      {
        target: '[data-tour="setup-wizard"]',
        titel: 'Der Einrichtungs-Wizard',
        text: 'Hier richten Sie Ihren Kreisverband ein. Der Wizard führt Sie durch drei Schritte: Basisdaten, Steuer-Rechtliches und Unterschrift.',
        position: 'bottom',
      },
      {
        target: '[data-tour="setup-basisdaten"]',
        titel: 'Schritt 1: Basisdaten',
        text: 'Name des Verbands, Adresse, zuständiges Finanzamt und Kontaktdaten. Diese Informationen erscheinen auf allen Zuwendungsbestätigungen.',
        position: 'bottom',
      },
      {
        target: '[data-tour="setup-steuer"]',
        titel: 'Schritt 2: Steuer-Rechtliches',
        text: 'Freistellungsbescheid-Datum, Aktenzeichen und steuerbegünstigte Zwecke. Ohne gültigen Freistellungsbescheid können keine Bestätigungen erstellt werden.',
        position: 'bottom',
      },
      {
        target: '[data-tour="setup-unterschrift"]',
        titel: 'Schritt 3: Unterschrift',
        text: 'Name und Funktion des Zeichnungsberechtigten. Diese Person muss jede Bestätigung eigenhändig unterschreiben.',
        position: 'bottom',
      },
      {
        target: '[data-tour="tab-nutzer"]',
        titel: 'Nutzerverwaltung',
        text: 'Hier können Admins weitere Nutzer hinzufügen und Rollen zuweisen (Admin, Schatzmeister, Leser).',
        position: 'bottom',
      },
    ],
  },
  {
    id: 'spender',
    seite: '/spender',
    titel: 'Spenderverwaltung kennenlernen',
    steps: [
      {
        target: '[data-tour="spender-titel"]',
        titel: 'Spenderverwaltung',
        text: 'Hier verwalten Sie alle Spender Ihres Kreisverbands — Personen und Firmen.',
        position: 'bottom',
      },
      {
        target: '[data-tour="btn-neuer-spender"]',
        titel: 'Neuen Spender anlegen',
        text: 'Klicken Sie hier, um einen Spender manuell anzulegen. Pflichtfelder: Name, Straße, PLZ und Ort.',
        position: 'bottom',
      },
      {
        target: '[data-tour="btn-csv-import"]',
        titel: 'CSV-Import',
        text: 'Importieren Sie viele Spender auf einmal per CSV-Datei. Duplikate werden automatisch erkannt.',
        position: 'bottom',
      },
      {
        target: '[data-tour="spender-tabelle"]',
        titel: 'Spenderliste',
        text: 'Alle Spender auf einen Blick. Sie können suchen, sortieren und zwischen aktiven und archivierten Spendern wechseln.',
        position: 'top',
      },
    ],
  },
  {
    id: 'zuwendungen',
    seite: '/zuwendungen',
    titel: 'Zuwendungen erfassen',
    steps: [
      {
        target: '[data-tour="zuwendung-titel"]',
        titel: 'Zuwendungen',
        text: 'Hier erfassen und verwalten Sie alle eingegangenen Spenden und Mitgliedsbeiträge.',
        position: 'bottom',
      },
      {
        target: '[data-tour="btn-neue-zuwendung"]',
        titel: 'Neue Zuwendung',
        text: 'Erfassen Sie eine neue Geld- oder Sachspende. Wählen Sie den Spender und geben Sie die Details ein.',
        position: 'bottom',
      },
      {
        target: '[data-tour="zuwendung-tabelle"]',
        titel: 'Zuwendungsliste',
        text: 'Alle Zuwendungen mit Status: Offene Zuwendungen warten auf eine Bestätigung, bestätigte haben einen grünen Haken.',
        position: 'top',
      },
    ],
  },
  {
    id: 'bestaetigung',
    seite: '/bestaetigung',
    titel: 'Bestätigungen erstellen',
    steps: [
      {
        target: '[data-tour="tab-einzel"]',
        titel: 'Einzelbestätigung',
        text: 'Für einzelne Geld- oder Sachspenden. Wählen Sie einen Spender und die offene Zuwendung, dann laden Sie die Bestätigung herunter.',
        position: 'bottom',
      },
      {
        target: '[data-tour="tab-sammel"]',
        titel: 'Sammelbestätigung',
        text: 'Fasst alle Geldspenden eines Spenders in einem Zeitraum zusammen (Anlage 14). Ideal für den Jahresabschluss.',
        position: 'bottom',
      },
      {
        target: '[data-tour="tab-vereinfacht"]',
        titel: 'Vereinfachte Bestätigung',
        text: 'Für Spenden bis 300 € reicht ein vereinfachter Nachweis. Keine laufende Nummer nötig.',
        position: 'bottom',
      },
      {
        target: '[data-tour="bestaetigung-spender"]',
        titel: 'Spender auswählen',
        text: 'Wählen Sie den Spender, für den Sie eine Bestätigung erstellen möchten. Es werden nur Spender mit offenen Zuwendungen angezeigt.',
        position: 'bottom',
      },
      {
        target: '[data-tour="bestaetigung-download"]',
        titel: 'Herunterladen',
        text: 'Laden Sie die Bestätigung als PDF (mit DRK-Layout) oder DOCX (zum Ausfüllen) herunter. Vergessen Sie nicht: Ausdrucken und eigenhändig unterschreiben!',
        position: 'top',
      },
    ],
  },
];

// ── Helpers ──

/** Get all FAQ entries for a specific route */
export function getEintraegeForSeite(seite: string): HilfeEintrag[] {
  return hilfeEintraege.filter((e) => e.seiten.includes(seite));
}

/** Get all FAQ entries for a specific category */
export function getEintraegeForKategorie(kategorie: HilfeKategorie): HilfeEintrag[] {
  return hilfeEintraege.filter((e) => e.kategorie === kategorie);
}

/** Get a single FAQ entry by ID */
export function getEintragById(id: string): HilfeEintrag | undefined {
  return hilfeEintraege.find((e) => e.id === id);
}

/** Get tour for a specific route */
export function getTourForSeite(seite: string): Tour | undefined {
  return tours.find((t) => t.seite === seite);
}
