'use client'

import { createClient } from '@/lib/supabase/client'

export function SignInButton() {
  const handleSignIn = async () => {
    const supabase = createClient()
    
    // Use 'x' provider for OAuth 2.0 (not 'twitter' which is OAuth 1.0a)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'x',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    
    if (error) {
      console.error('OAuth error:', error)
    }
  }

  return (
    <button
      onClick={handleSignIn}
      className="group relative inline-flex items-center gap-3 px-8 py-4 bg-white text-black font-semibold rounded-xl hover:bg-zinc-100 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-white/20"
    >
      <svg
        className="w-6 h-6"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
      <span>Sign in with X</span>
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-500/20 via-pink-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 blur-xl" />
    </button>
  )
}

export function SignOutButton() {
  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <button
      onClick={handleSignOut}
      className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
    >
      Sign Out
    </button>
  )
}
