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

  const { data: accounts, error } = await supabase
    .from('social_accounts')
    .select('*')
    .eq('platform', 'youtube')

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders })
  }

  const results = []

  for (const account of accounts ?? []) {
    try {
      let accessToken = account.access_token
      if (account.expires_at && new Date(account.expires_at) < new Date()) {
        accessToken = await refreshToken(supabase, account)
      }

      const today = new Date().toISOString().slice(0, 10)
      const startDate = new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10)

      const analyticsRes = await fetch(
        `https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==MINE&startDate=${startDate}&endDate=${today}&metrics=views,likes,comments&dimensions=day&sort=day`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )
      const analyticsData = await analyticsRes.json()

      if (!analyticsRes.ok) {
        console.error('Analytics error for', account.username, analyticsData.error?.message)
        continue
      }

      const rows: Array<[string, number, number, number]> = analyticsData.rows ?? []
      const upserts = rows.map(([date, views, likes, comments]) => ({
        social_account_id: account.id,
        metric_date: date,
        views,
        likes,
        comments,
        post_id: null,
      }))

      if (upserts.length > 0) {
        await supabase.from('analytics_cache').upsert(upserts, {
          onConflict: 'social_account_id,metric_date',
          ignoreDuplicates: false,
        })
      }

      results.push({ account: account.username, rows: upserts.length })
    } catch (err: unknown) {
      console.error('fetch_analytics error:', err instanceof Error ? err.message : err)
    }
  }

  return new Response(JSON.stringify({ results }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})

async function refreshToken(
  supabase: ReturnType<typeof createClient>,
  account: { id: string; refresh_token: string },
): Promise<string> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: Deno.env.get('GOOGLE_CLIENT_ID')!,
      client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET')!,
      refresh_token: account.refresh_token,
      grant_type: 'refresh_token',
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error_description || 'Erro ao renovar token')

  const expires = new Date()
  expires.setSeconds(expires.getSeconds() + (data.expires_in ?? 3600))

  await supabase.from('social_accounts').update({
    access_token: data.access_token,
    expires_at: expires.toISOString(),
  }).eq('id', account.id)

  return data.access_token
}
