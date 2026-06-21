'use client'

import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils/cn'

interface TreeItem {
  path: string
  type: 'file' | 'dir'
}

interface TreeNode {
  name: string
  path: string
  type: 'file' | 'dir'
  children: TreeNode[]
}

interface FileTreeProps {
  username: string
  repo: string // e.g. "owner/repo-name"
  checkedPaths: Set<string>
  onChange: (checked: Set<string>) => void
  onLoad?: (allFilePaths: string[]) => void
}

// ── Build nested tree from flat path list ──────────────────────────────────
function buildTree(items: TreeItem[]): TreeNode[] {
  const root: TreeNode[] = []
  const map = new Map<string, TreeNode>()

  // Sort: dirs first, then files, then alphabetically
  const sorted = [...items].sort((a, b) => {
    if (a.type !== b.type) return a.type === 'dir' ? -1 : 1
    return a.path.localeCompare(b.path)
  })

  for (const item of sorted) {
    const parts = item.path.split('/')
    const name = parts[parts.length - 1]
    const node: TreeNode = { name, path: item.path, type: item.type, children: [] }
    map.set(item.path, node)

    if (parts.length === 1) {
      root.push(node)
    } else {
      const parentPath = parts.slice(0, -1).join('/')
      const parent = map.get(parentPath)
      if (parent) {
        parent.children.push(node)
      } else {
        // Parent dir not in list (truncated tree) — attach to root
        root.push(node)
      }
    }
  }

  return root
}

// ── Get all descendant file paths from a node ──────────────────────────────
function collectFilePaths(node: TreeNode): string[] {
  if (node.type === 'file') return [node.path]
  return node.children.flatMap(collectFilePaths)
}

// ── Check state for a node: 'all' | 'some' | 'none' ───────────────────────
function getCheckState(node: TreeNode, checked: Set<string>): 'all' | 'some' | 'none' {
  if (node.type === 'file') {
    return checked.has(node.path) ? 'all' : 'none'
  }
  const files = collectFilePaths(node)
  if (files.length === 0) return 'none'
  const checkedCount = files.filter(f => checked.has(f)).length
  if (checkedCount === 0) return 'none'
  if (checkedCount === files.length) return 'all'
  return 'some'
}

// ── File extension → colour ────────────────────────────────────────────────
function extColor(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  if (['ts', 'tsx'].includes(ext)) return 'text-blue-400'
  if (['js', 'jsx', 'mjs', 'cjs'].includes(ext)) return 'text-yellow-400'
  if (['css', 'scss', 'sass'].includes(ext)) return 'text-pink-400'
  if (['json', 'yaml', 'yml', 'toml'].includes(ext)) return 'text-orange-400'
  if (['md', 'mdx'].includes(ext)) return 'text-slate-400'
  if (['py'].includes(ext)) return 'text-green-400'
  if (['go'].includes(ext)) return 'text-cyan-400'
  if (['rs'].includes(ext)) return 'text-orange-500'
  if (['env', 'env*'].includes(ext) || name.startsWith('.env')) return 'text-red-400'
  return 'text-[var(--color-text-muted)]'
}

// ── File icon ─────────────────────────────────────────────────────────────
function FileIcon({ name }: { name: string }) {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  const isConfig = name.startsWith('.') || ['json', 'yaml', 'yml', 'toml', 'env'].includes(ext)
  return (
    <svg className={cn('w-3.5 h-3.5 shrink-0', extColor(name))} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      {isConfig ? (
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      )}
    </svg>
  )
}

// ── Folder icon ────────────────────────────────────────────────────────────
function FolderIcon({ open }: { open: boolean }) {
  return (
    <svg className="w-3.5 h-3.5 shrink-0 text-amber-400/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      {open ? (
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
      )}
    </svg>
  )
}

// ── Checkbox ───────────────────────────────────────────────────────────────
function Checkbox({ state, onChange }: { state: 'all' | 'some' | 'none'; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={e => { e.stopPropagation(); onChange() }}
      className="w-4 h-4 shrink-0 rounded border flex items-center justify-center transition-colors cursor-pointer"
      style={{
        borderColor: state === 'none' ? 'rgba(255,255,255,0.15)' : state === 'all' ? 'rgba(34,197,94,0.6)' : 'rgba(251,146,60,0.6)',
        background: state === 'all' ? 'rgba(34,197,94,0.15)' : state === 'some' ? 'rgba(251,146,60,0.1)' : 'transparent',
      }}
      aria-label="toggle"
    >
      {state === 'all' && (
        <svg className="w-2.5 h-2.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      )}
      {state === 'some' && (
        <span className="w-2 h-0.5 bg-orange-400 rounded" />
      )}
    </button>
  )
}

// ── Single tree node row ───────────────────────────────────────────────────
function TreeNodeRow({
  node,
  depth,
  checked,
  onToggle,
}: {
  node: TreeNode
  depth: number
  checked: Set<string>
  onToggle: (node: TreeNode) => void
}) {
  const [open, setOpen] = useState(depth < 2)
  const state = getCheckState(node, checked)
  const isFile = node.type === 'file'
  const isAllowed = isFile ? checked.has(node.path) : state !== 'none'

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-1.5 py-[3px] px-1.5 rounded group/row transition-colors select-none',
          'hover:bg-white/[0.035]',
          !isAllowed && isFile && 'opacity-60'
        )}
        style={{ paddingLeft: `${depth * 16 + 6}px` }}
      >
        {/* Expand/collapse for dirs */}
        {!isFile ? (
          <button
            type="button"
            onClick={() => setOpen(o => !o)}
            className="w-3.5 h-3.5 shrink-0 flex items-center justify-center text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
          >
            <svg className={cn('w-2.5 h-2.5 transition-transform', open && 'rotate-90')} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        ) : (
          <span className="w-3.5 shrink-0" />
        )}

        <Checkbox state={state} onChange={() => onToggle(node)} />

        {isFile ? <FileIcon name={node.name} /> : <FolderIcon open={open} />}

        <span
          className={cn(
            'text-[12px] font-mono leading-none truncate flex-1',
            isFile
              ? isAllowed
                ? cn('text-white/85', extColor(node.name))
                : 'text-red-400/70 line-through decoration-red-500/50'
              : 'text-zinc-300 font-medium'
          )}
          onClick={!isFile ? () => setOpen(o => !o) : undefined}
          style={!isFile ? { cursor: 'pointer' } : undefined}
        >
          {node.name}
          {!isFile && '/'}
        </span>

        {/* Status pill for files */}
        {isFile && (
          <span className={cn(
            'text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0 ml-1',
            isAllowed
              ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
              : 'text-red-400 bg-red-500/10 border border-red-500/20'
          )}>
            {isAllowed ? 'allowed' : 'blocked'}
          </span>
        )}
      </div>

      {/* Children */}
      {!isFile && open && node.children.length > 0 && (
        <div>
          {node.children.map(child => (
            <TreeNodeRow
              key={child.path}
              node={child}
              depth={depth + 1}
              checked={checked}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main export ────────────────────────────────────────────────────────────
export default function FileTree({ username, repo, checkedPaths, onChange, onLoad }: FileTreeProps) {
  const [items, setItems] = useState<TreeItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [truncated, setTruncated] = useState(false)

  useEffect(() => {
    if (!username || !repo) return
    setLoading(true)
    setError(null)
    fetch(`/api/owner/repo-tree?username=${encodeURIComponent(username)}&repo=${encodeURIComponent(repo)}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); return }
        setItems(data.items || [])
        setTruncated(data.truncated ?? false)
        // Default: check all files (everything allowed)
        const allFiles = (data.items as TreeItem[])
          .filter(i => i.type === 'file')
          .map(i => i.path)
        onLoad?.(allFiles)
        onChange(new Set(allFiles))
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username, repo])

  const tree = buildTree(items)

  const handleToggle = useCallback((node: TreeNode) => {
    const filePaths = collectFilePaths(node)
    const state = getCheckState(node, checkedPaths)
    const next = new Set(checkedPaths)
    if (state === 'all') {
      filePaths.forEach(p => next.delete(p))
    } else {
      filePaths.forEach(p => next.add(p))
    }
    onChange(next)
  }, [checkedPaths, onChange])

  const totalFiles = items.filter(i => i.type === 'file').length
  const allowedCount = items.filter(i => i.type === 'file' && checkedPaths.has(i.path)).length

  if (loading) {
    return (
      <div className="flex items-center gap-2.5 py-8 justify-center text-[var(--color-text-muted)]">
        <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <span className="text-[13px]">Loading file tree…</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-6 text-center">
        <p className="text-[13px] text-red-400">Failed to load file tree: {error}</p>
        <p className="text-[11px] text-[var(--color-text-muted)] mt-1">You can still enter paths manually in the acceptance criteria field below.</p>
      </div>
    )
  }

  if (items.length === 0) return null

  return (
    <div className="space-y-2">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
            {allowedCount} allowed
          </span>
          <span className="text-[11px] font-medium text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded">
            {totalFiles - allowedCount} blocked
          </span>
          {truncated && (
            <span className="text-[11px] text-amber-400/70">⚠ Large repo — tree may be partial</span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              const allFiles = items.filter(i => i.type === 'file').map(i => i.path)
              onChange(new Set(allFiles))
            }}
            className="text-[11px] font-medium text-[var(--color-text-muted)] hover:text-white border border-[var(--color-border)] px-2 py-0.5 rounded transition-colors cursor-pointer"
          >
            Allow all
          </button>
          <button
            type="button"
            onClick={() => onChange(new Set())}
            className="text-[11px] font-medium text-[var(--color-text-muted)] hover:text-white border border-[var(--color-border)] px-2 py-0.5 rounded transition-colors cursor-pointer"
          >
            Block all
          </button>
        </div>
      </div>

      {/* Tree */}
      <div className="rounded-xl border border-[var(--color-border)] bg-white/[0.015] max-h-[380px] overflow-y-auto custom-scrollbar py-2">
        {tree.map(node => (
          <TreeNodeRow
            key={node.path}
            node={node}
            depth={0}
            checked={checkedPaths}
            onToggle={handleToggle}
          />
        ))}
      </div>
    </div>
  )
}
