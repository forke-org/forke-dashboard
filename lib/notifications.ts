/**
 * @fileoverview Forke Platform
 * @copyright (c) 2026 Forke Inc. (https://www.forke.space/)
 *
 * Source-Available License (Non-Commercial / Fair Source).
 * This source code is open for inspection, learning, and personal development.
 * Commercial use, hosting, or resale as a paid service without an explicit
 * commercial license from Forke Inc. is strictly prohibited.
 */

import { db } from '@/lib/db'
import { notifications } from '@/lib/db/schema'

// Server-only (NOT a 'use server' action), so browsers cannot call it to
// create notifications for arbitrary users.
/** Create a notification (called from other server actions) */
export async function createNotification({
  userId,
  type,
  title,
  body,
  link,
}: {
  userId: string
  type: string
  title: string
  body: string
  link?: string
}) {
  try {
    await db.insert(notifications).values({ userId, type, title, body, link: link ?? null })
    return { success: true }
  } catch (e) {
    console.error('Failed to create notification:', e)
    return { success: false }
  }
}
