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
import RegisterContent from '@/components/auth/RegisterContent'
import { isWaitlistEnabled } from '@/lib/db/settings'
import { buildOpenGraph, buildTwitter } from '@/lib/utils/og'

// While the waitlist lock is on, sign-up is closed — this route 404s. EXCEPT for
// visitors who unlocked the site via /checkout (site_access cookie), so the bypass
// password actually grants access to register. Once the lock is lifted, it's open to all.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Join the Movement',
  description: 'Create your Forke account today. Start your journey as a builder, ship real work, and earn rewards in the developer marketplace.',
  alternates: { canonical: '/register' },
  openGraph: buildOpenGraph({
    title: 'Join the Movement | Forke',
    description: 'Start your journey as a builder and get paid for your work.',
    url: 'https://www.forke.space/register',
  }),
  twitter: buildTwitter({
    title: 'Join the Movement | Forke',
    description: 'Start your journey as a builder and get paid for your work.',
  }),
}

export default async function RegisterPage() {
  const hasSiteAccess = (await cookies()).get('site_access')?.value === 'granted'
  if (await isWaitlistEnabled() && !hasSiteAccess) {
    notFound()
  }
  return <RegisterContent />
}
