/**
 * @fileoverview Forke Platform
 * @copyright (c) 2026 Forke Inc. (https://www.forke.space/)
 *
 * Source-Available License (Non-Commercial / Fair Source).
 * This source code is open for inspection, learning, and personal development.
 * Commercial use, hosting, or resale as a paid service without an explicit
 * commercial license from Forke Inc. is strictly prohibited.
 */

import { execFile } from 'child_process'
import { promisify } from 'util'

const execFileAsync = promisify(execFile)

// Run git WITHOUT a shell: repo names, branch names and refs from GitHub are
// passed as separate arguments, so characters like $( ) ` ; can never execute.
// Tokens embedded in URLs are scrubbed from any error message.
export async function git(args: string[], opts: { cwd?: string; timeoutMs?: number } = {}) {
  try {
    return await execFileAsync('git', args, {
      cwd: opts.cwd,
      timeout: opts.timeoutMs ?? 10 * 60 * 1000,
      maxBuffer: 64 * 1024 * 1024,
      env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
    })
  } catch (err: any) {
    const clean = new Error(redact(String(err?.stderr || err?.message || err)))
    throw clean
  }
}

export function redact(text: string): string {
  return text.replace(/x-access-token:[^@\s"']+@/g, 'x-access-token:***@')
}

export function authenticatedUrl(token: string, repoFullName: string): string {
  if (!/^[\w.-]+\/[\w.-]+$/.test(repoFullName)) throw new Error('Invalid repository name')
  return `https://x-access-token:${token}@github.com/${repoFullName}.git`
}

const HTTP_OPTS = ['-c', 'http.version=HTTP/1.1', '-c', 'http.postBuffer=524288000']
const SLOW_LINK_OPTS = ['-c', 'http.lowSpeedLimit=0', '-c', 'http.lowSpeedTime=999999']
export const gitHttpOpts = HTTP_OPTS
export const gitPushOpts = [...HTTP_OPTS, ...SLOW_LINK_OPTS]
