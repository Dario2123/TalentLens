'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  PlayerStats,
  calcTLS, calcGTS, calcCOR, calcDIS, calcPBC,
  calcOffensiveUsageRate, per90
} from '@/lib/metrics'

type MetricKey = 'TLS' | 'GTS' | 'COR' | 'DIS' | 'PBC' | 'OUR'

const METRICS: { key: MetricKey; label: string; desc: string; nba: string }[] = [
  { key: 'TLS', label: 'TalentLens Score', desc: 'Positionsgewichteter Gesamtscore', nba: '≈ PER' },
  { key: 'GTS', label: 'Goal Threat Score', desc: 'xG/90 + Shot Accuracy + Conversion', nba: '≈ True Shooting %' },
  { key: 'COR', label: 'Creative Output Rating', desc: 'xA/90 + Key Passes + Big Chances', nba: '≈ Assist Rate' },
  { key: 'DIS', label: 'Defensive Impact Score', desc: 'Tackles + Interceptions + Clearances + Recovery /90', nba: '≈ Defensive Rating' },
  { key: 'PBC', label: 'Progressive Ball Carrier', desc: 'Dribbles + Final Third Passes /90', nba: '≈ Ball Movement IQ' },
  { key: 'OUR', label: 'Offensive Usage Rate', desc: '% der offensiven Aktionen des Teams', nba: '≈ NBA Usage Rate' },
]

// Stats per metric with labels and extractor functions
const METRIC_STATS: Record<MetricKey, { label: string; getValue: (p: PlayerStats) => number }[]> = {
  TLS: [
    { label: 'Rating', getValue: p => p.rating ?? 0 },
    { label: 'xG/90', getValue: p => per90(p.expected_goals, p.minutes_played) ?? 0 },
    { label: 'xA/90', getValue: p => per90(p.expected_assists, p.minutes_played) ?? 0 },
    { label: 'Tackles/90', getValue: p => per90(p.tackles_won, p.minutes_played) ?? 0 },
    { label: 'Dribbles/90', getValue: p => per90(p.successful_dribbles, p.minutes_played) ?? 0 },
    { label: 'Key Passes/90', getValue: p => per90(p.key_passes, p.minutes_played) ?? 0 },
  ],
  GTS: [
    { label: 'xG/90', getValue: p => per90(p.expected_goals, p.minutes_played) ?? 0 },
    { label: 'Schüsse/90', getValue: p => per90(p.total_shots, p.minutes_played) ?? 0 },
    { label: 'Schüsse auf Tor %', getValue: p => p.shots_on_target ?? 0 },
    { label: 'Big Chances/90', getValue: p => per90(p.big_chances_created, p.minutes_played) ?? 0 },
    { label: 'Headers Won %', getValue: p => p.aerial_duels_won_pct ?? 0 },
  ],
  COR: [
    { label: 'xA/90', getValue: p => per90(p.expected_assists, p.minutes_played) ?? 0 },
    { label: 'Key Passes/90', getValue: p => per90(p.key_passes, p.minutes_played) ?? 0 },
    { label: 'Big Chances/90', getValue: p => per90(p.big_chances_created, p.minutes_played) ?? 0 },
    { label: 'Final 3rd Passes/90', getValue: p => per90(p.accurate_final_third_passes, p.minutes_played) ?? 0 },
    { label: 'Crosses/90', getValue: p => per90(p.accurate_crosses, p.minutes_played) ?? 0 },
  ],
  DIS: [
    { label: 'Tackles/90', getValue: p => per90(p.tackles_won, p.minutes_played) ?? 0 },
    { label: 'Interceptions/90', getValue: p => per90(p.interceptions, p.minutes_played) ?? 0 },
    { label: 'Clearances/90', getValue: p => per90(p.clearances, p.minutes_played) ?? 0 },
    { label: 'Ball Recovery/90', getValue: p => per90(p.ball_recovery, p.minutes_played) ?? 0 },
    { label: 'Duels Won %', getValue: p => p.ground_duels_won_pct ?? 0 },
  ],
  PBC: [
    { label: 'Dribbles/90', getValue: p => per90(p.successful_dribbles, p.minutes_played) ?? 0 },
    { label: 'Final 3rd Passes/90', getValue: p => per90(p.accurate_final_third_passes, p.minutes_played) ?? 0 },
    { label: 'Dribble Success %', getValue: p => p.successful_dribbles_pct ?? 0 },
    { label: 'Long Balls/90', getValue: p => per90(p.accurate_long_balls, p.minutes_played) ?? 0 },
    { label: 'Poss. Won/90', getValue: p => per90(p.ball_recovery, p.minutes_played) ?? 0 },
  ],
  OUR: [
    { label: 'Schüsse/90', getValue: p => per90(p.total_shots, p.minutes_played) ?? 0 },
    { label: 'Dribbles/90', getValue: p => per90(p.successful_dribbles, p.minutes_played) ?? 0 },
    { label: 'Key Passes/90', getValue: p => per90(p.key_passes, p.minutes_played) ?? 0 },
    { label: 'Big Chances/90', getValue: p => per90(p.big_chances_created, p.minutes_played) ?? 0 },
    { label: 'xG/90', getValue: p => per90(p.expected_goals, p.minutes_played) ?? 0 },
  ],
}

// Rose/Radar SVG Chart
function RoseChart({ player, allPlayers, metric }: { player: PlayerStats; allPlayers: PlayerStats[]; metric: MetricKey }) {
  const stats = METRIC_STATS[metric]
  const n = stats.length
  const cx = 120, cy = 120, r = 90

  // Max values from all players for normalization
  const maxVals = stats.map(s => Math.max(...allPlayers.map(p => s.getValue(p)), 0.001))
  const playerVals = stats.map((s, i) => Math.min(s.getValue(player) / maxVals[i], 1))
  const avgVals = stats.map((s, i) => {
    const avg = allPlayers.reduce((sum, p) => sum + s.getValue(p), 0) / (allPlayers.length || 1)
    return Math.min(avg / maxVals[i], 1)
  })

  const angleStep = (2 * Math.PI) / n
  const startAngle = -Math.PI / 2

  const toPoint = (val: number, idx: number) => {
    const angle = startAngle + idx * angleStep
    return {
      x: cx + val * r * Math.cos(angle),
      y: cy + val * r * Math.sin(angle),
    }
  }

  const playerPath = playerVals.map((v, i) => toPoint(v, i))
  const avgPath = avgVals.map((v, i) => toPoint(v, i))

  const toSvgPath = (pts: { x: number; y: number }[]) =>
    pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') + ' Z'

  // Grid rings
  const rings = [0.25, 0.5, 0.75, 1.0]

  return (
    <svg width="280" height="280" viewBox="-20 -20 280 280" style={{ overflow: 'visible' }}>
      {/* Grid rings */}
      {rings.map(ring => {
        const pts = stats.map((_, i) => toPoint(ring, i))
        return (
          <polygon
            key={ring}
            points={pts.map(p => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="1"
          />
        )
      })}

      {/* Axis lines */}
      {stats.map((_, i) => {
        const end = toPoint(1, i)
        return (
          <line
            key={i}
            x1={cx} y1={cy}
            x2={end.x} y2={end.y}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1"
          />
        )
      })}

      {/* Avg fill */}
      <path
        d={toSvgPath(avgPath)}
        fill="rgba(255,255,255,0.05)"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="1"
        strokeDasharray="3,3"
      />

      {/* Player fill */}
      <path
        d={toSvgPath(playerPath)}
        fill="rgba(0,255,135,0.15)"
        stroke="#00FF87"
        strokeWidth="1.5"
      />

      {/* Player dots */}
      {playerVals.map((v, i) => {
        const pt = toPoint(v, i)
        return <circle key={i} cx={pt.x} cy={pt.y} r="3" fill="#00FF87" />
      })}

      {/* Labels */}
      {stats.map((s, i) => {
        const angle = startAngle + i * angleStep
        const labelR = r + 36
        const lx = cx + labelR * Math.cos(angle)
        const ly = cy + labelR * Math.sin(angle)
        const val = stats[i].getValue(player)
        return (
          <g key={i}>
            <text
              x={lx} y={ly - 9}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="12"
              fill="rgba(255,255,255,0.9)"
              fontFamily="monospace"
              fontWeight="700"
            >
              {s.label}
            </text>
            <text
              x={lx} y={ly + 10}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="15"
              fontWeight="900"
              fill="#00FF87"
              fontFamily="monospace"
            >
              {val < 1 && val > 0 ? val.toFixed(2) : val.toFixed(1)}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// Player Modal
function PlayerModal({
  player, allPlayers, metric, onClose
}: {
  player: PlayerStats
  allPlayers: PlayerStats[]
  metric: MetricKey
  onClose: () => void
}) {
  const metricInfo = METRICS.find(m => m.key === metric)!
  const score = getScore(player, metric, allPlayers)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const POS_COLORS: Record<string, string> = { F: '#f87171', M: '#60a5fa', D: '#facc15', G: '#c084fc' }
  const posColor = POS_COLORS[player.position] || '#fff'

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(4px)',
        padding: '24px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#0a1929',
          border: '1px solid rgba(0,255,135,0.25)',
          borderRadius: '16px',
          padding: '32px',
          width: '100%',
          maxWidth: '560px',
          boxShadow: '0 24px 80px rgba(0,0,0,0.8), 0 0 40px rgba(0,255,135,0.05)',
          position: 'relative',
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '16px', right: '16px',
            background: 'rgba(255,255,255,0.05)', border: 'none',
            color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace',
            fontSize: '1rem', cursor: 'pointer', borderRadius: '6px',
            width: '32px', height: '32px', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          ✕
        </button>

        {/* Player header */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.6rem', color: '#fff', letterSpacing: '0.02em' }}>
              {player.name}
            </h2>
            <span style={{ fontFamily: 'monospace', fontSize: '0.7rem', fontWeight: 700, color: posColor, background: `${posColor}18`, padding: '2px 8px', borderRadius: '4px' }}>
              {player.position}
            </span>
          </div>
          <p style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)' }}>
            {player.team} · {player.minutes_played?.toFixed(0)} min
          </p>
        </div>

        {/* Active metric score */}
        <div style={{
          background: 'rgba(0,255,135,0.06)', border: '1px solid rgba(0,255,135,0.15)',
          borderRadius: '10px', padding: '14px 20px', marginBottom: '28px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <p style={{ fontFamily: 'monospace', fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', marginBottom: '2px' }}>
              {metric} — {metricInfo.label}
            </p>
            <p style={{ fontFamily: 'monospace', fontSize: '0.68rem', color: 'rgba(255,255,255,0.45)' }}>
              {metricInfo.nba}
            </p>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '2rem', color: '#00FF87' }}>
            {metric === 'OUR' ? `${score.toFixed(1)}%` : score.toFixed(1)}
          </span>
        </div>

        {/* Rose Chart */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <RoseChart player={player} allPlayers={allPlayers} metric={metric} />
          <div style={{ display: 'flex', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '20px', height: '2px', background: '#00FF87', borderRadius: '1px' }} />
              <span style={{ fontFamily: 'monospace', fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)' }}>Spieler</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '20px', height: '2px', background: 'rgba(255,255,255,0.3)', borderRadius: '1px', borderTop: '1px dashed rgba(255,255,255,0.3)' }} />
              <span style={{ fontFamily: 'monospace', fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)' }}>Liga-Ø</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const POS_COLORS: Record<string, string> = {
  F: 'text-red-400 bg-red-400/10',
  M: 'text-blue-400 bg-blue-400/10',
  D: 'text-yellow-400 bg-yellow-400/10',
  G: 'text-purple-400 bg-purple-400/10',
}

function MetricTooltip({ m, alignRight }: { m: typeof METRICS[0]; alignRight?: boolean }) {
  const style: React.CSSProperties = {
    position: 'absolute',
    top: '110%',
    left: alignRight ? 'auto' : '50%',
    right: alignRight ? '0' : 'auto',
    transform: alignRight ? 'none' : 'translateX(-50%)',
    width: '220px',
    zIndex: 9999,
    background: '#0a1929',
    border: '1px solid #00FF87',
    borderRadius: '8px',
    padding: '12px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
    pointerEvents: 'none',
  }
  return (
    <div style={style}>
      <p style={{ fontFamily: 'monospace', fontSize: '0.7rem', fontWeight: 700, color: '#00FF87', marginBottom: '4px' }}>{m.label}</p>
      <p style={{ fontFamily: 'monospace', fontSize: '0.65rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>{m.desc}</p>
      <p style={{ fontFamily: 'monospace', fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>{m.nba}</p>
    </div>
  )
}

function getScore(p: PlayerStats, key: MetricKey, allPlayers: PlayerStats[]): number {
  switch (key) {
    case 'TLS': return calcTLS(p)
    case 'GTS': return calcGTS(p)
    case 'COR': return calcCOR(p)
    case 'DIS': return calcDIS(p)
    case 'PBC': return calcPBC(p)
    case 'OUR': {
      const teamPlayers = allPlayers.filter(tp => tp.team === p.team)
      return calcOffensiveUsageRate(p, teamPlayers)
    }
  }
}

function TalentLensPlusInner() {
  const searchParams = useSearchParams()
  const currentLeague = searchParams.get('league') || 'Bundesliga'

  const [players, setPlayers] = useState<PlayerStats[]>([])
  const [loading, setLoading] = useState(true)
  const [activeMetric, setActiveMetric] = useState<MetricKey>('TLS')
  const [posFilter, setPosFilter] = useState('ALL')
  const [minMinutes, setMinMinutes] = useState(900)
  const [hoveredTab, setHoveredTab] = useState<MetricKey | null>(null)
  const [hoveredCol, setHoveredCol] = useState<MetricKey | null>(null)
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerStats | null>(null)

  useEffect(() => {
    setPlayers([])
    setLoading(true)
    async function load() {
      const res = await fetch(`/api/players?league=${encodeURIComponent(currentLeague)}`)
      if (res.ok) {
        const { data } = await res.json()
        if (data) {
          const flat = data.map((p: any) => ({
            ...p,
            ...(p.player_stats?.[0] ?? {}),
          }))
          setPlayers(flat)
        }
      }
      setLoading(false)
    }
    load()
  }, [currentLeague])

  const filtered = players.filter(p =>
    (p.minutes_played || 0) >= minMinutes &&
    (posFilter === 'ALL' || p.position === posFilter)
  )

  const ranked = [...filtered]
    .map(p => ({ ...p, score: getScore(p, activeMetric, players) }))
    .filter(p => p.score > 0)
    .sort((a, b) => b.score - a.score)

  const top25 = ranked.slice(0, 25)
  const maxScore = top25[0]?.score || 1
  const metric = METRICS.find(m => m.key === activeMetric)!

  return (
    <div className="min-h-screen bg-pitch-950 text-white p-6">
      {selectedPlayer && (
        <PlayerModal
          player={selectedPlayer}
          allPlayers={filtered}
          metric={activeMetric}
          onClose={() => setSelectedPlayer(null)}
        />
      )}

      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="font-display text-4xl font-black tracking-wider text-white mb-1">
            TALENTLENS<span className="text-accent-green">+</span>
          </h1>
          <p className="text-pitch-400 font-mono text-sm">
            NBA-inspirierte Composite Metrics — {currentLeague}
          </p>
        </div>

        {/* Metric Tabs */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '32px' }}>
          {METRICS.map(m => (
            <div key={m.key} style={{ position: 'relative' }}>
              <button
                onClick={() => setActiveMetric(m.key)}
                onMouseEnter={() => setHoveredTab(m.key)}
                onMouseLeave={() => setHoveredTab(null)}
                style={{
                  padding: '8px 16px',
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  background: activeMetric === m.key ? '#00FF87' : '#0d1f2d',
                  color: activeMetric === m.key ? '#040A0F' : 'rgba(255,255,255,0.6)',
                  transition: 'all 0.15s',
                }}
              >
                {m.key}
              </button>
              {hoveredTab === m.key && <MetricTooltip m={m} alignRight={m.key === 'OUR' || m.key === 'PBC'} />}
            </div>
          ))}
        </div>

        {/* Metric Info */}
        <div className="bg-pitch-900 border border-pitch-700 rounded-lg p-4 mb-6">
          <div className="flex items-start justify-between flex-wrap gap-2">
            <div>
              <h2 className="font-display text-xl font-bold text-accent-green tracking-wide">
                {metric.label}
              </h2>
              <p className="text-pitch-300 font-mono text-sm mt-1">{metric.desc}</p>
            </div>
            <span className="font-mono text-xs text-pitch-400 bg-pitch-800 px-3 py-1 rounded">
              {metric.nba}
            </span>
          </div>
          {activeMetric === 'OUR' && (
            <div className="mt-3 pt-3 border-t border-pitch-700">
              <p className="font-mono text-xs text-pitch-400">
                <span className="text-accent-green">Formel:</span>{' '}
                (Schüsse + Dribbles versucht + Key Passes + Big Chances) /90 ÷ Team-Summe × 100
              </p>
              <p className="font-mono text-xs text-pitch-500 mt-1">
                Misst wer das offensive Spiel dominiert — unabhängig von Toren und Assists
              </p>
              <a
                href="https://sincerefc.medium.com/a-mirage-of-counting-statistics-and-usage-rate-in-football-ee82c5a915f9"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                  fontFamily: 'var(--font-mono)', fontSize: '0.62rem',
                  color: 'rgba(0,255,135,0.6)', marginTop: '8px',
                  textDecoration: 'none', transition: 'color 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = '#00FF87')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(0,255,135,0.6)')}
              >
                ↗ Inspiriert von: &ldquo;Usage Rate in Football&rdquo; — sincerefc.medium.com
              </a>
            </div>
          )}
          {activeMetric === 'PBC' && (
            <div className="mt-3 pt-3 border-t border-pitch-700">
              <p className="font-mono text-xs text-pitch-400">
                <span className="text-accent-green">Formel:</span>{' '}
                (Erfolgreiche Dribbles /90 × 2) + (Final Third Passes /90) + (Long Balls /90 × 0.5) — normalisiert auf 0–100
              </p>
              <p className="font-mono text-xs text-pitch-500 mt-1">
                Misst wie aktiv ein Spieler den Ball vorwärts trägt — durch Dribbling, Pässe ins letzte Drittel und lange Verlagerungen. Inspiriert von StatsBomb&apos;s Methodik: ein progressiver Carry bewegt den Ball mindestens 25% der verbleibenden Distanz zum Tor.
              </p>
              <a
                href="https://www.hudl.com/blog/the-art-of-progression-an-analysis-of-passing-vs-ball-carrying"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                  fontFamily: 'var(--font-mono)', fontSize: '0.62rem',
                  color: 'rgba(0,255,135,0.6)', marginTop: '8px',
                  textDecoration: 'none', transition: 'color 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = '#00FF87')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(0,255,135,0.6)')}
              >
                ↗ Inspiriert von: &ldquo;The Art of Progression&rdquo; — Hudl Statsbomb
              </a>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="flex gap-1">
            {['ALL', 'F', 'M', 'D', 'G'].map(pos => (
              <button
                key={pos}
                onClick={() => setPosFilter(pos)}
                className={`px-3 py-1.5 font-mono text-xs rounded transition-all ${
                  posFilter === pos
                    ? 'bg-accent-green text-pitch-950 font-bold'
                    : 'bg-pitch-800 text-pitch-300 hover:bg-pitch-700'
                }`}
              >
                {pos}
              </button>
            ))}
          </div>
          <div className="flex gap-1">
            {[450, 900, 1350].map(m => (
              <button
                key={m}
                onClick={() => setMinMinutes(m)}
                className={`px-3 py-1.5 font-mono text-xs rounded transition-all ${
                  minMinutes === m
                    ? 'bg-accent-green text-pitch-950 font-bold'
                    : 'bg-pitch-800 text-pitch-300 hover:bg-pitch-700'
                }`}
              >
                {m}+ min
              </button>
            ))}
          </div>
        </div>

        {/* Hint */}
        <p className="font-mono text-xs text-pitch-500 mb-4">
          Spielernamen anklicken für detaillierte Statistiken
        </p>

        {loading ? (
          <div className="text-center py-20 text-pitch-400 font-mono">Laden...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Top 25 */}
            <div className="bg-pitch-900 border border-pitch-700 rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-pitch-700">
                <h3 className="font-mono text-xs font-bold text-pitch-300 tracking-widest">
                  TOP 25 — {metric.key}
                </h3>
              </div>
              <div className="divide-y divide-pitch-800">
                {top25.map((p, i) => (
                  <div key={p.sofascore_id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-pitch-800/50 transition-colors">
                    <span className={`font-mono text-xs w-6 text-right ${
                      i === 0 ? 'text-accent-green font-bold' :
                      i < 3 ? 'text-pitch-300' : 'text-pitch-500'
                    }`}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedPlayer(p)}
                          style={{
                            background: 'none', border: 'none', padding: 0,
                            cursor: 'pointer', textAlign: 'left',
                          }}
                        >
                          <span className="font-display font-bold text-sm text-white truncate hover:text-accent-green transition-colors"
                            style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.875rem', color: 'inherit' }}>
                            {p.name}
                          </span>
                        </button>
                        <span className={`font-mono text-xs px-1.5 py-0.5 rounded ${POS_COLORS[p.position] || 'text-pitch-400'}`}>
                          {p.position}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1 bg-pitch-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-accent-green rounded-full transition-all"
                            style={{ width: `${(p.score / maxScore) * 100}%` }}
                          />
                        </div>
                        <span className="font-mono text-xs text-accent-green font-bold w-12 text-right">
                          {activeMetric === 'OUR' ? `${p.score.toFixed(1)}%` : p.score.toFixed(1)}
                        </span>
                      </div>
                    </div>
                    <span className="font-mono text-xs text-pitch-500 hidden sm:block truncate max-w-24">
                      {p.team?.replace('FC ', '').replace('Borussia ', 'BVB ').replace('Bayer 04 ', '')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Score Matrix */}
            <div className="bg-pitch-900 border border-pitch-700 rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-pitch-700">
                <h3 className="font-mono text-xs font-bold text-pitch-300 tracking-widest">
                  ALLE SCORES — TOP 15
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="border-b border-pitch-700">
                      <th className="px-3 py-2 text-left text-pitch-400">Spieler</th>
                      {METRICS.map(m => (
                        <th
                          key={m.key}
                          onMouseEnter={() => setHoveredCol(m.key)}
                          onMouseLeave={() => setHoveredCol(null)}
                          style={{ position: 'relative', padding: '8px', textAlign: 'right', cursor: 'help',
                            color: activeMetric === m.key ? '#00FF87' : 'rgba(255,255,255,0.3)' }}
                        >
                          {m.key}
                          {hoveredCol === m.key && <MetricTooltip m={m} alignRight={m.key === 'OUR' || m.key === 'PBC'} />}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-pitch-800">
                    {top25.slice(0, 15).map(p => (
                      <tr key={p.sofascore_id} className="hover:bg-pitch-800/50 transition-colors">
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-xs px-1 py-0.5 rounded ${POS_COLORS[p.position] || ''}`}>
                              {p.position}
                            </span>
                            <button
                              onClick={() => setSelectedPlayer(p)}
                              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                            >
                              <span className="text-white font-bold truncate max-w-28 hover:text-accent-green transition-colors"
                                style={{ fontFamily: 'monospace', fontWeight: 700 }}>
                                {p.name}
                              </span>
                            </button>
                          </div>
                        </td>
                        {METRICS.map(m => {
                          const score = getScore(p, m.key, players)
                          return (
                            <td
                              key={m.key}
                              className={`px-2 py-2 text-right ${
                                m.key === activeMetric ? 'text-accent-green font-bold' : 'text-pitch-300'
                              }`}
                            >
                              {m.key === 'OUR' ? `${score.toFixed(1)}%` : score.toFixed(1)}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function TalentLensPlus() {
  return (
    <Suspense fallback={null}>
      <TalentLensPlusInner />
    </Suspense>
  )
}
