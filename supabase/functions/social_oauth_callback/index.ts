import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state'); // Optionally passing platform and user_id in state
    
    if (!code || !state) {
      return new Response(JSON.stringify({ error: 'Missing code or state parameters' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Example: parse state to get platform and user ID (assuming JSON encoded in state, or base64)
    // For production, you should use a secure JWT or store the state session
    let platform, userId;
    try {
      const parsedState = JSON.parse(atob(state));
      platform = parsedState.platform;
      userId = parsedState.userId;
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Invalid state parameter' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Initialize Supabase Client with Service Role Key to bypass RLS for token storage
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    let accessToken, refreshToken, expiresAt, accountId, username;

    // Platform specific token exchange
    if (platform === 'youtube') {
      const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
      const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
      
      // Reconstruct the exact URL that Google sent the callback to
      const redirectUri = `${url.origin}${url.pathname}`;

      if (!clientId || !clientSecret) {
        throw new Error('Google OAuth configuration is missing on the server.');
      }

      // 1. Exchange code for Google OAuth token
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      });

      const tokenData = await tokenResponse.json();

      if (!tokenResponse.ok) {
        console.error('Google token exchange failed:', tokenData);
        throw new Error(`Google OAuth error: ${tokenData.error_description || tokenData.error}`);
      }

      accessToken = tokenData.access_token;
      refreshToken = tokenData.refresh_token; // Might be undefined if not requested offline
      
      // Calculate expires_at
      if (tokenData.expires_in) {
        const expires = new Date();
        expires.setSeconds(expires.getSeconds() + tokenData.expires_in);
        expiresAt = expires.toISOString();
      }

      // 2. Fetch YouTube Channel ID and Username
      const channelResponse = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      const channelData = await channelResponse.json();

      if (!channelResponse.ok) {
         console.error('YouTube API error:', channelData);
         throw new Error('Failed to fetch YouTube channel info.');
      }

      if (channelData.items && channelData.items.length > 0) {
        const channel = channelData.items[0];
        accountId = channel.id;
        username = channel.snippet.title;
      } else {
         throw new Error('No YouTube channel found for this account.');
      }

    } else if (platform === 'instagram') {
      // Exchange code for Instagram Graph API token
    } else if (platform === 'tiktok') {
      // Exchange code for TikTok token
    } else {
      throw new Error(`Unsupported platform: ${platform}`);
    }

    // Save to database
    const { error } = await supabase.from('social_accounts').upsert({
      user_id: userId,
      platform,
      account_id: accountId,
      username: username,
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: expiresAt,
    }, { onConflict: 'user_id, platform, account_id' });

    if (error) {
      console.error('Supabase DB Insert Error:', error);
      throw new Error('Failed to save social account to database.');
    }

    return new Response(
      JSON.stringify({ message: `Successfully connected ${platform} account! You can close this window.` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
