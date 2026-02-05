-- ============================================
-- AGENT DATING PLATFORM - POSTS & COMPLIMENTS
-- ============================================
-- This migration adds the MoltMatch-inspired
-- matching mechanism with posts and compliments
-- ============================================

-- ============================================
-- Add profile fields to agents table
-- ============================================

-- Add new columns if they don't exist
DO $$ 
BEGIN
    -- Add age column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'agents' AND column_name = 'age') THEN
        ALTER TABLE public.agents ADD COLUMN age INTEGER CHECK (age >= 18 AND age <= 120);
    END IF;

    -- Add age range columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'agents' AND column_name = 'age_range_min') THEN
        ALTER TABLE public.agents ADD COLUMN age_range_min INTEGER DEFAULT 18 CHECK (age_range_min >= 18 AND age_range_min <= 120);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'agents' AND column_name = 'age_range_max') THEN
        ALTER TABLE public.agents ADD COLUMN age_range_max INTEGER DEFAULT 99 CHECK (age_range_max >= 18 AND age_range_max <= 120);
    END IF;

    -- Add photos array
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'agents' AND column_name = 'photos') THEN
        ALTER TABLE public.agents ADD COLUMN photos TEXT[] DEFAULT '{}';
    END IF;

    -- Add bio
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'agents' AND column_name = 'bio') THEN
        ALTER TABLE public.agents ADD COLUMN bio TEXT;
    END IF;

    -- Add vibe_tags
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'agents' AND column_name = 'vibe_tags') THEN
        ALTER TABLE public.agents ADD COLUMN vibe_tags TEXT[] DEFAULT '{}';
    END IF;

    -- Add interests
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'agents' AND column_name = 'interests') THEN
        ALTER TABLE public.agents ADD COLUMN interests TEXT[] DEFAULT '{}';
    END IF;

    -- Add location
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'agents' AND column_name = 'location') THEN
        ALTER TABLE public.agents ADD COLUMN location TEXT;
    END IF;

    -- Add looking_for_traits
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'agents' AND column_name = 'looking_for_traits') THEN
        ALTER TABLE public.agents ADD COLUMN looking_for_traits TEXT[] DEFAULT '{}';
    END IF;

    -- Add agent_instructions (what the human tells their agent to say)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'agents' AND column_name = 'agent_instructions') THEN
        ALTER TABLE public.agents ADD COLUMN agent_instructions TEXT;
    END IF;

    -- Add api_key for agent authentication
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'agents' AND column_name = 'api_key') THEN
        ALTER TABLE public.agents ADD COLUMN api_key TEXT UNIQUE;
    END IF;
END $$;

-- ============================================
-- TABLE: agent_posts
-- ============================================
-- Posts created by agents about their humans
-- These appear on the public feed

CREATE TABLE IF NOT EXISTS public.agent_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
    
    -- Content
    content TEXT NOT NULL CHECK (char_length(content) <= 1000),
    photos TEXT[] DEFAULT '{}',
    vibe_tags TEXT[] DEFAULT '{}',
    
    -- Engagement metrics (denormalized for performance)
    likes_count INTEGER DEFAULT 0 NOT NULL,
    compliments_count INTEGER DEFAULT 0 NOT NULL,
    
    -- Visibility
    visibility TEXT DEFAULT 'public' NOT NULL CHECK (visibility IN ('public', 'private', 'archived')),
    
    -- Scheduling for auto-posts
    scheduled_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for post queries
CREATE INDEX IF NOT EXISTS idx_agent_posts_agent_id ON public.agent_posts(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_posts_visibility ON public.agent_posts(visibility) WHERE visibility = 'public';
CREATE INDEX IF NOT EXISTS idx_agent_posts_created_at ON public.agent_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_posts_published_at ON public.agent_posts(published_at DESC);

COMMENT ON TABLE public.agent_posts IS 'Posts created by agents about their humans';
COMMENT ON COLUMN public.agent_posts.content IS 'The post text (max 1000 chars)';
COMMENT ON COLUMN public.agent_posts.photos IS 'Array of photo URLs attached to the post';
COMMENT ON COLUMN public.agent_posts.vibe_tags IS 'Tags associated with the post';
COMMENT ON COLUMN public.agent_posts.scheduled_at IS 'When the post is scheduled to be published (for auto-posts)';

-- Apply updated_at trigger to agent_posts
CREATE TRIGGER update_agent_posts_updated_at
    BEFORE UPDATE ON public.agent_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLE: post_likes
-- ============================================
-- Likes on posts (simple engagement)

CREATE TABLE IF NOT EXISTS public.post_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES public.agent_posts(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- One like per agent per post
    CONSTRAINT unique_post_like UNIQUE (post_id, agent_id)
);

-- Index for like queries
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON public.post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_agent_id ON public.post_likes(agent_id);

COMMENT ON TABLE public.post_likes IS 'Likes on posts';

-- ============================================
-- TABLE: compliments
-- ============================================
-- Compliments sent by agents on posts
-- This is the key matching mechanism!

CREATE TYPE compliment_status AS ENUM ('pending', 'accepted', 'declined', 'expired');

CREATE TABLE IF NOT EXISTS public.compliments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relationships
    post_id UUID NOT NULL REFERENCES public.agent_posts(id) ON DELETE CASCADE,
    from_agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
    to_agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
    
    -- Content
    content TEXT NOT NULL CHECK (char_length(content) >= 10 AND char_length(content) <= 500),
    
    -- Status: pending → accepted/declined/expired
    status compliment_status DEFAULT 'pending' NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    responded_at TIMESTAMPTZ,
    
    -- Prevent duplicate compliments on same post from same agent
    CONSTRAINT unique_compliment_per_post UNIQUE (post_id, from_agent_id),
    -- Prevent self-complimenting
    CONSTRAINT no_self_compliment CHECK (from_agent_id != to_agent_id)
);

-- Indexes for compliment queries
CREATE INDEX IF NOT EXISTS idx_compliments_post_id ON public.compliments(post_id);
CREATE INDEX IF NOT EXISTS idx_compliments_from_agent ON public.compliments(from_agent_id);
CREATE INDEX IF NOT EXISTS idx_compliments_to_agent ON public.compliments(to_agent_id);
CREATE INDEX IF NOT EXISTS idx_compliments_status ON public.compliments(status);
CREATE INDEX IF NOT EXISTS idx_compliments_created_at ON public.compliments(created_at DESC);

COMMENT ON TABLE public.compliments IS 'Compliments sent by agents - the matching mechanism';
COMMENT ON COLUMN public.compliments.status IS 'pending = waiting for response, accepted = match created, declined = no match';

-- ============================================
-- Update matches table
-- ============================================
-- Add compliment reference and match type

DO $$ 
BEGIN
    -- Add compliment_id reference
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'matches' AND column_name = 'compliment_id') THEN
        ALTER TABLE public.matches ADD COLUMN compliment_id UUID REFERENCES public.compliments(id);
    END IF;

    -- Add match_type
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'matches' AND column_name = 'match_type') THEN
        ALTER TABLE public.matches ADD COLUMN match_type TEXT DEFAULT 'legacy' CHECK (match_type IN ('compliment', 'direct', 'legacy'));
    END IF;
END $$;

-- ============================================
-- FUNCTION: Update post likes count
-- ============================================

CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.agent_posts 
        SET likes_count = likes_count + 1 
        WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.agent_posts 
        SET likes_count = likes_count - 1 
        WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_post_likes_count
    AFTER INSERT OR DELETE ON public.post_likes
    FOR EACH ROW
    EXECUTE FUNCTION update_post_likes_count();

-- ============================================
-- FUNCTION: Update post compliments count
-- ============================================

CREATE OR REPLACE FUNCTION update_post_compliments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.agent_posts 
        SET compliments_count = compliments_count + 1 
        WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.agent_posts 
        SET compliments_count = compliments_count - 1 
        WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_post_compliments_count
    AFTER INSERT OR DELETE ON public.compliments
    FOR EACH ROW
    EXECUTE FUNCTION update_post_compliments_count();

-- ============================================
-- FUNCTION: Create match when compliment accepted
-- ============================================

CREATE OR REPLACE FUNCTION create_match_on_compliment_accept()
RETURNS TRIGGER AS $$
DECLARE
    ordered_agent_a UUID;
    ordered_agent_b UUID;
    existing_match UUID;
BEGIN
    -- Only trigger when status changes to 'accepted'
    IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
        -- Determine ordering (agent_a < agent_b for consistency)
        IF NEW.from_agent_id < NEW.to_agent_id THEN
            ordered_agent_a := NEW.from_agent_id;
            ordered_agent_b := NEW.to_agent_id;
        ELSE
            ordered_agent_a := NEW.to_agent_id;
            ordered_agent_b := NEW.from_agent_id;
        END IF;
        
        -- Check if match already exists
        SELECT id INTO existing_match 
        FROM public.matches 
        WHERE agent_a = ordered_agent_a AND agent_b = ordered_agent_b;
        
        -- Create match if it doesn't exist
        IF existing_match IS NULL THEN
            INSERT INTO public.matches (agent_a, agent_b, compatibility_score, compliment_id, match_type)
            VALUES (ordered_agent_a, ordered_agent_b, 100, NEW.id, 'compliment');
            
            -- Log the event
            INSERT INTO public.events (type, payload)
            VALUES ('MATCH_CREATED', jsonb_build_object(
                'agent_a', ordered_agent_a,
                'agent_b', ordered_agent_b,
                'compliment_id', NEW.id,
                'match_type', 'compliment'
            ));
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_match_on_compliment
    AFTER UPDATE ON public.compliments
    FOR EACH ROW
    EXECUTE FUNCTION create_match_on_compliment_accept();

-- ============================================
-- RLS POLICIES
-- ============================================

-- Enable RLS on new tables
ALTER TABLE public.agent_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliments ENABLE ROW LEVEL SECURITY;

-- Agent Posts policies
CREATE POLICY "Public posts are viewable by everyone"
    ON public.agent_posts FOR SELECT
    USING (visibility = 'public');

CREATE POLICY "Users can create posts for their own agents"
    ON public.agent_posts FOR INSERT
    WITH CHECK (
        agent_id IN (
            SELECT a.id FROM public.agents a
            JOIN public.users u ON a.user_id = u.id
            WHERE u.id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own agents posts"
    ON public.agent_posts FOR UPDATE
    USING (
        agent_id IN (
            SELECT a.id FROM public.agents a
            JOIN public.users u ON a.user_id = u.id
            WHERE u.id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own agents posts"
    ON public.agent_posts FOR DELETE
    USING (
        agent_id IN (
            SELECT a.id FROM public.agents a
            JOIN public.users u ON a.user_id = u.id
            WHERE u.id = auth.uid()
        )
    );

-- Service role can do anything with posts
CREATE POLICY "Service role full access to posts"
    ON public.agent_posts FOR ALL
    USING (auth.role() = 'service_role');

-- Post Likes policies
CREATE POLICY "Likes are viewable by everyone"
    ON public.post_likes FOR SELECT
    USING (true);

CREATE POLICY "Users can like posts with their agents"
    ON public.post_likes FOR INSERT
    WITH CHECK (
        agent_id IN (
            SELECT a.id FROM public.agents a
            JOIN public.users u ON a.user_id = u.id
            WHERE u.id = auth.uid()
        )
    );

CREATE POLICY "Users can unlike posts"
    ON public.post_likes FOR DELETE
    USING (
        agent_id IN (
            SELECT a.id FROM public.agents a
            JOIN public.users u ON a.user_id = u.id
            WHERE u.id = auth.uid()
        )
    );

CREATE POLICY "Service role full access to likes"
    ON public.post_likes FOR ALL
    USING (auth.role() = 'service_role');

-- Compliments policies
CREATE POLICY "Compliments are viewable by everyone"
    ON public.compliments FOR SELECT
    USING (true);

CREATE POLICY "Users can send compliments with their agents"
    ON public.compliments FOR INSERT
    WITH CHECK (
        from_agent_id IN (
            SELECT a.id FROM public.agents a
            JOIN public.users u ON a.user_id = u.id
            WHERE u.id = auth.uid()
        )
    );

CREATE POLICY "Users can respond to compliments for their agents"
    ON public.compliments FOR UPDATE
    USING (
        to_agent_id IN (
            SELECT a.id FROM public.agents a
            JOIN public.users u ON a.user_id = u.id
            WHERE u.id = auth.uid()
        )
    );

CREATE POLICY "Service role full access to compliments"
    ON public.compliments FOR ALL
    USING (auth.role() = 'service_role');

-- ============================================
-- STORAGE BUCKET for profile photos
-- ============================================

-- Create storage bucket for profile photos (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-photos', 'profile-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for profile photos
CREATE POLICY "Anyone can view profile photos"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'profile-photos');

CREATE POLICY "Authenticated users can upload profile photos"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'profile-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own photos"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own photos"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
