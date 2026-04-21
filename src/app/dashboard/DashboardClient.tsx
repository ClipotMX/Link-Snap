'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LinkStats } from '@/types'
import { getShortUrl, relativeTime } from '@/lib/utils'

interface Props {
  links: LinkStats[]
  totals: { total_clicks: number; clicks_today: number; clicks_week: number; clicks_month: number; total_links: number }
  userEmail: string
}

export default function DashboardClient({ links: initialLinks, totals, userEmail }: Props) {
  const [links, setLinks] = useState(initialLinks)
  const [search, setSearch] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const filtered = links.filter(l =>
    l.slug.toLowerCase().includes(search.toLowerCase()) ||
    l.original_url.toLowerCase().includes(search.toLowerCase()) ||
    (l.title || '').toLowerCase().includes(search.toLowerCase())
  )

  async function copyLink(link: LinkStats) {
    await navigator.clipboard.writeText(getShortUrl(link.slug))
    setCopiedId(link.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  async function toggleActive(link: LinkStats) {
    await supabase.from('links').update({ active: !link.active }).eq('id', link.id)
    setLinks(prev => prev.map(l => l.id === link.id ? { ...l, active: !l.active } : l))
  }

  async function deleteLink(id: string) {
    if (!confirm('¿Eliminar este enlace y todas sus estadísticas?')) return
    await supabase.from('links').delete().eq('id', id)
    setLinks(prev => prev.filter(l => l.id !== id))
  }

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const statItems = [
    { label: 'Total clicks', value: totals.total_clicks, color: 'text-accent2' },
    { label: 'Hoy', value: totals.clicks_today, color: 'text-green-400' },
    { label: 'Esta semana', value: totals.clicks_week, color: 'text-amber-400' },
    { label: 'Este mes', value: totals.clicks_month, color: 'text-blue-400' },
    { label: 'Total enlaces', value: totals.total_links, color: 'text-white' },
  ]

  return (
    <div className="min-h-screen">
      {/* NAV */}
      <nav className="flex items-center justify-between px-8 py-4 border-b border-white/5 sticky top-0 bg-bg/90 backdrop-blur z-10">
        <Link href="/" className="font-display font-extrabold text-xl tracking-tight">
          Link<span className="text-accent2">Snap</span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-xs text-white/30 font-mono hidden md:block">{userEmail}</span>
          <button onClick={signOut} className="text-xs text-white/40 hover:text-white transition-colors font-mono">
            Cerrar sesión
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 md:px-8 py-8 space-y-8">
        {/* GLOBAL STATS */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {statItems.map(s => (
            <div key={s.label} className="stat-card">
              <p className="text-xs text-white/40 uppercase tracking-wider font-mono mb-2">{s.label}</p>
              <p className={`text-2xl font-extrabold font-mono tracking-tight ${s.color}`}>{s.value.toLocaleString()}</p>
            </div>
          ))}
        </div>

        {/* TABLE HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <div className="flex items-center gap-3">
            <h2 className="font-display font-bold text-sm text-white/50 uppercase tracking-widest">
              Tus enlaces
            </h2>
            {links.length > 0 && (
              <span className="tag bg-accent/10 text-accent2 border border-accent/20">
                {links.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar enlace..."
              className="input-base max-w-xs"
            />
            <Link href="/" className="btn-primary shrink-0 inline-flex items-center gap-2 no-underline">
              <span className="text-lg leading-none">+</span>
              Nuevo enlace
            </Link>
          </div>
        </div>

        {/* TABLE */}
        {filtered.length === 0 ? (
          <div className="card text-center py-20">
            <p className="text-4xl mb-4">⚡</p>
            <p className="text-white/40 font-mono text-sm">
              {search ? 'Sin resultados para "' + search + '"' : 'Sin enlaces — crea uno arriba'}
            </p>
            {!search && (
              <Link href="/" className="btn-primary inline-flex mt-6 items-center gap-2 no-underline">
                <span className="text-lg leading-none">+</span>
                Crear primer enlace
              </Link>
            )}
          </div>
        ) : (
          <div className="card p-0 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-5 py-3 text-xs font-mono text-white/30 uppercase tracking-wider font-normal">Enlace corto</th>
                  <th className="text-left px-5 py-3 text-xs font-mono text-white/30 uppercase tracking-wider font-normal hidden lg:table-cell">Destino</th>
                  <th className="text-left px-3 py-3 text-xs font-mono text-white/30 uppercase tracking-wider font-normal">Hoy</th>
                  <th className="text-left px-3 py-3 text-xs font-mono text-white/30 uppercase tracking-wider font-normal hidden md:table-cell">Semana</th>
                  <th className="text-left px-3 py-3 text-xs font-mono text-white/30 uppercase tracking-wider font-normal hidden md:table-cell">Mes</th>
                  <th className="text-left px-3 py-3 text-xs font-mono text-white/30 uppercase tracking-wider font-normal">Total</th>
                  <th className="text-left px-5 py-3 text-xs font-mono text-white/30 uppercase tracking-wider font-normal hidden sm:table-cell">Estado</th>
                  <th className="text-left px-5 py-3 text-xs font-mono text-white/30 uppercase tracking-wider font-normal">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((link, i) => (
                  <tr key={link.id} className={`border-b border-white/5 hover:bg-surface2/50 transition-colors ${i === filtered.length - 1 ? 'border-b-0' : ''}`}>
                    <td className="px-5 py-4">
                      <div>
                        {link.title && <p className="text-xs text-white/40 font-mono mb-0.5">{link.title}</p>}
                        <a
                          href={getShortUrl(link.slug)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-accent2 font-mono text-sm hover:underline"
                        >
                          {getShortUrl(link.slug).replace('https://', '')}
                        </a>
                        <p className="text-xs text-white/25 font-mono mt-0.5">{relativeTime(link.created_at)}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <p className="text-xs text-white/40 font-mono max-w-[220px] truncate" title={link.original_url}>
                        {link.original_url}
                      </p>
                    </td>
                    <td className="px-3 py-4">
                      <span className="font-mono font-bold text-green-400 text-sm">{link.clicks_today ?? 0}</span>
                    </td>
                    <td className="px-3 py-4 hidden md:table-cell">
                      <span className="font-mono text-amber-400 text-sm">{link.clicks_week ?? 0}</span>
                    </td>
                    <td className="px-3 py-4 hidden md:table-cell">
                      <span className="font-mono text-blue-400 text-sm">{link.clicks_month ?? 0}</span>
                    </td>
                    <td className="px-3 py-4">
                      <span className="font-mono font-bold text-white text-sm">{link.total_clicks ?? 0}</span>
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell">
                      <button onClick={() => toggleActive(link)}>
                        <span className={`tag cursor-pointer ${link.active ? 'tag-active' : 'tag-inactive'}`}>
                          {link.active ? 'activo' : 'inactivo'}
                        </span>
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/dashboard/${link.id}`}
                          className="btn-secondary text-xs px-3 py-1.5 no-underline"
                        >
                          Stats
                        </Link>
                        <button
                          onClick={() => copyLink(link)}
                          className="btn-secondary text-xs px-3 py-1.5"
                        >
                          {copiedId === link.id ? '✓' : 'Copiar'}
                        </button>
                        <button
                          onClick={() => deleteLink(link.id)}
                          className="btn-danger text-xs px-2 py-1.5"
                        >
                          ×
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
