import { useState } from 'react'
import { supabase, POSITIONS, PLATFORMS, PLATFORM_ID_LABELS } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

export default function Profile() {
  const { profile, refreshProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    username: profile?.username || '',
    platform: profile?.platform || 'playstation',
    platform_id: profile?.platform_id || '',
    position: profile?.position || 'ST',
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSave(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.from('profiles')
        .update({ ...form, updated_at: new Date().toISOString() })
        .eq('id', profile.id)
      if (error) throw error
      toast.success('Profil güncellendi!')
      await refreshProfile()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleLeaveTeam() {
    if (!window.confirm('Takımdan ayrılmak istediğinize emin misiniz?')) return
    if (profile.is_captain) {
      toast.error('Kaptan olarak takımdan ayrılamazsınız. Önce kaptanlığı devredin.')
      return
    }
    const { error } = await supabase.from('profiles')
      .update({ team_id: null, is_captain: false }).eq('id', profile.id)
    if (!error) { toast.success('Takımdan ayrıldınız.'); await refreshProfile() }
    else toast.error(error.message)
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>⚙️ Profilim</h1>
      </div>

      <div className="profile-grid">
        <div className="form-card">
          <h2>Profil Bilgileri</h2>
          <form onSubmit={handleSave}>
            <div className="form-group">
              <label>Ad Soyad</label>
              <input type="text" value={form.full_name} onChange={e => set('full_name', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Kullanıcı Adı</label>
              <input type="text" value={form.username}
                onChange={e => set('username', e.target.value.toLowerCase().replace(/\s/g, '_'))} />
            </div>
            <div className="form-group">
              <label>Platform</label>
              <div className="platform-select">
                {PLATFORMS.map(p => (
                  <button type="button" key={p.value}
                    className={`platform-btn ${form.platform === p.value ? 'active' : ''}`}
                    onClick={() => set('platform', p.value)}>
                    {p.icon} {p.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label>{PLATFORM_ID_LABELS[form.platform]}</label>
              <input type="text" value={form.platform_id} onChange={e => set('platform_id', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Pozisyon</label>
              <select value={form.position} onChange={e => set('position', e.target.value)}>
                {POSITIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
            </button>
          </form>
        </div>

        <div>
          <div className="form-card">
            <h2>Takım Bilgisi</h2>
            {profile?.team_id
              ? <div>
                  <p><strong>Takım:</strong> {profile.teams?.name}</p>
                  <p><strong>Rol:</strong> {profile.is_captain ? '© Kaptan' : 'Oyuncu'}</p>
                  {!profile.is_captain && (
                    <button className="btn-danger" onClick={handleLeaveTeam}>Takımdan Ayrıl</button>
                  )}
                </div>
              : <p>Herhangi bir takımda değilsiniz.</p>
            }
          </div>

          <div className="form-card" style={{marginTop:'1rem'}}>
            <h2>İstatistikler</h2>
            <div className="profile-stats">
              <div><strong>{profile?.goals || 0}</strong><small>Gol</small></div>
              <div><strong>{profile?.assists || 0}</strong><small>Asist</small></div>
              <div><strong>{profile?.matches_played || 0}</strong><small>Maç</small></div>
              <div><strong>{profile?.rating || 70}</strong><small>Rating</small></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
