import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { formatDate, PLATFORM_LABEL, PLATFORM_COLOR, STATUS_LABEL, STATUS_COLOR } from '@/lib/utils'
import { toast } from 'sonner'
import type { PostWithResults } from '@/lib/types'

export const Route = createFileRoute('/agendados')({
  component: AgendadosPage,
})

function AgendadosPage() {
  const qc = useQueryClient()

  const { data: posts = [], isLoading } = useQuery<PostWithResults[]>({
    queryKey: ['posts', 'agendados'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*, post_results(*)')
        .in('status', ['draft', 'scheduled', 'publishing'])
        .order('scheduled_for', { ascending: true, nullsFirst: false })
      if (error) throw error
      return data as PostWithResults[]
    },
    refetchInterval: 30_000,
  })

  const cancel = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('posts').update({ status: 'draft' }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['posts'] })
      toast.success('Publicação cancelada (voltou para rascunho).')
    },
    onError: () => toast.error('Erro ao cancelar publicação.'),
  })

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-white">Agendados</h1>

      {isLoading ? (
        <p className="text-neutral-500">Carregando...</p>
      ) : posts.length === 0 ? (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-10 text-center">
          <p className="text-neutral-500">Nenhuma publicação agendada ou em rascunho.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              onCancel={() => cancel.mutate(post.id)}
              canceling={cancel.isPending}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function PostCard({ post, onCancel, canceling }: { post: PostWithResults; onCancel: () => void; canceling: boolean }) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex gap-4">
      {post.thumbnail_url ? (
        <img src={post.thumbnail_url} className="w-24 h-16 object-cover rounded-lg shrink-0" alt="" />
      ) : (
        <div className="w-24 h-16 bg-neutral-800 rounded-lg flex items-center justify-center text-neutral-600 shrink-0">▶</div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-white font-medium truncate">{post.title || 'Sem título'}</p>
          <span
            className="text-xs px-2 py-1 rounded-full shrink-0"
            style={{ background: STATUS_COLOR[post.status] + '22', color: STATUS_COLOR[post.status] }}
          >
            {STATUS_LABEL[post.status]}
          </span>
        </div>

        {post.scheduled_for && (
          <p className="text-neutral-400 text-xs mt-1">📅 {formatDate(post.scheduled_for)}</p>
        )}

        <div className="flex items-center gap-2 mt-2">
          {post.platforms.map(p => (
            <span
              key={p}
              className="text-xs px-2 py-0.5 rounded"
              style={{ background: PLATFORM_COLOR[p] + '22', color: PLATFORM_COLOR[p] }}
            >
              {PLATFORM_LABEL[p]}
            </span>
          ))}
        </div>

        {post.post_results.length > 0 && (
          <div className="flex gap-2 mt-2">
            {post.post_results.map(r => (
              <span
                key={r.id}
                className="text-xs px-1.5 py-0.5 rounded border"
                style={{ borderColor: STATUS_COLOR[r.status] + '44', color: STATUS_COLOR[r.status] }}
                title={r.error_message || undefined}
              >
                {PLATFORM_LABEL[r.platform]}: {STATUS_LABEL[r.status]}
              </span>
            ))}
          </div>
        )}
      </div>

      {post.status !== 'publishing' && (
        <button
          onClick={onCancel}
          disabled={canceling}
          className="text-xs text-neutral-500 hover:text-red-400 border border-neutral-800 hover:border-red-900 px-3 py-1.5 rounded-lg transition-colors self-start shrink-0"
        >
          Cancelar
        </button>
      )}
    </div>
  )
}
