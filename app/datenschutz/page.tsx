import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Datenschutz – DRK Spendenquittung',
  description: 'Datenschutzerklärung – DRK Kreisverband StädteRegion Aachen e.V.',
};

export default function Datenschutz() {
  return (
    <div style={{ background: 'var(--bg)' }} className="min-h-[calc(100vh-theme(spacing.16))] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="drk-card">
          <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--text)' }}>Datenschutzerklärung</h2>

          <div className="space-y-6" style={{ color: 'var(--text-light)' }}>
            <section>
              <h3 className="font-bold mb-2" style={{ color: 'var(--text)' }}>1. Verantwortlicher</h3>
              <p>
                DRK-Kreisverband Städteregion Aachen e.V.<br />
                Henry-Dunant-Platz 1, 52146 Würselen<br />
                Telefon: 02405 6039100<br />
                E-Mail:{' '}
                <a href="mailto:Info@DRK-Aachen.de" style={{ color: 'var(--drk)' }} className="hover:underline">
                  Info@DRK-Aachen.de
                </a>
              </p>
            </section>

            <section>
              <h3 className="font-bold mb-2" style={{ color: 'var(--text)' }}>2. Datenverarbeitung</h3>
              <p>
                Diese Anwendung speichert personenbezogene Daten (Vereinsdaten, Spenderinformationen,
                Zuwendungen) in einer PostgreSQL-Datenbank auf einem selbst gehosteten Server. Die Daten
                werden ausschließlich zur Erstellung von Zuwendungsbestätigungen nach BMF-Muster verwendet.
              </p>
            </section>

            <section>
              <h3 className="font-bold mb-2" style={{ color: 'var(--text)' }}>3. Authentifizierung &amp; Cookies</h3>
              <p>
                Für die Anmeldung wird ein Magic-Link-Verfahren verwendet: Sie erhalten per E-Mail
                einen 6-stelligen Code. Nach erfolgreicher Anmeldung wird ein <strong>HttpOnly-Session-Cookie</strong> gesetzt,
                das ausschließlich der Authentifizierung dient. Es werden keine Tracking-Cookies verwendet.
              </p>
            </section>

            <section>
              <h3 className="font-bold mb-2" style={{ color: 'var(--text)' }}>4. E-Mail-Versand</h3>
              <p>
                Für den Versand der Anmelde-Codes wird Mailjet (Mailgun Technologies Inc., EU-Server)
                als SMTP-Relay genutzt. Dabei wird ausschließlich Ihre E-Mail-Adresse und der
                Anmeldecode übermittelt. Es werden keine weiteren personenbezogenen Daten an
                Mailjet übertragen.
              </p>
            </section>

            <section>
              <h3 className="font-bold mb-2" style={{ color: 'var(--text)' }}>5. Keine externen Dienste</h3>
              <p>
                Es werden keine Analytics- oder Tracking-Tools, keine externen Schriftarten und
                keine CDNs eingebunden. Alle Ressourcen werden lokal bereitgestellt. Die DOCX-Dateien
                (Zuwendungsbestätigungen) werden vollständig clientseitig im Browser generiert.
              </p>
            </section>

            <section>
              <h3 className="font-bold mb-2" style={{ color: 'var(--text)' }}>6. Gespeicherte Daten</h3>
              <p>Die Anwendung speichert serverseitig:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Kreisverbandsdaten (Adresse, Steuerdaten, Logo)</li>
                <li>Nutzerdaten (Name, E-Mail, Rolle)</li>
                <li>Spenderkontaktdaten</li>
                <li>Zuwendungsinformationen</li>
              </ul>
              <p className="mt-2">
                Im Browser werden lediglich die Theme-Einstellung (Hell/Dunkel) im localStorage gespeichert.
              </p>
            </section>

            <section>
              <h3 className="font-bold mb-2" style={{ color: 'var(--text)' }}>7. Mandantenisolation</h3>
              <p>
                Die Daten sind strikt nach Kreisverband getrennt (Mandantenfähigkeit). Nutzer eines
                Kreisverbands haben keinen Zugriff auf Daten anderer Kreisverbände.
              </p>
            </section>

            <section>
              <h3 className="font-bold mb-2" style={{ color: 'var(--text)' }}>8. Hosting</h3>
              <p>
                Die Anwendung und die Datenbank werden auf einem Hetzner-VPS (Hetzner Online GmbH,
                Industriestr. 25, 91710 Gunzenhausen, Deutschland) betrieben. Alle Daten verbleiben
                in Deutschland.
              </p>
            </section>

            <section>
              <h3 className="font-bold mb-2" style={{ color: 'var(--text)' }}>9. Betroffenenrechte (Art. 15–21 DSGVO)</h3>
              <p>
                Sie haben das Recht auf Auskunft, Berichtigung, Löschung und Einschränkung der
                Verarbeitung Ihrer personenbezogenen Daten. Administratoren können Spenderdaten und
                Zuwendungen in der App löschen. Bei Fragen wenden Sie sich an den oben genannten
                Verantwortlichen.
              </p>
            </section>

            <section>
              <h3 className="font-bold mb-2" style={{ color: 'var(--text)' }}>10. Open Source</h3>
              <p>
                Der gesamte Quellcode dieser Anwendung ist öffentlich einsehbar und überprüfbar.
              </p>
            </section>
          </div>

          <div className="mt-8">
            <Link href="/" style={{ color: 'var(--drk)' }} className="hover:underline text-sm font-semibold">
              ← Zurück zur Startseite
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
