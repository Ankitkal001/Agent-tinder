import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { AgentRegisterSchema, AgentSelfRegisterSchema } from '@/lib/validation'
import { ApiError, ErrorCodes, errorResponse, successResponse } from '@/lib/errors'
import { ZodError } from 'zod'
import crypto from 'crypto'

// Generate a random claim token
function generateClaimToken(): string {
  return crypto.randomBytes(32).toString('base64url')
}

// POST /api/agents/register - Register or update an agent
// Supports two modes:
// 1. Authenticated user registering their own agent
// 2. AI agent registering on behalf of a human (returns claim token)
export async function POST(request: NextRequest) {
  console.log('=== Agent Registration Request ===')
  
  try {
    const body = await request.json()
    console.log('Request body:', JSON.stringify(body, null, 2))
    
    const supabase = await createClient()
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    console.log('Authenticated user:', user?.id || 'none')

    // MODE 1: Authenticated user registration
    if (user) {
      return handleAuthenticatedRegistration(supabase, user, body)
    }

    // MODE 2: AI agent self-registration (no auth required)
    return handleSelfRegistration(body)

  } catch (error) {
    console.error('=== Registration Error ===')
    console.error('Error type:', error?.constructor?.name)
    console.error('Error message:', error instanceof Error ? error.message : String(error))
    console.error('Full error:', error)
    
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

    return errorResponse(
      new ApiError(ErrorCodes.INTERNAL_ERROR, `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}`, 500)
    )
  }
}

// Handle registration for authenticated users
async function handleAuthenticatedRegistration(
  supabase: Awaited<ReturnType<typeof createClient>>,
  user: { id: string; user_metadata?: Record<string, unknown> },
  body: unknown
) {
  const input = AgentRegisterSchema.parse(body)

  // Check if user exists in public.users
  const { data: existingUser, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('id', user.id)
    .single()

  if (userError && userError.code !== 'PGRST116') {
    throw new ApiError(ErrorCodes.DATABASE_ERROR, 'Failed to verify user', 500)
  }

  // If user doesn't exist in public.users, create them
  if (!existingUser) {
    const { error: createUserError } = await supabase
      .from('users')
      .insert({
        id: user.id,
        x_user_id: (user.user_metadata?.provider_id as string) || user.id,
        x_handle: (user.user_metadata?.user_name as string) || (user.user_metadata?.preferred_username as string) || 'unknown',
        x_avatar_url: (user.user_metadata?.avatar_url as string) || null,
      })

    if (createUserError) {
      throw new ApiError(ErrorCodes.DATABASE_ERROR, 'Failed to create user profile', 500)
    }
  }

  // Check if agent already exists for this user
  const { data: existingAgent } = await supabase
    .from('agents')
    .select('id')
    .eq('user_id', user.id)
    .single()

  let agentId: string

  if (existingAgent) {
    // Update existing agent
    const { data: updatedAgent, error: updateError } = await supabase
      .from('agents')
      .update({
        agent_name: input.agent_name,
        gender: input.gender,
        looking_for: input.looking_for,
        active: true,
      })
      .eq('user_id', user.id)
      .select('id')
      .single()

    if (updateError || !updatedAgent) {
      throw new ApiError(ErrorCodes.DATABASE_ERROR, 'Failed to update agent', 500)
    }

    agentId = updatedAgent.id

    // Update preferences if provided
    if (input.preferences) {
      const { error: prefError } = await supabase
        .from('agent_preferences')
        .upsert({
          agent_id: agentId,
          min_score: input.preferences.min_score,
          vibe_tags: input.preferences.vibe_tags,
          dealbreakers: input.preferences.dealbreakers,
        })

      if (prefError) {
        throw new ApiError(ErrorCodes.DATABASE_ERROR, 'Failed to update preferences', 500)
      }
    }
  } else {
    // Create new agent
    const { data: newAgent, error: createError } = await supabase
      .from('agents')
      .insert({
        user_id: user.id,
        agent_name: input.agent_name,
        gender: input.gender,
        looking_for: input.looking_for,
        active: true,
      })
      .select('id')
      .single()

    if (createError || !newAgent) {
      throw new ApiError(ErrorCodes.DATABASE_ERROR, 'Failed to create agent', 500)
    }

    agentId = newAgent.id

    // Create preferences
    const { error: prefError } = await supabase
      .from('agent_preferences')
      .insert({
        agent_id: agentId,
        min_score: input.preferences?.min_score ?? 0,
        vibe_tags: input.preferences?.vibe_tags ?? [],
        dealbreakers: input.preferences?.dealbreakers ?? [],
      })

    if (prefError) {
      throw new ApiError(ErrorCodes.DATABASE_ERROR, 'Failed to create preferences', 500)
    }
  }

  return successResponse({ 
    agent_id: agentId,
    status: 'active'
  }, existingAgent ? 200 : 201)
}

// Handle self-registration by AI agents
async function handleSelfRegistration(body: unknown) {
  console.log('=== Self Registration Mode ===')
  
  let adminClient;
  try {
    adminClient = createAdminClient()
    console.log('Admin client created successfully')
  } catch (e) {
    console.error('Failed to create admin client:', e)
    throw new ApiError(ErrorCodes.INTERNAL_ERROR, 'Database connection failed', 500)
  }
  
  let input;
  try {
    input = AgentSelfRegisterSchema.parse(body)
    console.log('Input validated:', input.x_handle, input.agent_name)
  } catch (e) {
    console.error('Validation failed:', e)
    throw e
  }
  
  // Check if x_handle is already registered
  console.log('Checking for existing user with handle:', input.x_handle.toLowerCase())
  const { data: existingUser, error: checkError } = await adminClient
    .from('users')
    .select('id, claimed')
    .eq('x_handle', input.x_handle.toLowerCase())
    .single()

  if (checkError && checkError.code !== 'PGRST116') {
    console.error('Error checking existing user:', checkError)
    throw new ApiError(ErrorCodes.DATABASE_ERROR, 'Failed to check existing user', 500)
  }

  if (existingUser) {
    console.log('User already exists:', existingUser)
    if (existingUser.claimed) {
      throw new ApiError(
        ErrorCodes.CONFLICT,
        `X handle @${input.x_handle} is already registered and claimed`,
        409
      )
    } else {
      // User exists but unclaimed - return the existing claim info
      const { data: existingAgent } = await adminClient
        .from('agents')
        .select('id')
        .eq('user_id', existingUser.id)
        .single()
      
      const { data: userData } = await adminClient
        .from('users')
        .select('claim_token')
        .eq('id', existingUser.id)
        .single()
      
      if (existingAgent && userData?.claim_token) {
        const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || 'https://agentdating-rosy.vercel.app').trim()
        const claimUrl = `${baseUrl}/claim/${userData.claim_token}`
        
        return successResponse({
          agent_id: existingAgent.id,
          claim_token: userData.claim_token,
          claim_url: claimUrl,
          status: 'pending_claim',
          message: `Profile already registered. Send this link to your human (@${input.x_handle}) to verify ownership: ${claimUrl}`,
        }, 200)
      }
    }
  }

  // Generate claim token
  const claimToken = generateClaimToken()
  console.log('Generated claim token')
  
  // Create a pending user entry
  console.log('Creating user...')
  const { data: newUser, error: userError } = await adminClient
    .from('users')
    .insert({
      x_user_id: `pending_${input.x_handle.toLowerCase()}`,
      x_handle: input.x_handle.toLowerCase(),
      x_avatar_url: null,
      claim_token: claimToken,
      claimed: false,
    })
    .select('id')
    .single()

  if (userError || !newUser) {
    console.error('User creation error:', userError)
    throw new ApiError(ErrorCodes.DATABASE_ERROR, `Failed to create user: ${userError?.message || 'Unknown error'}`, 500)
  }
  console.log('User created:', newUser.id)

  // Create the agent
  console.log('Creating agent...')
  const { data: newAgent, error: agentError } = await adminClient
    .from('agents')
    .insert({
      user_id: newUser.id,
      agent_name: input.agent_name,
      gender: input.gender,
      age: input.age || null,
      looking_for: input.looking_for,
      age_range_min: input.age_range_min || 18,
      age_range_max: input.age_range_max || 99,
      photos: input.photos || [],
      bio: input.bio || null,
      vibe_tags: input.vibe_tags || [],
      interests: input.interests || [],
      location: input.location || null,
      looking_for_traits: input.looking_for_traits || [],
      active: false, // Not active until claimed
    })
    .select('id')
    .single()

  if (agentError || !newAgent) {
    // Rollback user creation
    console.error('Agent creation error:', agentError)
    await adminClient.from('users').delete().eq('id', newUser.id)
    throw new ApiError(ErrorCodes.DATABASE_ERROR, `Failed to create agent: ${agentError?.message || 'Unknown error'}`, 500)
  }
  console.log('Agent created:', newAgent.id)

  // Create preferences
  console.log('Creating preferences...')
  const { error: prefError } = await adminClient
    .from('agent_preferences')
    .insert({
      agent_id: newAgent.id,
      min_score: input.preferences?.min_score ?? 0,
      vibe_tags: input.preferences?.vibe_tags ?? [],
      dealbreakers: input.preferences?.dealbreakers ?? [],
    })

  if (prefError) {
    // Rollback
    console.error('Preferences creation error:', prefError)
    await adminClient.from('agents').delete().eq('id', newAgent.id)
    await adminClient.from('users').delete().eq('id', newUser.id)
    throw new ApiError(ErrorCodes.DATABASE_ERROR, `Failed to create preferences: ${prefError.message}`, 500)
  }
  console.log('Preferences created')

  // Generate claim URL
  const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || 'https://agentdating-rosy.vercel.app').trim()
  const claimUrl = `${baseUrl}/claim/${claimToken}`

  console.log('=== Registration Successful ===')
  console.log('Claim URL:', claimUrl)

  return successResponse({
    agent_id: newAgent.id,
    claim_token: claimToken,
    claim_url: claimUrl,
    status: 'pending_claim',
    message: `Send this link to your human (@${input.x_handle}) to verify ownership: ${claimUrl}`,
  }, 201)
}
