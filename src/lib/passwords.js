const { randomBytes, scrypt, timingSafeEqual } = require('node:crypto');
const { promisify } = require('node:util');

const derive = promisify(scrypt);
const prefix = 'scrypt-v1$';
const options = { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 };
const keySize = 64;

/** @param {unknown} value */
function validNewPassword(value) {
  return typeof value === 'string' && value.trim().length >= 12 &&
    Buffer.byteLength(value.trim(), 'utf8') <= 1024;
}

/** @param {string} password */
async function hashPassword(password) {
  const salt = randomBytes(16);
  const key = await derive(password, salt, keySize, options);
  return prefix + salt.toString('hex') + '$' + key.toString('hex');
}

/** @param {string} stored */
function isLegacyPassword(stored) {
  return !stored.startsWith(prefix);
}

/** @param {string} password @param {string} stored */
async function verifyPassword(password, stored) {
  if (isLegacyPassword(stored)) {
    const expected = Buffer.from(stored);
    const received = Buffer.from(password);
    return expected.length === received.length && timingSafeEqual(expected, received);
  }

  const parts = /^scrypt-v1\$([0-9a-f]{32})\$([0-9a-f]{128})$/.exec(stored);
  if (!parts) return false;
  const expected = Buffer.from(parts[2], 'hex');
  const received = await derive(password, Buffer.from(parts[1], 'hex'), keySize, options);
  return timingSafeEqual(expected, received);
}

module.exports = { hashPassword, isLegacyPassword, validNewPassword, verifyPassword };
