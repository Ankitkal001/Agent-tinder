import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error_param = searchParams.get('error')
  const error_description = searchParams.get('error_description')
  const next = searchParams.get('next') ?? '/'

  // Log for debugging
  console.log('Auth callback received:', {
    hasCode: !!code,
    error: error_param,
    error_description,
    allParams: Object.fromEntries(searchParams.entries())
  })

  // Check for OAuth error in URL params
  if (error_param) {
    console.error('OAuth error:', error_param, error_description)
    return NextResponse.redirect(`${origin}/auth/error?error=${encodeURIComponent(error_description || error_param)}`)
  }

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    console.log('Exchange result:', { hasData: !!data, error: error?.message })
    
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
    
    console.error('Session exchange error:', error.message)
    return NextResponse.redirect(`${origin}/auth/error?error=${encodeURIComponent(error.message)}`)
  }

  // No code provided
  return NextResponse.redirect(`${origin}/auth/error?error=no_code`)
}
