// Session Utility for Cookie-Based Authentication
// Edge Runtime and Node.js Compatible (Standard Web Crypto API)

const SESSION_SECRET = process.env.SESSION_SECRET || 'sanadokom-cod-platform-security-secret-2026-key';
export const SESSION_COOKIE_NAME = 'sanadokom_session';

function base64UrlEncode(str: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(str).toString('base64url');
  }
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64UrlDecode(str: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(str, 'base64url').toString('utf8');
  }
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return decodeURIComponent(escape(atob(base64)));
}

export async function createSessionToken(userId: string, role: string, email: string): Promise<string> {
  const payload = JSON.stringify({
    userId,
    role,
    email,
    exp: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(SESSION_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sigBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  const sigArray = Array.from(new Uint8Array(sigBuffer));
  const sigHex = sigArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  const b64Payload = base64UrlEncode(payload);

  return `${b64Payload}.${sigHex}`;
}

export async function verifySessionToken(
  token?: string | null
): Promise<{ userId: string; role: string; email: string } | null> {
  if (!token || typeof token !== 'string') return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [b64Payload, sigHex] = parts;
    const payloadStr = base64UrlDecode(b64Payload);

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(SESSION_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const sigBytes = new Uint8Array(sigHex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []);
    const isValid = await crypto.subtle.verify('HMAC', key, sigBytes, encoder.encode(payloadStr));
    if (!isValid) return null;

    const data = JSON.parse(payloadStr);
    if (!data.userId || !data.exp) return null;
    if (Date.now() > data.exp) return null;

    return {
      userId: data.userId,
      role: data.role,
      email: data.email,
    };
  } catch {
    return null;
  }
}
