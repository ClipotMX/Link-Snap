'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LinkStats, Click } from '@/types'
import { getShortUrl, relativeTime } from '@/lib/utils'
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, PieChart, Pie, Cell, CartesianGrid
} from 'recharts'

interface Props {
  link: LinkStats
  clicksByDay: { date: string; clicks: number }[]
  clicksByWeek: { date: string; clicks: number }[]
  clicksByMonth: { date: string; clicks: number }[]
  referrers: { name: string; value: number }[]
  browsers: { name: string; value: number }[]
  devices: { name: string; value: number }[]
  sources: { name: string; value: number }[]
  recentClicks: Click[]
  uniqueIps: string[]
}

const COLORS = ['#7c5cfc', '#a78bfa', '#22c55e', '#f59e0b', '#3b82f6', '#ec4899', '#14b8a6', '#f97316']

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface border border-white/10 rounded-lg px-3 py-2 text-xs font-mono">
      <p className="text-white/50 mb-1">{label}</p>
      <p className="text-accent2 font-bold">{payload[0]?.value} clicks</p>
    </div>
  )
}

type Period = 'day' | 'week' | 'month'

export default function StatsClient({
  link, clicksByDay, clicksByWeek, clicksByMonth,
  referrers, browsers, devices, sources, recentClicks, uniqueIps
}: Props) {
  const [period, setPeriod] = useState<Period>('day')
  const [copied, setCopied] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editSlug, setEditSlug] = useState(link.slug)
  const [editUrl, setEditUrl] = useState(link.original_url)
  const [editTitle, setEditTitle] = useState(link.title || '')
  const supabase = createClient()
  const router = useRouter()

  const chartData = period === 'day' ? clicksByDay : period === 'week' ? clicksByWeek : clicksByMonth
  const totalInPeriod = chartData.reduce((s, d) => s + d.clicks, 0)

  async function copyLink() {
    await navigator.clipboard.writeText(getShortUrl(link.slug))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function saveEdit() {
    const slug = editSlug.trim().replace(/[^a-zA-Z0-9\-_]/g, '')
    const url = editUrl.trim()
    if (!slug || !url.startsWith('http')) return

    await supabase.from('links').update({
      slug, original_url: url, title: editTitle.trim() || null
    }).eq('id', link.id)

    setEditing(false)
    router.refresh()
  }

  async function deleteLink() {
    if (!confirm('¿Eliminar este enlace y todas sus estadísticas permanentemente?')) return
    await supabase.from('links').delete().eq('id', link.id)
    router.push('/dashboard')
  }

  async function toggleActive() {
    await supabase.from('links').update({ active: !link.active }).eq('id', link.id)
    router.refresh()
  }

  const statCards = [
    { label: 'Total clicks', value: link.total_clicks ?? 0, color: 'text-accent2' },
    { label: 'Hoy', value: link.clicks_today ?? 0, color: 'text-green-400' },
    { label: 'Esta semana', value: link.clicks_week ?? 0, color: 'text-amber-400' },
    { label: 'Este mes', value: link.clicks_month ?? 0, color: 'text-blue-400' },
  ]

  return (
    <div className="min-h-screen">
      {/* NAV */}
      <nav className="flex items-center justify-between px-8 py-4 border-b border-white/5 sticky top-0 bg-bg/90 backdrop-blur z-10">
        <Link href="/dashboard" className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm font-mono">
          ← Dashboard
        </Link>
        <div className="font-display font-extrabold text-lg tracking-tight">
          Link<span className="text-accent2">Snap</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={copyLink} className="btn-secondary text-xs px-3 py-1.5">
            {copied ? '✓ Copiado' : 'Copiar enlace'}
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 md:px-8 py-8 space-y-6">

        {/* LINK HEADER */}
        <div className="card flex flex-col md:flex-row md:items-center justify-between gap-4">
          {!editing ? (
            <>
              <div className="space-y-1">
                {link.title && <p className="text-xs text-white/40 font-mono">{link.title}</p>}
                <p className="font-mono text-accent2 text-lg font-bold">{getShortUrl(link.slug)}</p>
                <p className="text-xs text-white/30 font-mono truncate max-w-lg">{link.original_url}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={toggleActive}>
                  <span className={`tag cursor-pointer ${link.active ? 'tag-active' : 'tag-inactive'}`}>
                    {link.active ? 'activo' : 'inactivo'}
                  </span>
                </button>
                <button onClick={() => setEditing(true)} className="btn-secondary text-xs px-3 py-1.5">Editar</button>
                <button onClick={deleteLink} className="btn-danger text-xs px-3 py-1.5">Eliminar</button>
              </div>
            </>
          ) : (
            <div className="w-full space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input value={editSlug} onChange={e => setEditSlug(e.target.value)} placeholder="slug" className="input-base font-mono text-accent2" />
                <input value={editUrl} onChange={e => setEditUrl(e.target.value)} placeholder="URL destino" className="input-base col-span-1 md:col-span-1" />
                <input value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="Título / etiqueta" className="input-base" />
              </div>
              <div className="flex gap-2">
                <button onClick={saveEdit} className="btn-primary text-xs px-4 py-2">Guardar</button>
                <button onClick={() => setEditing(false)} className="btn-secondary text-xs px-4 py-2">Cancelar</button>
              </div>
            </div>
          )}
        </div>

        {/* STAT CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {statCards.map(s => (
            <div key={s.label} className="stat-card">
              <p className="text-xs text-white/40 uppercase tracking-wider font-mono mb-2">{s.label}</p>
              <p className={`text-3xl font-extrabold font-mono tracking-tight ${s.color}`}>{s.value.toLocaleString()}</p>
            </div>
          ))}
        </div>

        {/* CLICK TREND CHART */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm">Tendencia de clicks</h3>
              <p className="text-xs text-white/30 font-mono mt-0.5">
                {totalInPeriod} clicks en el período seleccionado
              </p>
            </div>
            <div className="flex bg-surface2 rounded-lg p-0.5 gap-0.5">
              {(['day', 'week', 'month'] as Period[]).map(p => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold transition-all ${
                    period === p ? 'bg-accent text-white' : 'text-white/40 hover:text-white'
                  }`}
                >
                  {p === 'day' ? 'Diario' : p === 'week' ? 'Semanal' : 'Mensual'}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-dm-mono)' }}
                tickLine={false} axisLine={false}
                interval={period === 'day' ? 4 : 0}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-dm-mono)' }}
                tickLine={false} axisLine={false} allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone" dataKey="clicks" stroke="#7c5cfc"
                strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#a78bfa', stroke: 'none' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* BOTTOM CHARTS ROW */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* REFERRERS BAR */}
          <div className="card space-y-4">
            <h3 className="font-bold text-sm">Fuentes de tráfico</h3>
            {referrers.length === 0 ? (
              <p className="text-white/30 text-xs font-mono py-8 text-center">sin datos aún</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={referrers} layout="vertical" margin={{ top: 0, right: 4, bottom: 0, left: 10 }}>
                  <XAxis type="number" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-dm-mono)' }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-dm-mono)' }} tickLine={false} axisLine={false} width={90} />
                  <Tooltip content={({ active, payload }) => active && payload?.length ? (
                    <div className="bg-surface border border-white/10 rounded-lg px-3 py-2 text-xs font-mono">
                      <p className="text-accent2 font-bold">{payload[0]?.value} clicks</p>
                    </div>
                  ) : null} />
                  <Bar dataKey="value" fill="#7c5cfc" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* DEVICES PIE */}
          <div className="card space-y-4">
            <h3 className="font-bold text-sm">Dispositivos y navegadores</h3>
            {devices.length === 0 ? (
              <p className="text-white/30 text-xs font-mono py-8 text-center">sin datos aún</p>
            ) : (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width="50%" height={180}>
                  <PieChart>
                    <Pie data={devices} cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                      dataKey="value" paddingAngle={3} stroke="none">
                      {devices.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={({ active, payload }) => active && payload?.length ? (
                      <div className="bg-surface border border-white/10 rounded-lg px-3 py-2 text-xs font-mono">
                        <p className="text-white/60">{payload[0]?.name}</p>
                        <p className="text-accent2 font-bold">{payload[0]?.value}</p>
                      </div>
                    ) : null} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-3 flex-1">
                  <div className="space-y-1.5">
                    <p className="text-xs text-white/30 uppercase font-mono tracking-wider">Dispositivos</p>
                    {devices.map((d, i) => (
                      <div key={d.name} className="flex items-center gap-2 text-xs font-mono">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                        <span className="text-white/60 flex-1">{d.name}</span>
                        <span className="text-white font-bold">{d.value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-xs text-white/30 uppercase font-mono tracking-wider">Navegadores</p>
                    {browsers.slice(0, 4).map((b, i) => (
                      <div key={b.name} className="flex items-center gap-2 text-xs font-mono">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: COLORS[(i + 4) % COLORS.length] }} />
                        <span className="text-white/60 flex-1">{b.name}</span>
                        <span className="text-white font-bold">{b.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SOURCES */}
          <div className="card space-y-4">
            <h3 className="font-bold text-sm">Canales de origen</h3>
            {sources.length === 0 ? (
              <p className="text-white/30 text-xs font-mono py-8 text-center">sin datos aún</p>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={sources} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-dm-mono)' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-dm-mono)' }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {sources.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* UNIQUE IPs */}
          <div className="card space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm">IPs únicas registradas</h3>
              <span className="tag bg-accent/10 text-accent2 border border-accent/20">{uniqueIps.length}</span>
            </div>
            {uniqueIps.length === 0 ? (
              <p className="text-white/30 text-xs font-mono py-8 text-center">sin IPs registradas</p>
            ) : (
              <div className="space-y-1.5 max-h-[160px] overflow-y-auto">
                {uniqueIps.map(ip => (
                  <div key={ip} className="flex items-center justify-between bg-surface2 rounded-lg px-3 py-2">
                    <span className="font-mono text-xs text-white/70">{ip}</span>
                    <span className="text-xs text-white/30 font-mono">
                      {recentClicks.filter(c => c.ip === ip).length} clicks
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RECENT CLICKS LOG */}
        <div className="card space-y-4">
          <h3 className="font-bold text-sm">Log de clicks recientes</h3>
          {recentClicks.length === 0 ? (
            <p className="text-white/30 text-xs font-mono py-8 text-center">sin clicks registrados aún — comparte el enlace</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    {['Fuente', 'Navegador', 'Dispositivo', 'OS', 'Canal', 'IP', 'Acción', 'Cuándo'].map(h => (
                      <th key={h} className="text-left pb-3 text-xs font-mono text-white/30 uppercase tracking-wider font-normal pr-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentClicks.map(c => (
                    <tr key={c.id} className="border-b border-white/5 last:border-b-0">
                      <td className="py-3 pr-4 text-xs font-mono text-accent2">{c.referrer || 'direct'}</td>
                      <td className="py-3 pr-4 text-xs font-mono text-white/60">{c.browser || '—'}</td>
                      <td className="py-3 pr-4 text-xs font-mono text-white/60">{c.device || '—'}</td>
                      <td className="py-3 pr-4 text-xs font-mono text-white/60">{c.os || '—'}</td>
                      <td className="py-3 pr-4 text-xs font-mono">
                        <span className="tag bg-surface2 border-white/10 text-white/50">{c.source || 'direct'}</span>
                      </td>
                      <td className="py-3 pr-4 text-xs font-mono text-white/40">{c.ip || '—'}</td>
                      <td className="py-3 pr-4 text-xs font-mono">
                        <span className={`tag ${c.action === 'copy' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20'}`}>
                          {c.action || 'click'}
                        </span>
                      </td>
                      <td className="py-3 text-xs font-mono text-white/30">{relativeTime(c.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
