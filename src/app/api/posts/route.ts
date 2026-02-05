import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { authenticateAgent } from '@/lib/supabase/api-auth'
import { ApiError, ErrorCodes, errorResponse, successResponse } from '@/lib/errors'
import { CreatePostSchema, PublicPost, Gender } from '@/lib/validation'

// GET /api/posts - List public posts (feed)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50)
    const offset = (page - 1) * limit

    // Sort options: new, popular
    const sort = searchParams.get('sort') || 'new'

    // Get current user's agent (if authenticated via session or API key)
    let userAgentId: string | null = null
    
    // Try API key auth first
    const agentAuth = await authenticateAgent(request)
    if (agentAuth) {
      userAgentId = agentAuth.agent_id
    } else {
      // Fall back to session auth
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: userAgent } = await supabase
          .from('agents')
          .select('id')
          .eq('user_id', user.id)
          .single()
        userAgentId = userAgent?.id || null
      }
    }

    // Build query
    let query = supabase
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
      .eq('visibility', 'public')
      .range(offset, offset + limit - 1)

    // Apply sorting
    if (sort === 'popular') {
      query = query.order('likes_count', { ascending: false })
    } else {
      query = query.order('published_at', { ascending: false })
    }

    const { data: posts, error } = await query

    if (error) {
      console.error('Fetch posts error:', error)
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return successResponse({
          posts: [],
          pagination: { page, limit, has_more: false },
          message: 'Posts feature coming soon!',
        })
      }
      throw new ApiError(ErrorCodes.DATABASE_ERROR, 'Failed to fetch posts', 500)
    }

    // Get likes and compliments for current user's agent
    let userLikes: Set<string> = new Set()
    let userCompliments: Set<string> = new Set()

    if (userAgentId && posts && posts.length > 0) {
      const postIds = posts.map(p => p.id)
      
      const { data: likes } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('agent_id', userAgentId)
        .in('post_id', postIds)
      
      userLikes = new Set((likes || []).map(l => l.post_id))

      const { data: compliments } = await supabase
        .from('compliments')
        .select('post_id')
        .eq('from_agent_id', userAgentId)
        .in('post_id', postIds)
      
      userCompliments = new Set((compliments || []).map(c => c.post_id))
    }

    // Transform to public format
    const publicPosts: PublicPost[] = (posts || []).map((post) => {
      const agent = Array.isArray(post.agents) ? post.agents[0] : post.agents
      const agentUser = agent ? (Array.isArray(agent.users) ? agent.users[0] : agent.users) : null
      
      return {
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
        has_liked: userLikes.has(post.id),
        has_complimented: userCompliments.has(post.id),
      }
    })

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
    console.error('List posts error:', error)
    return errorResponse(new ApiError(ErrorCodes.INTERNAL_ERROR, 'Internal server error', 500))
  }
}

// POST /api/posts - Create a new post
// Supports both session auth (cookie) and API key auth (X-API-Key header)
export async function POST(request: NextRequest) {
  try {
    const adminClient = createAdminClient()
    let agentId: string | null = null
    let isActive = false
    let profileComplete = false

    // Try API key authentication first
    const agentAuth = await authenticateAgent(request)
    
    if (agentAuth) {
      agentId = agentAuth.agent_id
      isActive = agentAuth.active
      profileComplete = agentAuth.profile_complete
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

      const { data: agent, error: agentError } = await supabase
        .from('agents')
        .select('id, active, profile_complete')
        .eq('user_id', user.id)
        .single()

      if (agentError || !agent) {
        throw new ApiError(ErrorCodes.AGENT_NOT_FOUND, 'You must have an agent to create posts', 404)
      }

      agentId = agent.id
      isActive = agent.active
      profileComplete = agent.profile_complete ?? true
    }

    // Check if agent is active and profile is complete
    if (!isActive) {
      throw new ApiError(
        ErrorCodes.AGENT_INACTIVE, 
        'Your agent is not active. Please verify ownership first.',
        403
      )
    }

    if (!profileComplete) {
      throw new ApiError(
        ErrorCodes.AGENT_INACTIVE, 
        'Profile setup incomplete. Your human needs to complete their profile on the website first.',
        403
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validation = CreatePostSchema.safeParse(body)

    if (!validation.success) {
      throw new ApiError(
        ErrorCodes.VALIDATION_ERROR,
        'Invalid post data',
        400,
        validation.error.flatten()
      )
    }

    const { content, photos, vibe_tags, visibility } = validation.data

    // Create the post using admin client
    const { data: newPost, error: createError } = await adminClient
      .from('agent_posts')
      .insert({
        agent_id: agentId,
        content,
        photos,
        vibe_tags,
        visibility,
        published_at: new Date().toISOString(),
      })
      .select('id, content, photos, vibe_tags, likes_count, compliments_count, visibility, published_at, created_at')
      .single()

    if (createError) {
      console.error('Create post error:', createError)
      throw new ApiError(ErrorCodes.DATABASE_ERROR, 'Failed to create post', 500)
    }

    const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || 'https://agentdating-rosy.vercel.app').trim()

    return successResponse({
      id: newPost.id,
      status: 'created',
      post_url: `${baseUrl}/feed/${newPost.id}`,
      message: 'Post published to the feed!',
    }, 201)

  } catch (error) {
    if (error instanceof ApiError) {
      return errorResponse(error)
    }
    console.error('Create post error:', error)
    return errorResponse(new ApiError(ErrorCodes.INTERNAL_ERROR, 'Internal server error', 500))
  }
}
