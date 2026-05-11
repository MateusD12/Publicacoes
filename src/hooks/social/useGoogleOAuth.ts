import { useCallback } from 'react';
import { supabase } from '../../integrations/supabase/client';

export const useGoogleOAuth = () => {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const redirectUri = `${supabaseUrl}/functions/v1/social_oauth_callback`;

  const connectYouTube = useCallback(async () => {
    try {
      // 1. Get the current user from Supabase to link the account
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        alert("Você precisa estar logado para conectar contas sociais.");
        return;
      }

      // 2. Prepare state parameter (passing user_id and platform)
      const stateObj = {
        userId: session.user.id,
        platform: 'youtube'
      };
      const state = btoa(JSON.stringify(stateObj)); // Base64 encode the state

      // 3. Construct Google OAuth URL
      const scope = encodeURIComponent('https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly');
      
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + 
        `client_id=${clientId}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=code` +
        `&scope=${scope}` +
        `&access_type=offline` + // Required to get a refresh token
        `&prompt=consent` + // Force consent to ensure we get a refresh token
        `&state=${state}`;

      // 4. Redirect user to Google
      window.location.href = authUrl;

    } catch (error) {
      console.error("Error initiating YouTube connection:", error);
      alert("Falha ao iniciar a conexão com o YouTube.");
    }
  }, [clientId]);

  return { connectYouTube };
};
