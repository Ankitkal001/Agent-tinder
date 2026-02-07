'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

interface ProfileData {
  agent_name: string
  display_name: string | null
  bio: string | null
  age: number | null
  gender: string
  location: string | null
  photos: string[]
  vibe_tags: string[]
  interests: string[]
  looking_for: string[]
  age_range_min: number
  age_range_max: number
  looking_for_traits: string[]
}

const VIBE_TAG_OPTIONS = [
  'ambitious', 'creative', 'nightowl', 'adventurous', 'chill', 
  'intellectual', 'romantic', 'funny', 'artistic', 'sporty',
  'tech-savvy', 'foodie', 'traveler', 'bookworm', 'music-lover'
]

const INTEREST_OPTIONS = [
  'crypto', 'AI', 'startups', 'travel', 'music', 'art', 'gaming',
  'fitness', 'cooking', 'reading', 'photography', 'fashion',
  'movies', 'hiking', 'yoga', 'meditation', 'dancing', 'writing'
]

export default function ProfileEditPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  
  const [profile, setProfile] = useState<ProfileData>({
    agent_name: '',
    display_name: null,
    bio: null,
    age: null,
    gender: 'other',
    location: null,
    photos: [],
    vibe_tags: [],
    interests: [],
    looking_for: ['male', 'female', 'other'],
    age_range_min: 18,
    age_range_max: 99,
    looking_for_traits: []
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/profile')
      const json = await res.json()
      
      if (json.error) {
        if (res.status === 401) {
          router.push('/login')
          return
        }
        setError(json.error)
        return
      }
      
      if (json.data?.profile) {
        setProfile(prev => ({ ...prev, ...json.data.profile }))
      }
    } catch (err) {
      setError('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(false)
    
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      })
      
      const json = await res.json()
      
      if (json.error) {
        setError(json.error)
        return
      }
      
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError('Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // For now, we'll use a placeholder - in production, integrate with Supabase Storage
    setUploadingPhoto(true)
    
    try {
      // Create a data URL for preview (in production, upload to storage)
      const reader = new FileReader()
      reader.onload = () => {
        const dataUrl = reader.result as string
        setProfile(prev => ({
          ...prev,
          photos: [...prev.photos, dataUrl].slice(0, 6) // Max 6 photos
        }))
        setUploadingPhoto(false)
      }
      reader.readAsDataURL(file)
    } catch (err) {
      setError('Failed to upload photo')
      setUploadingPhoto(false)
    }
  }

  const removePhoto = (index: number) => {
    setProfile(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }))
  }

  const toggleTag = (tag: string, field: 'vibe_tags' | 'interests' | 'looking_for') => {
    setProfile(prev => {
      const current = prev[field] as string[]
      if (current.includes(tag)) {
        return { ...prev, [field]: current.filter(t => t !== tag) }
      } else {
        return { ...prev, [field]: [...current, tag] }
      }
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#00FFD1]/30 border-t-[#00FFD1] rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#00FFD1]/5 rounded-full blur-[100px] translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#FF00AA]/5 rounded-full blur-[80px] -translate-x-1/2 translate-y-1/2" />
      </div>

      {/* Header */}
      <header className="border-b border-zinc-900 bg-[#050505]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
          
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-gradient-to-r from-[#00FFD1] to-[#00D4AA] text-black font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save Profile
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 md:px-6 py-8">
        {/* Status Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 flex items-center gap-3">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 flex items-center gap-3">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Profile saved successfully!
          </div>
        )}

        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Edit Your Profile</h1>
          <p className="text-zinc-400">Complete your profile to help your agent find better matches</p>
        </div>

        <div className="space-y-8">
          {/* Photos Section */}
          <section className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-[#FF00AA]/10 flex items-center justify-center">
                📸
              </span>
              Photos
            </h2>
            <p className="text-sm text-zinc-500 mb-4">Add up to 6 photos. Your first photo will be your main profile picture.</p>
            
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {profile.photos.map((photo, index) => (
                <div key={index} className="relative aspect-square rounded-xl overflow-hidden group">
                  <Image src={photo} alt={`Photo ${index + 1}`} fill className="object-cover" />
                  <button
                    onClick={() => removePhoto(index)}
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                  {index === 0 && (
                    <div className="absolute bottom-1 left-1 px-2 py-0.5 bg-[#00FFD1] text-black text-[10px] font-bold rounded">
                      MAIN
                    </div>
                  )}
                </div>
              ))}
              
              {profile.photos.length < 6 && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="aspect-square rounded-xl border-2 border-dashed border-zinc-700 hover:border-[#00FFD1] transition-colors flex flex-col items-center justify-center gap-2 text-zinc-500 hover:text-[#00FFD1]"
                >
                  {uploadingPhoto ? (
                    <div className="w-6 h-6 border-2 border-zinc-600 border-t-[#00FFD1] rounded-full animate-spin" />
                  ) : (
                    <>
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span className="text-xs">Add Photo</span>
                    </>
                  )}
                </button>
              )}
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </section>

          {/* Basic Info Section */}
          <section className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-[#00FFD1]/10 flex items-center justify-center">
                👤
              </span>
              Basic Info
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Display Name</label>
                <input
                  type="text"
                  value={profile.display_name || ''}
                  onChange={(e) => setProfile(prev => ({ ...prev, display_name: e.target.value || null }))}
                  placeholder="Your name"
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:border-[#00FFD1] focus:outline-none transition-colors"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Age</label>
                <input
                  type="number"
                  value={profile.age || ''}
                  onChange={(e) => setProfile(prev => ({ ...prev, age: e.target.value ? parseInt(e.target.value) : null }))}
                  placeholder="Your age"
                  min={18}
                  max={100}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:border-[#00FFD1] focus:outline-none transition-colors"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Gender</label>
                <select
                  value={profile.gender}
                  onChange={(e) => setProfile(prev => ({ ...prev, gender: e.target.value }))}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:border-[#00FFD1] focus:outline-none transition-colors"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Location</label>
                <input
                  type="text"
                  value={profile.location || ''}
                  onChange={(e) => setProfile(prev => ({ ...prev, location: e.target.value || null }))}
                  placeholder="City, Country"
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:border-[#00FFD1] focus:outline-none transition-colors"
                />
              </div>
            </div>
            
            <div className="mt-6">
              <label className="block text-sm font-medium text-zinc-400 mb-2">Bio</label>
              <textarea
                value={profile.bio || ''}
                onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value || null }))}
                placeholder="Tell us about yourself... What makes you unique? What are you passionate about?"
                rows={4}
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:border-[#00FFD1] focus:outline-none transition-colors resize-none"
              />
              <p className="text-xs text-zinc-600 mt-1">{(profile.bio || '').length}/500 characters</p>
            </div>
          </section>

          {/* Vibe Tags Section */}
          <section className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                ✨
              </span>
              Your Vibe
            </h2>
            <p className="text-sm text-zinc-500 mb-4">Select tags that describe your personality</p>
            
            <div className="flex flex-wrap gap-2">
              {VIBE_TAG_OPTIONS.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag, 'vibe_tags')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    profile.vibe_tags.includes(tag)
                      ? 'bg-gradient-to-r from-[#00FFD1] to-[#00D4AA] text-black'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </section>

          {/* Interests Section */}
          <section className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                🎯
              </span>
              Interests
            </h2>
            <p className="text-sm text-zinc-500 mb-4">What are you into?</p>
            
            <div className="flex flex-wrap gap-2">
              {INTEREST_OPTIONS.map(interest => (
                <button
                  key={interest}
                  onClick={() => toggleTag(interest, 'interests')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    profile.interests.includes(interest)
                      ? 'bg-gradient-to-r from-[#FF00AA] to-[#FF6B6B] text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </section>

          {/* Looking For Section */}
          <section className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center">
                💕
              </span>
              Looking For
            </h2>
            <p className="text-sm text-zinc-500 mb-4">Who would you like to meet?</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-3">Gender Preference</label>
                <div className="flex flex-wrap gap-2">
                  {['male', 'female', 'other'].map(gender => (
                    <button
                      key={gender}
                      onClick={() => toggleTag(gender, 'looking_for')}
                      className={`px-6 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                        profile.looking_for.includes(gender)
                          ? 'bg-gradient-to-r from-[#FF00AA] to-[#FF6B6B] text-white'
                          : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                      }`}
                    >
                      {gender}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Min Age</label>
                  <input
                    type="number"
                    value={profile.age_range_min}
                    onChange={(e) => setProfile(prev => ({ ...prev, age_range_min: parseInt(e.target.value) || 18 }))}
                    min={18}
                    max={99}
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:border-[#00FFD1] focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Max Age</label>
                  <input
                    type="number"
                    value={profile.age_range_max}
                    onChange={(e) => setProfile(prev => ({ ...prev, age_range_max: parseInt(e.target.value) || 99 }))}
                    min={18}
                    max={99}
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:border-[#00FFD1] focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Save Button (Mobile) */}
          <div className="md:hidden">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full px-6 py-4 bg-gradient-to-r from-[#00FFD1] to-[#00D4AA] text-black font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save Profile
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
