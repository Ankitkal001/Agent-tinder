import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { authenticateAgent } from '@/lib/supabase/api-auth'
import { ApiError, ErrorCodes, errorResponse, successResponse } from '@/lib/errors'
import { PublicMatch, PublicAgent } from '@/lib/validation'

interface MatchRow {
  id: string
  compatibility_score: number
  match_type: string | null
  compliment_id: string | null
  created_at: string
  agent_a_data: {
    id: string
    agent_name: string
    gender: string
    age: number | null
    looking_for: string[]
    age_range_min: number
    age_range_max: number
    photos: string[]
    bio: string | null
    vibe_tags: string[]
    interests: string[]
    location: string | null
    looking_for_traits: string[]
    active: boolean
    created_at: string
    users: { x_handle: string; x_avatar_url: string | null }
    agent_preferences: { vibe_tags: string[]; min_score: number; dealbreakers: string[] } | null
  }
  agent_b_data: {
    id: string
    agent_name: string
    gender: string
    age: number | null
    looking_for: string[]
    age_range_min: number
    age_range_max: number
    photos: string[]
    bio: string | null
    vibe_tags: string[]
    interests: string[]
    location: string | null
    looking_for_traits: string[]
    active: boolean
    created_at: string
    users: { x_handle: string; x_avatar_url: string | null }
    agent_preferences: { vibe_tags: string[]; min_score: number; dealbreakers: string[] } | null
  }
}

function transformAgent(agent: MatchRow['agent_a_data']): PublicAgent {
  return {
    id: agent.id,
    agent_name: agent.agent_name,
    gender: agent.gender as PublicAgent['gender'],
    age: agent.age,
    looking_for: agent.looking_for as PublicAgent['looking_for'],
    age_range_min: agent.age_range_min || 18,
    age_range_max: agent.age_range_max || 99,
    photos: agent.photos || [],
    bio: agent.bio,
    vibe_tags: agent.vibe_tags || [],
    interests: agent.interests || [],
    location: agent.location,
    looking_for_traits: agent.looking_for_traits || [],
    active: agent.active,
    created_at: agent.created_at,
    user: {
      x_handle: agent.users.x_handle,
      x_avatar_url: agent.users.x_avatar_url,
    },
    preferences: {
      vibe_tags: agent.agent_preferences?.vibe_tags || [],
      min_score: agent.agent_preferences?.min_score || 0,
      dealbreakers: agent.agent_preferences?.dealbreakers || [],
    },
  }
}

// GET /api/matches/me - Get authenticated user's/agent's matches
// Supports both session auth (cookie) and API key auth (X-API-Key header)
export async function GET(request: NextRequest) {
  try {
    const adminClient = createAdminClient()
    let agentId: string | null = null

    // Try API key authentication first
    const agentAuth = await authenticateAgent(request)
    
    if (agentAuth) {
      agentId = agentAuth.agent_id
    } else {
      // Fall back to session authentication
      const supabase = await createClient()
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        throw new ApiError(
          ErrorCodes.UNAUTHORIZED,
          'Authentication required. Use X-API-Key header or sign in.',
          401
        )
      }

      // Get user's agent
      const { data: userAgent, error: agentError } = await supabase
        .from('agents')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (agentError || !userAgent) {
        // User has no agent, return empty matches
        return successResponse({
          matches: [],
          pagination: {
            page: 1,
            limit: 20,
            has_more: false,
          },
        })
      }

      agentId = userAgent.id
    }

    const { searchParams } = new URL(request.url)
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100)
    const offset = (page - 1) * limit

    // Fetch matches where agent is involved using admin client
    const { data: matches, error } = await adminClient
      .from('matches')
      .select(`
        id,
        compatibility_score,
        match_type,
        compliment_id,
        created_at,
        agent_a_data:agents!matches_agent_a_fkey (
          id,
          agent_name,
          gender,
          looking_for,
          active,
          created_at,
          users (
            x_handle,
            x_avatar_url
          ),
          agent_preferences (
            vibe_tags
          )
        ),
        agent_b_data:agents!matches_agent_b_fkey (
          id,
          agent_name,
          gender,
          looking_for,
          active,
          created_at,
          users (
            x_handle,
            x_avatar_url
          ),
          agent_preferences (
            vibe_tags
          )
        )
      `)
      .or(`agent_a.eq.${agentId},agent_b.eq.${agentId}`)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Fetch user matches error:', error)
      throw new ApiError(
        ErrorCodes.DATABASE_ERROR,
        'Failed to fetch matches',
        500
      )
    }

    // Transform to public format
    const publicMatches: PublicMatch[] = (matches as unknown as MatchRow[] || []).map((match) => ({
      id: match.id,
      compatibility_score: match.compatibility_score,
      match_type: (match.match_type || 'legacy') as 'compliment' | 'direct' | 'legacy',
      compliment_id: match.compliment_id,
      created_at: match.created_at,
      agent_a: transformAgent(match.agent_a_data),
      agent_b: transformAgent(match.agent_b_data),
    }))

    return successResponse({
      matches: publicMatches,
      pagination: {
        page,
        limit,
        has_more: matches?.length === limit,
      },
    })

  } catch (error) {
    if (error instanceof ApiError) {
      return errorResponse(error)
    }

    console.error('User matches error:', error)
    return errorResponse(
      new ApiError(ErrorCodes.INTERNAL_ERROR, 'Internal server error', 500)
    )
  }
}
