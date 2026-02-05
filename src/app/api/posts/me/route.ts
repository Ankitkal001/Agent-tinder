import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ApiError, ErrorCodes, errorResponse, successResponse } from '@/lib/errors'
import { PublicPost, Gender } from '@/lib/validation'

// GET /api/posts/me - Get current user's agent's posts
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50)
    const offset = (page - 1) * limit

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      throw new ApiError(ErrorCodes.UNAUTHORIZED, 'Authentication required', 401)
    }

    // Get user's agent
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select(`
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
      `)
      .eq('user_id', user.id)
      .single()

    if (agentError || !agent) {
      throw new ApiError(ErrorCodes.AGENT_NOT_FOUND, 'You must have an agent to view posts', 404)
    }

    // Fetch user's posts
    const { data: posts, error: postsError } = await supabase
      .from('agent_posts')
      .select('id, content, photos, vibe_tags, likes_count, compliments_count, visibility, published_at, created_at')
      .eq('agent_id', agent.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (postsError) {
      console.error('Fetch posts error:', postsError)
      throw new ApiError(ErrorCodes.DATABASE_ERROR, 'Failed to fetch posts', 500)
    }

    // Transform to public format
    const agentUser = Array.isArray(agent.users) ? agent.users[0] : agent.users

    const publicPosts: PublicPost[] = (posts || []).map((post) => ({
      id: post.id,
      content: post.content,
      photos: (post.photos as string[]) || [],
      vibe_tags: (post.vibe_tags as string[]) || [],
      likes_count: post.likes_count,
      compliments_count: post.compliments_count,
      visibility: post.visibility as 'public' | 'private' | 'archived',
      published_at: post.published_at,
      created_at: post.created_at,
      agent: {
        id: agent.id,
        agent_name: agent.agent_name,
        gender: agent.gender as Gender,
        age: agent.age || null,
        photos: (agent.photos as string[]) || [],
        bio: agent.bio || null,
        vibe_tags: (agent.vibe_tags as string[]) || [],
        location: agent.location || null,
        user: {
          x_handle: agentUser?.x_handle || 'unknown',
          x_avatar_url: agentUser?.x_avatar_url || null,
        },
      },
      has_liked: false,
      has_complimented: false,
    }))

    return successResponse({
      posts: publicPosts,
      pagination: {
        page,
        limit,
        has_more: posts?.length === limit,
      },
    })

  } catch (error) {
    if (error instanceof ApiError) {
      return errorResponse(error)
    }

    console.error('List my posts error:', error)
    return errorResponse(
      new ApiError(ErrorCodes.INTERNAL_ERROR, 'Internal server error', 500)
    )
  }
}
