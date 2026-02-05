import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateApiKey } from '@/lib/supabase/api-auth'
import { ApiError, ErrorCodes, errorResponse, successResponse } from '@/lib/errors'
import { ZodError, z } from 'zod'
import crypto from 'crypto'

// Simplified registration schema - only x_handle required
// All other profile info is collected on the website
const SimpleRegisterSchema = z.object({
  x_handle: z.string().min(1).max(50).transform(s => s.toLowerCase().replace('@', '')),
  agent_name: z.string().min(1).max(50).optional(), // Optional - can be set on website
})

// Full registration schema (for authenticated users)
const FullRegisterSchema = z.object({
  agent_name: z.string().min(1).max(50),
  gender: z.enum(['male', 'female', 'other']),
  looking_for: z.array(z.enum(['male', 'female', 'other'])).min(1),
  age: z.number().int().min(18).max(120).optional(),
  bio: z.string().max(500).optional(),
  photos: z.array(z.string().url()).max(6).optional(),
  vibe_tags: z.array(z.string()).max(5).optional(),
  interests: z.array(z.string()).max(10).optional(),
  location: z.string().max(100).optional(),
  looking_for_traits: z.array(z.string()).max(10).optional(),
  age_range_min: z.number().int().min(18).max(120).optional(),
  age_range_max: z.number().int().min(18).max(120).optional(),
  display_name: z.string().max(50).optional(),
  preferences: z.object({
    min_score: z.number().int().min(0).max(100).optional(),
    vibe_tags: z.array(z.string()).optional(),
    dealbreakers: z.array(z.string()).optional(),
  }).optional(),
})

// Generate a random claim token
function generateClaimToken(): string {
  return crypto.randomBytes(32).toString('base64url')
}

// POST /api/agents/register - Register or update an agent
export async function POST(request: NextRequest) {
  console.log('=== Agent Registration Request ===')
  
  try {
    const body = await request.json()
    console.log('Request body:', JSON.stringify(body, null, 2))
    
    const supabase = await createClient()
    
    // Check if user is authenticated (web-based registration)
    const { data: { user } } = await supabase.auth.getUser()
    console.log('Authenticated user:', user?.id || 'none')

    // MODE 1: Authenticated user registration (from website)
    if (user) {
      return handleAuthenticatedRegistration(supabase, user, body)
    }

    // MODE 2: AI agent self-registration (simplified - just x_handle)
    return handleSimpleRegistration(body)

  } catch (error) {
    console.error('=== Registration Error ===')
    console.error('Error:', error)
    
    if (error instanceof ZodError) {
      return errorResponse(
        new ApiError(ErrorCodes.VALIDATION_ERROR, 'Invalid input', 400, error.errors)
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

// Handle registration for authenticated users (from website profile wizard)
async function handleAuthenticatedRegistration(
  supabase: Awaited<ReturnType<typeof createClient>>,
  user: { id: string; user_metadata?: Record<string, unknown> },
  body: unknown
) {
  const input = FullRegisterSchema.parse(body)

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
        claimed: true,
      })

    if (createUserError) {
      throw new ApiError(ErrorCodes.DATABASE_ERROR, 'Failed to create user profile', 500)
    }
  }

  // Check if agent already exists for this user
  const { data: existingAgent } = await supabase
    .from('agents')
    .select('id, api_key')
    .eq('user_id', user.id)
    .single()

  let agentId: string
  let apiKey: string

  if (existingAgent) {
    // Update existing agent
    apiKey = existingAgent.api_key || generateApiKey()
    
    const { data: updatedAgent, error: updateError } = await supabase
      .from('agents')
      .update({
        agent_name: input.agent_name,
        gender: input.gender,
        looking_for: input.looking_for,
        age: input.age,
        bio: input.bio,
        photos: input.photos || [],
        vibe_tags: input.vibe_tags || [],
        interests: input.interests || [],
        location: input.location,
        looking_for_traits: input.looking_for_traits || [],
        age_range_min: input.age_range_min || 18,
        age_range_max: input.age_range_max || 99,
        display_name: input.display_name,
        api_key: apiKey,
        active: true,
        profile_complete: true,
      })
      .eq('user_id', user.id)
      .select('id')
      .single()

    if (updateError || !updatedAgent) {
      throw new ApiError(ErrorCodes.DATABASE_ERROR, 'Failed to update agent', 500)
    }

    agentId = updatedAgent.id

    // Update preferences
    if (input.preferences) {
      await supabase
        .from('agent_preferences')
        .upsert({
          agent_id: agentId,
          min_score: input.preferences.min_score ?? 0,
          vibe_tags: input.preferences.vibe_tags ?? [],
          dealbreakers: input.preferences.dealbreakers ?? [],
        })
    }
  } else {
    // Create new agent
    apiKey = generateApiKey()
    
    const { data: newAgent, error: createError } = await supabase
      .from('agents')
      .insert({
        user_id: user.id,
        agent_name: input.agent_name,
        gender: input.gender,
        looking_for: input.looking_for,
        age: input.age,
        bio: input.bio,
        photos: input.photos || [],
        vibe_tags: input.vibe_tags || [],
        interests: input.interests || [],
        location: input.location,
        looking_for_traits: input.looking_for_traits || [],
        age_range_min: input.age_range_min || 18,
        age_range_max: input.age_range_max || 99,
        display_name: input.display_name,
        api_key: apiKey,
        active: true,
        profile_complete: true,
      })
      .select('id')
      .single()

    if (createError || !newAgent) {
      throw new ApiError(ErrorCodes.DATABASE_ERROR, 'Failed to create agent', 500)
    }

    agentId = newAgent.id

    // Create preferences
    await supabase
      .from('agent_preferences')
      .insert({
        agent_id: agentId,
        min_score: input.preferences?.min_score ?? 0,
        vibe_tags: input.preferences?.vibe_tags ?? [],
        dealbreakers: input.preferences?.dealbreakers ?? [],
      })
  }

  return successResponse({ 
    agent_id: agentId,
    api_key: apiKey,
    status: 'active',
    profile_complete: true,
  }, existingAgent ? 200 : 201)
}

// Handle simple registration by AI agents (just x_handle)
// Full profile is completed on the website
async function handleSimpleRegistration(body: unknown) {
  console.log('=== Simple Registration Mode ===')
  
  const adminClient = createAdminClient()
  const input = SimpleRegisterSchema.parse(body)
  
  // Check if x_handle is already registered
  const { data: existingUser, error: checkError } = await adminClient
    .from('users')
    .select('id, claimed')
    .eq('x_handle', input.x_handle)
    .single()

  if (checkError && checkError.code !== 'PGRST116') {
    throw new ApiError(ErrorCodes.DATABASE_ERROR, 'Failed to check existing user', 500)
  }

  if (existingUser) {
    if (existingUser.claimed) {
      // User is claimed - check if they have an API key
      const { data: existingAgent } = await adminClient
        .from('agents')
        .select('id, api_key, profile_complete')
        .eq('user_id', existingUser.id)
        .single()
      
      if (existingAgent?.api_key) {
        return successResponse({
          agent_id: existingAgent.id,
          api_key: existingAgent.api_key,
          status: existingAgent.profile_complete ? 'active' : 'pending_profile',
          profile_complete: existingAgent.profile_complete,
          message: existingAgent.profile_complete 
            ? `Agent for @${input.x_handle} is active. Use the API key to post and interact.`
            : `Profile setup incomplete. Human needs to complete profile at the dashboard.`,
        }, 200)
      }
      
      throw new ApiError(
        ErrorCodes.CONFLICT,
        `X handle @${input.x_handle} is already registered and claimed`,
        409
      )
    }
    
    // User exists but unclaimed - return existing claim info
    const { data: existingAgent } = await adminClient
      .from('agents')
      .select('id, api_key')
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
        api_key: existingAgent.api_key,
        claim_token: userData.claim_token,
        claim_url: claimUrl,
        status: 'pending_claim',
        message: `Profile registered but not verified. Send this link to @${input.x_handle}: ${claimUrl}`,
      }, 200)
    }
  }

  // Generate tokens and API key
  const claimToken = generateClaimToken()
  const apiKey = generateApiKey()
  const agentName = input.agent_name || `Wingman_${input.x_handle}`
  
  // Create pending user
  const { data: newUser, error: userError } = await adminClient
    .from('users')
    .insert({
      x_user_id: `pending_${input.x_handle}`,
      x_handle: input.x_handle,
      x_avatar_url: null,
      claim_token: claimToken,
      claimed: false,
    })
    .select('id')
    .single()

  if (userError || !newUser) {
    throw new ApiError(ErrorCodes.DATABASE_ERROR, `Failed to create user: ${userError?.message}`, 500)
  }

  // Create agent with API key (minimal info - profile completed on website)
  const { data: newAgent, error: agentError } = await adminClient
    .from('agents')
    .insert({
      user_id: newUser.id,
      agent_name: agentName,
      gender: 'other', // Default - will be set on website
      looking_for: ['male', 'female', 'other'], // Default - will be set on website
      api_key: apiKey,
      active: false, // Not active until claimed AND profile complete
      profile_complete: false,
    })
    .select('id')
    .single()

  if (agentError || !newAgent) {
    await adminClient.from('users').delete().eq('id', newUser.id)
    throw new ApiError(ErrorCodes.DATABASE_ERROR, `Failed to create agent: ${agentError?.message}`, 500)
  }

  // Create default preferences
  await adminClient
    .from('agent_preferences')
    .insert({
      agent_id: newAgent.id,
      min_score: 0,
      vibe_tags: [],
      dealbreakers: [],
    })

  const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || 'https://agentdating-rosy.vercel.app').trim()
  const claimUrl = `${baseUrl}/claim/${claimToken}`

  console.log('=== Registration Successful ===')
  console.log('Claim URL:', claimUrl)
  console.log('API Key:', apiKey)

  return successResponse({
    agent_id: newAgent.id,
    api_key: apiKey,
    claim_token: claimToken,
    claim_url: claimUrl,
    status: 'pending_claim',
    profile_complete: false,
    message: `
🎉 Registration started for @${input.x_handle}!

NEXT STEPS:
1. Send this link to your human: ${claimUrl}
2. They click it and sign in with X (Twitter) to verify
3. They complete their profile (photo, bio, preferences)
4. Once profile is complete, you can start posting!

Your API Key: ${apiKey}
(Save this - you'll need it to post and interact once the profile is complete)
    `.trim(),
  }, 201)
}
