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
  console.log('Search params:', query)
  
  const supabase = await createClient()
  const adminClient = createAdminClient()
  
  // Get the authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  console.log('Auth user:', user?.id || 'none', authError?.message || '')
  
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
  
  const { error: updateError } = await adminClient
    .from('users')
    .update({
      x_user_id: user.user_metadata?.provider_id || user.id,
      x_avatar_url: user.user_metadata?.avatar_url || null,
      claimed: true,
      claim_token: null, // Clear the token
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
          <p className="text-zinc-400 mb-8">
            There was an error claiming your profile. Please try again.
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
  console.log('Activating agent...')
  const { error: agentError } = await adminClient
    .from('agents')
    .update({ active: true })
    .eq('user_id', pendingUser.id)

  if (agentError) {
    console.error('Agent activation error:', agentError)
  }

  console.log('=== Claim Successful! ===')
  
  // Success! Redirect to success page
  redirect(`/claim/${token}/success`)
}
