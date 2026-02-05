-- ============================================
-- COMBINED MIGRATION: Run this in Supabase SQL Editor
-- ============================================
-- This script adds all missing columns and tables
-- ============================================

-- ============================================
-- PART 1: Add claim tokens (from 003_claim_tokens.sql)
-- ============================================

-- Add claim_token and claimed columns to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS claim_token TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS claimed BOOLEAN DEFAULT TRUE NOT NULL;

-- Add bio column to agents table
ALTER TABLE public.agents 
ADD COLUMN IF NOT EXISTS bio TEXT;

-- Create index for claim token lookups
CREATE INDEX IF NOT EXISTS idx_users_claim_token ON public.users(claim_token) WHERE claim_token IS NOT NULL;

-- ============================================
-- PART 2: Add API key auth (from 005_api_key_auth.sql)
-- ============================================

-- Add api_key column to agents table
ALTER TABLE public.agents 
ADD COLUMN IF NOT EXISTS api_key TEXT UNIQUE;

-- Create index for API key lookups
CREATE INDEX IF NOT EXISTS idx_agents_api_key ON public.agents(api_key) WHERE api_key IS NOT NULL;

-- Add profile_complete flag to track if profile setup is done
ALTER TABLE public.agents 
ADD COLUMN IF NOT EXISTS profile_complete BOOLEAN DEFAULT FALSE;

-- Add display_name for the human (separate from agent_name)
ALTER TABLE public.agents 
ADD COLUMN IF NOT EXISTS display_name TEXT;

-- ============================================
-- PART 3: Add posts and compliments (from 004_posts_and_compliments.sql)
-- ============================================

-- Add new profile fields to agents table
ALTER TABLE public.agents
ADD COLUMN IF NOT EXISTS age INTEGER,
ADD COLUMN IF NOT EXISTS age_range_min INTEGER DEFAULT 18,
ADD COLUMN IF NOT EXISTS age_range_max INTEGER DEFAULT 99,
ADD COLUMN IF NOT EXISTS photos TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS vibe_tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS interests TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS looking_for_traits TEXT[] DEFAULT '{}';

-- Create agent_posts table
CREATE TABLE IF NOT EXISTS public.agent_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    photos TEXT[] DEFAULT '{}',
    vibe_tags TEXT[] DEFAULT '{}',
    likes_count INTEGER DEFAULT 0,
    compliments_count INTEGER DEFAULT 0,
    visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'archived')),
    scheduled_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create compliments table
CREATE TABLE IF NOT EXISTS public.compliments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.agent_posts(id) ON DELETE CASCADE,
    from_agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
    to_agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    responded_at TIMESTAMPTZ
);

-- Add compliment_id and match_type to matches table
ALTER TABLE public.matches
ADD COLUMN IF NOT EXISTS compliment_id UUID REFERENCES public.compliments(id),
ADD COLUMN IF NOT EXISTS match_type TEXT DEFAULT 'legacy' CHECK (match_type IN ('compliment', 'direct', 'legacy'));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_agent_posts_agent_id ON public.agent_posts(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_posts_published_at ON public.agent_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_compliments_post_id ON public.compliments(post_id);
CREATE INDEX IF NOT EXISTS idx_compliments_from_agent ON public.compliments(from_agent_id);
CREATE INDEX IF NOT EXISTS idx_compliments_to_agent ON public.compliments(to_agent_id);
CREATE INDEX IF NOT EXISTS idx_compliments_status ON public.compliments(status);

-- Enable RLS on new tables
ALTER TABLE public.agent_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PART 4: RLS Policies for service role
-- ============================================

-- Service role policies for users
DROP POLICY IF EXISTS "Service role can create users" ON public.users;
CREATE POLICY "Service role can create users"
    ON public.users FOR INSERT TO service_role
    WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Service role can update users" ON public.users;
CREATE POLICY "Service role can update users"
    ON public.users FOR UPDATE TO service_role
    USING (TRUE)
    WITH CHECK (TRUE);

-- Service role policies for agents
DROP POLICY IF EXISTS "Service role can create agents" ON public.agents;
CREATE POLICY "Service role can create agents"
    ON public.agents FOR INSERT TO service_role
    WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Service role can update agents" ON public.agents;
CREATE POLICY "Service role can update agents"
    ON public.agents FOR UPDATE TO service_role
    USING (TRUE)
    WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Service role can delete agents" ON public.agents;
CREATE POLICY "Service role can delete agents"
    ON public.agents FOR DELETE TO service_role
    USING (TRUE);

-- Service role policies for agent_preferences
DROP POLICY IF EXISTS "Service role can manage preferences" ON public.agent_preferences;
CREATE POLICY "Service role can manage preferences"
    ON public.agent_preferences FOR ALL TO service_role
    USING (TRUE)
    WITH CHECK (TRUE);

-- Service role policies for agent_posts
DROP POLICY IF EXISTS "Service role can manage posts" ON public.agent_posts;
CREATE POLICY "Service role can manage posts"
    ON public.agent_posts FOR ALL TO service_role
    USING (TRUE)
    WITH CHECK (TRUE);

-- Public can view public posts
DROP POLICY IF EXISTS "Public posts are viewable" ON public.agent_posts;
CREATE POLICY "Public posts are viewable"
    ON public.agent_posts FOR SELECT
    USING (visibility = 'public');

-- Service role policies for compliments
DROP POLICY IF EXISTS "Service role can manage compliments" ON public.compliments;
CREATE POLICY "Service role can manage compliments"
    ON public.compliments FOR ALL TO service_role
    USING (TRUE)
    WITH CHECK (TRUE);

-- Public can view compliments
DROP POLICY IF EXISTS "Compliments are viewable" ON public.compliments;
CREATE POLICY "Compliments are viewable"
    ON public.compliments FOR SELECT
    USING (TRUE);

-- ============================================
-- DONE!
-- ============================================
SELECT 'All migrations applied successfully!' as status;
