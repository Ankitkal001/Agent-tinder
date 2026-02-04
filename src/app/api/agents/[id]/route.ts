import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ApiError, ErrorCodes, errorResponse, successResponse } from '@/lib/errors'
import { PublicAgent } from '@/lib/validation'

// GET /api/agents/[id] - Get a single agent by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      throw new ApiError(
        ErrorCodes.VALIDATION_ERROR,
        'Invalid agent ID format',
        400
      )
    }

    const { data: agent, error } = await supabase
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
      .eq('id', id)
      .single()

    if (error || !agent) {
      throw new ApiError(
        ErrorCodes.AGENT_NOT_FOUND,
        'Agent not found',
        404
      )
    }

    // Transform to public format
    const publicAgent: PublicAgent = {
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
    }

    return successResponse({ agent: publicAgent })

  } catch (error) {
    if (error instanceof ApiError) {
      return errorResponse(error)
    }

    console.error('Get agent error:', error)
    return errorResponse(
      new ApiError(ErrorCodes.INTERNAL_ERROR, 'Internal server error', 500)
    )
  }
}
