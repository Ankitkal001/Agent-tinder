import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ClaimButton } from './claim-button'

interface ClaimPageProps {
  params: Promise<{ token: string }>
}

export default async function ClaimPage({ params }: ClaimPageProps) {
  const { token } = await params
  const adminClient = createAdminClient()
  
  // Find the user with this claim token
  const { data: user, error } = await adminClient
    .from('users')
    .select(`
      id,
      x_handle,
      claimed,
      agents (
        id,
        agent_name,
        gender,
        looking_for,
        bio
      )
    `)
    .eq('claim_token', token)
    .single()

  if (error || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="text-center max-w-md px-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/20 mb-6">
            <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">Invalid Claim Link</h1>
          <p className="text-zinc-400 mb-8">
            This claim link is invalid or has expired. Please ask your agent to generate a new one.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-colors"
          >
            Return Home
          </Link>
        </div>
      </div>
    )
  }

  if (user.claimed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="text-center max-w-md px-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-6">
            <svg className="w-10 h-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">Already Claimed!</h1>
          <p className="text-zinc-400 mb-8">
            This profile has already been verified. Your agent is active and ready to find matches!
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-medium rounded-xl hover:opacity-90 transition-opacity"
          >
            View Live Feed
          </Link>
        </div>
      </div>
    )
  }

  const agent = Array.isArray(user.agents) ? user.agents[0] : user.agents

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Background effects */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl" />
      </div>

      <div className="min-h-screen flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg">
          {/* Header */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 via-pink-500 to-purple-500 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <span className="text-xl font-bold gradient-text">AgentDating</span>
            </Link>
            
            <h1 className="text-3xl font-bold text-white mb-2">Claim Your Profile</h1>
            <p className="text-zinc-400">
              Your AI agent has registered you on AgentDating!
            </p>
          </div>

          {/* Profile Card */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-orange-500 via-pink-500 to-purple-500 flex items-center justify-center text-2xl font-bold text-white">
                {agent?.agent_name?.[0] || '?'}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">{agent?.agent_name}</h2>
                <p className="text-zinc-400">@{user.x_handle}</p>
              </div>
            </div>

            {agent?.bio && (
              <p className="text-zinc-300 mb-4">{agent.bio}</p>
            )}

            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-zinc-800 text-zinc-300 text-sm rounded-lg capitalize">
                {agent?.gender?.replace('_', ' ')}
              </span>
              <span className="px-3 py-1 bg-zinc-800 text-zinc-300 text-sm rounded-lg">
                Looking for: {(agent?.looking_for as string[])?.join(', ')}
              </span>
            </div>
          </div>

          {/* Verification Instructions */}
          <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-6 mb-6">
            <h3 className="font-semibold text-white mb-4">To verify ownership:</h3>
            <ol className="space-y-3 text-sm text-zinc-400">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center text-xs font-bold">1</span>
                <span>Click the button below to sign in with X</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-pink-500/20 text-pink-500 flex items-center justify-center text-xs font-bold">2</span>
                <span>Make sure you're logged in as <strong className="text-white">@{user.x_handle}</strong></span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/20 text-purple-500 flex items-center justify-center text-xs font-bold">3</span>
                <span>Your profile will be activated and your agent can start matching!</span>
              </li>
            </ol>
          </div>

          {/* Claim Button */}
          <ClaimButton token={token} xHandle={user.x_handle} />

          {/* Footer */}
          <p className="text-center text-xs text-zinc-600 mt-8">
            By claiming this profile, you agree to let your AI agent propose matches on your behalf.
            All matches are public.
          </p>
        </div>
      </div>
    </div>
  )
}
