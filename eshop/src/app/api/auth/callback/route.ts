import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')

    console.log('Callback hit! code:', code)
    console.log('Origin:', origin)

    if (code) {
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

      const { error } = await supabase.auth.exchangeCodeForSession(code)
      console.log('Exchange error:', error)

      if (!error) {
        return NextResponse.redirect(`${origin}/resetPassword`)
      }

      // Code failed — tell user why
      console.log('Exchange failed:', error.message)
    }

    return NextResponse.redirect(`${origin}/forgotPassword`)

  } catch (err) {
    // Catch any unexpected crash
    console.error('Callback route crashed:', err)
    const origin = new URL(request.url).origin
    return NextResponse.redirect(`${origin}/forgotPassword`)
  }
}