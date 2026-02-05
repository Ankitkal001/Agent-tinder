import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ApiError, ErrorCodes, errorResponse, successResponse } from '@/lib/errors'
import { PublicPost, PublicCompliment, Gender, ComplimentStatus } from '@/lib/validation'

// GET /api/posts/[id] - Get single post with compliments
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Get current user's agent (if authenticated)
    const { data: { user } } = await supabase.auth.getUser()
    let userAgentId: string | null = null
    
    if (user) {
      const { data: userAgent } = await supabase
        .from('agents')
        .select('id')
        .eq('user_id', user.id)
        .single()
      userAgentId = userAgent?.id || null
    }

    // Fetch the post
    const { data: post, error: postError } = await supabase
      .from('agent_posts')
      .select(`
        id,
        content,
        photos,
        vibe_tags,
        likes_count,
        compliments_count,
        visibility,
        published_at,
        created_at,
        agents!inner (
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
      .eq('id', id)
      .single()

    if (postError || !post) {
      throw new ApiError(ErrorCodes.AGENT_NOT_FOUND, 'Post not found', 404)
    }

    // Check visibility
    if (post.visibility !== 'public') {
      // Only allow owner to see non-public posts
      const postAgent = Array.isArray(post.agents) ? post.agents[0] : post.agents
      if (!userAgentId || userAgentId !== postAgent?.id) {
        throw new ApiError(ErrorCodes.UNAUTHORIZED, 'Post not accessible', 403)
      }
    }

    // Fetch compliments for this post
    const { data: compliments, error: complimentsError } = await supabase
      .from('compliments')
      .select(`
        id,
        content,
        status,
        created_at,
        responded_at,
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
      .eq('post_id', id)
      .order('created_at', { ascending: false })

    if (complimentsError) {
      console.error('Fetch compliments error:', complimentsError)
    }

    // Check if user has liked/complimented
    let hasLiked = false
    let hasComplimented = false

    if (userAgentId) {
      const { data: like } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', id)
        .eq('agent_id', userAgentId)
        .single()
      hasLiked = !!like

      const { data: compliment } = await supabase
        .from('compliments')
        .select('id')
        .eq('post_id', id)
        .eq('from_agent_id', userAgentId)
        .single()
      hasComplimented = !!compliment
    }

    // Transform post
    const agent = Array.isArray(post.agents) ? post.agents[0] : post.agents
    const agentUser = agent ? (Array.isArray(agent.users) ? agent.users[0] : agent.users) : null

    const publicPost: PublicPost = {
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
        id: agent?.id || '',
        agent_name: agent?.agent_name || 'Unknown',
        gender: (agent?.gender || 'other') as Gender,
        age: agent?.age || null,
        photos: (agent?.photos as string[]) || [],
        bio: agent?.bio || null,
        vibe_tags: (agent?.vibe_tags as string[]) || [],
        location: agent?.location || null,
        user: {
          x_handle: agentUser?.x_handle || 'unknown',
          x_avatar_url: agentUser?.x_avatar_url || null,
        },
      },
      has_liked: hasLiked,
      has_complimented: hasComplimented,
    }

    // Transform compliments
    const publicCompliments: PublicCompliment[] = (compliments || []).map((c) => {
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
          id: post.id,
          content: post.content,
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
      post: publicPost,
      compliments: publicCompliments,
    })

  } catch (error) {
    if (error instanceof ApiError) {
      return errorResponse(error)
    }

    console.error('Get post error:', error)
    return errorResponse(
      new ApiError(ErrorCodes.INTERNAL_ERROR, 'Internal server error', 500)
    )
  }
}

// DELETE /api/posts/[id] - Delete a post
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      throw new ApiError(ErrorCodes.UNAUTHORIZED, 'Authentication required', 401)
    }

    // Get user's agent
    const { data: agent } = await supabase
      .from('agents')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!agent) {
      throw new ApiError(ErrorCodes.AGENT_NOT_FOUND, 'Agent not found', 404)
    }

    // Verify post belongs to user's agent
    const { data: post } = await supabase
      .from('agent_posts')
      .select('id, agent_id')
      .eq('id', id)
      .single()

    if (!post) {
      throw new ApiError(ErrorCodes.AGENT_NOT_FOUND, 'Post not found', 404)
    }

    if (post.agent_id !== agent.id) {
      throw new ApiError(ErrorCodes.UNAUTHORIZED, 'Not authorized to delete this post', 403)
    }

    // Delete the post
    const { error: deleteError } = await supabase
      .from('agent_posts')
      .delete()
      .eq('id', id)

    if (deleteError) {
      throw new ApiError(ErrorCodes.DATABASE_ERROR, 'Failed to delete post', 500)
    }

    return successResponse({ message: 'Post deleted successfully' })

  } catch (error) {
    if (error instanceof ApiError) {
      return errorResponse(error)
    }

    console.error('Delete post error:', error)
    return errorResponse(
      new ApiError(ErrorCodes.INTERNAL_ERROR, 'Internal server error', 500)
    )
  }
}
