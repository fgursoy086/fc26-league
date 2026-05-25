import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase, POSITIONS, PLATFORMS } from '../lib/supabase'

export function Standings() {
  const [teams, setTeams] = useState([])
  const [topScorers, setTopScorers] = useState([])

  useEffect(() => {
    supabase.from('teams').select('*').eq('status', 'approved')
      .order('points', { ascending: false }).order('goals_for', { ascending: false })
      .then(({ data }) => setTeams(data || []))

    supabase.from('profiles').select('*, teams(name, logo_url)')
      .gt('goals', 0).order('goals', { ascending: false }).limit(10)
      .then(({ data }) => setTopScorers(data || []))
  }, [])

  return (
    <div className="page-container">
      <div className="page-header"><h1>📊 Puan Durumu</h1></div>

      <div className="standings-grid">
        <div>
          <table className="standings-table">
            <thead>
              <tr>
                <th>#</th><th>Takım</th><th>O</th><th>G</th><th>B</th><th>M</th>
                <th>AG</th><th>YG</th><th>AV</th><th>P</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((t, i) => (
                <tr key={t.id} className={i < 3 ? 'top-three' : ''}>
                  <td><strong>{i + 1}</strong></td>
                  <td>
                    <Link to={`/team/${t.id}`} className="team-name-link">
                      {t.logo_url && <img src={t.logo_url} alt="" className="table-logo" />}
                      {t.name}
                    </Link>
                  </td>
                  <td>{t.wins + t.draws + t.losses}</td>
                  <td>{t.wins}</td>
                  <td>{t.draws}</td>
                  <td>{t.losses}</td>
                  <td>{t.goals_for}</td>
                  <td>{t.goals_against}</td>
                  <td>{t.goals_for - t.goals_against}</td>
                  <td><strong>{t.points}</strong></td>
                </tr>
              ))}
              {teams.length === 0 && (
                <tr><td colSpan={10} className="empty-td">Henüz onaylanan takım yok.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div>
          <h2>⚽ Gol Krallığı</h2>
          <div className="scorers-list">
            {topScorers.map((p, i) => (
              <div key={p.id} className="scorer-row">
                <span className={`scorer-rank ${i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : ''}`}>{i + 1}</span>
                <div className="scorer-info">
                  <strong>{p.full_name}</strong>
                  <small>{p.teams?.name || 'Takımsız'} · {p.position}</small>
                </div>
                <span className="scorer-goals">{p.goals} ⚽</span>
              </div>
            ))}
            {topScorers.length === 0 && <p className="empty-state">Henüz gol atılmadı.</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

export function Players() {
  const [players, setPlayers] = useState([])
  const [filter, setFilter] = useState({ pos: 'ALL', platform: 'ALL', search: '' })

  useEffect(() => {
    supabase.from('profiles').select('*, teams(name, logo_url)')
      .order('rating', { ascending: false })
      .then(({ data }) => setPlayers(data || []))
  }, [])

  const filtered = players.filter(p => {
    const matchPos = filter.pos === 'ALL' || p.position === filter.pos
    const matchPlat = filter.platform === 'ALL' || p.platform === filter.platform
    const matchSearch = !filter.search ||
      p.full_name?.toLowerCase().includes(filter.search.toLowerCase()) ||
      p.username?.toLowerCase().includes(filter.search.toLowerCase())
    return matchPos && matchPlat && matchSearch
  })

  return (
    <div className="page-container">
      <div className="page-header"><h1>👤 Oyuncular</h1></div>

      <div className="filter-bar">
        <input className="search-input" type="text" placeholder="Oyuncu ara..."
          value={filter.search} onChange={e => setFilter(f => ({ ...f, search: e.target.value }))} />
        <select value={filter.pos} onChange={e => setFilter(f => ({ ...f, pos: e.target.value }))}>
          <option value="ALL">Tüm Pozisyonlar</option>
          {POSITIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
        <select value={filter.platform} onChange={e => setFilter(f => ({ ...f, platform: e.target.value }))}>
          <option value="ALL">Tüm Platformlar</option>
          {PLATFORMS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
      </div>

      <div className="players-grid">
        {filtered.map(p => {
          const plat = PLATFORMS.find(pl => pl.value === p.platform)
          return (
            <div key={p.id} className="player-mini-card">
              <div className="mini-card-header">
                <span className="mini-rating">{p.rating}</span>
                <span className="mini-pos">{p.position}</span>
              </div>
              <div className="mini-avatar">{p.full_name?.[0]?.toUpperCase()}</div>
              <div className="mini-name">{p.full_name}</div>
              <div className="mini-username">@{p.username}</div>
              <div className="mini-platform">{plat?.icon} {plat?.label}</div>
              {p.teams
                ? <div className="mini-team">
                    {p.teams.logo_url && <img src={p.teams.logo_url} alt="" className="mini-team-logo" />}
                    {p.teams.name}
                  </div>
                : <div className="mini-team free">Takımsız</div>
              }
            </div>
          )
        })}
      </div>
      {filtered.length === 0 && <p className="empty-state">Oyuncu bulunamadı.</p>}
    </div>
  )
}

export function Matches() {
  const [matches, setMatches] = useState([])
  const [week, setWeek] = useState('ALL')
  const [weeks, setWeeks] = useState([])

  useEffect(() => {
    supabase.from('matches')
      .select('*, home:home_team_id(name, logo_url), away:away_team_id(name, logo_url)')
      .order('match_date', { ascending: true })
      .then(({ data }) => {
        setMatches(data || [])
        const ws = [...new Set((data || []).map(m => m.week).filter(Boolean))]
        setWeeks(ws.sort())
      })
  }, [])

  const filtered = week === 'ALL' ? matches : matches.filter(m => m.week === parseInt(week))

  return (
    <div className="page-container">
      <div className="page-header"><h1>📅 Fikstür & Sonuçlar</h1></div>

      <div className="filter-bar">
        <select value={week} onChange={e => setWeek(e.target.value)}>
          <option value="ALL">Tüm Haftalar</option>
          {weeks.map(w => <option key={w} value={w}>{w}. Hafta</option>)}
        </select>
      </div>

      <div className="matches-list">
        {filtered.map(m => (
          <div key={m.id} className={`match-card ${m.status}`}>
            <div className="match-week">
              {m.week ? `${m.week}. Hafta` : ''}
              <span className={`match-status status-${m.status}`}>
                {m.status === 'finished' ? 'Tamamlandı' : m.status === 'live' ? '🔴 Canlı' : 'Planlandı'}
              </span>
            </div>
            <div className="match-teams">
              <div className="match-team">
                {m.home?.logo_url && <img src={m.home.logo_url} alt="" className="table-logo" />}
                <span>{m.home?.name}</span>
              </div>
              <div className="match-score">
                {m.status === 'finished' || m.status === 'live'
                  ? <span>{m.home_score} - {m.away_score}</span>
                  : <span>{m.match_date ? new Date(m.match_date).toLocaleDateString('tr-TR') : 'TBD'}</span>
                }
              </div>
              <div className="match-team right">
                <span>{m.away?.name}</span>
                {m.away?.logo_url && <img src={m.away.logo_url} alt="" className="table-logo" />}
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="empty-state">Maç bulunamadı.</p>}
      </div>
    </div>
  )
}
