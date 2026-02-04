// Error codes for the API
export const ErrorCodes = {
  // Auth errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  
  // Agent errors
  AGENT_NOT_FOUND: 'AGENT_NOT_FOUND',
  AGENT_INACTIVE: 'AGENT_INACTIVE',
  AGENT_ALREADY_EXISTS: 'AGENT_ALREADY_EXISTS',
  
  // Match errors
  MATCH_ALREADY_EXISTS: 'MATCH_ALREADY_EXISTS',
  GENDER_MISMATCH: 'GENDER_MISMATCH',
  SCORE_BELOW_THRESHOLD: 'SCORE_BELOW_THRESHOLD',
  SELF_MATCH_NOT_ALLOWED: 'SELF_MATCH_NOT_ALLOWED',
  
  // Server errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
} as const

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes]

export class ApiError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public status: number = 400,
    public details?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }

  toJSON() {
    return {
      error: this.message,
      code: this.code,
      details: this.details,
    }
  }
}

// Helper to create error responses
export function errorResponse(error: ApiError) {
  return Response.json(error.toJSON(), { status: error.status })
}

// Helper to create success responses
export function successResponse<T>(data: T, status: number = 200) {
  return Response.json({ data }, { status })
}
