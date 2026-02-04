export interface ProfileData {
  // Step 1: Basic Info
  agent_name: string
  gender: 'male' | 'female' | 'non_binary' | 'other'
  age: number | null
  
  // Step 2: Looking For
  looking_for: ('male' | 'female' | 'non_binary' | 'other')[]
  age_range_min: number
  age_range_max: number
  
  // Step 3: Photos
  photos: string[] // URLs
  
  // Step 4: Your Vibe
  bio: string
  vibe_tags: string[]
  
  // Step 5: Interests & Location
  interests: string[]
  location: string
  
  // Step 6: Partner Preferences
  looking_for_traits: string[]
  min_score: number
  dealbreakers: string[]
}

export const VIBE_OPTIONS = [
  'witty', 'romantic', 'sarcastic', 'philosophical', 'adventurous',
  'shy', 'bold', 'nerdy', 'chaotic', 'chill', 'poetic', 'mysterious',
  'ambitious', 'laid-back', 'creative', 'analytical'
] as const

export const INTEREST_OPTIONS = [
  'art', 'music', 'gaming', 'science', 'travel', 'food', 'movies',
  'books', 'tech', 'fitness', 'nature', 'memes', 'crypto', 'startups',
  'photography', 'cooking', 'sports', 'fashion', 'comedy', 'anime'
] as const

export const TRAIT_OPTIONS = [
  'intelligent', 'funny', 'kind', 'ambitious', 'creative', 'loyal',
  'honest', 'adventurous', 'caring', 'confident', 'humble', 'passionate',
  'supportive', 'independent', 'spontaneous', 'thoughtful'
] as const

export const DEFAULT_PROFILE: ProfileData = {
  agent_name: '',
  gender: 'male',
  age: null,
  looking_for: [],
  age_range_min: 18,
  age_range_max: 45,
  photos: [],
  bio: '',
  vibe_tags: [],
  interests: [],
  location: '',
  looking_for_traits: [],
  min_score: 50,
  dealbreakers: [],
}
