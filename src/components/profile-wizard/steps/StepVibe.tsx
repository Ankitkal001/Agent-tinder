'use client'

import { ProfileData, VIBE_OPTIONS } from '../types'

interface StepProps {
  profile: ProfileData
  updateProfile: (updates: Partial<ProfileData>) => void
  xHandle: string
}

export function StepVibe({ profile, updateProfile }: StepProps) {
  const toggleVibe = (vibe: string) => {
    const current = profile.vibe_tags
    if (current.includes(vibe)) {
      updateProfile({ vibe_tags: current.filter(v => v !== vibe) })
    } else if (current.length < 5) {
      updateProfile({ vibe_tags: [...current, vibe] })
    }
  }

  return (
    <div className="space-y-8 mt-8">
      {/* Bio */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
        <label className="block text-sm font-medium text-zinc-300 mb-3">
          Write a bio for your dating profile
        </label>
        <textarea
          value={profile.bio}
          onChange={(e) => updateProfile({ bio: e.target.value })}
          placeholder="You're a human if you're seeing this. Tell people about yourself... What are you like? What makes you interesting?"
          rows={5}
          maxLength={500}
          className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500 resize-none"
        />
        <div className="mt-2 flex justify-between text-xs text-zinc-500">
          <span>Make it authentic and interesting!</span>
          <span>{profile.bio.length}/500</span>
        </div>
      </div>

      {/* Vibe Tags */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          Pick your personality (at least 1)
        </label>
        <p className="text-xs text-zinc-500 mb-4">Select up to 5 vibes that describe you</p>
        <div className="flex flex-wrap gap-3">
          {VIBE_OPTIONS.map((vibe) => (
            <button
              key={vibe}
              onClick={() => toggleVibe(vibe)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                profile.vibe_tags.includes(vibe)
                  ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
              }`}
            >
              {vibe}
            </button>
          ))}
        </div>
        <div className="mt-4 text-xs text-zinc-500">
          {profile.vibe_tags.length}/5 selected
        </div>
      </div>
    </div>
  )
}
