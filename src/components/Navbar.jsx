import { Link, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useState } from 'react'
import toast from 'react-hot-toast'

export default function Navbar() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleLogout() {
    await supabase.auth.signOut()
    toast.success('Çıkış yapıldı.')
    navigate('/login')
  }

  const isActive = (path) => location.pathname === path ? 'active' : ''

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <Link to="/dashboard">
          <span className="nav-logo">⚽</span>
          <span className="nav-title">FC26 LİG</span>
        </Link>
      </div>

      <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
        <Link className={isActive('/dashboard')} to="/dashboard" onClick={() => setMenuOpen(false)}>Ana Sayfa</Link>
        <Link className={isActive('/standings')} to="/standings" onClick={() => setMenuOpen(false)}>Puan Durumu</Link>
        <Link className={isActive('/players')} to="/players" onClick={() => setMenuOpen(false)}>Oyuncular</Link>
        <Link className={isActive('/matches')} to="/matches" onClick={() => setMenuOpen(false)}>Fikstür</Link>
        <Link className={isActive('/contracts')} to="/contracts" onClick={() => setMenuOpen(false)}>Kontratlar</Link>
        {profile?.is_captain && (
          <Link className={isActive('/team/manage')} to="/team/manage" onClick={() => setMenuOpen(false)}>Takımım</Link>
        )}
        {profile?.is_admin && (
          <Link className={`${isActive('/admin')} admin-link`} to="/admin" onClick={() => setMenuOpen(false)}>🛡️ Admin</Link>
        )}
      </div>

      <div className="nav-user">
        <Link to="/profile" className="nav-profile">
          <span className="nav-avatar">{profile?.full_name?.[0]?.toUpperCase()}</span>
          <span className="nav-username">@{profile?.username}</span>
        </Link>
        <button className="nav-logout" onClick={handleLogout} title="Çıkış">⏻</button>
        <button className="nav-burger" onClick={() => setMenuOpen(!menuOpen)}>☰</button>
      </div>
    </nav>
  )
}
