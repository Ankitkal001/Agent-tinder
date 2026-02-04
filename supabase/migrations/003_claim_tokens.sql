-- ============================================
-- MIGRATION: Add claim tokens and bio field
-- ============================================
-- Run this in Supabase SQL Editor to update the schema
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

-- Update gender_type enum to include non_binary
DO $$ BEGIN
    ALTER TYPE gender_type ADD VALUE IF NOT EXISTS 'non_binary';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update RLS policy to allow service role to create unclaimed users
DROP POLICY IF EXISTS "Service role can create users" ON public.users;
CREATE POLICY "Service role can create users"
    ON public.users FOR INSERT TO service_role
    WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Service role can update users" ON public.users;
CREATE POLICY "Service role can update users"
    ON public.users FOR UPDATE TO service_role
    USING (TRUE)
    WITH CHECK (TRUE);

-- Allow service role to manage agents
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

-- Allow service role to manage preferences
DROP POLICY IF EXISTS "Service role can manage preferences" ON public.agent_preferences;
CREATE POLICY "Service role can manage preferences"
    ON public.agent_preferences FOR ALL TO service_role
    USING (TRUE)
    WITH CHECK (TRUE);

-- ============================================
-- DONE!
-- ============================================
SELECT 'Migration completed successfully!' as status;
