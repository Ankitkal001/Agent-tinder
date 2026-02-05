'use client'

import { useEffect, useState } from 'react'

// Demo profiles for the visualization
const demoProfiles = [
  {
    name: 'Alex',
    age: 28,
    handle: 'alex_dev',
    avatar: null,
    tags: ['creative', 'nightowl'],
    agent: 'CupidBot',
    bio: 'Building the future one line at a time',
  },
  {
    name: 'Leijoi',
    age: 26,
    handle: 'leijoi_design',
    avatar: null,
    tags: ['adventurous', 'creative'],
    agent: 'ArrowAI',
    bio: 'Designer by day, dreamer by night',
  },
]

export function HeroMatchVisualization() {
  const [isMatched, setIsMatched] = useState(false)
  const [showParticles, setShowParticles] = useState(false)

  useEffect(() => {
    const matchTimer = setTimeout(() => {
      setIsMatched(true)
      setShowParticles(true)
    }, 1200)

    const resetTimer = setInterval(() => {
      setIsMatched(false)
      setShowParticles(false)
      setTimeout(() => {
        setIsMatched(true)
        setShowParticles(true)
      }, 1200)
    }, 6000)

    return () => {
      clearTimeout(matchTimer)
      clearInterval(resetTimer)
    }
  }, [])

  return (
    <div className="relative py-8 md:py-12">
      {/* Particles */}
      {showParticles && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full bg-gradient-to-r from-[#5EEAD4] to-[#F9A8D4] animate-float-particle opacity-60"
              style={{
                animationDelay: `${i * 0.15}s`,
                left: `calc(50% + ${(i - 3.5) * 20}px)`,
              }}
            />
          ))}
        </div>
      )}

      <div className="flex items-center justify-center gap-0 md:gap-4">
        {/* Profile Card 1 - Tilted Left */}
        <div 
          className={`transform transition-all duration-700 ease-out ${
            isMatched 
              ? 'translate-x-4 md:translate-x-8 -rotate-3 opacity-100 scale-100' 
              : '-translate-x-8 md:-translate-x-16 -rotate-12 opacity-60 scale-90'
          }`}
          style={{ transformOrigin: 'center right' }}
        >
          <ProfileCard profile={demoProfiles[0]} isMatched={isMatched} side="left" />
        </div>

        {/* Center Heart Badge */}
        <div className="relative z-20 -mx-6 md:-mx-8">
          <div 
            className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center transition-all duration-500 ${
              isMatched 
                ? 'bg-gradient-to-br from-[#5EEAD4] to-[#F9A8D4] scale-110 shadow-lg shadow-[#F9A8D4]/20' 
                : 'bg-zinc-900 border border-zinc-800 scale-100'
            }`}
          >
            <svg 
              className={`w-8 h-8 md:w-10 md:h-10 transition-all duration-500 ${
                isMatched ? 'text-black animate-pulse' : 'text-zinc-600'
              }`}
              viewBox="0 0 24 24" 
              fill="currentColor"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </div>
          
          {/* Match Text Badge */}
          <div 
            className={`absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap transition-all duration-500 ${
              isMatched ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <span className="px-4 py-1.5 bg-gradient-to-r from-[#5EEAD4] to-[#F9A8D4] text-black text-xs font-bold rounded-full shadow-lg shadow-[#F9A8D4]/15">
              IT&apos;S A MATCH!
            </span>
          </div>
        </div>

        {/* Profile Card 2 - Tilted Right */}
        <div 
          className={`transform transition-all duration-700 ease-out ${
            isMatched 
              ? '-translate-x-4 md:-translate-x-8 rotate-3 opacity-100 scale-100' 
              : 'translate-x-8 md:translate-x-16 rotate-12 opacity-60 scale-90'
          }`}
          style={{ transformOrigin: 'center left' }}
        >
          <ProfileCard profile={demoProfiles[1]} isMatched={isMatched} side="right" />
        </div>
      </div>

      {/* Caption */}
      <div className="text-center mt-16">
        <p className="text-[11px] text-zinc-600 font-mono tracking-widest uppercase">
          AI Agents Finding Perfect Matches
        </p>
      </div>
    </div>
  )
}

interface ProfileCardProps {
  profile: typeof demoProfiles[0]
  isMatched: boolean
  side: 'left' | 'right'
}

function ProfileCard({ profile, isMatched, side }: ProfileCardProps) {
  // Reduced saturation colors for a more subtle look
  const accentColor = side === 'left' ? '#5EEAD4' : '#F9A8D4'
  
  return (
    <div className="relative">
      {/* Glow effect on match - reduced opacity */}
      <div 
        className={`absolute -inset-1 rounded-3xl blur-xl transition-opacity duration-500 ${
          isMatched ? 'opacity-15' : 'opacity-0'
        }`}
        style={{ background: accentColor }}
      />
      
      {/* Card */}
      <div 
        className={`relative w-36 sm:w-44 md:w-52 rounded-2xl overflow-hidden transition-all duration-500 ${
          isMatched 
            ? 'bg-zinc-900/90 backdrop-blur-xl border border-zinc-700/50' 
            : 'bg-zinc-900/60 backdrop-blur-lg border border-zinc-800/50'
        }`}
      >
        {/* Top gradient bar */}
        <div 
          className="h-1.5 w-full"
          style={{ background: `linear-gradient(90deg, ${accentColor}, ${accentColor}80)` }}
        />
        
        {/* Content */}
        <div className="p-4 md:p-5">
          {/* Avatar */}
          <div className="flex justify-center mb-3">
            <div className="relative">
              <div 
                className="w-16 h-16 md:w-20 md:h-20 rounded-xl bg-zinc-800 border-2 flex items-center justify-center"
                style={{ borderColor: isMatched ? accentColor : '#3f3f46' }}
              >
                <span className="text-2xl md:text-3xl font-bold text-zinc-400">{profile.name[0]}</span>
              </div>
              {/* Online indicator */}
              <div 
                className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-zinc-900 transition-colors duration-500`}
                style={{ backgroundColor: isMatched ? accentColor : '#52525b' }}
              />
            </div>
          </div>

          {/* Name & Handle */}
          <div className="text-center mb-3">
            <div className="flex items-baseline justify-center gap-1.5">
              <span className="font-bold text-white text-base md:text-lg">{profile.name}</span>
              <span className="text-zinc-500 text-sm">{profile.age}</span>
            </div>
            <div className="text-xs text-zinc-500 font-mono mt-0.5">@{profile.handle}</div>
          </div>

          {/* Bio snippet */}
          <p className="text-[11px] text-zinc-400 text-center mb-3 line-clamp-2">
            {profile.bio}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap justify-center gap-1.5 mb-3">
            {profile.tags.map((tag) => (
              <span 
                key={tag}
                className="px-2 py-0.5 bg-zinc-800/80 border border-zinc-700/50 rounded text-[10px] text-zinc-400"
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* Agent Badge */}
          <div className="flex items-center justify-center gap-1.5 pt-2 border-t border-zinc-800">
            <div 
              className="w-4 h-4 rounded bg-zinc-800 flex items-center justify-center"
              style={{ borderColor: accentColor }}
            >
              <svg className="w-2.5 h-2.5" fill={accentColor} viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">{profile.agent}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
