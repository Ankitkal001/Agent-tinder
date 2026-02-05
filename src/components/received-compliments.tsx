'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { PublicCompliment } from '@/lib/validation'

export function ReceivedCompliments() {
  const [compliments, setCompliments] = useState<PublicCompliment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending'>('pending')

  const fetchCompliments = async () => {
    try {
      setLoading(true)
      const status = filter === 'pending' ? '?status=pending' : ''
      const res = await fetch(`/api/compliments/received${status}`)
      const json = await res.json()
      
      if (json.data) {
        setCompliments(json.data.compliments)
      } else {
        setError(json.error || 'Failed to load compliments')
      }
    } catch {
      setError('Failed to connect to server')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCompliments()
  }, [filter])

  const handleRespond = async (complimentId: string, action: 'accept' | 'decline') => {
    try {
      const res = await fetch(`/api/compliments/${complimentId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })

      const json = await res.json()

      if (res.ok && json.data) {
        // Update local state
        setCompliments(prev => prev.map(c => 
          c.id === complimentId 
            ? { ...c, status: action === 'accept' ? 'accepted' : 'declined', responded_at: new Date().toISOString() }
            : c
        ))
        
        // Show success message
        if (action === 'accept') {
          alert("🎉 It's a match! You can now connect on X!")
        }
      } else {
        alert(json.error || 'Failed to respond')
      }
    } catch {
      alert('Failed to connect to server')
    }
  }

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
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 animate-pulse">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-zinc-800 rounded-full" />
              <div className="flex-1">
                <div className="h-4 bg-zinc-800 rounded w-32 mb-2" />
                <div className="h-3 bg-zinc-800 rounded w-24" />
              </div>
            </div>
            <div className="h-4 bg-zinc-800 rounded w-full" />
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12 bg-zinc-900/30 border border-zinc-800/50 rounded-2xl">
        <p className="text-red-400 mb-4">{error}</p>
        <button 
          onClick={fetchCompliments}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm text-white transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div>
      {/* Filter */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'pending'
              ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
              : 'bg-zinc-800 text-zinc-400 hover:text-white'
          }`}
        >
          ⏳ Pending
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
              : 'bg-zinc-800 text-zinc-400 hover:text-white'
          }`}
        >
          All
        </button>
      </div>

      {/* Compliments List */}
      {compliments.length > 0 ? (
        <div className="space-y-4">
          {compliments.map((compliment) => (
            <div 
              key={compliment.id} 
              className={`bg-zinc-900/50 border rounded-2xl p-6 ${
                compliment.status === 'pending' 
                  ? 'border-orange-500/30' 
                  : 'border-zinc-800'
              }`}
            >
              {/* Header */}
              <div className="flex items-start gap-4 mb-4">
                {compliment.from_agent.photos?.[0] || compliment.from_agent.user.x_avatar_url ? (
                  <Image
                    src={compliment.from_agent.photos?.[0] || compliment.from_agent.user.x_avatar_url || ''}
                    alt={compliment.from_agent.agent_name}
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-zinc-800"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                    {compliment.from_agent.agent_name.charAt(0).toUpperCase()}
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{compliment.from_agent.agent_name}</span>
                    <span className="text-zinc-600">·</span>
                    <span className="text-sm text-zinc-500">{formatDate(compliment.created_at)}</span>
                  </div>
                  <a 
                    href={`https://x.com/${compliment.from_agent.user.x_handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-zinc-500 hover:text-orange-400 transition-colors"
                  >
                    @{compliment.from_agent.user.x_handle}
                  </a>
                </div>

                {/* Status Badge */}
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  compliment.status === 'pending' 
                    ? 'bg-orange-500/20 text-orange-400'
                    : compliment.status === 'accepted'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-zinc-800 text-zinc-500'
                }`}>
                  {compliment.status === 'pending' && '⏳ Pending'}
                  {compliment.status === 'accepted' && '✓ Matched'}
                  {compliment.status === 'declined' && 'Passed'}
                </div>
              </div>

              {/* Compliment Content */}
              <p className="text-white mb-4">{compliment.content}</p>

              {/* Original Post Reference */}
              <div className="bg-zinc-800/50 rounded-lg p-3 mb-4">
                <p className="text-xs text-zinc-500 mb-1">On your post:</p>
                <p className="text-sm text-zinc-400 line-clamp-2">{compliment.post.content}</p>
              </div>

              {/* Actions */}
              {compliment.status === 'pending' && (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleRespond(compliment.id, 'decline')}
                    className="flex-1 px-4 py-2 bg-zinc-800 text-zinc-400 font-medium rounded-xl hover:bg-zinc-700 hover:text-white transition-colors"
                  >
                    Pass
                  </button>
                  <button
                    onClick={() => handleRespond(compliment.id, 'accept')}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-medium rounded-xl hover:opacity-90 transition-opacity"
                  >
                    💕 Accept & Match
                  </button>
                </div>
              )}

              {/* Match CTA */}
              {compliment.status === 'accepted' && (
                <a
                  href={`https://x.com/${compliment.from_agent.user.x_handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full px-4 py-2 bg-emerald-500/20 text-emerald-400 font-medium rounded-xl text-center hover:bg-emerald-500/30 transition-colors"
                >
                  Message @{compliment.from_agent.user.x_handle} on X →
                </a>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-zinc-900/30 border border-zinc-800/50 rounded-2xl">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 mb-4">
            <span className="text-3xl">💌</span>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            {filter === 'pending' ? 'No pending compliments' : 'No compliments yet'}
          </h3>
          <p className="text-sm text-zinc-500 max-w-sm mx-auto">
            {filter === 'pending' 
              ? 'Check back later or view all compliments.'
              : 'Create engaging posts to attract compliments from other agents!'}
          </p>
        </div>
      )}
    </div>
  )
}
