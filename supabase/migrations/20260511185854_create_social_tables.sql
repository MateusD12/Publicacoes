-- Create enum for social platforms
CREATE TYPE public.social_platform AS ENUM ('youtube', 'instagram', 'tiktok');

-- Create social_accounts table
CREATE TABLE public.social_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    platform public.social_platform NOT NULL,
    account_id TEXT NOT NULL, -- ID from the social network
    username TEXT,
    profile_picture_url TEXT,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, platform, account_id)
);

-- Create posts table
CREATE TYPE public.post_status AS ENUM ('pending', 'publishing', 'published', 'failed');

CREATE TABLE public.posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    social_account_id UUID REFERENCES public.social_accounts(id) ON DELETE CASCADE,
    platform public.social_platform NOT NULL,
    content_text TEXT,
    media_url TEXT,
    status public.post_status DEFAULT 'pending',
    platform_post_id TEXT, -- ID of the post in the external network
    scheduled_for TIMESTAMP WITH TIME ZONE,
    published_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create analytics_cache table
CREATE TABLE public.analytics_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    social_account_id UUID REFERENCES public.social_accounts(id) ON DELETE CASCADE,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE, -- Nullable se forem dados gerais do canal/conta
    metric_date DATE NOT NULL,
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    raw_data JSONB, -- Para métricas especificas de cada plataforma
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(social_account_id, post_id, metric_date)
);

-- Enable RLS
ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_cache ENABLE ROW LEVEL SECURITY;

-- Policies for social_accounts
CREATE POLICY "Users can view their own social accounts" ON public.social_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own social accounts" ON public.social_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own social accounts" ON public.social_accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own social accounts" ON public.social_accounts FOR DELETE USING (auth.uid() = user_id);

-- Policies for posts
CREATE POLICY "Users can view their own posts" ON public.posts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own posts" ON public.posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own posts" ON public.posts FOR DELETE USING (auth.uid() = user_id);

-- Policies for analytics_cache
CREATE POLICY "Users can view analytics for their accounts" ON public.analytics_cache FOR SELECT USING (
    social_account_id IN (SELECT id FROM public.social_accounts WHERE user_id = auth.uid())
);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION public.update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_social_accounts_modtime BEFORE UPDATE ON public.social_accounts FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();
CREATE TRIGGER update_posts_modtime BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();
CREATE TRIGGER update_analytics_cache_modtime BEFORE UPDATE ON public.analytics_cache FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();
