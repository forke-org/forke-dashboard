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
