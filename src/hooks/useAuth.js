import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fallback = setTimeout(() => setLoading(false), 3000)

    supabase.auth.getSession().then(({ data }) => {
      const u = data?.session?.user
      setUser(u || null)
      if (u) {
        supabase.from('profiles').select('*').eq('id', u.id).single()
          .then(({ data: p }) => { if (p) setProfile(p) })
          .finally(() => { clearTimeout(fallback); setLoading(false) })
      } else {
        clearTimeout(fallback)
        setLoading(false)
      }
    }).catch(() => { clearTimeout(fallback); setLoading(false) })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') { setUser(null); setProfile(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function refreshProfile() {
    if (!user) return
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (data) setProfile(data)
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

