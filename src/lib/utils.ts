import { customAlphabet } from 'nanoid'

const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 6)

export function generateSlug(): string {
  return nanoid()
}

export function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
}

export function getShortUrl(slug: string): string {
  return `${getBaseUrl()}/${slug}`
}

export function parseUserAgent(ua: string): { browser: string; device: string; os: string } {
  const browser =
    ua.includes('Edg') ? 'Edge' :
    ua.includes('Chrome') ? 'Chrome' :
    ua.includes('Firefox') ? 'Firefox' :
    ua.includes('Safari') ? 'Safari' :
    ua.includes('Opera') ? 'Opera' : 'Otro'

  const device =
    /iPad/.test(ua) ? 'Tablet' :
    /Mobile|Android|iPhone/.test(ua) ? 'Mobile' : 'Desktop'

  const os =
    ua.includes('Windows') ? 'Windows' :
    ua.includes('Mac OS') ? 'macOS' :
    ua.includes('iPhone') || ua.includes('iPad') ? 'iOS' :
    ua.includes('Android') ? 'Android' :
    ua.includes('Linux') ? 'Linux' : 'Otro'

  return { browser, device, os }
}

export function parseReferrer(referrerHeader: string | null): { referrer: string; source: string } {
  if (!referrerHeader) return { referrer: 'direct', source: 'direct' }

  try {
    const url = new URL(referrerHeader)
    const domain = url.hostname.replace('www.', '')

    const socialDomains: Record<string, string> = {
      'twitter.com': 'social', 't.co': 'social',
      'instagram.com': 'social', 'facebook.com': 'social',
      'linkedin.com': 'social', 'tiktok.com': 'social',
      'youtube.com': 'social', 'reddit.com': 'social',
      'pinterest.com': 'social', 'snapchat.com': 'social',
      'threads.net': 'social', 'x.com': 'social',
    }

    const emailDomains = ['mail.google.com', 'outlook.com', 'yahoo.com', 'mail.yahoo.com']

    if (socialDomains[domain]) return { referrer: domain, source: 'social' }
    if (emailDomains.includes(domain)) return { referrer: domain, source: 'email' }

    return { referrer: domain, source: 'referral' }
  } catch {
    return { referrer: 'direct', source: 'direct' }
  }
}

export function relativeTime(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return 'hace unos segundos'
  if (diff < 3600) return `hace ${Math.floor(diff / 60)}m`
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`
  if (diff < 604800) return `hace ${Math.floor(diff / 86400)}d`
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function clsx(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}
