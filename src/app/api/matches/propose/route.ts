import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { MatchProposeSchema, Gender } from '@/lib/validation'
import { ApiError, ErrorCodes, errorResponse, successResponse } from '@/lib/errors'
import { ZodError } from 'zod'

interface AgentWithPrefs {
  id: string
  user_id: string
  agent_name: string
  gender: Gender
  looking_for: Gender[]
  active: boolean
  agent_preferences: {
    min_score: number
  } | null
}

// POST /api/matches/propose - Propose a match between two agents
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const adminClient = createAdminClient()
    
    // =========================================
    // STEP 1: AUTHENTICATION
    // =========================================
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      throw new ApiError(
        ErrorCodes.UNAUTHORIZED,
        'Authentication required',
        401
      )
    }

    // =========================================
    // STEP 2: PARSE AND VALIDATE INPUT
    // =========================================
    const body = await request.json()
    const input = MatchProposeSchema.parse(body)

    // =========================================
    // STEP 3: GET PROPOSER'S AGENT
    // =========================================
    const { data: proposerAgent, error: proposerError } = await supabase
      .from('agents')
      .select(`
        id,
        user_id,
        agent_name,
        gender,
        looking_for,
        active,
        agent_preferences (
          min_score
        )
      `)
      .eq('user_id', user.id)
      .single()

    if (proposerError || !proposerAgent) {
      throw new ApiError(
        ErrorCodes.AGENT_NOT_FOUND,
        'You must register an agent before proposing matches',
        404
      )
    }

    const agentA = proposerAgent as unknown as AgentWithPrefs

    // =========================================
    // STEP 4: GET TARGET AGENT
    // =========================================
    // Prevent self-matching
    if (input.target_agent_id === agentA.id) {
      throw new ApiError(
        ErrorCodes.SELF_MATCH_NOT_ALLOWED,
        'Cannot propose a match with yourself',
        400
      )
    }

    const { data: targetAgent, error: targetError } = await supabase
      .from('agents')
      .select(`
        id,
        user_id,
        agent_name,
        gender,
        looking_for,
        active,
        agent_preferences (
          min_score
        )
      `)
      .eq('id', input.target_agent_id)
      .single()

    if (targetError || !targetAgent) {
      throw new ApiError(
        ErrorCodes.AGENT_NOT_FOUND,
        'Target agent not found',
        404
      )
    }

    const agentB = targetAgent as unknown as AgentWithPrefs

    // =========================================
    // STEP 5: HARD FILTER - Active Status
    // =========================================
    if (!agentA.active) {
      throw new ApiError(
        ErrorCodes.AGENT_INACTIVE,
        'Your agent is inactive. Activate it before proposing matches.',
        400
      )
    }

    if (!agentB.active) {
      throw new ApiError(
        ErrorCodes.AGENT_INACTIVE,
        'Target agent is inactive',
        400
      )
    }

    // =========================================
    // STEP 6: HARD FILTER - Gender Compatibility
    // =========================================
    // Agent A's gender must be in Agent B's looking_for
    if (!agentB.looking_for.includes(agentA.gender)) {
      throw new ApiError(
        ErrorCodes.GENDER_MISMATCH,
        `Target agent is not looking for ${agentA.gender}`,
        400
      )
    }

    // Agent B's gender must be in Agent A's looking_for
    if (!agentA.looking_for.includes(agentB.gender)) {
      throw new ApiError(
        ErrorCodes.GENDER_MISMATCH,
        `Your agent is not looking for ${agentB.gender}`,
        400
      )
    }

    // =========================================
    // STEP 7: HARD FILTER - No Existing Match
    // =========================================
    // Order agent IDs for consistent lookup
    const [orderedA, orderedB] = agentA.id < agentB.id 
      ? [agentA.id, agentB.id] 
      : [agentB.id, agentA.id]

    const { data: existingMatch } = await supabase
      .from('matches')
      .select('id')
      .eq('agent_a', orderedA)
      .eq('agent_b', orderedB)
      .single()

    if (existingMatch) {
      throw new ApiError(
        ErrorCodes.MATCH_ALREADY_EXISTS,
        'A match between these agents already exists',
        409
      )
    }

    // =========================================
    // STEP 8: SOFT FILTER - Score Threshold
    // =========================================
    const agentAMinScore = agentA.agent_preferences?.min_score ?? 0
    const agentBMinScore = agentB.agent_preferences?.min_score ?? 0

    if (input.compatibility_score < agentAMinScore) {
      throw new ApiError(
        ErrorCodes.SCORE_BELOW_THRESHOLD,
        `Compatibility score ${input.compatibility_score} is below your minimum threshold of ${agentAMinScore}`,
        400
      )
    }

    if (input.compatibility_score < agentBMinScore) {
      throw new ApiError(
        ErrorCodes.SCORE_BELOW_THRESHOLD,
        `Compatibility score ${input.compatibility_score} is below target's minimum threshold of ${agentBMinScore}`,
        400
      )
    }

    // =========================================
    // STEP 9: CREATE MATCH (Atomic)
    // Using admin client to bypass RLS
    // =========================================
    const { data: newMatch, error: matchError } = await adminClient
      .from('matches')
      .insert({
        agent_a: orderedA,
        agent_b: orderedB,
        compatibility_score: input.compatibility_score,
      })
      .select('id, created_at')
      .single()

    if (matchError || !newMatch) {
      // Check if it's a duplicate constraint violation
      if (matchError?.code === '23505') {
        throw new ApiError(
          ErrorCodes.MATCH_ALREADY_EXISTS,
          'A match between these agents already exists',
          409
        )
      }
      
      console.error('Match creation error:', matchError)
      throw new ApiError(
        ErrorCodes.DATABASE_ERROR,
        'Failed to create match',
        500
      )
    }

    // =========================================
    // STEP 10: EMIT MATCH_CREATED EVENT
    // =========================================
    const { error: eventError } = await adminClient
      .from('events')
      .insert({
        type: 'MATCH_CREATED',
        payload: {
          match_id: newMatch.id,
          agent_a_id: orderedA,
          agent_b_id: orderedB,
          agent_a_name: agentA.id === orderedA ? agentA.agent_name : agentB.agent_name,
          agent_b_name: agentB.id === orderedB ? agentB.agent_name : agentA.agent_name,
          compatibility_score: input.compatibility_score,
          proposed_by: agentA.id,
        },
      })

    if (eventError) {
      // Log but don't fail - match was created successfully
      console.error('Event creation error:', eventError)
    }

    return successResponse({
      match_id: newMatch.id,
      created_at: newMatch.created_at,
      agent_a: orderedA,
      agent_b: orderedB,
      compatibility_score: input.compatibility_score,
    }, 201)

  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(
        new ApiError(
          ErrorCodes.VALIDATION_ERROR,
          'Invalid input',
          400,
          error.errors
        )
      )
    }

    if (error instanceof ApiError) {
      return errorResponse(error)
    }

    console.error('Match proposal error:', error)
    return errorResponse(
      new ApiError(ErrorCodes.INTERNAL_ERROR, 'Internal server error', 500)
    )
  }
}
