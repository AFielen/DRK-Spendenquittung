'use client';

import { useState, useMemo } from 'react';
import type { Spender, Zuwendung } from '@/lib/types';
import { spenderAnzeigename } from '@/lib/types';

interface ZuwendungFormularProps {
  spenderList: Spender[];
  zuwendung?: Zuwendung;
  onSave: (zuwendung: Zuwendung) => void;
  onCancel: () => void;
}

export default function ZuwendungFormular({
  spenderList,
  zuwendung,
  onSave,
  onCancel,
}: ZuwendungFormularProps) {
  const [spenderId, setSpenderId] = useState(zuwendung?.spenderId ?? '');
  const [spenderSuche, setSpenderSuche] = useState('');
  const [art, setArt] = useState<'geld' | 'sach'>(zuwendung?.art ?? 'geld');
  const [verwendung, setVerwendung] = useState<'spende' | 'mitgliedsbeitrag'>(
    zuwendung?.verwendung ?? 'spende'
  );

  // Geld
  const [betrag, setBetrag] = useState(zuwendung?.betrag?.toString() ?? '');
  const [datum, setDatum] = useState(zuwendung?.datum ?? new Date().toISOString().split('T')[0]);
  const [zahlungsart, setZahlungsart] = useState(zuwendung?.zahlungsart ?? '');
  const [verzicht, setVerzicht] = useState(zuwendung?.verzicht ?? false);

  // Sach
  const [sachBezeichnung, setSachBezeichnung] = useState(zuwendung?.sachBezeichnung ?? '');
  const [sachAlter, setSachAlter] = useState(zuwendung?.sachAlter ?? '');
  const [sachZustand, setSachZustand] = useState(zuwendung?.sachZustand ?? '');
  const [sachKaufpreis, setSachKaufpreis] = useState(zuwendung?.sachKaufpreis?.toString() ?? '');
  const [sachWert, setSachWert] = useState(zuwendung?.sachWert?.toString() ?? '');
  const [sachHerkunft, setSachHerkunft] = useState<Zuwendung['sachHerkunft']>(
    zuwendung?.sachHerkunft ?? 'privatvermoegen'
  );
  const [sachWertermittlung, setSachWertermittlung] = useState(zuwendung?.sachWertermittlung ?? '');
  const [sachEntnahmewert, setSachEntnahmewert] = useState(
    zuwendung?.sachEntnahmewert?.toString() ?? ''
  );
  const [sachUmsatzsteuer, setSachUmsatzsteuer] = useState(
    zuwendung?.sachUmsatzsteuer?.toString() ?? ''
  );
  const [sachUnterlagenVorhanden, setSachUnterlagenVorhanden] = useState(
    zuwendung?.sachUnterlagenVorhanden ?? false
  );

  const filteredSpender = useMemo(() => {
    if (!spenderSuche) return spenderList;
    const q = spenderSuche.toLowerCase();
    return spenderList.filter(
      (s) => spenderAnzeigename(s).toLowerCase().includes(q) || (s.firmenname && s.firmenname.toLowerCase().includes(q)) || s.ort.toLowerCase().includes(q)
    );
  }, [spenderList, spenderSuche]);

  const selectedSpender = spenderList.find((s) => s.id === spenderId);
  const parsedBetrag = parseFloat(betrag) || 0;
  const parsedSachWert = parseFloat(sachWert) || 0;
  const effectiveBetrag = art === 'sach' ? parsedSachWert : parsedBetrag;

  const canSave =
    spenderId &&
    datum &&
    (art === 'geld'
      ? parsedBetrag > 0
      : sachBezeichnung.trim() && parsedSachWert > 0 && sachUnterlagenVorhanden);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;

    const now = new Date().toISOString();
    const saved: Zuwendung = {
      id: zuwendung?.id ?? crypto.randomUUID(),
      spenderId,
      art,
      verwendung,
      betrag: art === 'geld' ? parsedBetrag : parsedSachWert,
      datum,
      zahlungsart: art === 'geld' && zahlungsart ? (zahlungsart as Zuwendung['zahlungsart']) : undefined,
      verzicht,
      sachBezeichnung: art === 'sach' ? sachBezeichnung.trim() : undefined,
      sachAlter: art === 'sach' ? sachAlter.trim() || undefined : undefined,
      sachZustand: art === 'sach' ? sachZustand.trim() || undefined : undefined,
      sachKaufpreis: art === 'sach' && sachKaufpreis ? parseFloat(sachKaufpreis) : undefined,
      sachWert: art === 'sach' ? parsedSachWert : undefined,
      sachHerkunft: art === 'sach' ? sachHerkunft : undefined,
      sachWertermittlung: art === 'sach' ? sachWertermittlung.trim() || undefined : undefined,
      sachEntnahmewert:
        art === 'sach' && sachHerkunft === 'betriebsvermoegen' && sachEntnahmewert
          ? parseFloat(sachEntnahmewert)
          : undefined,
      sachUmsatzsteuer:
        art === 'sach' && sachHerkunft === 'betriebsvermoegen' && sachUmsatzsteuer
          ? parseFloat(sachUmsatzsteuer)
          : undefined,
      sachUnterlagenVorhanden: art === 'sach' ? sachUnterlagenVorhanden : false,
      bestaetigungErstellt: zuwendung?.bestaetigungErstellt ?? false,
      bestaetigungDatum: zuwendung?.bestaetigungDatum,
      bestaetigungTyp: zuwendung?.bestaetigungTyp,
      laufendeNr: zuwendung?.laufendeNr,
      erstelltAm: zuwendung?.erstelltAm ?? now,
      aktualisiertAm: now,
    };
    onSave(saved);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="fixed inset-0 bg-black/40" onClick={onCancel} />
      <div
        className="relative w-full sm:max-w-lg sm:rounded-xl rounded-t-xl p-6 max-h-[90vh] overflow-y-auto"
        style={{ background: 'var(--bg-card)' }}
      >
        <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--text)' }}>
          {zuwendung ? 'Zuwendung bearbeiten' : 'Neue Zuwendung'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Spender-Auswahl */}
          <div>
            <label className="drk-label">Spender *</label>
            <input
              type="text"
              className="drk-input mb-1"
              placeholder="Spender suchen..."
              value={spenderSuche}
              onChange={(e) => setSpenderSuche(e.target.value)}
            />
            <select
              className="drk-input"
              value={spenderId}
              onChange={(e) => setSpenderId(e.target.value)}
            >
              <option value="">– Bitte wählen –</option>
              {filteredSpender.map((s) => (
                <option key={s.id} value={s.id}>
                  {spenderAnzeigename(s)} ({s.plz} {s.ort})
                </option>
              ))}
            </select>
            {selectedSpender && (
              <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                {selectedSpender.strasse}, {selectedSpender.plz} {selectedSpender.ort}
              </div>
            )}
          </div>

          {/* Art-Toggle */}
          <div>
            <label className="drk-label">Art der Zuwendung</label>
            <div className="flex gap-0 mt-1">
              <button
                type="button"
                className="flex-1 py-2 px-4 text-sm font-semibold rounded-l-lg transition-colors"
                style={{
                  background: art === 'geld' ? 'var(--drk)' : 'var(--bg)',
                  color: art === 'geld' ? '#fff' : 'var(--text)',
                  border: '1px solid var(--border)',
                }}
                onClick={() => setArt('geld')}
              >
                Geldspende
              </button>
              <button
                type="button"
                className="flex-1 py-2 px-4 text-sm font-semibold rounded-r-lg transition-colors"
                style={{
                  background: art === 'sach' ? 'var(--drk)' : 'var(--bg)',
                  color: art === 'sach' ? '#fff' : 'var(--text)',
                  border: '1px solid var(--border)',
                }}
                onClick={() => setArt('sach')}
              >
                Sachspende
              </button>
            </div>
          </div>

          {art === 'geld' ? (
            <>
              <div>
                <label className="drk-label">Betrag (€) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="drk-input"
                  value={betrag}
                  onChange={(e) => setBetrag(e.target.value)}
                />
              </div>

              <div>
                <label className="drk-label">Datum *</label>
                <input
                  type="date"
                  className="drk-input"
                  value={datum}
                  onChange={(e) => setDatum(e.target.value)}
                />
              </div>

              <div>
                <label className="drk-label">Verwendung</label>
                <div className="flex gap-4 mt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="verwendung"
                      checked={verwendung === 'spende'}
                      onChange={() => setVerwendung('spende')}
                    />
                    <span className="text-sm" style={{ color: 'var(--text)' }}>Spende</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="verwendung"
                      checked={verwendung === 'mitgliedsbeitrag'}
                      onChange={() => setVerwendung('mitgliedsbeitrag')}
                    />
                    <span className="text-sm" style={{ color: 'var(--text)' }}>Mitgliedsbeitrag</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="drk-label">Zahlungsart (optional)</label>
                <select
                  className="drk-input"
                  value={zahlungsart}
                  onChange={(e) => setZahlungsart(e.target.value)}
                >
                  <option value="">– Keine Angabe –</option>
                  <option value="ueberweisung">Überweisung</option>
                  <option value="bar">Bar</option>
                  <option value="lastschrift">Lastschrift</option>
                  <option value="paypal">PayPal</option>
                  <option value="sonstige">Sonstige</option>
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={verzicht}
                    onChange={(e) => setVerzicht(e.target.checked)}
                  />
                  <span className="text-sm" style={{ color: 'var(--text)' }}>
                    Verzicht auf Erstattung von Aufwendungen
                  </span>
                </label>
              </div>

              {verzicht && (
                <div
                  className="p-3 rounded-lg text-sm"
                  style={{ background: '#fffbeb', border: '1px solid #fcd34d', color: '#92400e' }}
                >
                  ⚠️ Ein Aufwandsverzicht ist nur steuerlich abziehbar, wenn der Anspruch auf
                  Erstattung VOR der Tätigkeit rechtswirksam eingeräumt wurde (z.B. durch Satzung,
                  Vorstandsbeschluss oder Vertrag) und der Verzicht zeitnah erfolgt. Stellen Sie
                  sicher, dass die entsprechenden Grundlagen dokumentiert vorliegen.
                </div>
              )}
            </>
          ) : (
            <>
              <div>
                <label className="drk-label">Bezeichnung des Gegenstands *</label>
                <input
                  type="text"
                  className="drk-input"
                  value={sachBezeichnung}
                  onChange={(e) => setSachBezeichnung(e.target.value)}
                  placeholder="z.B. Laptop Dell Latitude 5520"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="drk-label">Alter</label>
                  <input
                    type="text"
                    className="drk-input"
                    value={sachAlter}
                    onChange={(e) => setSachAlter(e.target.value)}
                    placeholder="z.B. ca. 3 Jahre"
                  />
                </div>
                <div>
                  <label className="drk-label">Zustand</label>
                  <input
                    type="text"
                    className="drk-input"
                    value={sachZustand}
                    onChange={(e) => setSachZustand(e.target.value)}
                    placeholder="z.B. gut erhalten"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="drk-label">Historischer Kaufpreis (€, optional)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="drk-input"
                    value={sachKaufpreis}
                    onChange={(e) => setSachKaufpreis(e.target.value)}
                  />
                </div>
                <div>
                  <label className="drk-label">Angesetzter Wert (€) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="drk-input"
                    value={sachWert}
                    onChange={(e) => setSachWert(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="drk-label">Datum *</label>
                <input
                  type="date"
                  className="drk-input"
                  value={datum}
                  onChange={(e) => setDatum(e.target.value)}
                />
              </div>

              <div>
                <label className="drk-label">Herkunft</label>
                <div className="space-y-2 mt-1">
                  {(
                    [
                      ['privatvermoegen', 'Privatvermögen'],
                      ['betriebsvermoegen', 'Betriebsvermögen'],
                      ['keine_angabe', 'Keine Angabe des Zuwendenden'],
                    ] as const
                  ).map(([value, label]) => (
                    <label key={value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="herkunft"
                        checked={sachHerkunft === value}
                        onChange={() => setSachHerkunft(value)}
                      />
                      <span className="text-sm" style={{ color: 'var(--text)' }}>{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {sachHerkunft === 'betriebsvermoegen' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="drk-label">Entnahmewert (€)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="drk-input"
                      value={sachEntnahmewert}
                      onChange={(e) => setSachEntnahmewert(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="drk-label">Umsatzsteuer (€)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="drk-input"
                      value={sachUmsatzsteuer}
                      onChange={(e) => setSachUmsatzsteuer(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="drk-label">Unterlagen zur Wertermittlung</label>
                <input
                  type="text"
                  className="drk-input"
                  value={sachWertermittlung}
                  onChange={(e) => setSachWertermittlung(e.target.value)}
                  placeholder="z.B. Rechnung vom 15.03.2024"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sachUnterlagenVorhanden}
                    onChange={(e) => setSachUnterlagenVorhanden(e.target.checked)}
                  />
                  <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                    Geeignete Unterlagen zur Wertermittlung liegen vor *
                  </span>
                </label>
                {!sachUnterlagenVorhanden && (
                  <div className="text-xs mt-1" style={{ color: '#dc2626' }}>
                    Diese Bestätigung ist Pflicht, um die Zuwendung speichern zu können.
                  </div>
                )}
              </div>

              <div
                className="p-3 rounded-lg text-sm"
                style={{ background: '#eff6ff', border: '1px solid #93c5fd', color: '#1e40af' }}
              >
                📋 Die Wertermittlungsunterlagen (z.B. Originalrechnung, Gutachten,
                Zeitwertberechnung) müssen dem Doppel der Zuwendungsbestätigung in Ihrer
                Vereinsakte zwingend beigefügt werden (BMF Nr. 6).
              </div>
            </>
          )}

          {effectiveBetrag > 0 && effectiveBetrag <= 300 && (
            <div
              className="p-3 rounded-lg text-sm"
              style={{ background: '#eff6ff', border: '1px solid #93c5fd', color: '#1e40af' }}
            >
              ℹ️ Für Zuwendungen bis 300 € kann der Spender den Spendenabzug auch mit einem
              Kontoauszug + vereinfachtem Nachweis belegen. Sie können trotzdem eine volle
              Zuwendungsbestätigung erstellen.
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="drk-btn-secondary" onClick={onCancel}>
              Abbrechen
            </button>
            <button type="submit" className="drk-btn-primary" disabled={!canSave}>
              Speichern
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
