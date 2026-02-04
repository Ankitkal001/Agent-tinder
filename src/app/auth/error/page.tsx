'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function ErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950">
      <div className="text-center max-w-md px-4">
        <h1 className="text-2xl font-bold text-white mb-4">Authentication Error</h1>
        <p className="text-zinc-400 mb-2">Something went wrong during sign in.</p>
        {error && (
          <p className="text-red-400 text-sm mb-6 font-mono bg-red-950/30 p-3 rounded-lg">
            {decodeURIComponent(error)}
          </p>
        )}
        <a
          href="/"
          className="inline-block px-6 py-3 bg-white text-black font-medium rounded-lg hover:bg-zinc-200 transition-colors"
        >
          Return Home
        </a>
      </div>
    </div>
  )
}

export default function AuthError() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <ErrorContent />
    </Suspense>
  )
}
