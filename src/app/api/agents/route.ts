import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ApiError, ErrorCodes, errorResponse, successResponse } from '@/lib/errors'
import { PublicAgent } from '@/lib/validation'

// GET /api/agents - List all active agents
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100)
    const offset = (page - 1) * limit

    // Optional filters
    const gender = searchParams.get('gender')
    const lookingFor = searchParams.get('looking_for')

    // Build query
    let query = supabase
      .from('agents')
      .select(`
        id,
        agent_name,
        gender,
        age,
        looking_for,
        age_range_min,
        age_range_max,
        photos,
        bio,
        vibe_tags,
        interests,
        location,
        looking_for_traits,
        active,
        created_at,
        users!inner (
          x_handle,
          x_avatar_url
        ),
        agent_preferences (
          vibe_tags,
          min_score,
          dealbreakers
        )
      `)
      .eq('active', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (gender && ['male', 'female', 'non_binary', 'other'].includes(gender)) {
      query = query.eq('gender', gender)
    }

    if (lookingFor && ['male', 'female', 'non_binary', 'other'].includes(lookingFor)) {
      query = query.contains('looking_for', [lookingFor])
    }

    const { data: agents, error } = await query

    if (error) {
      throw new ApiError(
        ErrorCodes.DATABASE_ERROR,
        'Failed to fetch agents',
        500
      )
    }

    // Transform to public format
    const publicAgents: PublicAgent[] = (agents || []).map((agent) => {
      const users = Array.isArray(agent.users) ? agent.users[0] : agent.users
      const prefs = Array.isArray(agent.agent_preferences) ? agent.agent_preferences[0] : agent.agent_preferences
      
      return {
        id: agent.id,
        agent_name: agent.agent_name,
        gender: agent.gender,
        age: agent.age,
        looking_for: agent.looking_for,
        age_range_min: agent.age_range_min || 18,
        age_range_max: agent.age_range_max || 99,
        photos: (agent.photos as string[]) || [],
        bio: agent.bio,
        vibe_tags: (agent.vibe_tags as string[]) || [],
        interests: (agent.interests as string[]) || [],
        location: agent.location,
        looking_for_traits: (agent.looking_for_traits as string[]) || [],
        active: agent.active,
        created_at: agent.created_at,
        user: {
          x_handle: users?.x_handle || 'unknown',
          x_avatar_url: users?.x_avatar_url || null,
        },
        preferences: {
          vibe_tags: prefs?.vibe_tags || [],
          min_score: prefs?.min_score || 0,
          dealbreakers: prefs?.dealbreakers || [],
        },
      }
    })

    return successResponse({
      agents: publicAgents,
      pagination: {
        page,
        limit,
        has_more: agents?.length === limit,
      },
    })

  } catch (error) {
    if (error instanceof ApiError) {
      return errorResponse(error)
    }

    console.error('List agents error:', error)
    return errorResponse(
      new ApiError(ErrorCodes.INTERNAL_ERROR, 'Internal server error', 500)
    )
  }
}
