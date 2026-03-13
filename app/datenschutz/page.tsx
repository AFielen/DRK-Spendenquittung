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
              <h3 className="font-bold mb-2" style={{ color: 'var(--text)' }}>2. Zero-Data-Architektur</h3>
              <p>
                Diese Anwendung speichert <strong>KEINE Daten auf einem Server</strong>. Alle Daten
                (Vereinsdaten, Spenderinformationen, Zuwendungen) werden ausschließlich im localStorage
                Ihres Browsers gespeichert und verlassen Ihr Gerät zu keinem Zeitpunkt.
              </p>
            </section>

            <section>
              <h3 className="font-bold mb-2" style={{ color: 'var(--text)' }}>3. Keine Cookies</h3>
              <p>
                Diese Anwendung verwendet keine Cookies — weder technisch notwendige noch Tracking-Cookies.
              </p>
            </section>

            <section>
              <h3 className="font-bold mb-2" style={{ color: 'var(--text)' }}>4. Keine externen Dienste</h3>
              <p>
                Es werden keine externen Dienste, keine Analytics- oder Tracking-Tools, keine externen
                Schriftarten und keine CDNs eingebunden. Alle Ressourcen werden lokal bereitgestellt.
              </p>
            </section>

            <section>
              <h3 className="font-bold mb-2" style={{ color: 'var(--text)' }}>5. Keine Datenübertragung an Dritte</h3>
              <p>
                Es findet keine Datenübertragung an Dritte statt. Die DOCX-Dateien
                (Zuwendungsbestätigungen) werden vollständig clientseitig im Browser generiert.
              </p>
            </section>

            <section>
              <h3 className="font-bold mb-2" style={{ color: 'var(--text)' }}>6. Lokale Speicherung</h3>
              <p>
                Die Anwendung nutzt den localStorage Ihres Browsers zur Speicherung von:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Vereinsdaten (Steuerdaten, Adresse, Logo)</li>
                <li>Spenderkontaktdaten</li>
                <li>Zuwendungsinformationen</li>
                <li>App-Einstellungen</li>
              </ul>
              <p className="mt-2">
                Diese Daten können jederzeit über die Daten-Seite der App oder über die
                Browser-Einstellungen gelöscht werden.
              </p>
            </section>

            <section>
              <h3 className="font-bold mb-2" style={{ color: 'var(--text)' }}>7. Hosting</h3>
              <p>
                Die Anwendung wird auf einem Hetzner-VPS (Hetzner Online GmbH, Industriestr. 25,
                91710 Gunzenhausen, Deutschland) betrieben. Der Server liefert lediglich die
                vorgerenderten HTML-Seiten aus — es werden keine Nutzerdaten übertragen oder
                gespeichert.
              </p>
            </section>

            <section>
              <h3 className="font-bold mb-2" style={{ color: 'var(--text)' }}>8. Betroffenenrechte (Art. 15–21 DSGVO)</h3>
              <p>
                Da keine serverseitige Speicherung personenbezogener Daten erfolgt, haben Sie
                volle Kontrolle über Ihre Daten. Löschen Sie die Browserdaten, sind alle Daten
                entfernt. Bei Fragen wenden Sie sich an den oben genannten Verantwortlichen.
              </p>
            </section>

            <section>
              <h3 className="font-bold mb-2" style={{ color: 'var(--text)' }}>9. Open Source</h3>
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
