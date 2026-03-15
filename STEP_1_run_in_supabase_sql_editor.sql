-- ════════════════════════════════════════════════════════════════════
-- AdForge — Complete Supabase Schema + Row Level Security
-- ════════════════════════════════════════════════════════════════════
-- HOW TO RUN:
--   1. Go to https://supabase.com → your project
--   2. Click "SQL Editor" in left sidebar
--   3. Click "New query"
--   4. Paste this ENTIRE file and click "Run" (Ctrl+Enter)
-- ════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Shared trigger: keep updated_at current ──────────────────────────
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ════════════════════════════════════════════════════════════════════
-- TABLE: users (profiles)
-- One row per Supabase auth user. Auto-created on signup via trigger.
-- Stores the brand name shown in the app sidebar.
-- ════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  full_name   TEXT NOT NULL DEFAULT '',
  brand_name  TEXT NOT NULL DEFAULT '',
  plan        TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free','pro','agency')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Auto-insert profile row when a new auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, brand_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'brand_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ════════════════════════════════════════════════════════════════════
-- TABLE: connected_accounts
-- OAuth tokens for Meta/TikTok/Google per user.
-- UNIQUE(user_id, platform) → one row per platform per user.
-- Two different users CANNOT see each other's tokens via RLS below.
-- ════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.connected_accounts (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  platform         TEXT NOT NULL CHECK (platform IN ('meta','tiktok','google','instagram')),
  account_name     TEXT,
  platform_user_id TEXT,
  access_token     TEXT,
  ad_account_ids   JSONB NOT NULL DEFAULT '[]',
  status           TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','expired','disconnected')),
  connected_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, platform)
);

CREATE OR REPLACE TRIGGER trg_connected_accounts_updated_at
  BEFORE UPDATE ON public.connected_accounts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- ════════════════════════════════════════════════════════════════════
-- TABLE: campaigns
-- Ad campaigns synced from real ad platforms, scoped per user.
-- UNIQUE(user_id, platform, platform_id) prevents duplicate syncs.
-- ════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.campaigns (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  platform        TEXT NOT NULL,
  platform_id     TEXT NOT NULL,
  name            TEXT NOT NULL,
  status          TEXT DEFAULT 'PAUSED',
  objective       TEXT,
  daily_budget    NUMERIC(12,2),
  -- Latest synced metrics (updated on each sync)
  impressions     BIGINT DEFAULT 0,
  clicks          BIGINT DEFAULT 0,
  ctr             NUMERIC(8,4) DEFAULT 0,
  cpc             NUMERIC(10,4) DEFAULT 0,
  spend           NUMERIC(12,2) DEFAULT 0,
  conversions     INTEGER DEFAULT 0,
  cost_per_conv   NUMERIC(10,2),
  revenue         NUMERIC(12,2) DEFAULT 0,
  roas            NUMERIC(8,4),
  start_date      DATE,
  synced_at       TIMESTAMPTZ DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, platform, platform_id)
);

CREATE OR REPLACE TRIGGER trg_campaigns_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_campaigns_user ON public.campaigns(user_id);


-- ════════════════════════════════════════════════════════════════════
-- TABLE: creatives
-- AI-generated images, copy, and video boards per user.
-- ════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.creatives (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('image','copy','video')),
  platform    TEXT,
  title       TEXT,
  content     TEXT,    -- image URL, or JSON string for copy/video
  prompt      TEXT,
  style       TEXT,
  status      TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  metadata    JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE TRIGGER trg_creatives_updated_at
  BEFORE UPDATE ON public.creatives
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_creatives_user ON public.creatives(user_id);


-- ════════════════════════════════════════════════════════════════════
-- TABLE: analytics
-- Time-series performance snapshots. One row per sync per platform.
-- ════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.analytics (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  campaign_id   UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  platform      TEXT NOT NULL,
  date_range    TEXT,
  impressions   BIGINT DEFAULT 0,
  clicks        BIGINT DEFAULT 0,
  ctr           NUMERIC(8,4) DEFAULT 0,
  cpc           NUMERIC(10,4) DEFAULT 0,
  spend         NUMERIC(12,2) DEFAULT 0,
  conversions   INTEGER DEFAULT 0,
  revenue       NUMERIC(12,2) DEFAULT 0,
  roas          NUMERIC(8,4),
  reach         BIGINT DEFAULT 0,
  fetched_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_user    ON public.analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_fetched ON public.analytics(fetched_at DESC);


-- ════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- THIS IS THE KEY FIX for "different logins showing the same data".
-- Every table is locked so auth.uid() must equal user_id.
-- User A literally cannot query User B's rows — the DB rejects it.
-- ════════════════════════════════════════════════════════════════════

ALTER TABLE public.users               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connected_accounts  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creatives           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics           ENABLE ROW LEVEL SECURITY;

-- users: see and update only your own row
DROP POLICY IF EXISTS "users_select_own" ON public.users;
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "users_update_own" ON public.users;
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- connected_accounts: full access, own rows only
DROP POLICY IF EXISTS "connected_accounts_all_own" ON public.connected_accounts;
CREATE POLICY "connected_accounts_all_own" ON public.connected_accounts
  FOR ALL USING (auth.uid() = user_id);

-- campaigns: full access, own rows only
DROP POLICY IF EXISTS "campaigns_all_own" ON public.campaigns;
CREATE POLICY "campaigns_all_own" ON public.campaigns
  FOR ALL USING (auth.uid() = user_id);

-- creatives: full access, own rows only
DROP POLICY IF EXISTS "creatives_all_own" ON public.creatives;
CREATE POLICY "creatives_all_own" ON public.creatives
  FOR ALL USING (auth.uid() = user_id);

-- analytics: read + insert own rows only
DROP POLICY IF EXISTS "analytics_select_own" ON public.analytics;
CREATE POLICY "analytics_select_own" ON public.analytics
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "analytics_insert_own" ON public.analytics;
CREATE POLICY "analytics_insert_own" ON public.analytics
  FOR INSERT WITH CHECK (auth.uid() = user_id);


-- ════════════════════════════════════════════════════════════════════
-- VERIFY INSTALLATION
-- ════════════════════════════════════════════════════════════════════
SELECT
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('users','connected_accounts','campaigns','creatives','analytics')
ORDER BY tablename;

-- Expected output: 5 rows, all with rls_enabled = true
