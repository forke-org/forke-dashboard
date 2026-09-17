/**
 * @fileoverview Forke Platform
 * @copyright (c) 2026 Forke Inc. (https://www.forke.space/)
 *
 * Source-Available License (Non-Commercial / Fair Source).
 * This source code is open for inspection, learning, and personal development.
 * Commercial use, hosting, or resale as a paid service without an explicit
 * commercial license from Forke Inc. is strictly prohibited.
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sandboxRepos, developerForks, codeReviews } from '@/lib/db/schema'
import { eq, and, desc, isNull } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const username = searchParams.get('username')
    const sandboxRepo = searchParams.get('sandboxRepo')
    const prNumberStr = searchParams.get('prNumber')
    const sandboxRepoId = searchParams.get('sandboxRepoId')

    // If sandboxRepoId is requested, return the baseline review
    if (sandboxRepoId) {
      const reviews = await db
        .select()
        .from(codeReviews)
        .where(
          and(
            eq(codeReviews.sandboxRepoId, sandboxRepoId),
            isNull(codeReviews.developerForkId)
          )
        )
        .orderBy(desc(codeReviews.createdAt))
        .limit(1)

      if (reviews.length === 0) {
        return NextResponse.json({ review: null, message: 'No baseline AI review found' }, { status: 200 })
      }

      const review = reviews[0]
      return NextResponse.json({
        review: {
          id: review.id,
          prNumber: review.prNumber,
          verdict: review.aiVerdict,
          score: review.aiScore,
          requirementMatch: review.requirementMatch ? parseFloat(review.requirementMatch) : 0,
          summary: review.aiSummary,
          strengths: safeParseJSON(review.aiStrengths, []),
          issues: safeParseJSON(review.aiIssues, []),
          risks: safeParseJSON(review.aiRisks, []),
          unauthorizedEdits: safeParseJSON(review.unauthorizedEdits, []),
          resolvedIssues: safeParseJSON(review.resolvedIssues, []),
          resolvedRisks: safeParseJSON(review.resolvedRisks, []),
          createdAt: review.createdAt,
        },
      })
    }

    if (!sandboxRepo) {
      return NextResponse.json(
        { error: 'Missing required parameter: sandboxRepo' },
        { status: 400 }
      )
    }

    const repoInfo = await db
      .select()
      .from(sandboxRepos)
      .where(eq(sandboxRepos.sandboxRepo, sandboxRepo))
      .limit(1)

    if (repoInfo.length === 0) {
      return NextResponse.json({ error: 'Sandbox repository not found.' }, { status: 404 })
    }

    const currentSandboxId = repoInfo[0].id

    // If no prNumber is provided, fetch previous reviews history for this sandboxRepo
    if (!prNumberStr) {
      const reviews = await db
        .select()
        .from(codeReviews)
        .where(eq(codeReviews.sandboxRepoId, currentSandboxId))
        .orderBy(desc(codeReviews.createdAt))

      return NextResponse.json({
        reviews: reviews.map(r => ({
          id: r.id,
          prNumber: r.prNumber,
          commitSha: r.commitSha,
          verdict: r.aiVerdict || r.verdict || 'pass',
          reportHtml: r.reportHtml,
          results: safeParseJSON(r.results, {}),
          comparison: safeParseJSON(r.comparison, {}),
          createdAt: r.createdAt
        }))
      })
    }

    const prNumber = parseInt(prNumberStr, 10)

    // Query the latest unified review for this developer fork/PR
    let forkId: string | null = null
    if (username) {
      const forkRecords = await db
        .select()
        .from(developerForks)
        .where(
          and(
            eq(developerForks.githubUsername, username),
            eq(developerForks.sandboxRepo, sandboxRepo)
          )
        )
        .limit(1)

      if (forkRecords.length > 0) {
        forkId = forkRecords[0].id
      }
    }

    let reviewQuery = db
      .select()
      .from(codeReviews)
      .where(
        and(
          eq(codeReviews.sandboxRepoId, currentSandboxId),
          eq(codeReviews.prNumber, prNumber)
        )
      )
      .orderBy(desc(codeReviews.createdAt))
      .limit(1)

    if (forkId) {
      reviewQuery = db
        .select()
        .from(codeReviews)
        .where(
          and(
            eq(codeReviews.developerForkId, forkId),
            eq(codeReviews.prNumber, prNumber)
          )
        )
        .orderBy(desc(codeReviews.createdAt))
        .limit(1)
    }

    const reviewsList = await reviewQuery

    if (reviewsList.length === 0) {
      return NextResponse.json({ review: null })
    }

    const review = reviewsList[0]

    // Assemble unified review payload for the UI dashboard
    return NextResponse.json({
      review: {
        id: review.id,
        prNumber: prNumber,
        commitSha: review.commitSha || '',
        verdict: review.aiVerdict || review.verdict || 'pass',
        score: review.aiScore !== null ? review.aiScore : (review.verdict === 'pass' ? 100 : 50),
        requirementMatch: review.requirementMatch ? parseFloat(review.requirementMatch) : 0,
        summary: review.aiSummary || 'Validation completed.',
        strengths: safeParseJSON(review.aiStrengths, []),
        issues: safeParseJSON(review.aiIssues, []),
        risks: safeParseJSON(review.aiRisks, []),
        unauthorizedEdits: safeParseJSON(review.unauthorizedEdits, []),
        resolvedIssues: safeParseJSON(review.resolvedIssues, []),
        resolvedRisks: safeParseJSON(review.resolvedRisks, []),
        results: safeParseJSON(review.results, {}),
        comparison: safeParseJSON(review.comparison, {}),
        reportHtml: review.reportHtml || '',
        createdAt: review.createdAt
      }
    })
  } catch (err: unknown) {
    console.error('[API /developer/review GET] Error:', err)
    return NextResponse.json(
      { error: 'Failed to fetch review', details: String(err) },
      { status: 500 }
    )
  }
}

function safeParseJSON(val: string | null | undefined, fallback: unknown) {
  if (!val) return fallback
  try {
    return JSON.parse(val)
  } catch {
    return fallback
  }
}
