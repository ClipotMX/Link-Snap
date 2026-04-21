'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)
  const supabase = createClient()
  const router = useRouter()

  async function handleSubmit() {
    setMessage(null)
    setLoading(true)

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setMessage({ type: 'error', text: error.message })
      else router.push('/dashboard')
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setMessage({ type: 'error', text: error.message })
      else setMessage({ type: 'success', text: 'Revisa tu email para confirmar la cuenta' })
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="font-display font-extrabold text-2xl tracking-tight mb-2">
            Link<span className="text-accent2">Snap</span>
          </div>
          <p className="text-white/40 text-sm font-mono">
            {mode === 'login' ? '// inicia sesión para continuar' : '// crea tu cuenta gratis'}
          </p>
        </div>

        <div className="card space-y-4">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder="correo@ejemplo.com"
            className="input-base"
          />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder="contraseña"
            className="input-base"
          />

          {message && (
            <p className={`text-sm font-mono px-3 py-2 rounded-lg ${
              message.type === 'error'
                ? 'text-red-400 bg-red-500/10 border border-red-500/20'
                : 'text-green-400 bg-green-500/10 border border-green-500/20'
            }`}>
              {message.text}
            </p>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn-primary w-full justify-center disabled:opacity-50"
          >
            {loading ? '...' : mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
          </button>

          <button
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setMessage(null) }}
            className="w-full text-center text-xs text-white/30 hover:text-white/60 transition-colors font-mono"
          >
            {mode === 'login' ? '¿Sin cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
          </button>
        </div>
      </div>
    </div>
  )
}
