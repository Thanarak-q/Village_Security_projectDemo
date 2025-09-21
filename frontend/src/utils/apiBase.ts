const resolveApiBase = () => {
  const candidates = [
    process.env.NEXT_PUBLIC_API_URL,
    process.env.NEXT_PUBLIC_BACKEND_URL,
    process.env.BACKEND_URL
  ];

  for (const candidate of candidates) {
    const trimmed = candidate?.trim();
    if (trimmed) {
      return trimmed.replace(/\/+$/, '');
    }
  }

  return '';
};

const API_BASE = resolveApiBase();

const buildInternalOrigin = () => {
  const protocol = process.env.INTERNAL_API_PROTOCOL || 'http';
  const host = process.env.INTERNAL_API_HOST || '127.0.0.1';
  const port = process.env.INTERNAL_API_PORT || process.env.PORT || '3000';
  const portSegment = port ? `:${port}` : '';
  return `${protocol}://${host}${portSegment}`;
};

export const getApiBaseUrl = () => API_BASE;

export const buildApiUrl = (path: string): string => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  if (API_BASE) {
    return `${API_BASE}${normalizedPath}`;
  }

  if (typeof window === 'undefined') {
    return `${buildInternalOrigin()}${normalizedPath}`;
  }

  return normalizedPath;
};
