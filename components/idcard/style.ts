// Shared ID card options, safe to import from server and client code.
import type { CardColor, PhotoFilter } from './paint'

export type CardStyle = { color: CardColor; filter: PhotoFilter; line: string }
export const DEFAULT_CARD_STYLE: CardStyle = { color: 'black', filter: 'orange', line: 'Ships it. Verified.' }

export const CARD_COLORS: { key: CardColor; swatch: string }[] = [
  { key: 'black', swatch: '#151414' },
  { key: 'white', swatch: '#F7EFE9' },
  { key: 'orange', swatch: '#FF7A00' },
]
export const PHOTO_FILTERS: { key: PhotoFilter; label: string }[] = [
  { key: 'orange', label: 'Orange' },
  { key: 'bw', label: 'B&W' },
  { key: 'normal', label: 'Original' },
]

/** Splits a short line into two balanced rows for the card. */
export function twoLines(q: string): [string, string] {
  const words = q.trim().split(/\s+/).filter(Boolean)
  if (words.length < 2) return [q.trim(), '']
  let best = 1
  let gap = Infinity
  for (let i = 1; i < words.length; i++) {
    const d = Math.abs(words.slice(0, i).join(' ').length - words.slice(i).join(' ').length)
    if (d < gap) {
      gap = d
      best = i
    }
  }
  return [words.slice(0, best).join(' '), words.slice(best).join(' ')]
}

