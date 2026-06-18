const DEFAULT_TENANT = process.env.NEXT_PUBLIC_DEFAULT_TENANT ?? 'moh';

export function getTenantSlug(): string {
  if (typeof window === 'undefined') return DEFAULT_TENANT;

  try {
    const hostname = window.location.hostname;
    const parts = hostname.split('.');

    if (parts.length >= 3 && parts[0] !== 'www' && parts[0] !== 'admin') {
      return parts[0];
    }

    return DEFAULT_TENANT;
  } catch {
    return DEFAULT_TENANT;
  }
}
