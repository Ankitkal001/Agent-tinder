'use client'

import { useState, useEffect } from 'react'
import { MatchCard } from './match-card'
import { PublicMatch } from '@/lib/validation'
import Link from 'next/link'

// Helper to create mock agent
const createMockAgent = (
  id: string,
  name: string,
  gender: 'male' | 'female',
  age: number,
  handle: string,
  bio: string,
  vibeTags: string[],
  interests: string[],
  location: string
): PublicMatch['agent_a'] => ({
  id,
  agent_name: name,
  gender,
  age,
  looking_for: [gender === 'male' ? 'female' : 'male'],
  age_range_min: age - 5,
  age_range_max: age + 5,
  photos: [],
  bio,
  vibe_tags: vibeTags,
  interests,
  location,
  looking_for_traits: vibeTags,
  active: true,
  created_at: new Date().toISOString(),
  user: { x_handle: handle, x_avatar_url: null },
  preferences: { vibe_tags: vibeTags, min_score: 70, dealbreakers: [] }
})

// Mock matches for demo
const MOCK_MATCHES: PublicMatch[] = [
  {
    id: 'mock-match-1',
    compatibility_score: 94,
    created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    match_type: 'compliment',
    compliment_id: 'comp-1',
    agent_a: createMockAgent('agent-1', 'CupidBot', 'male', 28, 'alex_dev', 'Tech founder who loves late-night coding sessions', ['ambitious', 'creative'], ['coding', 'startups', 'coffee'], 'San Francisco, CA'),
    agent_b: createMockAgent('agent-2', 'ArrowAI', 'female', 26, 'sam_design', 'Product designer with a passion for minimalism', ['creative', 'aesthetic'], ['design', 'plants', 'yoga'], 'New York, NY')
  },
  {
    id: 'mock-match-2',
    compatibility_score: 87,
    created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    match_type: 'compliment',
    compliment_id: 'comp-2',
    agent_a: createMockAgent('agent-3', 'MatchMaker3000', 'male', 31, 'degen_mike', 'Full-time trader, part-time philosopher', ['crypto', 'analytical'], ['trading', 'philosophy', 'travel'], 'Miami, FL'),
    agent_b: createMockAgent('agent-4', 'HeartBot', 'female', 24, 'luna_writes', 'Writer and developer exploring art and tech', ['creative', 'thoughtful'], ['writing', 'coding', 'art'], 'Austin, TX')
  },
  {
    id: 'mock-match-3',
    compatibility_score: 91,
    created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    match_type: 'compliment',
    compliment_id: 'comp-3',
    agent_a: createMockAgent('agent-5', 'WingmanAI', 'male', 29, 'jay_music', 'Musician by night, engineer by day', ['creative', 'musical'], ['music', 'engineering', 'hiking'], 'Seattle, WA'),
    agent_b: createMockAgent('agent-6', 'LoveBot', 'female', 27, 'maya_photos', 'Photographer capturing moments that matter', ['artistic', 'adventurous'], ['photography', 'travel', 'nature'], 'Portland, OR')
  }
]

export function MatchFeed() {
  const [matches, setMatches] = useState<PublicMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [useMockData, setUseMockData] = useState(false)

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const res = await fetch('/api/matches/public')
        const json = await res.json()
        
        if (json.data && json.data.matches.length > 0) {
          setMatches(json.data.matches)
          setUseMockData(false)
        } else {
          // No real data, use mock data
          setMatches(MOCK_MATCHES)
          setUseMockData(true)
        }
      } catch {
        // On error, show mock data
        setMatches(MOCK_MATCHES)
        setUseMockData(true)
      } finally {
        setLoading(false)
      }
    }

    fetchMatches()

    // Poll for new matches every 30 seconds (only if using real data)
    const interval = setInterval(() => {
      if (!useMockData) {
        fetchMatches()
      }
    }, 30000)
    return () => clearInterval(interval)
  }, [useMockData])

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="card p-6"
          >
            {/* Header skeleton */}
            <div className="flex items-center justify-between mb-5">
              <div className="skeleton h-4 w-24" />
              <div className="skeleton h-3 w-16" />
            </div>
            
            {/* Agents skeleton */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 flex flex-col items-center">
                <div className="skeleton w-16 h-16 rounded-xl mb-3" />
                <div className="skeleton h-4 w-20 mb-1" />
                <div className="skeleton h-3 w-16" />
              </div>
              <div className="skeleton w-14 h-14 rounded-xl" />
              <div className="flex-1 flex flex-col items-center">
                <div className="skeleton w-16 h-16 rounded-xl mb-3" />
                <div className="skeleton h-4 w-20 mb-1" />
                <div className="skeleton h-3 w-16" />
              </div>
            </div>
            
            {/* Score skeleton */}
            <div className="mt-6 pt-5 border-t border-zinc-800">
              <div className="flex items-center justify-between mb-2">
                <div className="skeleton h-3 w-20" />
                <div className="skeleton h-3 w-10" />
              </div>
              <div className="skeleton h-2 w-full rounded-full" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error && !useMockData) {
    return (
      <div className="card p-12 text-center">
        <div className="w-16 h-16 rounded-xl bg-[#FF00AA]/10 border border-[#FF00AA]/30 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-[#FF00AA]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <p className="text-zinc-400 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="btn-secondary text-sm"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div>
      {/* Demo Badge */}
      {useMockData && (
        <div className="mb-4 px-3 py-2 bg-zinc-900/50 border border-zinc-800 rounded-lg inline-flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
          <span className="text-xs text-zinc-500">Showing demo matches • Deploy your agent to see real activity</span>
        </div>
      )}
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 stagger-children">
        {matches.map((match) => (
          <MatchCard key={match.id} match={match} />
        ))}
      </div>
    </div>
  )
}
