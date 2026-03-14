'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-focus first code input
  useEffect(() => {
    if (step === 'code' && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [step]);

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Fehler beim Senden.');
        return;
      }

      setStep('code');
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

    // Auto-advance
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    if (newCode.every((d) => d !== '')) {
      submitCode(newCode.join(''));
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
      submitCode(pasted);
    }
  }

  async function submitCode(fullCode: string) {
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: fullCode }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Ungültiger Code.');
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
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
      className="min-h-[calc(100vh-200px)] flex items-center justify-center py-8 px-4"
      style={{ background: 'var(--bg)' }}
    >
      <div className="drk-card drk-fade-in max-w-sm w-full text-center">
        <div className="mb-6">
          <Image src="/logo.png" alt="DRK Logo" width={56} height={56} className="mx-auto mb-3" />
          <h2 className="text-xl font-bold" style={{ color: 'var(--text)' }}>
            Anmelden
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-light)' }}>
            DRK Spendenquittung
          </p>
        </div>

        {error && (
          <div
            className="p-3 rounded-lg text-sm mb-4 text-left"
            style={{ background: 'var(--drk-bg)', color: 'var(--drk)' }}
          >
            {error}
          </div>
        )}

        {step === 'email' && (
          <form onSubmit={handleSendCode}>
            <label className="drk-label text-left">E-Mail-Adresse</label>
            <input
              type="email"
              className="drk-input mb-4"
              placeholder="name@drk-verband.de"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              autoComplete="email"
            />
            <button type="submit" className="drk-btn-primary w-full" disabled={loading}>
              {loading ? 'Sende...' : 'Anmeldecode senden'}
            </button>
          </form>
        )}

        {step === 'code' && (
          <div>
            <p className="text-sm mb-4" style={{ color: 'var(--text-light)' }}>
              Wir haben einen 6-stelligen Code an <strong>{email}</strong> gesendet.
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

            {loading && (
              <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
                Wird geprüft...
              </p>
            )}

            <button
              type="button"
              className="text-sm underline"
              style={{ color: 'var(--text-light)' }}
              onClick={() => {
                setStep('email');
                setCode(['', '', '', '', '', '']);
                setError('');
              }}
            >
              Andere E-Mail verwenden
            </button>
          </div>
        )}

        <div className="mt-6 text-sm" style={{ color: 'var(--text-light)' }}>
          Noch kein Konto?{' '}
          <Link href="/registrierung" className="underline font-semibold" style={{ color: 'var(--drk)' }}>
            Verband registrieren
          </Link>
        </div>
      </div>
    </div>
  );
}
