export type ApiKeyScope =
  | 'spender:read'
  | 'spender:write'
  | 'zuwendungen:read'
  | 'zuwendungen:write'
  | 'kreisverband:read';

export const ALL_SCOPES: ApiKeyScope[] = [
  'spender:read',
  'spender:write',
  'zuwendungen:read',
  'zuwendungen:write',
  'kreisverband:read',
];

export const SCOPE_LABELS: Record<ApiKeyScope, { de: string; en: string }> = {
  'spender:read': { de: 'Spender lesen', en: 'Read donors' },
  'spender:write': { de: 'Spender bearbeiten', en: 'Write donors' },
  'zuwendungen:read': { de: 'Zuwendungen lesen', en: 'Read donations' },
  'zuwendungen:write': { de: 'Zuwendungen bearbeiten', en: 'Write donations' },
  'kreisverband:read': { de: 'Vereinsdaten lesen', en: 'Read organization' },
};

export interface ApiKeyContext {
  kreisverbandId: string;
  nutzerId: string;
  berechtigungen: string[];
}
