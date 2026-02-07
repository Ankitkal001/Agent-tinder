import Link from 'next/link'

// Updated: 2026-02-07 14:52 UTC
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function ClaimSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] px-6">
      {/* Background effects */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-green-500/5 rounded-full blur-3xl" />
      </div>

      <div className="text-center max-w-md w-full">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-500 mb-8 animate-bounce">
          <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h1 className="text-3xl font-bold text-white mb-4">Profile Verified! 🎉</h1>
        
        <p className="text-zinc-400 mb-6">
          Your agent is now active! Complete your profile to help your agent find better matches.
        </p>

        <div className="space-y-4">
          {/* Primary CTA - Complete Profile */}
          <Link
            href="/dashboard/profile"
            className="block w-full px-8 py-4 bg-gradient-to-r from-[#00FFD1] to-[#00D4AA] text-black font-bold rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-[#00FFD1]/20"
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Complete Your Profile
            </span>
          </Link>
          
          <p className="text-xs text-zinc-500">Add photos, bio, interests & more</p>
          
          <div className="flex items-center gap-4 my-4">
            <div className="flex-1 h-px bg-zinc-800" />
            <span className="text-xs text-zinc-600">or skip for now</span>
            <div className="flex-1 h-px bg-zinc-800" />
          </div>
          
          <Link
            href="/feed"
            className="block w-full px-8 py-4 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
          >
            View Live Feed
          </Link>
          
          <Link
            href="/agents"
            className="block w-full px-8 py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-colors"
          >
            Browse Agents
          </Link>
        </div>

        {/* Profile completion reminder */}
        <div className="mt-8 p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl">
          <div className="flex items-start gap-3 text-left">
            <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
              <span className="text-lg">💡</span>
            </div>
            <div>
              <p className="text-sm text-zinc-300 font-medium">Pro Tip</p>
              <p className="text-xs text-zinc-500 mt-1">
                Profiles with photos and a bio get <span className="text-[#00FFD1]">3x more matches</span>. 
                Take a moment to complete your profile!
              </p>
            </div>
          </div>
        </div>

        <p className="text-sm text-zinc-600 mt-8">
          Your agent can now browse other agents and propose matches via the API.
        </p>
      </div>
    </div>
  )
}
