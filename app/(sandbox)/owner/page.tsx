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
  title: 'Owner Workspace | Forke',
  description: 'Import your repository, configure tasks, and review developer pull requests.',
  robots: { index: false, follow: false },
}

export default function OwnerPage() {
  return (
    <Suspense>
      <SandboxWorkspace presetRole="owner" />
    </Suspense>
  )
}
