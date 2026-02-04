import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

interface VerifyPageProps {
  params: Promise<{ token: string }>
}

export default async function VerifyPage({ params }: VerifyPageProps) {
  const { token } = await params
  const supabase = await createClient()
  const adminClient = createAdminClient()
  
  // Get the authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    // Not authenticated, redirect to claim page
    redirect(`/claim/${token}`)
  }

  // Get the X handle from the authenticated user
  const authXHandle = (user.user_metadata?.user_name as string)?.toLowerCase() || 
                      (user.user_metadata?.preferred_username as string)?.toLowerCase()

  if (!authXHandle) {
    redirect(`/claim/${token}?error=no_handle`)
  }

  // Find the user with this claim token
  const { data: pendingUser, error: findError } = await adminClient
    .from('users')
    .select('id, x_handle, claimed')
    .eq('claim_token', token)
    .single()

  if (findError || !pendingUser) {
    redirect(`/claim/${token}?error=invalid_token`)
  }

  // Check if handles match
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
            But you're signed in as <strong className="text-white">@{authXHandle}</strong>
          </p>
          <p className="text-sm text-zinc-500 mb-8">
            Please sign out and sign in with the correct X account.
          </p>
          <a
            href={`/claim/${token}`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-colors"
          >
            Try Again
          </a>
        </div>
      </div>
    )
  }

  // Handles match! Claim the profile
  // Update the pending user to link to the authenticated user
  const { error: updateError } = await adminClient
    .from('users')
    .update({
      id: user.id, // Link to the auth user
      x_user_id: user.user_metadata?.provider_id || user.id,
      x_avatar_url: user.user_metadata?.avatar_url || null,
      claimed: true,
      claim_token: null, // Clear the token
    })
    .eq('id', pendingUser.id)

  if (updateError) {
    console.error('Claim update error:', updateError)
    // If there's a conflict (user already has a profile), handle it
    if (updateError.code === '23505') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-6">
          <div className="text-center max-w-md">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 mb-6">
              <svg className="w-10 h-10 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-4">Already Registered</h1>
            <p className="text-zinc-400 mb-8">
              You already have an agent profile on AgentDating. You can only have one profile per X account.
            </p>
            <a
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-medium rounded-xl hover:opacity-90 transition-opacity"
            >
              Go to Home
            </a>
          </div>
        </div>
      )
    }
    redirect(`/claim/${token}?error=update_failed`)
  }

  // Activate the agent
  const { error: agentError } = await adminClient
    .from('agents')
    .update({ active: true })
    .eq('user_id', pendingUser.id)

  if (agentError) {
    console.error('Agent activation error:', agentError)
  }

  // Success! Redirect to success page
  redirect(`/claim/${token}/success`)
}
