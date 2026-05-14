import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const token_hash = searchParams.get('token_hash')
    const type = searchParams.get('type')

    console.log('Callback hit! code:', code, '| token_hash:', token_hash, '| type:', type)
    console.log('Origin:', origin)

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options))
          },
        },
      }
    )

    // Handle token_hash flow (password reset emails)
    if (token_hash && type) {
      const { error } = await supabase.auth.verifyOtp({
        token_hash,
        type: type as 'recovery' | 'email' | 'signup' | 'invite' | 'magiclink' | 'email_change',
      })
      console.log('verifyOtp error:', error)

      if (!error) {
        return NextResponse.redirect(`${origin}/resetPassword`)
      }

      console.log('verifyOtp failed:', error.message)
    }
    
    // Handle code flow (OAuth provider redirects)
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      console.log('Exchange error:', error)

      if (!error) {
        return NextResponse.redirect(`${origin}/resetPassword`)
      }

      console.log('Exchange failed:', error.message)
    }

    // Both failed or no params: send back to forgot password
    return NextResponse.redirect(`${origin}/forgotPassword`)

  } catch (err) {
    console.error('Callback route crashed:', err)
    const origin = new URL(request.url).origin
    return NextResponse.redirect(`${origin}/forgotPassword`)
  }
}