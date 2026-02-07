import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ApiError, ErrorCodes, errorResponse, successResponse } from '@/lib/errors'
import { z } from 'zod'

const UpdateProfileSchema = z.object({
  agent_name: z.string().max(50).optional(), // Read-only, ignored in update
  display_name: z.string().max(50).nullable().optional(),
  bio: z.string().max(500).nullable().optional(),
  age: z.number().min(18).max(100).nullable().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  location: z.string().max(100).nullable().optional(),
  photos: z.array(z.string().url().or(z.string().startsWith('data:image/'))).max(6).optional(),
  vibe_tags: z.array(z.string()).max(10).optional(),
  interests: z.array(z.string()).max(15).optional(),
  looking_for: z.array(z.enum(['male', 'female', 'other'])).optional(),
  age_range_min: z.number().min(18).max(99).optional(),
  age_range_max: z.number().min(18).max(99).optional(),
  looking_for_traits: z.array(z.string()).max(10).optional(),
})

// GET /api/profile - Get current user's profile
export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      throw new ApiError(ErrorCodes.UNAUTHORIZED, 'Authentication required', 401)
    }

    // Get user's agent profile
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select(`
        id,
        agent_name,
        display_name,
        bio,
        age,
        gender,
        location,
        photos,
        vibe_tags,
        interests,
        looking_for,
        age_range_min,
        age_range_max,
        looking_for_traits,
        active,
        profile_complete,
        users!inner (
          x_handle,
          x_avatar_url
        )
      `)
      .eq('user_id', user.id)
      .single()

    if (agentError || !agent) {
      throw new ApiError(ErrorCodes.AGENT_NOT_FOUND, 'Agent not found', 404)
    }

    // Get additional fields from a separate metadata table if needed
    // Note: net_worth and occupation are not yet in the database
    const profile = {
      ...agent,
      net_worth: null, // Future feature
      occupation: null, // Future feature
      user: Array.isArray(agent.users) ? agent.users[0] : agent.users
    }

    return successResponse({ profile })

  } catch (error) {
    if (error instanceof ApiError) {
      return errorResponse(error)
    }

    console.error('Get profile error:', error)
    return errorResponse(
      new ApiError(ErrorCodes.INTERNAL_ERROR, 'Internal server error', 500)
    )
  }
}

// PUT /api/profile - Update current user's profile
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      throw new ApiError(ErrorCodes.UNAUTHORIZED, 'Authentication required', 401)
    }

    // Parse and validate request body
    const body = await request.json()
    const validation = UpdateProfileSchema.safeParse(body)

    if (!validation.success) {
      throw new ApiError(
        ErrorCodes.VALIDATION_ERROR,
        'Invalid profile data',
        400,
        validation.error.flatten()
      )
    }

    const updates = validation.data

    // Get user's agent
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (agentError || !agent) {
      throw new ApiError(ErrorCodes.AGENT_NOT_FOUND, 'Agent not found', 404)
    }

    // Prepare update object (only include fields that were provided)
    const updateData: Record<string, unknown> = {}
    
    if (updates.display_name !== undefined) updateData.display_name = updates.display_name
    if (updates.bio !== undefined) updateData.bio = updates.bio
    if (updates.age !== undefined) updateData.age = updates.age
    if (updates.gender !== undefined) updateData.gender = updates.gender
    if (updates.location !== undefined) updateData.location = updates.location
    if (updates.photos !== undefined) updateData.photos = updates.photos
    if (updates.vibe_tags !== undefined) updateData.vibe_tags = updates.vibe_tags
    if (updates.interests !== undefined) updateData.interests = updates.interests
    if (updates.looking_for !== undefined) updateData.looking_for = updates.looking_for
    if (updates.age_range_min !== undefined) updateData.age_range_min = updates.age_range_min
    if (updates.age_range_max !== undefined) updateData.age_range_max = updates.age_range_max
    if (updates.looking_for_traits !== undefined) updateData.looking_for_traits = updates.looking_for_traits

    // Check if profile is now complete (has bio, age, and at least one photo)
    const willHaveBio = updates.bio !== undefined ? updates.bio : null
    const willHaveAge = updates.age !== undefined ? updates.age : null
    
    // Mark profile as complete if essential fields are filled
    if (willHaveBio || willHaveAge) {
      updateData.profile_complete = true
    }

    // Update the agent profile
    const { data: updatedAgent, error: updateError } = await supabase
      .from('agents')
      .update(updateData)
      .eq('id', agent.id)
      .select()
      .single()

    if (updateError) {
      console.error('Update profile error:', updateError)
      throw new ApiError(ErrorCodes.DATABASE_ERROR, 'Failed to update profile', 500)
    }

    return successResponse({
      message: 'Profile updated successfully',
      profile: updatedAgent
    })

  } catch (error) {
    if (error instanceof ApiError) {
      return errorResponse(error)
    }

    console.error('Update profile error:', error)
    return errorResponse(
      new ApiError(ErrorCodes.INTERNAL_ERROR, 'Internal server error', 500)
    )
  }
}
