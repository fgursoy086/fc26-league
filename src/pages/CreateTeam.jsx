import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

export default function CreateTeam() {
  const { profile, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [teamName, setTeamName] = useState('')
  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)

  function handleLogo(e) {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) return toast.error('Logo en fazla 2MB olabilir!')
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!teamName.trim()) return toast.error('Takım adı boş olamaz!')
    if (profile?.team_id) return toast.error('Zaten bir takımdasınız!')

    setLoading(true)
    try {
      let logo_url = null

      if (logoFile) {
        const ext = logoFile.name.split('.').pop()
        const fileName = `${Date.now()}_${profile.id}.${ext}`
        const { error: uploadErr } = await supabase.storage
          .from('team-logos')
          .upload(fileName, logoFile)
        if (uploadErr) throw uploadErr
        const { data } = supabase.storage.from('team-logos').getPublicUrl(fileName)
        logo_url = data.publicUrl
      }

      const { error } = await supabase.from('team_applications').insert({
        applicant_id: profile.id,
        team_name: teamName.trim(),
        logo_url,
        status: 'pending'
      })
      if (error) throw error

      toast.success('Takım talebiniz gönderildi! Admin onayı bekleniyor.')
      await refreshProfile()
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (profile?.team_id) {
    return (
      <div className="page-container">
        <div className="info-card">
          <h2>⚠️ Zaten bir takımdasınız</h2>
          <p>Yeni takım kurabilmek için önce mevcut takımınızdan ayrılmanız gerekiyor.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>⚽ Takım Kur</h1>
        <p>Takım talebiniz admin tarafından incelendikten sonra onaylanacak.</p>
      </div>

      <div className="form-card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Takım Adı</label>
            <input type="text" placeholder="Takım adı girin" value={teamName}
              onChange={e => setTeamName(e.target.value)} maxLength={30} required />
          </div>

          <div className="form-group">
            <label>Takım Logosu</label>
            <div className="logo-upload" onClick={() => document.getElementById('logo-input').click()}>
              {logoPreview
                ? <img src={logoPreview} alt="logo preview" className="logo-preview" />
                : <div className="upload-placeholder">
                    <span>🖼️</span>
                    <p>Logo yüklemek için tıklayın</p>
                    <small>PNG, JPG - Max 2MB</small>
                  </div>
              }
            </div>
            <input id="logo-input" type="file" accept="image/*" onChange={handleLogo} style={{ display: 'none' }} />
          </div>

          <div className="info-box">
            <p>📋 Takım talebiniz admin tarafından onaylandıktan sonra kaptan olarak atanacaksınız.</p>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Gönderiliyor...' : 'Takım Talebini Gönder'}
          </button>
        </form>
      </div>
    </div>
  )
}
