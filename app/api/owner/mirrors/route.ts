/**
 * @fileoverview Forke Platform
 * @copyright (c) 2026 Forke Inc. (https://www.forke.space/)
 *
 * Source-Available License (Non-Commercial / Fair Source).
 * This source code is open for inspection, learning, and personal development.
 * Commercial use, hosting, or resale as a paid service without an explicit
 * commercial license from Forke Inc. is strictly prohibited.
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sandboxRepos } from '@/lib/db/schema'
import { desc, eq } from 'drizzle-orm'
import { requireSandboxUser, sandboxAuthResponse } from '@/lib/sandbox-auth'

export async function GET() {
  try {
    const owner = await requireSandboxUser('owner')
    const mirrors = await db
      .select()
      .from(sandboxRepos)
      .where(eq(sandboxRepos.ownerId, owner.id))
      .orderBy(desc(sandboxRepos.createdAt))

    return NextResponse.json(mirrors)
  } catch (error: any) {
    const denied = sandboxAuthResponse(error)
    if (denied) return denied
    console.error('Fetch mirrors error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
