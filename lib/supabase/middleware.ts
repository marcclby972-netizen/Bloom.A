import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Public pages: landing at /, login, legal, onboarding, pricing, cookies
  const pathname = request.nextUrl.pathname
  const isLandingPage = pathname === '/'
  const isLoginPage = pathname === '/login'
  const isOnboardPage = pathname === '/onboard'
  const isAuthCallback = pathname.startsWith('/auth/')
  const isLegalPage =
    pathname === '/privacy' || pathname === '/terms' || pathname === '/cookies' || pathname === '/pricing'
  const isPublicAsset =
    pathname.startsWith('/_next') ||
    pathname.startsWith('/assets') ||
    pathname.startsWith('/api/auth') ||
    pathname === '/favicon.ico' ||
    pathname === '/bloom-logo.png' ||
    isLegalPage

  const isBloomDash = pathname === '/bloom-dash'
  const isPublicPage = isLandingPage || isLoginPage || isOnboardPage || isBloomDash

  if (isPublicAsset || isAuthCallback) {
    return supabaseResponse
  }

  // Not logged in -> let public pages render, redirect everything else to landing
  if (!user) {
    if (isPublicPage) return supabaseResponse
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // Logged in and on landing/login -> redirect to dashboard
  if (isLandingPage || isLoginPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
