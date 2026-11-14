/**
 * @fileoverview Forke Platform
 * @copyright (c) 2026 Forke Inc. (https://www.forke.space/)
 *
 * Source-Available License (Non-Commercial / Fair Source).
 * This source code is open for inspection, learning, and personal development.
 * Commercial use, hosting, or resale as a paid service without an explicit
 * commercial license from Forke Inc. is strictly prohibited.
 */

import { redirect } from 'next/navigation'

export default async function UsernameRedirectPage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  const marketingUrl = process.env.NEXT_PUBLIC_MARKETING_URL || 'https://www.forke.space'
  redirect(`${marketingUrl}/${username}`)
}
