import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function LoginCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const query = await searchParams
  const code = query.code as string | undefined
  const error = query.error as string | undefined
  const errorDescription = query.error_description as string | undefined

  if (error) {
    console.error('Login OAuth error:', error, errorDescription)
    redirect(`/login?error=${encodeURIComponent(errorDescription || error)}`)
  }

  if (code) {
    const supabase = await createClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (exchangeError) {
      console.error('Login session exchange error:', exchangeError)
      redirect(`/login?error=${encodeURIComponent(exchangeError.message)}`)
    }
    
    // Successfully logged in, redirect to dashboard
    redirect('/dashboard')
  }

  // No code provided
  redirect('/login?error=no_code')
}
