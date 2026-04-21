import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import StatsClient from './StatsClient'
import { format, subDays, eachDayOfInterval, startOfDay } from 'date-fns'
import { es } from 'date-fns/locale'

export default async function StatsPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: link } = await supabase
    .from('link_stats')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!link) notFound()

  // All clicks for this link
  const { data: clicks } = await supabase
    .from('clicks')
    .select('*')
    .eq('link_id', params.id)
    .order('created_at', { ascending: true })

  const allClicks = clicks ?? []

  // Daily clicks — last 30 days
  const today = new Date()
  const thirtyDaysAgo = subDays(today, 29)
  const days = eachDayOfInterval({ start: thirtyDaysAgo, end: today })

  const clicksByDay = days.map(day => {
    const dayStr = format(day, 'yyyy-MM-dd')
    const count = allClicks.filter(c => c.created_at.startsWith(dayStr)).length
    return {
      date: format(day, 'dd MMM', { locale: es }),
      clicks: count,
    }
  })

  // Weekly clicks — last 12 weeks
  const clicksByWeek = Array.from({ length: 12 }, (_, i) => {
    const weekStart = subDays(today, (11 - i) * 7 + 6)
    const weekEnd = subDays(today, (11 - i) * 7)
    const count = allClicks.filter(c => {
      const d = new Date(c.created_at)
      return d >= startOfDay(weekStart) && d <= weekEnd
    }).length
    return {
      date: format(weekEnd, 'dd MMM', { locale: es }),
      clicks: count,
    }
  })

  // Monthly clicks — last 12 months
  const clicksByMonth = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth() - (11 - i), 1)
    const monthStr = format(d, 'yyyy-MM')
    const count = allClicks.filter(c => c.created_at.startsWith(monthStr)).length
    return {
      date: format(d, 'MMM yy', { locale: es }),
      clicks: count,
    }
  })

  // Referrers
  const refCounts: Record<string, number> = {}
  allClicks.forEach(c => {
    const ref = c.referrer || 'direct'
    refCounts[ref] = (refCounts[ref] || 0) + 1
  })
  const referrers = Object.entries(refCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)

  // Browsers
  const browserCounts: Record<string, number> = {}
  allClicks.forEach(c => { const b = c.browser || 'Otro'; browserCounts[b] = (browserCounts[b] || 0) + 1 })
  const browsers = Object.entries(browserCounts).map(([name, value]) => ({ name, value }))

  // Devices
  const deviceCounts: Record<string, number> = {}
  allClicks.forEach(c => { const d = c.device || 'Otro'; deviceCounts[d] = (deviceCounts[d] || 0) + 1 })
  const devices = Object.entries(deviceCounts).map(([name, value]) => ({ name, value }))

  // Sources
  const sourceCounts: Record<string, number> = {}
  allClicks.forEach(c => { const s = c.source || 'direct'; sourceCounts[s] = (sourceCounts[s] || 0) + 1 })
  const sources = Object.entries(sourceCounts).map(([name, value]) => ({ name, value }))

  // Recent clicks log
  const recentClicks = [...allClicks].reverse().slice(0, 20)

  // Unique IPs
  const uniqueIps = [...new Set(allClicks.map(c => c.ip).filter(Boolean))]

  return (
    <StatsClient
      link={link}
      clicksByDay={clicksByDay}
      clicksByWeek={clicksByWeek}
      clicksByMonth={clicksByMonth}
      referrers={referrers}
      browsers={browsers}
      devices={devices}
      sources={sources}
      recentClicks={recentClicks}
      uniqueIps={uniqueIps}
    />
  )
}
