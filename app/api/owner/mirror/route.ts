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
import { requireOwnerFromCookie, sandboxAuthResponse } from '@/lib/sandbox-auth'
import { activeJobs } from '@/lib/jobs'
import { runMirrorJob } from '@/lib/github/mirror'

export async function POST(request: Request) {
  try {
    const { 
      sourceRepo, 
      targetOrg,
      taskTitle,
      taskDescription,
      frontendStack,
      backendStack,
      allowedPaths,
      restrictedPaths,
      acceptanceCriteria
    } = await request.json()

    if (!sourceRepo || !targetOrg || !/^[\w.-]+\/[\w.-]+$/.test(sourceRepo)) {
      return NextResponse.json({ error: 'Missing required parameters: sourceRepo, targetOrg' }, { status: 400 })
    }

    const owner = await requireOwnerFromCookie()
    const token = owner.token
    const ownerId = owner.id
    const username = owner.username

    // 2. Determine target space (defaults to targetOrg or always forke-sandbox)
    const targetSpace = 'forke-sandbox'

    // 3. Extract repository base name and generate target name
    const repoBasename = sourceRepo.split('/')[1] || sourceRepo
    let targetRepoName = `sandbox-${repoBasename}`

    // Let's query existing mirrored repos to find conflicts and avoid duplicate creations
    const existingMirrors = await db.select().from(sandboxRepos)
    const existingNames = new Set(existingMirrors.map(m => m.sandboxRepo.toLowerCase()))

    let count = 1
    let uniqueTargetRepoName = targetRepoName
    while (existingNames.has(`${targetSpace}/${uniqueTargetRepoName}`.toLowerCase())) {
      uniqueTargetRepoName = `${targetRepoName}-${count}`
      count++
    }

    targetRepoName = uniqueTargetRepoName
    const fullTargetRepoPath = `${targetSpace}/${targetRepoName}`

    // 4. Initialize job in memory
    const jobId = `${username}-${repoBasename}-${Date.now()}`
    
    activeJobs.set(jobId, {
      id: jobId,
      status: 'running',
      progress: 0,
      logs: ['[INIT] Mirrored workspace setup queued.']
    })

    // Start background mirroring process
    runMirrorJob({
      jobId,
      token,
      ownerId,
      sourceRepo,
      targetSpace,
      targetRepoName,
      taskTitle,
      taskDescription,
      frontendStack,
      backendStack,
      allowedPaths,
      restrictedPaths,
      acceptanceCriteria
    }).catch(err => {
      console.error(`[MirrorRoute] Background mirror job failed for ${jobId}:`, err)
    })

    return NextResponse.json({ jobId, sandboxRepo: fullTargetRepoPath })
  } catch (error: any) {
    const denied = sandboxAuthResponse(error)
    if (denied) return denied
    console.error('Mirror pipeline trigger error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
