import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

export default function Contracts() {
  const { profile, refreshProfile } = useAuth()
  const [offers, setOffers] = useState([])
  const [sentOffers, setSentOffers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (profile) fetchOffers() }, [profile])

  async function fetchOffers() {
    const [incoming, sent] = await Promise.all([
      supabase.from('transfer_offers')
        .select('*, teams(*), profiles!transfer_offers_from_captain_id_fkey(*)')
        .eq('to_player_id', profile.id)
        .order('created_at', { ascending: false }),
      profile.is_captain
        ? supabase.from('transfer_offers')
          .select('*, profiles!transfer_offers_to_player_id_fkey(*)')
          .eq('from_captain_id', profile.id)
          .order('created_at', { ascending: false })
        : { data: [] }
    ])
    setOffers(incoming.data || [])
    setSentOffers(sent.data || [])
    setLoading(false)
  }

  async function respond(offerId, status) {
    try {
      const { error } = await supabase.from('transfer_offers')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', offerId)
      if (error) throw error
      toast.success(status === 'accepted' ? 'Teklif kabul edildi! Takıma katıldınız.' : 'Teklif reddedildi.')
      await refreshProfile()
      fetchOffers()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const statusBadge = (s) => {
    const map = { pending: ['⏳', 'Bekliyor', 'badge-pending'], accepted: ['✅', 'Kabul Edildi', 'badge-accepted'], rejected: ['❌', 'Reddedildi', 'badge-rejected'] }
    const [icon, text, cls] = map[s] || ['?', s, '']
    return <span className={`badge ${cls}`}>{icon} {text}</span>
  }

  if (loading) return <div className="loading">Yükleniyor...</div>

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>📋 Kontratlarım</h1>
        <p>Transfer tekliflerinizi buradan yönetebilirsiniz.</p>
      </div>

      {/* Gelen teklifler */}
      <section className="contracts-section">
        <h2>📨 Gelen Transfer Teklifleri</h2>
        {offers.length === 0
          ? <p className="empty-state">Henüz gelen transfer teklifi yok.</p>
          : <div className="offers-list">
              {offers.map(o => (
                <div key={o.id} className={`offer-card ${o.status}`}>
                  <div className="offer-info">
                    <div className="offer-team">
                      {o.teams?.logo_url && <img src={o.teams.logo_url} alt="logo" className="team-badge-sm" />}
                      <div>
                        <strong>{o.teams?.name}</strong>
                        <small>Kaptan: {o.profiles?.full_name}</small>
                      </div>
                    </div>
                    <div className="offer-meta">
                      {statusBadge(o.status)}
                      <span className="offer-date">
                        {new Date(o.created_at).toLocaleDateString('tr-TR')}
                      </span>
                    </div>
                  </div>

                  {o.status === 'pending' && !profile?.team_id && (
                    <div className="offer-actions">
                      <button className="btn-accept" onClick={() => respond(o.id, 'accepted')}>✅ Kabul Et</button>
                      <button className="btn-reject" onClick={() => respond(o.id, 'rejected')}>❌ Reddet</button>
                    </div>
                  )}
                  {o.status === 'pending' && profile?.team_id && (
                    <p className="hint">Teklifi kabul edebilmek için önce mevcut takımınızdan ayrılmanız gerekiyor.</p>
                  )}
                </div>
              ))}
            </div>
        }
      </section>

      {/* Kaptan için gönderilen teklifler */}
      {profile?.is_captain && (
        <section className="contracts-section">
          <h2>📤 Gönderilen Transfer Teklifleri</h2>
          {sentOffers.length === 0
            ? <p className="empty-state">Henüz gönderilen transfer teklifi yok.</p>
            : <div className="offers-list">
                {sentOffers.map(o => (
                  <div key={o.id} className={`offer-card ${o.status}`}>
                    <div className="offer-info">
                      <div className="offer-team">
                        <div>
                          <strong>{o.profiles?.full_name}</strong>
                          <small>@{o.profiles?.username} · {o.profiles?.position}</small>
                        </div>
                      </div>
                      <div className="offer-meta">
                        {statusBadge(o.status)}
                        <span className="offer-date">
                          {new Date(o.created_at).toLocaleDateString('tr-TR')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
          }
        </section>
      )}
    </div>
  )
}
