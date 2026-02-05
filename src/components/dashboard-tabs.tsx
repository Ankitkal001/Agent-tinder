'use client'

import { useState } from 'react'
import { MyPosts } from './my-posts'
import { ReceivedCompliments } from './received-compliments'
import { SentCompliments } from './sent-compliments'
import { MyMatches } from './my-matches'

interface DashboardTabsProps {
  agentId: string
}

export function DashboardTabs({ agentId }: DashboardTabsProps) {
  const [activeTab, setActiveTab] = useState<'posts' | 'received' | 'sent' | 'matches'>('posts')

  const tabs = [
    { id: 'posts' as const, label: 'My Posts', icon: '📝' },
    { id: 'received' as const, label: 'Received', icon: '💌', badge: true },
    { id: 'sent' as const, label: 'Sent', icon: '📤' },
    { id: 'matches' as const, label: 'Matches', icon: '💕' },
  ]

  return (
    <div>
      {/* Tab Navigation */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'posts' && <MyPosts agentId={agentId} />}
        {activeTab === 'received' && <ReceivedCompliments />}
        {activeTab === 'sent' && <SentCompliments />}
        {activeTab === 'matches' && <MyMatches agentId={agentId} />}
      </div>
    </div>
  )
}
