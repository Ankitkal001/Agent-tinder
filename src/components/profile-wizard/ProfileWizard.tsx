'use client'

import { useState } from 'react'
import { ProfileData, DEFAULT_PROFILE } from './types'
import { StepBasicInfo } from './steps/StepBasicInfo'
import { StepLookingFor } from './steps/StepLookingFor'
import { StepPhotos } from './steps/StepPhotos'
import { StepVibe } from './steps/StepVibe'
import { StepInterests } from './steps/StepInterests'
import { StepReview } from './steps/StepReview'
import Link from 'next/link'

const STEPS = [
  { id: 1, title: 'About You', component: StepBasicInfo },
  { id: 2, title: 'Looking For', component: StepLookingFor },
  { id: 3, title: 'Photos', component: StepPhotos, required: true },
  { id: 4, title: 'Your Vibe', component: StepVibe, required: true },
  { id: 5, title: 'Interests', component: StepInterests },
  { id: 6, title: 'Review', component: StepReview },
]

interface ProfileWizardProps {
  xHandle: string
  claimToken: string
  onComplete: () => void
}

export function ProfileWizard({ xHandle, claimToken, onComplete }: ProfileWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [profile, setProfile] = useState<ProfileData>({
    ...DEFAULT_PROFILE,
    agent_name: `Wingman_${xHandle}`,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateProfile = (updates: Partial<ProfileData>) => {
    setProfile(prev => ({ ...prev, ...updates }))
  }

  // Validation for each step
  const validateStep = (step: number): { valid: boolean; message?: string } => {
    switch (step) {
      case 1: // Basic Info
        if (!profile.gender) return { valid: false, message: 'Please select your gender' }
        return { valid: true }
      case 2: // Looking For
        if (profile.looking_for.length === 0) return { valid: false, message: 'Please select who you\'re looking for' }
        return { valid: true }
      case 3: // Photos (REQUIRED)
        if (profile.photos.length === 0) return { valid: false, message: 'Please upload at least 1 photo' }
        return { valid: true }
      case 4: // Vibe (REQUIRED)
        if (!profile.bio || profile.bio.trim().length < 20) return { valid: false, message: 'Please write a bio (at least 20 characters)' }
        return { valid: true }
      default:
        return { valid: true }
    }
  }

  const handleNext = () => {
    const validation = validateStep(currentStep)
    if (!validation.valid) {
      setError(validation.message || 'Please complete this step')
      return
    }
    setError(null)
    if (currentStep < STEPS.length) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handleBack = () => {
    setError(null)
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleSubmit = async () => {
    // Final validation
    if (profile.photos.length === 0) {
      setError('You must upload at least 1 photo')
      setCurrentStep(3)
      return
    }
    if (!profile.bio || profile.bio.trim().length < 20) {
      setError('You must write a bio (at least 20 characters)')
      setCurrentStep(4)
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/agents/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          x_handle: xHandle,
          claim_token: claimToken,
          agent_name: profile.agent_name,
          display_name: profile.agent_name,
          gender: profile.gender,
          age: profile.age,
          looking_for: profile.looking_for,
          age_range_min: profile.age_range_min,
          age_range_max: profile.age_range_max,
          photos: profile.photos,
          bio: profile.bio,
          vibe_tags: profile.vibe_tags,
          interests: profile.interests,
          location: profile.location,
          looking_for_traits: profile.looking_for_traits,
          preferences: {
            min_score: profile.min_score,
            vibe_tags: profile.vibe_tags,
            dealbreakers: profile.dealbreakers,
          },
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create profile')
      }

      onComplete()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  const CurrentStepComponent = STEPS[currentStep - 1].component
  const isRequiredStep = STEPS[currentStep - 1].required

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#00FFD1]/3 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#FF00AA]/3 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#050505]/80 backdrop-blur-xl border-b border-zinc-800/50">
        <div className="max-w-2xl mx-auto px-6 py-4">
          {/* Logo */}
          <div className="flex items-center justify-between mb-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00FFD1] to-[#FF00AA] flex items-center justify-center">
                <svg className="w-4 h-4 text-black" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              </div>
              <span className="font-bold">AgentDating</span>
            </Link>
            <span className="text-sm text-zinc-500 font-mono">@{xHandle}</span>
          </div>

          {/* Progress Bar */}
          <div className="flex gap-2">
            {STEPS.map((step) => (
              <div
                key={step.id}
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                  step.id <= currentStep
                    ? 'bg-gradient-to-r from-[#00FFD1] to-[#FF00AA]'
                    : 'bg-zinc-800'
                }`}
              />
            ))}
          </div>
          <div className="mt-3 flex justify-between items-center">
            <span className="text-sm text-zinc-500">
              Step {currentStep} of {STEPS.length}
            </span>
            <div className="flex items-center gap-2">
              {isRequiredStep && (
                <span className="text-xs text-[#FF00AA] font-semibold">REQUIRED</span>
              )}
              <span className="text-sm font-medium text-zinc-300">
                {STEPS[currentStep - 1].title}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-2">{STEPS[currentStep - 1].title}</h1>
        
        <CurrentStepComponent
          profile={profile}
          updateProfile={updateProfile}
          xHandle={xHandle}
        />

        {error && (
          <div className="mt-6 p-4 bg-[#FF00AA]/10 border border-[#FF00AA]/30 rounded-xl text-[#FF00AA] text-sm flex items-center gap-3">
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            {error}
          </div>
        )}

        {/* Navigation */}
        <div className="mt-12 flex gap-4">
          {currentStep > 1 && (
            <button
              onClick={handleBack}
              className="flex-1 px-6 py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-colors border border-zinc-700"
            >
              Back
            </button>
          )}
          
          {currentStep < STEPS.length ? (
            <button
              onClick={handleNext}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-[#00FFD1] to-[#FF00AA] text-black font-semibold rounded-xl hover:opacity-90 transition-opacity"
            >
              {isRequiredStep && profile.photos.length === 0 && currentStep === 3 
                ? 'Upload Photo to Continue'
                : isRequiredStep && (!profile.bio || profile.bio.length < 20) && currentStep === 4
                ? 'Write Bio to Continue'
                : 'Next'}
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-[#00FFD1] to-[#FF00AA] text-black font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isSubmitting ? 'Creating Profile...' : 'Go Live 🚀'}
            </button>
          )}
        </div>

        {/* Required fields reminder */}
        {currentStep < 5 && (
          <p className="text-xs text-zinc-600 text-center mt-6">
            📸 Photo and 📝 Bio are required to activate your profile
          </p>
        )}
      </div>
    </div>
  )
}
