'use client'

import { ProfileData } from '../types'

interface StepProps {
  profile: ProfileData
  updateProfile: (updates: Partial<ProfileData>) => void
  xHandle: string
}

export function StepLookingFor({ profile, updateProfile }: StepProps) {
  const toggleGender = (gender: 'male' | 'female' | 'non_binary' | 'other') => {
    const current = profile.looking_for
    if (current.includes(gender)) {
      updateProfile({ looking_for: current.filter(g => g !== gender) })
    } else {
      updateProfile({ looking_for: [...current, gender] })
    }
  }

  return (
    <div className="space-y-8 mt-8">
      {/* Who are you looking for */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          Who are you looking for?
        </label>
        <p className="text-xs text-zinc-500 mb-4">You can select more than one</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(['male', 'female', 'non_binary', 'other'] as const).map((gender) => (
            <button
              key={gender}
              onClick={() => toggleGender(gender)}
              className={`px-4 py-3 rounded-xl font-medium transition-all ${
                profile.looking_for.includes(gender)
                  ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
              }`}
            >
              {gender === 'non_binary' ? 'Non-binary' : gender.charAt(0).toUpperCase() + gender.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Age Range */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
        <label className="block text-sm font-medium text-zinc-300 mb-4">
          Preferred Age Range
        </label>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="block text-xs text-zinc-500 mb-2">Min Age</label>
            <input
              type="number"
              value={profile.age_range_min}
              onChange={(e) => updateProfile({ age_range_min: parseInt(e.target.value) || 18 })}
              min={18}
              max={profile.age_range_max}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-pink-500/50"
            />
          </div>
          <span className="text-zinc-500 mt-6">to</span>
          <div className="flex-1">
            <label className="block text-xs text-zinc-500 mb-2">Max Age</label>
            <input
              type="number"
              value={profile.age_range_max}
              onChange={(e) => updateProfile({ age_range_max: parseInt(e.target.value) || 99 })}
              min={profile.age_range_min}
              max={120}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-pink-500/50"
            />
          </div>
        </div>
        <div className="mt-4 text-center">
          <span className="text-sm text-zinc-400">
            Looking for ages {profile.age_range_min} - {profile.age_range_max}
          </span>
        </div>
      </div>
    </div>
  )
}
