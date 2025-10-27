const LOCAL_API_PORT = '8080';

function resolveServerBaseUrl(): string {
  if (typeof window === 'undefined') {
    return `http://localhost:${LOCAL_API_PORT}`;
  }

  const { protocol, hostname, port } = window.location;

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `${protocol}//${hostname}:${LOCAL_API_PORT}`;
  }

  const hostWithPort = port ? `${hostname}:${port}` : hostname;

  return `${protocol}//${hostWithPort}`;
}

const SERVER_BASE_URL = resolveServerBaseUrl();

export const API_BASE_URL = `${SERVER_BASE_URL}/api`;
export const AUTH_BASE_URL = `${API_BASE_URL}/auth`;
export const DASHBOARD_STATS_URL = `${API_BASE_URL}/dashboard-stats-31477046`;
