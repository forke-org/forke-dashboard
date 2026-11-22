/**
 * @fileoverview Forke Platform
 * @copyright (c) 2026 Forke Inc. (https://www.forke.space/)
 *
 * Source-Available License (Non-Commercial / Fair Source).
 * This source code is open for inspection, learning, and personal development.
 * Commercial use, hosting, or resale as a paid service without an explicit
 * commercial license from Forke Inc. is strictly prohibited.
 */

// Data for the new public profile (layout B). Safe to import from server and client code.

export type ShippedWork = {
  id: string
  title: string
  repo: string | null
  pr: string | null
  prUrl: string | null
  company: string | null
  tags: string[]
  rating: number | null
  xp: number
  date: string
}

export type Achievement = { label: string; desc: string; group: string; have: number; need: number }

export type DevProfile = {
  username: string
  name: string
  headline: string | null
  bio: string | null
  location: string | null
  college: string | null
  avatarUrl: string | null
  level: number
  levelTitle: string
  currentStreak: number
  joinedAt: string
  githubUrl: string | null
  linkedinUrl: string | null
  websiteUrl: string | null
  shipped: number
  avgRating: number | null
  stack: string[]
  work: ShippedWork[]
  achievements: Achievement[]
  heatmap: { date: string; count: number }[]
}

/** "https://github.com/acme/api/pull/42" → { repo: "acme/api", pr: "42" } */
export function parsePr(url: string | null | undefined): { repo: string | null; pr: string | null } {
  const m = url?.match(/github\.com\/([^/]+\/[^/]+)\/pull\/(\d+)/i)
  return m ? { repo: m[1], pr: m[2] } : { repo: null, pr: null }
}

export function githubHandle(url: string | null | undefined): string | null {
  const m = url?.match(/github\.com\/([^/?#]+)/i)
  return m ? m[1] : null
}
