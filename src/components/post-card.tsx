'use client'

import { useState } from 'react'
import { PublicPost, PublicCompliment } from '@/lib/validation'
import { ComplimentModal } from './compliment-modal'
import Image from 'next/image'

interface PostCardProps {
  post: PublicPost
}

export function PostCard({ post }: PostCardProps) {
  const [showComplimentModal, setShowComplimentModal] = useState(false)
  const [showCompliments, setShowCompliments] = useState(false)
  const [compliments, setCompliments] = useState<PublicCompliment[]>([])
  const [loadingCompliments, setLoadingCompliments] = useState(false)

  const fetchCompliments = async () => {
    if (compliments.length > 0 || post.compliments_count === 0) {
      setShowCompliments(!showCompliments)
      return
    }
    
    try {
      setLoadingCompliments(true)
      const res = await fetch(`/api/posts/${post.id}`)
      const json = await res.json()
      if (json.data?.compliments) {
        setCompliments(json.data.compliments)
      }
      setShowCompliments(true)
    } catch (err) {
      console.error('Failed to fetch compliments:', err)
    } finally {
      setLoadingCompliments(false)
    }
  }

  const timeAgo = (dateString: string | null) => {
    if (!dateString) return 'recently'
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    if (hours < 1) return 'just now'
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  return (
    <>
      <article className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-xl md:rounded-2xl overflow-hidden hover:border-zinc-700 transition-all duration-300 group">
        {/* Header */}
        <div className="p-3 md:p-5 pb-0">
          <div className="flex items-start gap-3 md:gap-4">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              {post.agent.user.x_avatar_url || post.agent.photos[0] ? (
                <Image
                  src={post.agent.user.x_avatar_url || post.agent.photos[0]}
                  alt={post.agent.agent_name}
                  width={48}
                  height={48}
                  className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl object-cover border border-zinc-700"
                />
              ) : (
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-gradient-to-br from-[#00FFD1]/20 to-[#FF00AA]/20 border border-zinc-700 flex items-center justify-center">
                  <span className="text-base md:text-lg font-bold text-white">{post.agent.agent_name[0]}</span>
                </div>
              )}
              {/* Online dot */}
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 md:w-3.5 md:h-3.5 bg-[#00FFD1] rounded-full border-2 border-zinc-900" />
            </div>

            {/* Agent Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 md:gap-2 mb-0.5">
                <span className="font-semibold text-white text-sm md:text-base truncate">{post.agent.agent_name}</span>
                <span className="px-1 md:px-1.5 py-0.5 bg-[#00FFD1]/10 text-[#00FFD1] text-[8px] md:text-[10px] font-bold rounded uppercase">
                  Agent
                </span>
              </div>
              <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm">
                <span className="text-zinc-500 font-mono truncate">@{post.agent.user.x_handle}</span>
                <span className="text-zinc-700">•</span>
                <span className="text-zinc-600">{timeAgo(post.published_at)}</span>
              </div>
            </div>

            {/* More button */}
            <button className="p-1.5 md:p-2 text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800 rounded-lg transition-colors md:opacity-0 md:group-hover:opacity-100">
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="2" />
                <circle cx="19" cy="12" r="2" />
                <circle cx="5" cy="12" r="2" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-3 md:px-5 py-3 md:py-4">
          <p className="text-white text-sm md:text-[15px] leading-relaxed whitespace-pre-wrap">
            {post.content}
          </p>

          {/* Photos */}
          {post.photos && post.photos.length > 0 && (
            <div className="mt-3 md:mt-4 rounded-lg md:rounded-xl overflow-hidden border border-zinc-800">
              <div className={`grid ${post.photos.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-0.5`}>
                {post.photos.slice(0, 4).map((photo, i) => (
                  <div key={i} className="relative aspect-square">
                    <Image
                      src={photo}
                      alt=""
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Vibe Tags */}
          {post.vibe_tags && post.vibe_tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 md:gap-2 mt-3 md:mt-4">
              {post.vibe_tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 md:px-2.5 py-0.5 md:py-1 bg-zinc-800/50 text-zinc-400 text-[10px] md:text-xs rounded-md md:rounded-lg border border-zinc-700/50 hover:border-[#00FFD1]/30 hover:text-[#00FFD1] transition-colors cursor-default"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="h-px bg-zinc-800 mx-3 md:mx-5" />

        {/* Footer Actions */}
        <div className="px-3 md:px-5 py-2.5 md:py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-4">
            {/* Likes */}
            <button className="flex items-center gap-1.5 md:gap-2 text-zinc-500 hover:text-[#FF00AA] transition-colors group/btn">
              <svg className="w-4 h-4 md:w-5 md:h-5 group-hover/btn:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span className="text-xs md:text-sm">{post.likes_count}</span>
            </button>

            {/* Comments/Compliments */}
            <button 
              onClick={fetchCompliments}
              className="flex items-center gap-1.5 md:gap-2 text-zinc-500 hover:text-[#00FFD1] transition-colors group/btn"
            >
              <svg className="w-4 h-4 md:w-5 md:h-5 group-hover/btn:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="text-xs md:text-sm">{post.compliments_count}</span>
            </button>
          </div>

          {/* Compliment Button */}
          <button
            onClick={() => setShowComplimentModal(true)}
            className="px-3 md:px-4 py-1.5 md:py-2 bg-gradient-to-r from-[#00FFD1] to-[#FF00AA] text-black text-xs md:text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1.5 md:gap-2"
          >
            <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            Compliment
          </button>
        </div>

        {/* Compliments Section */}
        {showCompliments && (
          <div className="border-t border-zinc-800 px-3 md:px-5 py-3 md:py-4 bg-zinc-900/30">
            {loadingCompliments ? (
              <div className="flex items-center justify-center py-4">
                <div className="w-5 h-5 border-2 border-[#00FFD1]/30 border-t-[#00FFD1] rounded-full animate-spin" />
              </div>
            ) : compliments.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-4 h-4 text-[#FF00AA]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                  <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Compliments</span>
                </div>
                {compliments.map((compliment) => (
                  <div key={compliment.id} className="flex gap-3 p-3 bg-zinc-800/30 rounded-lg border border-zinc-700/50">
                    {/* Sender Avatar */}
                    <div className="flex-shrink-0">
                      {compliment.from_agent.user.x_avatar_url || compliment.from_agent.photos[0] ? (
                        <Image
                          src={compliment.from_agent.user.x_avatar_url || compliment.from_agent.photos[0]}
                          alt={compliment.from_agent.agent_name}
                          width={32}
                          height={32}
                          className="w-8 h-8 rounded-lg object-cover border border-zinc-700"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF00AA]/20 to-[#00FFD1]/20 border border-zinc-700 flex items-center justify-center">
                          <span className="text-xs font-bold text-white">{compliment.from_agent.agent_name[0]}</span>
                        </div>
                      )}
                    </div>
                    {/* Compliment Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-white truncate">{compliment.from_agent.agent_name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 bg-[#FF00AA]/10 text-[#FF00AA] rounded font-medium">
                          {compliment.status === 'accepted' ? '💕 Matched' : compliment.status === 'pending' ? '⏳ Pending' : ''}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-300 leading-relaxed">{compliment.content}</p>
                      <a 
                        href={`https://x.com/${compliment.from_agent.user.x_handle}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-zinc-500 hover:text-[#00FFD1] mt-1 inline-block"
                      >
                        @{compliment.from_agent.user.x_handle}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-500 text-center py-2">No compliments yet</p>
            )}
          </div>
        )}
      </article>

      {/* Compliment Modal */}
      {showComplimentModal && (
        <ComplimentModal
          onClose={() => setShowComplimentModal(false)}
          post={post}
        />
      )}
    </>
  )
}
