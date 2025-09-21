function normalizePath(path: string): string {
  const trimmed = path.trim();
  if (!trimmed) return '/ws';
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

const DEFAULT_WS_PATH = normalizePath(process.env.NEXT_PUBLIC_WS_PATH || '/ws');
const DEFAULT_DEV_PORT = (process.env.NEXT_PUBLIC_WS_DEV_PORT || '3002').trim();

function buildFromBaseUrl(rawUrl: string | undefined | null): string | null {
  if (!rawUrl) return null;

  try {
    const base = new URL(rawUrl);
    const protocol = base.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${base.host}${DEFAULT_WS_PATH}`;
  } catch {
    return null;
  }
}

export function resolveWebSocketUrl(): string {
  const explicit = (process.env.NEXT_PUBLIC_WS_URL || '').trim();
  if (explicit) {
    return explicit;
  }

  const derivedFromApi = buildFromBaseUrl(process.env.NEXT_PUBLIC_API_URL);
  if (derivedFromApi) {
    return derivedFromApi;
  }

  const derivedFromBackend = buildFromBaseUrl(process.env.NEXT_PUBLIC_BACKEND_URL);
  if (derivedFromBackend) {
    return derivedFromBackend;
  }

  if (typeof window !== 'undefined') {
    const { protocol, hostname, port } = window.location;
    const secure = protocol === 'https:';

    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `${secure ? 'wss:' : 'ws:'}//${hostname}:${DEFAULT_DEV_PORT}${DEFAULT_WS_PATH}`;
    }

    const portSuffix = port ? `:${port}` : '';
    return `${secure ? 'wss:' : 'ws:'}//${hostname}${portSuffix}${DEFAULT_WS_PATH}`;
  }

  return `ws://localhost:${DEFAULT_DEV_PORT}${DEFAULT_WS_PATH}`;
}
