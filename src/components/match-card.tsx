import Image from 'next/image'
import { PublicMatch } from '@/lib/validation'

interface MatchCardProps {
  match: PublicMatch
}

export function MatchCard({ match }: MatchCardProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'from-emerald-500 to-green-400'
    if (score >= 60) return 'from-amber-500 to-yellow-400'
    return 'from-orange-500 to-red-400'
  }

  return (
    <div className="card-hover bg-zinc-900/50 backdrop-blur border border-zinc-800 rounded-2xl p-6 relative overflow-hidden">
      {/* Glow effect */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-pink-500/10 to-purple-500/10 rounded-full blur-3xl" />
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="relative w-2 h-2">
            <div className="absolute inset-0 bg-emerald-500 rounded-full" />
            <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-75" />
          </div>
          <span className="text-xs text-zinc-500 uppercase tracking-wider">New Match</span>
        </div>
        <span className="text-xs text-zinc-500">{formatDate(match.created_at)}</span>
      </div>

      {/* Agents */}
      <div className="flex items-center justify-between gap-4">
        {/* Agent A */}
        <div className="flex-1 text-center">
          <div className="relative inline-block mb-3">
            {match.agent_a.user.x_avatar_url ? (
              <Image
                src={match.agent_a.user.x_avatar_url}
                alt={match.agent_a.agent_name}
                width={64}
                height={64}
                className="rounded-full border-2 border-zinc-700"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-2xl font-bold">
                {match.agent_a.agent_name[0]}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 px-2 py-0.5 bg-zinc-800 rounded-full text-[10px] text-zinc-400 border border-zinc-700">
              {match.agent_a.gender}
            </div>
          </div>
          <h3 className="font-semibold text-white truncate">{match.agent_a.agent_name}</h3>
          <a
            href={`https://x.com/${match.agent_a.user.x_handle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-zinc-500 hover:text-white transition-colors"
          >
            @{match.agent_a.user.x_handle}
          </a>
        </div>

        {/* Score */}
        <div className="flex flex-col items-center gap-2">
          <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${getScoreColor(match.compatibility_score)} flex items-center justify-center shadow-lg`}>
            <span className="text-xl font-bold text-white">{match.compatibility_score}</span>
          </div>
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Score</span>
        </div>

        {/* Agent B */}
        <div className="flex-1 text-center">
          <div className="relative inline-block mb-3">
            {match.agent_b.user.x_avatar_url ? (
              <Image
                src={match.agent_b.user.x_avatar_url}
                alt={match.agent_b.agent_name}
                width={64}
                height={64}
                className="rounded-full border-2 border-zinc-700"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-2xl font-bold">
                {match.agent_b.agent_name[0]}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 px-2 py-0.5 bg-zinc-800 rounded-full text-[10px] text-zinc-400 border border-zinc-700">
              {match.agent_b.gender}
            </div>
          </div>
          <h3 className="font-semibold text-white truncate">{match.agent_b.agent_name}</h3>
          <a
            href={`https://x.com/${match.agent_b.user.x_handle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-zinc-500 hover:text-white transition-colors"
          >
            @{match.agent_b.user.x_handle}
          </a>
        </div>
      </div>

      {/* Tags */}
      {(match.agent_a.preferences.vibe_tags.length > 0 || match.agent_b.preferences.vibe_tags.length > 0) && (
        <div className="mt-4 pt-4 border-t border-zinc-800">
          <div className="flex flex-wrap gap-2 justify-center">
            {[...new Set([...match.agent_a.preferences.vibe_tags, ...match.agent_b.preferences.vibe_tags])].slice(0, 5).map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 text-xs bg-zinc-800/50 text-zinc-400 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
