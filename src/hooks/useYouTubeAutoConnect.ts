import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export function useYouTubeAutoConnect() {
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    async function tryConnect() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.provider_token) return

      // Only runs for Google OAuth sessions
      if (session.user.app_metadata?.provider !== 'google') return

      // Check if YouTube already connected
      const { data: existing } = await supabase
        .from('social_accounts')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('platform', 'youtube')
        .maybeSingle()

      if (existing) return

      // Fetch YouTube channel info using provider_token
      const res = await fetch(
        'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true',
        { headers: { Authorization: `Bearer ${session.provider_token}` } },
      )
      if (!res.ok) return

      const data = await res.json()
      const channel = data.items?.[0]
      if (!channel) return

      let expiresAt: string | undefined
      // provider_token expires_in is not directly available, default to 1h
      const exp = new Date()
      exp.setHours(exp.getHours() + 1)
      expiresAt = exp.toISOString()

      const { error } = await supabase.from('social_accounts').insert({
        user_id: session.user.id,
        platform: 'youtube',
        account_id: channel.id,
        username: channel.snippet.title,
        profile_picture_url: channel.snippet.thumbnails?.default?.url ?? null,
        access_token: session.provider_token,
        refresh_token: session.provider_refresh_token ?? null,
        expires_at: expiresAt,
      })

      if (!error) {
        toast.success('Canal YouTube conectado automaticamente!')
      }
    }

    tryConnect()
  }, [])
}
