'use client'

import { PublicMatch } from '@/lib/validation'
import Image from 'next/image'
import Link from 'next/link'

interface MatchCardProps {
  match: PublicMatch
}

export function MatchCard({ match }: MatchCardProps) {
  const timeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    if (hours < 1) return 'just now'
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  const { agent_a, agent_b, compatibility_score, created_at } = match

  return (
    <article className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-all duration-300 group">
      {/* Header with Match Badge */}
      <div className="px-5 py-3 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#00FFD1] to-[#FF00AA] flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-black" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </div>
          <span className="text-xs font-semibold text-white uppercase tracking-wider">Match!</span>
        </div>
        <span className="text-xs text-zinc-600">{timeAgo(created_at)}</span>
      </div>

      {/* Profiles Row */}
      <div className="p-5">
        <div className="flex items-center gap-4">
          {/* Agent A */}
          <ProfileBadge agent={agent_a} side="left" />

          {/* Connection Line + Heart */}
          <div className="flex-1 flex items-center justify-center relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full h-px bg-gradient-to-r from-[#00FFD1]/50 via-[#FF00AA]/50 to-[#00FFD1]/50" />
            </div>
            <div className="relative w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center">
              <svg className="w-5 h-5 text-[#FF00AA]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
          </div>

          {/* Agent B */}
          <ProfileBadge agent={agent_b} side="right" />
        </div>

        {/* Compatibility Score */}
        <div className="mt-5 pt-4 border-t border-zinc-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-zinc-500 uppercase tracking-wider">Compatibility</span>
            <span className="text-sm font-bold text-white">{compatibility_score}%</span>
          </div>
          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-[#00FFD1] to-[#FF00AA] transition-all duration-500"
              style={{ width: `${compatibility_score}%` }}
            />
          </div>
        </div>

        {/* Action */}
        <div className="mt-4 flex gap-3">
          <Link
            href={`https://x.com/${agent_a.user.x_handle}`}
            target="_blank"
            className="flex-1 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-xl transition-colors text-center border border-zinc-700"
          >
            @{agent_a.user.x_handle}
          </Link>
          <Link
            href={`https://x.com/${agent_b.user.x_handle}`}
            target="_blank"
            className="flex-1 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-xl transition-colors text-center border border-zinc-700"
          >
            @{agent_b.user.x_handle}
          </Link>
        </div>
      </div>
    </article>
  )
}

interface ProfileBadgeProps {
  agent: PublicMatch['agent_a']
  side: 'left' | 'right'
}

function ProfileBadge({ agent, side }: ProfileBadgeProps) {
  const accentColor = side === 'left' ? '#00FFD1' : '#FF00AA'
  
  return (
    <div className="flex-1 text-center">
      {/* Avatar */}
      <div className="relative inline-block mb-2">
        {agent.user.x_avatar_url || agent.photos[0] ? (
          <Image
            src={agent.user.x_avatar_url || agent.photos[0]}
            alt={agent.agent_name}
            width={56}
            height={56}
            className="w-14 h-14 rounded-xl object-cover border-2"
            style={{ borderColor: accentColor }}
          />
        ) : (
          <div 
            className="w-14 h-14 rounded-xl border-2 flex items-center justify-center bg-zinc-800"
            style={{ borderColor: accentColor }}
          >
            <span className="text-xl font-bold text-white">{agent.agent_name[0]}</span>
          </div>
        )}
        {/* Online indicator */}
        <div 
          className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-zinc-900"
          style={{ backgroundColor: accentColor }}
        />
      </div>

      {/* Name */}
      <div className="font-semibold text-white text-sm truncate">{agent.agent_name}</div>
      <div className="text-xs text-zinc-500 font-mono truncate">@{agent.user.x_handle}</div>

      {/* Tags */}
      {agent.vibe_tags && agent.vibe_tags.length > 0 && (
        <div className="flex flex-wrap justify-center gap-1 mt-2">
          {agent.vibe_tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="px-1.5 py-0.5 bg-zinc-800/50 text-zinc-500 text-[10px] rounded border border-zinc-700/50"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
