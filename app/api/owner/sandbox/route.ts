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
import { sandboxRepos, developerForks } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { requireSandboxUser, sandboxAuthResponse, storedTokenFor } from '@/lib/sandbox-auth'

// POST/PUT to configure/update sandbox metadata
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { 
      sandboxId, 
      taskTitle, 
      taskDescription, 
      frontendStack, 
      backendStack, 
      allowedPaths, 
      restrictedPaths, 
      acceptanceCriteria 
    } = body

    if (!sandboxId) {
      return NextResponse.json({ error: 'Missing sandboxId parameter' }, { status: 400 })
    }

    const owner = await requireSandboxUser('owner')
    const updated = await db
      .update(sandboxRepos)
      .set({
        taskTitle,
        taskDescription,
        frontendStack,
        backendStack,
        allowedPaths,
        restrictedPaths,
        acceptanceCriteria,
        verificationStatus: 'idle' // reset status on edit
      })
      .where(and(eq(sandboxRepos.id, sandboxId), eq(sandboxRepos.ownerId, owner.id)))
      .returning({ id: sandboxRepos.id })

    if (updated.length === 0) {
      return NextResponse.json({ error: 'Sandbox not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true, sandboxId })
  } catch (error: any) {
    const denied = sandboxAuthResponse(error)
    if (denied) return denied
    console.error('Configure sandbox error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  return POST(request)
}

// DELETE to delete sandbox repository and DB records
export async function DELETE(request: Request) {
  try {
    const { sandboxRepo, force } = await request.json()

    if (!sandboxRepo) {
      return NextResponse.json({ error: 'Missing required parameter: sandboxRepo' }, { status: 400 })
    }

    // 1. Only the owner of this sandbox may delete it, with their own token.
    const owner = await requireSandboxUser('owner')
    const owned = await db
      .select({ id: sandboxRepos.id })
      .from(sandboxRepos)
      .where(and(eq(sandboxRepos.sandboxRepo, sandboxRepo), eq(sandboxRepos.ownerId, owner.id)))
      .limit(1)
    if (owned.length === 0) {
      return NextResponse.json({ error: 'Sandbox not found' }, { status: 404 })
    }
    const token = owner.token

    // 2. Query developer forks for this repository to clean them up
    const forks = await db
      .select()
      .from(developerForks)
      .where(eq(developerForks.sandboxRepo, sandboxRepo))

    const forkBasename = sandboxRepo.split('/')[1] || sandboxRepo
    const deletedForksInfo: { username: string; deletedOnGitHub: boolean; error?: string }[] = []

    // 3. For each fork: attempt GitHub deletion and delete from DB
    for (const fork of forks) {
      const devUsername = fork.githubUsername
      let deletedOnGitHub = false
      let errorMsg = ''

      try {
        const devToken =
          (await storedTokenFor(devUsername, 'developer')) ??
          (await storedTokenFor(devUsername, 'owner')) ??
          undefined

        if (devToken) {
          // GitHub DELETE /repos/{owner}/{repo}
          const githubDeleteResponse = await fetch(
            `https://api.github.com/repos/${devUsername}/${forkBasename}`,
            {
              method: 'DELETE',
              headers: {
                Authorization: `Bearer ${devToken}`,
                'User-Agent': 'Forke-Complete-Review-Engine/1.0',
                Accept: 'application/vnd.github+json',
              }
            }
          )

          if (githubDeleteResponse.ok || githubDeleteResponse.status === 404) {
            deletedOnGitHub = true
          } else {
            const errData = await githubDeleteResponse.json().catch(() => ({}))
            errorMsg = errData.message || `HTTP ${githubDeleteResponse.status}`
          }
        } else {
          errorMsg = 'Developer OAuth token not stored in database'
        }
      } catch (err: any) {
        errorMsg = err.message || 'Unknown network error'
      }

      // Delete the fork record from database regardless of GitHub deletion outcome
      await db
        .delete(developerForks)
        .where(
          and(
            eq(developerForks.githubUsername, devUsername),
            eq(developerForks.sandboxRepo, sandboxRepo)
          )
        )

      deletedForksInfo.push({
        username: devUsername,
        deletedOnGitHub,
        ...(errorMsg && !deletedOnGitHub ? { error: errorMsg } : {})
      })
    }

    // 4. Delete sandbox repository from GitHub
    let sandboxDeletedOnGitHub = false
    let sandboxDeleteError = ''
    try {
      const sandboxDeleteResponse = await fetch(
        `https://api.github.com/repos/${sandboxRepo}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
            'User-Agent': 'Forke-Complete-Review-Engine/1.0',
            Accept: 'application/vnd.github+json',
          }
        }
      )

      if (sandboxDeleteResponse.ok || sandboxDeleteResponse.status === 404) {
        sandboxDeletedOnGitHub = true
      } else {
        const errData = await sandboxDeleteResponse.json().catch(() => ({}))
        sandboxDeleteError = errData.message || `HTTP ${sandboxDeleteResponse.status}`
      }
    } catch (err: any) {
      sandboxDeleteError = err.message || 'Unknown network error'
    }

    // 5. Delete sandbox repository record from DB
    if (!sandboxDeletedOnGitHub && !force) {
      return NextResponse.json({
        success: false,
        error: `Failed to clean up repository on GitHub: ${sandboxDeleteError || 'Unknown API issue'}.`,
        sandboxDeleteError,
        deletedForks: deletedForksInfo
      }, { status: 400 })
    }

    await db
      .delete(sandboxRepos)
      .where(eq(sandboxRepos.sandboxRepo, sandboxRepo))

    return NextResponse.json({
      success: true,
      sandboxRepo,
      sandboxDeletedOnGitHub,
      sandboxDeleteError,
      deletedForks: deletedForksInfo
    })
  } catch (error: any) {
    const denied = sandboxAuthResponse(error)
    if (denied) return denied
    console.error('Delete sandbox error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
