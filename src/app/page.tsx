'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { generateSlug, getShortUrl } from '@/lib/utils'
import Link from 'next/link'

export default function HomePage() {
  const [url, setUrl] = useState('')
  const [customSlug, setCustomSlug] = useState('')
  const [title, setTitle] = useState('')
  const [result, setResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

  async function handleShorten() {
    setError(null)
    setResult(null)

    if (!url.trim() || !url.startsWith('http')) {
      setError('Ingresa una URL válida (debe empezar con http)')
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    setLoading(true)

    const slug = customSlug.trim().replace(/[^a-zA-Z0-9\-_]/g, '') || generateSlug()

    // Check slug uniqueness
    if (customSlug.trim()) {
      const { data: existing } = await supabase
        .from('links')
        .select('id')
        .eq('slug', slug)
        .single()

      if (existing) {
        setError('Ese slug ya existe, elige otro')
        setLoading(false)
        return
      }
    }

    const { data, error: insertError } = await supabase
      .from('links')
      .insert({ user_id: user.id, slug, original_url: url.trim(), title: title.trim() || null })
      .select()
      .single()

    setLoading(false)

    if (insertError) {
      setError('Error al crear el enlace: ' + insertError.message)
      return
    }

    setResult(getShortUrl(data.slug))
    setUrl('')
    setCustomSlug('')
    setTitle('')
  }

  async function copyResult() {
    if (!result) return
    await navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* NAV */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/5">
        <div className="font-display font-extrabold text-xl tracking-tight">
          Link<span className="text-accent2">Snap</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-sm text-white/50 hover:text-white transition-colors font-display font-semibold">
            Dashboard →
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-4 py-1.5 text-xs font-mono text-accent2 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
            {base.replace('https://', '').replace('http://', '')}
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.05] mb-4">
            Acorta.<br />
            <span className="text-accent2">Analiza.</span> Escala.
          </h1>
          <p className="text-white/40 font-mono text-sm">
            // enlaces rastreables con analytics en tiempo real
          </p>
        </div>

        {/* FORM */}
        <div className="w-full max-w-2xl space-y-3">
          {/* Main URL input */}
          <div className="flex gap-0 bg-surface border border-white/10 rounded-xl overflow-hidden focus-within:border-accent transition-colors shadow-[0_0_0_4px_rgba(124,92,252,0.1)]">
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleShorten()}
              placeholder="https://ejemplo.com/pagina-muy-larga/con-parametros..."
              className="flex-1 bg-transparent border-0 outline-none px-5 py-4 text-sm font-mono text-white placeholder:text-white/20"
            />
            <button
              onClick={handleShorten}
              disabled={loading}
              className="btn-primary rounded-none px-8 shrink-0 disabled:opacity-50"
            >
              {loading ? '...' : 'ACORTAR'}
            </button>
          </div>

          {/* Options row */}
          <div className="flex gap-3">
            <div className="flex-1 flex items-center bg-surface border border-white/10 rounded-lg overflow-hidden focus-within:border-accent/50 transition-colors">
              <span className="pl-4 text-xs font-mono text-white/30 shrink-0">
                {base.replace('https://', '').replace('http://', '')}/
              </span>
              <input
                type="text"
                value={customSlug}
                onChange={e => setCustomSlug(e.target.value.replace(/[^a-zA-Z0-9\-_]/g, ''))}
                placeholder="slug-personalizado"
                maxLength={32}
                className="flex-1 bg-transparent border-0 outline-none px-2 py-3 text-sm font-mono text-accent2 placeholder:text-white/20"
              />
            </div>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Nombre / etiqueta (opcional)"
              className="flex-1 bg-surface border border-white/10 rounded-lg px-4 py-3 text-sm font-mono text-white placeholder:text-white/20 outline-none focus:border-accent/50 transition-colors"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-red-400 text-sm font-mono bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
              ⚠ {error}
            </p>
          )}

          {/* Result */}
          {result && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-5 py-4 flex items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div>
                <p className="text-xs text-white/40 font-mono mb-1">enlace creado</p>
                <a href={result} target="_blank" rel="noopener noreferrer"
                  className="text-green-400 font-mono text-sm hover:underline">{result}</a>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={copyResult} className="btn-secondary text-xs px-3 py-1.5">
                  {copied ? '✓ Copiado' : 'Copiar'}
                </button>
                <Link href="/dashboard" className="btn-secondary text-xs px-3 py-1.5 no-underline">
                  Ver todos →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* STATS TEASER */}
        <div className="mt-20 grid grid-cols-3 gap-8 text-center max-w-lg">
          {[
            { label: 'Analytics detallados', desc: 'Clicks, dispositivos, fuentes, IPs' },
            { label: 'Slugs personalizados', desc: 'tu-marca/nombre-que-quieras' },
            { label: 'Gráficas en tiempo real', desc: 'Diario, semanal, mensual' },
          ].map(f => (
            <div key={f.label}>
              <p className="font-bold text-sm mb-1">{f.label}</p>
              <p className="text-white/30 text-xs font-mono">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
