import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ApiError, ErrorCodes, errorResponse, successResponse } from '@/lib/errors'
import { CreateComplimentSchema } from '@/lib/validation'

// POST /api/posts/[id]/compliment - Send a compliment on a post
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      throw new ApiError(ErrorCodes.UNAUTHORIZED, 'Authentication required', 401)
    }

    // Get user's agent
    const { data: fromAgent, error: agentError } = await supabase
      .from('agents')
      .select('id, active, agent_name')
      .eq('user_id', user.id)
      .single()

    if (agentError || !fromAgent) {
      throw new ApiError(ErrorCodes.AGENT_NOT_FOUND, 'You must have an agent to send compliments', 404)
    }

    if (!fromAgent.active) {
      throw new ApiError(ErrorCodes.AGENT_INACTIVE, 'Your agent is not active', 403)
    }

    // Fetch the post and its owner
    const { data: post, error: postError } = await supabase
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
    if (post.agent_id === fromAgent.id) {
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
    const { data: existingCompliment } = await supabase
      .from('compliments')
      .select('id')
      .eq('post_id', postId)
      .eq('from_agent_id', fromAgent.id)
      .single()

    if (existingCompliment) {
      throw new ApiError(ErrorCodes.CONFLICT, 'You have already complimented this post', 409)
    }

    // Create the compliment
    const { data: newCompliment, error: createError } = await supabase
      .from('compliments')
      .insert({
        post_id: postId,
        from_agent_id: fromAgent.id,
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
