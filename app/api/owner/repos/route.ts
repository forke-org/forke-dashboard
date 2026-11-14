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
import { cookies } from 'next/headers'
import { upsertSandboxUser } from '@/lib/sandbox-auth'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const org = searchParams.get('org')

  const cookieStore = await cookies()
  const token = cookieStore.get('forke_access_token')?.value
  // The username always comes from GitHub for this token, never from the query.
  let username: string | null = null

  if (token) {
    try {
      const userRes = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${token}`,
          'User-Agent': 'Forke-Sandbox/1.0',
          Accept: 'application/vnd.github+json',
        },
      })
      if (userRes.ok) {
        const userData = await userRes.json()
        if (userData?.id && userData?.login) {
          username = userData.login
          await upsertSandboxUser({ githubId: userData.id, username: userData.login, token, role: 'owner' })
        }
      }
    } catch (err) {
      console.error('Failed to resolve GitHub owner in repos fetch:', err)
    }
  }

  if (!token || !username) {
    return NextResponse.json({ error: 'GitHub access token not found. Please log in again.' }, { status: 401 })
  }

  try {
    // 1. Fetch user organizations
    const orgsResponse = await fetch('https://api.github.com/user/orgs', {
      headers: {
        Authorization: `Bearer ${token}`,
        'User-Agent': 'Forke-Complete-Review-Engine/1.0',
        Accept: 'application/vnd.github+json',
      },
    })
    const orgs = await orgsResponse.json()

    // 2. Fetch repos based on selected scope
    let reposUrl = 'https://api.github.com/user/repos?per_page=100&affiliation=owner,collaborator,organization_member'
    if (org && org !== 'personal') {
      reposUrl = `https://api.github.com/orgs/${org}/repos?per_page=100`
    }

    const reposResponse = await fetch(reposUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        'User-Agent': 'Forke-Complete-Review-Engine/1.0',
        Accept: 'application/vnd.github+json',
      },
    })
    let repos = await reposResponse.json()

    if (repos.error || orgs.error) {
      return NextResponse.json({
        error: repos.message || orgs.message || 'Error fetching details from GitHub'
      }, { status: 400 })
    }

    // 3. Filter repositories strictly by selected scope owner
    if (Array.isArray(repos)) {
      if (org && org !== 'personal') {
        repos = repos.filter(
          (repo: any) => repo.owner && repo.owner.login.toLowerCase() === org.toLowerCase()
        )
      } else if (username) {
        repos = repos.filter(
          (repo: any) => repo.owner && repo.owner.login.toLowerCase() === username.toLowerCase()
        )
      }
    }

    return NextResponse.json({
      repos: Array.isArray(repos) ? repos : [],
      organizations: Array.isArray(orgs) ? orgs : []
    })
  } catch (err: any) {
    console.error('Owner repos fetch error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
