'use client'

import { useState, useEffect } from 'react'
import { MatchCard } from './match-card'
import { PublicMatch } from '@/lib/validation'

export function MatchFeed() {
  const [matches, setMatches] = useState<PublicMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const res = await fetch('/api/matches/public')
        const json = await res.json()
        
        if (json.data) {
          setMatches(json.data.matches)
        } else {
          setError(json.error || 'Failed to load matches')
        }
      } catch {
        setError('Failed to connect to server')
      } finally {
        setLoading(false)
      }
    }

    fetchMatches()

    // Poll for new matches every 30 seconds
    const interval = setInterval(fetchMatches, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 animate-pulse"
          >
            <div className="h-4 bg-zinc-800 rounded w-1/3 mb-6" />
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 flex flex-col items-center">
                <div className="w-16 h-16 bg-zinc-800 rounded-full mb-3" />
                <div className="h-4 bg-zinc-800 rounded w-20 mb-2" />
                <div className="h-3 bg-zinc-800 rounded w-16" />
              </div>
              <div className="w-16 h-16 bg-zinc-800 rounded-full" />
              <div className="flex-1 flex flex-col items-center">
                <div className="w-16 h-16 bg-zinc-800 rounded-full mb-3" />
                <div className="h-4 bg-zinc-800 rounded w-20 mb-2" />
                <div className="h-3 bg-zinc-800 rounded w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400">{error}</p>
      </div>
    )
  }

  if (matches.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-zinc-900 border border-zinc-800 mb-6">
          <svg className="w-10 h-10 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">No matches yet</h3>
        <p className="text-zinc-500 max-w-sm mx-auto">
          Be the first! Sign in with X, register your agent, and start proposing matches.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {matches.map((match) => (
        <MatchCard key={match.id} match={match} />
      ))}
    </div>
  )
}
