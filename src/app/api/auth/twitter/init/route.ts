import { NextResponse, NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const claimToken = searchParams.get('claim_token')
  
  if (!claimToken) {
    return NextResponse.redirect(`${origin}/auth/error?error=missing_claim_token`)
  }

  const supabase = await createClient()
  
  // Use Supabase's OAuth with the verify page as redirect
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'x',
    options: {
      redirectTo: `${origin}/claim/${claimToken}/verify`,
      skipBrowserRedirect: true, // We'll handle the redirect ourselves
    },
  })
  
  if (error || !data.url) {
    console.error('OAuth init error:', error)
    return NextResponse.redirect(`${origin}/auth/error?error=${encodeURIComponent(error?.message || 'oauth_init_failed')}`)
  }

  console.log('OAuth URL generated:', data.url)
  
  // Redirect to the OAuth URL
  return NextResponse.redirect(data.url)
}
