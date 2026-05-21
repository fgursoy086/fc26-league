import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

export default function Login() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      })
      if (error) throw error
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.message === 'Invalid login credentials' ? 'E-posta veya şifre hatalı!' : err.message)
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
          <p>Hesabına Giriş Yap</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>E-posta Adresi</label>
            <input type="email" placeholder="ornek@mail.com" value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label>Şifre</label>
            <input type="password" placeholder="••••••••" value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
          </div>

          <div className="forgot-password">
            <Link to="/forgot-password">Şifremi Unuttum</Link>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>

        <p className="auth-footer">
          Hesabın yok mu? <Link to="/register">Kayıt Ol</Link>
        </p>
      </div>
    </div>
  )
}
