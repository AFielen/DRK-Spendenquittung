'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { isValidDrkEmail, DRK_DOMAIN_HINT } from '@/lib/domain-check';
import { pruefFreistellung } from '@/lib/freistellung-check';
import type { Verein } from '@/lib/types';

const DRK_ZWECKE = [
  'Förderung des Wohlfahrtswesens',
  'Förderung der Rettung aus Lebensgefahr',
  'Förderung des Katastrophenschutzes',
  'Förderung der Jugend- und Altenhilfe',
  'Förderung des bürgerschaftlichen Engagements',
];

type Schritt = 1 | 2 | 3 | 4;

export default function RegistrierungPage() {
  const router = useRouter();
  const [schritt, setSchritt] = useState<Schritt>(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Schritt 1 – Nutzerdaten + E-Mail-Verifizierung
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [codeStep, setCodeStep] = useState<'form' | 'code'>('form');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [codeVerified, setCodeVerified] = useState(false);
  const [verifiedCode, setVerifiedCode] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Schritt 2 – Stammdaten
  const [kvName, setKvName] = useState('');
  const [strasse, setStrasse] = useState('');
  const [plz, setPlz] = useState('');
  const [ort, setOrt] = useState('');
  const [vereinsregister, setVereinsregister] = useState('');
  const [logoBase64, setLogoBase64] = useState('');

  // Schritt 3 – Steuerliche Angaben
  const [finanzamt, setFinanzamt] = useState('');
  const [steuernummer, setSteuernummer] = useState('');
  const [freistellungsart, setFreistellungsart] = useState<Verein['freistellungsart']>('freistellungsbescheid');
  const [freistellungDatum, setFreistellungDatum] = useState('');
  const [letzterVZ, setLetzterVZ] = useState('');
  const [beguenstigteZwecke, setBeguenstigteZwecke] = useState<string[]>([DRK_ZWECKE[0]]);
  const [weitererZweck, setWeitererZweck] = useState('');

  // Schritt 4 – Unterschrift
  const [unterschriftName, setUnterschriftName] = useState('');
  const [unterschriftFunktion, setUnterschriftFunktion] = useState('');

  // Auto-focus code input
  useEffect(() => {
    if (codeStep === 'code' && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [codeStep]);

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

  // Validierung
  const emailValid = isValidDrkEmail(userEmail);
  const canSendCode = userName.trim().length > 0 && emailValid;
  const canProceedStep1 = codeVerified;
  const canProceedStep2 = kvName.trim().length > 0;
  const canProceedStep3 =
    finanzamt.trim().length > 0 &&
    steuernummer.trim().length > 0 &&
    freistellungDatum.length > 0 &&
    beguenstigteZwecke.length > 0;
  const canFinish = unterschriftName.trim().length > 0 && unterschriftFunktion.trim().length > 0;

  // Code senden
  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/registrierung', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 'send-code', email: userEmail, name: userName }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Fehler beim Senden.');
        return;
      }

      setCodeStep('code');
    } catch {
      setError('Verbindungsfehler. Bitte versuchen Sie es erneut.');
    } finally {
      setLoading(false);
    }
  }

  function handleCodeInput(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Alle 6 Ziffern eingegeben → Code merken und weiter
    if (newCode.every((d) => d !== '')) {
      setVerifiedCode(newCode.join(''));
      setCodeVerified(true);
      setSchritt(2);
    }
  }

  function handleCodeKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handleCodePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      const newCode = pasted.split('');
      setCode(newCode);
      inputRefs.current[5]?.focus();
      setVerifiedCode(pasted);
      setCodeVerified(true);
      setSchritt(2);
    }
  }

  // Registrierung abschließen
  async function handleRegistrierung() {
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/registrierung', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 'verify-and-create',
          email: userEmail,
          code: verifiedCode,
          name: userName,
          kreisverband: {
            name: kvName.trim(),
            strasse: strasse.trim(),
            plz: plz.trim(),
            ort: ort.trim(),
            vereinsregister: vereinsregister.trim() || null,
            logoBase64: logoBase64 || null,
            finanzamt: finanzamt.trim(),
            steuernummer: steuernummer.trim(),
            freistellungsart,
            freistellungDatum,
            letzterVZ: letzterVZ.trim() || null,
            beguenstigteZwecke,
            unterschriftName: unterschriftName.trim(),
            unterschriftFunktion: unterschriftFunktion.trim(),
          },
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Fehler bei der Registrierung.');
        return;
      }

      router.push('/');
    } catch {
      setError('Verbindungsfehler. Bitte versuchen Sie es erneut.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-[calc(100vh-200px)] py-8 px-4"
      style={{ background: 'var(--bg)' }}
    >
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <Image src="/logo.png" alt="DRK Logo" width={56} height={56} className="mx-auto mb-3" />
          <h2 className="text-xl font-bold" style={{ color: 'var(--text)' }}>
            Verband registrieren
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-light)' }}>
            DRK Spendenquittung
          </p>
        </div>

        {/* Fortschrittsanzeige */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {([1, 2, 3, 4] as Schritt[]).map((s) => (
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
              {s < 4 && (
                <div
                  className="w-8 h-0.5"
                  style={{ background: schritt > s ? 'var(--drk)' : 'var(--border)' }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Fehlermeldung */}
        {error && (
          <div
            className="p-3 rounded-lg text-sm mb-4"
            style={{ background: 'var(--drk-bg)', color: 'var(--drk)' }}
          >
            {error}
          </div>
        )}

        {/* Schritt 1 – Nutzerdaten + E-Mail-Verifizierung */}
        {schritt === 1 && (
          <div className="drk-card drk-fade-in max-w-sm mx-auto text-center">
            <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text)' }}>
              Schritt 1: Ihr Konto
            </h3>
            <p className="text-sm mb-6" style={{ color: 'var(--text-light)' }}>
              Erstellen Sie Ihr persönliches Konto als Administrator.
            </p>

            {codeStep === 'form' && (
              <form onSubmit={handleSendCode} className="text-left">
                <div className="space-y-4">
                  <div>
                    <label className="drk-label">Ihr Name *</label>
                    <input
                      type="text"
                      className="drk-input"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="z.B. Max Mustermann"
                      required
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="drk-label">E-Mail-Adresse *</label>
                    <input
                      type="email"
                      className="drk-input"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      placeholder={`name${DRK_DOMAIN_HINT}`}
                      required
                      autoComplete="email"
                    />
                    {userEmail && !emailValid && (
                      <p className="text-xs mt-1" style={{ color: 'var(--drk)' }}>
                        Nur E-Mail-Adressen mit {DRK_DOMAIN_HINT} Domain sind erlaubt.
                      </p>
                    )}
                  </div>
                </div>
                <button
                  type="submit"
                  className="drk-btn-primary w-full mt-6"
                  disabled={!canSendCode || loading}
                >
                  {loading ? 'Sende...' : 'Registrierungscode senden'}
                </button>
              </form>
            )}

            {codeStep === 'code' && (
              <div>
                <p className="text-sm mb-4" style={{ color: 'var(--text-light)' }}>
                  Wir haben einen 6-stelligen Code an <strong>{userEmail}</strong> gesendet.
                </p>

                <div className="flex justify-center gap-2 mb-4" onPaste={handleCodePaste}>
                  {code.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { inputRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      className="drk-input text-center text-xl font-bold"
                      style={{ width: '44px', height: '52px', padding: '0' }}
                      value={digit}
                      onChange={(e) => handleCodeInput(i, e.target.value)}
                      onKeyDown={(e) => handleCodeKeyDown(i, e)}
                      autoComplete="one-time-code"
                    />
                  ))}
                </div>

                <button
                  type="button"
                  className="text-sm underline"
                  style={{ color: 'var(--text-light)' }}
                  onClick={() => {
                    setCodeStep('form');
                    setCode(['', '', '', '', '', '']);
                    setError('');
                  }}
                >
                  Daten ändern
                </button>
              </div>
            )}

            <div className="mt-6 text-sm" style={{ color: 'var(--text-light)' }}>
              Bereits registriert?{' '}
              <Link href="/login" className="underline font-semibold" style={{ color: 'var(--drk)' }}>
                Anmelden
              </Link>
            </div>
          </div>
        )}

        {/* Schritt 2 – Stammdaten */}
        {schritt === 2 && (
          <div className="drk-card drk-fade-in">
            <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text)' }}>
              Schritt 2: Stammdaten
            </h3>
            <p className="text-sm mb-6" style={{ color: 'var(--text-light)' }}>
              Grunddaten Ihres DRK-Verbands.
            </p>

            <div className="space-y-4">
              <div>
                <label className="drk-label">Vereinsname *</label>
                <input
                  type="text"
                  className="drk-input"
                  value={kvName}
                  onChange={(e) => setKvName(e.target.value)}
                  placeholder="z.B. DRK Kreisverband StädteRegion Aachen e.V."
                  autoFocus
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

        {/* Schritt 3 – Steuerliche Angaben */}
        {schritt === 3 && (
          <div className="drk-card drk-fade-in">
            <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text)' }}>
              Schritt 3: Steuerliche Angaben
            </h3>
            <p className="text-sm mb-6" style={{ color: 'var(--text-light)' }}>
              Angaben zu Freistellung und begünstigten Zwecken.
            </p>

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
                    Dieser Bescheid ist abgelaufen. Sie können trotzdem fortfahren und die Daten
                    später aktualisieren.
                  </div>
                )}
                {freistellungStatus?.status === 'warnung' && (
                  <div
                    className="mt-2 p-3 rounded-lg text-sm"
                    style={{ background: '#fffbeb', border: '1px solid #fcd34d', color: '#92400e' }}
                  >
                    Ihr Bescheid läuft am {freistellungStatus.ablaufDatum} ab (noch{' '}
                    {freistellungStatus.restMonate} Monate).
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
              <button className="drk-btn-secondary" onClick={() => setSchritt(2)}>
                Zurück
              </button>
              <button
                className="drk-btn-primary"
                disabled={!canProceedStep3}
                onClick={() => setSchritt(4)}
              >
                Weiter
              </button>
            </div>
          </div>
        )}

        {/* Schritt 4 – Unterschrift */}
        {schritt === 4 && (
          <div className="drk-card drk-fade-in">
            <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text)' }}>
              Schritt 4: Unterschrift
            </h3>
            <p className="text-sm mb-6" style={{ color: 'var(--text-light)' }}>
              Wer unterschreibt die Zuwendungsbestätigungen?
            </p>

            <div className="space-y-4">
              <div>
                <label className="drk-label">Name des Unterzeichners *</label>
                <input
                  type="text"
                  className="drk-input"
                  value={unterschriftName}
                  onChange={(e) => setUnterschriftName(e.target.value)}
                  placeholder="z.B. Max Mustermann"
                  autoFocus
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
                Die generierten Zuwendungsbestätigungen müssen ausgedruckt und eigenhändig
                unterschrieben werden.
              </div>
            </div>

            <div className="flex justify-between mt-6">
              <button className="drk-btn-secondary" onClick={() => setSchritt(3)}>
                Zurück
              </button>
              <button
                className="drk-btn-primary"
                disabled={!canFinish || loading}
                onClick={handleRegistrierung}
              >
                {loading ? 'Wird erstellt...' : 'Registrierung abschließen'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
