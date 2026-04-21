import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { parseUserAgent, parseReferrer } from '@/lib/utils'

interface Props {
  params: { slug: string }
}

// This page handles ALL redirects: ls.clipotapp.com/abc123 → original URL
// It runs server-side so we can capture the click before redirecting
export default async function SlugPage({ params }: Props) {
  const { slug } = params

  // Skip internal Next.js paths
  if (['dashboard', 'login', 'api', '_next', 'favicon.ico'].includes(slug)) {
    notFound()
  }

  const supabase = createClient()

  // Look up the slug
  const { data: link, error } = await supabase
    .from('links')
    .select('id, original_url, active')
    .eq('slug', slug)
    .single()

  if (error || !link) notFound()
  if (!link.active) {
    // Inactive link — show a message instead of 404
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl mb-4">🔒</p>
          <h1 className="font-display font-bold text-xl mb-2">Enlace inactivo</h1>
          <p className="text-white/40 font-mono text-sm">Este enlace ha sido desactivado por su creador.</p>
        </div>
      </div>
    )
  }

  // Capture click metadata from request headers
  const headersList = headers()
  const userAgent = headersList.get('user-agent') || ''
  const referrerHeader = headersList.get('referer') || null
  const cfIp = headersList.get('cf-connecting-ip')           // Cloudflare
  const xForwardedFor = headersList.get('x-forwarded-for')  // Vercel/proxies
  const ip = cfIp || xForwardedFor?.split(',')[0]?.trim() || 'unknown'

  const { browser, device, os } = parseUserAgent(userAgent)
  const { referrer, source } = parseReferrer(referrerHeader)

  // Insert click record (fire-and-forget, don't block the redirect)
  // We use the anon client here — the RLS policy allows anon inserts on clicks
  supabase.from('clicks').insert({
    link_id: link.id,
    referrer,
    browser,
    device,
    os,
    source,
    action: 'click',
    ip,
  }).then(() => {}) // intentionally not awaited — redirect is priority

  // 307 Temporary Redirect (preserves method, doesn't get cached permanently)
  redirect(link.original_url)
}
