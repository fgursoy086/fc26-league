import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 8000)

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) { clearTimeout(timeout); setLoading(false); return }
      const u = session?.user ?? null
      setUser(u)
      if (u) fetchProfile(u.id)
      else { clearTimeout(timeout); setLoading(false) }
    }).catch(() => { clearTimeout(timeout); setLoading(false) })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) {
        // SIGNED_IN veya TOKEN_REFRESHED olduğunda profili çek
        // E-posta onayı sonrası da profil yoksa oluştur
        await fetchProfile(u.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => { subscription.unsubscribe(); clearTimeout(timeout) }
  }, [])

  async function fetchProfile(userId) {
    try {
      // Profili çek
      let { data, error } = await supabase
        .from('profiles')
        .select('*, teams(*)')
        .eq('id', userId)
        .single()

      if (error || !data) {
        // Join olmadan tekrar dene
        const res2 = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()
        data = res2.data
        error = res2.error
      }

      // Hâlâ profil yoksa (trigger çalışmamış olabilir) — manuel oluştur
      if (!data) {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (authUser) {
          const meta = authUser.user_metadata || {}
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: authUser.id,
              email: authUser.email,
              full_name: meta.full_name || '',
              username: meta.username || authUser.email.split('@')[0],
              platform: meta.platform || 'playstation',
              platform_id: meta.platform_id || '',
              position: meta.position || 'ST',
            })
            .select()
            .single()

          if (!insertError && newProfile) {
            setProfile(newProfile)
            return
          }
        }
      }

      if (data) setProfile(data)
    } catch (e) {
      console.error('fetchProfile error:', e)
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
