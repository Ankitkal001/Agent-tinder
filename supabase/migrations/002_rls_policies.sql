-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================
-- These policies enforce access control at the
-- database level. Agents are untrusted inputs.
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- ============================================
-- USERS POLICIES
-- ============================================

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
    ON public.users
    FOR SELECT
    TO authenticated
    USING (id = auth.uid());

-- Public can read basic user info (for match display)
CREATE POLICY "Public can read user display info"
    ON public.users
    FOR SELECT
    TO anon, authenticated
    USING (TRUE);

-- ============================================
-- AGENTS POLICIES
-- ============================================

-- Anyone can read active agents (for browsing)
CREATE POLICY "Anyone can read active agents"
    ON public.agents
    FOR SELECT
    TO anon, authenticated
    USING (active = TRUE);

-- Users can read their own inactive agents
CREATE POLICY "Users can read own agents"
    ON public.agents
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Users can insert their own agent
CREATE POLICY "Users can create own agent"
    ON public.agents
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Users can update their own agent
CREATE POLICY "Users can update own agent"
    ON public.agents
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- ============================================
-- AGENT_PREFERENCES POLICIES
-- ============================================

-- Public can read vibe_tags only (for discovery)
-- Note: dealbreakers and min_score are private
-- We handle this at the API level, not RLS

-- Users can read their own preferences
CREATE POLICY "Users can read own preferences"
    ON public.agent_preferences
    FOR SELECT
    TO authenticated
    USING (
        agent_id IN (
            SELECT id FROM public.agents WHERE user_id = auth.uid()
        )
    );

-- Public can read public preference fields
-- (vibe_tags only - enforced at API level)
CREATE POLICY "Public can read agent preferences"
    ON public.agent_preferences
    FOR SELECT
    TO anon, authenticated
    USING (TRUE);

-- Users can insert preferences for their own agent
CREATE POLICY "Users can create own preferences"
    ON public.agent_preferences
    FOR INSERT
    TO authenticated
    WITH CHECK (
        agent_id IN (
            SELECT id FROM public.agents WHERE user_id = auth.uid()
        )
    );

-- Users can update their own preferences
CREATE POLICY "Users can update own preferences"
    ON public.agent_preferences
    FOR UPDATE
    TO authenticated
    USING (
        agent_id IN (
            SELECT id FROM public.agents WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        agent_id IN (
            SELECT id FROM public.agents WHERE user_id = auth.uid()
        )
    );

-- ============================================
-- MATCHES POLICIES
-- ============================================

-- Matches are PUBLIC and IMMUTABLE
-- Anyone can read all matches
CREATE POLICY "Matches are public"
    ON public.matches
    FOR SELECT
    TO anon, authenticated
    USING (TRUE);

-- Only service role can insert matches
-- (No INSERT policy for authenticated users)
-- Match creation happens via Edge Functions with service role

-- No UPDATE or DELETE policies - matches are immutable

-- ============================================
-- EVENTS POLICIES
-- ============================================

-- Events are public audit log
CREATE POLICY "Events are public"
    ON public.events
    FOR SELECT
    TO anon, authenticated
    USING (TRUE);

-- Only service role can insert events
-- (No INSERT policy for authenticated users)
