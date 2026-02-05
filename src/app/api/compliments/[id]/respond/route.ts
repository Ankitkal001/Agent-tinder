import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { authenticateAgent } from '@/lib/supabase/api-auth'
import { ApiError, ErrorCodes, errorResponse, successResponse } from '@/lib/errors'
import { RespondComplimentSchema } from '@/lib/validation'

// POST /api/compliments/[id]/respond - Accept or decline a compliment
// Supports both session auth (cookie) and API key auth (X-API-Key header)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: complimentId } = await params
    const adminClient = createAdminClient()
    
    let agentId: string | null = null

    // Try API key authentication first
    const agentAuth = await authenticateAgent(request)
    
    if (agentAuth) {
      agentId = agentAuth.agent_id
      
      // Check if agent is active
      if (!agentAuth.active) {
        throw new ApiError(
          ErrorCodes.AGENT_INACTIVE, 
          'Your agent is not active. Please verify ownership first.',
          403
        )
      }
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
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (agentError || !agent) {
        throw new ApiError(ErrorCodes.AGENT_NOT_FOUND, 'You must have an agent to respond to compliments', 404)
      }

      agentId = agent.id
    }

    // Fetch the compliment using admin client
    const { data: compliment, error: complimentError } = await adminClient
      .from('compliments')
      .select('id, to_agent_id, from_agent_id, status')
      .eq('id', complimentId)
      .single()

    if (complimentError || !compliment) {
      throw new ApiError(ErrorCodes.AGENT_NOT_FOUND, 'Compliment not found', 404)
    }

    // Verify the compliment is for user's agent
    if (compliment.to_agent_id !== agentId) {
      throw new ApiError(ErrorCodes.UNAUTHORIZED, 'Not authorized to respond to this compliment', 403)
    }

    // Check if already responded
    if (compliment.status !== 'pending') {
      throw new ApiError(ErrorCodes.CONFLICT, `Compliment has already been ${compliment.status}`, 409)
    }

    // Parse and validate request body
    const body = await request.json()
    const validation = RespondComplimentSchema.safeParse(body)

    if (!validation.success) {
      throw new ApiError(
        ErrorCodes.VALIDATION_ERROR,
        'Invalid response data',
        400,
        validation.error.flatten()
      )
    }

    const { action } = validation.data
    const newStatus = action === 'accept' ? 'accepted' : 'declined'

    // Update the compliment status using admin client
    const { error: updateError } = await adminClient
      .from('compliments')
      .update({
        status: newStatus,
        responded_at: new Date().toISOString(),
      })
      .eq('id', complimentId)

    if (updateError) {
      console.error('Update compliment error:', updateError)
      throw new ApiError(ErrorCodes.DATABASE_ERROR, 'Failed to respond to compliment', 500)
    }

    // If accepted, the trigger will create a match automatically
    // Let's fetch the match if it was created
    let matchId: string | null = null
    
    if (action === 'accept') {
      // Wait a moment for trigger to execute
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const { data: match } = await adminClient
        .from('matches')
        .select('id')
        .eq('compliment_id', complimentId)
        .single()
      
      matchId = match?.id || null
      
      // If no match was created by trigger, create it manually
      if (!matchId) {
        const { data: newMatch, error: matchError } = await adminClient
          .from('matches')
          .insert({
            agent_a: compliment.to_agent_id,
            agent_b: compliment.from_agent_id,
            compliment_id: complimentId,
            match_type: 'compliment',
            compatibility_score: 85, // Default score
          })
          .select('id')
          .single()
        
        if (!matchError && newMatch) {
          matchId = newMatch.id
        }
      }
    }

    return successResponse({
      status: newStatus,
      message: action === 'accept' 
        ? "It's a match! 💕 You can now connect with each other."
        : 'Compliment declined.',
      match_id: matchId,
    })

  } catch (error) {
    if (error instanceof ApiError) {
      return errorResponse(error)
    }

    console.error('Respond to compliment error:', error)
    return errorResponse(
      new ApiError(ErrorCodes.INTERNAL_ERROR, 'Internal server error', 500)
    )
  }
}
