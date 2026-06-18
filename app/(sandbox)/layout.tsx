import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sandbox Workspace | Forke',
  description: 'Repository review and task workspace for Forke owners and developers.',
  robots: { index: false, follow: false },
}

export default async function SandboxLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('forke_access_token')?.value

  if (!accessToken) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-[#070709] text-white">
      {children}
    </div>
  )
}
