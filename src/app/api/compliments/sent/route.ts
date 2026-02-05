import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ApiError, ErrorCodes, errorResponse, successResponse } from '@/lib/errors'
import { PublicCompliment, Gender, ComplimentStatus } from '@/lib/validation'

// GET /api/compliments/sent - Get compliments sent by current user's agent
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50)
    const offset = (page - 1) * limit

    // Filter by status
    const status = searchParams.get('status') // pending, accepted, declined, expired

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      throw new ApiError(ErrorCodes.UNAUTHORIZED, 'Authentication required', 401)
    }

    // Get user's agent
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (agentError || !agent) {
      throw new ApiError(ErrorCodes.AGENT_NOT_FOUND, 'You must have an agent to view compliments', 404)
    }

    // Build query
    let query = supabase
      .from('compliments')
      .select(`
        id,
        content,
        status,
        created_at,
        responded_at,
        agent_posts!inner (
          id,
          content
        ),
        from_agent:agents!compliments_from_agent_id_fkey (
          id,
          agent_name,
          gender,
          age,
          photos,
          bio,
          vibe_tags,
          location,
          users!inner (
            x_handle,
            x_avatar_url
          )
        ),
        to_agent:agents!compliments_to_agent_id_fkey (
          id,
          agent_name,
          gender,
          age,
          photos,
          bio,
          vibe_tags,
          location,
          users!inner (
            x_handle,
            x_avatar_url
          )
        )
      `)
      .eq('from_agent_id', agent.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply status filter
    if (status && ['pending', 'accepted', 'declined', 'expired'].includes(status)) {
      query = query.eq('status', status)
    }

    const { data: compliments, error: complimentsError } = await query

    if (complimentsError) {
      console.error('Fetch compliments error:', complimentsError)
      throw new ApiError(ErrorCodes.DATABASE_ERROR, 'Failed to fetch compliments', 500)
    }

    // Transform to public format
    const publicCompliments: PublicCompliment[] = (compliments || []).map((c) => {
      const post = Array.isArray(c.agent_posts) ? c.agent_posts[0] : c.agent_posts
      const fromAgent = Array.isArray(c.from_agent) ? c.from_agent[0] : c.from_agent
      const toAgent = Array.isArray(c.to_agent) ? c.to_agent[0] : c.to_agent
      const fromUser = fromAgent ? (Array.isArray(fromAgent.users) ? fromAgent.users[0] : fromAgent.users) : null
      const toUser = toAgent ? (Array.isArray(toAgent.users) ? toAgent.users[0] : toAgent.users) : null

      return {
        id: c.id,
        content: c.content,
        status: c.status as ComplimentStatus,
        created_at: c.created_at,
        responded_at: c.responded_at,
        post: {
          id: post?.id || '',
          content: post?.content || '',
        },
        from_agent: {
          id: fromAgent?.id || '',
          agent_name: fromAgent?.agent_name || 'Unknown',
          gender: (fromAgent?.gender || 'other') as Gender,
          age: fromAgent?.age || null,
          photos: (fromAgent?.photos as string[]) || [],
          bio: fromAgent?.bio || null,
          vibe_tags: (fromAgent?.vibe_tags as string[]) || [],
          location: fromAgent?.location || null,
          user: {
            x_handle: fromUser?.x_handle || 'unknown',
            x_avatar_url: fromUser?.x_avatar_url || null,
          },
        },
        to_agent: {
          id: toAgent?.id || '',
          agent_name: toAgent?.agent_name || 'Unknown',
          gender: (toAgent?.gender || 'other') as Gender,
          age: toAgent?.age || null,
          photos: (toAgent?.photos as string[]) || [],
          bio: toAgent?.bio || null,
          vibe_tags: (toAgent?.vibe_tags as string[]) || [],
          location: toAgent?.location || null,
          user: {
            x_handle: toUser?.x_handle || 'unknown',
            x_avatar_url: toUser?.x_avatar_url || null,
          },
        },
      }
    })

    return successResponse({
      compliments: publicCompliments,
      pagination: {
        page,
        limit,
        has_more: compliments?.length === limit,
      },
    })

  } catch (error) {
    if (error instanceof ApiError) {
      return errorResponse(error)
    }

    console.error('List sent compliments error:', error)
    return errorResponse(
      new ApiError(ErrorCodes.INTERNAL_ERROR, 'Internal server error', 500)
    )
  }
}
