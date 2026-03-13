import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Hilfe – DRK Spendenquittung',
  description: 'Hilfe und häufige Fragen zur DRK Spendenquittung.',
};

export default function Hilfe() {
  return (
    <div style={{ background: 'var(--bg)' }} className="min-h-[calc(100vh-theme(spacing.16))] py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="drk-card">
          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text)' }}>Hilfe & Anleitung</h2>
          <p style={{ color: 'var(--text-light)' }}>
            Hier finden Sie Antworten auf häufige Fragen rund um Zuwendungsbestätigungen und die App.
          </p>
        </div>

        <div className="drk-card">
          <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text)' }}>Häufige Fragen</h3>
          <div className="space-y-4">
            <details className="group">
              <summary className="drk-summary">Was ist eine Zuwendungsbestätigung?</summary>
              <p className="mt-2 text-sm pl-4" style={{ color: 'var(--text-light)' }}>
                Eine Zuwendungsbestätigung (umgangssprachlich &quot;Spendenquittung&quot;) ist ein steuerlich
                anerkannter Nachweis über eine Geld- oder Sachzuwendung an eine steuerbegünstigte
                Körperschaft. Sie berechtigt den Spender zum Spendenabzug gemäß § 10b EStG.
                Das BMF schreibt verbindliche Muster vor.
              </p>
            </details>

            <details className="group">
              <summary className="drk-summary">Welche BMF-Muster werden verwendet?</summary>
              <p className="mt-2 text-sm pl-4" style={{ color: 'var(--text-light)' }}>
                Diese App verwendet die Anlagen 3, 4 und 14 des BMF-Schreibens vom 07.11.2013
                (BStBl I S. 1333): Anlage 3 für Geldspenden/Mitgliedsbeiträge, Anlage 4 für
                Sachspenden und Anlage 14 für Sammelbestätigungen. Die Texte werden exakt nach
                BMF-Vorgabe übernommen.
              </p>
            </details>

            <details className="group">
              <summary className="drk-summary">Muss ich die Bestätigung unterschreiben?</summary>
              <p className="mt-2 text-sm pl-4" style={{ color: 'var(--text-light)' }}>
                Ja, eigenhändig. Diese App generiert ein vorausgefülltes DOCX-Dokument. Es muss
                ausgedruckt und vom Unterschriftsberechtigten des Vereins händisch unterschrieben
                werden. Eine maschinelle Erstellung ohne Unterschrift erfordert eine Genehmigung des
                Finanzamts, die mit dieser App nicht abgedeckt ist.
              </p>
            </details>

            <details className="group">
              <summary className="drk-summary">Wie lange ist mein Freistellungsbescheid gültig?</summary>
              <p className="mt-2 text-sm pl-4" style={{ color: 'var(--text-light)' }}>
                5 Jahre ab Bescheiddatum (Freistellungsbescheid) bzw. 3 Jahre (Feststellungsbescheid
                nach § 60a AO). Nach Ablauf dürfen KEINE Zuwendungsbestätigungen mehr ausgestellt
                werden. Die App blockiert den Download automatisch.
              </p>
            </details>

            <details className="group">
              <summary className="drk-summary">Was muss ich bei Sachspenden beachten?</summary>
              <p className="mt-2 text-sm pl-4" style={{ color: 'var(--text-light)' }}>
                Bei Sachspenden muss der Gegenstand genau beschrieben werden (Bezeichnung, Alter,
                Zustand, historischer Kaufpreis). Der angesetzte Wert muss nachvollziehbar sein.
                Die Wertermittlungsunterlagen (z.B. Originalrechnung, Gutachten) müssen dem Doppel
                der Zuwendungsbestätigung in der Vereinsakte beigefügt werden (BMF Nr. 6).
                Bei Betriebsvermögen: Entnahmewert + Umsatzsteuer angeben.
              </p>
            </details>

            <details className="group">
              <summary className="drk-summary">Was ist ein Aufwandsverzicht?</summary>
              <p className="mt-2 text-sm pl-4" style={{ color: 'var(--text-light)' }}>
                Ein Aufwandsverzicht liegt vor, wenn ein ehrenamtlich Tätiger auf die Erstattung
                seiner Aufwendungen verzichtet. Voraussetzungen: Der Anspruch auf Erstattung muss
                VOR der Tätigkeit rechtswirksam eingeräumt worden sein (z.B. durch Satzung,
                Vorstandsbeschluss oder Vertrag) und der Verzicht muss zeitnah erfolgen.
              </p>
            </details>

            <details className="group">
              <summary className="drk-summary">Wie lange muss ich die Doppel aufbewahren?</summary>
              <p className="mt-2 text-sm pl-4" style={{ color: 'var(--text-light)' }}>
                10 Jahre gemäß § 50 Abs. 7 EStDV. Der Batch-Export erstellt automatisch
                Doppel-Kopien aller Bestätigungen. Bewahren Sie die ZIP-Datei sicher auf
                (z.B. Vereins-NAS, USB-Stick, externer Datenträger).
              </p>
            </details>

            <details className="group">
              <summary className="drk-summary">Wo sind meine Daten gespeichert?</summary>
              <p className="mt-2 text-sm pl-4" style={{ color: 'var(--text-light)' }}>
                Alle Daten werden sicher in einer PostgreSQL-Datenbank auf dem Server gespeichert.
                Im Gegensatz zu einer Browser-Lösung gehen Ihre Daten nicht verloren, wenn Sie den
                Browser wechseln oder den Cache leeren. Zugriff erfolgt über Ihr persönliches Login.
              </p>
            </details>

            <details className="group">
              <summary className="drk-summary">Wie melde ich mich an?</summary>
              <p className="mt-2 text-sm pl-4" style={{ color: 'var(--text-light)' }}>
                Sie geben Ihre E-Mail-Adresse ein und erhalten einen 6-stelligen Anmeldecode per E-Mail.
                Es gibt kein Passwort — der Code ist 10 Minuten gültig. Ein Administrator muss Ihre
                E-Mail-Adresse vorab als Nutzer angelegt haben.
              </p>
            </details>

            <details className="group">
              <summary className="drk-summary">Können mehrere Personen gleichzeitig arbeiten?</summary>
              <p className="mt-2 text-sm pl-4" style={{ color: 'var(--text-light)' }}>
                Ja. Da die Daten zentral gespeichert werden, können mehrere Nutzer gleichzeitig auf
                die Anwendung zugreifen. Jeder Nutzer hat ein eigenes Login mit einer zugewiesenen Rolle
                (Admin, Schatzmeister oder Leser).
              </p>
            </details>

            <details className="group">
              <summary className="drk-summary">Brauche ich für Spenden unter 300 € eine Bestätigung?</summary>
              <p className="mt-2 text-sm pl-4" style={{ color: 'var(--text-light)' }}>
                Nein, ein vereinfachter Spendennachweis reicht in Kombination mit dem Kontoauszug
                (§ 50 Abs. 4 EStDV). Die App bietet beide Optionen an: volle Zuwendungsbestätigung
                nach Anlage 3 oder einen vereinfachten Spendennachweis.
              </p>
            </details>
          </div>
        </div>

        <div className="drk-card border-l-4" style={{ borderLeftColor: 'var(--drk)' }}>
          <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text)' }}>Fragen, Feedback oder Fehler gefunden?</h3>
          <p className="text-sm" style={{ color: 'var(--text-light)' }}>
            Wenden Sie sich an den DRK Kreisverband StädteRegion Aachen e.V.:<br />
            <a href="mailto:digitalisierung@drk-aachen.de" style={{ color: 'var(--drk)' }} className="hover:underline">
              digitalisierung@drk-aachen.de
            </a>
          </p>
        </div>

        <div className="text-center">
          <Link href="/" style={{ color: 'var(--drk)' }} className="hover:underline text-sm font-semibold">
            ← Zurück zur Startseite
          </Link>
        </div>
      </div>
    </div>
  );
}
