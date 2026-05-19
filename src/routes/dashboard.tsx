import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { formatRelative, PLATFORM_LABEL, PLATFORM_COLOR, STATUS_LABEL, STATUS_COLOR } from '@/lib/utils'
import type { PostWithResults, SocialAccount } from '@/lib/types'
import { useYouTubeAutoConnect } from '@/hooks/useYouTubeAutoConnect'

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
})

function DashboardPage() {
  useYouTubeAutoConnect()

  const { data: posts = [] } = useQuery<PostWithResults[]>({
    queryKey: ['posts', 'dashboard'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*, post_results(*)')
        .in('status', ['scheduled', 'publishing'])
        .order('scheduled_for', { ascending: true })
        .limit(5)
      if (error) throw error
      return data as PostWithResults[]
    },
  })

  const { data: accounts = [] } = useQuery<SocialAccount[]>({
    queryKey: ['social_accounts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('social_accounts')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as SocialAccount[]
    },
  })

  const { data: stats } = useQuery({
    queryKey: ['posts', 'stats'],
    queryFn: async () => {
      const { count: scheduled } = await supabase
        .from('posts').select('*', { count: 'exact', head: true }).eq('status', 'scheduled')
      const { count: published } = await supabase
        .from('posts').select('*', { count: 'exact', head: true }).eq('status', 'published')
      const { count: failed } = await supabase
        .from('posts').select('*', { count: 'exact', head: true }).eq('status', 'failed')
      return { scheduled: scheduled ?? 0, published: published ?? 0, failed: failed ?? 0 }
    },
  })

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <Link
          to="/nova-publicacao"
          className="bg-white text-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-neutral-200 transition-colors"
        >
          + Nova publicação
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Agendados', value: stats?.scheduled ?? '—', color: '#3b82f6' },
          { label: 'Publicados', value: stats?.published ?? '—', color: '#22c55e' },
          { label: 'Falhas', value: stats?.failed ?? '—', color: '#ef4444' },
        ].map(s => (
          <div key={s.label} className="bg-neutral-900 rounded-xl border border-neutral-800 p-5">
            <p className="text-neutral-400 text-sm">{s.label}</p>
            <p className="text-3xl font-bold mt-1" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-5">
          <h2 className="text-white font-semibold mb-4">Próximas publicações</h2>
          {posts.length === 0 ? (
            <p className="text-neutral-500 text-sm">Nenhuma publicação agendada.</p>
          ) : (
            <div className="space-y-3">
              {posts.map(post => (
                <div key={post.id} className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{post.title || 'Sem título'}</p>
                    <p className="text-neutral-500 text-xs mt-0.5">{formatRelative(post.scheduled_for)}</p>
                    <div className="flex gap-1 mt-1">
                      {post.platforms.map(p => (
                        <span key={p} className="text-xs px-1.5 py-0.5 rounded" style={{ background: PLATFORM_COLOR[p] + '22', color: PLATFORM_COLOR[p] }}>
                          {PLATFORM_LABEL[p]}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full shrink-0" style={{ background: STATUS_COLOR[post.status] + '22', color: STATUS_COLOR[post.status] }}>
                    {STATUS_LABEL[post.status]}
                  </span>
                </div>
              ))}
            </div>
          )}
          <Link to="/agendados" className="text-xs text-neutral-500 hover:text-white mt-4 block">Ver todos →</Link>
        </div>

        <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-5">
          <h2 className="text-white font-semibold mb-4">Contas conectadas</h2>
          {accounts.length === 0 ? (
            <p className="text-neutral-500 text-sm">Nenhuma conta conectada.</p>
          ) : (
            <div className="space-y-3">
              {accounts.map(acc => (
                <div key={acc.id} className="flex items-center gap-3">
                  {acc.profile_picture_url ? (
                    <img src={acc.profile_picture_url} className="w-8 h-8 rounded-full" alt="" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-500 text-xs">?</div>
                  )}
                  <div>
                    <p className="text-white text-sm">{acc.username}</p>
                    <p className="text-xs" style={{ color: PLATFORM_COLOR[acc.platform] }}>{PLATFORM_LABEL[acc.platform]}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Link to="/contas" className="text-xs text-neutral-500 hover:text-white mt-4 block">Gerenciar contas →</Link>
        </div>
      </div>
    </div>
  )
}
