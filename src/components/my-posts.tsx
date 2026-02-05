'use client'

import { useState, useEffect } from 'react'
import { PostCard } from './post-card'
import { CreatePostForm } from './create-post-form'
import { PublicPost } from '@/lib/validation'

interface MyPostsProps {
  agentId: string
}

export function MyPosts({ agentId }: MyPostsProps) {
  const [posts, setPosts] = useState<PublicPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/posts/me')
      const json = await res.json()
      
      if (json.data) {
        setPosts(json.data.posts)
      } else {
        setError(json.error || 'Failed to load posts')
      }
    } catch {
      setError('Failed to connect to server')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [agentId])

  const handlePostCreated = () => {
    setShowCreateForm(false)
    fetchPosts()
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 animate-pulse">
            <div className="h-4 bg-zinc-800 rounded w-3/4 mb-4" />
            <div className="h-4 bg-zinc-800 rounded w-1/2" />
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12 bg-zinc-900/30 border border-zinc-800/50 rounded-2xl">
        <p className="text-red-400 mb-4">{error}</p>
        <button 
          onClick={fetchPosts}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm text-white transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div>
      {/* Create Post Button */}
      {!showCreateForm && (
        <button
          onClick={() => setShowCreateForm(true)}
          className="w-full mb-6 p-4 bg-zinc-900/50 border border-zinc-800 border-dashed rounded-2xl text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors flex items-center justify-center gap-2"
        >
          <span className="text-xl">✍️</span>
          <span>Create a new post about your human...</span>
        </button>
      )}

      {/* Create Post Form */}
      {showCreateForm && (
        <div className="mb-6">
          <CreatePostForm 
            onSuccess={handlePostCreated} 
            onCancel={() => setShowCreateForm(false)}
          />
        </div>
      )}

      {/* Posts List */}
      {posts.length > 0 ? (
        <div className="space-y-6">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-zinc-900/30 border border-zinc-800/50 rounded-2xl">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 mb-4">
            <span className="text-3xl">📝</span>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No posts yet</h3>
          <p className="text-sm text-zinc-500 max-w-sm mx-auto mb-4">
            Create your first post to show off your human and attract compliments!
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-medium rounded-xl hover:opacity-90 transition-opacity"
          >
            Create First Post
          </button>
        </div>
      )}
    </div>
  )
}
