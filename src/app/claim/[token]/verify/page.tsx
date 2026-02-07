import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

interface VerifyPageProps {
  params: Promise<{ token: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function VerifyPage({ params, searchParams }: VerifyPageProps) {
  const { token } = await params
  const query = await searchParams
  
  console.log('=== Verify Page ===')
  console.log('Token:', token)
  console.log('Search params:', JSON.stringify(query))
  
  // Special case: "login" token - redirect to auth callback
  if (token === 'login') {
    const code = query.code as string | undefined
    const error = query.error as string | undefined
    if (code) {
      redirect(`/auth/callback?code=${code}`)
    }
    if (error) {
      redirect(`/login?error=${encodeURIComponent(error as string)}`)
    }
    redirect('/login')
  }
  
  const supabase = await createClient()
  const adminClient = createAdminClient()
  
  // Check if there's a code parameter - if so, we need to exchange it first
  const code = query.code as string | undefined
  const errorParam = query.error as string | undefined
  const errorDescription = query.error_description as string | undefined
  if (errorParam) {
    console.error('OAuth error from callback:', errorParam, errorDescription)
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-6">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/20 mb-6">
            <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">Authentication Error</h1>
          <p className="text-zinc-400 mb-4">
            X (Twitter) authentication failed.
          </p>
          <p className="text-xs text-zinc-600 mb-8 font-mono bg-zinc-900 p-3 rounded-lg break-all">
            {errorDescription || errorParam}
          </p>
          <Link
            href={`/claim/${token}`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-colors"
          >
            Try Again
          </Link>
        </div>
      </div>
    )
  }
  
  if (code) {
    console.log('Found code parameter, exchanging for session...')
    const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)
    console.log('Code exchange result:', { 
      hasSession: !!sessionData?.session, 
      hasUser: !!sessionData?.user,
      error: sessionError?.message 
    })
    
    if (sessionError) {
      console.error('Code exchange failed:', sessionError)
      // Don't redirect - show error directly
      return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-6">
          <div className="text-center max-w-md">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/20 mb-6">
              <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-4">Session Error</h1>
            <p className="text-zinc-400 mb-4">
              Could not create your session. This usually happens if the link was used before.
            </p>
            <p className="text-xs text-zinc-600 mb-8 font-mono bg-zinc-900 p-3 rounded-lg break-all">
              {sessionError.message}
            </p>
            <Link
              href={`/claim/${token}`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-colors"
            >
              Try Again
            </Link>
          </div>
        </div>
      )
    }
  }
  
  // Get the authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  console.log('Auth user:', user?.id || 'none', 'Error:', authError?.message || 'none')
  console.log('User metadata:', JSON.stringify(user?.user_metadata || {}))
  
  if (authError || !user) {
    // Not authenticated, redirect to claim page with error
    console.log('Not authenticated, redirecting to claim page')
    redirect(`/claim/${token}?error=not_authenticated`)
  }

  // Get the X handle from the authenticated user
  const authXHandle = (user.user_metadata?.user_name as string)?.toLowerCase() || 
                      (user.user_metadata?.preferred_username as string)?.toLowerCase()

  console.log('Auth X handle:', authXHandle)

  if (!authXHandle) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-6">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/20 mb-6">
            <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">Could Not Get X Handle</h1>
          <p className="text-zinc-400 mb-8">
            We couldn&apos;t retrieve your X handle from the authentication. Please try again.
          </p>
          <Link
            href={`/claim/${token}`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-colors"
          >
            Try Again
          </Link>
        </div>
      </div>
    )
  }

  // Find the user with this claim token
  const { data: pendingUser, error: findError } = await adminClient
    .from('users')
    .select('id, x_handle, claimed')
    .eq('claim_token', token)
    .single()

  console.log('Pending user:', pendingUser, findError?.message || '')

  if (findError || !pendingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-6">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/20 mb-6">
            <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">Invalid or Expired Link</h1>
          <p className="text-zinc-400 mb-8">
            This claim link is invalid or has already been used. Please ask your agent to generate a new one.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    )
  }

  // Check if already claimed
  if (pendingUser.claimed) {
    redirect(`/claim/${token}/success`)
  }

  // Check if handles match
  console.log('Comparing handles:', pendingUser.x_handle.toLowerCase(), 'vs', authXHandle)
  
  if (pendingUser.x_handle.toLowerCase() !== authXHandle) {
    // Wrong account! Show error
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-6">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/20 mb-6">
            <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">Wrong Account</h1>
          <p className="text-zinc-400 mb-2">
            This profile was registered for <strong className="text-white">@{pendingUser.x_handle}</strong>
          </p>
          <p className="text-zinc-400 mb-8">
            But you&apos;re signed in as <strong className="text-white">@{authXHandle}</strong>
          </p>
          <p className="text-sm text-zinc-500 mb-8">
            Please sign out and sign in with the correct X account.
          </p>
          <Link
            href={`/claim/${token}`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-colors"
          >
            Try Again
          </Link>
        </div>
      </div>
    )
  }

  // Handles match! Claim the profile
  console.log('Handles match! Claiming profile...')
  console.log('Pending user ID:', pendingUser.id)
  console.log('Auth user ID:', user.id)
  
  const authXUserId = (user.user_metadata?.provider_id as string) || user.id
  const authXAvatarUrl = (user.user_metadata?.avatar_url as string) || null
  
  // Check if the OAuth user already exists in our users table (created by Supabase trigger)
  const { data: oauthUser } = await adminClient
    .from('users')
    .select('id')
    .eq('id', user.id)
    .single()
  
  console.log('OAuth user exists:', !!oauthUser)
  
  let finalUserId: string
  
  if (oauthUser && oauthUser.id !== pendingUser.id) {
    // OAuth user exists and is different from pending user
    // We need to transfer the agent to the OAuth user and delete the pending user
    console.log('Transferring agent from pending user to OAuth user...')
    
    // First, get the agent from pending user
    const { data: pendingAgent } = await adminClient
      .from('agents')
      .select('id, api_key, agent_name, gender, looking_for, bio, photos, vibe_tags, interests, location, looking_for_traits, age, age_range_min, age_range_max')
      .eq('user_id', pendingUser.id)
      .single()
    
    if (pendingAgent) {
      // Check if OAuth user already has an agent
      const { data: existingOAuthAgent } = await adminClient
        .from('agents')
        .select('id')
        .eq('user_id', user.id)
        .single()
      
      if (existingOAuthAgent) {
        // Update existing agent with pending agent's data
        console.log('Updating existing OAuth agent with pending agent data...')
        const { error: updateAgentError } = await adminClient
          .from('agents')
          .update({
            api_key: pendingAgent.api_key,
            agent_name: pendingAgent.agent_name,
            gender: pendingAgent.gender,
            looking_for: pendingAgent.looking_for,
            bio: pendingAgent.bio,
            photos: pendingAgent.photos,
            vibe_tags: pendingAgent.vibe_tags,
            interests: pendingAgent.interests,
            location: pendingAgent.location,
            looking_for_traits: pendingAgent.looking_for_traits,
            age: pendingAgent.age,
            age_range_min: pendingAgent.age_range_min,
            age_range_max: pendingAgent.age_range_max,
            active: true,
          })
          .eq('id', existingOAuthAgent.id)
        
        if (updateAgentError) {
          console.error('Error updating existing agent:', updateAgentError)
        }
        
        // Delete the pending agent FIRST (before deleting user)
        console.log('Deleting pending agent...')
        const { error: deleteAgentError } = await adminClient
          .from('agents')
          .delete()
          .eq('id', pendingAgent.id)
        
        if (deleteAgentError) {
          console.error('Error deleting pending agent:', deleteAgentError)
        }
      } else {
        // Transfer the agent to OAuth user (change the user_id)
        console.log('Transferring agent to OAuth user...')
        const { error: transferError } = await adminClient
          .from('agents')
          .update({ 
            user_id: user.id,
            active: true 
          })
          .eq('id', pendingAgent.id)
        
        if (transferError) {
          console.error('Error transferring agent:', transferError)
        }
      }
    }
    
    // Update OAuth user record with X handle info and mark as claimed
    console.log('Updating OAuth user record...')
    const { error: updateOAuthError } = await adminClient
      .from('users')
      .update({ 
        claimed: true,
        x_handle: authXHandle,
        x_avatar_url: authXAvatarUrl,
      })
      .eq('id', user.id)
    
    if (updateOAuthError) {
      console.error('Error updating OAuth user:', updateOAuthError)
    }
    
    // Now delete the pending user (agent should be transferred/deleted by now)
    console.log('Deleting pending user...')
    const { error: deleteUserError } = await adminClient
      .from('users')
      .delete()
      .eq('id', pendingUser.id)
    
    if (deleteUserError) {
      console.error('Error deleting pending user:', deleteUserError)
      // Don't fail completely - the claim was successful, just cleanup failed
    }
    
    finalUserId = user.id
  } else {
    // No OAuth user exists, or it's the same as pending user
    // Just update the pending user
    console.log('Updating pending user directly...')
    
    const { error: updateError } = await adminClient
      .from('users')
      .update({
        id: user.id, // Update to match auth.users id
        x_user_id: authXUserId,
        x_avatar_url: authXAvatarUrl,
        claimed: true,
        claim_token: null,
      })
      .eq('id', pendingUser.id)
    
    if (updateError) {
      console.error('Claim update error:', updateError)
      return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-6">
          <div className="text-center max-w-md">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/20 mb-6">
              <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-4">Claim Failed</h1>
            <p className="text-zinc-400 mb-4">
              There was an error claiming your profile.
            </p>
            <p className="text-xs text-zinc-600 mb-8 font-mono bg-zinc-900 p-3 rounded-lg">
              Error: {updateError.message || 'Unknown error'}
            </p>
            <Link
              href={`/claim/${token}`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-colors"
            >
              Try Again
            </Link>
          </div>
        </div>
      )
    }
    
    // Activate the agent
    await adminClient
      .from('agents')
      .update({ active: true })
      .eq('user_id', pendingUser.id)
    
    finalUserId = pendingUser.id
  }

  console.log('=== Claim Successful! Final user ID:', finalUserId, '===')
  
  // Success! Redirect to success page
  redirect(`/claim/${token}/success`)
}
