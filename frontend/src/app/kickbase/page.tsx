'use client'

import { useEffect, useState, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  PlayerStats,
  calcKickbasePoints, calcExpectedKickbasePoints,
  calcKickbaseP90, calcExpectedKickbaseP90, calcKickbaseUnderperformance,
  KB_ENTRIES, KB_COVERAGE,
} from '@/lib/metrics'

type ViewMode = 'ranking' | 'valuepicks'

const POS_COLORS: Record<string, string> = {
  F: '#f87171',
  M: '#60a5fa',
  D: '#facc15',
  G: '#c084fc',
}

function scoreColor(val: number, max: number): string {
  const ratio = val / max
  if (ratio >= 0.8) return '#00FF87'
  if (ratio >= 0.5) return 'rgba(255,255,255,0.8)'
  return 'rgba(255,255,255,0.45)'
}

function KickbaseScoutInner() {
  const searchParams = useSearchParams()
  const currentLeague = searchParams.get('league') || 'Bundesliga'

  const [players, setPlayers] = useState<PlayerStats[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<ViewMode>('ranking')
  const [posFilter, setPosFilter] = useState('ALL')
  const [minMinutes, setMinMinutes] = useState(450)
  const [sortCol, setSortCol] = useState<'kbP90' | 'xKbP90' | 'totalKb' | 'underperf' | 'xKbTotal'>('kbP90')
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc')

  useEffect(() => {
    setPlayers([])
    setLoading(true)
    async function load() {
      const params = new URLSearchParams({ league: currentLeague, limit: '2000' })
      const res = await fetch(`/api/players?${params}`)
      if (res.ok) {
        const data = await res.json()
        setPlayers(data)
      }
      setLoading(false)
    }
    load()
  }, [currentLeague])

  const enriched = useMemo(() => {
    return players
      .filter(p => (p.minutes_played || 0) >= minMinutes)
      .filter(p => posFilter === 'ALL' || p.position === posFilter)
      .map(p => ({
        ...p,
        kbTotal: calcKickbasePoints(p),
        xKbTotal: calcExpectedKickbasePoints(p),
        kbP90: calcKickbaseP90(p),
        xKbP90: calcExpectedKickbaseP90(p),
        underperf: calcKickbaseUnderperformance(p),
      }))
  }, [players, minMinutes, posFilter])

  function toggleSort(col: typeof sortCol) {
    if (sortCol === col) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSortCol(col); setSortDir('desc') }
  }

  const ranked = useMemo(() => {
    return [...enriched].sort((a, b) => {
      const av = (a as any)[sortCol] ?? 0
      const bv = (b as any)[sortCol] ?? 0
      return sortDir === 'desc' ? bv - av : av - bv
    })
  }, [enriched, sortCol, sortDir])

  const valuePicks = useMemo(() => {
    return [...enriched]
      .filter(p => p.underperf > 20)
      .sort((a, b) => {
        const scoreA = a.xKbP90 * 0.6 + (a.underperf / 5) * 0.4
        const scoreB = b.xKbP90 * 0.6 + (b.underperf / 5) * 0.4
        return scoreB - scoreA
      })
      .slice(0, 30)
  }, [enriched])

  const maxKbP90 = Math.max(...ranked.map(p => p.kbP90), 1)

  if (loading) return <LoadingState />

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <p className="section-label">Modul 04</p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '2.2rem', letterSpacing: '0.02em', color: '#fff' }}>
          KICKBASE <span style={{ color: '#00FF87' }}>SCOUT</span>
        </h1>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', marginTop: '4px' }}>
          Geschätzte Kickbase-Punkte aus Saison-Stats · {currentLeague}
        </p>
      </div>

      {/* Scoring Coverage Banner */}
      <ScoringCoverageBanner />

      {/* View Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {(['ranking', 'valuepicks'] as ViewMode[]).map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            style={{
              padding: '7px 16px',
              fontFamily: 'monospace',
              fontSize: '0.72rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              background: view === v ? '#00FF87' : '#0d1f2d',
              color: view === v ? '#040A0F' : 'rgba(255,255,255,0.5)',
              transition: 'all 0.15s',
              textTransform: 'uppercase',
            }}
          >
            {v === 'ranking' ? 'Ranking' : 'Value Picks'}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '4px' }}>
          {['ALL', 'F', 'M', 'D', 'G'].map(pos => (
            <button
              key={pos}
              onClick={() => setPosFilter(pos)}
              style={{
                padding: '5px 12px',
                fontFamily: 'monospace', fontSize: '0.7rem', fontWeight: 700,
                borderRadius: '5px', border: 'none', cursor: 'pointer',
                background: posFilter === pos ? (POS_COLORS[pos] || '#00FF87') : '#0d1f2d',
                color: posFilter === pos ? '#040A0F' : 'rgba(255,255,255,0.5)',
                transition: 'all 0.15s',
              }}
            >
              {pos}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          {[270, 450, 900].map(m => (
            <button
              key={m}
              onClick={() => setMinMinutes(m)}
              style={{
                padding: '5px 12px',
                fontFamily: 'monospace', fontSize: '0.7rem', fontWeight: 700,
                borderRadius: '5px', border: 'none', cursor: 'pointer',
                background: minMinutes === m ? '#00FF87' : '#0d1f2d',
                color: minMinutes === m ? '#040A0F' : 'rgba(255,255,255,0.5)',
                transition: 'all 0.15s',
              }}
            >
              {m}+ min
            </button>
          ))}
        </div>
      </div>

      {view === 'ranking' ? (
        <RankingTable
          players={ranked}
          maxKbP90={maxKbP90}
          sortCol={sortCol}
          sortDir={sortDir}
          onSort={toggleSort}
        />
      ) : (
        <ValuePicksView players={valuePicks} />
      )}
    </div>
  )
}

function ScoringCoverageBanner() {
  const [showMissing, setShowMissing] = useState(false)
  const mappedEntries = KB_ENTRIES.filter(e => e.getValue !== null)
  const missingEntries = KB_ENTRIES.filter(e => e.getValue === null)
  const coveragePct = Math.round((KB_COVERAGE.mapped / KB_COVERAGE.total) * 100)

  const POS_ENTRIES = [
    { label: 'Tor TW', pts: 120, color: '#c084fc' },
    { label: 'Tor AV', pts: 100, color: '#facc15' },
    { label: 'Tor MF', pts: 90, color: '#60a5fa' },
    { label: 'Tor ST', pts: 80, color: '#f87171' },
    { label: 'Vorlage TW', pts: 55, color: '#c084fc' },
    { label: 'Vorlage AV', pts: 45, color: '#facc15' },
    { label: 'Vorlage MF/ST', pts: 35, color: '#60a5fa' },
  ]

  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{
        background: 'rgba(0,255,135,0.04)',
        border: '1px solid rgba(0,255,135,0.12)',
        borderRadius: '10px 10px 0 0',
        padding: '12px 16px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '18px',
        alignItems: 'center',
      }}>
        {POS_ENTRIES.map(e => (
          <ScoringLegend key={e.label} label={e.label} pts={e.pts} color={e.color} />
        ))}
        <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.08)' }} />
        {mappedEntries.map(e => (
          <ScoringLegend key={e.short_name} label={e.name} pts={e.pts} color={e.pts > 0 ? '#00FF87' : '#f87171'} />
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'rgba(255,255,255,0.25)' }}>
            KB Wert — <span style={{ color: 'rgba(255,255,255,0.12)' }}>kommt bald</span>
          </span>
        </div>
      </div>

      <div style={{
        background: 'rgba(0,0,0,0.3)',
        border: '1px solid rgba(0,255,135,0.08)',
        borderTop: 'none',
        borderRadius: '0 0 10px 10px',
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap' }}>
            FORMEL-COVERAGE
          </span>
          <div style={{ flex: 1, height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden', maxWidth: '200px' }}>
            <div style={{ height: '100%', width: `${coveragePct}%`, background: coveragePct > 60 ? '#00FF87' : '#fbbf24', borderRadius: '2px', transition: 'width 0.3s' }} />
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', fontWeight: 700, color: coveragePct > 60 ? '#00FF87' : '#fbbf24' }}>
            {KB_COVERAGE.mapped}/{KB_COVERAGE.total} ({coveragePct}%)
          </span>
        </div>
        <button
          onClick={() => setShowMissing(v => !v)}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: '0.58rem', fontWeight: 700,
            color: 'rgba(255,255,255,0.3)', background: 'transparent', border: 'none',
            cursor: 'pointer', letterSpacing: '0.06em', whiteSpace: 'nowrap',
          }}
        >
          {showMissing ? '▲ VERSTECKEN' : '▼ FEHLENDE DATEN'}
        </button>
      </div>

      {showMissing && (
        <div style={{
          background: '#060f1a',
          border: '1px solid rgba(255,255,255,0.06)',
          borderTop: 'none',
          borderRadius: '0 0 10px 10px',
          padding: '12px 16px',
        }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'rgba(255,255,255,0.2)', marginBottom: '10px', letterSpacing: '0.08em' }}>
            NICHT GEMAPPT — DATEN FEHLEN NOCH
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '4px' }}>
            {missingEntries.map(e => (
              <div key={e.short_name} style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', fontWeight: 700,
                  color: e.pts > 0 ? 'rgba(0,255,135,0.4)' : 'rgba(248,113,113,0.4)', minWidth: '32px', textAlign: 'right' }}>
                  {e.pts > 0 ? '+' : ''}{e.pts}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'rgba(255,255,255,0.35)' }}>{e.name}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: 'rgba(255,255,255,0.15)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  → {e.dataNeeded}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ScoringLegend({ label, pts, color }: { label: string; pts: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'rgba(255,255,255,0.35)' }}>{label}</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', fontWeight: 700, color }}>
        {pts > 0 ? '+' : ''}{pts}
      </span>
    </div>
  )
}

type EnrichedPlayer = PlayerStats & {
  kbTotal: number
  xKbTotal: number
  kbP90: number
  xKbP90: number
  underperf: number
}

function RankingTable({
  players, maxKbP90, sortCol, sortDir, onSort
}: {
  players: EnrichedPlayer[]
  maxKbP90: number
  sortCol: string
  sortDir: 'asc' | 'desc'
  onSort: (col: any) => void
}) {
  const SortHeader = ({ col, label }: { col: string; label: string }) => (
    <th
      onClick={() => onSort(col)}
      style={{
        padding: '8px 10px',
        textAlign: 'right',
        cursor: 'pointer',
        color: sortCol === col ? '#00FF87' : 'rgba(255,255,255,0.3)',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.65rem',
        letterSpacing: '0.06em',
        whiteSpace: 'nowrap',
        userSelect: 'none',
      }}
    >
      {label} {sortCol === col ? (sortDir === 'desc' ? '↓' : '↑') : ''}
    </th>
  )

  return (
    <div className="tl-card" style={{ overflowX: 'auto' }}>
      <table className="data-table" style={{ width: '100%' }}>
        <thead>
          <tr>
            <th style={{ padding: '8px 10px', textAlign: 'left', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.06em' }}>#</th>
            <th style={{ padding: '8px 10px', textAlign: 'left', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.06em' }}>Spieler</th>
            <th style={{ padding: '8px 10px', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)' }}>Pos</th>
            <SortHeader col="kbP90" label="KB Pts/90" />
            <SortHeader col="xKbP90" label="xKB Pts/90" />
            <SortHeader col="totalKb" label="KB Gesamt" />
            <SortHeader col="xKbTotal" label="xKB Gesamt" />
            <SortHeader col="underperf" label="xKB Diff" />
            <th style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'rgba(255,255,255,0.15)', letterSpacing: '0.06em' }}>KB Wert</th>
            <th style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.06em' }}>Min</th>
          </tr>
        </thead>
        <tbody>
          {players.slice(0, 50).map((p, i) => {
            const posColor = POS_COLORS[p.position] || '#fff'
            const isUnderperf = p.underperf > 20
            return (
              <tr key={p.sofascore_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '7px 10px', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: i < 3 ? '#00FF87' : 'rgba(255,255,255,0.3)', fontWeight: i < 3 ? 700 : 400 }}>
                  {i + 1}
                </td>
                <td style={{ padding: '7px 10px' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.85rem', color: '#fff' }}>
                    {p.name}
                    {isUnderperf && (
                      <span title="Underperformed xG/xA — möglicher Value Pick" style={{
                        marginLeft: '6px', fontSize: '0.6rem', color: '#fbbf24',
                        background: 'rgba(251,191,36,0.12)', padding: '1px 5px',
                        borderRadius: '3px', fontFamily: 'monospace', fontWeight: 700,
                      }}>
                        VALUE?
                      </span>
                    )}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'rgba(255,255,255,0.25)', marginTop: '1px' }}>
                    {p.team}
                  </div>
                </td>
                <td style={{ padding: '7px 10px' }}>
                  <span style={{
                    fontFamily: 'monospace', fontSize: '0.65rem', fontWeight: 700,
                    color: posColor, background: `${posColor}18`,
                    padding: '2px 6px', borderRadius: '3px',
                  }}>
                    {p.position}
                  </span>
                </td>
                <td style={{ padding: '7px 10px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
                    <div style={{ width: '48px', height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.min(100, (p.kbP90 / maxKbP90) * 100)}%`, background: '#00FF87', borderRadius: '2px' }} />
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', fontWeight: 700, color: scoreColor(p.kbP90, maxKbP90), minWidth: '36px', textAlign: 'right' }}>
                      {p.kbP90.toFixed(1)}
                    </span>
                  </div>
                </td>
                <td style={{ padding: '7px 10px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)' }}>
                  {p.xKbP90.toFixed(1)}
                </td>
                <td style={{ padding: '7px 10px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                  {p.kbTotal.toFixed(0)}
                </td>
                <td style={{ padding: '7px 10px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>
                  {p.xKbTotal.toFixed(0)}
                </td>
                <td style={{ padding: '7px 10px', textAlign: 'right' }}>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: '0.72rem', fontWeight: 700,
                    color: p.underperf > 20 ? '#fbbf24' : p.underperf < -20 ? '#f87171' : 'rgba(255,255,255,0.3)',
                  }}>
                    {p.underperf > 0 ? '+' : ''}{p.underperf.toFixed(0)}
                  </span>
                </td>
                <td style={{ padding: '7px 10px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'rgba(255,255,255,0.12)', letterSpacing: '0.05em' }}>
                  —
                </td>
                <td style={{ padding: '7px 10px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'rgba(255,255,255,0.25)' }}>
                  {p.minutes_played ?? '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function ValuePicksView({ players }: { players: EnrichedPlayer[] }) {
  return (
    <div>
      <div style={{
        background: 'rgba(251,191,36,0.05)',
        border: '1px solid rgba(251,191,36,0.15)',
        borderRadius: '10px',
        padding: '14px 18px',
        marginBottom: '20px',
      }}>
        <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.8rem', color: '#fbbf24', letterSpacing: '0.05em', marginBottom: '6px' }}>
          WAS SIND VALUE PICKS?
        </p>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>
          Spieler mit hohem <span style={{ color: '#fbbf24' }}>xKB-Score</span> (was sie hätten verdienen sollen) aber niedrigem tatsächlichem KB-Score.
          Das kann auf schlechte Torausbeute trotz guter Chancen hinweisen — oder wenige Minuten trotz hoher Effizienz.
          Diese Spieler könnten im Kickbase-Markt <span style={{ color: '#fbbf24' }}>günstiger zu bekommen</span> sein.
        </p>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'rgba(255,255,255,0.2)', marginTop: '8px' }}>
          KB Marktwert-Vergleich folgt · Aktuell nur auf Basis von Saison-Stats
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '12px' }}>
        {players.map((p, i) => {
          const posColor = POS_COLORS[p.position] || '#fff'
          const xgDiff = (p.expected_goals || 0) - (p.goals || 0)
          const xaDiff = (p.expected_assists || 0) - (p.assists || 0)
          return (
            <div key={p.sofascore_id} style={{
              background: '#0a1929',
              border: '1px solid rgba(251,191,36,0.12)',
              borderRadius: '10px',
              padding: '16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'rgba(255,255,255,0.2)' }}>#{i + 1}</span>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '0.95rem', color: '#fff' }}>{p.name}</span>
                    <span style={{
                      fontFamily: 'monospace', fontSize: '0.6rem', fontWeight: 700,
                      color: posColor, background: `${posColor}18`, padding: '1px 5px', borderRadius: '3px',
                    }}>
                      {p.position}
                    </span>
                  </div>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'rgba(255,255,255,0.25)', marginTop: '2px' }}>
                    {p.team} · {p.minutes_played} min
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'rgba(255,255,255,0.25)', marginBottom: '1px' }}>xKB DIFF</p>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.3rem', color: '#fbbf24' }}>
                    +{p.underperf.toFixed(0)}
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px' }}>
                <StatBox label="KB/90" value={p.kbP90.toFixed(1)} highlight />
                <StatBox label="xKB/90" value={p.xKbP90.toFixed(1)} />
                <StatBox
                  label="xG Diff"
                  value={xgDiff > 0 ? `+${xgDiff.toFixed(1)}` : xgDiff.toFixed(1)}
                  color={xgDiff > 0.3 ? '#fbbf24' : undefined}
                />
                <StatBox
                  label="xA Diff"
                  value={xaDiff > 0 ? `+${xaDiff.toFixed(1)}` : xaDiff.toFixed(1)}
                  color={xaDiff > 0.3 ? '#fbbf24' : undefined}
                />
              </div>

              <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'rgba(255,255,255,0.2)' }}>
                  {p.goals ?? 0}G · {p.assists ?? 0}A · {p.yellow_cards ?? 0}🟨
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'rgba(255,255,255,0.15)' }}>
                  KB Wert: —
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function StatBox({ label, value, highlight, color }: { label: string; value: string; highlight?: boolean; color?: string }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      borderRadius: '6px',
      padding: '6px 8px',
      textAlign: 'center',
    }}>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.06em', marginBottom: '2px' }}>{label}</p>
      <p style={{
        fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '0.85rem',
        color: color || (highlight ? '#00FF87' : 'rgba(255,255,255,0.7)'),
      }}>
        {value}
      </p>
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

export default function KickbasePage() {
  return (
    <Suspense fallback={null}>
      <KickbaseScoutInner />
    </Suspense>
  )
}
