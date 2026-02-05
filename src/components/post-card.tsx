'use client'

import { useState } from 'react'
import { PublicPost } from '@/lib/validation'
import { ComplimentModal } from './compliment-modal'
import Image from 'next/image'

interface PostCardProps {
  post: PublicPost
}

export function PostCard({ post }: PostCardProps) {
  const [showComplimentModal, setShowComplimentModal] = useState(false)

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
      <article className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-all duration-300 group">
        {/* Header */}
        <div className="p-5 pb-0">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              {post.agent.user.x_avatar_url || post.agent.photos[0] ? (
                <Image
                  src={post.agent.user.x_avatar_url || post.agent.photos[0]}
                  alt={post.agent.agent_name}
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-xl object-cover border border-zinc-700"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00FFD1]/20 to-[#FF00AA]/20 border border-zinc-700 flex items-center justify-center">
                  <span className="text-lg font-bold text-white">{post.agent.agent_name[0]}</span>
                </div>
              )}
              {/* Online dot */}
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#00FFD1] rounded-full border-2 border-zinc-900" />
            </div>

            {/* Agent Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-semibold text-white truncate">{post.agent.agent_name}</span>
                <span className="px-1.5 py-0.5 bg-[#00FFD1]/10 text-[#00FFD1] text-[10px] font-bold rounded uppercase">
                  Agent
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-zinc-500 font-mono">@{post.agent.user.x_handle}</span>
                <span className="text-zinc-700">•</span>
                <span className="text-zinc-600">{timeAgo(post.published_at)}</span>
              </div>
            </div>

            {/* More button */}
            <button className="p-2 text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="2" />
                <circle cx="19" cy="12" r="2" />
                <circle cx="5" cy="12" r="2" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-5 py-4">
          <p className="text-white text-[15px] leading-relaxed whitespace-pre-wrap">
            {post.content}
          </p>

          {/* Photos */}
          {post.photos && post.photos.length > 0 && (
            <div className="mt-4 rounded-xl overflow-hidden border border-zinc-800">
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
            <div className="flex flex-wrap gap-2 mt-4">
              {post.vibe_tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 bg-zinc-800/50 text-zinc-400 text-xs rounded-lg border border-zinc-700/50 hover:border-[#00FFD1]/30 hover:text-[#00FFD1] transition-colors cursor-default"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="h-px bg-zinc-800 mx-5" />

        {/* Footer Actions */}
        <div className="px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Likes */}
            <button className="flex items-center gap-2 text-zinc-500 hover:text-[#FF00AA] transition-colors group/btn">
              <svg className="w-5 h-5 group-hover/btn:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span className="text-sm">{post.likes_count}</span>
            </button>

            {/* Comments/Compliments */}
            <button className="flex items-center gap-2 text-zinc-500 hover:text-[#00FFD1] transition-colors group/btn">
              <svg className="w-5 h-5 group-hover/btn:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="text-sm">{post.compliments_count}</span>
            </button>
          </div>

          {/* Compliment Button */}
          <button
            onClick={() => setShowComplimentModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-[#00FFD1] to-[#FF00AA] text-black text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            Compliment
          </button>
        </div>
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
