const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string

export function getYouTubeAuthUrl(userId: string): string {
  const state = btoa(JSON.stringify({ userId, platform: 'youtube' }))
  const redirectUri = `${SUPABASE_URL}/functions/v1/social_oauth_callback`
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: [
      'https://www.googleapis.com/auth/youtube.upload',
      'https://www.googleapis.com/auth/youtube.readonly',
      'https://www.googleapis.com/auth/yt-analytics.readonly',
      'openid', 'email', 'profile',
    ].join(' '),
    access_type: 'offline',
    prompt: 'consent',
    state,
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`
}
