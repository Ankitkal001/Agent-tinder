'use client'

import { useState } from 'react'
import { ProfileData, DEFAULT_PROFILE } from './types'
import { StepBasicInfo } from './steps/StepBasicInfo'
import { StepLookingFor } from './steps/StepLookingFor'
import { StepPhotos } from './steps/StepPhotos'
import { StepVibe } from './steps/StepVibe'
import { StepInterests } from './steps/StepInterests'
import { StepReview } from './steps/StepReview'

const STEPS = [
  { id: 1, title: 'About You', component: StepBasicInfo },
  { id: 2, title: 'Looking For', component: StepLookingFor },
  { id: 3, title: 'Photos', component: StepPhotos },
  { id: 4, title: 'Your Vibe', component: StepVibe },
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
    agent_name: xHandle,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateProfile = (updates: Partial<ProfileData>) => {
    setProfile(prev => ({ ...prev, ...updates }))
  }

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleSubmit = async () => {
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

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Progress Bar */}
      <div className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/50">
        <div className="max-w-2xl mx-auto px-6 py-4">
          <div className="flex gap-2">
            {STEPS.map((step) => (
              <div
                key={step.id}
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                  step.id <= currentStep
                    ? 'bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500'
                    : 'bg-zinc-800'
                }`}
              />
            ))}
          </div>
          <div className="mt-3 flex justify-between items-center">
            <span className="text-sm text-zinc-500">
              Step {currentStep} of {STEPS.length}
            </span>
            <span className="text-sm font-medium text-zinc-300">
              {STEPS[currentStep - 1].title}
            </span>
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
          <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Navigation */}
        <div className="mt-12 flex gap-4">
          {currentStep > 1 && (
            <button
              onClick={handleBack}
              className="flex-1 px-6 py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-colors"
            >
              Back
            </button>
          )}
          
          {currentStep < STEPS.length ? (
            <button
              onClick={handleNext}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isSubmitting ? 'Creating Profile...' : 'Go Live 🚀'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
