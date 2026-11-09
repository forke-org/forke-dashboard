/**
 * @fileoverview Forke Platform
 * @copyright (c) 2026 Forke Inc. (https://www.forke.space/)
 *
 * Source-Available License (Non-Commercial / Fair Source).
 * This source code is open for inspection, learning, and personal development.
 * Commercial use, hosting, or resale as a paid service without an explicit
 * commercial license from Forke Inc. is strictly prohibited.
 */

import { createHmac, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'

// The waitlist bypass cookie is a signed, expiring token ("<expiry>.<hmac>"),
// shared by forke-marketing and forke-dashboard via SITE_ACCESS_SECRET. A
// hand-written cookie like site_access=granted no longer grants anything.
export const SITE_ACCESS_DAYS = 30

function sign(payload: string): string {
  const secret = process.env.SITE_ACCESS_SECRET
  if (!secret) throw new Error('SITE_ACCESS_SECRET is not configured')
  return createHmac('sha256', secret).update(`site_access:${payload}`).digest('base64url')
}

export function issueSiteAccessToken(): string {
  const exp = String(Math.floor(Date.now() / 1000) + SITE_ACCESS_DAYS * 86400)
  return `${exp}.${sign(exp)}`
}

export function isValidSiteAccessToken(value: string | null | undefined): boolean {
  if (!value) return false
  const [exp, mac] = value.split('.')
  if (!exp || !mac || !/^\d+$/.test(exp) || Number(exp) < Date.now() / 1000) return false
  try {
    const a = Buffer.from(sign(exp))
    const b = Buffer.from(mac)
    return a.length === b.length && timingSafeEqual(a, b)
  } catch {
    return false
  }
}

export async function hasSiteAccess(): Promise<boolean> {
  return isValidSiteAccessToken((await cookies()).get('site_access')?.value)
}

// Simple per-IP limiter for bypass password attempts (per process).
const attempts = new Map<string, { count: number; resetAt: number }>()
export function allowBypassAttempt(ip: string): boolean {
  const now = Date.now()
  const entry = attempts.get(ip)
  if (!entry || entry.resetAt < now) {
    attempts.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 })
    return true
  }
  entry.count++
  return entry.count <= 5
}
