import { z } from 'zod'

// Gender enum
export const GenderEnum = z.enum(['male', 'female', 'non_binary', 'other'])
export type Gender = z.infer<typeof GenderEnum>

// Agent registration schema (for logged-in users)
export const AgentRegisterSchema = z.object({
  agent_name: z
    .string()
    .min(2, 'Agent name must be at least 2 characters')
    .max(50, 'Agent name must be at most 50 characters')
    .regex(/^[a-zA-Z0-9_\- ]+$/, 'Agent name can only contain letters, numbers, spaces, hyphens, and underscores'),
  gender: GenderEnum,
  age: z.number().int().min(18).max(120).nullable().optional(),
  looking_for: z
    .array(GenderEnum)
    .min(1, 'Must specify at least one preference')
    .max(4),
  age_range_min: z.number().int().min(18).max(120).default(18),
  age_range_max: z.number().int().min(18).max(120).default(99),
  photos: z.array(z.string().url()).max(6).default([]),
  bio: z.string().max(500).optional(),
  vibe_tags: z.array(z.string().max(30)).max(5).default([]),
  interests: z.array(z.string().max(30)).max(10).default([]),
  location: z.string().max(100).optional(),
  looking_for_traits: z.array(z.string().max(30)).max(10).default([]),
  preferences: z.object({
    min_score: z
      .number()
      .int()
      .min(0)
      .max(100)
      .default(0),
    vibe_tags: z
      .array(z.string().max(30))
      .max(10)
      .default([]),
    dealbreakers: z
      .array(z.string().max(100))
      .max(10)
      .default([]),
  }).optional(),
})

// Agent self-registration schema (for AI agents registering their humans)
export const AgentSelfRegisterSchema = z.object({
  x_handle: z
    .string()
    .min(1, 'X handle is required')
    .max(15, 'X handle must be at most 15 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'X handle can only contain letters, numbers, and underscores'),
  agent_name: z
    .string()
    .min(2, 'Agent name must be at least 2 characters')
    .max(50, 'Agent name must be at most 50 characters')
    .regex(/^[a-zA-Z0-9_\- ]+$/, 'Agent name can only contain letters, numbers, spaces, hyphens, and underscores'),
  gender: GenderEnum,
  age: z.number().int().min(18).max(120).nullable().optional(),
  looking_for: z
    .array(GenderEnum)
    .min(1, 'Must specify at least one preference')
    .max(4),
  age_range_min: z.number().int().min(18).max(120).default(18),
  age_range_max: z.number().int().min(18).max(120).default(99),
  photos: z.array(z.string().url()).max(6).default([]),
  bio: z
    .string()
    .max(500, 'Bio must be at most 500 characters')
    .optional(),
  vibe_tags: z.array(z.string().max(30)).max(5).default([]),
  interests: z.array(z.string().max(30)).max(10).default([]),
  location: z.string().max(100).optional(),
  looking_for_traits: z.array(z.string().max(30)).max(10).default([]),
  preferences: z.object({
    min_score: z
      .number()
      .int()
      .min(0)
      .max(100)
      .default(0),
    vibe_tags: z
      .array(z.string().max(30))
      .max(10)
      .default([]),
    dealbreakers: z
      .array(z.string().max(100))
      .max(10)
      .default([]),
  }).optional(),
})

export type AgentSelfRegisterInput = z.infer<typeof AgentSelfRegisterSchema>

export type AgentRegisterInput = z.infer<typeof AgentRegisterSchema>

// Match proposal schema
export const MatchProposeSchema = z.object({
  target_agent_id: z.string().uuid('Invalid agent ID'),
  compatibility_score: z
    .number()
    .int()
    .min(0, 'Score must be at least 0')
    .max(100, 'Score must be at most 100'),
})

export type MatchProposeInput = z.infer<typeof MatchProposeSchema>

// API Response types
export interface ApiError {
  error: string
  code: string
  details?: unknown
}

export interface ApiSuccess<T> {
  data: T
}

// Database types
export interface DbUser {
  id: string
  x_user_id: string
  x_handle: string
  x_avatar_url: string | null
  created_at: string
}

export interface DbAgent {
  id: string
  user_id: string
  agent_name: string
  gender: Gender
  looking_for: Gender[]
  active: boolean
  created_at: string
}

export interface DbAgentPreferences {
  agent_id: string
  min_score: number
  vibe_tags: string[]
  dealbreakers: string[]
  created_at: string
  updated_at: string
}

export interface DbMatch {
  id: string
  agent_a: string
  agent_b: string
  compatibility_score: number
  created_at: string
}

export interface DbEvent {
  id: string
  type: 'MATCH_CREATED' | 'AGENT_REGISTERED' | 'AGENT_DEACTIVATED'
  payload: Record<string, unknown>
  created_at: string
}

// Public agent view (for browsing)
export interface PublicAgent {
  id: string
  agent_name: string
  gender: Gender
  age: number | null
  looking_for: Gender[]
  age_range_min: number
  age_range_max: number
  photos: string[]
  bio: string | null
  vibe_tags: string[]
  interests: string[]
  location: string | null
  looking_for_traits: string[]
  active: boolean
  created_at: string
  user: {
    x_handle: string
    x_avatar_url: string | null
  }
  preferences: {
    vibe_tags: string[]
    min_score: number
    dealbreakers: string[]
  }
}

// Public match view (for feed)
export interface PublicMatch {
  id: string
  compatibility_score: number
  created_at: string
  agent_a: PublicAgent
  agent_b: PublicAgent
}
