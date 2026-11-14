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
 * GET /api/owner/repo-tree?username=X&repo=owner/repo
 *
 * Returns a recursive flat list of file/folder paths for the given repo
 * using the GitHub Git Trees API.
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireSandboxUser, sandboxAuthResponse } from '@/lib/sandbox-auth'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const repo = searchParams.get('repo') // e.g. "owner/repo-name"

  if (!repo || !/^[\w.-]+\/[\w.-]+$/.test(repo)) {
    return NextResponse.json({ error: 'Missing or invalid repo parameter' }, { status: 400 })
  }

  // Use the caller's own GitHub token, so they only see repos they can access.
  let token: string
  try {
    token = (await requireSandboxUser('owner')).token
  } catch (err) {
    return sandboxAuthResponse(err) ?? NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 1. Get default branch
    const repoRes = await fetch(`https://api.github.com/repos/${repo}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'Forke-Sandbox/1.0',
      },
    })
    if (!repoRes.ok) {
      const err = await repoRes.json()
      return NextResponse.json({ error: err.message || 'Failed to fetch repo info' }, { status: repoRes.status })
    }
    const repoData = await repoRes.json()
    const defaultBranch: string = repoData.default_branch || 'main'

    // 2. Get full recursive tree
    const treeRes = await fetch(
      `https://api.github.com/repos/${repo}/git/trees/${defaultBranch}?recursive=1`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'User-Agent': 'Forke-Sandbox/1.0',
        },
      }
    )
    if (!treeRes.ok) {
      const err = await treeRes.json()
      return NextResponse.json({ error: err.message || 'Failed to fetch tree' }, { status: treeRes.status })
    }
    const treeData = await treeRes.json()

    // 3. Filter out .git internals, return paths with type (blob=file, tree=dir)
    const SKIP = new Set([
      'node_modules', '.next', '.git', '__pycache__', '.venv', 'venv',
      'dist', 'build', 'out', '.cache', 'coverage', '.nyc_output',
    ])

    const items: { path: string; type: 'file' | 'dir' }[] = (treeData.tree || [])
      .filter((node: any) => {
        const topLevel = node.path.split('/')[0]
        return !SKIP.has(topLevel)
      })
      .map((node: any) => ({
        path: node.path as string,
        type: node.type === 'tree' ? 'dir' : 'file',
      }))

    return NextResponse.json({ items, branch: defaultBranch, truncated: treeData.truncated ?? false })
  } catch (err: any) {
    console.error('[repo-tree] Error:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
