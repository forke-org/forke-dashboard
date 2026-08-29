/**
 * @fileoverview Forke Platform
 * @copyright (c) 2026 Forke Inc. (https://www.forke.space/)
 *
 * Source-Available License (Non-Commercial / Fair Source).
 * This source code is open for inspection, learning, and personal development.
 * Commercial use, hosting, or resale as a paid service without an explicit
 * commercial license from Forke Inc. is strictly prohibited.
 */

import { Suspense } from 'react'
import SandboxWorkspace from '@/components/sandbox/SandboxWorkspace'

export const metadata = {
  title: 'Developer Workspace | Forke',
  description: 'Browse sandbox repositories, fork tasks, and submit pull requests for review.',
  robots: { index: false, follow: false },
}

export default function DeveloperPage() {
  return (
    <Suspense>
      <SandboxWorkspace presetRole="developer" />
    </Suspense>
  )
}
