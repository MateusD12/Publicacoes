import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { PLATFORM_LABEL, PLATFORM_COLOR } from '@/lib/utils'

export const Route = createFileRoute('/metricas')({
  component: MetricasPage,
})

interface AnalyticsRow {
  id: string
  social_account_id: string
  metric_date: string
  views: number
  likes: number
  comments: number
}

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const HOURS = Array.from({ length: 24 }, (_, i) => i)

function MetricasPage() {
  const { data: analytics = [] } = useQuery<AnalyticsRow[]>({
    queryKey: ['analytics'],
    queryFn: async () => {
      const { data: accounts } = await supabase
        .from('social_accounts')
        .select('id')
        .eq('platform', 'youtube')

      if (!accounts?.length) return []

      const ids = accounts.map(a => a.id)
      const { data, error } = await supabase
        .from('analytics_cache')
        .select('*')
        .in('social_account_id', ids)
        .order('metric_date', { ascending: true })
        .limit(90)
      if (error) throw error
      return data as AnalyticsRow[]
    },
  })

  const totalViews = analytics.reduce((s, a) => s + (a.views || 0), 0)
  const totalLikes = analytics.reduce((s, a) => s + (a.likes || 0), 0)
  const totalComments = analytics.reduce((s, a) => s + (a.comments || 0), 0)

  const chartData = analytics.slice(-30).map(a => ({
    date: a.metric_date?.slice(5) ?? '',
    views: a.views ?? 0,
    likes: a.likes ?? 0,
  }))

  const { data: postsByHour = [] } = useQuery({
    queryKey: ['posts', 'heatmap'],
    queryFn: async () => {
      const { data } = await supabase
        .from('posts')
        .select('scheduled_for')
        .eq('status', 'published')
        .not('scheduled_for', 'is', null)
      return data ?? []
    },
  })

  const heatmap: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0))
  for (const p of postsByHour) {
    if (!p.scheduled_for) continue
    const d = new Date(p.scheduled_for)
    heatmap[d.getDay()][d.getHours()]++
  }
  const maxHeat = Math.max(...heatmap.flat(), 1)

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-white">Métricas</h1>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Views (YouTube)', value: totalViews.toLocaleString('pt-BR'), color: PLATFORM_COLOR.youtube },
          { label: 'Likes (YouTube)', value: totalLikes.toLocaleString('pt-BR'), color: '#ec4899' },
          { label: 'Comentários (YouTube)', value: totalComments.toLocaleString('pt-BR'), color: '#8b5cf6' },
        ].map(s => (
          <div key={s.label} className="bg-neutral-900 rounded-xl border border-neutral-800 p-5">
            <p className="text-neutral-400 text-sm">{s.label}</p>
            <p className="text-3xl font-bold mt-1" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {chartData.length > 0 ? (
        <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-6">
          <h2 className="text-white font-semibold mb-4">Views últimos 30 dias — YouTube</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
              <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#171717', border: '1px solid #262626', color: '#fff' }} />
              <Line type="monotone" dataKey="views" stroke={PLATFORM_COLOR.youtube} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-10 text-center">
          <p className="text-neutral-500 text-sm">
            Sem dados de métricas ainda.{' '}
            <span className="text-neutral-600">Conecte uma conta YouTube e aguarde a sincronização.</span>
          </p>
        </div>
      )}

      <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-6">
        <h2 className="text-white font-semibold mb-2">Melhores horários de publicação</h2>
        <p className="text-neutral-500 text-xs mb-4">Baseado nas suas publicações passadas. Quanto mais escuro, mais publicações naquele horário.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="text-neutral-600 w-8" />
                {HOURS.map(h => (
                  <th key={h} className="text-neutral-600 text-center font-normal px-0.5">{h}h</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DAYS.map((day, di) => (
                <tr key={day}>
                  <td className="text-neutral-500 pr-2 py-0.5">{day}</td>
                  {HOURS.map(hi => {
                    const v = heatmap[di][hi]
                    const opacity = v / maxHeat
                    return (
                      <td key={hi} className="p-0.5">
                        <div
                          className="w-full h-5 rounded-sm"
                          style={{ background: `rgba(239,68,68,${opacity})`, minWidth: 16 }}
                          title={`${v} publicação(ões)`}
                        />
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {postsByHour.length === 0 && (
          <p className="text-neutral-600 text-xs mt-4 text-center">Publique mais conteúdo para ver o heatmap preenchido.</p>
        )}
      </div>

      <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-6">
        <h2 className="text-white font-semibold mb-4">Plataformas</h2>
        <div className="flex gap-6">
          {(['youtube', 'instagram', 'tiktok'] as const).map(p => (
            <div key={p} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ background: PLATFORM_COLOR[p] }} />
              <span className="text-neutral-400 text-sm">{PLATFORM_LABEL[p]}</span>
              {p !== 'youtube' && (
                <span className="text-amber-500 text-xs ml-1">(em breve)</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
