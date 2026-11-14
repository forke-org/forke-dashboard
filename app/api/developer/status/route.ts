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
import { developerForks } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { getSandboxUser } from '@/lib/sandbox-auth'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sandboxRepo = searchParams.get('sandboxRepo')

  if (!sandboxRepo) {
    return NextResponse.json({ error: 'Missing required parameter: sandboxRepo' }, { status: 400 })
  }

  // Status is always for the signed-in user, using their own token.
  const me = await getSandboxUser()
  if (!me) {
    return NextResponse.json({ error: 'GitHub access token not found. Please log in again.' }, { status: 401 })
  }
  const username = me.username
  const token = me.token

  const repoName = sandboxRepo.split('/')[1] || sandboxRepo
  const forkPath = `${username}/${repoName}`

  let hasFork = false
  let hasPR = false
  let prDetails: any = null

  try {
    // 1. Verify fork exists on GitHub
    const forkCheckResponse = await fetch(`https://api.github.com/repos/${forkPath}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'User-Agent': 'Forke-Complete-Review-Engine/1.0',
        Accept: 'application/vnd.github+json',
      }
    })

    if (forkCheckResponse.ok) {
      hasFork = true
    }

    // 2. Fetch pulls for sandbox repo to find PRs from this user
    const pullsResponse = await fetch(`https://api.github.com/repos/${sandboxRepo}/pulls?state=all&per_page=100`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'User-Agent': 'Forke-Complete-Review-Engine/1.0',
        Accept: 'application/vnd.github+json',
      }
    })

    if (pullsResponse.ok) {
      const pulls = await pullsResponse.json()
      if (Array.isArray(pulls)) {
        const userPR = pulls.find((pr: any) => pr.user && pr.user.login.toLowerCase() === username.toLowerCase())
        if (userPR) {
          hasPR = true
          prDetails = {
            title: userPR.title,
            url: userPR.html_url,
            number: userPR.number,
            state: userPR.state,
            createdAt: userPR.created_at
          }

          // Update database with PR URL
          try {
            await db
              .update(developerForks)
              .set({ prUrl: userPR.html_url })
              .where(
                and(
                  eq(developerForks.githubUsername, username),
                  eq(developerForks.sandboxRepo, sandboxRepo)
                )
              )
          } catch (dbError) {
            console.error('Failed to update developer fork with PR URL:', dbError)
          }
        }
      }
    }

    return NextResponse.json({
      hasFork,
      hasPR,
      prDetails
    })
  } catch (error: any) {
    console.error('Developer live status check error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
