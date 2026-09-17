/**
 * @fileoverview Forke Platform
 * @copyright (c) 2026 Forke Inc. (https://www.forke.space/)
 *
 * Source-Available License (Non-Commercial / Fair Source).
 * This source code is open for inspection, learning, and personal development.
 * Commercial use, hosting, or resale as a paid service without an explicit
 * commercial license from Forke Inc. is strictly prohibited.
 */

import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  return handleLogout(request)
}

export async function POST(request: Request) {
  return handleLogout(request)
}

function handleLogout(request: Request) {
  const isProd = process.env.NODE_ENV === 'production'
  const defaultMarketingUrl = isProd ? 'https://www.forke.space' : 'http://localhost:3000'
  
  const url = new URL(request.url)
  const callbackUrl = url.searchParams.get('callbackUrl')
  
  let redirectTarget = defaultMarketingUrl
  if (callbackUrl) {
    try {
      if (callbackUrl.startsWith('/')) {
        redirectTarget = new URL(callbackUrl, defaultMarketingUrl).toString()
      } else {
        const parsed = new URL(callbackUrl)
        if (parsed.hostname.endsWith('forke.space') || parsed.hostname === 'localhost') {
          redirectTarget = callbackUrl
        }
      }
    } catch {
      redirectTarget = defaultMarketingUrl
    }
  }

  const response = NextResponse.redirect(new URL(redirectTarget))

  const cookieNames = [
    '__Secure-authjs.session-token',
    'authjs.session-token',
    '__Secure-next-auth.session-token',
    'next-auth.session-token',
    '__Secure-authjs.callback-url',
    'authjs.callback-url',
    '__Host-authjs.csrf-token',
    'authjs.csrf-token',
    'forke_role',
    'forke_login_intent',
    'forke_access_token',
    'forke_username',
  ]

  const domains: (string | undefined)[] = isProd ? ['.forke.space', undefined] : [undefined]

  for (const name of cookieNames) {
    for (const domain of domains) {
      if (name.startsWith('__Host-') && domain) continue

      let cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0; SameSite=Lax`
      if (domain) cookie += `; Domain=${domain}`
      if (isProd) cookie += '; Secure'
      if (name.includes('session-token')) cookie += '; HttpOnly'

      response.headers.append('Set-Cookie', cookie)
    }
  }

  return response
}
