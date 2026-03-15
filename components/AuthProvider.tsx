'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';

interface NutzerData {
  id: string;
  email: string;
  name: string;
  rolle: string;
  isSuperadmin?: boolean;
}

interface KreisverbandData {
  id: string;
  slug: string;
  name: string;
  strasse: string;
  plz: string;
  ort: string;
  vereinsregister: string | null;
  logoBase64: string | null;
  finanzamt: string;
  steuernummer: string;
  freistellungsart: string;
  freistellungDatum: string;
  letzterVZ: string | null;
  beguenstigteZwecke: string[];
  unterschriftName: string;
  unterschriftFunktion: string;
  laufendeNrFormat: string;
}

interface AuthContextType {
  nutzer: NutzerData | null;
  kreisverband: KreisverbandData | null;
  loading: boolean;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  nutzer: null,
  kreisverband: null,
  loading: true,
  logout: async () => {},
  refresh: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [nutzer, setNutzer] = useState<NutzerData | null>(null);
  const [kreisverband, setKreisverband] = useState<KreisverbandData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setNutzer(data.nutzer);
        setKreisverband(data.kreisverband);
      } else {
        setNutzer(null);
        setKreisverband(null);
      }
    } catch {
      setNutzer(null);
      setKreisverband(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    setNutzer(null);
    setKreisverband(null);
    window.location.href = '/login';
  }, []);

  return (
    <AuthContext value={{ nutzer, kreisverband, loading, logout, refresh: fetchMe }}>
      {children}
    </AuthContext>
  );
}
