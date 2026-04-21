import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: links } = await supabase
    .from('link_stats')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // Global totals across all links
  const totals = {
    total_clicks: links?.reduce((s, l) => s + (l.total_clicks || 0), 0) ?? 0,
    clicks_today: links?.reduce((s, l) => s + (l.clicks_today || 0), 0) ?? 0,
    clicks_week: links?.reduce((s, l) => s + (l.clicks_week || 0), 0) ?? 0,
    clicks_month: links?.reduce((s, l) => s + (l.clicks_month || 0), 0) ?? 0,
    total_links: links?.length ?? 0,
  }

  return <DashboardClient links={links ?? []} totals={totals} userEmail={user.email ?? ''} />
}
