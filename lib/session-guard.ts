/**
 * @fileoverview Forke Platform
 * @copyright (c) 2026 Forke Inc. (https://www.forke.space/)
 *
 * Source-Available License (Non-Commercial / Fair Source).
 * This source code is open for inspection, learning, and personal development.
 * Commercial use, hosting, or resale as a paid service without an explicit
 * commercial license from Forke Inc. is strictly prohibited.
 */

import { auth } from '@/auth'

// Server actions are public HTTP endpoints: any argument can be forged by the
// caller. Always take the user from the signed session, and reject calls that
// claim to act for someone else.
export class NotAuthorizedError extends Error {
  constructor() {
    super('Not authorized')
  }
}

export async function sessionUserId(): Promise<string> {
  const session = await auth()
  const id = session?.user?.id
  if (!id) throw new NotAuthorizedError()
  return id
}

/** The signed-in user's id; throws if `claimedUserId` is someone else. */
export async function requireSelf(claimedUserId: string | null | undefined): Promise<string> {
  const id = await sessionUserId()
  if (claimedUserId && claimedUserId !== id) throw new NotAuthorizedError()
  return id
}
