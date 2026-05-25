import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) throw error
      setSent(true)
      toast.success('Şifre sıfırlama linki e-postanıza gönderildi!')
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
          <span className="logo-icon">🔑</span>
          <h1>Şifremi Unuttum</h1>
          <p>E-postanıza sıfırlama linki gönderilecek</p>
        </div>

        {sent ? (
          <div className="success-message">
            <p>✅ E-posta gönderildi! Gelen kutunuzu kontrol edin.</p>
            <Link to="/login" className="btn-primary" style={{display:'block',textAlign:'center',marginTop:'1rem'}}>Giriş Sayfasına Dön</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>E-posta Adresi</label>
              <input type="email" placeholder="ornek@mail.com" value={email}
                onChange={e => setEmail(e.target.value)} required />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Gönderiliyor...' : 'Sıfırlama Linki Gönder'}
            </button>
          </form>
        )}

        <p className="auth-footer"><Link to="/login">← Giriş Sayfasına Dön</Link></p>
      </div>
    </div>
  )
}

export function ResetPassword() {
  const [form, setForm] = useState({ password: '', confirm: '' })
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (form.password !== form.confirm) return toast.error('Şifreler eşleşmiyor!')
    if (form.password.length < 6) return toast.error('Şifre en az 6 karakter olmalı!')
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: form.password })
      if (error) throw error
      toast.success('Şifreniz başarıyla güncellendi!')
      window.location.href = '/dashboard'
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
          <span className="logo-icon">🔐</span>
          <h1>Yeni Şifre</h1>
          <p>Yeni şifrenizi belirleyin</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Yeni Şifre</label>
            <input type="password" placeholder="••••••••" value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label>Şifre Tekrar</label>
            <input type="password" placeholder="••••••••" value={form.confirm}
              onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))} required />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
          </button>
        </form>
      </div>
    </div>
  )
}
