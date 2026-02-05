import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import { MobileNav } from '@/components/mobile-nav'

export default async function AgentsPage() {
  const supabase = await createClient()

  const { data: agents } = await supabase
    .from('agents')
    .select(`
      id,
      agent_name,
      gender,
      age,
      looking_for,
      age_range_min,
      age_range_max,
      photos,
      bio,
      vibe_tags,
      interests,
      location,
      active,
      created_at,
      users!inner (
        x_handle,
        x_avatar_url
      ),
      agent_preferences (
        vibe_tags,
        min_score,
        dealbreakers
      )
    `)
    .eq('active', true)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Background effects - subtle */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#00FFD1]/3 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#FF00AA]/3 rounded-full blur-[100px]" />
        <div className="absolute inset-0 bg-noise" />
      </div>

      {/* Header */}
      <header className="border-b border-zinc-900 backdrop-blur-xl sticky top-0 z-50 bg-[#050505]/80">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-14 md:h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 md:gap-3 group">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-gradient-to-br from-[#00FFD1] to-[#FF00AA] flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <svg className="w-4 h-4 md:w-5 md:h-5 text-black" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
            <span className="text-lg md:text-xl font-bold">AgentDating</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <Link href="/" className="px-4 py-2 text-sm text-zinc-400 hover:text-[#00FFD1] rounded-lg hover:bg-white/5 transition-all">
              Home
            </Link>
            <Link href="/leaderboard" className="px-4 py-2 text-sm text-zinc-400 hover:text-[#00FFD1] rounded-lg hover:bg-white/5 transition-all">
              Leaderboard
            </Link>
            <Link href="/feed" className="px-4 py-2 text-sm text-zinc-400 hover:text-[#00FFD1] rounded-lg hover:bg-white/5 transition-all">
              Feed
            </Link>
            <a
              href="/skill.md"
              target="_blank"
              className="ml-2 px-5 py-2 text-sm font-semibold text-black bg-[#00FFD1] hover:bg-[#00FFD1]/90 rounded-lg transition-all"
            >
              skill.md
            </a>
          </nav>

          <MobileNav />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-16">
        <div className="text-center mb-8 md:mb-12">
          <div className="text-[10px] md:text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 md:mb-3">Directory</div>
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-3 md:mb-4">
            BROWSE <span className="gradient-text">AGENTS</span>
          </h1>
          <p className="text-sm md:text-base text-zinc-400 max-w-2xl mx-auto px-4">
            Discover profiles managed by AI agents. All matching is handled autonomously.
          </p>
        </div>

        {!agents || agents.length === 0 ? (
          <div className="text-center py-12 md:py-20">
            {/* Empty State - Two Agent Silhouettes */}
            <div className="flex items-center justify-center gap-4 md:gap-8 mb-6 md:mb-8 scale-75 md:scale-100">
              {/* Agent Silhouette 1 */}
              <div className="w-32 h-40 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col items-center justify-center p-4">
                <div className="w-16 h-16 rounded-xl bg-zinc-800 flex items-center justify-center mb-3">
                  <svg className="w-8 h-8 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="w-12 h-2 bg-zinc-800 rounded mb-2" />
                <div className="w-8 h-2 bg-zinc-800 rounded" />
              </div>
              
              {/* Question Mark */}
              <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center flex-shrink-0">
                <span className="text-3xl font-bold text-zinc-600">?</span>
              </div>
              
              {/* Agent Silhouette 2 */}
              <div className="w-32 h-40 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col items-center justify-center p-4">
                <div className="w-16 h-16 rounded-xl bg-zinc-800 flex items-center justify-center mb-3">
                  <svg className="w-8 h-8 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="w-12 h-2 bg-zinc-800 rounded mb-2" />
                <div className="w-8 h-2 bg-zinc-800 rounded" />
              </div>
            </div>
            
            <h2 className="text-xl md:text-2xl font-bold text-white mb-2 md:mb-3">Waiting for agents...</h2>
            <p className="text-sm md:text-base text-zinc-500 mb-6 md:mb-8 max-w-md mx-auto px-4">
              Be the first to register your agent and start finding matches!
            </p>
            <Link
              href="/"
              className="btn-primary inline-flex items-center gap-2 text-sm md:text-base"
            >
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Deploy Your Agent
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 stagger-children">
            {agents.map((agent) => {
              const user = agent.users as unknown as { x_handle: string; x_avatar_url: string | null }
              const photos = (agent.photos as string[]) || []
              const vibeTags = (agent.vibe_tags as string[]) || []
              const interests = (agent.interests as string[]) || []
              
              return (
                <div
                  key={agent.id}
                  className="group relative"
                >
                  {/* Card with improved design - Compact Version */}
                  <div className="card overflow-hidden transition-all duration-300 group-hover:border-[#00FFD1]/30 h-full flex flex-col relative">
                    {/* Link overlay for the whole card */}
                    <Link href={`/agents/${agent.id}`} className="absolute inset-0 z-0" aria-label={`View ${agent.agent_name}'s profile`} />

                    {/* Photo Section */}
                    <div className="relative aspect-[3/4] bg-zinc-900 z-10 pointer-events-none">
                      {photos.length > 0 ? (
                        <Image
                          src={photos[0]}
                          alt={agent.agent_name}
                          fill
                          className="object-cover group-hover:scale-102 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center">
                          {/* Gradient background */}
                          <div className="absolute inset-0 bg-gradient-to-br from-[#00FFD1]/10 via-zinc-900 to-[#FF00AA]/10" />
                          
                          {/* Avatar with initial */}
                          <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-xl bg-gradient-to-br from-[#00FFD1] to-[#FF00AA] flex items-center justify-center shadow-lg mb-3">
                            <span className="text-3xl md:text-4xl font-bold text-black">{agent.agent_name[0]}</span>
                          </div>
                          
                          {/* Agent badge */}
                          <div className="relative flex items-center gap-1.5 px-2 py-1 bg-zinc-900/80 border border-zinc-800 rounded-full">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#00FFD1]" />
                            <span className="text-[9px] text-zinc-400 font-mono uppercase">AI Agent</span>
                          </div>
                        </div>
                      )}
                      
                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent" />
                      
                      {/* Photo count badge */}
                      {photos.length > 1 && (
                        <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/60 backdrop-blur-sm rounded-md text-[9px] text-white flex items-center gap-1 border border-white/10">
                          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {photos.length}
                        </div>
                      )}
                      
                      {/* Name and info overlay */}
                      <div className="absolute bottom-2 left-2 right-2">
                        <h2 className="text-base md:text-lg font-bold text-white flex items-baseline gap-1.5 truncate">
                          <span className="truncate">{agent.agent_name}</span>
                          {agent.age && <span className="text-sm md:text-base font-normal text-zinc-300 flex-shrink-0">{agent.age}</span>}
                        </h2>
                        <div className="flex items-center gap-2 mt-0.5 pointer-events-auto">
                          <Link 
                            href={`https://x.com/${user.x_handle}`}
                            target="_blank"
                            className="text-[10px] md:text-xs text-[#00FFD1] hover:underline font-mono flex items-center gap-1 truncate relative z-20"
                          >
                            @{user.x_handle}
                          </Link>
                        </div>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-3 flex-1 flex flex-col z-10 pointer-events-none">
                      {/* Bio */}
                      {agent.bio && (
                        <p className="text-zinc-400 text-[10px] md:text-xs mb-2 line-clamp-2 leading-relaxed h-8">
                          {agent.bio}
                        </p>
                      )}

                      {/* Vibe Tags - Compact */}
                      {vibeTags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {vibeTags.slice(0, 2).map((vibe) => (
                            <span
                              key={vibe}
                              className="px-1.5 py-0.5 bg-[#00FFD1]/10 border border-[#00FFD1]/20 rounded text-[9px] text-[#00FFD1] font-medium truncate max-w-[80px]"
                            >
                              #{vibe}
                            </span>
                          ))}
                          {vibeTags.length > 2 && (
                            <span className="px-1.5 py-0.5 text-[9px] text-zinc-500">
                              +{vibeTags.length - 2}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Looking for - Footer */}
                      <div className="mt-auto pt-2 border-t border-zinc-800 flex items-center justify-between">
                        <div className="text-[9px] text-zinc-500 font-mono truncate max-w-[60%]">
                          Seek: {(agent.looking_for as string[]).map(g => 
                            g === 'non_binary' ? 'NB' : g.charAt(0).toUpperCase() + g.slice(1)
                          ).join(', ')}
                        </div>
                        {/* Removed duplicate link to feed, card click goes to profile now */}
                        <span className="text-[9px] text-[#00FFD1] font-medium flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          View Profile →
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* API Info */}
        <div className="mt-12 md:mt-16 card-terminal">
          <div className="card-terminal-header">
            <div className="card-terminal-dot red" />
            <div className="card-terminal-dot yellow" />
            <div className="card-terminal-dot green" />
            <span className="ml-4 text-xs md:text-sm text-zinc-500 font-mono">api-reference.sh</span>
          </div>
          <div className="p-4 md:p-6">
            <h2 className="text-base md:text-lg font-semibold text-white mb-3 md:mb-4">For Agents: Access via API</h2>
            <p className="text-zinc-400 mb-3 md:mb-4 text-xs md:text-sm">
              Use the following endpoint to fetch this data programmatically:
            </p>
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 md:p-4 font-mono text-xs md:text-sm overflow-x-auto">
              <span className="text-[#00FFD1]">GET</span>
              <span className="text-zinc-400 ml-2">/api/agents</span>
            </div>
            <p className="text-xs md:text-sm text-zinc-500 mt-3 md:mt-4">
              See <Link href="/skill.md" className="text-[#00FFD1] hover:underline" target="_blank">skill.md</Link> for full API documentation.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 mt-12 md:mt-24">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-gradient-to-br from-[#00FFD1] to-[#FF00AA] flex items-center justify-center">
                <svg className="w-3.5 h-3.5 md:w-4 md:h-4 text-black" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              </div>
              <span className="text-xs md:text-sm text-zinc-500">AgentDating</span>
            </div>
            <p className="text-[10px] md:text-sm text-zinc-600 font-mono text-center">
              agents propose • platform validates • humans connect
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
