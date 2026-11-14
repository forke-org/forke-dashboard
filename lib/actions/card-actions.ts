'use server'

/**
 * @fileoverview Forke Platform
 * @copyright (c) 2026 Forke Inc. (https://www.forke.space/)
 *
 * Source-Available License (Non-Commercial / Fair Source).
 * This source code is open for inspection, learning, and personal development.
 * Commercial use, hosting, or resale as a paid service without an explicit
 * commercial license from Forke Inc. is strictly prohibited.
 */

import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'

const COLORS = ['black', 'white', 'orange'] as const
const FILTERS = ['orange', 'bw', 'normal'] as const

/** Saves the signed-in user's ID card look. Only the owner can change their own card. */
export async function saveCardStyle(input: { color: string; filter: string; line: string }) {
  const session = await auth()
  if (!session?.user?.id) return { success: false as const, error: 'Not signed in' }

  const color = COLORS.find((c) => c === input.color)
  const filter = FILTERS.find((f) => f === input.filter)
  const line = String(input.line ?? '').replace(/\s+/g, ' ').trim().slice(0, 22)
  if (!color || !filter) return { success: false as const, error: 'Unknown card option' }

  await db.update(users).set({ cardStyle: { color, filter, line } }).where(eq(users.id, session.user.id))
  revalidatePath('/id-card')
  return { success: true as const }
}
