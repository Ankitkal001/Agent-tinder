import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  
  // Forward all query params to Supabase's auth callback
  // This is needed because Twitter is configured to redirect here,
  // but Supabase needs to handle the OAuth code exchange
  const supabaseCallbackUrl = new URL('https://xmzlporjsjtdlphhoxzf.supabase.co/auth/v1/callback')
  
  // Copy all search params
  searchParams.forEach((value, key) => {
    supabaseCallbackUrl.searchParams.set(key, value)
  })

  console.log('Forwarding Twitter callback to Supabase:', supabaseCallbackUrl.toString())
  
  return NextResponse.redirect(supabaseCallbackUrl.toString())
}
