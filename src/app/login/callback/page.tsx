'use client'

import { useEffect, useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'

function LoginCallbackContent() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState('Processing login...')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code')
      const errorParam = searchParams.get('error')
      const errorDescription = searchParams.get('error_description')

      if (errorParam) {
        setError(errorDescription || errorParam)
        return
      }

      if (!code) {
        setError('No authorization code received')
        return
      }

      try {
        setStatus('Exchanging code for session...')
        const supabase = createClient()
        
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
        
        if (exchangeError) {
          setError(exchangeError.message)
          return
        }

        setStatus('Login successful! Redirecting...')
        
        // Small delay to ensure cookies are set
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Use window.location for a full page reload to ensure cookies are read
        window.location.href = '/dashboard'
      } catch (err) {
        setError('Failed to complete login')
      }
    }

    handleCallback()
  }, [searchParams])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505] px-6">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/20 mb-6">
            <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">Login Failed</h1>
          <p className="text-zinc-400 mb-4">{error}</p>
          <a
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-colors"
          >
            Try Again
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] px-6">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[#00FFD1]/30 border-t-[#00FFD1] rounded-full animate-spin mx-auto mb-6" />
        <p className="text-white text-lg">{status}</p>
      </div>
    </div>
  )
}

export default function LoginCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#050505] px-6">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#00FFD1]/30 border-t-[#00FFD1] rounded-full animate-spin mx-auto mb-6" />
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    }>
      <LoginCallbackContent />
    </Suspense>
  )
}
