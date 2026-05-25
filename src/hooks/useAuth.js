import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Timeout - 5 saniye sonra hala loading ise zorla kapat
    const timeout = setTimeout(() => setLoading(false), 5000)

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) { clearTimeout(timeout); setLoading(false); return }
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else { clearTimeout(timeout); setLoading(false) }
    }).catch(() => { clearTimeout(timeout); setLoading(false) })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) await fetchProfile(session.user.id)
      else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => { subscription.unsubscribe(); clearTimeout(timeout) }
  }, [])

  async function fetchProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, teams(*)')
        .eq('id', userId)
        .single()
      if (!error) setProfile(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function refreshProfile() {
    if (user) await fetchProfile(user.id)
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
