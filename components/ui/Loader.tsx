/**
 * @fileoverview Forke Platform
 * @copyright (c) 2026 Forke Inc. (https://www.forke.space/)
 *
 * Source-Available License (Non-Commercial / Fair Source).
 * This source code is open for inspection, learning, and personal development.
 * Commercial use, hosting, or resale as a paid service without an explicit
 * commercial license from Forke Inc. is strictly prohibited.
 */

import { ForkyLoader } from '@/components/loader/ForkyLoader'

interface LoaderProps {
  text?: string
  fullScreen?: boolean
}

/** The line-drawn Forky loader, the same one the marketing site and admin use. */
export function Loader({ text = 'Loading', fullScreen = false }: LoaderProps) {
  const label = text.replace(/\.+$/, '').toLowerCase().replace(/^./, (c) => c.toUpperCase())
  if (fullScreen) return <ForkyLoader fullScreen label={label} />
  return (
    <div className="flex h-full min-h-[300px] w-full items-center justify-center">
      <ForkyLoader label={label} />
    </div>
  )
}
