import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { post_id } = await req.json()
  if (!post_id) {
    return new Response(JSON.stringify({ error: 'post_id required' }), { status: 400, headers: corsHeaders })
  }

  const { data: post, error: postErr } = await supabase
    .from('posts')
    .select('*, post_results(*)')
    .eq('id', post_id)
    .single()

  if (postErr || !post) {
    return new Response(JSON.stringify({ error: 'Post not found' }), { status: 404, headers: corsHeaders })
  }

  await supabase.from('posts').update({ status: 'publishing' }).eq('id', post_id)

  const results: Array<{ id: string; platform: string; status: string }> = post.post_results.filter(
    (r: { status: string }) => r.status === 'pending'
  )

  let anySuccess = false
  let anyFailure = false

  for (const result of results) {
    await supabase.from('post_results').update({ status: 'publishing' }).eq('id', result.id)

    try {
      if (result.platform === 'youtube') {
        const ytResult = await publishToYouTube(supabase, post, result.id)
        await supabase.from('post_results').update({
          status: 'published',
          platform_post_id: ytResult.videoId,
          published_at: new Date().toISOString(),
        }).eq('id', result.id)
        anySuccess = true

      } else {
        await supabase.from('post_results').update({
          status: 'failed',
          error_message: `Plataforma ${result.platform} ainda não configurada. Aguardando aprovação da conta dev.`,
        }).eq('id', result.id)
        anyFailure = true
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido'
      await supabase.from('post_results').update({
        status: 'failed',
        error_message: msg,
      }).eq('id', result.id)
      anyFailure = true
    }
  }

  const finalStatus = anySuccess ? 'published' : anyFailure ? 'failed' : 'published'
  await supabase.from('posts').update({ status: finalStatus }).eq('id', post_id)

  return new Response(JSON.stringify({ success: true, status: finalStatus }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})

async function publishToYouTube(
  supabase: ReturnType<typeof createClient>,
  post: { user_id: string; title: string; description: string; video_url: string; thumbnail_url: string | null },
  resultId: string,
) {
  const { data: account } = await supabase
    .from('social_accounts')
    .select('*')
    .eq('user_id', post.user_id)
    .eq('platform', 'youtube')
    .single()

  if (!account) throw new Error('Conta YouTube não conectada.')

  let accessToken = account.access_token
  if (account.expires_at && new Date(account.expires_at) < new Date()) {
    accessToken = await refreshYouTubeToken(supabase, account)
  }

  const videoRes = await fetch(post.video_url)
  if (!videoRes.ok) throw new Error('Não foi possível baixar o vídeo do Storage.')
  const videoBlob = await videoRes.blob()

  const metadata = {
    snippet: {
      title: post.title,
      description: post.description,
      categoryId: '22',
    },
    status: { privacyStatus: 'public' },
  }

  const boundary = '------FormBoundary' + Date.now()
  const metaJson = JSON.stringify(metadata)
  const body = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metaJson}\r\n--${boundary}\r\nContent-Type: ${videoBlob.type || 'video/mp4'}\r\n\r\n`
  const bodyEnd = `\r\n--${boundary}--`

  const uploadRes = await fetch(
    'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=multipart&part=snippet,status',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: new Blob([body, videoBlob, bodyEnd]),
    }
  )

  const uploadData = await uploadRes.json()
  if (!uploadRes.ok) throw new Error(uploadData.error?.message || 'Erro no upload do YouTube')

  const videoId: string = uploadData.id

  if (post.thumbnail_url) {
    try {
      const thumbRes = await fetch(post.thumbnail_url)
      const thumbBlob = await thumbRes.blob()
      await fetch(`https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId=${videoId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': thumbBlob.type || 'image/jpeg' },
        body: thumbBlob,
      })
    } catch {
      // thumbnail failure is non-fatal
    }
  }

  await supabase.from('social_accounts').update({ updated_at: new Date().toISOString() }).eq('id', account.id)

  return { videoId }
}

async function refreshYouTubeToken(
  supabase: ReturnType<typeof createClient>,
  account: { id: string; refresh_token: string },
): Promise<string> {
  const clientId = Deno.env.get('GOOGLE_CLIENT_ID')!
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')!

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: account.refresh_token,
      grant_type: 'refresh_token',
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error_description || 'Erro ao renovar token YouTube')

  const expires = new Date()
  expires.setSeconds(expires.getSeconds() + (data.expires_in ?? 3600))

  await supabase.from('social_accounts').update({
    access_token: data.access_token,
    expires_at: expires.toISOString(),
  }).eq('id', account.id)

  return data.access_token
}
