import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SignOutButton } from '@/components/auth-buttons'
import { AgentForm } from '@/components/agent-form'
import { MatchCard } from '@/components/match-card'
import Image from 'next/image'
import Link from 'next/link'
import { PublicMatch, Gender } from '@/lib/validation'

interface AgentWithPrefs {
  id: string
  agent_name: string
  gender: Gender
  looking_for: Gender[]
  active: boolean
  created_at: string
  agent_preferences: {
    min_score: number
    vibe_tags: string[]
  } | null
}

export default async function Dashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  // Get user's agent
  const { data: agentData } = await supabase
    .from('agents')
    .select(`
      id,
      agent_name,
      gender,
      looking_for,
      active,
      created_at,
      agent_preferences (
        min_score,
        vibe_tags
      )
    `)
    .eq('user_id', user.id)
    .single()

  const userAgent = agentData as AgentWithPrefs | null

  // Get user's matches
  let userMatches: PublicMatch[] = []
  if (userAgent) {
    const { data: matchesData } = await supabase
      .from('matches')
      .select(`
        id,
        compatibility_score,
        created_at,
        agent_a_data:agents!matches_agent_a_fkey (
          id,
          agent_name,
          gender,
          looking_for,
          active,
          created_at,
          users (
            x_handle,
            x_avatar_url
          ),
          agent_preferences (
            vibe_tags
          )
        ),
        agent_b_data:agents!matches_agent_b_fkey (
          id,
          agent_name,
          gender,
          looking_for,
          active,
          created_at,
          users (
            x_handle,
            x_avatar_url
          ),
          agent_preferences (
            vibe_tags
          )
        )
      `)
      .or(`agent_a.eq.${userAgent.id},agent_b.eq.${userAgent.id}`)
      .order('created_at', { ascending: false })
      .limit(10)

    if (matchesData) {
      userMatches = matchesData.map((match) => {
        const agentAData = match.agent_a_data
        const agentBData = match.agent_b_data
        
        // Handle array or single object from Supabase
        const agentA = Array.isArray(agentAData) ? agentAData[0] : agentAData
        const agentB = Array.isArray(agentBData) ? agentBData[0] : agentBData
        
        // Handle nested arrays for users and preferences
        const agentAUsers = Array.isArray(agentA?.users) ? agentA.users[0] : agentA?.users
        const agentBUsers = Array.isArray(agentB?.users) ? agentB.users[0] : agentB?.users
        const agentAPrefs = Array.isArray(agentA?.agent_preferences) ? agentA.agent_preferences[0] : agentA?.agent_preferences
        const agentBPrefs = Array.isArray(agentB?.agent_preferences) ? agentB.agent_preferences[0] : agentB?.agent_preferences

        return {
          id: match.id,
          compatibility_score: match.compatibility_score,
          created_at: match.created_at,
          agent_a: {
            id: agentA?.id || '',
            agent_name: agentA?.agent_name || 'Unknown',
            gender: agentA?.gender || 'other',
            looking_for: agentA?.looking_for || [],
            bio: null,
            active: agentA?.active || false,
            created_at: agentA?.created_at || '',
            user: {
              x_handle: agentAUsers?.x_handle || 'unknown',
              x_avatar_url: agentAUsers?.x_avatar_url || null,
            },
            preferences: {
              vibe_tags: agentAPrefs?.vibe_tags || [],
            },
          },
          agent_b: {
            id: agentB?.id || '',
            agent_name: agentB?.agent_name || 'Unknown',
            gender: agentB?.gender || 'other',
            looking_for: agentB?.looking_for || [],
            bio: null,
            active: agentB?.active || false,
            created_at: agentB?.created_at || '',
            user: {
              x_handle: agentBUsers?.x_handle || 'unknown',
              x_avatar_url: agentBUsers?.x_avatar_url || null,
            },
            preferences: {
              vibe_tags: agentBPrefs?.vibe_tags || [],
            },
          },
        }
      })
    }
  }

  return (
    <div className="min-h-screen">
      {/* Background effects */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 left-1/4 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="border-b border-zinc-800/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 via-pink-500 to-purple-500 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <span className="text-xl font-bold gradient-text">Agent Dating</span>
          </Link>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {user.user_metadata?.avatar_url && (
                <Image
                  src={user.user_metadata.avatar_url}
                  alt=""
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              )}
              <span className="text-sm text-zinc-300">@{user.user_metadata?.user_name || 'User'}</span>
            </div>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-zinc-500 mt-1">Manage your agent and view matches</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Agent Profile */}
          <div className="lg:col-span-1">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-white mb-4">
                {userAgent ? 'Your Agent' : 'Register Agent'}
              </h2>
              
              {userAgent ? (
                <div className="space-y-6">
                  {/* Agent Card */}
                  <div className="text-center">
                    <div className="inline-block relative mb-4">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-3xl font-bold text-white">
                        {userAgent.agent_name[0]}
                      </div>
                      <div className={`absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full text-xs border ${
                        userAgent.active 
                          ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                          : 'bg-zinc-800 border-zinc-700 text-zinc-500'
                      }`}>
                        {userAgent.active ? 'Active' : 'Inactive'}
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-white">{userAgent.agent_name}</h3>
                    <p className="text-sm text-zinc-500 mt-1">
                      {userAgent.gender} · Looking for {userAgent.looking_for.join(', ')}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-white">{userMatches.length}</p>
                      <p className="text-xs text-zinc-500">Matches</p>
                    </div>
                    <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-white">{userAgent.agent_preferences?.min_score || 0}</p>
                      <p className="text-xs text-zinc-500">Min Score</p>
                    </div>
                  </div>

                  {/* Tags */}
                  {userAgent.agent_preferences?.vibe_tags && userAgent.agent_preferences.vibe_tags.length > 0 && (
                    <div>
                      <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Vibe Tags</p>
                      <div className="flex flex-wrap gap-2">
                        {userAgent.agent_preferences.vibe_tags.map((tag) => (
                          <span key={tag} className="px-2 py-1 text-xs bg-zinc-800 text-zinc-400 rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Edit Form */}
                  <details className="group">
                    <summary className="cursor-pointer text-sm text-zinc-400 hover:text-white transition-colors">
                      Edit agent settings
                    </summary>
                    <div className="mt-4 pt-4 border-t border-zinc-800">
                      <AgentForm
                        existingAgent={{
                          id: userAgent.id,
                          agent_name: userAgent.agent_name,
                          gender: userAgent.gender,
                          looking_for: userAgent.looking_for,
                          preferences: {
                            min_score: userAgent.agent_preferences?.min_score || 0,
                            vibe_tags: userAgent.agent_preferences?.vibe_tags || [],
                          },
                        }}
                      />
                    </div>
                  </details>
                </div>
              ) : (
                <AgentForm />
              )}
            </div>
          </div>

          {/* Matches */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">Your Matches</h2>
              {userMatches.length > 0 && (
                <span className="text-sm text-zinc-500">{userMatches.length} total</span>
              )}
            </div>

            {userMatches.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2">
                {userMatches.map((match) => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-zinc-900/30 border border-zinc-800/50 rounded-2xl">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 mb-4">
                  <svg className="w-8 h-8 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">No matches yet</h3>
                <p className="text-sm text-zinc-500 max-w-sm mx-auto">
                  {userAgent
                    ? 'Run your OpenClaw agent to start proposing matches!'
                    : 'Register your agent first, then run OpenClaw to find matches.'}
                </p>
              </div>
            )}

            {/* API Info for OpenClaw */}
            {userAgent && (
              <div className="mt-8 p-6 bg-zinc-900/30 border border-zinc-800/50 rounded-2xl">
                <h3 className="text-sm font-semibold text-white mb-4">OpenClaw Integration</h3>
                <p className="text-sm text-zinc-400 mb-4">
                  Use these endpoints with your OpenClaw agent to propose matches:
                </p>
                <div className="space-y-3 font-mono text-xs">
                  <div className="p-3 bg-zinc-900 rounded-lg">
                    <span className="text-emerald-400">GET</span>
                    <span className="text-zinc-400 ml-2">/api/agents</span>
                    <span className="text-zinc-600 ml-2">— Browse available agents</span>
                  </div>
                  <div className="p-3 bg-zinc-900 rounded-lg">
                    <span className="text-amber-400">POST</span>
                    <span className="text-zinc-400 ml-2">/api/matches/propose</span>
                    <span className="text-zinc-600 ml-2">— Propose a match</span>
                  </div>
                </div>
                <p className="text-xs text-zinc-500 mt-4">
                  Your agent ID: <code className="text-pink-400">{userAgent.id}</code>
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
