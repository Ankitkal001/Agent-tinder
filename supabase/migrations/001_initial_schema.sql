-- ============================================
-- AGENT DATING PLATFORM - DATABASE SCHEMA
-- ============================================
-- This migration creates all tables for the
-- public matchmaking platform.
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLE: users
-- ============================================
-- Human accounts linked to X (Twitter) OAuth
-- Created automatically by Supabase Auth trigger

CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    x_user_id TEXT UNIQUE NOT NULL,
    x_handle TEXT NOT NULL,
    x_avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for X user lookup
CREATE INDEX IF NOT EXISTS idx_users_x_user_id ON public.users(x_user_id);

COMMENT ON TABLE public.users IS 'Human accounts linked to X OAuth';
COMMENT ON COLUMN public.users.x_user_id IS 'Twitter/X user ID (external)';
COMMENT ON COLUMN public.users.x_handle IS 'Twitter/X handle (username)';

-- ============================================
-- TABLE: agents
-- ============================================
-- Agent profiles owned by users
-- One agent per user (for Phase 1)

CREATE TYPE gender_type AS ENUM ('male', 'female', 'other');

CREATE TABLE IF NOT EXISTS public.agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    agent_name TEXT NOT NULL,
    gender gender_type NOT NULL,
    looking_for gender_type[] NOT NULL,
    active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- One agent per user constraint
    CONSTRAINT unique_user_agent UNIQUE (user_id)
);

-- Indexes for agent queries
CREATE INDEX IF NOT EXISTS idx_agents_user_id ON public.agents(user_id);
CREATE INDEX IF NOT EXISTS idx_agents_active ON public.agents(active) WHERE active = TRUE;
CREATE INDEX IF NOT EXISTS idx_agents_gender ON public.agents(gender);

COMMENT ON TABLE public.agents IS 'Agent profiles owned by users';
COMMENT ON COLUMN public.agents.looking_for IS 'Array of genders this agent is looking for';

-- ============================================
-- TABLE: agent_preferences
-- ============================================
-- Matching preferences per agent

CREATE TABLE IF NOT EXISTS public.agent_preferences (
    agent_id UUID PRIMARY KEY REFERENCES public.agents(id) ON DELETE CASCADE,
    min_score INTEGER DEFAULT 0 NOT NULL CHECK (min_score >= 0 AND min_score <= 100),
    vibe_tags TEXT[] DEFAULT '{}' NOT NULL,
    dealbreakers TEXT[] DEFAULT '{}' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE public.agent_preferences IS 'Matching preferences per agent';
COMMENT ON COLUMN public.agent_preferences.min_score IS 'Minimum compatibility score required (0-100)';
COMMENT ON COLUMN public.agent_preferences.vibe_tags IS 'Public tags for discovery';
COMMENT ON COLUMN public.agent_preferences.dealbreakers IS 'Private dealbreaker criteria';

-- ============================================
-- TABLE: matches
-- ============================================
-- Immutable, public match records
-- Created ONLY by the platform after validation

CREATE TABLE IF NOT EXISTS public.matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_a UUID NOT NULL REFERENCES public.agents(id) ON DELETE RESTRICT,
    agent_b UUID NOT NULL REFERENCES public.agents(id) ON DELETE RESTRICT,
    compatibility_score INTEGER NOT NULL CHECK (compatibility_score >= 0 AND compatibility_score <= 100),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Prevent duplicate matches (order-independent)
    CONSTRAINT unique_match_pair UNIQUE (agent_a, agent_b),
    -- Prevent self-matching
    CONSTRAINT no_self_match CHECK (agent_a != agent_b),
    -- Ensure consistent ordering (agent_a < agent_b lexicographically)
    CONSTRAINT ordered_agents CHECK (agent_a < agent_b)
);

-- Indexes for match queries
CREATE INDEX IF NOT EXISTS idx_matches_agent_a ON public.matches(agent_a);
CREATE INDEX IF NOT EXISTS idx_matches_agent_b ON public.matches(agent_b);
CREATE INDEX IF NOT EXISTS idx_matches_created_at ON public.matches(created_at DESC);

COMMENT ON TABLE public.matches IS 'Immutable, public match records';
COMMENT ON COLUMN public.matches.compatibility_score IS 'Platform-validated compatibility score';

-- ============================================
-- TABLE: events
-- ============================================
-- Audit log of platform events

CREATE TYPE event_type AS ENUM ('MATCH_CREATED', 'AGENT_REGISTERED', 'AGENT_DEACTIVATED');

CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type event_type NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for event queries
CREATE INDEX IF NOT EXISTS idx_events_type ON public.events(type);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON public.events(created_at DESC);

COMMENT ON TABLE public.events IS 'Audit log of platform events';

-- ============================================
-- FUNCTION: Update timestamp trigger
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to agent_preferences
CREATE TRIGGER update_agent_preferences_updated_at
    BEFORE UPDATE ON public.agent_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNCTION: Handle new user from auth
-- ============================================
-- This function syncs auth.users to public.users
-- when a new user signs up via X OAuth

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, x_user_id, x_handle, x_avatar_url)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'provider_id',
        COALESCE(NEW.raw_user_meta_data->>'user_name', NEW.raw_user_meta_data->>'preferred_username', 'unknown'),
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO UPDATE SET
        x_handle = EXCLUDED.x_handle,
        x_avatar_url = EXCLUDED.x_avatar_url;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to sync auth.users to public.users
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
