'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface CurrentUser {
  id: string
  name: string
  email: string
}

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    async function load() {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser && !authUser.is_anonymous) {
        setUser({
          id: authUser.id,
          name: authUser.user_metadata?.name ?? authUser.email?.split('@')[0] ?? 'User',
          email: authUser.email ?? '',
        })
      } else {
        setUser(null)
      }
      setLoading(false)
    }

    load()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const authUser = session?.user ?? null
      if (authUser && !authUser.is_anonymous) {
        setUser({
          id: authUser.id,
          name: authUser.user_metadata?.name ?? authUser.email?.split('@')[0] ?? 'User',
          email: authUser.email ?? '',
        })
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  return { user, loading }
}