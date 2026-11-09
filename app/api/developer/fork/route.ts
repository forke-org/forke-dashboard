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
import { developerForks, sandboxRepos } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { ownerTokenFor, requireSandboxUser, sandboxAuthResponse } from '@/lib/sandbox-auth'

export async function POST(request: Request) {
  try {
    const { sandboxRepo } = await request.json()

    if (!sandboxRepo) {
      return NextResponse.json({ error: 'Missing required parameter: sandboxRepo' }, { status: 400 })
    }

    // The developer is whoever is signed in; never a username from the body.
    const developer = await requireSandboxUser('developer')
    const username = developer.username
    const repoRows = await db.select().from(sandboxRepos).where(eq(sandboxRepos.sandboxRepo, sandboxRepo)).limit(1)
    if (repoRows.length === 0) {
      return NextResponse.json({ error: 'Sandbox not found' }, { status: 404 })
    }

    const repoName = sandboxRepo.split('/')[1] || sandboxRepo
    const forkUrl = `https://github.com/${username}/${repoName}`

    // 1. Grant Developer Access (Invite developer as collaborator using owner access token)
    try {
      // Only this sandbox's own owner token may be used (never another owner's).
      const ownerToken = await ownerTokenFor(repoRows[0].ownerId)

      if (ownerToken) {
        console.log(`Adding developer ${username} to private sandbox repo ${sandboxRepo}`)
        const addCollabResponse = await fetch(
          `https://api.github.com/repos/${sandboxRepo}/collaborators/${username}`,
          {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${ownerToken}`,
              'User-Agent': 'Forke-Complete-Review-Engine/1.0',
              'Content-Type': 'application/json',
              Accept: 'application/vnd.github+json',
            },
            body: JSON.stringify({
              permission: 'pull' // Grant read access so they can fork it
            })
          }
        )

        if (addCollabResponse.status === 201) {
          const invitationData = await addCollabResponse.json()
          const invitationId = invitationData.id

          // The signed-in developer's own token accepts the invitation.
          const devToken = developer.token

          if (devToken && invitationId) {
            console.log(`Programmatically accepting invitation ${invitationId} for developer ${username}`)
            const acceptResponse = await fetch(
              `https://api.github.com/user/repository_invitations/${invitationId}`,
              {
                method: 'PATCH',
                headers: {
                  Authorization: `Bearer ${devToken}`,
                  'User-Agent': 'Forke-Complete-Review-Engine/1.0',
                  Accept: 'application/vnd.github+json',
                }
              }
            )

            if (acceptResponse.ok) {
              console.log(`Successfully auto-accepted repository invitation for developer ${username}`)
            } else {
              const acceptErr = await acceptResponse.json().catch(() => ({}))
              console.error('Failed to auto-accept invitation:', acceptErr)
            }
          }
        } else if (addCollabResponse.status === 204) {
          console.log(`Developer ${username} already has collaborator access to ${sandboxRepo}`)
        } else {
          const collabErr = await addCollabResponse.json().catch(() => ({}))
          console.error('GitHub collaborators API returned error:', collabErr)
        }
      }
    } catch (collabError) {
      console.error('Developer auto-collaboration logic encountered an error:', collabError)
    }

    // Check if record already exists in DB
    const existing = await db
      .select()
      .from(developerForks)
      .where(
        and(
          eq(developerForks.githubUsername, username),
          eq(developerForks.sandboxRepo, sandboxRepo)
        )
      )

    if (existing.length > 0) {
      await db
        .update(developerForks)
        .set({ forkUrl, createdAt: new Date() })
        .where(
          and(
            eq(developerForks.githubUsername, username),
            eq(developerForks.sandboxRepo, sandboxRepo)
          )
        )
    } else {
      await db.insert(developerForks).values({
        githubUsername: username,
        sandboxRepo,
        forkUrl
      })
    }

    // Return the standard GitHub fork page URL to open in a new tab
    const githubForkPage = `https://github.com/${sandboxRepo}/fork`

    return NextResponse.json({
      success: true,
      forkUrl,
      githubForkPage
    })
  } catch (error: any) {
    const denied = sandboxAuthResponse(error)
    if (denied) return denied
    console.error('Developer fork register error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
