/**
 * @fileoverview Forke Platform
 * @copyright (c) 2026 Forke Inc. (https://www.forke.space/)
 *
 * Source-Available License (Non-Commercial / Fair Source).
 * This source code is open for inspection, learning, and personal development.
 * Commercial use, hosting, or resale as a paid service without an explicit
 * commercial license from Forke Inc. is strictly prohibited.
 */

// Contribution graph in Forke ember tones, built from real daily activity.
export const EMBER_SCALE = ['rgba(240,227,222,0.06)', '#4a2306', '#8a4004', '#d06000', '#FF8A1F']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function level(count: number, max: number) {
  if (count <= 0) return 0
  const r = count / max
  return r > 0.75 ? 4 : r > 0.45 ? 3 : r > 0.2 ? 2 : 1
}

export default function Heatmap({ days, cell = 11, gap = 3 }: { days: { date: string; count: number }[]; cell?: number; gap?: number }) {
  const max = Math.max(1, ...days.map((d) => d.count))
  // pad the start so each column is one Sunday→Saturday week
  const firstDow = days.length ? new Date(`${days[0].date}T00:00:00`).getDay() : 0
  const cells: ({ date: string; count: number } | null)[] = [...Array(firstDow).fill(null), ...days]
  const weeks = Math.ceil(cells.length / 7)
  const step = cell + gap
  const left = 26
  const top = 16
  const w = weeks * step - gap
  const h = 7 * step - gap

  // month label at the first week that starts a new month
  const labels: { x: number; m: string }[] = []
  let last = -1
  for (let wi = 0; wi < weeks; wi++) {
    const d = cells[wi * 7] ?? cells[wi * 7 + 6]
    if (!d) continue
    const m = new Date(`${d.date}T00:00:00`).getMonth()
    if (m !== last) {
      if (wi < weeks - 2) labels.push({ x: left + wi * step, m: MONTHS[m] })
      last = m
    }
  }

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${w + left} ${h + top}`} className="block h-auto w-full" role="img" aria-label="Contribution activity">
        {labels.map((l) => (
          <text key={`${l.m}-${l.x}`} x={l.x} y={10} fill="rgba(255,255,255,0.35)" fontSize={9} fontFamily="var(--font-geist-mono), monospace">
            {l.m}
          </text>
        ))}
        {['Mon', 'Wed', 'Fri'].map((d, i) => (
          <text key={d} x={0} y={top + (1 + i * 2) * step + cell - 2} fill="rgba(255,255,255,0.3)" fontSize={9} fontFamily="var(--font-geist-mono), monospace">
            {d}
          </text>
        ))}
        {cells.map((d, i) =>
          d ? (
            <rect key={d.date} x={left + Math.floor(i / 7) * step} y={top + (i % 7) * step} width={cell} height={cell} rx={2.5} fill={EMBER_SCALE[level(d.count, max)]}>
              <title>{d.count ? `${d.date}: active` : d.date}</title>
            </rect>
          ) : null,
        )}
      </svg>
      <div className="mt-3 flex items-center justify-end gap-1.5 font-mono text-[11px] text-white/35">
        Less
        {EMBER_SCALE.map((c) => (
          <span key={c} className="h-[10px] w-[10px] rounded-[2px]" style={{ background: c }} />
        ))}
        More
      </div>
    </div>
  )
}
