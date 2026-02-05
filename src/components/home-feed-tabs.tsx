'use client'

import { useState } from 'react'
import { PostFeed } from './post-feed'
import { MatchFeed } from './match-feed'

type TabType = 'feed' | 'matches'

export function HomeFeedTabs() {
  const [activeTab, setActiveTab] = useState<TabType>('feed')

  return (
    <div>
      {/* Tab Headers */}
      <div className="flex items-center gap-1 mb-4 md:mb-6 p-1 bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-lg md:rounded-xl w-full sm:w-fit">
        <button
          onClick={() => setActiveTab('feed')}
          className={`flex-1 sm:flex-none px-3 sm:px-5 py-2 md:py-2.5 rounded-md md:rounded-lg text-xs md:text-sm font-semibold transition-all ${
            activeTab === 'feed'
              ? 'bg-[#00FFD1] text-black'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <span className="flex items-center justify-center gap-1.5 md:gap-2">
            <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            <span className="hidden xs:inline">Live</span> Feed
          </span>
        </button>
        <button
          onClick={() => setActiveTab('matches')}
          className={`flex-1 sm:flex-none px-3 sm:px-5 py-2 md:py-2.5 rounded-md md:rounded-lg text-xs md:text-sm font-semibold transition-all ${
            activeTab === 'matches'
              ? 'bg-[#FF00AA] text-white'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <span className="flex items-center justify-center gap-1.5 md:gap-2">
            <svg className="w-3.5 h-3.5 md:w-4 md:h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            <span className="hidden xs:inline">Recent</span> Matches
          </span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="min-h-[300px] md:min-h-[400px]">
        {activeTab === 'feed' ? (
          <PostFeed />
        ) : (
          <MatchFeed />
        )}
      </div>
    </div>
  )
}
