function CodeBlock({ children }: { children: string }) {
  return (
    <pre
      className="text-sm p-4 rounded-lg overflow-x-auto"
      style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
    >
      <code>{children}</code>
    </pre>
  );
}

function Endpoint({ method, path, scope, description }: {
  method: string;
  path: string;
  scope: string;
  description: string;
}) {
  const methodColor = method === 'GET' ? '#17a2b8' : method === 'POST' ? '#28a745' : method === 'PUT' ? '#ffc107' : '#e30613';
  return (
    <div className="p-4 rounded-lg mb-3" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
      <div className="flex items-center gap-3 flex-wrap">
        <span
          className="text-xs font-bold px-2 py-1 rounded"
          style={{ background: methodColor, color: '#fff' }}
        >
          {method}
        </span>
        <code className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{path}</code>
        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--drk-bg)', color: 'var(--drk)' }}>
          {scope}
        </span>
      </div>
      <p className="text-sm mt-2" style={{ color: 'var(--text-light)' }}>{description}</p>
    </div>
  );
}

export default function ApiDokumentationPage() {
  return (
    <div className="py-8 px-4" style={{ background: 'var(--bg)' }}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text)' }}>API-Dokumentation</h1>
          <p className="text-sm mt-2" style={{ color: 'var(--text-light)' }}>
            REST-API für die DRK-Spendenquittung. Ermöglicht externen Anwendungen den Zugriff auf Spender- und Zuwendungsdaten.
          </p>
        </div>

        {/* Authentifizierung */}
        <div className="drk-card">
          <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--text)' }}>Authentifizierung</h2>
          <p className="text-sm mb-3" style={{ color: 'var(--text-light)' }}>
            Alle API-Anfragen erfordern einen gültigen API-Schlüssel als Bearer-Token im <code>Authorization</code>-Header.
            API-Schlüssel können in der Web-App unter <strong>/api-schluessel</strong> erstellt werden.
          </p>
          <CodeBlock>{`curl -H "Authorization: Bearer sq_live_abc123..." \\
  https://ihre-domain.de/api/v1/spender`}</CodeBlock>
        </div>

        {/* Basis-URL */}
        <div className="drk-card">
          <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--text)' }}>Basis-URL</h2>
          <CodeBlock>{`https://ihre-domain.de/api/v1/`}</CodeBlock>
          <p className="text-sm mt-2" style={{ color: 'var(--text-light)' }}>
            Alle Endpunkte sind relativ zu dieser Basis-URL.
          </p>
        </div>

        {/* Rate Limiting */}
        <div className="drk-card">
          <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--text)' }}>Rate Limiting</h2>
          <p className="text-sm mb-3" style={{ color: 'var(--text-light)' }}>
            Maximal <strong>100 Anfragen pro Minute</strong> pro API-Schlüssel. Status wird über Response-Header kommuniziert:
          </p>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th className="text-left py-2 font-semibold" style={{ color: 'var(--text)' }}>Header</th>
                <th className="text-left py-2 font-semibold" style={{ color: 'var(--text)' }}>Beschreibung</th>
              </tr>
            </thead>
            <tbody style={{ color: 'var(--text-light)' }}>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <td className="py-2"><code>X-RateLimit-Limit</code></td>
                <td className="py-2">Maximum pro Zeitfenster (100)</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <td className="py-2"><code>X-RateLimit-Remaining</code></td>
                <td className="py-2">Verbleibende Anfragen</td>
              </tr>
              <tr>
                <td className="py-2"><code>X-RateLimit-Reset</code></td>
                <td className="py-2">Unix-Timestamp des Resets</td>
              </tr>
            </tbody>
          </table>
          <p className="text-sm mt-3" style={{ color: 'var(--text-muted)' }}>
            Bei Überschreitung: HTTP 429 mit Fehler-Objekt.
          </p>
        </div>

        {/* Berechtigungen */}
        <div className="drk-card">
          <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--text)' }}>Berechtigungen (Scopes)</h2>
          <p className="text-sm mb-3" style={{ color: 'var(--text-light)' }}>
            Jeder API-Schlüssel hat definierte Berechtigungen. Fehlende Berechtigung ergibt HTTP 403.
          </p>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th className="text-left py-2 font-semibold" style={{ color: 'var(--text)' }}>Scope</th>
                <th className="text-left py-2 font-semibold" style={{ color: 'var(--text)' }}>Beschreibung</th>
              </tr>
            </thead>
            <tbody style={{ color: 'var(--text-light)' }}>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <td className="py-2"><code>spender:read</code></td>
                <td className="py-2">Spender auflisten und anzeigen</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <td className="py-2"><code>spender:write</code></td>
                <td className="py-2">Spender erstellen, bearbeiten, löschen</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <td className="py-2"><code>zuwendungen:read</code></td>
                <td className="py-2">Zuwendungen auflisten und anzeigen</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <td className="py-2"><code>zuwendungen:write</code></td>
                <td className="py-2">Zuwendungen erstellen, bearbeiten, löschen</td>
              </tr>
              <tr>
                <td className="py-2"><code>kreisverband:read</code></td>
                <td className="py-2">Vereinsdaten anzeigen</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Fehlerformat */}
        <div className="drk-card">
          <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--text)' }}>Fehlerbehandlung</h2>
          <p className="text-sm mb-3" style={{ color: 'var(--text-light)' }}>
            Alle Fehler folgen einem einheitlichen Format:
          </p>
          <CodeBlock>{`{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Ungültiger oder fehlender API-Schlüssel."
  }
}`}</CodeBlock>
          <table className="w-full text-sm mt-4">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th className="text-left py-2 font-semibold" style={{ color: 'var(--text)' }}>Status</th>
                <th className="text-left py-2 font-semibold" style={{ color: 'var(--text)' }}>Code</th>
                <th className="text-left py-2 font-semibold" style={{ color: 'var(--text)' }}>Beschreibung</th>
              </tr>
            </thead>
            <tbody style={{ color: 'var(--text-light)' }}>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <td className="py-2">400</td>
                <td className="py-2"><code>VALIDATION</code></td>
                <td className="py-2">Ungültige Eingabedaten</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <td className="py-2">401</td>
                <td className="py-2"><code>UNAUTHORIZED</code></td>
                <td className="py-2">Fehlender oder ungültiger API-Schlüssel</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <td className="py-2">403</td>
                <td className="py-2"><code>FORBIDDEN</code></td>
                <td className="py-2">Fehlende Berechtigung (Scope)</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <td className="py-2">404</td>
                <td className="py-2"><code>NOT_FOUND</code></td>
                <td className="py-2">Ressource nicht gefunden</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <td className="py-2">409</td>
                <td className="py-2"><code>CONFLICT</code></td>
                <td className="py-2">Konflikt (z.B. bestätigte Zuwendung)</td>
              </tr>
              <tr>
                <td className="py-2">429</td>
                <td className="py-2"><code>RATE_LIMITED</code></td>
                <td className="py-2">Zu viele Anfragen</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Endpunkte: Spender */}
        <div className="drk-card">
          <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text)' }}>Endpunkte: Spender</h2>

          <Endpoint method="GET" path="/api/v1/spender" scope="spender:read"
            description="Alle Spender auflisten. Enthält Zuwendungsanzahl und Jahressumme." />

          <Endpoint method="POST" path="/api/v1/spender" scope="spender:write"
            description="Neuen Spender erstellen." />

          <p className="text-sm mb-2 mt-4 font-semibold" style={{ color: 'var(--text)' }}>Request-Body (POST):</p>
          <CodeBlock>{`{
  "istFirma": false,
  "vorname": "Max",
  "nachname": "Mustermann",
  "strasse": "Musterstr. 1",
  "plz": "52062",
  "ort": "Aachen",
  "anrede": "Herr",
  "steuerIdNr": "12345678901"
}`}</CodeBlock>

          <p className="text-sm mt-3 mb-2" style={{ color: 'var(--text-muted)' }}>
            Für Firmen: <code>istFirma: true</code> + <code>firmenname</code> statt Vor-/Nachname.
          </p>

          <Endpoint method="GET" path="/api/v1/spender/{'{id}'}" scope="spender:read"
            description="Einen Spender mit allen Zuwendungen abrufen." />

          <Endpoint method="PUT" path="/api/v1/spender/{'{id}'}" scope="spender:write"
            description="Spenderdaten aktualisieren." />

          <Endpoint method="DELETE" path="/api/v1/spender/{'{id}'}" scope="spender:write"
            description="Spender löschen. Bei vorhandenen Zuwendungen: ?confirm=true erforderlich." />
        </div>

        {/* Endpunkte: Zuwendungen */}
        <div className="drk-card">
          <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text)' }}>Endpunkte: Zuwendungen</h2>

          <Endpoint method="GET" path="/api/v1/zuwendungen" scope="zuwendungen:read"
            description="Alle Zuwendungen auflisten. Unterstützt Filter als Query-Parameter." />

          <p className="text-sm mb-2 mt-2 font-semibold" style={{ color: 'var(--text)' }}>Query-Parameter (GET):</p>
          <table className="w-full text-sm mb-4">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th className="text-left py-2 font-semibold" style={{ color: 'var(--text)' }}>Parameter</th>
                <th className="text-left py-2 font-semibold" style={{ color: 'var(--text)' }}>Beschreibung</th>
              </tr>
            </thead>
            <tbody style={{ color: 'var(--text-light)' }}>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <td className="py-2"><code>spenderId</code></td>
                <td className="py-2">Nach Spender filtern</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <td className="py-2"><code>jahr</code></td>
                <td className="py-2">Nach Jahr filtern (z.B. 2026)</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <td className="py-2"><code>art</code></td>
                <td className="py-2"><code>geld</code> oder <code>sach</code></td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <td className="py-2"><code>status</code></td>
                <td className="py-2"><code>offen</code>, <code>bestaetigt</code> oder <code>zweckgebunden_offen</code></td>
              </tr>
              <tr>
                <td className="py-2"><code>zugangsweg</code></td>
                <td className="py-2"><code>ueberweisung</code>, <code>bar</code>, <code>online</code>, <code>lastschrift</code>, etc.</td>
              </tr>
            </tbody>
          </table>

          <Endpoint method="POST" path="/api/v1/zuwendungen" scope="zuwendungen:write"
            description="Neue Zuwendung erstellen." />

          <p className="text-sm mb-2 mt-4 font-semibold" style={{ color: 'var(--text)' }}>Request-Body (POST):</p>
          <CodeBlock>{`{
  "spenderId": "uuid-des-spenders",
  "art": "geld",
  "verwendung": "spende",
  "betrag": 100.00,
  "datum": "2026-03-15",
  "zugangsweg": "ueberweisung",
  "verzicht": false,
  "bemerkung": "Optionale Notiz"
}`}</CodeBlock>

          <p className="text-sm mt-3 mb-2" style={{ color: 'var(--text-muted)' }}>
            Für Sachspenden (<code>art: &quot;sach&quot;</code>): zusätzlich <code>sachBezeichnung</code>, <code>sachWert</code>,
            <code>sachHerkunft</code>, <code>sachUnterlagenVorhanden: true</code> etc. erforderlich.
          </p>

          <Endpoint method="GET" path="/api/v1/zuwendungen/{'{id}'}" scope="zuwendungen:read"
            description="Eine Zuwendung mit Spender-Details abrufen." />

          <Endpoint method="PUT" path="/api/v1/zuwendungen/{'{id}'}" scope="zuwendungen:write"
            description="Zuwendung aktualisieren. Nicht möglich bei bereits bestätigten Zuwendungen." />

          <Endpoint method="DELETE" path="/api/v1/zuwendungen/{'{id}'}" scope="zuwendungen:write"
            description="Zuwendung löschen. Nicht möglich bei bereits bestätigten Zuwendungen." />
        </div>

        {/* Endpunkte: Kreisverband */}
        <div className="drk-card">
          <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text)' }}>Endpunkte: Kreisverband</h2>

          <Endpoint method="GET" path="/api/v1/kreisverband" scope="kreisverband:read"
            description="Vereinsdaten abrufen (Name, Adresse, steuerliche Daten). Logo ist aus Performance-Gründen nicht enthalten." />
        </div>

        {/* Nicht verfügbar */}
        <div className="drk-card" style={{ background: 'var(--drk-bg)', borderLeft: '4px solid var(--drk)' }}>
          <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--text)' }}>Nicht über die API verfügbar</h2>
          <p className="text-sm mb-2" style={{ color: 'var(--text-light)' }}>
            Folgende Funktionen sind aus Sicherheits- und Compliance-Gründen <strong>nur in der Web-App</strong> verfügbar:
          </p>
          <ul className="text-sm space-y-1 list-disc list-inside" style={{ color: 'var(--text-light)' }}>
            <li>PDF-/DOCX-Erstellung (Zuwendungsbestätigungen)</li>
            <li>Zuwendungen bestätigen (laufende Nummer vergeben)</li>
            <li>Batch-Export (ZIP-Download)</li>
            <li>Vereinsdaten bearbeiten</li>
            <li>Nutzerverwaltung</li>
          </ul>
        </div>

        {/* Beispiele */}
        <div className="drk-card">
          <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text)' }}>Beispiele</h2>

          <p className="text-sm mb-2 font-semibold" style={{ color: 'var(--text)' }}>Alle Spender abrufen:</p>
          <CodeBlock>{`curl -H "Authorization: Bearer sq_live_abc123def456..." \\
  https://ihre-domain.de/api/v1/spender`}</CodeBlock>

          <p className="text-sm mb-2 mt-4 font-semibold" style={{ color: 'var(--text)' }}>Neuen Spender erstellen:</p>
          <CodeBlock>{`curl -X POST \\
  -H "Authorization: Bearer sq_live_abc123def456..." \\
  -H "Content-Type: application/json" \\
  -d '{"vorname":"Max","nachname":"Mustermann","strasse":"Musterstr. 1","plz":"52062","ort":"Aachen"}' \\
  https://ihre-domain.de/api/v1/spender`}</CodeBlock>

          <p className="text-sm mb-2 mt-4 font-semibold" style={{ color: 'var(--text)' }}>Zuwendungen eines Jahres abrufen:</p>
          <CodeBlock>{`curl -H "Authorization: Bearer sq_live_abc123def456..." \\
  "https://ihre-domain.de/api/v1/zuwendungen?jahr=2026"`}</CodeBlock>

          <p className="text-sm mb-2 mt-4 font-semibold" style={{ color: 'var(--text)' }}>Neue Zuwendung erstellen:</p>
          <CodeBlock>{`curl -X POST \\
  -H "Authorization: Bearer sq_live_abc123def456..." \\
  -H "Content-Type: application/json" \\
  -d '{"spenderId":"uuid","art":"geld","verwendung":"spende","betrag":50.00,"datum":"2026-03-15"}' \\
  https://ihre-domain.de/api/v1/zuwendungen`}</CodeBlock>
        </div>
      </div>
    </div>
  );
}
