import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'
import { Navigate } from 'react-router-dom'

export default function AdminPanel() {
  const { profile } = useAuth()
  const [tab, setTab] = useState('applications')
  const [applications, setApplications] = useState([])
  const [teams, setTeams] = useState([])
  const [players, setPlayers] = useState([])
  const [matches, setMatches] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [matchForm, setMatchForm] = useState({ home_team_id: '', away_team_id: '', match_date: '', week: '' })
  const [scoreForm, setScoreForm] = useState({})

  if (!profile?.is_admin) return <Navigate to="/dashboard" />

  useEffect(() => {
    fetchAll()
  }, [])

  async function fetchAll() {
    const [apps, teamsData, playersData, matchesData, pCount, tCount, mCount] = await Promise.all([
      supabase.from('team_applications').select('*, profiles(*)').order('created_at', { ascending: false }),
      supabase.from('teams').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*, teams(name)').order('created_at', { ascending: false }),
      supabase.from('matches').select('*, home:home_team_id(name,logo_url), away:away_team_id(name,logo_url)').order('match_date'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('teams').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
      supabase.from('matches').select('*', { count: 'exact', head: true }).eq('status', 'finished'),
    ])
    setApplications(apps.data || [])
    setTeams(teamsData.data || [])
    setPlayers(playersData.data || [])
    setMatches(matchesData.data || [])
    setStats({ players: pCount.count, teams: tCount.count, matches: mCount.count })
    setLoading(false)
  }

  async function handleApplication(id, status, adminNote = '') {
    const { error } = await supabase.from('team_applications')
      .update({ status, admin_note: adminNote, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (!error) { toast.success(status === 'approved' ? 'Takım onaylandı!' : 'Takım reddedildi.'); fetchAll() }
    else toast.error(error.message)
  }

  async function toggleAdmin(playerId, current) {
    const { error } = await supabase.from('profiles').update({ is_admin: !current }).eq('id', playerId)
    if (!error) { toast.success('Admin durumu güncellendi.'); fetchAll() }
    else toast.error(error.message)
  }

  async function createMatch(e) {
    e.preventDefault()
    const { error } = await supabase.from('matches').insert({
      ...matchForm, week: parseInt(matchForm.week), status: 'scheduled'
    })
    if (!error) { toast.success('Maç oluşturuldu!'); setMatchForm({ home_team_id: '', away_team_id: '', match_date: '', week: '' }); fetchAll() }
    else toast.error(error.message)
  }

  async function updateScore(matchId) {
    const s = scoreForm[matchId]
    if (!s) return
    const { error } = await supabase.from('matches')
      .update({ home_score: parseInt(s.home || 0), away_score: parseInt(s.away || 0), status: 'finished' })
      .eq('id', matchId)
    if (!error) { toast.success('Skor güncellendi!'); fetchAll() }
    else toast.error(error.message)
  }

  async function updatePlayerRating(playerId, rating) {
    await supabase.from('profiles').update({ rating: parseInt(rating) }).eq('id', playerId)
  }

  const tabs = [
    { id: 'applications', label: '📋 Takım Talepleri', count: applications.filter(a => a.status === 'pending').length },
    { id: 'teams', label: '🏆 Takımlar' },
    { id: 'matches', label: '⚽ Maçlar' },
    { id: 'players', label: '👤 Oyuncular' },
    { id: 'stats', label: '📊 İstatistikler' },
  ]

  if (loading) return <div className="loading">Yükleniyor...</div>

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1>🛡️ Admin Paneli</h1>
        <div className="admin-stats">
          <span>👥 {stats.players} Oyuncu</span>
          <span>🏆 {stats.teams} Takım</span>
          <span>⚽ {stats.matches} Maç</span>
        </div>
      </div>

      <div className="admin-tabs">
        {tabs.map(t => (
          <button key={t.id} className={`admin-tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}>
            {t.label} {t.count > 0 && <span className="tab-badge">{t.count}</span>}
          </button>
        ))}
      </div>

      {/* TAKIM TALEPLERİ */}
      {tab === 'applications' && (
        <div className="admin-content">
          <h2>Takım Kurma Talepleri</h2>
          {applications.filter(a => a.status === 'pending').length === 0
            ? <p className="empty-state">Bekleyen talep yok.</p>
            : applications.filter(a => a.status === 'pending').map(a => (
              <div key={a.id} className="application-card">
                <div className="app-info">
                  {a.logo_url && <img src={a.logo_url} alt="logo" className="app-logo" />}
                  <div>
                    <h3>{a.team_name}</h3>
                    <p>Başvuran: <strong>{a.profiles?.full_name}</strong> (@{a.profiles?.username})</p>
                    <p>E-posta: {a.profiles?.email}</p>
                    <p>Pozisyon: {a.profiles?.position} · Platform: {a.profiles?.platform}</p>
                    <small>{new Date(a.created_at).toLocaleString('tr-TR')}</small>
                  </div>
                </div>
                <div className="app-actions">
                  <button className="btn-accept" onClick={() => handleApplication(a.id, 'approved')}>✅ Onayla</button>
                  <button className="btn-reject" onClick={() => {
                    const note = prompt('Red sebebi (opsiyonel):')
                    handleApplication(a.id, 'rejected', note || '')
                  }}>❌ Reddet</button>
                </div>
              </div>
            ))
          }

          <h2 style={{marginTop:'2rem'}}>Geçmiş Talepler</h2>
          {applications.filter(a => a.status !== 'pending').map(a => (
            <div key={a.id} className={`application-card past ${a.status}`}>
              <div className="app-info">
                {a.logo_url && <img src={a.logo_url} alt="" className="app-logo" />}
                <div>
                  <h3>{a.team_name} <span className={`badge badge-${a.status}`}>{a.status === 'approved' ? '✅ Onaylandı' : '❌ Reddedildi'}</span></h3>
                  <p>{a.profiles?.full_name} · {new Date(a.created_at).toLocaleDateString('tr-TR')}</p>
                  {a.admin_note && <p><em>Not: {a.admin_note}</em></p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAKIMLAR */}
      {tab === 'teams' && (
        <div className="admin-content">
          <h2>Tüm Takımlar ({teams.length})</h2>
          <table className="admin-table">
            <thead><tr><th>Logo</th><th>Takım</th><th>Durum</th><th>G-B-M</th><th>Puan</th></tr></thead>
            <tbody>
              {teams.map(t => (
                <tr key={t.id}>
                  <td>{t.logo_url ? <img src={t.logo_url} alt="" style={{width:32,height:32,objectFit:'contain'}} /> : '—'}</td>
                  <td><strong>{t.name}</strong></td>
                  <td><span className={`badge badge-${t.status}`}>{t.status}</span></td>
                  <td>{t.wins}-{t.draws}-{t.losses}</td>
                  <td><strong>{t.points}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MAÇLAR */}
      {tab === 'matches' && (
        <div className="admin-content">
          <h2>Maç Oluştur</h2>
          <form onSubmit={createMatch} className="admin-form">
            <div className="form-row">
              <div className="form-group">
                <label>Ev Sahibi</label>
                <select value={matchForm.home_team_id} onChange={e => setMatchForm(f=>({...f,home_team_id:e.target.value}))} required>
                  <option value="">Takım seç</option>
                  {teams.filter(t=>t.status==='approved').map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Deplasman</label>
                <select value={matchForm.away_team_id} onChange={e => setMatchForm(f=>({...f,away_team_id:e.target.value}))} required>
                  <option value="">Takım seç</option>
                  {teams.filter(t=>t.status==='approved').map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Hafta</label>
                <input type="number" min="1" value={matchForm.week} onChange={e=>setMatchForm(f=>({...f,week:e.target.value}))} required />
              </div>
              <div className="form-group">
                <label>Tarih</label>
                <input type="datetime-local" value={matchForm.match_date} onChange={e=>setMatchForm(f=>({...f,match_date:e.target.value}))} />
              </div>
            </div>
            <button type="submit" className="btn-primary">Maç Oluştur</button>
          </form>

          <h2 style={{marginTop:'2rem'}}>Tüm Maçlar</h2>
          <div className="matches-list">
            {matches.map(m => (
              <div key={m.id} className={`match-card admin-match ${m.status}`}>
                <div className="match-teams">
                  <span>{m.home?.name}</span>
                  <span className="match-score">
                    {m.status === 'finished' ? `${m.home_score} - ${m.away_score}` : 'vs'}
                  </span>
                  <span>{m.away?.name}</span>
                </div>
                {m.status !== 'finished' && (
                  <div className="score-input">
                    <input type="number" min="0" placeholder="Ev" style={{width:50}}
                      onChange={e => setScoreForm(f=>({...f,[m.id]:{...f[m.id],home:e.target.value}}))} />
                    <span>-</span>
                    <input type="number" min="0" placeholder="Dep" style={{width:50}}
                      onChange={e => setScoreForm(f=>({...f,[m.id]:{...f[m.id],away:e.target.value}}))} />
                    <button className="btn-primary-sm" onClick={() => updateScore(m.id)}>Kaydet</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* OYUNCULAR */}
      {tab === 'players' && (
        <div className="admin-content">
          <h2>Tüm Oyuncular ({players.length})</h2>
          <table className="admin-table">
            <thead><tr><th>Oyuncu</th><th>Pozisyon</th><th>Takım</th><th>Rating</th><th>Admin</th></tr></thead>
            <tbody>
              {players.map(p => (
                <tr key={p.id}>
                  <td>
                    <strong>{p.full_name}</strong><br/>
                    <small>@{p.username} · {p.email}</small>
                  </td>
                  <td><span className="pos-badge">{p.position}</span></td>
                  <td>{p.teams?.name || <em>Takımsız</em>}</td>
                  <td>
                    <input type="number" min="1" max="99" defaultValue={p.rating}
                      style={{width:55}} className="rating-input"
                      onBlur={e => updatePlayerRating(p.id, e.target.value)} />
                  </td>
                  <td>
                    <button className={`btn-toggle ${p.is_admin ? 'active' : ''}`}
                      onClick={() => toggleAdmin(p.id, p.is_admin)}>
                      {p.is_admin ? '🛡️ Admin' : 'Yap Admin'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* İSTATİSTİKLER */}
      {tab === 'stats' && (
        <div className="admin-content">
          <h2>Lig İstatistikleri</h2>
          <div className="stats-grid">
            <div className="stat-card"><span className="stat-icon">👥</span><span className="stat-num">{stats.players}</span><span className="stat-label">Toplam Oyuncu</span></div>
            <div className="stat-card"><span className="stat-icon">🏆</span><span className="stat-num">{stats.teams}</span><span className="stat-label">Aktif Takım</span></div>
            <div className="stat-card"><span className="stat-icon">⚽</span><span className="stat-num">{stats.matches}</span><span className="stat-label">Oynanan Maç</span></div>
            <div className="stat-card"><span className="stat-icon">📋</span><span className="stat-num">{applications.filter(a=>a.status==='pending').length}</span><span className="stat-label">Bekleyen Talep</span></div>
          </div>
        </div>
      )}
    </div>
  )
}
