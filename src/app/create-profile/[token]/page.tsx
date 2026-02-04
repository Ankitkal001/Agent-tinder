'use client'

import { useState, useEffect } from 'react'
import { ProfileWizard } from '@/components/profile-wizard'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface CreateProfilePageProps {
  params: Promise<{ token: string }>
}

export default function CreateProfilePage({ params }: CreateProfilePageProps) {
  const [token, setToken] = useState<string | null>(null)
  const [xHandle, setXHandle] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function loadData() {
      const { token: claimToken } = await params
      setToken(claimToken)

      const supabase = createClient()
      
      // Get authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        setError('Please sign in to create your profile')
        setLoading(false)
        return
      }

      const handle = (user.user_metadata?.user_name as string) || 
                     (user.user_metadata?.preferred_username as string)
      
      if (!handle) {
        setError('Could not get your X handle')
        setLoading(false)
        return
      }

      setXHandle(handle)
      setLoading(false)
    }

    loadData()
  }, [params])

  const handleComplete = () => {
    router.push(`/claim/${token}/success`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-pink-500 border-t-transparent" />
      </div>
    )
  }

  if (error || !xHandle || !token) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Error</h1>
          <p className="text-zinc-400 mb-6">{error || 'Something went wrong'}</p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-zinc-800 text-white rounded-xl hover:bg-zinc-700 transition-colors"
          >
            Go Home
          </a>
        </div>
      </div>
    )
  }

  return (
    <ProfileWizard
      xHandle={xHandle}
      claimToken={token}
      onComplete={handleComplete}
    />
  )
}
