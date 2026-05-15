-- Drop old posts table if exists and recreate properly
DROP TABLE IF EXISTS post_results;
DROP TABLE IF EXISTS posts;

-- Enum types
DO $$ BEGIN
  CREATE TYPE post_status AS ENUM ('draft','scheduled','publishing','published','failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE result_status AS ENUM ('pending','publishing','published','failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Posts (one per content piece, can target multiple platforms)
CREATE TABLE IF NOT EXISTS posts (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title          TEXT NOT NULL DEFAULT '',
  description    TEXT NOT NULL DEFAULT '',
  video_url      TEXT,
  thumbnail_url  TEXT,
  platforms      TEXT[] NOT NULL DEFAULT '{}',
  scheduled_for  TIMESTAMPTZ,
  status         post_status NOT NULL DEFAULT 'draft',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Post results (one row per platform per post)
CREATE TABLE IF NOT EXISTS post_results (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id           UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  platform          TEXT NOT NULL,
  social_account_id UUID REFERENCES social_accounts(id) ON DELETE SET NULL,
  status            result_status NOT NULL DEFAULT 'pending',
  platform_post_id  TEXT,
  error_message     TEXT,
  published_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Updated_at trigger for posts
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS posts_updated_at ON posts;
CREATE TRIGGER posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "posts_owner" ON posts
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "post_results_owner" ON post_results
  USING (EXISTS (SELECT 1 FROM posts p WHERE p.id = post_id AND p.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM posts p WHERE p.id = post_id AND p.user_id = auth.uid()));

-- Indexes
CREATE INDEX IF NOT EXISTS posts_user_status ON posts(user_id, status);
CREATE INDEX IF NOT EXISTS posts_scheduled    ON posts(scheduled_for) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS post_results_post  ON post_results(post_id);
