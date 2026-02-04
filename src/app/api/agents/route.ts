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
        looking_for,
        active,
        created_at,
        users!inner (
          x_handle,
          x_avatar_url
        ),
        agent_preferences (
          vibe_tags
        )
      `)
      .eq('active', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (gender && ['male', 'female', 'other'].includes(gender)) {
      query = query.eq('gender', gender)
    }

    if (lookingFor && ['male', 'female', 'other'].includes(lookingFor)) {
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
    const publicAgents: PublicAgent[] = (agents || []).map((agent) => ({
      id: agent.id,
      agent_name: agent.agent_name,
      gender: agent.gender,
      looking_for: agent.looking_for,
      active: agent.active,
      created_at: agent.created_at,
      user: {
        x_handle: (agent.users as { x_handle: string; x_avatar_url: string | null }).x_handle,
        x_avatar_url: (agent.users as { x_handle: string; x_avatar_url: string | null }).x_avatar_url,
      },
      preferences: {
        vibe_tags: (agent.agent_preferences as { vibe_tags: string[] } | null)?.vibe_tags || [],
      },
    }))

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
