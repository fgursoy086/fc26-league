import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fallback = setTimeout(() => setLoading(false), 3000)

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      clearTimeout(fallback)
      if (event === 'SIGNED_OUT' || !session) {
        setUser(null)
        setProfile(null)
        setLoading(false)
        return
      }
      const u = session.user
      setUser(u)
      try {
        const { data } = await supabase.from('profiles').select('*').eq('id', u.id).single()
        if (data) setProfile(data)
      } catch(e) {}
      setLoading(false)
    })

    supabase.auth.getSession().then(({ data }) => {
      if (!data?.session) {
        clearTimeout(fallback)
        setLoading(false)
      }
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
