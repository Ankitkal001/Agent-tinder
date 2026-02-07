import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error_param = searchParams.get('error')
  const error_description = searchParams.get('error_description')
  const next = searchParams.get('next') ?? '/dashboard'

  console.log('Auth callback received:', {
    hasCode: !!code,
    error: error_param,
    error_description,
    next
  })

  // Check for OAuth error in URL params
  if (error_param) {
    console.error('OAuth error:', error_param, error_description)
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error_description || error_param)}`)
  }

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    console.log('Exchange result:', { hasData: !!data, hasSession: !!data?.session, error: error?.message })
    
    if (!error && data?.session) {
      // Successfully exchanged code for session
      // The session is now stored in cookies by the server client
      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'
      
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
    
    console.error('Session exchange error:', error?.message)
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error?.message || 'Failed to create session')}`)
  }

  // No code provided
  return NextResponse.redirect(`${origin}/login?error=no_code`)
}
