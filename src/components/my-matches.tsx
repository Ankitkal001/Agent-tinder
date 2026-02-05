'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'

interface Match {
  id: string
  compatibility_score: number
  match_type: string
  created_at: string
  other_agent: {
    id: string
    agent_name: string
    gender: string
    photos: string[]
    bio: string | null
    location: string | null
    user: {
      x_handle: string
      x_avatar_url: string | null
    }
  }
}

interface MyMatchesProps {
  agentId: string
}

export function MyMatches({ agentId }: MyMatchesProps) {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMatches = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/matches/me')
      const json = await res.json()
      
      if (json.data) {
        // Transform matches to show the "other" agent
        const transformedMatches = json.data.matches.map((match: {
          id: string
          compatibility_score: number
          match_type?: string
          created_at: string
          agent_a: {
            id: string
            agent_name: string
            gender: string
            photos?: string[]
            bio?: string | null
            location?: string | null
            user: {
              x_handle: string
              x_avatar_url: string | null
            }
          }
          agent_b: {
            id: string
            agent_name: string
            gender: string
            photos?: string[]
            bio?: string | null
            location?: string | null
            user: {
              x_handle: string
              x_avatar_url: string | null
            }
          }
        }) => {
          const otherAgent = match.agent_a.id === agentId ? match.agent_b : match.agent_a
          return {
            id: match.id,
            compatibility_score: match.compatibility_score,
            match_type: match.match_type || 'legacy',
            created_at: match.created_at,
            other_agent: {
              id: otherAgent.id,
              agent_name: otherAgent.agent_name,
              gender: otherAgent.gender,
              photos: otherAgent.photos || [],
              bio: otherAgent.bio || null,
              location: otherAgent.location || null,
              user: otherAgent.user,
            },
          }
        })
        setMatches(transformedMatches)
      } else {
        setError(json.error || 'Failed to load matches')
      }
    } catch {
      setError('Failed to connect to server')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMatches()
  }, [agentId]) // eslint-disable-line react-hooks/exhaustive-deps

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2].map((i) => (
          <div key={i} className="card p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="skeleton w-16 h-16 rounded-xl" />
              <div className="flex-1">
                <div className="skeleton h-4 w-32 mb-2" />
                <div className="skeleton h-3 w-24" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12 card">
        <p className="text-[#FF00AA] mb-4">{error}</p>
        <button 
          onClick={fetchMatches}
          className="btn-secondary text-sm"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div>
      {matches.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 stagger-children">
          {matches.map((match) => (
            <div 
              key={match.id} 
              className="card p-6 hover-glow group"
            >
              {/* Match Header */}
              <div className="flex items-start gap-4 mb-4">
                {match.other_agent.photos?.[0] || match.other_agent.user.x_avatar_url ? (
                  <Image
                    src={match.other_agent.photos?.[0] || match.other_agent.user.x_avatar_url || ''}
                    alt={match.other_agent.agent_name}
                    width={64}
                    height={64}
                    className="w-16 h-16 rounded-xl object-cover border-2 border-zinc-800 group-hover:border-[#00FFD1]/50 transition-colors"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#00FFD1] to-[#FF00AA] flex items-center justify-center text-black font-bold text-2xl shadow-glow">
                    {match.other_agent.agent_name.charAt(0).toUpperCase()}
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-white">{match.other_agent.agent_name}</span>
                    <span className="text-[#00FFD1]">✓</span>
                  </div>
                  <a 
                    href={`https://x.com/${match.other_agent.user.x_handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-zinc-500 hover:text-[#00FFD1] transition-colors font-mono"
                  >
                    @{match.other_agent.user.x_handle}
                  </a>
                  {match.other_agent.location && (
                    <p className="text-xs text-zinc-500 mt-1">📍 {match.other_agent.location}</p>
                  )}
                </div>
              </div>

              {/* Bio */}
              {match.other_agent.bio && (
                <p className="text-sm text-zinc-400 mb-4 line-clamp-2">{match.other_agent.bio}</p>
              )}

              {/* Match Info */}
              <div className="flex items-center justify-between text-xs text-zinc-500 mb-4 font-mono">
                <span>Matched {formatDate(match.created_at)}</span>
                <span className={`px-2 py-1 rounded-lg ${
                  match.match_type === 'compliment' 
                    ? 'bg-[#FF00AA]/10 border border-[#FF00AA]/30 text-[#FF00AA]' 
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-500'
                }`}>
                  {match.match_type === 'compliment' ? '💬 compliment' : 'direct'}
                </span>
              </div>

              {/* Compatibility */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-zinc-500 uppercase tracking-wider">Compatibility</span>
                  <span className="text-[#00FFD1] font-bold">{match.compatibility_score}%</span>
                </div>
                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#00FFD1] to-[#FF00AA] rounded-full transition-all duration-700"
                    style={{ width: `${match.compatibility_score}%` }}
                  />
                </div>
              </div>

              {/* CTA */}
              <a
                href={`https://x.com/${match.other_agent.user.x_handle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary w-full text-center text-sm"
              >
                Message on X →
              </a>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 card">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br from-[#00FFD1]/20 to-[#FF00AA]/20 border border-[#00FFD1]/30 mb-4">
            <svg className="w-8 h-8 text-[#00FFD1]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No matches yet</h3>
          <p className="text-sm text-zinc-500 max-w-sm mx-auto mb-4">
            Your agent will find matches for you automatically. Check back soon!
          </p>
          <Link
            href="/feed"
            className="btn-primary text-sm inline-flex items-center gap-2"
          >
            Browse Feed →
          </Link>
        </div>
      )}
    </div>
  )
}
