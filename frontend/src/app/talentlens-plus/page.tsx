'use client'
import { useEffect, useState, useMemo } from 'react'
import { supabase, PlayerWithStats } from '../../lib/supabase'
import {
  goalThreatScore, creativeOutputRating, defensiveImpactScore,
  progressiveBallCarrier, talentLensScore, formatValue
} from '../../lib/metrics'

const METRICS = [
  {
    key: 'tls',
    label: 'TL Score',
    fullLabel: 'TalentLens Score',
    desc: 'Positionsgewichteter Gesamtscore. Kombiniert alle vier Metriken basierend auf Spielerrolle.',
    fn: talentLensScore,
    color: '#00FF87',
  },
  {
    key: 'gts',
    label: 'GTS',
    fullLabel: 'Goal Threat Score',
    desc: 'Wie NBA True Shooting% — kombiniert xG/90, Shot Accuracy und Conversion Rate. Misst die echte Torraumgefahr.',
    fn: goalThreatScore,
    color: '#FF6B6B',
  },
  {
    key: 'cor',
    label: 'COR',
    fullLabel: 'Creative Output Rating',
    desc: 'Chance-Creation aus xA/90, Key Passes und Big Chances Created. Wer kreiert wirklich?',
    fn: creativeOutputRating,
    color: '#60A5FA',
  },
  {
    key: 'dis',
    label: 'DIS',
    fullLabel: 'Defensive Impact Score',
    desc: 'Tackles Won + Interceptions + Clearances + Ball Recoveries per 90. Defensiver Gesamtbeitrag.',
    fn: defensiveImpactScore,
    color: '#FBBF24',
  },
  {
    key: 'pbc',
    label: 'PBC',
    fullLabel: 'Progressive Ball Carrier',
    desc: 'Dribbles + Final Third Passes per 90. Wer trägt den Ball nach vorne?',
    fn: progressiveBallCarrier,
    color: '#A78BFA',
  },
]

const POSITIONS = ['Alle', 'F', 'M', 'D']

export default function TalentLensPlus() {
  const [players, setPlayers] = useState<PlayerWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [activeMetric, setActiveMetric] = useState('tls')
  const [posFilter, setPosFilter] = useState('Alle')
  const [minMinutes, setMinMinutes] = useState(270)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('players')
        .select('*, player_stats(*)')
        .eq('league', 'Bundesliga')
      if (data) {
        setPlayers(data.map((p: any) => ({ ...p, ...(p.player_stats?.[0] ?? {}) })))
      }
      setLoading(false)
    }
    load()
  }, [])

  const metric = METRICS.find(m => m.key === activeMetric)!

  const ranked = useMemo(() => {
    return players
      .filter(p => posFilter === 'Alle' || p.position === posFilter)
      .filter(p => p.position !== 'G')
      .filter(p => (p.minutes_played ?? 0) >= minMinutes)
      .map(p => ({
        ...p,
        score: metric.fn(p),
        gts: goalThreatScore(p),
        cor: creativeOutputRating(p),
        dis: defensiveImpactScore(p),
        pbc: progressiveBallCarrier(p),
        tls: talentLensScore(p),
      }))
      .filter(p => p.score !== null && p.score > 0)
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
  }, [players, activeMetric, posFilter, minMinutes, metric])

  const maxScore = ranked[0]?.score ?? 100

  if (loading) return <LoadingState />

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <p className="section-label">Modul 03</p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '2.2rem', letterSpacing: '0.02em', color: '#fff' }}>
          TALENTLENS<span style={{ color: 'var(--accent-green)' }}>+</span>
        </h1>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', marginTop: '4px' }}>
          Proprietäre Composite Metrics · NBA-Methodik für Fussball
        </p>
      </div>

      {/* Metric selector */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {METRICS.map(m => (
          <button
            key={m.key}
            onClick={() => setActiveMetric(m.key)}
            style={{
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.8rem',
              letterSpacing: '0.08em', padding: '8px 20px', borderRadius: '4px',
              border: `1px solid ${activeMetric === m.key ? m.color : 'rgba(255,255,255,0.08)'}`,
              background: activeMetric === m.key ? `${m.color}18` : 'transparent',
              color: activeMetric === m.key ? m.color : 'rgba(255,255,255,0.4)',
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Active metric info */}
      <div className="tl-card" style={{ padding: '20px', marginBottom: '20px', borderColor: `${metric.color}30`, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, ${metric.color}, transparent)` }} />
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.2rem', color: metric.color, letterSpacing: '0.05em' }}>
              {metric.fullLabel}
            </h2>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', marginTop: '6px', maxWidth: '600px', lineHeight: 1.6 }}>
              {metric.desc}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <select className="tl-input" style={{ width: '110px' }} value={posFilter} onChange={e => setPosFilter(e.target.value)}>
              {POSITIONS.map(p => <option key={p}>{p}</option>)}
            </select>
            <select className="tl-input" style={{ width: '150px' }} value={minMinutes} onChange={e => setMinMinutes(Number(e.target.value))}>
              <option value={90}>Min. 90 Min.</option>
              <option value={270}>Min. 270 Min.</option>
              <option value={450}>Min. 450 Min.</option>
              <option value={900}>Min. 900 Min.</option>
            </select>
          </div>
        </div>
      </div>

      {/* Rankings */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

        {/* Top 20 list */}
        <div className="tl-card" style={{ overflowX: 'auto' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="section-label">TOP SPIELER</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'rgba(255,255,255,0.25)' }}>{ranked.length} Spieler</span>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '32px' }}>#</th>
                <th>Spieler</th>
                <th>Pos</th>
                <th style={{ color: metric.color }}>{metric.label}</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              {ranked.slice(0, 25).map((p, i) => {
                const score = p.score ?? 0
                const pct = maxScore > 0 ? (score / maxScore) * 100 : 0
                const scoreColor = score >= 70 ? '#00FF87' : score >= 40 ? '#FBBF24' : '#FF6B6B'

                return (
                  <tr key={p.sofascore_id}>
                    <td><span className={`rank-badge ${i < 3 ? 'top3' : ''}`}>{i + 1}</span></td>
                    <td>
                      <div>
                        <span style={{ color: '#fff', fontWeight: 500 }}>{p.name}</span>
                        <br />
                        <span style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.3)' }}>{p.team}</span>
                      </div>
                    </td>
                    <td><span className={`pos-badge pos-${p.position}`}>{p.position}</span></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: metric.color, fontWeight: 600, fontFamily: 'var(--font-display)', fontSize: '0.9rem' }}>
                          {formatValue(score, 1)}
                        </span>
                        <div className="stat-bar" style={{ width: '50px' }}>
                          <div className="stat-bar-fill" style={{ width: `${pct}%`, background: metric.color }} />
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className={`score-ring ${score >= 70 ? 'high' : score >= 40 ? 'mid' : 'low'}`}
                        style={{ borderColor: scoreColor, color: scoreColor }}>
                        {Math.round(score)}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* All metrics for top players */}
        <div className="tl-card">
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <span className="section-label">ALLE SCORES — TOP 15</span>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Spieler</th>
                {METRICS.filter(m => m.key !== 'tls').map(m => (
                  <th key={m.key} style={{ color: activeMetric === m.key ? m.color : undefined }}>{m.label}</th>
                ))}
                <th style={{ color: '#00FF87' }}>TL</th>
              </tr>
            </thead>
            <tbody>
              {ranked.slice(0, 15).map(p => (
                <tr key={p.sofascore_id}>
                  <td>
                    <span style={{ color: '#fff', fontSize: '0.72rem' }}>{p.name}</span>
                    <span className={`pos-badge pos-${p.position}`} style={{ marginLeft: '6px' }}>{p.position}</span>
                  </td>
                  {[
                    { key: 'gts', color: '#FF6B6B' },
                    { key: 'cor', color: '#60A5FA' },
                    { key: 'dis', color: '#FBBF24' },
                    { key: 'pbc', color: '#A78BFA' },
                  ].map(({ key, color }) => {
                    const val = (p as any)[key] as number | null
                    return (
                      <td key={key} style={{ color: val !== null && val >= 60 ? color : 'rgba(255,255,255,0.5)' }}>
                        {val !== null ? Math.round(val) : '—'}
                      </td>
                    )
                  })}
                  <td style={{ color: 'var(--accent-green)', fontWeight: 600, fontFamily: 'var(--font-display)' }}>
                    {p.tls !== null ? Math.round(p.tls) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function LoadingState() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: '16px' }}>
      <div style={{ width: '32px', height: '32px', border: '2px solid rgba(0,255,135,0.2)', borderTopColor: 'var(--accent-green)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)' }}>LADE DATEN...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
