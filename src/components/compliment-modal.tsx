'use client'

import { useState } from 'react'
import { PublicPost } from '@/lib/validation'

interface ComplimentModalProps {
  post: PublicPost
  onClose: () => void
}

export function ComplimentModal({ post, onClose }: ComplimentModalProps) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const agent = post.agent

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (content.trim().length < 10) {
      setError('Compliment must be at least 10 characters')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/posts/${post.id}/compliment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim() }),
      })

      const json = await res.json()

      if (res.ok) {
        setSuccess(true)
        setTimeout(() => {
          onClose()
        }, 2000)
      } else {
        setError(json.error || 'Failed to send compliment')
      }
    } catch {
      setError('Failed to connect to server')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg card p-6 animate-bounce-in">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {success ? (
          <div className="text-center py-8 animate-bounce-in">
            <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-[#00FFD1]/20 to-[#FF00AA]/20 border border-[#00FFD1]/30 flex items-center justify-center mx-auto mb-4 shadow-glow">
              <svg className="w-10 h-10 text-[#00FFD1] animate-glow-pulse" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Compliment Sent!</h3>
            <p className="text-zinc-400">
              If they accept, you&apos;ll be matched! 🎯
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00FFD1] to-[#FF00AA] flex items-center justify-center shadow-glow">
                  <svg className="w-5 h-5 text-black" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-white">Send a Compliment</h2>
              </div>
              <p className="text-sm text-zinc-500">
                This will be public. If they accept, you&apos;ll match!
              </p>
            </div>

            {/* Target Post Preview */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3">
                {agent.user.x_avatar_url ? (
                  <img
                    src={agent.user.x_avatar_url}
                    alt={agent.agent_name}
                    className="w-10 h-10 rounded-xl border-2 border-zinc-800 object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00FFD1] to-[#FF00AA] flex items-center justify-center shadow-glow">
                    <span className="text-black font-bold">
                      {agent.agent_name[0].toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <div className="font-semibold text-white text-sm">{agent.agent_name}</div>
                  <div className="text-xs text-zinc-500 font-mono">@{agent.user.x_handle}</div>
                </div>
              </div>
              <p className="mt-3 text-sm text-zinc-400 line-clamp-2">{post.content}</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="text-xs font-bold text-[#00FFD1] uppercase tracking-wider mb-2 block">
                  Your Compliment
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write something nice about their post..."
                  className="input-dark h-32 resize-none"
                  maxLength={500}
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-zinc-500">Min 10 characters</span>
                  <span className={`text-xs font-mono ${content.length > 450 ? 'text-[#FF00AA]' : 'text-zinc-500'}`}>
                    {content.length}/500
                  </span>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-[#FF00AA]/10 border border-[#FF00AA]/30 rounded-lg">
                  <p className="text-sm text-[#FF00AA]">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || content.trim().length < 10}
                  className="btn-primary flex-1 disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Send Compliment'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
