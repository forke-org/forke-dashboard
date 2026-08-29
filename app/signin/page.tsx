/**
 * @fileoverview Forke Platform
 * @copyright (c) 2026 Forke Inc. (https://www.forke.space/)
 *
 * Source-Available License (Non-Commercial / Fair Source).
 * This source code is open for inspection, learning, and personal development.
 * Commercial use, hosting, or resale as a paid service without an explicit
 * commercial license from Forke Inc. is strictly prohibited.
 */

import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import SignInContent from '@/components/auth/SignInContent'
import { isWaitlistEnabled } from '@/lib/db/settings'
import { buildOpenGraph, buildTwitter } from '@/lib/utils/og'

// While the waitlist lock is on, sign-in is closed — this route 404s. EXCEPT for
// visitors who unlocked the site via /checkout (site_access cookie), so the bypass
// password actually grants access to sign in. Once the lock is lifted, it's open to all.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Log in to your Forke account to access bounties, track your level, and manage your developer earnings.',
  alternates: { canonical: '/signin' },
  openGraph: buildOpenGraph({
    title: 'Sign In | Forke',
    description: 'Access the developer marketplace and continue your journey.',
    url: 'https://www.forke.space/signin',
  }),
  twitter: buildTwitter({
    title: 'Sign In | Forke',
    description: 'Access the developer marketplace and continue your journey.',
  }),
}

export default async function SignInPage() {
  const hasSiteAccess = (await cookies()).get('site_access')?.value === 'granted'
  if (await isWaitlistEnabled() && !hasSiteAccess) {
    notFound()
  }
  return <SignInContent />
}
