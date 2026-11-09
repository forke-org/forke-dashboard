/**
 * @fileoverview Forke Platform
 * @copyright (c) 2026 Forke Inc. (https://www.forke.space/)
 *
 * Source-Available License (Non-Commercial / Fair Source).
 * This source code is open for inspection, learning, and personal development.
 * Commercial use, hosting, or resale as a paid service without an explicit
 * commercial license from Forke Inc. is strictly prohibited.
 */

// Server-only helper (NOT a 'use server' action): only the sign-in callback
// may award streak XP, so browsers cannot call it for arbitrary users.

import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { isConsecutiveDay, isAlreadyLoggedInToday } from '@/lib/utils/streak'
import { getStreakXp, getLevelFromXp } from '@/lib/utils/xp'

export async function processLoginStreak(userId: string) {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) })
  if (!user) return

  const now = new Date()

  // Already logged in today — do nothing
  if (user.lastLoginAt && isAlreadyLoggedInToday(user.lastLoginAt, now)) return

  let newStreak = 1
  if (user.lastLoginAt && isConsecutiveDay(user.lastLoginAt, now)) {
    newStreak = (user.currentStreak ?? 0) + 1
  }

  const xpGained = getStreakXp(newStreak)
  const newTotalXp = (user.xp ?? 0) + xpGained
  const newLevel = getLevelFromXp(newTotalXp)

  await db
    .update(users)
    .set({
      lastLoginAt: now,
      currentStreak: newStreak,
      xp: newTotalXp,
      level: newLevel,
    })
    .where(eq(users.id, userId))

  // Return metadata so the client can show a streak toast if needed
  return { xpGained, newStreak, leveledUp: newLevel > (user.level ?? 1), newLevel }
}
