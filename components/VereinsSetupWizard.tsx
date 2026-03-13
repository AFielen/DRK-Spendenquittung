'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Verein } from '@/lib/types';
import { apiPut } from '@/lib/api-client';
import { pruefFreistellung } from '@/lib/freistellung-check';

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
  const [logoBase64, setLogoBase64] = useState(existingVerein?.logoBase64 ?? '');

  // Schritt 2 – Steuerliche Angaben
  const [finanzamt, setFinanzamt] = useState(existingVerein?.finanzamt ?? '');
  const [steuernummer, setSteuernummer] = useState(existingVerein?.steuernummer ?? '');
  const [freistellungsart, setFreistellungsart] = useState<Verein['freistellungsart']>(
    existingVerein?.freistellungsart ?? 'freistellungsbescheid'
  );
  const [freistellungDatum, setFreistellungDatum] = useState(existingVerein?.freistellungDatum ?? '');
  const [letzterVZ, setLetzterVZ] = useState(
    existingVerein?.letzterVZ ?? ''
  );
  const [beguenstigteZwecke, setBeguenstigteZwecke] = useState<string[]>(
    existingVerein?.beguenstigteZwecke ?? [DRK_ZWECKE[0]]
  );
  const [weitererZweck, setWeitererZweck] = useState('');

  // Schritt 3 – Unterschrift
  const [unterschriftName, setUnterschriftName] = useState(existingVerein?.unterschriftName ?? '');
  const [unterschriftFunktion, setUnterschriftFunktion] = useState(existingVerein?.unterschriftFunktion ?? '');

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
              />
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

            <div>
              <label className="drk-label">Vereinslogo (optional, max. 200 KB)</label>
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

          <div className="flex justify-end mt-6">
            <button
              className="drk-btn-primary"
              disabled={!canProceedStep1}
              onClick={() => setSchritt(2)}
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
              <label className="drk-label">Finanzamt *</label>
              <input
                type="text"
                className="drk-input"
                value={finanzamt}
                onChange={(e) => setFinanzamt(e.target.value)}
                placeholder="z.B. Aachen-Stadt"
              />
            </div>

            <div>
              <label className="drk-label">Steuernummer *</label>
              <input
                type="text"
                className="drk-input"
                value={steuernummer}
                onChange={(e) => setSteuernummer(e.target.value)}
                placeholder="z.B. 201/5909/1234"
              />
            </div>

            <div>
              <label className="drk-label">Freistellungsart *</label>
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
                  <span className="text-sm" style={{ color: 'var(--text)' }}>
                    Freistellungsbescheid / Anlage zum KSt-Bescheid
                  </span>
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
                  <span className="text-sm" style={{ color: 'var(--text)' }}>
                    Feststellungsbescheid nach § 60a AO
                  </span>
                </label>
              </div>
            </div>

            <div>
              <label className="drk-label">Datum des Bescheids *</label>
              <input
                type="date"
                className="drk-input"
                value={freistellungDatum}
                onChange={(e) => setFreistellungDatum(e.target.value)}
              />

              {freistellungStatus?.status === 'abgelaufen' && (
                <div
                  className="mt-2 p-3 rounded-lg text-sm"
                  style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b' }}
                >
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
                <label className="drk-label">Letzter Veranlagungszeitraum</label>
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
              <label className="drk-label">Begünstigte Zwecke * (mindestens einer)</label>
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

          <div className="flex justify-between mt-6">
            <button className="drk-btn-secondary" onClick={() => setSchritt(1)}>
              Zurück
            </button>
            <button
              className="drk-btn-primary"
              disabled={!canProceedStep2}
              onClick={() => setSchritt(3)}
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
              <label className="drk-label">Name des Unterzeichners *</label>
              <input
                type="text"
                className="drk-input"
                value={unterschriftName}
                onChange={(e) => setUnterschriftName(e.target.value)}
                placeholder="z.B. Max Mustermann"
              />
            </div>

            <div>
              <label className="drk-label">Funktion *</label>
              <input
                type="text"
                className="drk-input"
                value={unterschriftFunktion}
                onChange={(e) => setUnterschriftFunktion(e.target.value)}
                placeholder="z.B. Vorstandsvorsitzender, Schatzmeister"
              />
            </div>

            <div
              className="p-3 rounded-lg text-sm"
              style={{ background: '#eff6ff', border: '1px solid #93c5fd', color: '#1e40af' }}
            >
              ℹ️ Die generierten Zuwendungsbestätigungen müssen ausgedruckt und eigenhändig
              unterschrieben werden.
            </div>
          </div>

          <div className="flex justify-between mt-6">
            <button className="drk-btn-secondary" onClick={() => setSchritt(2)}>
              Zurück
            </button>
            <button
              className="drk-btn-primary"
              disabled={!canFinish}
              onClick={handleSpeichern}
            >
              Einrichtung abschließen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
