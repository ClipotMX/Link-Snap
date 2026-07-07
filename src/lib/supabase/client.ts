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
            const parts = [`${name}=${value}`, 'path=/']
            if (options?.maxAge) parts.push(`max-age=${options.maxAge}`)
            if (options?.expires) parts.push(`expires=${new Date(options.expires).toUTCString()}`)
            if (options?.domain) parts.push(`domain=${options.domain}`)
            if (options?.secure) parts.push('secure')
            if (options?.sameSite) parts.push(`samesite=${options.sameSite}`)
            if (options?.priority) parts.push(`priority=${options.priority}`)
            document.cookie = parts.join('; ')
          })
        },
      },
    }
  )
}
