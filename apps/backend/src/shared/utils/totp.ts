import { createHmac, randomBytes } from 'crypto';

const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function generateTotpSecret(): string {
  const bytes = randomBytes(20);
  let result = '';
  for (let i = 0; i < bytes.length; i++) {
    result += BASE32_CHARS[bytes[i] % 32];
  }
  return result;
}

function base32Decode(encoded: string): Buffer {
  const lookup: Record<string, number> = {};
  for (let i = 0; i < BASE32_CHARS.length; i++) {
    lookup[BASE32_CHARS[i]] = i;
  }

  const bits: number[] = [];
  for (const char of encoded.toUpperCase()) {
    if (lookup[char] === undefined) continue;
    const val = lookup[char];
    for (let i = 4; i >= 0; i--) {
      bits.push((val >> i) & 1);
    }
  }

  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j++) {
      byte = (byte << 1) | bits[i + j];
    }
    bytes.push(byte);
  }

  return Buffer.from(bytes);
}

export function generateTotp(secret: string, timeStep = 30): string {
  const time = Math.floor(Date.now() / 1000 / timeStep);
  const timeBuffer = Buffer.alloc(8);
  timeBuffer.writeBigUInt64BE(BigInt(time));

  const key = base32Decode(secret);
  const hmac = createHmac('sha1', key).update(timeBuffer).digest();

  const offset = hmac[hmac.length - 1] & 0xf;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  return (code % 1000000).toString().padStart(6, '0');
}

export function verifyTotp(secret: string, token: string, window = 1): boolean {
  const timeStep = 30;
  const currentTime = Math.floor(Date.now() / 1000 / timeStep);

  for (let i = -window; i <= window; i++) {
    const time = currentTime + i;
    const timeBuffer = Buffer.alloc(8);
    timeBuffer.writeBigUInt64BE(BigInt(time));

    const key = base32Decode(secret);
    const hmac = createHmac('sha1', key).update(timeBuffer).digest();

    const offset = hmac[hmac.length - 1] & 0xf;
    const code =
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff);

    const expected = (code % 1000000).toString().padStart(6, '0');
    if (expected === token) return true;
  }

  return false;
}

export function generateTotpUri(email: string, issuer: string, secret: string): string {
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`;
}
