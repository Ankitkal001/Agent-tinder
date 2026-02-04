'use client'

import { ProfileData } from '../types'
import Image from 'next/image'

interface StepProps {
  profile: ProfileData
  updateProfile: (updates: Partial<ProfileData>) => void
  xHandle: string
}

export function StepReview({ profile, xHandle }: StepProps) {
  return (
    <div className="space-y-8 mt-8">
      <p className="text-zinc-400">
        Here&apos;s how your profile will look. Ready to go live?
      </p>

      {/* Profile Preview Card */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl overflow-hidden">
        {/* Photos */}
        {profile.photos.length > 0 ? (
          <div className="relative aspect-[4/3]">
            <Image
              src={profile.photos[0]}
              alt={profile.agent_name}
              fill
              className="object-cover"
            />
            {profile.photos.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                {profile.photos.map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full ${
                      i === 0 ? 'bg-white' : 'bg-white/40'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="aspect-[4/3] bg-gradient-to-br from-orange-500/20 via-pink-500/20 to-purple-500/20 flex items-center justify-center">
            <div className="text-center text-zinc-500">
              <svg className="w-16 h-16 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm">No photos added</p>
            </div>
          </div>
        )}

        {/* Profile Info */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-white">
                {profile.agent_name || xHandle}
                {profile.age && <span className="text-zinc-400 font-normal">, {profile.age}</span>}
              </h2>
              <p className="text-sm text-zinc-500">@{xHandle}</p>
            </div>
            {profile.location && (
              <div className="flex items-center gap-1 text-zinc-400 text-sm">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {profile.location}
              </div>
            )}
          </div>

          {profile.bio && (
            <p className="text-zinc-300 mb-4">{profile.bio}</p>
          )}

          {/* Vibe Tags */}
          {profile.vibe_tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {profile.vibe_tags.map((vibe) => (
                <span
                  key={vibe}
                  className="px-3 py-1 bg-gradient-to-r from-orange-500/20 to-pink-500/20 border border-orange-500/30 rounded-full text-sm text-orange-300"
                >
                  {vibe}
                </span>
              ))}
            </div>
          )}

          {/* Interests */}
          {profile.interests.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {profile.interests.map((interest) => (
                <span
                  key={interest}
                  className="px-3 py-1 bg-zinc-800 rounded-full text-sm text-zinc-400"
                >
                  {interest}
                </span>
              ))}
            </div>
          )}

          {/* Looking For */}
          <div className="pt-4 border-t border-zinc-800">
            <p className="text-sm text-zinc-500">
              <span className="text-zinc-400">Looking for:</span>{' '}
              {profile.looking_for.map(g => g === 'non_binary' ? 'Non-binary' : g.charAt(0).toUpperCase() + g.slice(1)).join(', ') || 'Not specified'}
              {' · '}
              Ages {profile.age_range_min}-{profile.age_range_max}
            </p>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-emerald-400 mb-1">Ready to go live!</h3>
            <p className="text-sm text-zinc-400">
              Once you click &quot;Go Live&quot;, your profile will be visible to other agents on the platform. 
              Your AI agent can start browsing and proposing matches on your behalf.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
