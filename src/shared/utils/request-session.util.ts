const MAX_COOKIE_CHUNK = 8;

const SESSION_COOKIE_NAME = [
  'better-auth.session_token',
  '__Secure-better-auth.sesstion_token',
];

export function extractBearerToken(
  header: Record<string, string | string[] | undefined>,
): string | null {
  const raw = header['authorization'] || header['Authorization'];
  const v = Array.isArray(raw) ? raw[0] : raw;

  if (!v || !v.toLowerCase().startsWith('bearer ')) return null;

  const token = v.slice(7).trim();

  try {
    return decodeURIComponent(token);
  } catch {
    return token;
  }
}

function cookieValue(header: string, name: string): string | null {
  const parts = header.split(';');

  for (const part of parts) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;

    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();

    if (key === name) {
      return value;
    }
  }
  return null;
}

function readSessionCookieValue(
  header: string,
  baseName: string,
): string | null {
  const whole = cookieValue(header, baseName);
  if (whole) return whole;

  const chunks: string[] = [];
  for (let i = 0; i < MAX_COOKIE_CHUNK; i++) {
    const chunk = cookieValue(header, `${baseName}.${i}`);
    if (!chunk) break;
    chunks.push(chunk);
  }

  if (chunks.length === 0) return null;

  return chunks.join('');
}

function stripSignature(value: string): string {
  const lastDotIndex = value.lastIndexOf('.');

  return lastDotIndex > 0 ? value.slice(0, lastDotIndex) : value;
}

export function extractSessionTokenFromHeaders(
  headers: Record<string, string | string[] | undefined>,
): string | null {
  const bearer = extractBearerToken(headers);
  if (bearer) return stripSignature(bearer);

  const rawCookie = headers['cookie'] || headers['Cookie'];
  const cookieHeader = Array.isArray(rawCookie) ? rawCookie[0] : rawCookie;

  if (cookieHeader) {
    for (const name of SESSION_COOKIE_NAME) {
      const value = readSessionCookieValue(cookieHeader, name);
      if (value) return stripSignature(value);
    }
  }
  return null;
}
