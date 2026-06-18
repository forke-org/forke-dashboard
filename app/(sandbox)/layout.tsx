import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sandbox Workspace | Forke',
  description: 'Repository review and task workspace for Forke owners and developers.',
  robots: { index: false, follow: false },
}

export default function SandboxLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#070709] text-white">
      {children}
    </div>
  )
}

