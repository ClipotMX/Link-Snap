import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value, options }) => {
            const { encode, partitioned, ...safeOpts } = options || {}
            request.cookies.set(name, value)
            supabaseResponse.cookies.set(name, value, { ...safeOpts, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' })
          })
          if (headers) {
            Object.entries(headers).forEach(([key, val]) => supabaseResponse.headers.set(key, val))
          }
        },
      },
    }
  )

  let user: any = null
  try {
    const result = await supabase.auth.getUser()
    user = result?.data?.user ?? null
  } catch {
    user = null
  }

  const isDashboard = request.nextUrl.pathname.startsWith('/dashboard')
  const isLogin = request.nextUrl.pathname === '/login'

  if (!user && isDashboard) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && isLogin) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
