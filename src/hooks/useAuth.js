import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function init() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!mounted) return
        
        if (session?.user) {
          setUser(session.user)
          await loadProfile(session.user.id, mounted)
        }
      } catch(e) {
        console.error(e)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return
      if (event === 'SIGNED_OUT') {
        setUser(null)
        setProfile(null)
        setLoading(false)
        return
      }
      if (session?.user) {
        setUser(session.user)
        await loadProfile(session.user.id, mounted)
      }
      setLoading(false)
    })

    return () => { mounted = false; subscription.unsubscribe() }
  }, [])

  async function loadProfile(userId, mounted = true) {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*, teams(*)')
        .eq('id', userId)
        .single()
      if (mounted && data) setProfile(data)
    } catch(e) {
      // teams join olmadan tekrar dene
      try {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()
        if (mounted && data) setProfile(data)
      } catch(e2) { console.error(e2) }
    }
  }

  async function refreshProfile() {
    if (user?.id) await loadProfile(user.id)
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

