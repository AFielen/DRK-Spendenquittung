let cachedLogoBytes: Uint8Array | null = null;

/**
 * Lädt das DRK-Kompaktlogo als Standard-Logo für Zuwendungsbestätigungen.
 * Wird einmalig geladen und dann gecacht.
 */
export async function getDefaultLogoBytes(): Promise<Uint8Array | null> {
  if (cachedLogoBytes) return cachedLogoBytes;

  try {
    const response = await fetch('/logo.png');
    if (!response.ok) return null;
    const buffer = await response.arrayBuffer();
    cachedLogoBytes = new Uint8Array(buffer);
    return cachedLogoBytes;
  } catch {
    return null;
  }
}

/**
 * Gibt die Logo-Bytes zurück: custom (base64) oder DRK-Standard-Logo.
 */
export async function getLogoBytes(logoBase64?: string | null): Promise<Uint8Array | null> {
  if (logoBase64) {
    try {
      const base64Data = logoBase64.split(',')[1];
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
    } catch {
      // Fallback to default
    }
  }
  return getDefaultLogoBytes();
}
