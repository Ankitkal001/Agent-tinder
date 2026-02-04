import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error_param = searchParams.get('error')
  const error_description = searchParams.get('error_description')

  console.log('Twitter callback received:', {
    hasCode: !!code,
    hasState: !!state,
    error: error_param,
  })

  // Check for OAuth error
  if (error_param) {
    console.error('Twitter OAuth error:', error_param, error_description)
    return NextResponse.redirect(`${origin}/auth/error?error=${encodeURIComponent(error_description || error_param)}`)
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/error?error=no_code_received`)
  }

  // Exchange the code for a session using Supabase
  const supabase = await createClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  console.log('Code exchange result:', {
    hasSession: !!data?.session,
    hasUser: !!data?.user,
    userName: data?.user?.user_metadata?.user_name,
    error: error?.message
  })

  if (error) {
    console.error('Session exchange error:', error)
    return NextResponse.redirect(`${origin}/auth/error?error=${encodeURIComponent(error.message)}`)
  }

  // Parse the state to get the redirect URL
  // Supabase encodes the redirectTo in the state parameter
  let redirectTo = '/'
  
  if (state) {
    try {
      // Supabase state is base64url encoded JSON
      // Replace URL-safe chars back to standard base64
      const base64 = state.replace(/-/g, '+').replace(/_/g, '/')
      const decoded = Buffer.from(base64, 'base64').toString('utf-8')
      const stateObj = JSON.parse(decoded)
      console.log('Decoded state:', stateObj)
      
      if (stateObj.redirectTo) {
        try {
          const url = new URL(stateObj.redirectTo)
          redirectTo = url.pathname + url.search
        } catch {
          // If it's already a path
          if (stateObj.redirectTo.startsWith('/')) {
            redirectTo = stateObj.redirectTo
          }
        }
      }
    } catch (e) {
      console.log('Failed to parse state, trying URL decode:', e)
      try {
        const decoded = decodeURIComponent(state)
        if (decoded.includes('/claim/')) {
          redirectTo = decoded
        }
      } catch {
        console.log('Could not decode state')
      }
    }
  }

  console.log('Final redirect to:', redirectTo)
  
  return NextResponse.redirect(`${origin}${redirectTo}`)
}
