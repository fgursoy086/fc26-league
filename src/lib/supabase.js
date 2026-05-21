import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

export const POSITIONS = [
  { value: 'GK', label: 'Kaleci (GK)' },
  { value: 'CB', label: 'Stoper (CB)' },
  { value: 'LB', label: 'Sol Bek (LB)' },
  { value: 'RB', label: 'Sağ Bek (RB)' },
  { value: 'CDM', label: 'Defansif Orta Saha (CDM)' },
  { value: 'CM', label: 'Orta Saha (CM)' },
  { value: 'CAM', label: 'Ofansif Orta Saha (CAM)' },
  { value: 'LW', label: 'Sol Kanat (LW)' },
  { value: 'RW', label: 'Sağ Kanat (RW)' },
  { value: 'CF', label: 'Santrafor (CF)' },
  { value: 'ST', label: 'Forvet (ST)' },
]

export const PLATFORMS = [
  { value: 'playstation', label: 'PlayStation', icon: '🎮' },
  { value: 'xbox', label: 'Xbox', icon: '🟢' },
  { value: 'origin', label: 'EA App / Origin', icon: '🟠' },
]

export const PLATFORM_ID_LABELS = {
  playstation: 'PSN ID',
  xbox: 'Xbox Gamertag',
  origin: 'EA/Origin ID',
}
