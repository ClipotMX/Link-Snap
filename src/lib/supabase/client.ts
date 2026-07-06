import { createBrowserClient, type CookieOptions } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          if (typeof document === 'undefined') return []
          return document.cookie.split(';').map(c => {
            const [name, ...v] = c.trim().split('=')
            return { name, value: v.join('=') }
          })
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            const expires = options?.expires ? new Date(Number(options.expires) * 1000).toUTCString() : undefined
            document.cookie = `${name}=${value}; path=/; ${expires ? `expires=${expires}; ` : 'Max-Age=31536000; '}${options?.secure ? 'secure; ' : ''}${options?.sameSite ? `samesite=${options.sameSite}` : ''}`
          })
        },
      },
    }
  )
}
