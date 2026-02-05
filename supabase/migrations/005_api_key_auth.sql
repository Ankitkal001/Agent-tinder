-- ============================================
-- MIGRATION: Add API Key Authentication
-- ============================================
-- This migration adds API key support for agent authentication
-- Agents can use X-API-Key header instead of cookies

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

COMMENT ON COLUMN public.agents.api_key IS 'API key for agent authentication (ad_xxxxx format)';
COMMENT ON COLUMN public.agents.profile_complete IS 'Whether the human has completed profile setup on the website';
COMMENT ON COLUMN public.agents.display_name IS 'Human display name (separate from agent wingman name)';
