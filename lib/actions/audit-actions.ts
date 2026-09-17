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

import { db } from '@/lib/db'
import { adminAuditLog, users, subscribers, supportEnquiries, tasks, submissions } from '@/lib/db/schema'
import { desc, eq, sql } from 'drizzle-orm'

export type ActivityCategory =
  | 'admin' | 'user' | 'owner' | 'db' | 'support' | 'task' | 'system' | 'error'

export interface ActivityEvent {
  id: string
  category: ActivityCategory
  action: string
  actor: string | null
  target: string | null
  createdAt: string // ISO
  ts: number
}

// Creates the audit table on demand (matches the project's runtime-migration pattern).
export async function ensureAuditLogTable() {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "admin_audit_log" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "actor_id" uuid,
        "actor_name" text,
        "category" text NOT NULL DEFAULT 'admin',
        "action" text NOT NULL,
        "target" text,
        "metadata" jsonb,
        "created_at" timestamp NOT NULL DEFAULT now()
      );
    `)
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "admin_audit_log_created_at_idx" ON "admin_audit_log" ("created_at");
    `)
  } catch (e) {
    console.error('ensureAuditLogTable failed:', e)
  }
}

interface LogEntry {
  action: string
  category?: ActivityCategory
  target?: string | null
  metadata?: Record<string, unknown> | null
  actorName?: string | null
  actorId?: string | null
}

/** Records an admin action. Best-effort — never throws into the caller. */
export async function logAudit(entry: LogEntry) {
  try {
    await ensureAuditLogTable()
    const actorId = entry.actorId ?? null
    const actorName = entry.actorName ?? null
    await db.insert(adminAuditLog).values({
      actorId,
      actorName,
      category: entry.category ?? 'admin',
      action: entry.action,
      target: entry.target ?? null,
      metadata: entry.metadata ?? null,
    })

    // Continuous background pruning of logs older than 7 days (168 hours) - best effort
    db.delete(adminAuditLog)
      .where(sql`created_at < now() - interval '7 days'`)
      .catch((err) => console.error('Failed to auto-prune audit logs:', err))
  } catch (e) {
    console.error('logAudit failed:', e)
  }
}


const ev = (
  id: string,
  category: ActivityCategory,
  action: string,
  actor: string | null,
  target: string | null,
  createdAt: Date,
): ActivityEvent => ({
  id,
  category,
  action,
  actor,
  target,
  createdAt: createdAt.toISOString(),
  ts: createdAt.getTime(),
})

/**
 * The unified activity feed: explicitly-logged admin actions merged with
 * derived system events (signups, subscribers, enquiries, tasks…) read straight
 * from existing tables — so it reflects "everything happening" without having to
 * instrument the rest of the app.
 */
export async function getActivityFeed(opts?: { category?: ActivityCategory | 'all'; limit?: number }) {
  const limit = opts?.limit ?? 120
  const events: ActivityEvent[] = []

  try {
    await ensureAuditLogTable()

    // 1) Logged admin & system actions
    const query = db.select().from(adminAuditLog).orderBy(desc(adminAuditLog.createdAt))
    const logged = await query

    for (const r of logged) {
      events.push(ev(`log-${r.id}`, (r.category as ActivityCategory) || 'admin', r.action, r.actorName, r.target, r.createdAt))
    }

    // Filter by category if specified
    const filtered = !opts?.category || opts.category === 'all'
      ? events
      : events.filter((e) => e.category === opts.category)

    return { success: true, events: filtered.slice(0, limit) }
  } catch (e) {
    console.error('getActivityFeed failed:', e)
    return { success: false, events: [] as ActivityEvent[], error: 'Failed to load activity' }
  }
}
