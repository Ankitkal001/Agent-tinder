'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Gender } from '@/lib/validation'

interface AgentFormProps {
  existingAgent?: {
    id: string
    agent_name: string
    gender: Gender
    looking_for: Gender[]
    preferences?: {
      min_score: number
      vibe_tags: string[]
    }
  }
  onSuccess?: () => void
}

export function AgentForm({ existingAgent, onSuccess }: AgentFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [agentName, setAgentName] = useState(existingAgent?.agent_name || '')
  const [gender, setGender] = useState<Gender>(existingAgent?.gender || 'other')
  const [lookingFor, setLookingFor] = useState<Gender[]>(existingAgent?.looking_for || [])
  const [minScore, setMinScore] = useState(existingAgent?.preferences?.min_score || 0)
  const [vibeTags, setVibeTags] = useState(existingAgent?.preferences?.vibe_tags?.join(', ') || '')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      // Ensure we have a valid session
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        setError('Please sign in to register an agent')
        return
      }

      const res = await fetch('/api/agents/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agent_name: agentName,
          gender,
          looking_for: lookingFor,
          preferences: {
            min_score: minScore,
            vibe_tags: vibeTags.split(',').map(t => t.trim()).filter(Boolean),
            dealbreakers: [],
          },
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        setError(json.error || 'Failed to register agent')
        return
      }

      setSuccess(true)
      onSuccess?.()
    } catch {
      setError('Failed to connect to server')
    } finally {
      setLoading(false)
    }
  }

  const toggleLookingFor = (g: Gender) => {
    setLookingFor(prev => 
      prev.includes(g) 
        ? prev.filter(x => x !== g)
        : [...prev, g]
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}
      
      {success && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-sm">
          Agent {existingAgent ? 'updated' : 'registered'} successfully!
        </div>
      )}

      {/* Agent Name */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          Agent Name
        </label>
        <input
          type="text"
          value={agentName}
          onChange={(e) => setAgentName(e.target.value)}
          placeholder="Enter your agent's name"
          required
          minLength={2}
          maxLength={50}
          className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500 transition-all"
        />
      </div>

      {/* Gender */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          Gender
        </label>
        <div className="flex gap-3">
          {(['male', 'female', 'other'] as Gender[]).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGender(g)}
              className={`flex-1 px-4 py-3 rounded-lg border transition-all ${
                gender === g
                  ? 'bg-pink-500/20 border-pink-500 text-pink-400'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              {g.charAt(0).toUpperCase() + g.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Looking For */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          Looking For <span className="text-zinc-500">(select all that apply)</span>
        </label>
        <div className="flex gap-3">
          {(['male', 'female', 'other'] as Gender[]).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => toggleLookingFor(g)}
              className={`flex-1 px-4 py-3 rounded-lg border transition-all ${
                lookingFor.includes(g)
                  ? 'bg-purple-500/20 border-purple-500 text-purple-400'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              {g.charAt(0).toUpperCase() + g.slice(1)}
            </button>
          ))}
        </div>
        {lookingFor.length === 0 && (
          <p className="mt-2 text-sm text-red-400">Select at least one preference</p>
        )}
      </div>

      {/* Min Score */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          Minimum Compatibility Score <span className="text-zinc-500">({minScore})</span>
        </label>
        <input
          type="range"
          min={0}
          max={100}
          value={minScore}
          onChange={(e) => setMinScore(parseInt(e.target.value))}
          className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-pink-500"
        />
        <div className="flex justify-between text-xs text-zinc-500 mt-1">
          <span>0 (Accept all)</span>
          <span>100 (Very selective)</span>
        </div>
      </div>

      {/* Vibe Tags */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          Vibe Tags <span className="text-zinc-500">(comma separated)</span>
        </label>
        <input
          type="text"
          value={vibeTags}
          onChange={(e) => setVibeTags(e.target.value)}
          placeholder="tech, music, travel, crypto"
          className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500 transition-all"
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading || lookingFor.length === 0}
        className="w-full px-6 py-4 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Saving...' : existingAgent ? 'Update Agent' : 'Register Agent'}
      </button>
    </form>
  )
}
