'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { IndianRupee, Calendar, Tag, AlertCircle, CheckCircle2, Search, X, Plus } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import FileTree from '@/components/sandbox/FileTree'
import AIReviewReport from '@/components/sandbox/AIReviewReport'

interface Repository {
  id: number
  name: string
  full_name: string
  private: boolean
  language: string | null
  description: string | null
  html_url: string
}

interface Organization {
  login: string
  id: number
  description: string | null
}

interface SandboxRepo {
  id: string
  sourceRepo: string
  sandboxRepo: string
  taskTitle: string | null
  taskDescription: string | null
  frontendStack: string | null
  backendStack: string | null
  allowedPaths: string | null
  restrictedPaths: string | null
  acceptanceCriteria: string | null
  createdAt: string
  verificationStatus?: 'verifying' | 'verified' | 'failed' | null
}

interface PRDetails {
  title: string
  url: string
  number: number
  state: string
  createdAt: string
}

interface DevStatus {
  hasFork: boolean
  hasPR: boolean
  prDetails: PRDetails | null
}

interface AIIssue {
  file: string
  line: number
  severity: 'critical' | 'high' | 'medium' | 'low'
  message: string
  suggestion: string
  status?: 'new' | 'unresolved'
}

interface AIRisk {
  category: 'security' | 'safety' | 'credential'
  message: string
  severity: 'high' | 'medium' | 'low'
  status?: 'new' | 'unresolved'
}

interface AIResolvedIssue {
  file: string
  line: number
  severity: 'critical' | 'high' | 'medium' | 'low'
  message: string
  resolution: string
}

interface AIResolvedRisk {
  category: 'security' | 'safety' | 'credential'
  message: string
  severity: 'high' | 'medium' | 'low'
  resolution: string
}

interface AIReview {
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
  // Deterministic review fields
  results?: Record<string, any>
  comparison?: Record<string, any>
  reportHtml?: string
  commitSha?: string
  createdAt: string
}

interface PRWithReview {
  fork: {
    id: string
    githubUsername: string
    sandboxRepo: string
    forkUrl: string
    prUrl: string | null
    createdAt: string
  }
  review: AIReview | null
}

export default function SandboxHome({
  presetRole,
  embedded = false,
}: {
  presetRole?: 'owner' | 'developer'
  embedded?: boolean
}) {
  const searchParams = useSearchParams()
  const router = useRouter()

  // --- Core Session State ---
  const [githubUsername, setGithubUsername] = useState<string | null>(null)
  const [role, setRole] = useState<'owner' | 'developer' | null>(presetRole || null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loadingSession, setLoadingSession] = useState(true)

  // --- Owner Dashboard State ---
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [selectedScope, setSelectedScope] = useState<string>('personal')
  const [ownerRepos, setOwnerRepos] = useState<Repository[]>([])
  const [loadingRepos, setLoadingRepos] = useState(false)
  const [repoSearch, setRepoSearch] = useState('')
  const [selectedOwnerRepo, setSelectedOwnerRepo] = useState<Repository | null>(null)
  const [mirroredRepos, setMirroredRepos] = useState<SandboxRepo[]>([])

  // --- Mirroring Pipeline State ---
  const [activeJobId, setActiveJobId] = useState<string | null>(null)
  const [mirrorStatus, setMirrorStatus] = useState<'idle' | 'running' | 'success' | 'failed'>('idle')
  const [mirrorProgress, setMirrorProgress] = useState(0)
  const [mirrorLogs, setMirrorLogs] = useState<string[]>([])
  const logsEndRef = useRef<HTMLDivElement>(null)
  const terminalRef = useRef<HTMLDivElement>(null)
  const [deletingRepos, setDeletingRepos] = useState<Record<string, boolean>>({})

  // --- Review Engine Baseline & Validation States ---
  const [baselines, setBaselines] = useState<Record<string, any>>({})
  const [triggeringBaseline, setTriggeringBaseline] = useState<Record<string, boolean>>({})
  const [selectedBaselineReport, setSelectedBaselineReport] = useState<any>(null)
  const [selectedBaselineCategoryLog, setSelectedBaselineCategoryLog] = useState<string | null>(null)

  // --- Owner Task Form State ---
  const [taskFormSandbox, setTaskFormSandbox] = useState<SandboxRepo | null>(null)
  const [taskFormOpen, setTaskFormOpen] = useState(false)
  const [savingTask, setSavingTask] = useState(false)
  const [taskSubmitted, setTaskSubmitted] = useState<string | null>(null) // holds submitted task title on success
  const [taskForm, setTaskForm] = useState({
    taskTitle: '',
    taskDescription: '',
    frontendStack: '',
    backendStack: '',
    allowedPaths: '',
    restrictedPaths: '',
    acceptanceCriteria: '',
  })

  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [skillSearchQuery, setSkillSearchQuery] = useState('')
  const [isSkillDropdownOpen, setIsSkillDropdownOpen] = useState(false)
  const [budget, setBudget] = useState('500')
  const [deadline, setDeadline] = useState('')
  // File tree: set of file paths the owner has checked as "allowed to edit"
  const [checkedPaths, setCheckedPaths] = useState<Set<string>>(new Set())

  // Derive frontend/backend stack based on selected skills to keep the backend validated
  useEffect(() => {
    let frontend = ''
    let backend = ''

    if (selectedSkills.length > 0) {
      frontend = 'Vanilla HTML/CSS/JS'
      backend = 'Node.js + Express'

      if (selectedSkills.includes('Next.js')) {
        frontend = 'Next.js'
        backend = 'Next.js API Routes'
      } else if (selectedSkills.includes('React') || selectedSkills.includes('Tailwind') || selectedSkills.includes('TypeScript')) {
        frontend = 'React + Vite'
      } else if (selectedSkills.includes('Vue')) {
        frontend = 'Vue + Vite'
      } else if (selectedSkills.includes('Svelte')) {
        frontend = 'Svelte'
      } else if (selectedSkills.includes('Angular')) {
        frontend = 'Angular'
      }

      if (selectedSkills.includes('Python') || selectedSkills.includes('FastAPI')) {
        backend = 'FastAPI (Python)'
      } else if (selectedSkills.includes('Django')) {
        backend = 'Django'
      } else if (selectedSkills.includes('Go')) {
        backend = 'Go + Gin'
      }
    }

    setTaskForm(prev => ({
      ...prev,
      frontendStack: frontend,
      backendStack: backend
    }))
  }, [selectedSkills])

  // Sync checkedPaths ? allowedPaths / restrictedPaths in taskForm
  // treeAllFilesRef holds every file path in the loaded tree (set once on tree load)
  const treeAllFilesRef = useRef<string[]>([])

  const handleCheckedPathsChange = useCallback((next: Set<string>) => {
    setCheckedPaths(next)
    const files = treeAllFilesRef.current
    const allowed = files.filter(f => next.has(f))
    const restricted = files.filter(f => !next.has(f))
    setTaskForm(prev => ({
      ...prev,
      allowedPaths: allowed.join('\n'),
      restrictedPaths: restricted.join('\n'),
    }))
  }, [])

  const handleTreeLoad = useCallback((allFilePaths: string[]) => {
    treeAllFilesRef.current = allFilePaths
  }, [])

  const selectedRepoMirror = useMemo(() => {
    if (!selectedOwnerRepo) return null;
    return mirroredRepos.find(m => m.sourceRepo === selectedOwnerRepo.full_name) || null;
  }, [selectedOwnerRepo, mirroredRepos]);

  // --- Owner PR Review Dashboard State ---
  const [selectedSandboxForPRs, setSelectedSandboxForPRs] = useState<SandboxRepo | null>(null)
  const [sandboxPRs, setSandboxPRs] = useState<PRWithReview[]>([])
  const [loadingPRs, setLoadingPRs] = useState(false)
  const [selectedPR, setSelectedPR] = useState<PRWithReview | null>(null)
  const [prActionInProgress, setPrActionInProgress] = useState(false)
  const [prActionMessage, setPrActionMessage] = useState('')

  // --- Developer Dashboard State ---
  const [selectedSandboxRepo, setSelectedSandboxRepo] = useState<SandboxRepo | null>(null)
  const [loadingSandboxRepos, setLoadingSandboxRepos] = useState(false)

  // --- Developer Fork / Verification State ---
  const [registeringFork, setRegisteringFork] = useState(false)
  const [forkRegistered, setForkRegistered] = useState(false)
  const [forkUrl, setForkUrl] = useState('')

  const [checkingStatus, setCheckingStatus] = useState(false)
  const [devStatus, setDevStatus] = useState<DevStatus>({
    hasFork: false,
    hasPR: false,
    prDetails: null
  })

  // --- Developer AI Review State ---
  const [loadingReview, setLoadingReview] = useState(false)
  const [aiReview, setAiReview] = useState<AIReview | null>(null)
  const [devReviewStatus, setDevReviewStatus] = useState<'idle' | 'verifying' | 'done'>('idle')
  const [activeReviewJobId, setActiveReviewJobId] = useState<string | null>(null)
  const [activeReviewProgress, setActiveReviewProgress] = useState<number>(0)
  const [activeReviewLogs, setActiveReviewLogs] = useState<string[]>([])
  const devTerminalRef = useRef<HTMLDivElement>(null)

  // --- PR Comparison Modal State ---
  const [comparisonModalOpen, setComparisonModalOpen] = useState(false)
  const [comparisonPRReview, setComparisonPRReview] = useState<AIReview | null>(null)
  const [comparisonTitle, setComparisonTitle] = useState<string>('')
  const [comparisonTab, setComparisonTab] = useState<'overview' | 'issues' | 'risks' | 'deterministic'>('overview')

  const [reviewExpandedSections, setReviewExpandedSections] = useState<Record<string, boolean>>({
    strengths: true, issues: true, risks: true, unauthorized: true, resolved: true,
  })

  // --- Parse & Persist Session ---
  useEffect(() => {
    const successParam = searchParams.get('success') === 'true'
    const githubIdParam = searchParams.get('github_id')
    const roleParam = searchParams.get('role') as 'owner' | 'developer' | null

    if (successParam && githubIdParam && roleParam) {
      setGithubUsername(githubIdParam)
      setRole(roleParam)
      setIsLoggedIn(true)
      localStorage.setItem('forke_github_username', githubIdParam)
      localStorage.setItem('forke_role', roleParam)
      // Clean up URL params after storing session
      router.replace(roleParam === 'owner' ? '/owner' : '/developer')
    } else {
      const savedUsername = localStorage.getItem('forke_github_username')
      const savedRole = localStorage.getItem('forke_role') as 'owner' | 'developer' | null
      const activeRole = presetRole || savedRole
      if (savedUsername && activeRole) {
        setGithubUsername(savedUsername)
        setRole(activeRole)
        setIsLoggedIn(true)
      }
    }
    setLoadingSession(false)
  }, [searchParams, router, presetRole])

  const handleSignOut = () => {
    localStorage.removeItem('forke_github_username')
    localStorage.removeItem('forke_role')
    setGithubUsername(null)
    setRole(presetRole || null)
    setIsLoggedIn(false)
    router.push(presetRole === 'owner' ? '/owner' : presetRole === 'developer' ? '/developer' : '/')
  }

  // --- API Fetches: Owner ---
  const fetchOwnerReposAndOrgs = async (scope: string) => {
    if (!githubUsername) return
    setLoadingRepos(true)
    try {
      const orgParam = scope === 'personal' ? '' : `&org=${scope}`
      const response = await fetch(`/api/owner/repos?username=${githubUsername}${orgParam}`)
      const data = await response.json()
      if (response.ok) {
        setOwnerRepos(data.repos || [])
        if (data.organizations) {
          setOrganizations(data.organizations)
        }
      } else {
        console.error('Error fetching repos:', data.error)
      }
    } catch (err) {
      console.error('Network error fetching repos:', err)
    } finally {
      setLoadingRepos(false)
    }
  };

  const fetchBaselineForRepo = async (sandboxRepoName: string) => {
    try {
      const res = await fetch(`/api/owner/baseline?sandboxRepo=${encodeURIComponent(sandboxRepoName)}`)
      const data = await res.json()
      if (res.ok && data.snapshot) {
        setBaselines(prev => ({ ...prev, [sandboxRepoName]: data.snapshot }))
      } else {
        setBaselines(prev => ({ ...prev, [sandboxRepoName]: null }))
      }
    } catch (err) {
      console.error(`Failed to fetch baseline for ${sandboxRepoName}:`, err)
    }
  }

  const triggerBaselineSnapshot = async (sandboxRepoName: string) => {
    setTriggeringBaseline(prev => ({ ...prev, [sandboxRepoName]: true }))
    setMirrorStatus('running')
    setMirrorProgress(0)
    setMirrorLogs(['INIT Triggering manual baseline snapshot generation...'])
    try {
      const res = await fetch('/api/owner/baseline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: githubUsername,
          sandboxRepo: sandboxRepoName
        })
      })
      const data = await res.json()
      if (res.ok) {
        setMirrorStatus('success')
        setMirrorProgress(100)
        setMirrorLogs(prev => [...prev, 'SUCCESS Baseline snapshot generated successfully.'])
        fetchBaselineForRepo(sandboxRepoName)
      } else {
        setMirrorStatus('failed')
        setMirrorLogs(prev => [...prev, `FAILED ${data.error || 'Failed to trigger baseline snapshot.'}`])
      }
    } catch (err: any) {
      setMirrorStatus('failed')
      setMirrorLogs(prev => [...prev, `FAILED ${err.message || 'Unknown network error.'}`])
    } finally {
      setTriggeringBaseline(prev => ({ ...prev, [sandboxRepoName]: false }))
    }
  }

  const copyAllBaselineLogs = () => {
    if (!selectedBaselineReport || !selectedBaselineReport.results) return;
    let allLogs = '';
    Object.keys(selectedBaselineReport.results).forEach(category => {
      const res = selectedBaselineReport.results[category];
      const logContent = res ? (res.logs || res.output) : '';
      if (logContent) {
        allLogs += `=== CATEGORY: ${category.toUpperCase()} ===\n${logContent}\n\n`;
      }
    });
    navigator.clipboard.writeText(allLogs);
    alert('All baseline logs copied to clipboard!');
  };

  const fetchMirrors = async () => {
    try {
      const response = await fetch(`/api/owner/mirrors?t=${Date.now()}`, {
        cache: 'no-store',
      })
      const data = await response.json()
      if (response.ok) {
        setMirroredRepos(data || [])
        if (Array.isArray(data)) {
          data.forEach(m => fetchBaselineForRepo(m.sandboxRepo))
        }
      }
    } catch (err) {
      console.error('Failed to fetch mirrors:', err)
    }
  };

  useEffect(() => {
    if (isLoggedIn && role === 'owner' && githubUsername) {
      fetchOwnerReposAndOrgs(selectedScope)
      fetchMirrors()
    }
  }, [isLoggedIn, role, githubUsername, selectedScope])

  // --- API Fetches: Developer ---
  useEffect(() => {
    if (isLoggedIn && role === 'developer') {
      setLoadingSandboxRepos(true)
      fetchMirrors().finally(() => setLoadingSandboxRepos(false))
    }
  }, [isLoggedIn, role])

  // --- Poll Developer PR Review Status ---
  useEffect(() => {
    let intervalId: NodeJS.Timeout
    if (isLoggedIn && role === 'developer' && devStatus.hasPR && devReviewStatus === 'verifying') {
      intervalId = setInterval(async () => {
        const review = await fetchAIReview()
        if (review) {
          setDevReviewStatus('done')
          setActiveReviewJobId(null)
        }
      }, 4000)
    }
    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [devStatus.hasPR, devReviewStatus, isLoggedIn, role])

  // --- Poll Developer PR Review Verification Logs ---
  useEffect(() => {
    let intervalId: NodeJS.Timeout
    if (isLoggedIn && role === 'developer' && devReviewStatus === 'verifying' && activeReviewJobId) {
      intervalId = setInterval(async () => {
        try {
          const res = await fetch(`/api/owner/mirror-status?jobId=${activeReviewJobId}`)
          const data = await res.json()
          if (res.ok && data) {
            if (data.logs) {
              setActiveReviewLogs(data.logs)
            }
            if (typeof data.progress === 'number') {
              setActiveReviewProgress(data.progress)
            }
            if (data.status === 'success') {
              const review = await fetchAIReview()
              if (review) {
                setDevReviewStatus('done')
              }
              setActiveReviewJobId(null)
            } else if (data.status === 'failed') {
              setActiveReviewJobId(null)
              setDevReviewStatus('idle')
            }
          }
        } catch (err) {
          console.error('Error polling verification logs:', err)
        }
      }, 1500)
    }
    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [isLoggedIn, role, devReviewStatus, activeReviewJobId])

  // --- Search Filter ---
  const filteredRepos = useMemo(() => {
    return ownerRepos.filter(repo =>
      repo.name.toLowerCase().includes(repoSearch.toLowerCase()) ||
      (repo.description && repo.description.toLowerCase().includes(repoSearch.toLowerCase()))
    )
  }, [ownerRepos, repoSearch])

  // --- Background Mirror Pipeline Polling ---
  useEffect(() => {
    let intervalId: NodeJS.Timeout
    if (activeJobId && mirrorStatus === 'running') {
      intervalId = setInterval(async () => {
        try {
          const res = await fetch(`/api/owner/mirror-status?jobId=${activeJobId}`)
          const data = await res.json()
          if (res.ok) {
            setMirrorLogs(data.logs || [])
            setMirrorProgress(data.progress || 0)
            if (data.status === 'success' || data.status === 'failed') {
              setMirrorStatus(data.status)
              setActiveJobId(null)
              fetchMirrors() // refresh list of active mirrors
            }
          }
        } catch (err) {
          console.error('Error polling mirror status:', err)
        }
      }, 800)
    }
    return () => clearInterval(intervalId)
  }, [activeJobId, mirrorStatus])

  // --- Poll for Verification Status updates ---
  useEffect(() => {
    let intervalId: NodeJS.Timeout
    const hasVerifying = mirroredRepos.some(r => r.verificationStatus === 'verifying')
    if (hasVerifying && isLoggedIn && role === 'owner') {
      intervalId = setInterval(() => {
        fetchMirrors()
      }, 3000)
    }
    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [mirroredRepos, isLoggedIn, role])

  // Auto-scroll logs terminal container without moving browser window scroll
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [mirrorLogs])

  // Auto-scroll developer review terminal logs
  useEffect(() => {
    if (devTerminalRef.current) {
      devTerminalRef.current.scrollTop = devTerminalRef.current.scrollHeight
    }
  }, [activeReviewLogs])

  const executeMirrorPipeline = async () => {
    if (!githubUsername || !selectedOwnerRepo) return

    setMirrorStatus('running')
    setMirrorProgress(0)
    setMirrorLogs(['INIT Triggering mirroring request...'])
    
    try {
      const response = await fetch('/api/owner/mirror', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: githubUsername,
          sourceRepo: selectedOwnerRepo.full_name,
          targetOrg: selectedScope,
          taskTitle: '',
          taskDescription: '',
          frontendStack: '',
          backendStack: '',
          allowedPaths: '',
          restrictedPaths: '',
          acceptanceCriteria: '',
        })
      })

      const data = await response.json()
      if (response.ok && data.jobId) {
        setActiveJobId(data.jobId)
      } else {
        setMirrorStatus('failed')
        setMirrorLogs(prev => [...prev, `FAILED ${data.error || 'Failed to start mirroring pipeline'}`])
      }
    } catch (err: any) {
      setMirrorStatus('failed')
      setMirrorLogs(prev => [...prev, `FAILED Connection error: ${err.message}`])
    }
  };

  const handleDeleteSandbox = async (sandboxRepoName: string) => {
    if (!githubUsername) return
    if (!confirm(`Are you absolutely sure you want to delete the sandbox "${sandboxRepoName}"?\n\nThis will delete the repository from GitHub, clean up its database entry, and delete all associated developer forks from the database and GitHub.`)) {
      return
    }

    setDeletingRepos(prev => ({ ...prev, [sandboxRepoName]: true }))
    try {
      const response = await fetch('/api/owner/sandbox', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: githubUsername,
          sandboxRepo: sandboxRepoName
        })
      })
      const data = await response.json()
      if (response.ok && data.success) {
        let message = `Sandbox "${sandboxRepoName}" deleted successfully!\n\n`
        if (data.sandboxDeletedOnGitHub) {
          message += `� Cleaned up sandbox organization repository on GitHub.\n`
        } else {
          message += `� Warning: Failed to clean up organization repo on GitHub: ${data.sandboxDeleteError || 'Unknown API issue'}.\n`
        }

        const deletedForks = data.deletedForks || []
        if (deletedForks.length > 0) {
          const ghCount = deletedForks.filter((f: any) => f.deletedOnGitHub).length
          message += `� Cleaned up ${deletedForks.length} fork record(s) from database.\n`
          message += `� Cleaned up ${ghCount} fork repository/repositories from GitHub (best effort).`
        }
        alert(message)
        fetchMirrors()
      } else {
        alert(data.error || 'Failed to delete sandbox repository')
      }
    } catch (err: any) {
      alert(`Connection error deleting sandbox: ${err.message}`)
    } finally {
      setDeletingRepos(prev => {
        const copy = { ...prev }
        delete copy[sandboxRepoName]
        return copy
      })
    }
  }

  // --- Developer Actions ---
  const handleSelectSandboxRepo = (repo: SandboxRepo) => {
    setSelectedSandboxRepo(repo)
    setForkRegistered(false)
    setForkUrl('')
    setDevStatus({
      hasFork: false,
      hasPR: false,
      prDetails: null
    })
    setAiReview(null) // reset AI review when switching repos
  };

  const openTaskForm = (sandbox: SandboxRepo) => {
    // 1. Set selected owner repo (either real or mock)
    const existingRepo = ownerRepos.find(r => r.full_name === sandbox.sourceRepo)
    if (existingRepo) {
      setSelectedOwnerRepo(existingRepo)
    } else {
      setSelectedOwnerRepo({
        id: Date.now(),
        name: sandbox.sourceRepo.split('/')[1] || sandbox.sourceRepo,
        full_name: sandbox.sourceRepo,
        private: true,
        language: sandbox.frontendStack || sandbox.backendStack || null,
        description: sandbox.taskDescription || null,
        html_url: `https://github.com/${sandbox.sourceRepo}`
      })
    }

    setTaskFormSandbox(sandbox)
    setTaskForm({
      taskTitle: sandbox.taskTitle || '',
      taskDescription: sandbox.taskDescription || '',
      frontendStack: sandbox.frontendStack || '',
      backendStack: sandbox.backendStack || '',
      allowedPaths: sandbox.allowedPaths || '',
      restrictedPaths: sandbox.restrictedPaths || '',
      acceptanceCriteria: sandbox.acceptanceCriteria || '',
    })

    // Populate selectedSkills
    const skillsList: string[] = []
    if (sandbox.frontendStack) {
      if (sandbox.frontendStack.includes('Next.js')) skillsList.push('Next.js')
      else if (sandbox.frontendStack.includes('React')) skillsList.push('React')
      else if (sandbox.frontendStack.includes('Vue')) skillsList.push('Vue')
      else if (sandbox.frontendStack.includes('Svelte')) skillsList.push('Svelte')
      else if (sandbox.frontendStack.includes('Angular')) skillsList.push('Angular')
      if (sandbox.frontendStack.includes('Tailwind')) skillsList.push('Tailwind')
    }
    if (sandbox.backendStack) {
      if (sandbox.backendStack.includes('Node')) skillsList.push('Node.js')
      if (sandbox.backendStack.includes('Python') || sandbox.backendStack.includes('FastAPI')) {
        if (!skillsList.includes('Python')) skillsList.push('Python')
        if (sandbox.backendStack.includes('FastAPI') && !skillsList.includes('FastAPI')) skillsList.push('FastAPI')
      }
      if (sandbox.backendStack.includes('Go')) skillsList.push('Go')
      if (sandbox.backendStack.includes('Django')) skillsList.push('Django')
    }
    setSelectedSkills(skillsList)

    // Scroll smoothly to top
    window.scrollTo({ top: 0, behavior: 'smooth' })
  };

  const saveTaskForm = async () => {
    const activeSandbox = taskFormSandbox || selectedRepoMirror
    if (!githubUsername || !activeSandbox) return
    if (!taskForm.taskTitle.trim() || !taskForm.taskDescription.trim() || !taskForm.frontendStack || !taskForm.backendStack) {
      alert('Please fill out all required task configuration fields (Title, Description, and Required Skills) before saving.')
      return
    }
    setSavingTask(true)
    try {
      // Step 1: Save task metadata to the sandbox repo record (existing behaviour � must not break)
      const response = await fetch('/api/owner/task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...taskForm,
          sandboxRepo: activeSandbox.sandboxRepo,
          username: githubUsername,
        })
      })
      const data = await response.json()
      if (!response.ok) {
        alert(data.error || 'Failed to save task')
        return
      }

      // Step 2: Publish the task to the main tasks feed so it appears in /tasks
      try {
        await fetch('/api/owner/task/publish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: taskForm.taskTitle.trim(),
            description: taskForm.taskDescription.trim(),
            budget: Number(budget) || 500,
            deadline: deadline || null,
            skillTags: selectedSkills,
          }),
        })
        // Note: we don't block or error on publish failure � the sandbox save already succeeded
      } catch {
        // Silently ignore � sandbox metadata is already saved
      }

      setTaskFormOpen(false)
      fetchMirrors() // refresh mirrors list to show updated task metadata
      // Show success panel � do NOT auto-navigate; user clicks "View task" to go there
      setTaskSubmitted(taskForm.taskTitle.trim())
    } catch (err: any) {
      alert(`Network error: ${err.message}`)
    } finally {
      setSavingTask(false)
    }
  };

  // --- Owner: PR Dashboard Actions ---
  const openSandboxPRs = async (sandbox: SandboxRepo) => {
    setSelectedSandboxForPRs(sandbox)
    setSelectedPR(null)
    setSandboxPRs([])
    setLoadingPRs(true)
    try {
      const response = await fetch(`/api/owner/prs?sandboxRepo=${encodeURIComponent(sandbox.sandboxRepo)}`)
      const data = await response.json()
      if (response.ok) {
        setSandboxPRs(data.prs || [])
      }
    } catch (err) {
      console.error('Error loading PRs:', err)
    } finally {
      setLoadingPRs(false)
    }
  };

  const handlePRAction = async (action: 'merge' | 'request_changes' | 'reject', pr: PRWithReview) => {
    if (!githubUsername || !selectedSandboxForPRs || !pr.review) return
    const confirmMsg = action === 'merge'
      ? `Approve & Merge PR #${pr.review.prNumber} from @${pr.fork.githubUsername}?`
      : action === 'reject'
      ? `Reject and close PR #${pr.review.prNumber} from @${pr.fork.githubUsername}?`
      : `Request changes on PR #${pr.review.prNumber} from @${pr.fork.githubUsername}?`
    if (!confirm(confirmMsg)) return

    setPrActionInProgress(true)
    try {
      const response = await fetch('/api/owner/pr-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          sandboxRepo: selectedSandboxForPRs.sandboxRepo,
          prNumber: pr.review.prNumber,
          username: githubUsername,
          message: prActionMessage,
        })
      })
      const data = await response.json()
      if (response.ok) {
        alert(`? Action "${action.replace('_', ' ')}" completed successfully!`)
        openSandboxPRs(selectedSandboxForPRs) // refresh PR list
        setSelectedPR(null)
        setPrActionMessage('')
      } else {
        alert(data.error || 'PR action failed')
      }
    } catch (err: any) {
      alert(`Network error: ${err.message}`)
    } finally {
      setPrActionInProgress(false)
    }
  };

  // --- Open PR Review Report ---
  const handleOpenComparison = async (sandboxRepoId: string, prReview: AIReview, title: string) => {
    setComparisonPRReview(prReview)
    setComparisonTitle(title)
    setComparisonModalOpen(true)
    setComparisonTab('overview') // reset tab to overview
  }

  // --- Developer: Fetch AI Review ---
  const fetchAIReview = async () => {
    if (!githubUsername || !selectedSandboxRepo || !devStatus.prDetails) return null
    setLoadingReview(true)
    try {
      const params = new URLSearchParams({
        username: githubUsername,
        sandboxRepo: selectedSandboxRepo.sandboxRepo,
        prNumber: String(devStatus.prDetails.number),
      })
      const response = await fetch(`/api/developer/review?${params}`)
      const data = await response.json()
      if (response.ok && data.review) {
        setAiReview(data.review)
        return data.review
      } else {
        setAiReview(null)
      }
    } catch (err) {
      console.error('Error fetching AI review:', err)
    } finally {
      setLoadingReview(false)
    }
    return null
  };

  const toggleSection = (key: string) => {
    setReviewExpandedSections(prev => ({ ...prev, [key]: !prev[key] }))
  };


  const executeForkPipeline = async () => {
    if (!githubUsername || !selectedSandboxRepo) return
    setRegisteringFork(true)
    try {
      const response = await fetch('/api/developer/fork', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: githubUsername,
          sandboxRepo: selectedSandboxRepo.sandboxRepo
        })
      })
      const data = await response.json()
      if (response.ok) {
        setForkRegistered(true)
        setForkUrl(data.forkUrl)
        // Automatically open the GitHub Fork creation screen in a new tab
        window.open(data.githubForkPage, '_blank')
      } else {
        alert(data.error || 'Failed to trigger fork workflow')
      }
    } catch (err) {
      console.error(err)
      alert('Network error registering fork')
    } finally {
      setRegisteringFork(false)
    }
  };

  const checkLiveDeveloperStatus = async () => {
    if (!githubUsername || !selectedSandboxRepo) return
    setCheckingStatus(true)
    try {
      const response = await fetch(
        `/api/developer/status?username=${githubUsername}&sandboxRepo=${selectedSandboxRepo.sandboxRepo}`
      )
      const data = await response.json()
      if (response.ok) {
        setDevStatus({
          hasFork: data.hasFork,
          hasPR: data.hasPR,
          prDetails: data.prDetails
        })

        if (data.hasPR && data.prDetails) {
          // Trigger the review pipeline (in case it wasn't already triggered by webhook)
          let reviewJobId: string | null = null
          try {
            const trigRes = await fetch('/api/developer/trigger-review', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                username: githubUsername,
                sandboxRepo: selectedSandboxRepo.sandboxRepo,
                prNumber: data.prDetails.number
              })
            })
            const trigData = await trigRes.json()
            if (trigRes.ok && trigData.jobId) {
              reviewJobId = trigData.jobId
              setActiveReviewJobId(trigData.jobId)
              setActiveReviewProgress(5)
              setActiveReviewLogs(['INIT Pull request verification triggered.'])
            }
          } catch (triggerErr) {
            console.error('Error triggering review:', triggerErr)
          }

          // Fetch the AI review immediately
          setLoadingReview(true)
          try {
            const params = new URLSearchParams({
              username: githubUsername,
              sandboxRepo: selectedSandboxRepo.sandboxRepo,
              prNumber: String(data.prDetails.number),
            })
            const revRes = await fetch(`/api/developer/review?${params}`)
            const revData = await revRes.json()
            if (revRes.ok && revData.review) {
              setAiReview(revData.review)
              setDevReviewStatus('done')
              setActiveReviewJobId(null)
            } else {
              setAiReview(null)
              setDevReviewStatus('verifying')
              if (reviewJobId) {
                setActiveReviewJobId(reviewJobId)
              }
            }
          } catch (revErr) {
            console.error('Error fetching initial review:', revErr)
            setDevReviewStatus('verifying')
            if (reviewJobId) {
              setActiveReviewJobId(reviewJobId)
            }
          } finally {
            setLoadingReview(false)
          }
        } else {
          setDevReviewStatus('idle')
          setAiReview(null)
          setActiveReviewJobId(null)
        }
      } else {
        alert(data.error || 'Status verification failed')
      }
    } catch (err) {
      console.error(err)
      alert('Network error verifying status')
    } finally {
      setCheckingStatus(false)
    }
  };

  // --- Styled Terminal Logs Color Formatter ---
  const formatTerminalLog = (log: string) => {
    const spaceIndex = log.indexOf(' ')
    if (spaceIndex === -1) return <span>{log}</span>

    const tag = log.substring(0, spaceIndex)
    const message = log.substring(spaceIndex + 1)

    let tagColor = 'text-zinc-400'
    if (tag === 'INIT') tagColor = 'text-blue-400 font-bold'
    if (tag === 'CHECKING') tagColor = 'text-amber-400 font-semibold'
    if (tag === 'CREATING' || tag === 'GIT_INIT') tagColor = 'text-teal-400 font-semibold animate-pulse'
    if (tag === 'CREATED' || tag === 'GIT_CLONE_SUCCESS' || tag === 'GIT_PUSH_SUCCESS') tagColor = 'text-emerald-400 font-bold'
    if (tag === 'GIT_CLONE') tagColor = 'text-purple-400'
    if (tag === 'GIT_PUSH') tagColor = 'text-pink-400'
    if (tag === 'CLEANUP') tagColor = 'text-zinc-500'
    if (tag === 'SUCCESS') tagColor = 'text-emerald-400 font-black tracking-wide border border-emerald-500/20 px-2 py-0.5 rounded bg-emerald-500/10'
    if (tag === 'FAILED') tagColor = 'text-red-400 font-black border border-red-500/20 px-2 py-0.5 rounded bg-red-500/10 animate-bounce'

    return (
      <div className="py-1 flex items-start gap-2 select-text font-mono text-xs md:text-sm">
        <span className={`shrink-0 ${tagColor} select-none`}>[{tag}]</span>
        <span className="text-zinc-300">{message}</span>
      </div>
    )
  };

  // --- Clipboard Copy Helper ---
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  };

  if (loadingSession) {
    return (
      <div className={cn("flex items-center justify-center app-page-shell relative overflow-hidden", embedded ? "min-h-[280px]" : "min-h-screen")}>
        <div className="flex flex-col items-center gap-6 relative z-10">
          <div className="relative">
            <div className="w-14 h-14 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center font-semibold text-accent text-2xl">
              F
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-9 h-9 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[var(--color-text-muted)] text-xs font-medium animate-pulse">
              Authenticating Sandbox Session...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      "app-page-shell relative overflow-hidden flex flex-col w-full",
      embedded ? "min-h-0" : "min-h-screen bg-[var(--color-bg-surface)] theme-ember"
    )}>
      {!embedded && (
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      )}
      {/* --- Logged In Navbar --- */}


      {/* --- Main Dashboard Body --- */}
      <main className={cn(
        "flex-1 flex flex-col w-full mx-auto relative z-10",
        embedded ? "p-0 max-w-none" : "p-5 md:p-8 max-w-7xl"
      )}>
        {!isLoggedIn ? (
          /* ========================================================================= */
          /* ======================== 1. Welcome / Auth Page ======================== */
          /* ========================================================================= */
          <div className="flex-1 flex flex-col items-center justify-center max-w-4xl w-full mx-auto py-12">
            <div className="text-center mb-10 animate-fade-in relative">
              <div className="inline-flex w-14 h-14 rounded-xl bg-accent text-[#0a0a0a] items-center justify-center font-semibold text-2xl mb-6">
                F
              </div>
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mb-3 text-white">
                Forke Native Sandbox
              </h1>
              <p className="text-[var(--color-text-muted)] max-w-2xl mx-auto text-sm leading-relaxed">
                A secure environment to validate OAuth permissions, orchestrate git mirrors under <span className="text-white font-medium">{process.env.NEXT_PUBLIC_GITHUB_SANDBOX_ORG || 'forke-sandbox'}</span>, and configure review-ready engineering workspaces.
              </p>
            </div>

            <div className={cn(
              "w-full animate-scale-up",
              presetRole ? "max-w-md mx-auto" : "grid md:grid-cols-2 gap-8 max-w-3xl"
            )}>
              {/* Owner Authentication Box */}
              {(!presetRole || presetRole === 'owner') && (
                <div className="group relative app-panel app-panel-hover p-6 flex flex-col justify-between overflow-hidden">
                  <div className="relative z-10">
                    <div className="w-11 h-11 rounded-lg bg-accent/10 border border-accent/20 text-accent flex items-center justify-center mb-5 transition-colors">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>

                    <h3 className="text-lg font-semibold mb-2 text-white group-hover:text-accent transition-colors">
                      Repository Owner
                    </h3>

                    <p className="text-[var(--color-text-muted)] text-sm leading-relaxed mb-8">
                      Import production repository structures, select scopes/organizations, and run bare mirroring pipelines inside sandbox target directories.
                    </p>
                  </div>

                  <a
                    href="/api/auth/login?role=owner"
                    className="w-full h-10 px-4 rounded-lg ui-btn-primary text-center text-[13px] font-medium transition-colors flex items-center justify-center relative z-10"
                  >
                    Authorize as Owner
                  </a>
                </div>
              )}

              {/* Developer Authentication Box */}
              {(!presetRole || presetRole === 'developer') && (
                <div className="group relative app-panel app-panel-hover p-6 flex flex-col justify-between overflow-hidden">
                  <div className="relative z-10">
                    <div className="w-11 h-11 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-5 transition-colors">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                    </div>

                    <h3 className="text-lg font-semibold mb-2 text-white group-hover:text-emerald-400 transition-colors">
                      Developer Contributor
                    </h3>

                    <p className="text-[var(--color-text-muted)] text-sm leading-relaxed mb-8">
                      Fork sandbox projects seamlessly, execute branchless git instructions locally, and push contributions directly back via native pull request checks.
                    </p>
                  </div>

                  <a
                    href="/api/auth/login?role=developer"
                    className="w-full h-10 px-4 rounded-lg bg-emerald-400 text-[#0a0a0a] hover:bg-emerald-300 text-center text-[13px] font-medium transition-colors flex items-center justify-center relative z-10"
                  >
                    Authorize as Developer
                  </a>
                </div>
              )}
            </div>

          </div>
        ) : role === 'owner' ? (
          /* ========================================================================= */
          /* ======================== 2. Owner Dashboard Space ======================== */
          /* ========================================================================= */
          <div className="space-y-10 animate-fade-in">
            {/* Core Ingestion Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-12 select-none">
              
              {/* Left Column (lg:col-span-2) */}
              <div className="lg:col-span-2 space-y-6 text-left">
                
                {/* Case 1: Selected repo has NOT been imported yet */}
                {selectedRepoMirror === null ? (
                  <>
                    {/* Repository Selection */}
                    <div className="space-y-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[var(--color-border)] pb-3">
                        <div>
                          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Select Repository</h3>
                          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Choose a repository to start the review</p>
                        </div>
                        
                        {/* Search & Scope Selector */}
                        <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                          <div className="relative group">
                            <select
                              value={selectedScope}
                              onChange={(e) => setSelectedScope(e.target.value)}
                              className="bg-[#070709] border border-[var(--color-border)] hover:border-white/10 rounded-lg px-3 py-1.5 text-xs text-white/80 focus:outline-none focus:border-accent cursor-pointer transition appearance-none pr-8 min-w-[150px]"
                            >
                              <option value="personal">Personal Profile</option>
                              {organizations.map(org => (
                                <option key={org.id} value={org.login}>
                                  Org: {org.login}
                                </option>
                              ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                              ?
                            </div>
                          </div>

                          <div className="relative">
                            <input
                              type="text"
                              placeholder="Search repositories..."
                              value={repoSearch}
                              onChange={(e) => setRepoSearch(e.target.value)}
                              className="bg-white/[0.02] border border-[var(--color-border)] focus:border-accent rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-white/20 focus:outline-none transition min-w-[180px]"
                            />
                            <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500">
                              <Search className="w-3.5 h-3.5" />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Repository Cards Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[290px] overflow-y-auto pr-2 custom-scrollbar">
                        {loadingRepos ? (
                          <div className="col-span-full flex flex-col items-center justify-center py-12 gap-2 bg-white/[0.01] border border-[var(--color-border)] rounded-xl">
                            <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-[11px] text-[var(--color-text-muted)] font-medium">Scanning repositories...</span>
                          </div>
                        ) : filteredRepos.length === 0 ? (
                          <div className="col-span-full py-12 text-center text-[var(--color-text-muted)] text-xs border border-dashed border-[var(--color-border)] rounded-xl bg-white/[0.01]">
                            No matching repositories found.
                          </div>
                        ) : (
                          filteredRepos.map(repo => {
                            const isSelected = selectedOwnerRepo?.id === repo.id
                            return (
                              <button
                                key={repo.id}
                                type="button"
                                onClick={() => {
                                  setSelectedOwnerRepo(repo);
                                  // Maintain clean form fields on switch
                                  setTaskForm(prev => ({
                                    ...prev,
                                    taskTitle: prev.taskTitle || '',
                                    taskDescription: prev.taskDescription || '',
                                  }));
                                }}
                                className={cn(
                                  "w-full text-left p-4 rounded-xl border flex flex-col gap-2 relative overflow-hidden transition-all duration-300 cursor-pointer",
                                  isSelected
                                    ? "bg-accent/[0.04] border-accent shadow-[0_0_15px_rgba(245,158,11,0.08)]"
                                    : "bg-white/[0.02] border-[var(--color-border)] hover:border-white/20"
                                )}
                              >
                                <div className="flex items-center justify-between gap-3 w-full">
                                  <span className="font-bold text-[13px] text-white truncate max-w-[70%]">
                                    {repo.name}
                                  </span>
                                  <span className={cn(
                                    "text-[9px] font-black uppercase px-1.5 py-0.5 rounded border leading-none shrink-0",
                                    repo.private
                                      ? "border-accent/20 bg-accent/5 text-accent"
                                      : "border-zinc-800 bg-zinc-900 text-zinc-400"
                                  )}>
                                    {repo.private ? 'Private' : 'Public'}
                                  </span>
                                </div>
                                
                                {repo.description && (
                                  <p className="text-[var(--color-text-muted)] text-xs line-clamp-2 leading-relaxed">
                                    {repo.description}
                                  </p>
                                )}

                                <div className="flex items-center justify-between text-[10px] text-[var(--color-text-muted)] border-t border-white/[0.04] pt-2 mt-1">
                                  <span className="font-mono text-white/30 truncate max-w-[65%]">{repo.full_name}</span>
                                  {repo.language && (
                                    <span className="flex items-center gap-1.5 text-[var(--color-text-muted)] shrink-0">
                                      <span className="w-1.5 h-1.5 rounded-full bg-accent shadow-sm shadow-accent/50"></span>
                                      {repo.language}
                                    </span>
                                  )}
                                </div>
                              </button>
                            )
                          })
                        )}
                      </div>
                    </div>

                    {/* Import Callout & Action Button */}
                    <div className="pt-6 border-t border-[var(--color-border)] space-y-4">
                      {selectedOwnerRepo ? (
                        <div className="p-4 rounded-xl border border-white/[0.05] bg-white/[0.01] text-xs text-[var(--color-text-muted)] leading-relaxed">
                          Repository <span className="text-white font-semibold">{selectedOwnerRepo.name}</span> will be cloned and imported into the private Forke sandbox environment. Once imported, you will be able to configure tasks, requirements, and review guidelines.
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl border border-dashed border-[var(--color-border)] bg-white/[0.005] text-center text-xs text-[var(--color-text-muted)]">
                          Select a repository from the list above to begin the import process.
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={executeMirrorPipeline}
                        disabled={mirrorStatus === 'running' || !selectedOwnerRepo}
                        className={cn(
                          "w-full md:w-auto min-w-[220px] h-10 text-[13px] font-medium ui-btn-primary rounded-lg cursor-pointer transition-colors flex items-center gap-2 justify-center",
                          (mirrorStatus === 'running' || !selectedOwnerRepo) && "opacity-60 cursor-not-allowed"
                        )}
                      >
                        {mirrorStatus === 'running' ? (
                          <>
                            <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                            Ingesting...
                          </>
                        ) : (
                          'Import Repository & Start Review'
                        )}
                      </button>
                    </div>

                    {/* Logging output */}
                    {mirrorStatus !== 'idle' && (
                      <div className="p-4 rounded-xl border border-[var(--color-border)] bg-white/[0.01] space-y-3 mt-4 animate-in fade-in duration-300">
                        <div className="flex items-center justify-between text-xs font-medium">
                          <span className="text-[var(--color-text-muted)] uppercase tracking-wider">Verification Pipeline Status</span>
                          <span className={cn(
                            "font-semibold",
                            mirrorStatus === 'success' ? 'text-emerald-400' :
                            mirrorStatus === 'failed' ? 'text-red-400' : 'text-amber-500'
                          )}>
                            {mirrorStatus === 'success' ? 'Import Complete' :
                             mirrorStatus === 'failed' ? 'Pipeline Failed' : `Processing... ${mirrorProgress}%`}
                          </span>
                        </div>
                        
                        <div className="h-1.5 bg-white/[0.03] border border-white/[0.05] rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full transition-all duration-500 rounded-full",
                              mirrorStatus === 'success' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' :
                              mirrorStatus === 'failed' ? 'bg-red-500' : 'bg-amber-500'
                            )}
                            style={{ width: `${mirrorProgress}%` }}
                          />
                        </div>

                        <details className="group">
                          <summary className="text-[11px] text-[var(--color-text-muted)] hover:text-white cursor-pointer select-none font-medium flex items-center gap-1 mt-2">
                            <span>View Pipeline Logs</span>
                            <span className="transition-transform group-open:rotate-180">?</span>
                          </summary>
                          <div ref={terminalRef} className="w-full bg-[#040406]/98 rounded-xl p-4 border border-zinc-900 shadow-[inset_0_4px_12px_rgba(0,0,0,0.8)] font-mono text-[11px] text-zinc-300 leading-normal max-h-[165px] overflow-y-auto mt-2 custom-scrollbar">
                            {mirrorLogs.map((log, idx) => (
                              <div key={idx}>{formatTerminalLog(log)}</div>
                            ))}
                          </div>
                        </details>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {/* Selected Repository Card with Switch action */}
                    <div className="p-4 rounded-xl border border-accent bg-accent/[0.03] space-y-3 relative overflow-hidden">
                      <div className="flex items-center justify-between gap-3 w-full">
                        <div>
                          <div className="text-[10px] font-black uppercase tracking-wider text-accent">Selected Repository (Imported)</div>
                          <h4 className="font-bold text-[14px] text-white mt-1">
                            {selectedOwnerRepo?.name}
                          </h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedOwnerRepo(null);
                            setTaskSubmitted(null);
                            setCheckedPaths(new Set());
                            treeAllFilesRef.current = [];
                            setTaskForm({
                              taskTitle: '',
                              taskDescription: '',
                              frontendStack: '',
                              backendStack: '',
                              allowedPaths: '',
                              restrictedPaths: '',
                              acceptanceCriteria: '',
                            });
                            setSelectedSkills([]);
                          }}
                          className="px-2.5 py-1 text-[11px] font-medium border border-white/10 hover:border-white/20 text-[var(--color-text-muted)] hover:text-white rounded-lg transition-colors cursor-pointer"
                        >
                          Switch Repo
                        </button>                      </div>
                      {selectedOwnerRepo?.description && (
                        <p className="text-[var(--color-text-muted)] text-xs leading-relaxed">
                          {selectedOwnerRepo.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 text-[10px] text-[var(--color-text-muted)] font-medium pt-2 border-t border-white/[0.04]">
                        <span>{selectedOwnerRepo?.full_name}</span>
                        {selectedOwnerRepo?.language && (
                          <span className="flex items-center gap-1.5 shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
                            {selectedOwnerRepo.language}
                          </span>
                        )}
                        <span className="capitalize px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] text-[9px]">
                          {selectedOwnerRepo?.private ? 'Private' : 'Public'}
                        </span>
                      </div>
                    </div>

                    {/* Task Form Elements */}
                    <div className="relative space-y-6 pt-4 border-t border-[var(--color-border)]">

                      {/* -- Submitting overlay � greys out the form while in-flight -- */}
                      {savingTask && (
                        <div className="absolute inset-0 z-10 rounded-lg bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center gap-3 pointer-events-all">
                          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                          <p className="text-sm font-medium text-white">Submitting task�</p>
                          <p className="text-[11px] text-[var(--color-text-muted)]">Please wait, this may take a moment</p>
                        </div>
                      )}

                      {/* -- Success panel � shown after successful submit -- */}
                      {taskSubmitted ? (
                        <div className="flex flex-col items-center justify-center gap-4 py-10 text-center">
                          <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                            <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <div className="space-y-1">
                            <p className="text-base font-semibold text-white">Task posted</p>
                            <p className="text-[13px] text-[var(--color-text-muted)] max-w-xs">
                              "{taskSubmitted}" is now live and visible to developers on the platform.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => router.push(`/tasks?q=${encodeURIComponent(taskSubmitted)}`)}
                            className="h-9 px-5 rounded-lg text-[13px] font-medium ui-btn-primary transition-colors cursor-pointer"
                          >
                            View task
                          </button>
                        </div>
                      ) : (
                        <>
                      {/* Task Title */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-end">
                          <label htmlFor="title" className="text-xs font-medium text-[var(--color-text-muted)]">
                            Task title
                          </label>
                          <span className={cn(
                            "text-[11px] tabular-nums",
                            taskForm.taskTitle.length > 90 ? "text-red-400" : "text-white/30"
                          )}>
                            {taskForm.taskTitle.length}/100
                          </span>
                        </div>
                        <input
                          id="title"
                          type="text"
                          required
                          placeholder="e.g. Fix navbar overlap on mobile view"
                          value={taskForm.taskTitle}
                          onChange={(e) => setTaskForm(prev => ({ ...prev, taskTitle: e.target.value.slice(0, 100) }))}
                          className="w-full h-10 px-3 rounded-lg bg-white/[0.02] border border-[var(--color-border)] focus:border-accent transition-colors outline-none text-[13px] text-white placeholder-white/25"
                        />
                      </div>

                      {/* Description */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-end">
                          <label htmlFor="description" className="text-xs font-medium text-[var(--color-text-muted)]">
                            Description
                          </label>
                          <span className={cn(
                            "text-[11px] tabular-nums",
                            taskForm.taskDescription.length > 900 ? "text-red-400" : "text-white/30"
                          )}>
                            {taskForm.taskDescription.length}/1000
                          </span>
                        </div>
                        <textarea
                          id="description"
                          required
                          rows={5}
                          placeholder="Describe the task, requirements, and deliverables..."
                          value={taskForm.taskDescription}
                          onChange={(e) => setTaskForm(prev => ({ ...prev, taskDescription: e.target.value.slice(0, 1000) }))}
                          className="w-full px-3 py-2.5 rounded-lg bg-white/[0.02] border border-[var(--color-border)] focus:border-accent transition-colors outline-none text-[13px] text-white placeholder-white/25 resize-none min-h-[120px] leading-relaxed"
                        />
                      </div>

                      {/* Required Skills Searchable Multi-Select */}
                      <div className="space-y-2.5">
                        <div className="flex items-center gap-2">
                          <Tag className="w-3.5 h-3.5 text-accent" />
                          <label className="text-xs font-medium text-[var(--color-text-muted)]">
                            Required Skills
                          </label>
                        </div>

                        <div className="relative">
                          {/* Search Bar Input */}
                          <div className="flex flex-wrap gap-1.5 p-1.5 bg-white/[0.01] border border-[var(--color-border)] focus-within:border-accent rounded-lg transition-colors items-center min-h-[40px]">
                            {/* Chips list */}
                            {selectedSkills.map(skill => (
                              <span
                                key={skill}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[13px] font-medium bg-accent text-[#0a0a0a] border border-accent"
                              >
                                {skill}
                                <button
                                  type="button"
                                  onClick={() => setSelectedSkills(prev => prev.filter(s => s !== skill))}
                                  className="ml-0.5 hover:opacity-75 text-base leading-none cursor-pointer"
                                  aria-label={`Remove ${skill}`}
                                >
                                  �
                                </button>
                              </span>
                            ))}

                            <input
                              type="text"
                              placeholder={selectedSkills.length > 0 ? "" : "Search or add skills..."}
                              value={skillSearchQuery}
                              onChange={(e) => {
                                setSkillSearchQuery(e.target.value)
                                setIsSkillDropdownOpen(true)
                              }}
                              onFocus={() => setIsSkillDropdownOpen(true)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && skillSearchQuery.trim()) {
                                  e.preventDefault();
                                  const trimmed = skillSearchQuery.trim();
                                  if (!selectedSkills.includes(trimmed)) {
                                    setSelectedSkills(prev => [...prev, trimmed]);
                                  }
                                  setSkillSearchQuery('');
                                }
                              }}
                              className="bg-transparent border-none outline-none text-[13px] text-white placeholder-white/20 px-2 flex-grow min-w-[100px]"
                            />

                            {skillSearchQuery && (
                              <button
                                type="button"
                                onClick={() => { setSkillSearchQuery(''); setIsSkillDropdownOpen(false) }}
                                className="text-white/40 hover:text-white p-1"
                              >
                                �
                              </button>
                            )}
                          </div>

                          {/* Dropdown Menu */}
                          {isSkillDropdownOpen && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setIsSkillDropdownOpen(false)} />
                              <div className="absolute left-0 right-0 mt-1.5 max-h-[200px] overflow-y-auto rounded-lg border border-[var(--color-border)] bg-[#0c0c0f] p-1.5 z-20 shadow-xl custom-scrollbar animate-in fade-in duration-200">
                                {(() => {
                                  const options = [
                                    'React', 'Next.js', 'TypeScript', 'Node.js', 'Python', 
                                    'FastAPI', 'PostgreSQL', 'Docker', 'AWS', 'Tailwind'
                                  ];
                                  const filtered = options.filter(s => 
                                    s.toLowerCase().includes(skillSearchQuery.toLowerCase()) && 
                                    !selectedSkills.includes(s)
                                  );
                                  
                                  return (
                                    <>
                                      {filtered.length > 0 ? (
                                        filtered.map(skill => (
                                          <button
                                            key={skill}
                                            type="button"
                                            onClick={() => {
                                              setSelectedSkills(prev => [...prev, skill]);
                                              setSkillSearchQuery('');
                                              setIsSkillDropdownOpen(false);
                                            }}
                                            className="w-full text-left px-3 py-2 rounded-md text-xs text-white/85 hover:text-white hover:bg-white/[0.04] transition-colors cursor-pointer"
                                          >
                                            {skill}
                                          </button>
                                        ))
                                      ) : (
                                        <div className="text-left px-3 py-2 text-xs text-[var(--color-text-muted)] italic">
                                          {skillSearchQuery ? (
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const trimmed = skillSearchQuery.trim();
                                                if (!selectedSkills.includes(trimmed)) {
                                                  setSelectedSkills(prev => [...prev, trimmed]);
                                                }
                                                setSkillSearchQuery('');
                                                setIsSkillDropdownOpen(false);
                                              }}
                                              className="text-accent hover:underline w-full text-left"
                                            >
                                              + Add custom skill "{skillSearchQuery}"
                                            </button>
                                          ) : (
                                            "Type to search skills..."
                                          )}
                                        </div>
                                      )}
                                    </>
                                  )
                                })()}
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Budget & Deadline Row */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Budget */}
                        <div className="space-y-1.5">
                          <label htmlFor="budget" className="text-xs font-medium text-[var(--color-text-muted)]">
                            Budget (rupees)
                          </label>
                          <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
                              <IndianRupee className="w-4 h-4" />
                            </div>
                            <input
                              id="budget"
                              type="number"
                              required
                              min={100}
                              max={100000}
                              placeholder="500"
                              value={budget}
                              onChange={(e) => setBudget(e.target.value)}
                              className="w-full h-10 pl-9 pr-3 rounded-lg bg-white/[0.02] border border-[var(--color-border)] focus:border-accent transition-colors outline-none text-[13px] text-white placeholder-white/25"
                            />
                          </div>
                          <p className="text-[10px] text-[var(--color-text-muted)]">Minimum ?100 � Maximum ?1,00,000</p>
                        </div>

                        {/* Deadline */}
                        <div className="space-y-1.5">
                          <label htmlFor="deadline" className="text-xs font-medium text-[var(--color-text-muted)]">
                            Deadline (optional)
                          </label>
                          <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
                              <Calendar className="w-4 h-4" />
                            </div>
                            <input
                              id="deadline"
                              type="date"
                              value={deadline}
                              onChange={(e) => setDeadline(e.target.value)}
                              className="w-full h-10 pl-9 pr-3 rounded-lg bg-white/[0.02] border border-[var(--color-border)] focus:border-accent transition-colors outline-none text-[13px] text-white/70 appearance-none cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>

                      {/* File Access Control � replaces allowed/restricted path textareas */}
                      <div className="space-y-3 pt-4 border-t border-[var(--color-border)]">
                        <div>
                          <p className="text-sm font-medium text-white">File access control</p>
                          <p className="text-[12px] text-[var(--color-text-muted)] mt-0.5">
                            Tick the files developers are allowed to edit. Unticked files are marked restricted.
                          </p>
                        </div>

                        {selectedOwnerRepo ? (
                          <FileTree
                            username={githubUsername ?? ''}
                            repo={selectedOwnerRepo.full_name}
                            checkedPaths={checkedPaths}
                            onChange={handleCheckedPathsChange}
                            onLoad={handleTreeLoad}
                          />
                        ) : (
                          <div className="app-empty py-6 text-center text-[13px] text-[var(--color-text-muted)]">
                            Select a repository to load its file tree
                          </div>
                        )}
                      </div>

                      {/* Acceptance Criteria */}
                      <div className="space-y-1.5 pt-4 border-t border-[var(--color-border)]">
                        <label htmlFor="acceptance" className="text-xs font-medium text-[var(--color-text-muted)]">
                          Acceptance criteria <span className="text-white/30">(optional)</span>
                        </label>
                        <textarea
                          id="acceptance"
                          value={taskForm.acceptanceCriteria}
                          onChange={e => setTaskForm(prev => ({ ...prev, acceptanceCriteria: e.target.value }))}
                          placeholder={`- Navbar collapses on mobile\n- Animation is smooth`}
                          rows={3}
                          className="w-full px-3 py-2.5 rounded-lg bg-white/[0.02] border border-[var(--color-border)] focus:border-accent transition-colors outline-none text-[13px] text-white placeholder-white/25 resize-none leading-relaxed"
                        />
                      </div>

                      {/* Submission Row */}
                      <div className="pt-4 border-t border-[var(--color-border)]">
                        <button
                          type="button"
                          onClick={saveTaskForm}
                          disabled={savingTask}
                          className={cn(
                            "w-full md:w-auto min-w-[220px] h-10 text-[13px] font-medium ui-btn-primary rounded-lg cursor-pointer transition-colors flex items-center gap-2 justify-center",
                            savingTask && "opacity-60 cursor-not-allowed"
                          )}
                        >
                          {savingTask ? (
                            <>
                              <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                              Submitting�
                            </>
                          ) : (
                            'Submit Task'
                          )}
                        </button>
                      </div>
                        </>
                      )}
                    </div>
                  </>
                )}

              </div>

              {/* Right Column (lg:col-span-1) - Preview & Tip cards */}
              <div className="lg:col-span-1 text-left">
                <div className="sticky top-20 space-y-4">
                  {selectedRepoMirror === null ? (
                    /* Step 1: Repository Preview during import */
                    <div>
                      <h3 className="text-xs font-medium text-[var(--color-text-muted)] pl-0.5 mb-1.5">Repository Preview</h3>
                      <div className="rounded-xl border border-[var(--color-border)] bg-white/[0.018] p-4 space-y-3.5">
                        <div>
                          <span className="text-[9px] text-[var(--color-text-muted)] uppercase tracking-wider block font-bold leading-none select-none">
                            Repository Name
                          </span>
                          <h4 className="text-sm font-bold text-white break-words mt-1">
                            {selectedOwnerRepo?.name || 'No repository selected'}
                          </h4>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-xs font-medium border-t border-white/[0.03] pt-3">
                          <div>
                            <span className="text-[9px] text-[var(--color-text-muted)] uppercase tracking-wider block font-bold leading-none select-none mb-1">
                              Language
                            </span>
                            <span className="text-white/80">{selectedOwnerRepo?.language || 'Unknown'}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-[var(--color-text-muted)] uppercase tracking-wider block font-bold leading-none select-none mb-1">
                              Visibility
                            </span>
                            <span className="text-white/80">{selectedOwnerRepo ? (selectedOwnerRepo.private ? 'Private' : 'Public') : '�'}</span>
                          </div>
                        </div>

                        <div className="border-t border-white/[0.03] pt-3">
                          <span className="text-[9px] text-[var(--color-text-muted)] uppercase tracking-wider block font-bold leading-none select-none mb-1">
                            Description
                          </span>
                          <p className="text-[12px] text-white/45 leading-relaxed">
                            {selectedOwnerRepo?.description || 'Select a repository to see its description here�'}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-[var(--color-border)] flex items-center justify-between text-[11px] text-[var(--color-text-muted)]">
                          <span>Import Status</span>
                          <span className={cn(
                            "font-bold",
                            mirrorStatus === 'success' ? "text-emerald-400" :
                            mirrorStatus === 'running' ? "text-amber-500 animate-pulse" : "text-zinc-500"
                          )}>
                            {mirrorStatus === 'success' ? 'Imported' : mirrorStatus === 'running' ? 'Ingesting...' : 'Ready to Import'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Step 2: PostTaskForm-aligned Live Preview */
                    <div>
                      <h3 className="text-xs font-medium text-[var(--color-text-muted)] pl-0.5 mb-1.5">Live preview</h3>
                      <div className="rounded-xl border border-[var(--color-border)] bg-white/[0.018] p-4 space-y-4">
                        <div className="flex justify-between items-start gap-3">
                          <h4 className="text-sm font-medium text-white break-words min-h-[1.25em] leading-snug">
                            {taskForm.taskTitle || 'Your task title'}
                          </h4>
                          <div className="bg-accent/10 border border-accent/20 px-2 py-0.5 rounded text-accent font-medium text-[13px] tabular-nums whitespace-nowrap shrink-0">
                            ?{(budget ? Number(budget) : 0).toLocaleString()}
                          </div>
                        </div>

                        <p className="text-[13px] text-white/45 line-clamp-3 min-h-[4em] leading-relaxed">
                          {taskForm.taskDescription || 'Your task description will appear here as you type�'}
                        </p>

                        <div className="flex flex-wrap gap-1.5">
                          {selectedSkills.length > 0 ? (
                            selectedSkills.map(tag => (
                              <span key={tag} className="px-1.5 py-0.5 bg-white/[0.04] border border-[var(--color-border)] text-[var(--color-text-muted)] text-[11px] font-medium rounded">
                                {tag}
                              </span>
                            ))
                          ) : (
                            <span className="text-[11px] text-white/30">No tags selected</span>
                          )}
                        </div>

                        <div className="pt-3.5 border-t border-[var(--color-border)] flex items-center justify-between text-[11px] text-[var(--color-text-muted)]">
                          <span>Status: Open</span>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{deadline ? `Expires: ${deadline}` : 'Expires soon'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Associated Repository Info under Preview */}
                      <div className="mt-3 p-3 bg-white/[0.01] border border-[var(--color-border)] rounded-xl flex items-center justify-between text-[11px] text-[var(--color-text-muted)]">
                        <span className="truncate max-w-[70%]">
                          Repo: <span className="text-white font-mono">{selectedOwnerRepo?.name || selectedRepoMirror?.sourceRepo?.split('/')[1] || ''}</span>
                        </span>
                        <span className="capitalize px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] text-[9px] shrink-0">
                          {selectedOwnerRepo?.private ? 'Private' : 'Public'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Card 3: Tip Card */}
                  <div className="p-3.5 bg-white/[0.02] border border-[var(--color-border)] rounded-xl">
                    <div className="flex gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                      <p className="text-[13px] text-white/60 leading-relaxed">
                        <span className="font-medium text-white">Tip:</span> Clear instructions attract better-quality developers. Be specific about your deliverables.
                      </p>
                    </div>
                  </div>

                </div>
              </div>

            </div>

            {/* Active Sandbox Mirrors Grid section */}
            <div className="space-y-5 border-t border-[var(--color-border)] pt-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold tracking-tight text-white flex items-center gap-2">
                    Active Sandbox Mirrors
                    <span className="px-1.5 py-0.5 rounded border border-[var(--color-border)] bg-white/[0.03] text-[11px] font-medium text-[var(--color-text-muted)] tabular-nums">
                      {mirroredRepos.length}
                    </span>
                  </h3>
                  <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
                    Sandbox environments that have been successfully cloned and mapped.
                  </p>
                </div>
              </div>

              {mirroredRepos.length === 0 ? (
                <div className="app-empty p-10 text-center text-[13px] text-[var(--color-text-muted)] font-medium">
                  No active mirrored sandboxes yet
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {mirroredRepos.map(mirror => (
                    <div
                      key={mirror.id}
                      className="group rounded-xl border border-[var(--color-border)] bg-white/[0.018] p-5 flex flex-col gap-4 transition-colors hover:border-white/[0.14]"
                    >
                      {/* Card header */}
                      <div className="space-y-2.5">
                        {/* Status badges */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {mirror.verificationStatus === 'verifying' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded border border-amber-500/20 bg-amber-500/8 text-amber-500 animate-pulse">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              Verifying
                            </span>
                          ) : mirror.verificationStatus === 'failed' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded border border-red-500/20 bg-red-500/8 text-red-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                              Failed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded border border-emerald-500/20 bg-emerald-500/8 text-emerald-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              Verified
                            </span>
                          )}
                          {mirror.taskTitle && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded border border-[var(--color-accent)]/20 bg-[var(--color-accent)]/8 text-[var(--color-accent-text)]">
                              Task posted
                            </span>
                          )}
                        </div>

                        {/* Repo name */}
                        <div>
                          <p className="font-mono text-[13px] font-medium text-white truncate group-hover:text-accent transition-colors">
                            {mirror.sandboxRepo}
                          </p>
                          {mirror.taskTitle && (
                            <p className="text-[12px] text-[var(--color-text-muted)] mt-0.5 line-clamp-1">
                              {mirror.taskTitle}
                            </p>
                          )}
                        </div>

                        {/* Source */}
                        <p className="text-[11px] text-[var(--color-text-muted)] truncate">
                          Source: <span className="font-mono text-white/50">{mirror.sourceRepo}</span>
                        </p>

                        {/* Baseline status */}
                        <div className="flex items-center gap-1.5 text-[11px] pt-2.5 border-t border-[var(--color-border)]">
                          <span className="text-[var(--color-text-muted)]">Baseline:</span>
                          {baselines[mirror.sandboxRepo] ? (
                            <span className="flex items-center gap-1 text-emerald-400 font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              Ready
                              <span className="font-mono text-[var(--color-text-muted)]">
                                ({baselines[mirror.sandboxRepo].commitSha.substring(0, 7)})
                              </span>
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[var(--color-text-muted)] font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500/60 animate-pulse" />
                              Pending
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="space-y-2 mt-auto">
                        {/* Primary action row */}
                        <div className="flex gap-2">
                          {mirror.verificationStatus === 'verifying' || mirror.verificationStatus === 'failed' ? (
                            <>
                              <button
                                disabled
                                className="flex-1 h-9 rounded-lg text-[13px] font-medium ui-btn-secondary opacity-40 cursor-not-allowed"
                              >
                                {mirror.verificationStatus === 'verifying' ? 'Verifying�' : 'Unavailable'}
                              </button>
                              <button
                                disabled
                                className="flex-1 h-9 rounded-lg text-[13px] font-medium ui-btn-secondary opacity-40 cursor-not-allowed"
                              >
                                View PRs
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => openSandboxPRs(mirror)}
                                className="flex-1 h-9 rounded-lg text-[13px] font-medium ui-btn-secondary transition-colors cursor-pointer"
                              >
                                View PRs
                              </button>

                              {baselines[mirror.sandboxRepo] ? (
                                <button
                                  onClick={() => {
                                    setSelectedBaselineReport(baselines[mirror.sandboxRepo])
                                    setSelectedBaselineCategoryLog(null)
                                  }}
                                  className="flex-1 h-9 rounded-lg text-[13px] font-medium ui-btn-secondary transition-colors cursor-pointer"
                                >
                                  View Baseline
                                </button>
                              ) : (
                                <button
                                  onClick={() => triggerBaselineSnapshot(mirror.sandboxRepo)}
                                  disabled={triggeringBaseline[mirror.sandboxRepo]}
                                  className="flex-1 h-9 rounded-lg text-[13px] font-medium ui-btn-secondary transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {triggeringBaseline[mirror.sandboxRepo] ? 'Generating�' : 'Gen Baseline'}
                                </button>
                              )}
                            </>
                          )}
                        </div>

                        {/* Secondary row: meta + actions */}
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-[var(--color-text-muted)]">
                            {new Date(mirror.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {/* View Task */}
                            {mirror.taskTitle ? (
                              <button
                                onClick={() => router.push(`/tasks?q=${encodeURIComponent(mirror.taskTitle!)}`)}
                                className="h-7 px-2.5 rounded text-[11px] font-medium border border-[var(--color-accent)]/25 bg-[var(--color-accent)]/8 text-[var(--color-accent-text)] hover:bg-[var(--color-accent)]/15 transition-colors cursor-pointer"
                                title="View task in feed"
                              >
                                View task
                              </button>
                            ) : (
                              <button
                                disabled
                                className="h-7 px-2.5 rounded text-[11px] font-medium border border-[var(--color-border)] bg-transparent text-[var(--color-text-muted)] opacity-40 cursor-not-allowed"
                                title="No task posted yet"
                              >
                                View task
                              </button>
                            )}

                            {/* Delete */}
                            <button
                              onClick={() => handleDeleteSandbox(mirror.sandboxRepo)}
                              disabled={deletingRepos[mirror.sandboxRepo]}
                              className="h-7 px-2.5 rounded text-[11px] font-medium border border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10 hover:border-red-500/40 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {deletingRepos[mirror.sandboxRepo] ? '�' : 'Delete'}
                            </button>

                            {/* GitHub link */}
                            <a
                              href={`https://github.com/${mirror.sandboxRepo}`}
                              target="_blank"
                              rel="noreferrer"
                              className="h-7 px-2.5 rounded text-[11px] font-medium border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-white hover:border-white/10 transition-colors flex items-center gap-1"
                            >
                              GitHub
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ===== Owner PR Review Dashboard ===== */}
            {selectedSandboxForPRs && (
              <div className="border-t border-zinc-900/80 pt-10 space-y-6 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-black tracking-tight text-zinc-50 flex items-center gap-2">
                      <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Received PRs
                      <span className="font-mono text-sm text-zinc-400 font-normal">� {selectedSandboxForPRs.sandboxRepo}</span>
                    </h3>
                    <p className="text-zinc-400 text-xs font-medium mt-1">Developer submissions with AI review reports</p>
                  </div>
                  <button
                    onClick={() => { setSelectedSandboxForPRs(null); setSelectedPR(null) }}
                    className="text-zinc-500 hover:text-zinc-300 border border-zinc-800 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    ? Close
                  </button>
                </div>

                {loadingPRs ? (
                  <div className="flex items-center gap-3 py-12 justify-center">
                    <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-zinc-400 text-sm font-bold">Loading PRs...</span>
                  </div>
                ) : sandboxPRs.length === 0 ? (
                  <div className="app-empty p-12 text-center text-xs font-medium">
                    No developer PRs found for this sandbox
                  </div>
                ) : (
                  <div className="grid lg:grid-cols-2 gap-6">
                    {/* PR List */}
                    <div className="space-y-3">
                      {sandboxPRs.map(pr => {
                        const v = pr.review?.verdict
                        const verdictStyle = v === 'pass'
                          ? 'border-emerald-500/40 bg-emerald-500/5 text-emerald-400'
                          : v === 'high_risk'
                          ? 'border-red-500/40 bg-red-500/5 text-red-400'
                          : 'border-amber-500/40 bg-amber-500/5 text-amber-400'
                        const verdictLabel = v === 'pass' ? '?? PASS' : v === 'high_risk' ? '?? HIGH RISK' : v === 'needs_changes' ? '?? NEEDS CHANGES' : '? PENDING'

                        return (
                          <button
                            key={pr.fork.id}
                            onClick={() => setSelectedPR(pr)}
                            className={`w-full text-left p-4 rounded-xl border transition-colors ${
                              selectedPR?.fork.id === pr.fork.id
                                ? 'border-violet-500/50 bg-violet-500/5'
                                : 'border-[var(--color-border)] bg-white/[0.018] hover:border-white/[0.14]'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <div className="font-bold text-zinc-200 text-sm">@{pr.fork.githubUsername}</div>
                                <div className="text-[10px] text-zinc-500 mt-0.5">
                                  {pr.review ? `PR #${pr.review.prNumber}` : 'No PR'} � {new Date(pr.fork.createdAt).toLocaleDateString()}
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                {pr.review ? (
                                  <>
                                    <div className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${verdictStyle}`}>
                                      {verdictLabel}
                                    </div>
                                    <div className="text-[10px] text-zinc-400 mt-1 font-bold">{pr.review.score}/100</div>
                                  </>
                                ) : (
                                  <div className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md border border-zinc-700 bg-zinc-900 text-zinc-500">
                                    Awaiting Review
                                  </div>
                                )}
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>

                    {/* PR Detail Panel */}
                    {selectedPR ? (
                      <div className="app-panel p-5 space-y-5">
                        {selectedPR.review ? (
                          <>
                            {/* Header */}
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-xs font-black text-zinc-400 uppercase tracking-widest">AI Review Report</div>
                                <div className="text-sm font-bold text-zinc-200 mt-0.5">@{selectedPR.fork.githubUsername} � PR #{selectedPR.review.prNumber}</div>
                              </div>
                              <div className={`text-xs font-black px-3 py-1.5 rounded-xl border ${
                                selectedPR.review.verdict === 'pass' ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                                : selectedPR.review.verdict === 'high_risk' ? 'border-red-500/40 bg-red-500/10 text-red-400'
                                : 'border-amber-500/40 bg-amber-500/10 text-amber-400'
                              }`}>
                                {selectedPR.review.verdict === 'pass' ? '?? PASS' : selectedPR.review.verdict === 'high_risk' ? '?? HIGH RISK' : '?? NEEDS CHANGES'}
                              </div>
                            </div>

                            {/* Score bar */}
                            <div>
                              <div className="flex justify-between text-xs font-bold mb-1.5">
                                <span className="text-zinc-400">Score</span>
                                <span className="text-zinc-200">{selectedPR.review.score}/100</span>
                              </div>
                              <div className="h-2 bg-zinc-900 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-700 ${
                                    selectedPR.review.score >= 75 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' :
                                    selectedPR.review.score >= 50 ? 'bg-gradient-to-r from-amber-500 to-orange-400' :
                                    'bg-gradient-to-r from-red-600 to-rose-500'
                                  }`}
                                  style={{ width: `${selectedPR.review.score}%` }}
                                />
                              </div>
                              <div className="text-[10px] text-zinc-500 mt-1">Requirement match: {Math.round(selectedPR.review.requirementMatch * 100)}%</div>
                            </div>

                            <button
                              onClick={() => handleOpenComparison(selectedSandboxForPRs!.id, selectedPR.review!, `PR #${selectedPR.review!.prNumber} from @${selectedPR.fork.githubUsername}`)}
                              className="w-full h-10 rounded-lg text-[13px] font-medium ui-btn-secondary transition-colors cursor-pointer flex items-center justify-center gap-2"
                            >
                              ?? View AI Review Report
                            </button>

                            {/* Summary */}
                            <div className="app-panel p-4 text-xs text-zinc-300 leading-relaxed">
                              <div className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1.5">AI Summary</div>
                              {selectedPR.review.summary}
                            </div>

                            {/* Strengths */}
                            {selectedPR.review.strengths && selectedPR.review.strengths.length > 0 && (
                              <div className="space-y-1.5">
                                <div className="text-[10px] font-black text-emerald-400 uppercase tracking-wider">? Strengths ({selectedPR.review.strengths.length})</div>
                                <div className="space-y-1 pl-1">
                                  {selectedPR.review.strengths.map((s, i) => (
                                    <div key={i} className="flex items-start gap-2 text-[10px] text-zinc-300">
                                      <span className="text-emerald-500 shrink-0 mt-0.5">�</span>
                                      {s}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Issues */}
                            {selectedPR.review.issues.length > 0 && (
                              <div className="space-y-2">
                                <div className="text-[10px] font-black text-amber-400 uppercase tracking-wider">?? Active Issues ({selectedPR.review.issues.length})</div>
                                <div className="space-y-2">
                                  {selectedPR.review.issues.map((issue, i) => (
                                    <div key={i} className={`p-3 rounded-xl border text-[10px] leading-relaxed ${
                                      issue.severity === 'critical' || issue.severity === 'high' ? 'border-red-500/20 bg-red-500/5 text-red-300'
                                      : issue.severity === 'medium' ? 'border-amber-500/20 bg-amber-500/5 text-amber-300'
                                      : 'border-zinc-800 bg-zinc-900/50 text-zinc-400'
                                    }`}>
                                      <div className="flex items-center justify-between font-black mb-1">
                                        <span>[{issue.severity.toUpperCase()}] {issue.file}{issue.line ? `:${issue.line}` : ''}</span>
                                        {issue.status && (
                                          <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded leading-none shrink-0 ${
                                            issue.status === 'new' ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30' : 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                                          }`}>
                                            {issue.status}
                                          </span>
                                        )}
                                      </div>
                                      <div>{issue.message}</div>
                                      {issue.suggestion && <div className="mt-1 text-zinc-500 italic">? {issue.suggestion}</div>}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Risks */}
                            {selectedPR.review.risks && selectedPR.review.risks.length > 0 && (
                              <div className="space-y-2">
                                <div className="text-[10px] font-black text-red-400 uppercase tracking-wider">?? Active Security Risks ({selectedPR.review.risks.length})</div>
                                <div className="space-y-2">
                                  {selectedPR.review.risks.map((risk, i) => (
                                    <div key={i} className="p-3 rounded-xl border border-red-500/20 bg-red-500/5 text-[10px] text-red-300">
                                      <div className="flex items-center justify-between font-black mb-1">
                                        <span>[{risk.severity.toUpperCase()}] {risk.category}</span>
                                        {risk.status && (
                                          <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded leading-none shrink-0 ${
                                            risk.status === 'new' ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30' : 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                                          }`}>
                                            {risk.status}
                                          </span>
                                        )}
                                      </div>
                                      {risk.message}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Corrected items */}
                            {((selectedPR.review.resolvedIssues && selectedPR.review.resolvedIssues.length > 0) || 
                              (selectedPR.review.resolvedRisks && selectedPR.review.resolvedRisks.length > 0)) && (
                              <div className="space-y-2">
                                <div className="text-[10px] font-black text-emerald-400 uppercase tracking-wider">?? Corrected Items ({
                                  (selectedPR.review.resolvedIssues?.length || 0) + (selectedPR.review.resolvedRisks?.length || 0)
                                })</div>
                                <div className="space-y-2">
                                  {selectedPR.review.resolvedIssues?.map((issue, i) => (
                                    <div key={`resolved-issue-${i}`} className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-[10px] text-emerald-300 leading-relaxed shadow-inner">
                                      <div className="font-black mb-1 flex items-center gap-1.5">
                                        <span className="bg-emerald-400 text-black px-1.5 py-0.5 rounded text-[8px] font-black leading-none">FIXED</span>
                                        <span>[{issue.severity.toUpperCase()}] {issue.file}{issue.line ? `:${issue.line}` : ''}</span>
                                      </div>
                                      <div className="line-through text-zinc-500">{issue.message}</div>
                                      {issue.resolution && <div className="mt-1 text-emerald-400 font-medium italic">? Fixed: {issue.resolution}</div>}
                                    </div>
                                  ))}
                                  {selectedPR.review.resolvedRisks?.map((risk, i) => (
                                    <div key={`resolved-risk-${i}`} className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-[10px] text-emerald-300 leading-relaxed shadow-inner">
                                      <div className="font-black mb-1 flex items-center gap-1.5">
                                        <span className="bg-emerald-400 text-black px-1.5 py-0.5 rounded text-[8px] font-black leading-none">FIXED</span>
                                        <span>[{risk.severity.toUpperCase()}] Category: {risk.category}</span>
                                      </div>
                                      <div className="line-through text-zinc-500">{risk.message}</div>
                                      {risk.resolution && <div className="mt-1 text-emerald-400 font-medium italic">? Fixed: {risk.resolution}</div>}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Unauthorized Edits */}
                            {selectedPR.review.unauthorizedEdits && selectedPR.review.unauthorizedEdits.length > 0 && (
                              <div className="space-y-1.5">
                                <div className="text-[10px] font-black text-red-500 uppercase tracking-wider">?? Unauthorized Edits ({selectedPR.review.unauthorizedEdits.length})</div>
                                <div className="space-y-1">
                                  {selectedPR.review.unauthorizedEdits.map((f, i) => (
                                    <div key={i} className="font-mono text-[10px] text-red-400 bg-red-500/5 border border-red-500/15 px-3 py-1 rounded-lg">
                                      ?? {f}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Links */}
                            {selectedPR.fork.prUrl && (
                              <a href={selectedPR.fork.prUrl} target="_blank" rel="noreferrer"
                                className="flex items-center gap-1.5 text-xs font-bold text-violet-400 hover:text-violet-300 transition">
                                View PR on GitHub ?
                              </a>
                            )}

                            {/* Owner action buttons */}
                            <div className="border-t border-zinc-800/60 pt-4 space-y-3">
                              <textarea
                                value={prActionMessage}
                                onChange={e => setPrActionMessage(e.target.value)}
                                placeholder="Optional message to leave on the PR..."
                                className="w-full app-field px-3 py-2.5 text-xs placeholder:text-white/25 resize-none h-16"
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handlePRAction('merge', selectedPR)}
                                  disabled={prActionInProgress || selectedPR.review.verdict === 'high_risk'}
                                  className="flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                                >
                                  ? Approve & Merge
                                </button>
                                <button
                                  onClick={() => handlePRAction('request_changes', selectedPR)}
                                  disabled={prActionInProgress}
                                  className="flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                                >
                                  ?? Request Changes
                                </button>
                                <button
                                  onClick={() => handlePRAction('reject', selectedPR)}
                                  disabled={prActionInProgress}
                                  className="py-2.5 px-4 rounded-xl text-[10px] font-black uppercase tracking-wider bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                                >
                                  ? Reject
                                </button>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="py-12 text-center text-zinc-500 text-xs font-bold uppercase tracking-widest">
                            No AI review yet for this PR.<br />
                            <span className="text-[10px] normal-case font-normal mt-2 block">The review runs automatically after the developer opens a PR.</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="app-empty p-12 text-center text-xs font-medium">
                        Select a PR from the list to view its AI review
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (

          /* ========================================================================= */
          /* ======================== 3. Developer Workspace Space ==================== */
          /* ========================================================================= */
          <div className={cn("animate-fade-in", embedded ? "space-y-4" : "space-y-10")}>
            {/* Developer Workspace Header */}
            <div className="flex flex-col gap-1">
              <h2 className={cn(
                "tracking-tight text-white flex items-center gap-2",
                embedded ? "text-sm font-medium" : "text-3xl font-black"
              )}>
                <svg className={cn("text-accent", embedded ? "w-4 h-4" : "w-8 h-8")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                Developer workspace
              </h2>
              <p className={cn("text-[var(--color-text-muted)] leading-relaxed", embedded ? "text-[13px]" : "text-sm font-medium")}>
                Fork an isolated sandbox, open a PR, and run the same review flow from the rest of Forke.
              </p>
            </div>

            <div className={cn("grid lg:grid-cols-5", embedded ? "gap-4" : "gap-8")}>
              {/* Left Sandbox Repos list (Col Span 2) */}
              <div className="lg:col-span-2 space-y-6">
                <div className={cn("app-panel space-y-3", embedded ? "p-4" : "p-5")}>
                  <span className="text-xs font-medium text-[var(--color-text-muted)] block">
                    Available sandboxes
                  </span>

                  <div className={cn("space-y-2.5 overflow-y-auto pr-1.5 custom-scrollbar", embedded ? "max-h-[190px]" : "max-h-[460px]")}>
                    {loadingSandboxRepos ? (
                      <div className="flex flex-col items-center justify-center py-10 gap-3">
                        <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-[var(--color-text-muted)] text-xs font-medium animate-pulse">Syncing sandboxes...</span>
                      </div>
                    ) : mirroredRepos.filter(repo => repo.verificationStatus === 'verified').length === 0 ? (
                      <div className="app-empty py-10 text-center text-xs">
                        No verified sandboxes available
                      </div>
                    ) : (
                      mirroredRepos.filter(repo => repo.verificationStatus === 'verified').map(repo => (
                        <button
                          key={repo.id}
                          onClick={() => handleSelectSandboxRepo(repo)}
                          className={`w-full text-left rounded-lg border transition-colors flex flex-col gap-2 relative overflow-hidden group/item ${embedded ? 'p-3' : 'p-4'} ${
                            selectedSandboxRepo?.id === repo.id
                              ? 'bg-accent/5 border-accent/35'
                              : 'bg-white/[0.018] border-[var(--color-border)] hover:border-white/[0.14]'
                          }`}
                        >
                          <div className="font-medium text-[13px] text-white truncate w-full font-mono group-hover/item:text-accent transition-colors">
                            {repo.sandboxRepo}
                          </div>
                          <div className="text-[11px] text-[var(--color-text-muted)] border-t border-[var(--color-border)] pt-2 mt-1 truncate">
                            Original: <span className="font-mono text-white/70">{repo.sourceRepo}</span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Right Workspace interactive CLI (Col Span 3) */}
              <div className="lg:col-span-3 space-y-6">
                {selectedSandboxRepo ? (
                  <div className={cn("app-panel space-y-4", embedded ? "p-4" : "p-5 md:p-6")}>
                    {/* Selected Repository Header */}
                    <div className="border-b border-[var(--color-border)] pb-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[var(--color-text-muted)]">
                          Active sandbox
                        </span>
                        <a
                          href={`https://github.com/${selectedSandboxRepo.sandboxRepo}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-accent hover:text-accent-hover font-medium flex items-center gap-1 leading-none transition"
                        >
                          Open Sandbox
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </div>
                      <h4 className={cn("font-mono font-semibold text-white truncate flex items-center gap-2", embedded ? "text-sm" : "text-xl")}>
                        <span className="w-2 h-2 rounded-full bg-accent shrink-0"></span>
                        {selectedSandboxRepo.sandboxRepo}
                      </h4>
                    </div>

                    {/* Step-by-step Interactive Pipeline */}
                    <div className={cn(embedded ? "space-y-4" : "space-y-7")}>
                      
                      {/* Step 1: Fork */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h5 className="text-[13px] font-medium text-white flex items-center gap-2.5">
                            <span className={`w-5.5 h-5.5 rounded-full flex items-center justify-center text-[10px] font-black transition-colors shadow-inner ${
                              devStatus.hasFork ? 'bg-accent text-black' : 'bg-white/[0.03] border border-[var(--color-border)] text-[var(--color-text-muted)]'
                            }`}>
                              {devStatus.hasFork ? '?' : '1'}
                            </span>
                            Step 1: Create Isolated Workspace (GitHub Fork)
                          </h5>
                          {devStatus.hasFork && (
                            <span className="app-badge px-2 py-1 text-accent border-accent/25 bg-accent/[0.08]">
                              Verified
                            </span>
                          )}
                        </div>

                        {!devStatus.hasFork ? (
                          <div className={cn("app-panel flex flex-col gap-3", embedded ? "p-4" : "p-5")}>
                            <p className="text-[var(--color-text-muted)] text-xs leading-relaxed">
                              GitHub forks serve as fully isolated developer workspaces. This maps the repository safely to your profile, giving you a completely isolated repository to work on.
                            </p>
                            <button
                              onClick={executeForkPipeline}
                              disabled={registeringFork}
                              className={`h-10 px-4 rounded-lg font-medium text-[13px] transition-colors ${
                                registeringFork
                                  ? 'bg-white/[0.03] text-white/35 cursor-not-allowed border border-[var(--color-border)]'
                                  : 'ui-btn-primary cursor-pointer'
                              }`}
                            >
                              {registeringFork ? 'Initiating Fork Access...' : 'Fork Sandbox Repository'}
                            </button>
                            {forkRegistered && (
                              <p className="text-[10px] text-amber-500/90 font-semibold flex items-center gap-1">
                                <span>??</span> GitHub fork page opened in a new tab! Complete the fork creation, then proceed below to clone.
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="bg-accent/5 border border-accent/15 p-4 rounded-xl flex items-center gap-3">
                            <svg className="w-5 h-5 text-accent shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-zinc-300 text-xs font-bold truncate leading-none">
                              Fork successfully verified at:{' '}
                              <a
                                href={forkUrl || `https://github.com/${githubUsername}/${selectedSandboxRepo.sandboxRepo.split('/')[1]}`}
                                target="_blank"
                                rel="noreferrer"
                                className="underline decoration-accent/55 hover:decoration-accent text-accent font-mono"
                              >
                                {githubUsername}/{selectedSandboxRepo.sandboxRepo.split('/')[1]}
                              </a>
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Step 2: Git Terminals */}
                      <div className="space-y-3">
                        <h5 className="text-[13px] font-medium text-white flex items-center gap-2.5">
                          <span className="w-5.5 h-5.5 rounded-full bg-white/[0.03] border border-[var(--color-border)] text-[var(--color-text-muted)] flex items-center justify-center text-[10px] font-black">
                            2
                          </span>
                          Step 2: Initialize Git & Commit Contributions
                        </h5>

                        <div className={cn("space-y-3 app-terminal rounded-xl font-mono text-zinc-200 overflow-y-auto custom-scrollbar", embedded ? "p-3 max-h-[210px]" : "p-5")}>
                          {/* Command clone */}
                          <div className="space-y-2 relative group">
                            <span className="text-[9px] text-zinc-500 uppercase tracking-widest block font-bold leading-none select-none">
                              A � Clone your isolated Fork locally
                            </span>
                            <div className="flex items-center justify-between bg-black/60 px-3 py-2.5 rounded-lg border border-[var(--color-border)] font-mono text-[11px]">
                              <span className="text-accent select-text truncate">
                                git clone https://github.com/{githubUsername}/{selectedSandboxRepo.sandboxRepo.split('/')[1]}.git
                              </span>
                              <button
                                onClick={() => copyToClipboard(`git clone https://github.com/${githubUsername}/${selectedSandboxRepo.sandboxRepo.split('/')[1]}.git`)}
                                className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-zinc-200 text-[10px] px-2 py-1 border border-zinc-800 rounded bg-zinc-900/80 leading-none transition duration-200 select-none shrink-0"
                              >
                                Copy
                              </button>
                            </div>
                          </div>

                          {/* Command remote */}
                          <div className="space-y-2 relative group">
                            <span className="text-[9px] text-zinc-500 uppercase tracking-widest block font-bold leading-none select-none">
                              B � Add upstream tracking to sandbox
                            </span>
                            <div className="flex items-center justify-between bg-black/60 px-3 py-2.5 rounded-lg border border-[var(--color-border)] font-mono text-[11px]">
                              <span className="text-accent select-text truncate">
                                git remote add upstream https://github.com/{selectedSandboxRepo.sandboxRepo}.git
                              </span>
                              <button
                                onClick={() => copyToClipboard(`git remote add upstream https://github.com/${selectedSandboxRepo.sandboxRepo}.git`)}
                                className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-zinc-200 text-[10px] px-2 py-1 border border-zinc-800 rounded bg-zinc-900/80 leading-none transition duration-200 select-none shrink-0"
                              >
                                Copy
                              </button>
                            </div>
                          </div>

                          {/* Command push */}
                          <div className="space-y-2 relative group">
                            <span className="text-[9px] text-zinc-500 uppercase tracking-widest block font-bold leading-none select-none">
                              C � Make changes, commit, and push directly to main
                            </span>
                            <div className="flex items-center justify-between bg-black/60 px-3 py-2.5 rounded-lg border border-[var(--color-border)] font-mono text-[11px]">
                              <span className="text-accent select-text truncate">
                                git push origin main
                              </span>
                              <button
                                onClick={() => copyToClipboard('git push origin main')}
                                className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-zinc-200 text-[10px] px-2 py-1 border border-zinc-800 rounded bg-zinc-900/80 leading-none transition duration-200 select-none shrink-0"
                              >
                                Copy
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Step 3: Verify contribution */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h5 className="text-[13px] font-medium text-white flex items-center gap-2.5">
                            <span className={`w-5.5 h-5.5 rounded-full flex items-center justify-center text-[10px] font-black transition-colors shadow-inner ${
                              devStatus.hasPR ? 'bg-accent text-black' : 'bg-white/[0.03] border border-[var(--color-border)] text-[var(--color-text-muted)]'
                            }`}>
                              {devStatus.hasPR ? '?' : '3'}
                            </span>
                            Step 3: Open Pull Request to Sandbox Repo
                          </h5>
                          {devStatus.hasPR && (
                            <span className="app-badge px-2 py-1 text-accent border-accent/25 bg-accent/[0.08]">
                              PR Active
                            </span>
                          )}
                        </div>

                        <div className={cn("app-panel space-y-4", embedded ? "p-4" : "p-5")}>
                          <p className="text-[var(--color-text-muted)] text-xs leading-relaxed">
                            Once your sandbox code modification is pushed, open a Pull Request comparing your fork's <span className="font-mono text-zinc-200">main</span> branch to the organization's <span className="font-mono text-zinc-200">main</span> branch. 
                          </p>

                          <div className="flex flex-col sm:flex-row gap-3 pt-1">
                            {/* Open PR Page on GitHub (Targeting comparison) */}
                            <a
                              href={`https://github.com/${selectedSandboxRepo.sandboxRepo}/compare/main...${githubUsername}:main`}
                              target="_blank"
                              rel="noreferrer"
                              className="flex-1 h-10 px-4 ui-btn-primary font-medium text-[13px] rounded-lg transition-colors text-center flex items-center justify-center gap-2"
                            >
                              Open PR Comparison Page
                              <svg className="w-3.5 h-3.5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>

                            {/* Verify Status Action */}
                            <button
                              onClick={checkLiveDeveloperStatus}
                              disabled={checkingStatus}
                              className={`h-10 px-4 ui-btn-secondary rounded-lg text-[13px] font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                                checkingStatus ? 'opacity-60 cursor-not-allowed' : ''
                              }`}
                            >
                              {checkingStatus ? (
                                <div className="w-3.5 h-3.5 border-2 border-zinc-300 border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 12H18.21" />
                                </svg>
                              )}
                              {checkingStatus ? 'Checking API...' : 'Verify PR Status'}
                            </button>
                          </div>

                          {/* Live PR details block */}
                          {devStatus.hasPR && devStatus.prDetails && (
                            <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-5 flex flex-col gap-3 animate-scale-up relative overflow-hidden">
                              <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-500/3 blur-2xl rounded-full pointer-events-none"></div>
                              <div className="flex items-center justify-between relative z-10">
                                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                                  Pull request active
                                </span>
                                <span className="text-[9px] font-black uppercase bg-emerald-500/10 text-emerald-400 px-2 py-0.5 border border-emerald-500/20 rounded shadow-sm">
                                  {devStatus.prDetails.state}
                                </span>
                              </div>
                              <h6 className="font-extrabold text-zinc-100 text-sm truncate relative z-10">
                                {devStatus.prDetails.title}
                              </h6>
                              <div className="flex items-center justify-between text-[10px] font-semibold text-zinc-500 border-t border-zinc-900/60 pt-3 relative z-10">
                                <span>PR #{devStatus.prDetails.number} � Created {new Date(devStatus.prDetails.createdAt).toLocaleDateString()}</span>
                                <a
                                  href={devStatus.prDetails.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-emerald-400 hover:text-emerald-300 font-bold transition flex items-center gap-1"
                                >
                                  Inspect PR
                                  <svg className="w-3.5 h-3.5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                </a>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Step 4: AI Review Report */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h5 className="text-sm font-bold text-zinc-100 flex items-center gap-2.5">
                            <span className={`w-5.5 h-5.5 rounded-full flex items-center justify-center text-[10px] font-black transition-colors shadow-inner ${
                              aiReview ? (aiReview.verdict === 'pass' ? 'bg-emerald-400 text-black' : aiReview.verdict === 'high_risk' ? 'bg-red-500 text-white' : 'bg-amber-500 text-black') : 'bg-zinc-900 border border-zinc-800 text-zinc-400'
                            }`}>
                              {aiReview ? (aiReview.verdict === 'pass' ? '?' : aiReview.verdict === 'high_risk' ? '!' : '~') : '4'}
                            </span>
                            Step 4: AI Review Report
                          </h5>
                          {aiReview && (
                            <span className={`text-[9px] font-black uppercase border px-2 py-0.5 rounded shadow-inner ${
                              aiReview.verdict === 'pass' ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400'
                              : aiReview.verdict === 'high_risk' ? 'border-red-500/30 bg-red-500/5 text-red-400'
                              : 'border-amber-500/30 bg-amber-500/5 text-amber-400 animate-pulse'
                            }`}>
                              {aiReview.verdict === 'pass' ? '?? PASS' : aiReview.verdict === 'high_risk' ? '?? HIGH RISK' : '?? NEEDS CHANGES'}
                            </span>
                          )}
                        </div>

                        <div className="app-panel p-5 space-y-4">
                          {!devStatus.hasPR ? (
                            <p className="text-zinc-500 text-xs font-medium">Open a Pull Request first (Step 3) to trigger the AI review pipeline.</p>
                          ) : devReviewStatus === 'verifying' ? (
                            <div className="space-y-4">
                              {/* Live Progress Bar */}
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs font-semibold">
                                  <span className="font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                                    Verification Pipeline
                                  </span>
                                  <span className="text-emerald-400 font-black tracking-wider animate-pulse">
                                    {activeReviewProgress}%
                                  </span>
                                </div>
                                <div className="h-2.5 bg-[#050507] border border-zinc-900 rounded-full overflow-hidden shadow-inner">
                                  <div
                                    className="h-full transition-all duration-500 rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 animate-pulse"
                                    style={{ width: `${activeReviewProgress}%` }}
                                  ></div>
                                </div>
                              </div>

                              {/* Live Terminal Logs */}
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5 leading-none">
                                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 shrink-0 shadow-inner"></span>
                                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 shrink-0 shadow-inner"></span>
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 shrink-0 shadow-inner"></span>
                                    review-pipeline stdout
                                  </span>
                                  <span className="text-[9px] font-black tracking-widest text-zinc-500 uppercase leading-none font-mono">
                                    tty0
                                  </span>
                                </div>
                                <div
                                  ref={devTerminalRef}
                                  className="w-full app-terminal rounded-xl p-5 font-mono text-left max-h-[200px] min-h-[140px] overflow-y-auto custom-scrollbar relative flex flex-col justify-start select-text"
                                >
                                  <div className="flex-1 flex flex-col">
                                    {activeReviewLogs.map((log, idx) => (
                                      <div key={idx}>{formatTerminalLog(log)}</div>
                                    ))}
                                    <div className="py-1 flex items-center gap-1 select-none font-mono text-xs text-zinc-500">
                                      <span>&gt;_</span>
                                      <span className="w-1.5 h-3.5 bg-emerald-500/80 animate-pulse inline-block"></span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <p className="text-[10px] text-zinc-500 text-center font-medium">
                                Running deterministic checks and AI analysis on your PR. This usually takes 30-60 seconds.
                              </p>
                            </div>
                          ) : (
                            <>
                              <div className="flex gap-3">
                                <button
                                  onClick={fetchAIReview}
                                  disabled={loadingReview}
                                  className="flex-1 h-10 rounded-lg text-[13px] font-medium ui-btn-primary transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                                >
                                  {loadingReview ? (
                                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Fetching Review...</>
                                  ) : (
                                    <>
                                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                      </svg>
                                      Load AI Review
                                    </>
                                  )}
                                </button>
                              </div>

                              {aiReview && (
                                <div className="animate-fade-in mt-4">
                                  <AIReviewReport
                                    review={aiReview}
                                    title={`PR #${aiReview.prNumber}`}
                                    prUrl={devStatus.prDetails?.url}
                                  />
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                    </div>
                  </div>
                ) : (
                  <div className="app-empty p-12 text-center flex flex-col items-center justify-center gap-3 h-full min-h-[400px]">
                    <svg className="w-10 h-10 text-[var(--color-text-muted)] mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                    <h4 className="font-bold text-zinc-400 text-sm tracking-wide">No sandbox repo selected</h4>
                    <p className="text-zinc-500 text-xs max-w-xs leading-relaxed font-medium">
                      Select an available sandbox repository from the left panel to initialize your workspace fork and push main branch changes.
                    </p>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </main>

      {/* --- Global Footer --- */}
      {!embedded && (
        <footer className="border-t border-[var(--color-border)] bg-white/[0.01] py-6 text-center text-[11px] text-[var(--color-text-muted)] font-medium relative z-10 shrink-0 select-none">
          Built for Forke Platform validation. Ship real code. Prove skills. Level up.
        </footer>
      )}

      {/* ===== PR Comparison Modal ===== */}
      {comparisonModalOpen && comparisonPRReview && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) setComparisonModalOpen(false) }}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

          {/* Modal */}
          <div className="relative z-10 w-full max-w-3xl app-modal overflow-hidden flex flex-col max-h-[90vh] font-sans">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[var(--color-border)]">
              <div>
                <p className="text-[10px] font-medium text-[var(--color-text-muted)] uppercase tracking-wider">AI Review Report</p>
                <h3 className="text-base font-semibold text-white mt-0.5 truncate max-w-[460px]">{comparisonTitle}</h3>
              </div>
              <button onClick={() => setComparisonModalOpen(false)} className="text-[var(--color-text-muted)] hover:text-white border border-[var(--color-border)] hover:border-white/10 w-8 h-8 rounded-lg flex items-center justify-center transition cursor-pointer text-sm">
                ?
              </button>
            </div>

            {/* Modal Body � new AIReviewReport */}
            <div className="px-6 py-5 overflow-y-auto custom-scrollbar flex-1">
              <AIReviewReport
                review={comparisonPRReview}
                title={comparisonTitle}
              />
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-[var(--color-border)]">
              <button
                onClick={() => setComparisonModalOpen(false)}
                className="w-full h-9 rounded-lg ui-btn-secondary text-[13px] font-medium transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Baseline Report Display Overlay */}
      {selectedBaselineReport && (
        <div className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-center justify-center p-6 md:p-12 animate-fade-in">
          <div className="w-full max-w-5xl h-[85vh] bg-[#040406] border border-zinc-800 rounded-3xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.9)] flex flex-col justify-between animate-scale-up">
            {/* Title bar */}
            <div className="flex items-center justify-between border-b border-zinc-900 pb-4 mb-4 select-none">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/80"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
                </div>
                <span className="text-xs font-semibold text-white ml-1">
                  Baseline Snapshot
                </span>
                <span className="text-[10px] px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded font-mono">
                  commit {selectedBaselineReport.commitSha.substring(0, 7)}
                </span>
                {selectedBaselineReport.techStack?.language && (
                  <span className="text-[10px] px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded font-mono">
                    {selectedBaselineReport.techStack.language}
                    {selectedBaselineReport.techStack.packageManager ? ` � ${selectedBaselineReport.techStack.packageManager}` : ''}
                    {selectedBaselineReport.techStack.frontend ? ` � ${selectedBaselineReport.techStack.frontend}` : ''}
                  </span>
                )}
              </div>
              <button 
                onClick={() => {
                  setSelectedBaselineReport(null)
                  setSelectedBaselineCategoryLog(null)
                }}
                className="text-zinc-400 hover:text-zinc-200 border border-zinc-800 hover:border-zinc-700 bg-zinc-900/30 px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer"
              >
                ? Close
              </button>
            </div>

            {/* Report Content */}
            <div className="flex-1 w-full overflow-y-auto custom-scrollbar select-text text-left mb-4 pr-1.5 space-y-6">
              {/* Overview grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="app-panel p-4">
                  <span className="text-zinc-500 block text-[9px] font-semibold uppercase tracking-widest mb-1.5">Tech Stack</span>
                  <div className="space-y-1">
                    <div className="text-zinc-200 font-bold text-sm flex items-center gap-1.5">
                      <span>{selectedBaselineReport.techStack?.language || 'Unknown'}</span>
                      {selectedBaselineReport.techStack?.packageManager && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                          {selectedBaselineReport.techStack.packageManager}
                        </span>
                      )}
                    </div>
                    <div className="text-zinc-400 font-medium text-[10px] space-y-0.5">
                      {selectedBaselineReport.techStack?.frontend && (
                        <div>Frontend: <span className="text-zinc-300 font-semibold">{selectedBaselineReport.techStack.frontend}</span></div>
                      )}
                      {selectedBaselineReport.techStack?.backend && (
                        <div>Backend: <span className="text-zinc-300 font-semibold">{selectedBaselineReport.techStack.backend}</span></div>
                      )}
                      {!selectedBaselineReport.techStack?.frontend && !selectedBaselineReport.techStack?.backend && (
                        <div className="text-zinc-500 italic">
                          {selectedBaselineReport.techStack?.isStaticSite ? 'Static HTML/CSS Site' : 'Core Scripting / CLI'}
                        </div>
                      )}
                      {selectedBaselineReport.techStack?.testFramework && (
                        <div className="text-emerald-400/90 text-[9px] mt-1 font-mono">
                          Test runner: {selectedBaselineReport.techStack.testFramework}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="app-panel p-4">
                  <span className="text-zinc-500 block text-[9px] font-semibold uppercase tracking-widest mb-1">Commit SHA</span>
                  <span className="text-amber-400 font-mono font-bold text-sm block truncate">
                    {selectedBaselineReport.commitSha}
                  </span>
                  <span className="text-zinc-500 font-medium text-[10px]">
                    Branch: {selectedBaselineReport.branch}
                  </span>
                </div>

                <div className="app-panel p-4">
                  <span className="text-zinc-500 block text-[9px] font-semibold uppercase tracking-widest mb-1">Issues Found</span>
                  {(() => {
                    const count = selectedBaselineReport.results
                      ? Object.values(selectedBaselineReport.results).reduce((acc: number, cat: any) => acc + (cat?.issuesCount || 0), 0)
                      : 0
                    return (
                      <>
                        <span className={`font-bold text-sm block ${count > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                          {count} {count === 1 ? 'Issue' : 'Issues'}
                        </span>
                        <span className="text-zinc-500 font-medium text-[10px]">across 12 categories</span>
                      </>
                    )
                  })()}
                </div>

                <div className="app-panel p-4">
                  <span className="text-zinc-500 block text-[9px] font-semibold uppercase tracking-widest mb-1">Snapshot Date</span>
                  <span className="text-zinc-200 font-bold text-sm block">
                    {new Date(selectedBaselineReport.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span className="text-zinc-500 font-medium text-[10px] block">
                    {new Date(selectedBaselineReport.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              {/* Core 12-Category Grid */}
              {selectedBaselineReport.results && (
                <div className="grid md:grid-cols-3 gap-6">
                  {/* Left list: category select */}
                  <div className="md:col-span-1 space-y-2 max-h-[48vh] overflow-y-auto pr-1.5 custom-scrollbar">
                    {Object.keys(selectedBaselineReport.results).map(catName => {
                      const res = selectedBaselineReport.results[catName];
                      if (!res) return null;
                      
                      const isSelected = selectedBaselineCategoryLog === catName;
                      const status = res.status || 'skip'
                      let badgeColor = 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400';
                      if (status === 'fail') badgeColor = 'border-red-500/20 bg-red-500/5 text-red-400';
                      else if (status === 'warn') badgeColor = 'border-amber-500/20 bg-amber-500/5 text-amber-400';
                      else if (status === 'skip') badgeColor = 'border-zinc-700 bg-zinc-900 text-zinc-500';

                      // Human-readable category name
                      const humanName = catName
                        .replace(/([A-Z])/g, ' $1')
                        .replace(/^./, (s: string) => s.toUpperCase())
                        .trim()

                      // Icon per status
                      const statusIcon = status === 'pass' ? '?' : status === 'fail' ? '?' : status === 'warn' ? '?' : '�'

                      return (
                        <button
                          key={catName}
                          onClick={() => setSelectedBaselineCategoryLog(catName)}
                          className={`w-full text-left p-3 rounded-xl border transition-all duration-200 flex items-center justify-between gap-2 relative overflow-hidden group/cat-btn ${
                            isSelected
                              ? 'bg-amber-500/5 border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.04)]'
                              : 'bg-white/[0.018] border-[var(--color-border)] hover:border-white/[0.14]'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`text-[11px] font-bold shrink-0 ${
                              status === 'pass' ? 'text-emerald-400' :
                              status === 'fail' ? 'text-red-400' :
                              status === 'warn' ? 'text-amber-400' : 'text-zinc-600'
                            }`}>{statusIcon}</span>
                            <span className="font-medium text-[11px] text-zinc-300 group-hover/cat-btn:text-white transition-colors truncate">
                              {humanName}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {res.issuesCount > 0 && (
                              <span className="text-[9px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded">
                                {res.issuesCount}
                              </span>
                            )}
                            <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded border ${badgeColor}`}>
                              {status}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Right panel: structured category output */}
                  <div className="md:col-span-2 flex flex-col gap-3 h-[48vh] justify-between">
                    {selectedBaselineCategoryLog && selectedBaselineReport.results[selectedBaselineCategoryLog] ? (
                      (() => {
                        const catResult = selectedBaselineReport.results[selectedBaselineCategoryLog]
                        const rawOutput: string = catResult?.logs || catResult?.output || ''
                        const status: string = catResult?.status || 'skip'
                        const issueCount: number = catResult?.issuesCount || 0

                        // Parse log lines into structured entries
                        const logLines = rawOutput.split('\n').filter((l: string) => l.trim())
                        
                        // Classify each line for colour coding
                        const classifyLine = (line: string): { color: string; icon: string } => {
                          const l = line.toLowerCase()
                          if (l.includes('error') || l.includes('fail') || l.includes('critical') || l.startsWith('?') || l.startsWith('�')) {
                            return { color: 'text-red-400', icon: '?' }
                          }
                          if (l.includes('warn') || l.includes('caution') || l.includes('notice')) {
                            return { color: 'text-amber-400', icon: '?' }
                          }
                          if (l.includes('pass') || l.includes('success') || l.includes('ok') || l.startsWith('?') || l.startsWith('?')) {
                            return { color: 'text-emerald-400', icon: '?' }
                          }
                          if (l.startsWith('#') || l.includes('===') || l.includes('---')) {
                            return { color: 'text-cyan-400 font-semibold', icon: '' }
                          }
                          return { color: 'text-zinc-300', icon: '' }
                        }

                        const statusBadge = status === 'pass'
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                          : status === 'fail'
                          ? 'border-red-500/30 bg-red-500/10 text-red-400'
                          : status === 'warn'
                          ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                          : 'border-zinc-700 bg-zinc-900 text-zinc-400'

                        return (
                          <div className="flex flex-col gap-3 h-full">
                            {/* Category header row */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <span className="font-black uppercase tracking-widest text-zinc-200 text-xs">
                                  {selectedBaselineCategoryLog.replace(/([A-Z])/g, ' $1').trim()}
                                </span>
                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${statusBadge}`}>
                                  {status.toUpperCase()}
                                </span>
                                {issueCount > 0 && (
                                  <span className="text-[9px] font-bold text-zinc-500">
                                    {issueCount} issue{issueCount !== 1 ? 's' : ''}
                                  </span>
                                )}
                              </div>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(rawOutput)
                                  alert(`Output for ${selectedBaselineCategoryLog} copied!`)
                                }}
                                className="text-[var(--color-text-muted)] hover:text-white font-medium text-[11px] border border-[var(--color-border)] px-2.5 py-1 rounded bg-white/[0.02] hover:bg-white/[0.05] cursor-pointer transition-colors"
                              >
                                Copy output
                              </button>
                            </div>

                            {/* Structured log viewer */}
                            <div className="flex-1 w-full bg-[#040406]/98 rounded-2xl border border-zinc-900 shadow-[inset_0_4px_12px_rgba(0,0,0,0.8)] overflow-auto custom-scrollbar">
                              {rawOutput ? (
                                <div className="p-4 space-y-0.5">
                                  {logLines.map((line: string, idx: number) => {
                                    const { color, icon } = classifyLine(line)
                                    // Section headers (lines with === or --- or starting with #)
                                    const isHeader = line.includes('===') || line.includes('---') || line.trim().startsWith('#')
                                    if (isHeader) {
                                      return (
                                        <div key={idx} className="py-1.5 mt-2 mb-1 border-b border-zinc-800/60 first:mt-0">
                                          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 select-text">
                                            {line.replace(/[=\-#]/g, '').trim() || line}
                                          </span>
                                        </div>
                                      )
                                    }
                                    return (
                                      <div key={idx} className="flex items-start gap-2 py-0.5 font-mono text-[11px] leading-relaxed group/line hover:bg-white/[0.02] rounded px-1 transition-colors">
                                        {icon && (
                                          <span className={`shrink-0 mt-0.5 text-[10px] ${color.split(' ')[0]}`}>
                                            {icon}
                                          </span>
                                        )}
                                        <span className={`select-text ${color} break-all`}>{line}</span>
                                      </div>
                                    )
                                  })}
                                </div>
                              ) : (
                                <div className="flex items-center justify-center h-full text-zinc-600 text-xs font-medium">
                                  No output available for this category.
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })()
                    ) : (
                      <div className="app-empty p-12 text-center flex flex-col items-center justify-center gap-2.5 h-full">
                        <svg className="w-10 h-10 text-[var(--color-text-muted)] mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-3.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                        </svg>
                        <h4 className="font-bold text-zinc-500 text-xs tracking-wide uppercase">No Category Selected</h4>
                        <p className="text-zinc-600 text-[10px] max-w-xs leading-relaxed font-semibold">
                          Select one of the 12 deterministic test categories on the left to review the raw system outputs and issues found.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Gemini AI Diagnostic Report Card */}
              {selectedBaselineReport.aiSummary && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-violet-400 font-mono flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse"></span>
                      Gemini AI Baseline Diagnostic
                    </span>
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md border ${
                      selectedBaselineReport.aiSummary.overallHealth === 'healthy'
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                        : selectedBaselineReport.aiSummary.overallHealth === 'critical'
                        ? 'border-red-500/30 bg-red-500/10 text-red-400'
                        : 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                    }`}>
                      {selectedBaselineReport.aiSummary.overallHealth?.toUpperCase()}
                    </span>
                  </div>

                  {/* AI Overview Card */}
                  <div className="bg-gradient-to-br from-violet-500/5 via-[#070709] to-cyan-500/5 border border-violet-500/15 rounded-2xl p-5 space-y-4 relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-40 h-40 bg-violet-500/5 blur-[60px] rounded-full pointer-events-none"></div>
                    
                    {/* Health Badge + Model */}
                    <div className="flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black shadow-inner ${
                          selectedBaselineReport.aiSummary.overallHealth === 'healthy'
                            ? 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-400'
                            : selectedBaselineReport.aiSummary.overallHealth === 'critical'
                            ? 'bg-red-500/10 border border-red-500/25 text-red-400'
                            : 'bg-amber-500/10 border border-amber-500/25 text-amber-400'
                        }`}>
                          {selectedBaselineReport.aiSummary.overallHealth === 'healthy' ? '?' : selectedBaselineReport.aiSummary.overallHealth === 'critical' ? '!' : '~'}
                        </div>
                        <div>
                          <div className="text-sm font-black text-zinc-100">Repository Health Assessment</div>
                          <div className="text-[10px] text-zinc-500 font-semibold">
                            Model: <span className="text-violet-400 font-mono">{selectedBaselineReport.aiSummary.model || 'gemini'}</span>
                            {selectedBaselineReport.aiSummary.analyzedAt && (
                              <> � {new Date(selectedBaselineReport.aiSummary.analyzedAt).toLocaleString()}</>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* AI Summary */}
                    <div className="bg-[#040406]/80 rounded-xl p-4 text-xs text-zinc-300 leading-relaxed border border-zinc-900/60 relative z-10">
                      <div className="text-[9px] font-black uppercase tracking-widest text-violet-400 mb-2 font-mono">AI Analysis Summary</div>
                      {selectedBaselineReport.aiSummary.summary}
                    </div>

                    {/* Per-Category AI Diagnostics */}
                    {selectedBaselineReport.aiSummary.categoryDiagnostics && selectedBaselineReport.aiSummary.categoryDiagnostics.length > 0 && (
                      <div className="space-y-2.5 relative z-10">
                        <div className="text-[9px] font-black uppercase tracking-widest text-zinc-400 font-mono">
                          Category Analysis ({selectedBaselineReport.aiSummary.categoryDiagnostics.length})
                        </div>
                        <div className="space-y-2 max-h-[260px] overflow-y-auto custom-scrollbar pr-1">
                          {selectedBaselineReport.aiSummary.categoryDiagnostics.map((diag: any, idx: number) => {
                            const statusColor = diag.adjustedStatus === 'pass'
                              ? 'border-emerald-500/20 bg-emerald-500/5'
                              : diag.adjustedStatus === 'fail'
                              ? 'border-red-500/20 bg-red-500/5'
                              : diag.adjustedStatus === 'warn'
                              ? 'border-amber-500/20 bg-amber-500/5'
                              : 'border-zinc-800/60 bg-zinc-900/30'
                            return (
                              <div key={idx} className={`p-3.5 rounded-xl border ${statusColor} text-[11px]`}>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-black text-zinc-200 uppercase tracking-wider text-[10px]">
                                    {diag.category?.replace(/([A-Z])/g, ' $1').trim()}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    {diag.isFalsePositive && (
                                      <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/25">
                                        FALSE POSITIVE
                                      </span>
                                    )}
                                    <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border ${
                                      diag.adjustedStatus === 'pass' ? 'bg-emerald-500/15 border-emerald-500/25 text-emerald-400' :
                                      diag.adjustedStatus === 'fail' ? 'bg-red-500/15 border-red-500/25 text-red-400' :
                                      diag.adjustedStatus === 'warn' ? 'bg-amber-500/15 border-amber-500/25 text-amber-400' :
                                      'bg-zinc-800 border-zinc-700 text-zinc-400'
                                    }`}>
                                      {diag.adjustedStatus?.toUpperCase() || 'SKIP'}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-zinc-300 leading-relaxed">{diag.rootCause}</div>
                                {diag.isFalsePositive && diag.falsePositiveReason && (
                                  <div className="mt-1.5 text-amber-400/80 text-[10px] italic bg-amber-500/5 p-2 rounded-lg border border-amber-500/10">
                                    ?? {diag.falsePositiveReason}
                                  </div>
                                )}
                                {diag.suggestedFix && (
                                  <div className="mt-1.5 text-cyan-400/80 text-[10px] bg-cyan-500/5 p-2 rounded-lg border border-cyan-500/10">
                                    ?? <span className="font-bold">Suggested Fix:</span> {diag.suggestedFix}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer buttons */}
            <div className="border-t border-zinc-900 pt-4 flex gap-3 select-none">
              <button
                onClick={copyAllBaselineLogs}
                className="flex-1 py-3 rounded-xl border border-[var(--color-border)] hover:border-white/10 bg-white/[0.02] hover:bg-white/[0.04] text-zinc-400 hover:text-zinc-200 text-xs font-medium transition cursor-pointer flex items-center justify-center gap-2"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy All Logs
              </button>
              <button
                onClick={() => {
                  setSelectedBaselineReport(null)
                  setSelectedBaselineCategoryLog(null)
                }}
                className="flex-1 py-3 rounded-xl ui-btn-primary text-xs font-medium transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

