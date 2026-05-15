# Progresso do Projeto Publicação

## ✅ Concluído

### Base do projeto
- `package.json` atualizado com TanStack Router, TanStack Query, React Hook Form, Zod, Recharts, Sonner
- `vite.config.ts` com TanStack Router plugin (code splitting automático) + PWA
- `tsconfig.app.json` com path alias `@/`
- `src/index.css` com tema dark
- `src/main.tsx` com RouterProvider + QueryClientProvider + Toaster
- `src/router.tsx` com createRouter

### Lib
- `src/lib/supabase.ts` — cliente Supabase
- `src/lib/types.ts` — tipos: Post, PostResult, PostWithResults, SocialAccount
- `src/lib/utils.ts` — cn(), formatDate(), formatRelative(), PLATFORM_LABEL/COLOR, STATUS_LABEL/COLOR
- `src/lib/storage.ts` — uploadVideo(), uploadThumbnail(), deleteMedia()
- `src/lib/youtube.ts` — getYouTubeAuthUrl() para OAuth Google

### Rotas (src/routes/)
- `__root.tsx` — layout dark com sidebar + auth guard (redireciona para /login se não autenticado)
- `index.tsx` — redirect para /dashboard
- `login.tsx` — login com Google (OAuth) + login/cadastro por e-mail e senha
- `dashboard.tsx` — visão geral: stats (agendados/publicados/falhas), próximas publicações, contas conectadas
- `nova-publicacao.tsx` — upload de vídeo + thumbnail, título, descrição, seleção de plataformas, agendamento
- `agendados.tsx` — lista de posts com status draft/scheduled/publishing, opção de cancelar
- `publicados.tsx` — histórico de posts com status por plataforma + link direto para vídeo no YouTube
- `metricas.tsx` — gráfico de views (Recharts), heatmap de horários de publicação, totais de likes/comentários
- `contas.tsx` — YouTube funcional via OAuth; Instagram e TikTok com badge "Em breve"

### Banco de dados (Supabase)
- Migration `20260515000000_extend_posts.sql` executada:
  - Tabela `posts` (id, user_id, title, description, video_url, thumbnail_url, platforms[], scheduled_for, status, created_at, updated_at)
  - Tabela `post_results` (id, post_id, platform, social_account_id, status, platform_post_id, error_message, published_at)
  - RLS habilitado em ambas as tabelas
  - Trigger updated_at + índices

### Storage (Supabase)
- Bucket `publicacoes-media` criado (privado)
- Políticas RLS configuradas (SELECT, INSERT, DELETE por user_id)

### Edge Functions (Supabase) — deployadas
- `social_oauth_callback` — troca code OAuth, salva token + username + foto no social_accounts, redireciona de volta ao app
- `publish_post` — publica no YouTube via Data API v3 (upload de vídeo + thumbnail), renova token expirado, Instagram/TikTok retornam erro amigável
- `fetch_analytics` — busca YouTube Analytics API v2 (views, likes, comments por dia), salva em analytics_cache

### Secrets configurados (Supabase Edge Functions)
- `GOOGLE_CLIENT_ID` ✅
- `GOOGLE_CLIENT_SECRET` ✅
- `APP_URL` = `https://publicacoes-woad.vercel.app` ✅

### Vercel
- Variáveis de ambiente configuradas:
  - `VITE_SUPABASE_URL` ✅
  - `VITE_SUPABASE_ANON_KEY` ✅
  - `VITE_GOOGLE_CLIENT_ID` ✅
  - `SUPABASE_SERVICE_ROLE_KEY` ✅
- `vercel.json` com Cron Job (`* * * * *`) chamando `/api/run-scheduled`
- `api/run-scheduled.ts` — busca posts com scheduled_for <= now() e chama a Edge Function publish_post

### Google OAuth Console
- Redirect URI adicionado: `https://bgoteptsgdqwnlgqdzjg.supabase.co/functions/v1/social_oauth_callback`
- Redirect URI adicionado: `https://bgoteptsgdqwnlgqdzjg.supabase.co/auth/v1/callback`

---

## ❌ Pendente

### 1. Deploy no Vercel (BLOQUEADOR PRINCIPAL)
O webhook GitHub → Vercel não está instalado, então os novos commits não estão sendo detectados.
O Vercel ainda serve a versão antiga do código.

**Como resolver:**
```bash
# No terminal, dentro da pasta do projeto:
npx vercel login
# (autenticar no browser)
npx vercel --prod --yes
```

### 2. Ativar Google como provider no Supabase Auth
Necessário para o botão "Entrar com Google" funcionar.

**Como resolver:**
1. Acessar: https://supabase.com/dashboard/project/bgoteptsgdqwnlgqdzjg/auth/providers
2. Encontrar "Google" → Enable
3. Preencher Client ID e Client Secret
4. Salvar

### 3. Testar fluxo completo
Após o deploy funcionar:
- [ ] Login com Google
- [ ] Conectar conta YouTube em /contas
- [ ] Criar publicação em /nova-publicacao com vídeo + thumbnail + agendamento
- [ ] Verificar em /agendados se o post aparece
- [ ] Aguardar cron disparar (ou esperar a hora agendada) → verificar se publica no YouTube
- [ ] Ver métricas em /metricas após `fetch_analytics` rodar

### 4. (Futuro) Instagram e TikTok
Aguardando aprovação de conta de desenvolvedor nas respectivas plataformas.
Quando aprovado: implementar OAuth + publicação nas Edge Functions.
