// Script to apply database schema to Supabase
// Run with: node scripts/apply-schema.mjs

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const supabaseUrl = 'https://xmzlporjsjtdlphhoxzf.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhtemxwb3Jqc2p0ZGxwaGhveHpmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDIxMDYzOCwiZXhwIjoyMDg1Nzg2NjM4fQ.nwr3Kvkr2Erf4TlFNBzka5jPJAsEkqqMNvTgUorC-nM'

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Split SQL into individual statements and execute them
const sqlStatements = [
  // Enable UUID extension
  `CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`,

  // Create users table
  `CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    x_user_id TEXT UNIQUE NOT NULL,
    x_handle TEXT NOT NULL,
    x_avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
  )`,

  // Create index on users
  `CREATE INDEX IF NOT EXISTS idx_users_x_user_id ON public.users(x_user_id)`,

  // Create gender_type enum
  `DO $$ BEGIN
    CREATE TYPE gender_type AS ENUM ('male', 'female', 'other');
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$`,

  // Create agents table
  `CREATE TABLE IF NOT EXISTS public.agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    agent_name TEXT NOT NULL,
    gender gender_type NOT NULL,
    looking_for gender_type[] NOT NULL,
    active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_user_agent UNIQUE (user_id)
  )`,

  // Create indexes on agents
  `CREATE INDEX IF NOT EXISTS idx_agents_user_id ON public.agents(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_agents_active ON public.agents(active) WHERE active = TRUE`,
  `CREATE INDEX IF NOT EXISTS idx_agents_gender ON public.agents(gender)`,

  // Create agent_preferences table
  `CREATE TABLE IF NOT EXISTS public.agent_preferences (
    agent_id UUID PRIMARY KEY REFERENCES public.agents(id) ON DELETE CASCADE,
    min_score INTEGER DEFAULT 0 NOT NULL CHECK (min_score >= 0 AND min_score <= 100),
    vibe_tags TEXT[] DEFAULT '{}' NOT NULL,
    dealbreakers TEXT[] DEFAULT '{}' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
  )`,

  // Create matches table
  `CREATE TABLE IF NOT EXISTS public.matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_a UUID NOT NULL REFERENCES public.agents(id) ON DELETE RESTRICT,
    agent_b UUID NOT NULL REFERENCES public.agents(id) ON DELETE RESTRICT,
    compatibility_score INTEGER NOT NULL CHECK (compatibility_score >= 0 AND compatibility_score <= 100),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_match_pair UNIQUE (agent_a, agent_b),
    CONSTRAINT no_self_match CHECK (agent_a != agent_b),
    CONSTRAINT ordered_agents CHECK (agent_a < agent_b)
  )`,

  // Create indexes on matches
  `CREATE INDEX IF NOT EXISTS idx_matches_agent_a ON public.matches(agent_a)`,
  `CREATE INDEX IF NOT EXISTS idx_matches_agent_b ON public.matches(agent_b)`,
  `CREATE INDEX IF NOT EXISTS idx_matches_created_at ON public.matches(created_at DESC)`,

  // Create event_type enum
  `DO $$ BEGIN
    CREATE TYPE event_type AS ENUM ('MATCH_CREATED', 'AGENT_REGISTERED', 'AGENT_DEACTIVATED');
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$`,

  // Create events table
  `CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type event_type NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
  )`,

  // Create indexes on events
  `CREATE INDEX IF NOT EXISTS idx_events_type ON public.events(type)`,
  `CREATE INDEX IF NOT EXISTS idx_events_created_at ON public.events(created_at DESC)`,

  // Create update_updated_at function
  `CREATE OR REPLACE FUNCTION update_updated_at_column()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql`,

  // Create trigger for agent_preferences
  `DROP TRIGGER IF EXISTS update_agent_preferences_updated_at ON public.agent_preferences`,
  `CREATE TRIGGER update_agent_preferences_updated_at
    BEFORE UPDATE ON public.agent_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column()`,

  // Create handle_new_user function
  `CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS TRIGGER AS $$
  BEGIN
    INSERT INTO public.users (id, x_user_id, x_handle, x_avatar_url)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'provider_id', NEW.id::text),
      COALESCE(NEW.raw_user_meta_data->>'user_name', NEW.raw_user_meta_data->>'preferred_username', 'unknown'),
      NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO UPDATE SET
      x_handle = EXCLUDED.x_handle,
      x_avatar_url = EXCLUDED.x_avatar_url;
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER`,

  // Create trigger for auth.users
  `DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users`,
  `CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user()`,

  // Enable RLS
  `ALTER TABLE public.users ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE public.agent_preferences ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE public.events ENABLE ROW LEVEL SECURITY`,

  // Users policies
  `DROP POLICY IF EXISTS "Users can read own profile" ON public.users`,
  `CREATE POLICY "Users can read own profile" ON public.users FOR SELECT TO authenticated USING (id = auth.uid())`,
  `DROP POLICY IF EXISTS "Public can read user display info" ON public.users`,
  `CREATE POLICY "Public can read user display info" ON public.users FOR SELECT TO anon, authenticated USING (TRUE)`,

  // Agents policies
  `DROP POLICY IF EXISTS "Anyone can read active agents" ON public.agents`,
  `CREATE POLICY "Anyone can read active agents" ON public.agents FOR SELECT TO anon, authenticated USING (active = TRUE)`,
  `DROP POLICY IF EXISTS "Users can read own agents" ON public.agents`,
  `CREATE POLICY "Users can read own agents" ON public.agents FOR SELECT TO authenticated USING (user_id = auth.uid())`,
  `DROP POLICY IF EXISTS "Users can create own agent" ON public.agents`,
  `CREATE POLICY "Users can create own agent" ON public.agents FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid())`,
  `DROP POLICY IF EXISTS "Users can update own agent" ON public.agents`,
  `CREATE POLICY "Users can update own agent" ON public.agents FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())`,

  // Agent preferences policies
  `DROP POLICY IF EXISTS "Users can read own preferences" ON public.agent_preferences`,
  `CREATE POLICY "Users can read own preferences" ON public.agent_preferences FOR SELECT TO authenticated USING (agent_id IN (SELECT id FROM public.agents WHERE user_id = auth.uid()))`,
  `DROP POLICY IF EXISTS "Public can read agent preferences" ON public.agent_preferences`,
  `CREATE POLICY "Public can read agent preferences" ON public.agent_preferences FOR SELECT TO anon, authenticated USING (TRUE)`,
  `DROP POLICY IF EXISTS "Users can create own preferences" ON public.agent_preferences`,
  `CREATE POLICY "Users can create own preferences" ON public.agent_preferences FOR INSERT TO authenticated WITH CHECK (agent_id IN (SELECT id FROM public.agents WHERE user_id = auth.uid()))`,
  `DROP POLICY IF EXISTS "Users can update own preferences" ON public.agent_preferences`,
  `CREATE POLICY "Users can update own preferences" ON public.agent_preferences FOR UPDATE TO authenticated USING (agent_id IN (SELECT id FROM public.agents WHERE user_id = auth.uid())) WITH CHECK (agent_id IN (SELECT id FROM public.agents WHERE user_id = auth.uid()))`,

  // Matches policies
  `DROP POLICY IF EXISTS "Matches are public" ON public.matches`,
  `CREATE POLICY "Matches are public" ON public.matches FOR SELECT TO anon, authenticated USING (TRUE)`,

  // Events policies
  `DROP POLICY IF EXISTS "Events are public" ON public.events`,
  `CREATE POLICY "Events are public" ON public.events FOR SELECT TO anon, authenticated USING (TRUE)`,
]

async function applySchema() {
  console.log('Applying database schema to Supabase...\n')

  for (let i = 0; i < sqlStatements.length; i++) {
    const sql = sqlStatements[i]
    const preview = sql.substring(0, 60).replace(/\n/g, ' ') + '...'
    
    try {
      const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })
      
      if (error) {
        // Try direct query for simple statements
        const { error: error2 } = await supabase.from('_temp').select().limit(0)
        console.log(`[${i + 1}/${sqlStatements.length}] ⚠️  ${preview}`)
        console.log(`   Note: RPC not available, schema must be applied via SQL Editor`)
      } else {
        console.log(`[${i + 1}/${sqlStatements.length}] ✓ ${preview}`)
      }
    } catch (err) {
      console.log(`[${i + 1}/${sqlStatements.length}] ⚠️  ${preview}`)
    }
  }

  console.log('\n⚠️  The Supabase client cannot execute DDL statements directly.')
  console.log('Please run the SQL schema manually in the Supabase SQL Editor:')
  console.log('https://supabase.com/dashboard/project/xmzlporjsjtdlphhoxzf/sql/new')
}

// Test connection first
async function testConnection() {
  console.log('Testing Supabase connection...')
  
  // Try to query - this will tell us if tables exist
  const { data, error } = await supabase.from('users').select('count').limit(1)
  
  if (error && error.code === 'PGRST204') {
    console.log('✓ Connected to Supabase')
    console.log('⚠️  Tables do not exist yet - schema needs to be applied\n')
    return false
  } else if (error && error.message.includes('does not exist')) {
    console.log('✓ Connected to Supabase')
    console.log('⚠️  Tables do not exist yet - schema needs to be applied\n')
    return false
  } else if (error) {
    console.log('✓ Connected to Supabase')
    console.log(`⚠️  Query result: ${error.message}\n`)
    return false
  } else {
    console.log('✓ Connected to Supabase')
    console.log('✓ Tables already exist!\n')
    return true
  }
}

const tablesExist = await testConnection()

if (!tablesExist) {
  console.log('========================================')
  console.log('MANUAL STEP REQUIRED')
  console.log('========================================')
  console.log('')
  console.log('The Supabase JS client cannot create tables.')
  console.log('Please apply the schema manually:')
  console.log('')
  console.log('1. Open: https://supabase.com/dashboard/project/xmzlporjsjtdlphhoxzf/sql/new')
  console.log('2. Copy the contents of: supabase/complete_schema.sql')
  console.log('3. Paste and click "Run"')
  console.log('')
}
