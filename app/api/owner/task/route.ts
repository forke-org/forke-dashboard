/**
 * @fileoverview Forke Platform
 * @copyright (c) 2026 Forke Inc. (https://www.forke.space/)
 *
 * Source-Available License (Non-Commercial / Fair Source).
 * This source code is open for inspection, learning, and personal development.
 * Commercial use, hosting, or resale as a paid service without an explicit
 * commercial license from Forke Inc. is strictly prohibited.
 */

/**
 * POST /api/owner/task    — Create or update task metadata for a sandbox repo
 * GET  /api/owner/task    — Fetch task metadata for a sandbox repo
 */

import { NextRequest, NextResponse } from 'next/server'
import { db, sandboxRepos } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { requireOwnedSandbox, requireSandboxUser, sandboxAuthResponse } from '@/lib/sandbox-auth'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      sandboxRepo,
      taskTitle,
      taskDescription,
      frontendStack,
      backendStack,
      allowedPaths,
      restrictedPaths,
      acceptanceCriteria,
    } = body

    // Validate required fields
    if (!sandboxRepo || !taskTitle || !taskDescription || !frontendStack || !backendStack) {
      return NextResponse.json(
        { error: 'Missing required fields: sandboxRepo, taskTitle, taskDescription, frontendStack, backendStack' },
        { status: 400 }
      )
    }

    const owner = await requireSandboxUser('owner')
    const sandboxRecord = await requireOwnedSandbox(owner, sandboxRepo)

    // Serialize arrays/text for DB storage
    const allowedPathsStr = Array.isArray(allowedPaths)
      ? allowedPaths.join('\n')
      : (allowedPaths || '')

    const restrictedPathsStr = Array.isArray(restrictedPaths)
      ? restrictedPaths.join('\n')
      : (restrictedPaths || '')

    // Update the sandbox repo record with task metadata
    await db
      .update(sandboxRepos)
      .set({
        taskTitle: taskTitle.trim(),
        taskDescription: taskDescription.trim(),
        frontendStack: frontendStack.trim(),
        backendStack: backendStack.trim(),
        allowedPaths: allowedPathsStr.trim() || null,
        restrictedPaths: restrictedPathsStr.trim() || null,
        acceptanceCriteria: acceptanceCriteria?.trim() || null,
      })
      .where(eq(sandboxRepos.id, sandboxRecord.id))

    return NextResponse.json({
      success: true,
      message: 'Task metadata saved successfully',
      sandboxRepo,
      taskTitle,
    })
  } catch (err: unknown) {
    const denied = sandboxAuthResponse(err)
    if (denied) return denied
    console.error('[API /owner/task POST] Error:', err)
    return NextResponse.json(
      { error: 'Failed to save task metadata' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const sandboxRepo = searchParams.get('sandboxRepo')

    if (!sandboxRepo) {
      return NextResponse.json({ error: 'Missing sandboxRepo parameter' }, { status: 400 })
    }

    // Task details are visible to any signed-in sandbox user (developers need
    // them to work on the task), but not to anonymous callers.
    await requireSandboxUser()
    const records = await db
      .select()
      .from(sandboxRepos)
      .where(eq(sandboxRepos.sandboxRepo, sandboxRepo))
      .limit(1)

    if (records.length === 0) {
      return NextResponse.json({ error: 'Sandbox repo not found' }, { status: 404 })
    }

    const record = records[0]

    return NextResponse.json({
      id: record.id,
      sandboxRepo: record.sandboxRepo,
      sourceRepo: record.sourceRepo,
      taskTitle: record.taskTitle,
      taskDescription: record.taskDescription,
      frontendStack: record.frontendStack,
      backendStack: record.backendStack,
      allowedPaths: record.allowedPaths,
      restrictedPaths: record.restrictedPaths,
      acceptanceCriteria: record.acceptanceCriteria,
      hasTaskMetadata: !!(record.taskTitle && record.taskDescription),
      createdAt: record.createdAt,
    })
  } catch (err: unknown) {
    const denied = sandboxAuthResponse(err)
    if (denied) return denied
    console.error('[API /owner/task GET] Error:', err)
    return NextResponse.json(
      { error: 'Failed to fetch task metadata' },
      { status: 500 }
    )
  }
}
