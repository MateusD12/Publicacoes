import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const APP_URL = Deno.env.get('APP_URL') || 'https://publicacoes.vercel.app'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const errorParam = url.searchParams.get('error')

  if (errorParam) {
    return Response.redirect(`${APP_URL}/contas?error=${encodeURIComponent(errorParam)}`)
  }

  if (!code || !state) {
    return Response.redirect(`${APP_URL}/contas?error=missing_params`)
  }

  let platform: string, userId: string
  try {
    const parsed = JSON.parse(atob(state))
    platform = parsed.platform
    userId = parsed.userId
  } catch {
    return Response.redirect(`${APP_URL}/contas?error=invalid_state`)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    if (platform === 'youtube') {
      const clientId = Deno.env.get('GOOGLE_CLIENT_ID')
      const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')
      if (!clientId || !clientSecret) throw new Error('Google OAuth não configurado no servidor.')

      const redirectUri = `${url.origin}${url.pathname}`

      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: 'authorization_code' }),
      })
      const tokenData = await tokenRes.json()
      if (!tokenRes.ok) throw new Error(tokenData.error_description || tokenData.error || 'Erro no token Google')

      const accessToken: string = tokenData.access_token
      const refreshToken: string | undefined = tokenData.refresh_token
      let expiresAt: string | undefined
      if (tokenData.expires_in) {
        const d = new Date()
        d.setSeconds(d.getSeconds() + tokenData.expires_in)
        expiresAt = d.toISOString()
      }

      const chRes = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const chData = await chRes.json()
      if (!chRes.ok || !chData.items?.length) throw new Error('Canal YouTube não encontrado.')

      const channel = chData.items[0]
      const accountId: string = channel.id
      const username: string = channel.snippet.title
      const profilePictureUrl: string | undefined = channel.snippet.thumbnails?.default?.url

      const { error } = await supabase.from('social_accounts').upsert({
        user_id: userId,
        platform: 'youtube',
        account_id: accountId,
        username,
        profile_picture_url: profilePictureUrl,
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_at: expiresAt,
      }, { onConflict: 'user_id,platform,account_id' })

      if (error) throw new Error('Erro ao salvar conta no banco.')

    } else if (platform === 'instagram' || platform === 'tiktok') {
      return Response.redirect(`${APP_URL}/contas?error=platform_not_configured&platform=${platform}`)
    } else {
      throw new Error(`Plataforma não suportada: ${platform}`)
    }

    return Response.redirect(`${APP_URL}/contas?connected=${platform}`)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido'
    console.error('OAuth callback error:', msg)
    return Response.redirect(`${APP_URL}/contas?error=${encodeURIComponent(msg)}`)
  }
})
