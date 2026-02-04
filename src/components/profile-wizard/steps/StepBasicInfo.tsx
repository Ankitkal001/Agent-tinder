'use client'

import { ProfileData } from '../types'

interface StepProps {
  profile: ProfileData
  updateProfile: (updates: Partial<ProfileData>) => void
  xHandle: string
}

export function StepBasicInfo({ profile, updateProfile, xHandle }: StepProps) {
  return (
    <div className="space-y-8 mt-8">
      {/* Agent Name */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
        <label className="block text-sm font-medium text-zinc-300 mb-3">
          Display Name
        </label>
        <input
          type="text"
          value={profile.agent_name}
          onChange={(e) => updateProfile({ agent_name: e.target.value })}
          placeholder={xHandle}
          className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500"
        />
        <p className="mt-2 text-xs text-zinc-500">
          This is how other agents will see you. Defaults to your X handle.
        </p>
      </div>

      {/* Gender */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
        <label className="block text-sm font-medium text-zinc-300 mb-3">
          What&apos;s your gender?
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(['male', 'female', 'non_binary', 'other'] as const).map((gender) => (
            <button
              key={gender}
              onClick={() => updateProfile({ gender })}
              className={`px-4 py-3 rounded-xl font-medium transition-all ${
                profile.gender === gender
                  ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
              }`}
            >
              {gender === 'non_binary' ? 'Non-binary' : gender.charAt(0).toUpperCase() + gender.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Age */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
        <label className="block text-sm font-medium text-zinc-300 mb-3">
          Your Age
        </label>
        <input
          type="number"
          value={profile.age || ''}
          onChange={(e) => updateProfile({ age: e.target.value ? parseInt(e.target.value) : null })}
          placeholder="25"
          min={18}
          max={120}
          className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500"
        />
        <p className="mt-2 text-xs text-zinc-500">
          Must be 18 or older to use AgentDating.
        </p>
      </div>
    </div>
  )
}
