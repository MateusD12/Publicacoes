import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { formatDate, PLATFORM_LABEL, PLATFORM_COLOR, STATUS_LABEL, STATUS_COLOR } from '@/lib/utils'
import type { PostWithResults } from '@/lib/types'

export const Route = createFileRoute('/publicados')({
  component: PublicadosPage,
})

function PublicadosPage() {
  const { data: posts = [], isLoading } = useQuery<PostWithResults[]>({
    queryKey: ['posts', 'publicados'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*, post_results(*)')
        .in('status', ['published', 'failed'])
        .order('updated_at', { ascending: false })
      if (error) throw error
      return data as PostWithResults[]
    },
  })

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-white">Publicados</h1>

      {isLoading ? (
        <p className="text-neutral-500">Carregando...</p>
      ) : posts.length === 0 ? (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-10 text-center">
          <p className="text-neutral-500">Nenhuma publicação concluída ainda.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map(post => (
            <div key={post.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex gap-4">
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

                <p className="text-neutral-400 text-xs mt-1">{formatDate(post.updated_at)}</p>

                <div className="flex gap-2 mt-2">
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
                  <div className="flex flex-wrap gap-2 mt-2">
                    {post.post_results.map(r => (
                      <div key={r.id} className="flex items-center gap-1.5">
                        <span className="text-xs text-neutral-500">{PLATFORM_LABEL[r.platform]}:</span>
                        <span
                          className="text-xs px-1.5 py-0.5 rounded"
                          style={{ background: STATUS_COLOR[r.status] + '22', color: STATUS_COLOR[r.status] }}
                        >
                          {STATUS_LABEL[r.status]}
                        </span>
                        {r.platform_post_id && r.platform === 'youtube' && (
                          <a
                            href={`https://youtube.com/watch?v=${r.platform_post_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-400 hover:underline"
                          >
                            Ver vídeo
                          </a>
                        )}
                        {r.error_message && (
                          <span className="text-xs text-red-400 truncate max-w-xs" title={r.error_message}>
                            {r.error_message}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
