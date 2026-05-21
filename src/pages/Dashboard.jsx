import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { POSITIONS, PLATFORMS } from '../../lib/supabase'

export default function Dashboard() {
  const { profile, refreshProfile } = useAuth()
  const [stats, setStats] = useState({ players: 0, teams: 0, matches: 0 })
  const [pendingOffers, setPendingOffers] = useState(0)
  const [recentMatches, setRecentMatches] = useState([])

  useEffect(() => {
    fetchStats()
    if (profile) fetchPendingOffers()
  }, [profile])

  async function fetchStats() {
    const [{ count: players }, { count: teams }, { count: matches }] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('teams').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
      supabase.from('matches').select('*', { count: 'exact', head: true }).eq('status', 'finished'),
    ])
    setStats({ players: players || 0, teams: teams || 0, matches: matches || 0 })
  }

  async function fetchPendingOffers() {
    const { count } = await supabase
      .from('transfer_offers')
      .select('*', { count: 'exact', head: true })
      .eq('to_player_id', profile.id)
      .eq('status', 'pending')
    setPendingOffers(count || 0)
  }

  const pos = POSITIONS.find(p => p.value === profile?.position)
  const plat = PLATFORMS.find(p => p.value === profile?.platform)

  return (
    <div className="dashboard">
      {/* Player Card */}
      <div className="player-hero">
        <div className="player-card-big">
          <div className="card-rating">{profile?.rating || 70}</div>
          <div className="card-pos">{profile?.position}</div>
          <div className="card-avatar">
            {profile?.avatar_url
              ? <img src={profile.avatar_url} alt="avatar" />
              : <div className="avatar-placeholder">{profile?.full_name?.[0]?.toUpperCase()}</div>
            }
          </div>
          <div className="card-name">{profile?.full_name}</div>
          <div className="card-stats-row">
            <span><b>{profile?.goals || 0}</b><small>GOL</small></span>
            <span><b>{profile?.assists || 0}</b><small>ASİST</small></span>
            <span><b>{profile?.matches_played || 0}</b><small>MAÇ</small></span>
          </div>
          <div className="card-meta">
            <span>{plat?.icon} {plat?.label}</span>
            <span>📍 {pos?.label}</span>
          </div>
          {profile?.teams && (
            <div className="card-team">
              {profile.teams.logo_url && <img src={profile.teams.logo_url} alt="team" className="team-badge-sm" />}
              <span>{profile.teams.name}</span>
              {profile?.is_captain && <span className="captain-badge">©</span>}
            </div>
          )}
        </div>

        <div className="hero-info">
          <h2>Hoş Geldin, <span>{profile?.username}</span></h2>
          {!profile?.team_id ? (
            <div className="no-team-notice">
              <p>Henüz bir takımda değilsiniz.</p>
              <Link to="/team/create" className="btn-primary">⚽ Takım Kur</Link>
              <p className="hint">veya bir kaptanın transfer teklifini bekleyin</p>
            </div>
          ) : (
            <div className="team-notice">
              <p>Takımınız: <strong>{profile.teams?.name}</strong></p>
              {profile.is_captain && <Link to="/team/manage" className="btn-secondary">Takımı Yönet</Link>}
              <Link to="/team/squad" className="btn-secondary">Kadroyu Gör</Link>
            </div>
          )}

          {pendingOffers > 0 && (
            <Link to="/contracts" className="notification-badge">
              📨 {pendingOffers} bekleyen transfer teklifi
            </Link>
          )}
        </div>
      </div>

      {/* League Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-icon">👥</span>
          <span className="stat-num">{stats.players}</span>
          <span className="stat-label">Kayıtlı Oyuncu</span>
        </div>
        <div className="stat-card">
          <span className="stat-icon">🏆</span>
          <span className="stat-num">{stats.teams}</span>
          <span className="stat-label">Aktif Takım</span>
        </div>
        <div className="stat-card">
          <span className="stat-icon">⚽</span>
          <span className="stat-num">{stats.matches}</span>
          <span className="stat-label">Oynanan Maç</span>
        </div>
      </div>

      {/* Quick Links */}
      <div className="quick-links">
        <Link to="/standings" className="quick-link">📊 Puan Durumu</Link>
        <Link to="/players" className="quick-link">👤 Oyuncular</Link>
        <Link to="/matches" className="quick-link">📅 Fikstür</Link>
        <Link to="/contracts" className="quick-link">📋 Kontratlarım</Link>
        <Link to="/profile" className="quick-link">⚙️ Profilim</Link>
      </div>
    </div>
  )
}
