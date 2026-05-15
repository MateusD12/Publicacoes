import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { uploadVideo, uploadThumbnail } from '@/lib/storage'
import { PLATFORM_LABEL, PLATFORM_COLOR } from '@/lib/utils'
import { toast } from 'sonner'

export const Route = createFileRoute('/nova-publicacao')({
  component: NovaPublicacaoPage,
})

const schema = z.object({
  title: z.string().min(1, 'Título obrigatório'),
  description: z.string().default(''),
  platforms: z.array(z.enum(['youtube', 'instagram', 'tiktok'])).min(1, 'Selecione ao menos uma plataforma'),
  scheduled_for: z.string().optional(),
})

type FormData = z.infer<typeof schema>

const PLATFORMS = ['youtube', 'instagram', 'tiktok'] as const

function NovaPublicacaoPage() {
  const navigate = useNavigate()
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [thumbFile, setThumbFile] = useState<File | null>(null)
  const [videoPreview, setVideoPreview] = useState<string | null>(null)
  const [thumbPreview, setThumbPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const videoRef = useRef<HTMLInputElement>(null)
  const thumbRef = useRef<HTMLInputElement>(null)

  const { register, control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { platforms: [], description: '' },
  })

  function handleVideoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setVideoFile(file)
    setVideoPreview(URL.createObjectURL(file))
  }

  function handleThumbChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setThumbFile(file)
    setThumbPreview(URL.createObjectURL(file))
  }

  async function onSubmit(data: FormData) {
    if (!videoFile) {
      toast.error('Selecione um vídeo.')
      return
    }
    setUploading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Não autenticado')

      const postId = crypto.randomUUID()
      const videoUrl = await uploadVideo(videoFile, user.id, postId)
      const thumbnailUrl = thumbFile ? await uploadThumbnail(thumbFile, user.id, postId) : null

      const { error: postError } = await supabase.from('posts').insert({
        id: postId,
        user_id: user.id,
        title: data.title,
        description: data.description,
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl,
        platforms: data.platforms,
        scheduled_for: data.scheduled_for || null,
        status: data.scheduled_for ? 'scheduled' : 'draft',
      })
      if (postError) throw postError

      const results = data.platforms.map(platform => ({
        post_id: postId,
        platform,
        status: 'pending' as const,
      }))
      const { error: resultsError } = await supabase.from('post_results').insert(results)
      if (resultsError) throw resultsError

      toast.success('Publicação criada com sucesso!')
      navigate({ to: data.scheduled_for ? '/agendados' : '/publicados' })
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao criar publicação')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-white">Nova Publicação</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div
            className="bg-neutral-900 border border-neutral-800 rounded-xl flex flex-col items-center justify-center p-6 cursor-pointer hover:border-neutral-600 transition-colors aspect-video relative overflow-hidden"
            onClick={() => videoRef.current?.click()}
          >
            <input ref={videoRef} type="file" accept="video/*" className="hidden" onChange={handleVideoChange} />
            {videoPreview ? (
              <video src={videoPreview} className="absolute inset-0 w-full h-full object-cover rounded-xl" controls />
            ) : (
              <>
                <span className="text-4xl text-neutral-600">▶</span>
                <p className="text-neutral-500 text-sm mt-2">Clique para selecionar vídeo</p>
              </>
            )}
          </div>

          <div
            className="bg-neutral-900 border border-neutral-800 rounded-xl flex flex-col items-center justify-center p-6 cursor-pointer hover:border-neutral-600 transition-colors aspect-video relative overflow-hidden"
            onClick={() => thumbRef.current?.click()}
          >
            <input ref={thumbRef} type="file" accept="image/*" className="hidden" onChange={handleThumbChange} />
            {thumbPreview ? (
              <img src={thumbPreview} className="absolute inset-0 w-full h-full object-cover rounded-xl" alt="Thumbnail" />
            ) : (
              <>
                <span className="text-4xl text-neutral-600">◻</span>
                <p className="text-neutral-500 text-sm mt-2">Capa / Thumbnail (opcional)</p>
              </>
            )}
          </div>
        </div>

        <div>
          <label className="text-sm text-neutral-400 block mb-1.5">Título *</label>
          <input
            {...register('title')}
            placeholder="Título da publicação"
            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600"
          />
          {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>}
        </div>

        <div>
          <label className="text-sm text-neutral-400 block mb-1.5">Descrição</label>
          <textarea
            {...register('description')}
            rows={4}
            placeholder="Descrição, tags, links..."
            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600 resize-none"
          />
        </div>

        <div>
          <label className="text-sm text-neutral-400 block mb-2">Plataformas *</label>
          <Controller
            name="platforms"
            control={control}
            render={({ field }) => (
              <div className="flex gap-3">
                {PLATFORMS.map(p => {
                  const active = field.value.includes(p)
                  const color = PLATFORM_COLOR[p]
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => {
                        const next = active ? field.value.filter(v => v !== p) : [...field.value, p]
                        field.onChange(next)
                      }}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all"
                      style={active
                        ? { background: color + '22', color, borderColor: color + '66' }
                        : { background: 'transparent', color: '#6b7280', borderColor: '#374151' }
                      }
                    >
                      {p === 'youtube' ? '▶' : p === 'instagram' ? '◈' : '♪'}
                      {PLATFORM_LABEL[p]}
                    </button>
                  )
                })}
              </div>
            )}
          />
          {errors.platforms && <p className="text-red-400 text-xs mt-1">{errors.platforms.message}</p>}
        </div>

        <div>
          <label className="text-sm text-neutral-400 block mb-1.5">Agendar para (opcional)</label>
          <input
            {...register('scheduled_for')}
            type="datetime-local"
            className="bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-neutral-600 [color-scheme:dark]"
          />
          <p className="text-neutral-600 text-xs mt-1">Deixe em branco para salvar como rascunho.</p>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={uploading}
            className="bg-white text-black px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {uploading ? 'Enviando...' : 'Criar publicação'}
          </button>
        </div>
      </form>
    </div>
  )
}
