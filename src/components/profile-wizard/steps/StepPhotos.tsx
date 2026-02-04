'use client'

import { useState, useRef } from 'react'
import { ProfileData } from '../types'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

interface StepProps {
  profile: ProfileData
  updateProfile: (updates: Partial<ProfileData>) => void
  xHandle: string
}

export function StepPhotos({ profile, updateProfile, xHandle }: StepProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    setError(null)

    try {
      const supabase = createClient()
      const newPhotos: string[] = []

      for (const file of Array.from(files)) {
        // Validate file
        if (!file.type.startsWith('image/')) {
          throw new Error('Please upload only image files')
        }
        if (file.size > 5 * 1024 * 1024) {
          throw new Error('Image must be less than 5MB')
        }

        // Generate unique filename
        const ext = file.name.split('.').pop()
        const fileName = `${xHandle}-${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`

        // Upload to Supabase Storage
        const { data, error: uploadError } = await supabase.storage
          .from('profile-photos')
          .upload(fileName, file)

        if (uploadError) throw uploadError

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('profile-photos')
          .getPublicUrl(data.path)

        newPhotos.push(urlData.publicUrl)
      }

      updateProfile({ photos: [...profile.photos, ...newPhotos].slice(0, 6) })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload photo')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const removePhoto = (index: number) => {
    updateProfile({ photos: profile.photos.filter((_, i) => i !== index) })
  }

  return (
    <div className="space-y-8 mt-8">
      <p className="text-zinc-400">
        Add up to 6 photos to your profile. Your first photo will be your main profile picture.
      </p>

      {/* Photo Grid */}
      <div className="grid grid-cols-3 gap-4">
        {[...Array(6)].map((_, index) => {
          const photo = profile.photos[index]
          return (
            <div
              key={index}
              className={`aspect-square rounded-2xl border-2 border-dashed transition-all ${
                photo
                  ? 'border-transparent'
                  : 'border-zinc-700 hover:border-pink-500/50'
              } overflow-hidden relative group`}
            >
              {photo ? (
                <>
                  <Image
                    src={photo}
                    alt={`Photo ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                  <button
                    onClick={() => removePhoto(index)}
                    className="absolute top-2 right-2 w-8 h-8 bg-black/60 hover:bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  {index === 0 && (
                    <div className="absolute bottom-2 left-2 px-2 py-1 bg-gradient-to-r from-orange-500 to-pink-500 rounded-lg text-xs font-medium">
                      Main
                    </div>
                  )}
                </>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full h-full flex flex-col items-center justify-center text-zinc-500 hover:text-pink-400 transition-colors"
                >
                  <svg className="w-8 h-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-xs">Add Photo</span>
                </button>
              )}
            </div>
          )
        })}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {uploading && (
        <div className="text-center text-pink-400">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-pink-400 border-t-transparent mr-2" />
          Uploading...
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      )}

      <p className="text-xs text-zinc-500 text-center">
        Tip: Photos with good lighting and a clear face work best!
      </p>
    </div>
  )
}
