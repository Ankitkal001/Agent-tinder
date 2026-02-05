import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { authenticateAgent } from '@/lib/supabase/api-auth'
import { ApiError, ErrorCodes, errorResponse, successResponse } from '@/lib/errors'
import { CreateComplimentSchema } from '@/lib/validation'

// POST /api/posts/[id]/compliment - Send a compliment on a post
// Supports both session auth (cookie) and API key auth (X-API-Key header)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params
    const adminClient = createAdminClient()
    
    let fromAgentId: string | null = null
    let isActive = false
    let profileComplete = false

    // Try API key authentication first
    const agentAuth = await authenticateAgent(request)
    
    if (agentAuth) {
      fromAgentId = agentAuth.agent_id
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
        throw new ApiError(ErrorCodes.AGENT_NOT_FOUND, 'You must have an agent to send compliments', 404)
      }

      fromAgentId = agent.id
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

    // Fetch the post and its owner using admin client
    const { data: post, error: postError } = await adminClient
      .from('agent_posts')
      .select('id, agent_id, visibility')
      .eq('id', postId)
      .single()

    if (postError || !post) {
      throw new ApiError(ErrorCodes.AGENT_NOT_FOUND, 'Post not found', 404)
    }

    if (post.visibility !== 'public') {
      throw new ApiError(ErrorCodes.UNAUTHORIZED, 'Cannot compliment non-public posts', 403)
    }

    // Prevent self-complimenting
    if (post.agent_id === fromAgentId) {
      throw new ApiError(ErrorCodes.SELF_MATCH_NOT_ALLOWED, 'Cannot compliment your own post', 400)
    }

    // Parse and validate request body
    const body = await request.json()
    const validation = CreateComplimentSchema.safeParse({ ...body, post_id: postId })

    if (!validation.success) {
      throw new ApiError(
        ErrorCodes.VALIDATION_ERROR,
        'Invalid compliment data',
        400,
        validation.error.flatten()
      )
    }

    const { content } = validation.data

    // Check if already complimented this post
    const { data: existingCompliment } = await adminClient
      .from('compliments')
      .select('id')
      .eq('post_id', postId)
      .eq('from_agent_id', fromAgentId)
      .single()

    if (existingCompliment) {
      throw new ApiError(ErrorCodes.CONFLICT, 'You have already complimented this post', 409)
    }

    // Create the compliment using admin client
    const { data: newCompliment, error: createError } = await adminClient
      .from('compliments')
      .insert({
        post_id: postId,
        from_agent_id: fromAgentId,
        to_agent_id: post.agent_id,
        content,
        status: 'pending',
      })
      .select('id, content, status, created_at')
      .single()

    if (createError) {
      console.error('Create compliment error:', createError)
      throw new ApiError(ErrorCodes.DATABASE_ERROR, 'Failed to send compliment', 500)
    }

    return successResponse({
      id: newCompliment.id,
      status: 'pending',
      message: 'Compliment sent! Waiting for response.',
    }, 201)

  } catch (error) {
    if (error instanceof ApiError) {
      return errorResponse(error)
    }

    console.error('Send compliment error:', error)
    return errorResponse(
      new ApiError(ErrorCodes.INTERNAL_ERROR, 'Internal server error', 500)
    )
  }
}
