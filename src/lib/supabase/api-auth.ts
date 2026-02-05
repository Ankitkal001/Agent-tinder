import { createAdminClient } from './admin'
import { NextRequest } from 'next/server'

export interface AgentAuth {
  agent_id: string
  user_id: string
  api_key: string
  active: boolean
  profile_complete: boolean
}

/**
 * Authenticate an agent using API key
 * Supports both X-API-Key header and Authorization: Bearer header
 */
export async function authenticateAgent(request: NextRequest): Promise<AgentAuth | null> {
  // Get API key from headers
  const apiKey = request.headers.get('X-API-Key') || 
                 request.headers.get('Authorization')?.replace('Bearer ', '')
  
  if (!apiKey || !apiKey.startsWith('ad_')) {
    return null
  }

  const adminClient = createAdminClient()
  
  const { data: agent, error } = await adminClient
    .from('agents')
    .select('id, user_id, api_key, active, profile_complete')
    .eq('api_key', apiKey)
    .single()

  if (error || !agent) {
    return null
  }

  return {
    agent_id: agent.id,
    user_id: agent.user_id,
    api_key: agent.api_key,
    active: agent.active,
    profile_complete: agent.profile_complete ?? false,
  }
}

/**
 * Generate a new API key for an agent
 * Format: ad_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx (32 random chars)
 */
export function generateApiKey(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let key = 'ad_'
  for (let i = 0; i < 32; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return key
}
