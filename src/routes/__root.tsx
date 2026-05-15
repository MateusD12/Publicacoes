import { createRootRoute, Link, Outlet, redirect } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Session } from '@supabase/supabase-js'

export const Route = createRootRoute({
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getSession()
    if (!data.session && location.pathname !== '/login') {
      throw redirect({ to: '/login' })
    }
    if (data.session && location.pathname === '/login') {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: RootComponent,
})

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: '◉' },
  { to: '/nova-publicacao', label: 'Nova Publicação', icon: '＋' },
  { to: '/agendados', label: 'Agendados', icon: '◷' },
  { to: '/publicados', label: 'Publicados', icon: '✓' },
  { to: '/metricas', label: 'Métricas', icon: '▲' },
  { to: '/contas', label: 'Contas', icon: '◎' },
]

function Sidebar({ session }: { session: Session | null }) {
  const [open, setOpen] = useState(true)

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <aside
      className="flex flex-col bg-neutral-950 border-r border-neutral-800 transition-all duration-200"
      style={{ width: open ? 220 : 60 }}
    >
      <div className="flex items-center justify-between px-4 py-4 border-b border-neutral-800">
        {open && (
          <span className="text-white font-bold tracking-tight text-sm">
            <span className="text-red-500">You</span>
            <span className="text-pink-500">Tube</span>
            <span className="text-cyan-400">+</span>
          </span>
        )}
        <button
          onClick={() => setOpen(o => !o)}
          className="text-neutral-400 hover:text-white text-lg leading-none ml-auto"
        >
          {open ? '◂' : '▸'}
        </button>
      </div>

      <nav className="flex-1 py-4 space-y-1 px-2">
        {NAV.map(item => (
          <Link
            key={item.to}
            to={item.to}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors text-sm"
            activeProps={{ className: 'flex items-center gap-3 px-3 py-2.5 rounded-lg text-white bg-neutral-800 text-sm' }}
          >
            <span className="text-base w-5 text-center shrink-0">{item.icon}</span>
            {open && <span className="truncate">{item.label}</span>}
          </Link>
        ))}
      </nav>

      {session && (
        <div className="px-2 pb-4 border-t border-neutral-800 pt-4">
          {open && (
            <p className="text-neutral-500 text-xs px-3 mb-2 truncate">{session.user.email}</p>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-neutral-800 transition-colors text-sm w-full"
          >
            <span className="text-base w-5 text-center shrink-0">⏻</span>
            {open && <span>Sair</span>}
          </button>
        </div>
      )}
    </aside>
  )
}

function RootComponent() {
  const [session, setSession] = useState<Session | null>(null)
  const isLogin = window.location.pathname === '/login'

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  if (isLogin) return <Outlet />

  return (
    <div className="flex h-screen bg-neutral-900 text-white overflow-hidden">
      <Sidebar session={session} />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
