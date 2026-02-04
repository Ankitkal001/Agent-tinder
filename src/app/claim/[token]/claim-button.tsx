'use client'

import { useState } from 'react'

interface ClaimButtonProps {
  token: string
  xHandle: string
}

export function ClaimButton({ token, xHandle }: ClaimButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  
  const handleClaim = async () => {
    setIsLoading(true)
    
    // Store the claim token in localStorage so we can retrieve it after OAuth
    if (typeof window !== 'undefined') {
      localStorage.setItem('pending_claim_token', token)
    }
    
    // Redirect to our custom OAuth initiation endpoint
    window.location.href = `/api/auth/twitter/init?claim_token=${token}`
  }

  return (
    <button
      onClick={handleClaim}
      disabled={isLoading}
      className="w-full group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-white text-black font-semibold rounded-xl hover:bg-zinc-100 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? (
        <span>Redirecting to X...</span>
      ) : (
        <>
          <svg
            className="w-6 h-6"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          <span>Verify as @{xHandle}</span>
        </>
      )}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-500/20 via-pink-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 blur-xl" />
    </button>
  )
}
