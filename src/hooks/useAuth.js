import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  async function loadProfile(u) {
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', u.id).single()
      if (data) setProfile(data)
    } catch(e) {}
  }

  useEffect(() => {
    // Her durumda 4 saniye sonra loading'i kapat
    const fallback = setTimeout(() => setLoading(false), 4000)

    // Önce mevcut oturumu kontrol et
    supabase.auth.getSession().then(async ({ data }) => {
      const u = data?.session?.user
      if (u) {
        setUser(u)
        await loadProfile(u)
      }
      clearTimeout(fallback)
      setLoading(false)
    }).catch(() => {
      clearTimeout(fallback)
      setLoading(false)
    })

    // Sonra değişiklikleri dinle (giriş/çıkış)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user)
        await loadProfile(session.user)
        setLoading(false)
      }
      if (event === 'SIGNED_OUT') {
        setUser(null)
        setProfile(null)
        setLoading(false)
      }
    })

    return () => { subscription.unsubscribe(); clearTimeout(fallback) }
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
