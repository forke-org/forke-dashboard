import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PROTECTED_ROUTES = [
  '/dashboard',
  '/tasks',
  '/messages',
  '/settings',
  '/profile',
  '/developers',
  '/earnings',
  '/submissions',
  '/escrow',
  '/post-task',
  '/onboarding',
  '/analytics',
  '/support',
  '/ide',
  '/developer',
  '/owner',
]

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname

  // Skip static files & Next.js internals
  if (
    pathname.includes('.') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/uploads') ||
    pathname.endsWith('/opengraph-image')
  ) {
    return NextResponse.next()
  }

  const marketingUrl = process.env.NEXT_PUBLIC_MARKETING_URL || 'https://www.forke.space'

  // If hitting username profile directly on dashboard subdomain -> redirect to www.forke.space/[username]
  const isUsernameRoute = !PROTECTED_ROUTES.some(p => pathname.startsWith(p)) && 
                          pathname !== '/' && 
                          pathname !== '/checkout' && 
                          pathname !== '/signin' && 
                          pathname !== '/register' && 
                          pathname !== '/auth-error'
  
  if (isUsernameRoute) {
    return NextResponse.redirect(new URL(pathname, marketingUrl))
  }

  // Check auth session cookie
  const sessionToken = req.cookies.get('authjs.session-token')?.value || 
                       req.cookies.get('__Secure-authjs.session-token')?.value ||
                       req.cookies.get('next-auth.session-token')?.value ||
                       req.cookies.get('__Secure-next-auth.session-token')?.value

  const isAuthenticated = !!sessionToken
  const isProtectedRoute = PROTECTED_ROUTES.some(p => pathname.startsWith(p)) || pathname === '/'

  if (isProtectedRoute && !isAuthenticated) {
    const siteAccess = req.cookies.get('site_access')?.value || req.cookies.get('site_access_public')?.value === 'true'
    const waitlistActive = req.cookies.get('waitlist_active')?.value === 'true'

    if (waitlistActive && !siteAccess) {
      return NextResponse.redirect(new URL('/waitlist', marketingUrl))
    }
    return NextResponse.redirect(new URL('/signin', marketingUrl))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
