'use client'

import { cn } from '@/lib/utils/cn'

// ─── Types (mirror SandboxWorkspace.tsx AIReview interface) ──────────────────
interface AIIssue {
  file: string
  line: number
  severity: 'critical' | 'high' | 'medium' | 'low'
  message: string
  suggestion: string
  status?: 'new' | 'unresolved'
}
interface AIRisk {
  category: string
  message: string
  severity: 'high' | 'medium' | 'low'
  status?: 'new' | 'unresolved'
}
interface AIResolvedIssue {
  file: string
  line: number
  severity: string
  message: string
  resolution: string
}
interface AIResolvedRisk {
  category: string
  message: string
  severity: string
  resolution: string
}
export interface AIReviewData {
  id: string
  prNumber: number
  verdict: 'pass' | 'needs_changes' | 'high_risk'
  score: number
  requirementMatch: number
  summary: string
  strengths: string[]
  issues: AIIssue[]
  risks: AIRisk[]
  unauthorizedEdits: string[]
  resolvedIssues?: AIResolvedIssue[]
  resolvedRisks?: AIResolvedRisk[]
  results?: Record<string, any>
  comparison?: Record<string, any>
  commitSha?: string
  createdAt: string
}

interface AIReviewReportProps {
  review: AIReviewData
  title?: string
  prUrl?: string
}

// ─── Score Ring ──────────────────────────────────────────────────────────────
function ScoreRing({ score }: { score: number }) {
  const r = 28
  const circ = 2 * Math.PI * r
  const fill = circ * (1 - score / 100)
  const color = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444'
  return (
    <div className="flex flex-col items-center gap-1 shrink-0">
      <svg width="72" height="72" viewBox="0 0 72 72" className="-rotate-90">
        <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
        <circle
          cx="36" cy="36" r={r} fill="none"
          stroke={color} strokeWidth="6"
          strokeDasharray={circ}
          strokeDashoffset={fill}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center" style={{ marginTop: '-54px' }}>
        <span className="text-xl font-black text-white tabular-nums leading-none">{score}</span>
        <span className="text-[9px] text-[var(--color-text-muted)] font-medium leading-none mt-0.5">/ 100</span>
      </div>
      <span className="text-[9px] font-medium text-[var(--color-text-muted)] uppercase tracking-wider -mt-1">AI Score</span>
    </div>
  )
}

// ─── Verdict Banner ───────────────────────────────────────────────────────────
function VerdictBanner({ verdict, summary }: { verdict: string; summary: string }) {
  const cfg = verdict === 'pass'
    ? { bg: 'bg-emerald-500/8 border-emerald-500/25', icon: '✓', iconBg: 'bg-emerald-500', label: 'Recommended: Approve', color: 'text-emerald-400' }
    : verdict === 'high_risk'
    ? { bg: 'bg-red-500/8 border-red-500/25', icon: '✕', iconBg: 'bg-red-500', label: 'Recommended: Reject', color: 'text-red-400' }
    : { bg: 'bg-amber-500/8 border-amber-500/25', icon: '~', iconBg: 'bg-amber-500', label: 'Recommended: Approve with fixes', color: 'text-amber-400' }
  return (
    <div className={cn('flex items-start gap-3 p-4 rounded-xl border', cfg.bg)}>
      <div className={cn('w-6 h-6 rounded-full flex items-center justify-center text-black font-black text-xs shrink-0 mt-0.5', cfg.iconBg)}>
        {cfg.icon}
      </div>
      <div className="min-w-0">
        <p className={cn('text-[13px] font-semibold leading-snug', cfg.color)}>{cfg.label}</p>
        <p className="text-[12px] text-[var(--color-text-muted)] mt-1 leading-relaxed">{summary}</p>
      </div>
    </div>
  )
}

// ─── Metrics Strip ────────────────────────────────────────────────────────────
function MetricsStrip({ review }: { review: AIReviewData }) {
  // deterministicResults is stored as ReviewRunnerResult { commitSha, techStack, results, durationMs }
  // The GET route passes the whole object as review.results, so we need to unwrap
  const rawResults = review.results || {}
  const results: Record<string, any> = (rawResults.results && typeof rawResults.results === 'object')
    ? rawResults.results
    : rawResults
  const comparison = review.comparison || {}

  const unitTests = results['unit_tests']
  const lint = results['lint']
  const types = results['type_checks']

  // Parse test counts from logs
  function parseTestCounts(logs: string) {
    const passed = (logs?.match(/(\d+)\s+pass(ed)?/i) || [])[1]
    const failed = (logs?.match(/(\d+)\s+fail(ed)?/i) || [])[1]
    const skipped = (logs?.match(/(\d+)\s+skip(ped)?/i) || [])[1]
    return { passed: passed ? parseInt(passed) : null, failed: failed ? parseInt(failed) : null, skipped: skipped ? parseInt(skipped) : null }
  }

  const testCounts = unitTests ? parseTestCounts(unitTests.logs || '') : null
  const lintIssues = lint?.issuesCount ?? null
  const typeErrors = types?.issuesCount ?? null
  const reqMatch = Math.round(review.requirementMatch * 100)
  // comparison.regressions is a Record<category, issueCountDelta>
  const reqDelta = comparison.regressions?.['unit_tests']
    ? comparison.regressions['unit_tests']
    : comparison.improvements?.['unit_tests']
    ? -comparison.improvements['unit_tests']
    : null

  const metrics = [
    {
      label: 'Tests',
      icon: '⚡',
      value: testCounts?.passed != null ? `${testCounts.passed}` : (unitTests?.status === 'pass' ? 'Pass' : unitTests?.status === 'fail' ? 'Fail' : '—'),
      sub: testCounts ? `passing${testCounts.skipped ? ` · ${testCounts.skipped} skipped` : ''}${testCounts.failed ? ` · ${testCounts.failed} failed` : ''}` : unitTests?.status,
      color: unitTests?.status === 'pass' ? 'text-emerald-400' : unitTests?.status === 'fail' ? 'text-red-400' : 'text-[var(--color-text-muted)]',
    },
    {
      label: 'Lint',
      icon: '◎',
      value: lintIssues != null ? String(lintIssues) : (lint?.status === 'pass' ? '0' : '—'),
      sub: lintIssues === 0 ? 'no issues' : lintIssues != null ? `warning${lintIssues !== 1 ? 's' : ''}` : lint?.status,
      color: (lintIssues === 0 || lint?.status === 'pass') ? 'text-emerald-400' : lintIssues != null ? 'text-amber-400' : 'text-[var(--color-text-muted)]',
    },
    {
      label: 'Types',
      icon: '{}',
      value: typeErrors != null ? (typeErrors === 0 ? 'Clean' : `${typeErrors} err`) : (types?.status === 'pass' ? 'Clean' : types?.status === 'skip' ? 'N/A' : '—'),
      sub: typeErrors === 0 ? '0 type errors' : typeErrors != null ? `${typeErrors} error${typeErrors !== 1 ? 's' : ''}` : types?.status,
      color: (typeErrors === 0 || types?.status === 'pass') ? 'text-emerald-400' : typeErrors != null ? 'text-red-400' : 'text-[var(--color-text-muted)]',
    },
    {
      label: 'Req Match',
      icon: '◇',
      value: `${reqMatch}%`,
      sub: reqDelta != null ? (reqDelta > 0 ? `+${reqDelta} from base` : reqDelta < 0 ? `${reqDelta} from base` : 'same as base') : `${reqMatch}% match`,
      color: reqMatch >= 80 ? 'text-emerald-400' : reqMatch >= 60 ? 'text-amber-400' : 'text-red-400',
      delta: reqDelta,
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {metrics.map(m => (
        <div key={m.label} className="rounded-xl border border-[var(--color-border)] bg-white/[0.018] p-3.5 space-y-1">
          <div className="flex items-center gap-1.5 text-[var(--color-text-muted)]">
            <span className="text-[11px] font-mono opacity-60">{m.icon}</span>
            <span className="text-[11px] font-medium">{m.label}</span>
          </div>
          <div className={cn('text-xl font-bold tabular-nums', m.color)}>{m.value}</div>
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-[var(--color-text-muted)] leading-none">{m.sub}</span>
            {m.delta != null && m.delta !== 0 && (
              <span className={cn('text-[10px] font-medium', m.delta > 0 ? 'text-red-400' : 'text-emerald-400')}>
                {m.delta > 0 ? `↑${m.delta}` : `↓${Math.abs(m.delta)}`}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Test Suite Cards ─────────────────────────────────────────────────────────
function TestSuiteCards({ results: rawResults }: { results: Record<string, any> }) {
  // Unwrap ReviewRunnerResult wrapper if present
  const results: Record<string, any> = (rawResults.results && typeof rawResults.results === 'object')
    ? rawResults.results
    : rawResults
  const suiteCategories = ['unit_tests', 'integration_tests', 'e2e_tests', 'build', 'lint', 'type_checks', 'security', 'sast', 'format', 'code_quality', 'dependencies', 'performance']
  const active = suiteCategories.filter(k => results[k] && results[k].status !== 'skip')
  if (active.length === 0) return null

  function humanName(k: string) {
    return k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  }

  function parseNumbers(cat: any) {
    if (!cat?.logs) return null
    const passed = (cat.logs.match(/(\d+)\s+pass(ed)?/i) || [])[1]
    const failed = (cat.logs.match(/(\d+)\s+fail(ed)?/i) || [])[1]
    const skipped = (cat.logs.match(/(\d+)\s+skip(ped)?/i) || [])[1]
    const duration = (cat.logs.match(/([\d.]+)s/i) || [])[1]
    if (!passed && !failed) return null
    return { passed: passed ? parseInt(passed) : 0, failed: failed ? parseInt(failed) : 0, skipped: skipped ? parseInt(skipped) : 0, duration }
  }

  return (
    <div>
      <p className="text-[11px] font-medium text-[var(--color-text-muted)] mb-2 uppercase tracking-wider">Test suites</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {active.map(k => {
          const cat = results[k]
          const nums = parseNumbers(cat)
          const statusColor = cat.status === 'pass' ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5'
            : cat.status === 'fail' ? 'text-red-400 border-red-500/20 bg-red-500/5'
            : 'text-amber-400 border-amber-500/20 bg-amber-500/5'
          const barColor = cat.status === 'pass' ? 'bg-emerald-500' : cat.status === 'fail' ? 'bg-red-500' : 'bg-amber-500'
          const total = nums ? (nums.passed + nums.failed + nums.skipped) : null
          const passRatio = total && total > 0 ? (nums!.passed / total) * 100 : cat.status === 'pass' ? 100 : 0

          return (
            <div key={k} className={cn('rounded-lg border p-3 space-y-2', statusColor)}>
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-medium text-white">{humanName(k)}</span>
                <span className="text-[10px] font-bold uppercase">{cat.status}</span>
              </div>
              <div className="h-1 w-full rounded-full bg-white/10">
                <div className={cn('h-full rounded-full transition-all duration-500', barColor)} style={{ width: `${passRatio}%` }} />
              </div>
              {nums && (
                <div className="flex items-center gap-3 text-[10px]">
                  <span className="text-emerald-400">{nums.passed} passed</span>
                  {nums.skipped > 0 && <span className="text-zinc-500">{nums.skipped} skipped</span>}
                  {nums.failed > 0 && <span className="text-red-400">{nums.failed} failed</span>}
                  {nums.duration && <span className="text-zinc-500 ml-auto">{nums.duration}s</span>}
                </div>
              )}
              {!nums && cat.issuesCount > 0 && (
                <p className="text-[10px]">{cat.issuesCount} issue{cat.issuesCount !== 1 ? 's' : ''} detected</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── AI Findings Table ────────────────────────────────────────────────────────
function FindingsTable({ review }: { review: AIReviewData }) {
  type Row = { severity: string; label: string; detail: string; location: string; isGood?: boolean }
  const rows: Row[] = []

  // Strengths (good)
  for (const s of review.strengths || []) {
    rows.push({ severity: 'good', label: s.slice(0, 60), detail: s, location: '', isGood: true })
  }
  // Active issues
  for (const issue of review.issues || []) {
    rows.push({
      severity: issue.severity,
      label: issue.message.slice(0, 60),
      detail: issue.suggestion ? `${issue.message} → ${issue.suggestion}` : issue.message,
      location: `${issue.file}${issue.line ? `:${issue.line}` : ''}`,
    })
  }
  // Risks
  for (const risk of review.risks || []) {
    rows.push({
      severity: risk.severity === 'high' ? 'critical' : risk.severity,
      label: risk.message.slice(0, 60),
      detail: risk.message,
      location: `${risk.category}`,
    })
  }
  // Resolved
  for (const r of review.resolvedIssues || []) {
    rows.push({ severity: 'resolved', label: r.message.slice(0, 60), detail: r.resolution, location: `${r.file}${r.line ? `:${r.line}` : ''}`, isGood: true })
  }

  if (rows.length === 0) return null

  function severityBadge(s: string) {
    if (s === 'critical') return 'bg-red-500 text-white'
    if (s === 'high') return 'bg-red-400/80 text-white'
    if (s === 'medium') return 'bg-amber-500 text-black'
    if (s === 'low') return 'bg-blue-400/80 text-white'
    if (s === 'good' || s === 'resolved') return 'bg-emerald-500 text-black'
    return 'bg-zinc-700 text-zinc-300'
  }
  function severityLabel(s: string) {
    if (s === 'critical') return 'Blocker'
    if (s === 'high') return 'High'
    if (s === 'medium') return 'Warning'
    if (s === 'low') return 'Info'
    if (s === 'resolved') return 'Fixed'
    if (s === 'good') return 'Good'
    return s
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] font-medium text-[var(--color-text-muted)] uppercase tracking-wider">AI Findings</p>
      </div>
      <div className="rounded-xl border border-[var(--color-border)] overflow-hidden">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-white/[0.02]">
              <th className="text-left px-3 py-2 text-[10px] font-medium text-[var(--color-text-muted)] uppercase tracking-wider w-20">Severity</th>
              <th className="text-left px-3 py-2 text-[10px] font-medium text-[var(--color-text-muted)] uppercase tracking-wider w-40">Finding</th>
              <th className="text-left px-3 py-2 text-[10px] font-medium text-[var(--color-text-muted)] uppercase tracking-wider">Detail</th>
              <th className="text-left px-3 py-2 text-[10px] font-medium text-[var(--color-text-muted)] uppercase tracking-wider w-36">Location</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className={cn('border-b border-[var(--color-border)] last:border-0', row.isGood ? 'bg-emerald-500/[0.03]' : '')}>
                <td className="px-3 py-2.5">
                  <span className={cn('inline-flex items-center gap-1 text-[9px] font-bold uppercase px-2 py-0.5 rounded', severityBadge(row.severity))}>
                    {row.severity === 'critical' && '⊗ '}
                    {row.severity === 'medium' && '△ '}
                    {(row.severity === 'good' || row.severity === 'resolved') && '✓ '}
                    {severityLabel(row.severity)}
                  </span>
                </td>
                <td className="px-3 py-2.5 font-medium text-white max-w-[160px]">
                  <span className="line-clamp-2">{row.label}</span>
                </td>
                <td className="px-3 py-2.5 text-[var(--color-text-muted)] leading-relaxed max-w-xs">
                  <span className="line-clamp-3">{row.detail}</span>
                </td>
                <td className="px-3 py-2.5 font-mono text-[var(--color-text-muted)] text-[10px]">
                  <span className="truncate block max-w-[140px]">{row.location}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Files Changed with Risk Tiers ───────────────────────────────────────────
function FilesChanged({ review }: { review: AIReviewData }) {
  // Build file risk map from issues/risks
  const riskMap = new Map<string, 'high' | 'medium' | 'low'>()
  for (const issue of review.issues || []) {
    const cur = riskMap.get(issue.file)
    const next = (issue.severity === 'critical' || issue.severity === 'high') ? 'high'
      : issue.severity === 'medium' ? 'medium' : 'low'
    if (!cur || (next === 'high') || (next === 'medium' && cur === 'low')) {
      riskMap.set(issue.file, next)
    }
  }
  for (const edit of review.unauthorizedEdits || []) {
    riskMap.set(edit, 'high')
  }

  // Get all changed files from comparison or issues
  const allFiles = new Set<string>([
    ...Array.from(riskMap.keys()),
    ...(review.issues || []).map((i: any) => i.file).filter(Boolean),
  ])

  if (allFiles.size === 0) return null

  const files = Array.from(allFiles).sort((a, b) => {
    const ra = riskMap.get(a) ?? 'low'
    const rb = riskMap.get(b) ?? 'low'
    const order = { high: 0, medium: 1, low: 2 }
    return order[ra] - order[rb]
  })

  function riskBadge(r?: string) {
    if (r === 'high') return 'text-red-400 bg-red-500/10 border-red-500/20'
    if (r === 'medium') return 'text-amber-400 bg-amber-500/10 border-amber-500/20'
    return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
  }
  function riskLabel(r?: string) {
    if (r === 'high') return 'High risk'
    if (r === 'medium') return 'Med risk'
    return 'Low risk'
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] font-medium text-[var(--color-text-muted)] uppercase tracking-wider">Files changed</p>
        <span className="text-[11px] text-[var(--color-text-muted)]">{files.length} file{files.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="rounded-xl border border-[var(--color-border)] divide-y divide-[var(--color-border)] overflow-hidden">
        {files.map(f => {
          const risk = riskMap.get(f)
          const isUnauth = review.unauthorizedEdits?.includes(f)
          return (
            <div key={f} className="flex items-center gap-3 px-3 py-2.5 bg-white/[0.01] hover:bg-white/[0.03] transition-colors">
              <svg className="w-3.5 h-3.5 text-[var(--color-text-muted)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              <span className="font-mono text-[11px] text-white/80 flex-1 truncate">{f}</span>
              {isUnauth && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border text-red-400 bg-red-500/10 border-red-500/20 shrink-0">Unauthorized</span>
              )}
              <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0', riskBadge(risk))}>
                {riskLabel(risk)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Action Buttons — replaced by informational guidance; only keep GitHub link ──
function ActionButtons({ review, prUrl }: {
  review: AIReviewData
  prUrl?: string
}) {
  if (!prUrl) return null
  return (
    <div className="pt-2 border-t border-[var(--color-border)]">
      <a
        href={prUrl}
        target="_blank"
        rel="noreferrer"
        className="flex items-center justify-center gap-2 w-full h-10 rounded-lg border border-[var(--color-border)] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10 text-[13px] font-medium text-white transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
        View PR on GitHub
      </a>
    </div>
  )
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function AIReviewReport({ review, title, prUrl }: AIReviewReportProps) {
  const rawResults = review.results
  const hasResults = rawResults && (
    Object.keys(rawResults).length > 0 &&
    // handle both flat and nested ReviewRunnerResult
    (rawResults.results ? Object.keys(rawResults.results).length > 0 : true)
  )

  return (
    <div className="space-y-5 text-left">
      {/* Header: title + score ring */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          {title && <p className="text-[13px] font-medium text-white truncate">{title}</p>}
          <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
            PR #{review.prNumber}
            {review.commitSha && <span className="font-mono ml-2 opacity-60">{review.commitSha.slice(0, 7)}</span>}
            <span className="ml-2">{new Date(review.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
          </p>
        </div>
        <div className="relative flex flex-col items-center shrink-0">
          <ScoreRing score={review.score} />
        </div>
      </div>

      {/* Verdict banner */}
      <VerdictBanner verdict={review.verdict} summary={review.summary} />

      {/* Metrics strip */}
      <MetricsStrip review={review} />

      {/* Test suite cards */}
      {hasResults && <TestSuiteCards results={review.results!} />}

      {/* AI Findings table */}
      <FindingsTable review={review} />

      {/* Files changed */}
      <FilesChanged review={review} />

      {/* Action buttons — GitHub link only */}
      {prUrl && <ActionButtons review={review} prUrl={prUrl} />}
    </div>
  )
}
