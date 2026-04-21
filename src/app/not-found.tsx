import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <p className="text-6xl font-extrabold font-mono text-accent2">404</p>
        <h1 className="font-display font-bold text-xl">Enlace no encontrado</h1>
        <p className="text-white/40 font-mono text-sm">Este slug no existe o fue eliminado.</p>
        <Link href="/" className="btn-primary inline-flex mt-4 no-underline">
          Ir al inicio
        </Link>
      </div>
    </div>
  )
}
