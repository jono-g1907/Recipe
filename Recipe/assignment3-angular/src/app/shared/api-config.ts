const LOCAL_API_PORT = '8080';

function resolveBrowserOrigin(): string | null {
  if (typeof window === 'undefined' || !window.location) {
    return null;
  }

  const { protocol, hostname, port } = window.location;
  const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1';

  if (isLocalHost) {
    return `${protocol}//${hostname}:${LOCAL_API_PORT}`;
  }

  const hostWithPort = port ? `${hostname}:${port}` : hostname;

  return `${protocol}//${hostWithPort}`;
}

export function getApiBaseUrl(): string {
  const origin = resolveBrowserOrigin();

  if (origin) {
    return `${origin}/api`;
  }

  return '/api';
}

export function getAuthBaseUrl(): string {
  const origin = resolveBrowserOrigin();

  if (origin) {
    return `${origin}/api/auth`;
  }

  return '/api/auth';
}

export function getDashboardStatsUrl(): string {
  const origin = resolveBrowserOrigin();

  if (origin) {
    return `${origin}/api/dashboard-stats-31477046`;
  }

  return '/api/dashboard-stats-31477046';
}
