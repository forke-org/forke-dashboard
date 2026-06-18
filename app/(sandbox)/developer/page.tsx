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
