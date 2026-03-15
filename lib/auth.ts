import { getIronSession, SessionOptions } from 'iron-session';
import { cookies } from 'next/headers';

export interface SessionData {
  nutzerId: string;
  kreisverbandId: string;
  email: string;
  name: string;
  rolle: string;
}

function getSessionOptions(): SessionOptions {
  const pw = process.env.IRON_SESSION_PASSWORD;
  if (!pw && process.env.NODE_ENV === 'production') {
    throw new Error('IRON_SESSION_PASSWORD muss in Production gesetzt sein.');
  }
  return {
    password: pw || 'mindestens-32-zeichen-langes-passwort-fuer-dev-modus',
    cookieName: 'drk-sq-session',
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      maxAge: 60 * 60 * 24 * 7, // 7 Tage
    },
  };
}

export function requireSchreibrecht(session: SessionData): boolean {
  return session.rolle === 'admin' || session.rolle === 'schatzmeister';
}

export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, getSessionOptions());

  if (!session.nutzerId) {
    return null;
  }

  return {
    nutzerId: session.nutzerId,
    kreisverbandId: session.kreisverbandId,
    email: session.email,
    name: session.name,
    rolle: session.rolle,
  };
}

export async function createSession(data: SessionData): Promise<void> {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, getSessionOptions());
  session.nutzerId = data.nutzerId;
  session.kreisverbandId = data.kreisverbandId;
  session.email = data.email;
  session.name = data.name;
  session.rolle = data.rolle;
  await session.save();
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, getSessionOptions());
  session.destroy();
}
