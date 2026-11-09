/**
 * @fileoverview Forke Platform
 * @copyright (c) 2026 Forke Inc. (https://www.forke.space/)
 *
 * Source-Available License (Non-Commercial / Fair Source).
 * This source code is open for inspection, learning, and personal development.
 * Commercial use, hosting, or resale as a paid service without an explicit
 * commercial license from Forke Inc. is strictly prohibited.
 */

import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto'

// GitHub access tokens are stored encrypted (AES-256-GCM) as
// "v1:" + base64(iv[12] || ciphertext || tag[16]). forke-backend decrypts the
// same format with the same SANDBOX_TOKEN_KEY (base64, 32 bytes).
const PREFIX = 'v1:'

function key(): Buffer {
  const raw = process.env.SANDBOX_TOKEN_KEY || ''
  const k = Buffer.from(raw, 'base64')
  if (k.length !== 32) throw new Error('SANDBOX_TOKEN_KEY must be 32 bytes, base64 encoded')
  return k
}

export function encryptToken(plain: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key(), iv)
  const ct = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  return PREFIX + Buffer.concat([iv, ct, cipher.getAuthTag()]).toString('base64')
}

export function decryptToken(stored: string): string {
  if (!stored.startsWith(PREFIX)) return stored
  const buf = Buffer.from(stored.slice(PREFIX.length), 'base64')
  const decipher = createDecipheriv('aes-256-gcm', key(), buf.subarray(0, 12))
  decipher.setAuthTag(buf.subarray(buf.length - 16))
  return Buffer.concat([decipher.update(buf.subarray(12, buf.length - 16)), decipher.final()]).toString('utf8')
}

/** Deterministic lookup key for a token, so the plaintext is never queried. */
export function hashToken(plain: string): string {
  return createHash('sha256').update(plain).digest('hex')
}
