import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase, POSITIONS, PLATFORMS, PLATFORM_ID_LABELS } from '../../lib/supabase'
import toast from 'react-hot-toast'

export default function Register() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    full_name: '', username: '', email: '', password: '', confirm_password: '',
    platform: 'playstation', platform_id: '', position: 'ST'
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (form.password !== form.confirm_password) return toast.error('Şifreler eşleşmiyor!')
    if (form.password.length < 6) return toast.error('Şifre en az 6 karakter olmalı!')
    if (form.username.length < 3) return toast.error('Kullanıcı adı en az 3 karakter olmalı!')

    setLoading(true)
    try {
      const { error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: form.full_name,
            username: form.username,
            platform: form.platform,
            platform_id: form.platform_id,
            position: form.position,
          },
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      })
      if (error) throw error
      toast.success('Kayıt başarılı! E-posta adresinizi onaylayın.')
      navigate('/login')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <span className="logo-icon">⚽</span>
          <h1>FC26 LİG</h1>
          <p>Hesap Oluştur</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-row">
            <div className="form-group">
              <label>Ad Soyad</label>
              <input type="text" placeholder="Adınız Soyadınız" value={form.full_name}
                onChange={e => set('full_name', e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Kullanıcı Adı</label>
              <input type="text" placeholder="kullanici_adi" value={form.username}
                onChange={e => set('username', e.target.value.toLowerCase().replace(/\s/g, '_'))} required />
            </div>
          </div>

          <div className="form-group">
            <label>E-posta Adresi</label>
            <input type="email" placeholder="ornek@mail.com" value={form.email}
              onChange={e => set('email', e.target.value)} required />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Şifre</label>
              <input type="password" placeholder="••••••••" value={form.password}
                onChange={e => set('password', e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Şifre Tekrar</label>
              <input type="password" placeholder="••••••••" value={form.confirm_password}
                onChange={e => set('confirm_password', e.target.value)} required />
            </div>
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
            <input type="text" placeholder={`${PLATFORM_ID_LABELS[form.platform]} giriniz`}
              value={form.platform_id} onChange={e => set('platform_id', e.target.value)} required />
          </div>

          <div className="form-group">
            <label>Oynadığınız Pozisyon</label>
            <select value={form.position} onChange={e => set('position', e.target.value)}>
              {POSITIONS.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Kayıt Yapılıyor...' : 'Kayıt Ol'}
          </button>
        </form>

        <p className="auth-footer">
          Zaten hesabın var mı? <Link to="/login">Giriş Yap</Link>
        </p>
      </div>
    </div>
  )
}
