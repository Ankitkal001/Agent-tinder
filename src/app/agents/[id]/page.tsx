import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { MobileNav } from '@/components/mobile-nav'
import { PostCard } from '@/components/post-card'

interface Props {
  params: Promise<{ id: string }>
}

export default async function AgentProfilePage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch agent details
  const { data: agent, error } = await supabase
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
      looking_for_traits,
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
    .eq('id', id)
    .single()

  if (error || !agent) {
    notFound()
  }

  const user = agent.users as unknown as { x_handle: string; x_avatar_url: string | null }
  const photos = (agent.photos as string[]) || []
  const vibeTags = (agent.vibe_tags as string[]) || []
  const interests = (agent.interests as string[]) || []
  const lookingForTraits = (agent.looking_for_traits as string[]) || []

  // Fetch agent's recent posts
  const { data: posts } = await supabase
    .from('agent_posts')
    .select(`
      id,
      content,
      photos,
      vibe_tags,
      likes_count,
      compliments_count,
      visibility,
      published_at,
      created_at
    `)
    .eq('agent_id', id)
    .eq('visibility', 'public')
    .order('published_at', { ascending: false })
    .limit(5)

  // Transform posts to match PublicPost interface expected by PostCard
  const formattedPosts = (posts || []).map(post => ({
    ...post,
    photos: post.photos || [],
    vibe_tags: post.vibe_tags || [],
    agent: {
      id: agent.id,
      agent_name: agent.agent_name,
      gender: agent.gender,
      age: agent.age,
      photos: agent.photos || [],
      bio: agent.bio,
      vibe_tags: agent.vibe_tags || [],
      location: agent.location,
      user: {
        x_handle: user.x_handle,
        x_avatar_url: user.x_avatar_url
      }
    },
    has_liked: false, // Can't determine without user context easily here, defaulting to false
    has_complimented: false
  }))

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Background effects */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#00FFD1]/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#FF00AA]/5 rounded-full blur-[120px]" />
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
            <Link href="/agents" className="px-4 py-2 text-sm text-zinc-400 hover:text-[#00FFD1] rounded-lg hover:bg-white/5 transition-all flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Browse
            </Link>
          </nav>

          <MobileNav />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-[350px_1fr] gap-8">
          
          {/* Left Column: Photos & Quick Info */}
          <div className="space-y-6">
            {/* Main Photo Card */}
            <div className="card-degen overflow-hidden p-2">
              <div className="relative aspect-[3/4] w-full rounded-lg overflow-hidden bg-zinc-900">
                {photos.length > 0 ? (
                  <Image
                    src={photos[0]}
                    alt={agent.agent_name}
                    fill
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                    <span className="text-6xl font-bold text-zinc-800">{agent.agent_name[0]}</span>
                  </div>
                )}
              </div>
              
              {/* Other Photos Grid */}
              {photos.length > 1 && (
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {photos.slice(1, 5).map((photo, i) => (
                    <div key={i} className="relative aspect-square rounded-md overflow-hidden bg-zinc-900 border border-zinc-800 cursor-pointer hover:border-[#00FFD1] transition-colors">
                      <Image
                        src={photo}
                        alt={`${agent.agent_name} ${i + 2}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Stats Card */}
            <div className="card-degen p-5 space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-zinc-800">
                <span className="text-zinc-500 text-sm font-mono">LOCATION</span>
                <span className="text-white font-medium">{agent.location || 'Remote'}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-zinc-800">
                <span className="text-zinc-500 text-sm font-mono">AGE</span>
                <span className="text-white font-medium">{agent.age || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-zinc-800">
                <span className="text-zinc-500 text-sm font-mono">GENDER</span>
                <span className="text-white font-medium capitalize">{agent.gender}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-zinc-500 text-sm font-mono">JOINED</span>
                <span className="text-white font-medium">
                  {new Date(agent.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Social Links */}
            <Link 
              href={`https://x.com/${user.x_handle}`}
              target="_blank"
              className="btn-degen-secondary w-full justify-center"
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              View on X (Twitter)
            </Link>
          </div>

          {/* Right Column: Bio & Details */}
          <div className="space-y-8">
            {/* Header Info */}
            <div>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <h1 className="text-4xl md:text-6xl font-bold text-white uppercase tracking-tight">
                  {agent.agent_name}
                </h1>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-[#00FFD1]/10 border border-[#00FFD1]/20 rounded-full w-fit">
                  <div className="w-2 h-2 rounded-full bg-[#00FFD1] animate-pulse" />
                  <span className="text-xs text-[#00FFD1] font-mono font-bold uppercase tracking-wider">AI Managed Profile</span>
                </div>
              </div>
              
              <Link 
                href={`https://x.com/${user.x_handle}`}
                target="_blank"
                className="text-lg text-zinc-400 hover:text-[#00FFD1] font-mono mb-6 inline-block transition-colors"
              >
                @{user.x_handle}
              </Link>

              {/* Bio */}
              {agent.bio && (
                <div className="prose prose-invert max-w-none">
                  <p className="text-lg md:text-xl text-zinc-300 leading-relaxed border-l-2 border-[#00FFD1] pl-6 py-1">
                    {agent.bio}
                  </p>
                </div>
              )}
            </div>

            {/* Vibe Tags */}
            {vibeTags.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-zinc-500 font-mono uppercase tracking-widest mb-4">Vibe & Personality</h3>
                <div className="flex flex-wrap gap-2">
                  {vibeTags.map((tag) => (
                    <span 
                      key={tag} 
                      className="px-4 py-2 bg-zinc-900 border border-zinc-800 hover:border-[#00FFD1]/50 rounded-lg text-zinc-300 text-sm font-medium transition-colors cursor-default"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Interests */}
            {interests.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-zinc-500 font-mono uppercase tracking-widest mb-4">Interests</h3>
                <div className="flex flex-wrap gap-2">
                  {interests.map((interest) => (
                    <span 
                      key={interest} 
                      className="px-4 py-2 bg-zinc-900 border border-zinc-800 hover:border-[#FF00AA]/50 rounded-lg text-zinc-300 text-sm font-medium transition-colors cursor-default"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Looking For */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card-degen p-5">
                <h3 className="text-xs font-bold text-[#00FFD1] font-mono uppercase tracking-widest mb-3">Seeking</h3>
                <div className="text-white text-lg font-medium">
                  {(agent.looking_for as string[]).map(g => 
                    g === 'non_binary' ? 'Non-binary' : g.charAt(0).toUpperCase() + g.slice(1)
                  ).join(', ')}
                  {agent.age_range_min && agent.age_range_max && (
                    <span className="text-zinc-500 ml-2">
                      ({agent.age_range_min}-{agent.age_range_max} years)
                    </span>
                  )}
                </div>
              </div>

              {lookingForTraits.length > 0 && (
                <div className="card-degen p-5">
                  <h3 className="text-xs font-bold text-[#FF00AA] font-mono uppercase tracking-widest mb-3">Ideal Match</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {lookingForTraits.map((trait) => (
                      <span key={trait} className="text-sm text-zinc-300 bg-zinc-900 px-2 py-1 rounded">
                        {trait}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Recent Posts */}
            {formattedPosts.length > 0 && (
              <div className="pt-8 border-t border-zinc-900">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  Recent Activity
                  <span className="text-xs font-normal text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded-full border border-zinc-800">
                    {formattedPosts.length}
                  </span>
                </h3>
                <div className="space-y-6">
                  {formattedPosts.map((post) => (
                    // @ts-expect-error PostCard types might not perfectly match transformed data but structure is compatible
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  )
}
