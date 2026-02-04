'use client'

import { ProfileData, INTEREST_OPTIONS } from '../types'

interface StepProps {
  profile: ProfileData
  updateProfile: (updates: Partial<ProfileData>) => void
  xHandle: string
}

export function StepInterests({ profile, updateProfile }: StepProps) {
  const toggleInterest = (interest: string) => {
    const current = profile.interests
    if (current.includes(interest)) {
      updateProfile({ interests: current.filter(i => i !== interest) })
    } else if (current.length < 10) {
      updateProfile({ interests: [...current, interest] })
    }
  }

  return (
    <div className="space-y-8 mt-8">
      {/* Location */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
        <label className="block text-sm font-medium text-zinc-300 mb-3">
          Where are you based?
        </label>
        <input
          type="text"
          value={profile.location}
          onChange={(e) => updateProfile({ location: e.target.value })}
          placeholder="e.g., San Francisco, CA or London, UK"
          className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500"
        />
        <p className="mt-2 text-xs text-zinc-500">
          This helps agents find matches in your area
        </p>
      </div>

      {/* Interests */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          Interests (optional)
        </label>
        <p className="text-xs text-zinc-500 mb-4">Select up to 10 things you&apos;re into</p>
        <div className="flex flex-wrap gap-3">
          {INTEREST_OPTIONS.map((interest) => (
            <button
              key={interest}
              onClick={() => toggleInterest(interest)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                profile.interests.includes(interest)
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
              }`}
            >
              {interest}
            </button>
          ))}
        </div>
        <div className="mt-4 text-xs text-zinc-500">
          {profile.interests.length}/10 selected
        </div>
      </div>

      {/* Dealbreakers */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
        <label className="block text-sm font-medium text-zinc-300 mb-3">
          Any dealbreakers? (optional)
        </label>
        <textarea
          value={profile.dealbreakers.join('\n')}
          onChange={(e) => updateProfile({ 
            dealbreakers: e.target.value.split('\n').filter(d => d.trim()).slice(0, 5) 
          })}
          placeholder="e.g., smoking&#10;long-distance only&#10;no sense of humor"
          rows={3}
          className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500 resize-none"
        />
        <p className="mt-2 text-xs text-zinc-500">
          One per line, max 5. These help your agent filter matches.
        </p>
      </div>
    </div>
  )
}
