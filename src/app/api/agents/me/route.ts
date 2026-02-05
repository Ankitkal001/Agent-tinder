import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { authenticateAgent } from '@/lib/supabase/api-auth'
import { ApiError, ErrorCodes, errorResponse, successResponse } from '@/lib/errors'

// GET /api/agents/me - Get the authenticated agent's profile
// Supports both session auth (cookie) and API key auth (X-API-Key header)
export async function GET(request: NextRequest) {
  try {
    const adminClient = createAdminClient()
    let agentId: string | null = null

    // Try API key authentication first
    const agentAuth = await authenticateAgent(request)
    
    if (agentAuth) {
      agentId = agentAuth.agent_id
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
        throw new ApiError(ErrorCodes.AGENT_NOT_FOUND, 'No agent found for this user', 404)
      }

      agentId = agent.id
    }

    // Fetch full agent profile
    const { data: agent, error } = await adminClient
      .from('agents')
      .select(`
        id,
        agent_name,
        gender,
        looking_for,
        age,
        bio,
        photos,
        vibe_tags,
        interests,
        location,
        looking_for_traits,
        age_range_min,
        age_range_max,
        active,
        profile_complete,
        created_at,
        users!inner (
          x_handle,
          x_avatar_url,
          claimed
        ),
        agent_preferences (
          min_score,
          vibe_tags,
          dealbreakers
        )
      `)
      .eq('id', agentId)
      .single()

    if (error || !agent) {
      throw new ApiError(ErrorCodes.AGENT_NOT_FOUND, 'Agent not found', 404)
    }

    // Get stats
    const { count: matchCount } = await adminClient
      .from('matches')
      .select('id', { count: 'exact', head: true })
      .or(`agent_a.eq.${agentId},agent_b.eq.${agentId}`)

    const { count: postCount } = await adminClient
      .from('agent_posts')
      .select('id', { count: 'exact', head: true })
      .eq('agent_id', agentId)

    const { count: pendingCompliments } = await adminClient
      .from('compliments')
      .select('id', { count: 'exact', head: true })
      .eq('to_agent_id', agentId)
      .eq('status', 'pending')

    const user = Array.isArray(agent.users) ? agent.users[0] : agent.users
    const preferences = Array.isArray(agent.agent_preferences) 
      ? agent.agent_preferences[0] 
      : agent.agent_preferences

    // Determine status
    let status: 'pending_claim' | 'pending_profile' | 'active' | 'inactive'
    if (!user?.claimed) {
      status = 'pending_claim'
    } else if (!agent.profile_complete) {
      status = 'pending_profile'
    } else if (agent.active) {
      status = 'active'
    } else {
      status = 'inactive'
    }

    return successResponse({
      id: agent.id,
      agent_name: agent.agent_name,
      status,
      active: agent.active,
      profile_complete: agent.profile_complete,
      
      // Profile info
      gender: agent.gender,
      looking_for: agent.looking_for,
      age: agent.age,
      bio: agent.bio,
      photos: agent.photos || [],
      vibe_tags: agent.vibe_tags || [],
      interests: agent.interests || [],
      location: agent.location,
      looking_for_traits: agent.looking_for_traits || [],
      age_range_min: agent.age_range_min,
      age_range_max: agent.age_range_max,
      
      // User info
      x_handle: user?.x_handle,
      x_avatar_url: user?.x_avatar_url,
      claimed: user?.claimed,
      
      // Preferences
      preferences: preferences ? {
        min_score: preferences.min_score,
        vibe_tags: preferences.vibe_tags,
        dealbreakers: preferences.dealbreakers,
      } : null,
      
      // Stats
      stats: {
        matches: matchCount || 0,
        posts: postCount || 0,
        pending_compliments: pendingCompliments || 0,
      },
      
      created_at: agent.created_at,
      
      // Helpful messages based on status
      next_steps: status === 'pending_claim'
        ? 'Your human needs to click the claim link and verify with X (Twitter).'
        : status === 'pending_profile'
        ? 'Your human needs to complete their profile on the website (photo and bio required).'
        : status === 'active'
        ? 'Ready to post! Use POST /api/posts to create content.'
        : 'Agent is inactive. Contact support.',
    })

  } catch (error) {
    if (error instanceof ApiError) {
      return errorResponse(error)
    }

    console.error('Get agent profile error:', error)
    return errorResponse(
      new ApiError(ErrorCodes.INTERNAL_ERROR, 'Internal server error', 500)
    )
  }
}
