/**
 * @fileoverview Forke Platform
 * @copyright (c) 2026 Forke Inc. (https://www.forke.space/)
 *
 * Source-Available License (Non-Commercial / Fair Source).
 * This source code is open for inspection, learning, and personal development.
 * Commercial use, hosting, or resale as a paid service without an explicit
 * commercial license from Forke Inc. is strictly prohibited.
 */

import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { db, sandboxRepos, sandboxUsers } from '@/lib/db'
import { decryptToken, encryptToken, hashToken } from '@/lib/token-crypto'

// Identity for the sandbox / review APIs comes ONLY from the httpOnly
// forke_access_token cookie, matched against the stored token hash. Never
// trust a username or role sent in the request body or query string.

export type SandboxRole = 'owner' | 'developer'

export interface SandboxUser {
  id: string
  githubId: number
  username: string
  role: string
  token: string
}

export class SandboxAuthError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

export async function getSandboxUser(): Promise<SandboxUser | null> {
  const token = (await cookies()).get('forke_access_token')?.value
  if (!token) return null
  const rows = await db
    .select()
    .from(sandboxUsers)
    .where(eq(sandboxUsers.accessTokenHash, hashToken(token)))
    .limit(1)
  const row = rows[0]
  if (!row) return null
  return { id: row.id, githubId: row.githubId, username: row.username, role: row.role, token }
}

export async function requireSandboxUser(role?: SandboxRole): Promise<SandboxUser> {
  const user = await getSandboxUser()
  if (!user) throw new SandboxAuthError(401, 'Please sign in with GitHub again.')
  if (role && user.role !== role) throw new SandboxAuthError(403, `Only ${role}s can do this.`)
  return user
}

/** The sandbox repo row, only if it belongs to this owner. */
export async function requireOwnedSandbox(user: SandboxUser, sandboxRepo: string) {
  const rows = await db
    .select()
    .from(sandboxRepos)
    .where(and(eq(sandboxRepos.sandboxRepo, sandboxRepo), eq(sandboxRepos.ownerId, user.id)))
    .limit(1)
  if (!rows[0]) throw new SandboxAuthError(404, 'Sandbox not found.')
  return rows[0]
}

/** Decrypted token of the owner of a sandbox repo (for server-side GitHub calls). */
export async function ownerTokenFor(ownerId: string): Promise<string | null> {
  const rows = await db.select().from(sandboxUsers).where(eq(sandboxUsers.id, ownerId)).limit(1)
  return rows[0] ? decryptToken(rows[0].accessToken) : null
}

/** Decrypted stored token for a GitHub username with a given role, if any. */
export async function storedTokenFor(username: string, role: SandboxRole): Promise<string | null> {
  const rows = await db
    .select()
    .from(sandboxUsers)
    .where(and(eq(sandboxUsers.username, username), eq(sandboxUsers.role, role)))
    .limit(1)
  return rows[0] ? decryptToken(rows[0].accessToken) : null
}

/** Insert or update a sandbox user, always storing the token encrypted + hashed. */
export async function upsertSandboxUser(u: { githubId: number; username: string; token: string; role: string }) {
  const values = {
    username: u.username,
    accessToken: encryptToken(u.token),
    accessTokenHash: hashToken(u.token),
    role: u.role,
  }
  await db
    .insert(sandboxUsers)
    .values({ githubId: u.githubId, ...values })
    .onConflictDoUpdate({ target: sandboxUsers.githubId, set: values })
}

export function sandboxAuthResponse(err: unknown) {
  if (err instanceof SandboxAuthError) {
    return NextResponse.json({ error: err.message }, { status: err.status })
  }
  return null
}

/**
 * The signed-in owner. If the cookie holds a valid GitHub token that is not
 * registered yet (e.g. the database was reset), register it as an owner after
 * asking GitHub who the token belongs to.
 */
export async function requireOwnerFromCookie(): Promise<SandboxUser> {
  const known = await getSandboxUser()
  if (known) {
    if (known.role !== 'owner') throw new SandboxAuthError(403, 'Only owners can do this.')
    return known
  }
  const token = (await cookies()).get('forke_access_token')?.value
  if (!token) throw new SandboxAuthError(401, 'Please sign in with GitHub again.')
  const res = await fetch('https://api.github.com/user', {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'User-Agent': 'Forke-Sandbox/1.0' },
  })
  if (!res.ok) throw new SandboxAuthError(401, 'Your GitHub session expired. Please sign in again.')
  const gh = await res.json()
  if (!gh?.id || !gh?.login) throw new SandboxAuthError(401, 'Could not verify your GitHub account.')
  await upsertSandboxUser({ githubId: gh.id, username: gh.login, token, role: 'owner' })
  const user = await getSandboxUser()
  if (!user || user.role !== 'owner') throw new SandboxAuthError(403, 'Only owners can do this.')
  return user
}
