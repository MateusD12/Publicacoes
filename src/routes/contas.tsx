import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { getYouTubeAuthUrl } from '@/lib/youtube'
import { PLATFORM_LABEL, PLATFORM_COLOR } from '@/lib/utils'
import { toast } from 'sonner'
import type { SocialAccount } from '@/lib/types'

export const Route = createFileRoute('/contas')({
  component: ContasPage,
})

const PLATFORMS = ['youtube', 'instagram', 'tiktok'] as const

function ContasPage() {
  const qc = useQueryClient()

  const { data: accounts = [], isLoading } = useQuery<SocialAccount[]>({
    queryKey: ['social_accounts'],
    queryFn: async () => {
      const { data, error } = await supabase.from('social_accounts').select('*').order('created_at')
      if (error) throw error
      return data as SocialAccount[]
    },
  })

  const disconnect = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('social_accounts').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['social_accounts'] })
      toast.success('Conta desconectada.')
    },
    onError: () => toast.error('Erro ao desconectar conta.'),
  })

  async function connectYouTube() {
    const { data } = await supabase.auth.getUser()
    if (!data.user) return
    window.location.href = getYouTubeAuthUrl(data.user.id)
  }

  const accountByPlatform = (platform: string) =>
    accounts.find(a => a.platform === platform)

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-white">Contas</h1>
      <p className="text-neutral-400 text-sm">Conecte suas contas para publicar automaticamente.</p>

      <div className="space-y-4">
        {PLATFORMS.map(platform => {
          const account = accountByPlatform(platform)
          const color = PLATFORM_COLOR[platform]
          const label = PLATFORM_LABEL[platform]
          const isYT = platform === 'youtube'

          return (
            <div key={platform} className="bg-neutral-900 rounded-xl border border-neutral-800 p-5 flex items-center gap-4">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold"
                style={{ background: color + '22', color }}
              >
                {platform === 'youtube' ? '▶' : platform === 'instagram' ? '◈' : '♪'}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-white font-medium">{label}</p>
                {account ? (
                  <div className="flex items-center gap-2 mt-1">
                    {account.profile_picture_url && (
                      <img src={account.profile_picture_url} className="w-5 h-5 rounded-full" alt="" />
                    )}
                    <p className="text-neutral-400 text-sm truncate">@{account.username}</p>
                  </div>
                ) : (
                  <p className="text-neutral-600 text-sm">Não conectado</p>
                )}
              </div>

              {account ? (
                <button
                  onClick={() => disconnect.mutate(account.id)}
                  disabled={disconnect.isPending}
                  className="text-sm text-red-400 hover:text-red-300 border border-red-900 hover:border-red-700 px-4 py-2 rounded-lg transition-colors"
                >
                  Desconectar
                </button>
              ) : isYT ? (
                <button
                  onClick={connectYouTube}
                  className="text-sm px-4 py-2 rounded-lg font-medium transition-colors"
                  style={{ background: color + '22', color, border: `1px solid ${color}44` }}
                >
                  Conectar
                </button>
              ) : (
                <div className="text-right">
                  <span className="text-xs text-amber-500 bg-amber-950 border border-amber-900 px-3 py-1.5 rounded-lg">
                    Em breve
                  </span>
                  <p className="text-neutral-600 text-xs mt-1">Aguardando aprovação da conta dev</p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {isLoading && (
        <p className="text-neutral-500 text-sm text-center">Carregando...</p>
      )}
    </div>
  )
}
