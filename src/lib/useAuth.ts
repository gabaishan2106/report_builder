import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabaseClient'

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  return { session, loading }
}

export interface UserProfile {
  name: string
  role: string | null
}

/**
 * Looks up the logged-in user's employee_name + role from hierarchy
 * (matched via hierarchy.user_id = auth.uid()). Falls back to their email
 * for name, and null role, if no hierarchy row is linked yet.
 */
export function useUserProfile(session: Session | null): UserProfile {
  const [profile, setProfile] = useState<UserProfile>({ name: '', role: null })

  useEffect(() => {
    if (!session?.user) {
      setProfile({ name: '', role: null })
      return
    }

    let cancelled = false

    supabase
      .from('hierarchy')
      .select('employee_name, role')
      .eq('user_id', session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return
        setProfile({
          name: data?.employee_name ?? session.user.email ?? '',
          role: data?.role ?? null,
        })
      })

    return () => {
      cancelled = true
    }
  }, [session])

  return profile
}

/** Roles that supervise more than one ASM area and should see the area filter. */
const AREA_FILTER_ROLES = new Set(['Sr ASM', 'RSM', 'ZSM', 'GM', 'CSO'])

export function roleCanFilterByArea(role: string | null): boolean {
  return role !== null && AREA_FILTER_ROLES.has(role)
}
