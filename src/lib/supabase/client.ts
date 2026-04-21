import { createBrowserClient } from '@supabase/ssr'

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
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            document.cookie = `${name}=${value}; path=/; ${options?.expires ? `expires=${new Date(options.expires * 1000).toUTCString()}; ` : 'Max-Age=31536000; '}${options?.secure ? 'secure; ' : ''}${options?.sameSite ? `samesite=${options.sameSite}` : ''}`
          })
        },
      },
    }
  )
}
