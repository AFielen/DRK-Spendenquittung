'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Verein } from '@/lib/types';
import { apiPut } from '@/lib/api-client';
import { pruefFreistellung } from '@/lib/freistellung-check';
import HilfeHint from './HilfeHint';

const DRK_ZWECKE = [
  'Förderung des Wohlfahrtswesens',
  'Förderung der Rettung aus Lebensgefahr',
  'Förderung des Katastrophenschutzes',
  'Förderung der Jugend- und Altenhilfe',
  'Förderung des bürgerschaftlichen Engagements',
];

type Schritt = 1 | 2 | 3;

export default function VereinsSetupWizard({ existingVerein, onSaved }: { existingVerein?: Verein | null; onSaved?: () => void }) {
  const router = useRouter();
  const [schritt, setSchritt] = useState<Schritt>(1);

  // Schritt 1 – Stammdaten
  const [name, setName] = useState(existingVerein?.name ?? '');
  const [strasse, setStrasse] = useState(existingVerein?.strasse ?? '');
  const [plz, setPlz] = useState(existingVerein?.plz ?? '');
  const [ort, setOrt] = useState(existingVerein?.ort ?? '');
  const [vereinsregister, setVereinsregister] = useState(existingVerein?.vereinsregister ?? '');
  const [telefon, setTelefon] = useState(existingVerein?.telefon ?? '');
  const [email, setEmail] = useState(existingVerein?.email ?? '');
  const [bankName, setBankName] = useState(existingVerein?.bankName ?? '');
  const [bankIban, setBankIban] = useState(existingVerein?.bankIban ?? '');
  const [bankBic, setBankBic] = useState(existingVerein?.bankBic ?? '');
  const [logoBase64, setLogoBase64] = useState(existingVerein?.logoBase64 ?? '');

  // Schritt 2 – Steuerliche Angaben
  const [finanzamt, setFinanzamt] = useState(existingVerein?.finanzamt ?? '');
  const [steuernummer, setSteuernummer] = useState(existingVerein?.steuernummer ?? '');
  const [freistellungsart, setFreistellungsart] = useState<Verein['freistellungsart']>(
    existingVerein?.freistellungsart ?? 'freistellungsbescheid'
  );
  const [freistellungDatum, setFreistellungDatum] = useState(
    existingVerein?.freistellungDatum ? existingVerein.freistellungDatum.split('T')[0] : ''
  );
  const [letzterVZ, setLetzterVZ] = useState(
    existingVerein?.letzterVZ ? existingVerein.letzterVZ.split('T')[0] : ''
  );
  const [beguenstigteZwecke, setBeguenstigteZwecke] = useState<string[]>(
    existingVerein?.beguenstigteZwecke ?? [DRK_ZWECKE[0]]
  );
  const [weitererZweck, setWeitererZweck] = useState('');

  // Schritt 3 – Unterschrift
  const [unterschriftName, setUnterschriftName] = useState(existingVerein?.unterschriftName ?? '');
  const [unterschriftFunktion, setUnterschriftFunktion] = useState(existingVerein?.unterschriftFunktion ?? '');

  // Validierung: zeigt Fehler erst nach Klick auf "Weiter"
  const [versuchteWeiter1, setVersuchteWeiter1] = useState(false);
  const [versuchteWeiter2, setVersuchteWeiter2] = useState(false);
  const [versuchteWeiter3, setVersuchteWeiter3] = useState(false);

  const handleLogoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 200 * 1024) {
      alert('Das Logo darf maximal 200 KB groß sein.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setLogoBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const toggleZweck = (zweck: string) => {
    setBeguenstigteZwecke((prev) =>
      prev.includes(zweck) ? prev.filter((z) => z !== zweck) : [...prev, zweck]
    );
  };

  const addWeitererZweck = () => {
    const trimmed = weitererZweck.trim();
    if (trimmed && !beguenstigteZwecke.includes(trimmed)) {
      setBeguenstigteZwecke((prev) => [...prev, trimmed]);
      setWeitererZweck('');
    }
  };

  // Freistellungs-Prüfung
  const freistellungStatus = freistellungDatum
    ? pruefFreistellung({
        freistellungsart,
        freistellungDatum,
      } as Verein)
    : null;

  const canProceedStep1 = name.trim().length > 0;
  const canProceedStep2 =
    finanzamt.trim().length > 0 &&
    steuernummer.trim().length > 0 &&
    freistellungDatum.length > 0 &&
    beguenstigteZwecke.length > 0;
  const canFinish = unterschriftName.trim().length > 0 && unterschriftFunktion.trim().length > 0;

  const handleSpeichern = async () => {
    await apiPut('/api/kreisverband', {
      name: name.trim(),
      strasse: strasse.trim(),
      plz: plz.trim(),
      ort: ort.trim(),
      finanzamt: finanzamt.trim(),
      steuernummer: steuernummer.trim(),
      freistellungsart,
      freistellungDatum,
      letzterVZ: letzterVZ.trim() || null,
      beguenstigteZwecke,
      vereinsregister: vereinsregister.trim() || null,
      telefon: telefon.trim() || null,
      email: email.trim() || null,
      bankName: bankName.trim() || null,
      bankIban: bankIban.trim() || null,
      bankBic: bankBic.trim() || null,
      unterschriftName: unterschriftName.trim(),
      unterschriftFunktion: unterschriftFunktion.trim(),
      logoBase64: logoBase64 || null,
      laufendeNrFormat: existingVerein?.laufendeNrFormat || 'SQ-{JAHR}-{NR}',
    });
    onSaved?.();
    router.push('/');
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Fortschrittsanzeige */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {([1, 2, 3] as Schritt[]).map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
              style={{
                background: schritt >= s ? 'var(--drk)' : 'var(--border)',
                color: schritt >= s ? '#fff' : 'var(--text-light)',
              }}
            >
              {s}
            </div>
            {s < 3 && (
              <div
                className="w-12 h-0.5"
                style={{ background: schritt > s ? 'var(--drk)' : 'var(--border)' }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Schritt 1 – Stammdaten */}
      {schritt === 1 && (
        <div className="drk-card drk-fade-in">
          <h3 className="text-xl font-bold mb-6" style={{ color: 'var(--text)' }}>
            Schritt 1: Stammdaten
          </h3>

          <div className="space-y-4">
            <div>
              <label className="drk-label">Vereinsname *</label>
              <input
                type="text"
                className="drk-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="z.B. DRK Kreisverband StädteRegion Aachen e.V."
                style={versuchteWeiter1 && !name.trim() ? { borderColor: 'var(--error, #dc2626)' } : undefined}
              />
              {versuchteWeiter1 && !name.trim() && (
                <div className="text-xs mt-1" style={{ color: 'var(--error, #dc2626)' }}>Pflichtfeld</div>
              )}
            </div>

            <div>
              <label className="drk-label">Straße</label>
              <input
                type="text"
                className="drk-input"
                value={strasse}
                onChange={(e) => setStrasse(e.target.value)}
                placeholder="z.B. Henry-Dunant-Platz 1"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="drk-label">PLZ</label>
                <input
                  type="text"
                  className="drk-input"
                  value={plz}
                  onChange={(e) => setPlz(e.target.value)}
                  placeholder="52146"
                />
              </div>
              <div className="col-span-2">
                <label className="drk-label">Ort</label>
                <input
                  type="text"
                  className="drk-input"
                  value={ort}
                  onChange={(e) => setOrt(e.target.value)}
                  placeholder="Würselen"
                />
              </div>
            </div>

            <div>
              <label className="drk-label">Vereinsregister (optional)</label>
              <input
                type="text"
                className="drk-input"
                value={vereinsregister}
                onChange={(e) => setVereinsregister(e.target.value)}
                placeholder="z.B. Amtsgericht Aachen VR 4535"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="drk-label">Telefon (optional)</label>
                <input
                  type="tel"
                  className="drk-input"
                  value={telefon}
                  onChange={(e) => setTelefon(e.target.value)}
                  placeholder="z.B. 02405 6039-100"
                />
              </div>
              <div>
                <label className="drk-label">E-Mail (optional)</label>
                <input
                  type="email"
                  className="drk-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="z.B. info@drk-aachen.de"
                />
              </div>
            </div>

            <div>
              <label className="drk-label">Bankverbindung (optional – erscheint auf Spendenquittungen)</label>
              <div className="space-y-3 mt-1">
                <input
                  type="text"
                  className="drk-input"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="Name der Bank, z.B. Sparkasse Aachen"
                />
                <div className="grid grid-cols-[1fr_8rem] gap-3">
                  <input
                    type="text"
                    className="drk-input"
                    value={bankIban}
                    onChange={(e) => setBankIban(e.target.value)}
                    placeholder="IBAN, z.B. DE10 3905 0000 0023 4256 6"
                  />
                  <input
                    type="text"
                    className="drk-input"
                    value={bankBic}
                    onChange={(e) => setBankBic(e.target.value)}
                    placeholder="BIC"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="drk-label">Vereinslogo (optional, max. 200 KB)
                <HilfeHint text="Wenn Sie kein eigenes Logo hochladen, wird automatisch das DRK-Kompaktlogo auf den Spendenquittungen verwendet. Laden Sie nur dann ein Logo hoch, wenn Sie ein anderes verwenden möchten." />
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="drk-input"
              />
              {logoBase64 && (
                <div className="mt-2 flex items-center gap-3">
                  <img
                    src={logoBase64}
                    alt="Logo-Vorschau"
                    className="w-16 h-16 object-contain border rounded"
                    style={{ borderColor: 'var(--border)' }}
                  />
                  <button
                    type="button"
                    className="text-sm underline"
                    style={{ color: 'var(--drk)' }}
                    onClick={() => setLogoBase64('')}
                  >
                    Logo entfernen
                  </button>
                </div>
              )}
            </div>
          </div>

          {versuchteWeiter1 && !canProceedStep1 && (
            <div className="text-sm mt-2" style={{ color: 'var(--error, #dc2626)' }}>
              Bitte füllen Sie alle Pflichtfelder (*) aus.
            </div>
          )}

          <div className="flex justify-end mt-6">
            <button
              className="drk-btn-primary"
              onClick={() => {
                setVersuchteWeiter1(true);
                if (canProceedStep1) setSchritt(2);
              }}
            >
              Weiter
            </button>
          </div>
        </div>
      )}

      {/* Schritt 2 – Steuerliche Angaben */}
      {schritt === 2 && (
        <div className="drk-card drk-fade-in">
          <h3 className="text-xl font-bold mb-6" style={{ color: 'var(--text)' }}>
            Schritt 2: Steuerliche Angaben
          </h3>

          <div className="space-y-4">
            <div>
              <label className="drk-label">
                Finanzamt *
                <HilfeHint text="Das Finanzamt, das für Ihren Verein zuständig ist. Sie finden es auf Ihrem letzten Steuerbescheid oder Freistellungsbescheid ganz oben." />
              </label>
              <input
                type="text"
                className="drk-input"
                value={finanzamt}
                onChange={(e) => setFinanzamt(e.target.value)}
                placeholder="z.B. Aachen-Stadt"
                style={versuchteWeiter2 && !finanzamt.trim() ? { borderColor: 'var(--error, #dc2626)' } : undefined}
              />
              {versuchteWeiter2 && !finanzamt.trim() && (
                <div className="text-xs mt-1" style={{ color: 'var(--error, #dc2626)' }}>Pflichtfeld</div>
              )}
            </div>

            <div>
              <label className="drk-label">
                Steuernummer *
                <HilfeHint text="Die Steuernummer Ihres Vereins (nicht die Steuer-ID). Sie steht auf dem Freistellungsbescheid und hat üblicherweise das Format: 201/5909/1234." />
              </label>
              <input
                type="text"
                className="drk-input"
                value={steuernummer}
                onChange={(e) => setSteuernummer(e.target.value)}
                placeholder="z.B. 201/5909/1234"
                style={versuchteWeiter2 && !steuernummer.trim() ? { borderColor: 'var(--error, #dc2626)' } : undefined}
              />
              {versuchteWeiter2 && !steuernummer.trim() && (
                <div className="text-xs mt-1" style={{ color: 'var(--error, #dc2626)' }}>Pflichtfeld</div>
              )}
            </div>

            <div>
              <label className="drk-label">
                Freistellungsart *
                <HilfeHint text="Ihr Verein hat vom Finanzamt einen Bescheid erhalten, der bestätigt, dass er gemeinnützig ist. Es gibt zwei Arten: Der Freistellungsbescheid wird regelmäßig nach der Steuererklärung erteilt und gilt 5 Jahre. Der Feststellungsbescheid nach § 60a AO wird bei neu gegründeten Vereinen ausgestellt und gilt 3 Jahre." />
              </label>
              <div className="space-y-2 mt-1">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="freistellungsart"
                    value="freistellungsbescheid"
                    checked={freistellungsart === 'freistellungsbescheid'}
                    onChange={() => setFreistellungsart('freistellungsbescheid')}
                    className="mt-1"
                  />
                  <div>
                    <span className="text-sm" style={{ color: 'var(--text)' }}>
                      Freistellungsbescheid / Anlage zum KSt-Bescheid
                    </span>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      Der Regelfall für bestehende Vereine. Sie erhalten ihn nach Abgabe Ihrer Steuererklärung. Gültig für 5 Jahre.
                    </div>
                  </div>
                </label>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="freistellungsart"
                    value="feststellungsbescheid"
                    checked={freistellungsart === 'feststellungsbescheid'}
                    onChange={() => setFreistellungsart('feststellungsbescheid')}
                    className="mt-1"
                  />
                  <div>
                    <span className="text-sm" style={{ color: 'var(--text)' }}>
                      Feststellungsbescheid nach § 60a AO
                    </span>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      Für neu gegründete Vereine, die noch keine Steuererklärung abgegeben haben. Gültig für 3 Jahre.
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <div>
              <label className="drk-label">
                Datum des Bescheids *
                <HilfeHint text="Das Datum, an dem Ihr Freistellungs- oder Feststellungsbescheid ausgestellt wurde. Es steht ganz oben auf dem Bescheid. Anhand dieses Datums wird geprüft, ob der Bescheid noch gültig ist." />
              </label>
              <input
                type="date"
                className="drk-input"
                value={freistellungDatum}
                onChange={(e) => setFreistellungDatum(e.target.value)}
                style={versuchteWeiter2 && !freistellungDatum ? { borderColor: 'var(--error, #dc2626)' } : undefined}
              />
              {versuchteWeiter2 && !freistellungDatum && (
                <div className="text-xs mt-1" style={{ color: 'var(--error, #dc2626)' }}>Pflichtfeld</div>
              )}

              {freistellungStatus?.status === 'abgelaufen' && (
                <div className="drk-error-box mt-2">
                  ⚠️ Dieser Bescheid ist abgelaufen. Sie dürfen keine Zuwendungsbestätigungen
                  ausstellen, bis Sie aktuelle Bescheiddaten Ihres Finanzamts eingepflegt haben.
                </div>
              )}
              {freistellungStatus?.status === 'warnung' && (
                <div
                  className="mt-2 p-3 rounded-lg text-sm"
                  style={{ background: '#fffbeb', border: '1px solid #fcd34d', color: '#92400e' }}
                >
                  ⚠️ Ihr Bescheid läuft am {freistellungStatus.ablaufDatum} ab (noch{' '}
                  {freistellungStatus.restMonate} Monate). Bitte kümmern Sie sich rechtzeitig um die
                  Verlängerung.
                </div>
              )}
            </div>

            {freistellungsart === 'freistellungsbescheid' && (
              <div>
                <label className="drk-label">
                  Letzter Veranlagungszeitraum
                  <HilfeHint text="Das Jahr, für das Ihr Verein zuletzt eine Steuererklärung abgegeben hat und einen Bescheid erhalten hat. Steht im Freistellungsbescheid. Beispiel: 2023." />
                </label>
                <input
                  type="text"
                  className="drk-input"
                  value={letzterVZ}
                  onChange={(e) => setLetzterVZ(e.target.value)}
                  placeholder="z.B. 2023"
                />
              </div>
            )}

            <div>
              <label className="drk-label">
                Begünstigte Zwecke * (mindestens einer)
                <HilfeHint text="Die gemeinnützigen Zwecke, für die Ihr Verein vom Finanzamt anerkannt ist. Diese stehen in Ihrem Freistellungsbescheid. Wählen Sie alle zutreffenden Zwecke aus – sie erscheinen auf der Spendenquittung." />
              </label>
              <div className="space-y-2 mt-1">
                {DRK_ZWECKE.map((zweck) => (
                  <label key={zweck} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={beguenstigteZwecke.includes(zweck)}
                      onChange={() => toggleZweck(zweck)}
                    />
                    <span className="text-sm" style={{ color: 'var(--text)' }}>
                      {zweck}
                    </span>
                  </label>
                ))}
                {beguenstigteZwecke
                  .filter((z) => !DRK_ZWECKE.includes(z))
                  .map((zweck) => (
                    <label key={zweck} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked
                        onChange={() => toggleZweck(zweck)}
                      />
                      <span className="text-sm" style={{ color: 'var(--text)' }}>
                        {zweck}
                      </span>
                    </label>
                  ))}
              </div>
              {versuchteWeiter2 && beguenstigteZwecke.length === 0 && (
                <div className="text-xs mt-1" style={{ color: 'var(--error, #dc2626)' }}>Mindestens ein Zweck muss ausgewählt sein.</div>
              )}
              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  className="drk-input flex-1"
                  value={weitererZweck}
                  onChange={(e) => setWeitererZweck(e.target.value)}
                  placeholder="Weiterer Zweck..."
                  onKeyDown={(e) => e.key === 'Enter' && addWeitererZweck()}
                />
                <button
                  type="button"
                  className="drk-btn-secondary"
                  onClick={addWeitererZweck}
                  disabled={!weitererZweck.trim()}
                >
                  Hinzufügen
                </button>
              </div>
            </div>
          </div>

          {versuchteWeiter2 && !canProceedStep2 && (
            <div className="text-sm mt-2" style={{ color: 'var(--error, #dc2626)' }}>
              Bitte füllen Sie alle Pflichtfelder (*) aus.
            </div>
          )}

          <div className="flex justify-between mt-6">
            <button className="drk-btn-secondary" onClick={() => setSchritt(1)}>
              Zurück
            </button>
            <button
              className="drk-btn-primary"
              onClick={() => {
                setVersuchteWeiter2(true);
                if (canProceedStep2) setSchritt(3);
              }}
            >
              Weiter
            </button>
          </div>
        </div>
      )}

      {/* Schritt 3 – Unterschrift */}
      {schritt === 3 && (
        <div className="drk-card drk-fade-in">
          <h3 className="text-xl font-bold mb-6" style={{ color: 'var(--text)' }}>
            Schritt 3: Unterschrift
          </h3>

          <div className="space-y-4">
            <div>
              <label className="drk-label">
                Name des Unterzeichners *
                <HilfeHint text="Die Person, die die Spendenquittungen unterschreiben wird. Das muss ein vertretungsberechtigtes Vorstandsmitglied sein – in der Regel der Vorsitzende oder der Schatzmeister." />
              </label>
              <input
                type="text"
                className="drk-input"
                value={unterschriftName}
                onChange={(e) => setUnterschriftName(e.target.value)}
                placeholder="z.B. Max Mustermann"
                style={versuchteWeiter3 && !unterschriftName.trim() ? { borderColor: 'var(--error, #dc2626)' } : undefined}
              />
              {versuchteWeiter3 && !unterschriftName.trim() && (
                <div className="text-xs mt-1" style={{ color: 'var(--error, #dc2626)' }}>Pflichtfeld</div>
              )}
            </div>

            <div>
              <label className="drk-label">
                Funktion *
                <HilfeHint text="Die Rolle der unterzeichnenden Person im Verein, z.B. 'Vorstandsvorsitzender', 'Schatzmeister' oder 'Geschäftsführer'. Diese Angabe erscheint unter der Unterschriftszeile auf der Spendenquittung." />
              </label>
              <input
                type="text"
                className="drk-input"
                value={unterschriftFunktion}
                onChange={(e) => setUnterschriftFunktion(e.target.value)}
                placeholder="z.B. Vorstandsvorsitzender, Schatzmeister"
                style={versuchteWeiter3 && !unterschriftFunktion.trim() ? { borderColor: 'var(--error, #dc2626)' } : undefined}
              />
              {versuchteWeiter3 && !unterschriftFunktion.trim() && (
                <div className="text-xs mt-1" style={{ color: 'var(--error, #dc2626)' }}>Pflichtfeld</div>
              )}
            </div>

            <div
              className="p-3 rounded-lg text-sm"
              style={{ background: '#eff6ff', border: '1px solid #93c5fd', color: '#1e40af' }}
            >
              ℹ️ Die generierten Zuwendungsbestätigungen müssen ausgedruckt und eigenhändig
              unterschrieben werden.
            </div>
          </div>

          {versuchteWeiter3 && !canFinish && (
            <div className="text-sm mt-2" style={{ color: 'var(--error, #dc2626)' }}>
              Bitte füllen Sie alle Pflichtfelder (*) aus.
            </div>
          )}

          <div className="flex justify-between mt-6">
            <button className="drk-btn-secondary" onClick={() => setSchritt(2)}>
              Zurück
            </button>
            <button
              className="drk-btn-primary"
              onClick={() => {
                setVersuchteWeiter3(true);
                if (canFinish) handleSpeichern();
              }}
            >
              Einrichtung abschließen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
