import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase, POSITIONS, PLATFORMS } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

export function SquadPage() {
  const { profile } = useAuth()
  const { teamId } = useParams()
  const tid = teamId || profile?.team_id
  const [team, setTeam] = useState(null)
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (tid) fetchTeam() }, [tid])

  async function fetchTeam() {
    const [{ data: teamData }, { data: playersData }] = await Promise.all([
      supabase.from('teams').select('*, profiles!teams_captain_id_fkey(*)').eq('id', tid).single(),
      supabase.from('profiles').select('*').eq('team_id', tid)
    ])
    setTeam(teamData)
    setPlayers(playersData || [])
    setLoading(false)
  }

  if (loading) return <div className="loading">Yükleniyor...</div>
  if (!team) return <div className="page-container"><p>Takım bulunamadı.</p></div>

  const grouped = POSITIONS.reduce((acc, p) => {
    acc[p.value] = players.filter(pl => pl.position === p.value)
    return acc
  }, {})

  return (
    <div className="page-container">
      <div className="team-header">
        {team.logo_url && <img src={team.logo_url} alt="logo" className="team-logo-big" />}
        <div>
          <h1>{team.name}</h1>
          <p>Kaptan: {team.profiles?.full_name || team.profiles?.username}</p>
          <div className="team-record">
            <span className="w">{team.wins}G</span>
            <span className="d">{team.draws}B</span>
            <span className="l">{team.losses}M</span>
            <span>{team.goals_for}-{team.goals_against}</span>
            <span className="pts">{team.points} Puan</span>
          </div>
        </div>
      </div>

      <div className="squad-grid">
        <div className="pitch-view">
          {['GK','CB','LB','RB','CDM','CM','CAM','LW','RW','CF','ST'].map(pos => (
            grouped[pos]?.length > 0 && (
              <div key={pos} className="position-row">
                <span className="pos-label">{pos}</span>
                {grouped[pos].map(p => (
                  <div key={p.id} className="player-chip">
                    <span className="chip-rating">{p.rating}</span>
                    <span className="chip-name">{p.username}</span>
                    {p.is_captain && <span className="cap-icon">©</span>}
                  </div>
                ))}
              </div>
            )
          ))}
        </div>

        <div className="squad-list">
          <h3>Kadro Listesi ({players.length} Oyuncu)</h3>
          <table className="squad-table">
            <thead>
              <tr><th>#</th><th>Oyuncu</th><th>Pos</th><th>Platform</th><th>Gol</th><th>Asist</th><th>Maç</th></tr>
            </thead>
            <tbody>
              {players.map((p, i) => {
                const plat = PLATFORMS.find(pl => pl.value === p.platform)
                return (
                  <tr key={p.id}>
                    <td>{i + 1}</td>
                    <td>
                      <strong>{p.full_name}</strong>
                      <small> @{p.username}</small>
                      {p.is_captain && <span className="captain-badge">©</span>}
                    </td>
                    <td><span className="pos-badge">{p.position}</span></td>
                    <td>{plat?.icon} {p.platform_id}</td>
                    <td>{p.goals}</td>
                    <td>{p.assists}</td>
                    <td>{p.matches_played}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export function ManageTeam() {
  const { profile, refreshProfile } = useAuth()
  const [players, setPlayers] = useState([])
  const [allPlayers, setAllPlayers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (profile?.is_captain) {
      fetchMySquad()
      fetchFreePlayers()
    }
  }, [profile])

  async function fetchMySquad() {
    const { data } = await supabase.from('profiles').select('*').eq('team_id', profile.team_id)
    setPlayers(data || [])
  }

  async function fetchFreePlayers() {
    const { data } = await supabase.from('profiles').select('*').is('team_id', null)
    setAllPlayers(data || [])
  }

  async function sendTransferOffer(toPlayerId) {
    try {
      const { error } = await supabase.from('transfer_offers').insert({
        from_team_id: profile.team_id,
        to_player_id: toPlayerId,
        from_captain_id: profile.id,
        status: 'pending'
      })
      if (error) throw error
      toast.success('Transfer teklifi gönderildi!')
    } catch (err) {
      toast.error(err.message.includes('duplicate') ? 'Bu oyuncuya zaten teklif gönderildi!' : err.message)
    }
  }

  async function removePlayer(playerId) {
    if (!window.confirm('Oyuncuyu takımdan çıkarmak istediğinize emin misiniz?')) return
    const { error } = await supabase.from('profiles').update({ team_id: null, is_captain: false }).eq('id', playerId)
    if (!error) { toast.success('Oyuncu takımdan çıkarıldı.'); fetchMySquad() }
    else toast.error(error.message)
  }

  const filtered = allPlayers.filter(p =>
    p.id !== profile?.id &&
    (p.username?.toLowerCase().includes(search.toLowerCase()) ||
     p.full_name?.toLowerCase().includes(search.toLowerCase()))
  )

  if (!profile?.is_captain) return (
    <div className="page-container">
      <div className="info-card"><p>Bu sayfaya sadece takım kaptanları erişebilir.</p></div>
    </div>
  )

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>🏆 Takım Yönetimi</h1>
        <p>Kadronuzu yönetin ve transfer teklifleri gönderin.</p>
      </div>

      <div className="manage-grid">
        <div>
          <h2>Mevcut Kadro ({players.length})</h2>
          <div className="squad-cards">
            {players.map(p => (
              <div key={p.id} className="squad-card">
                <div className="squad-card-info">
                  <strong>{p.full_name}</strong>
                  <small>@{p.username} · {p.position}</small>
                </div>
                {!p.is_captain && (
                  <button className="btn-danger-sm" onClick={() => removePlayer(p.id)}>Çıkar</button>
                )}
                {p.is_captain && <span className="captain-badge">Kaptan ©</span>}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2>Takımsız Oyuncular</h2>
          <input className="search-input" type="text" placeholder="Oyuncu ara..."
            value={search} onChange={e => setSearch(e.target.value)} />
          <div className="player-search-list">
            {filtered.map(p => (
              <div key={p.id} className="player-search-card">
                <div>
                  <strong>{p.full_name}</strong>
                  <small>@{p.username} · <span className="pos-badge">{p.position}</span></small>
                </div>
                <button className="btn-offer" onClick={() => sendTransferOffer(p.id)}>
                  📨 Teklif Gönder
                </button>
              </div>
            ))}
            {filtered.length === 0 && <p className="empty-state">Takımsız oyuncu bulunamadı.</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
