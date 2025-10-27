export function apiBaseUrl(): string {
  const defaultBase = '/api';

  if (typeof window === 'undefined' || !window.location) {
    return defaultBase;
  }

  const { origin, port } = window.location;

  if (port === '4200') {
    return 'http://localhost:8080/api';
  }

  if (origin) {
    return `${origin.replace(/\/$/, '')}/api`;
  }

  return defaultBase;
}
