/**
 * Validiert DRK-E-Mail-Domains (@drk-*.de)
 */

const DRK_EMAIL_REGEX = /^[^@]+@drk-[a-z0-9-]+\.de$/i;

export const DRK_DOMAIN_HINT = '@drk-*.de';

export function isValidDrkEmail(email: string): boolean {
  return DRK_EMAIL_REGEX.test(email.trim());
}
