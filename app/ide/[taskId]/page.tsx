/**
 * @fileoverview Forke Platform
 * @copyright (c) 2026 Forke Inc. (https://www.forke.space/)
 *
 * Source-Available License (Non-Commercial / Fair Source).
 * This source code is open for inspection, learning, and personal development.
 * Commercial use, hosting, or resale as a paid service without an explicit
 * commercial license from Forke Inc. is strictly prohibited.
 */

import { auth } from '@/auth'
import { getTaskById } from '@/lib/db/queries/tasks'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { developers, sandboxRepos, sandboxUsers } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { Workspace } from './workspace'

interface PageProps {
  params: Promise<{
    taskId: string
  }>
}

export default async function IdePage({ params }: PageProps) {
  const { taskId } = await params
  
  // 1. Authenticate user
  const session = await auth()
  const user = session?.user as { id: string; role: 'developer' | 'owner' } | undefined

  if (!user) {
    redirect(`/signin?callbackUrl=/ide/${taskId}`)
  }

  if (user.role !== 'developer') {
    redirect('/dashboard?error=DeveloperRoleRequired')
  }

  // 2. Fetch Task and sandbox repo details
  const taskResult = await getTaskById(taskId)
  if (!taskResult) {
    redirect('/dashboard?error=TaskNotFound')
  }

  const { task } = taskResult

  // 3. Verify that this developer is the claimant
  if (task.status === 'open') {
    redirect(`/tasks/${taskId}`)
  }

  if (task.claimantId !== user.id) {
    redirect('/dashboard?error=NotTaskClaimant')
  }

  // 4. Fetch developer profile & check GitHub connection
  const devProfile = await db.query.developers.findFirst({
    where: eq(developers.userId, user.id)
  })

  const isGithubConnected = !!devProfile?.isGithubConnected
  const devUsername = devProfile?.username || null

  if (!isGithubConnected || !devUsername || !devProfile?.accessToken) {
    return (
      <Workspace
        taskId={taskId}
        taskTitle={task.title}
        taskBudget={task.budget}
        isGithubConnected={false}
        devUsername={null}
        developerUserId={user.id}
        repoPath=""
        initialCodespaceUrl={null}
        initialCodespaceName={null}
        initialCodespaceStatus={null}
      />
    )
  }

  // 5. Get sandbox repo details (invitation check path)
  if (!task.sandboxRepoId) {
    redirect('/dashboard?error=SandboxRepoNotConfigured')
  }

  const sandboxRepo = await db.query.sandboxRepos.findFirst({
    where: eq(sandboxRepos.id, task.sandboxRepoId)
  })

  if (!sandboxRepo) {
    redirect('/dashboard?error=SandboxRepoNotFound')
  }

  const repoPath = sandboxRepo.sandboxRepo // e.g. "forke-sandbox/mirror-repo"

  // 6. Check template repository invitation status
  const checkUrl = `https://api.github.com/repos/${repoPath}/collaborators/${devUsername}`
  const checkResponse = await fetch(checkUrl, {
    headers: {
      Authorization: `Bearer ${devProfile.accessToken}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'Forke-IDE/1.0',
    },
  })

  const isCollaborator = checkResponse.status === 204

  if (!isCollaborator) {
    // Send invitation using the owner token
    const ownerResult = await db.query.sandboxUsers.findFirst({
      where: eq(sandboxUsers.id, sandboxRepo.ownerId),
    })
    if (!ownerResult || !ownerResult.accessToken) {
      redirect('/dashboard?error=OwnerTokenNotFound')
    }

    const inviteUrl = `https://api.github.com/repos/${repoPath}/collaborators/${devUsername}`
    const inviteResponse = await fetch(inviteUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${ownerResult.accessToken}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'Forke-IDE/1.0',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ permission: 'write' }),
    })

    if (!inviteResponse.ok) {
      redirect('/dashboard?error=FailedToInviteDeveloper')
    }

    // Redirect to invitation acceptance page
    redirect(`https://github.com/${repoPath}/invitations`)
  }

  // 7. Developer has accepted invitation. Make sure personal private repository exists
  const devRepoName = `forke-task-${taskId}`
  const devRepoPath = `${devUsername}/${devRepoName}`
  const checkDevRepoUrl = `https://api.github.com/repos/${devRepoPath}`
  
  const checkDevRepoRes = await fetch(checkDevRepoUrl, {
    headers: {
      Authorization: `Bearer ${devProfile.accessToken}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'Forke-IDE/1.0',
    },
  })

  if (checkDevRepoRes.status === 404) {
    // Try template generation first
    const generateUrl = `https://api.github.com/repos/${repoPath}/generate`
    console.log(`[Codespace CLI] Attempting to generate repository from template: ${repoPath}...`)
    
    const generateResponse = await fetch(generateUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${devProfile.accessToken}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'Forke-IDE/1.0',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: devRepoName,
        private: true,
        description: `Forke sandbox workspace for Task #${taskId}`,
      }),
    })

    if (!generateResponse.ok) {
      console.log(`[Codespace CLI] Template generation failed (status ${generateResponse.status}). Falling back to Repository Fork API...`)
      
      const forkUrl = `https://api.github.com/repos/${repoPath}/forks`
      const forkResponse = await fetch(forkUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${devProfile.accessToken}`,
          Accept: 'application/vnd.github+json',
          'User-Agent': 'Forke-IDE/1.0',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: devRepoName,
        }),
      })

      if (!forkResponse.ok) {
        const forkErr = await forkResponse.json().catch(() => ({}))
        console.error('[Codespace CLI] Fork API failed:', forkErr)
        redirect(`/dashboard?error=FailedToCreateRepo&details=${encodeURIComponent(forkErr.message || forkResponse.statusText)}`)
      }
    }

    // Wait 4 seconds for GitHub to copy/fork the files, then redirect to codespace creation
    await new Promise(resolve => setTimeout(resolve, 4000))
  }

  // 8. Redirect directly to GitHub Codespace creation wizard
  redirect(`https://github.com/codespaces/new?repo=${devRepoPath}&ref=main`)
}
