'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  PlayerStats,
  calcTLS, calcGTS, calcCOR, calcDIS, calcPBC,
  calcOffensiveUsageRate
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

const POS_COLORS: Record<string, string> = {
  F: 'text-red-400 bg-red-400/10',
  M: 'text-blue-400 bg-blue-400/10',
  D: 'text-yellow-400 bg-yellow-400/10',
  G: 'text-purple-400 bg-purple-400/10',
}

export default function TalentLensPlus() {
  const [players, setPlayers] = useState<PlayerStats[]>([])
  const [loading, setLoading] = useState(true)
  const [activeMetric, setActiveMetric] = useState<MetricKey>('TLS')
  const [posFilter, setPosFilter] = useState('ALL')
  const [minMinutes, setMinMinutes] = useState(900)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('players')
        .select('*, player_stats(*)')
        .eq('league', 'Bundesliga')
      if (data) {
        const flat = data.map((p: any) => ({
          ...p,
          ...(p.player_stats?.[0] ?? {}),
        }))
        setPlayers(flat)
      }
      setLoading(false)
    }
    load()
  }, [])

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
      <div className="max-w-7xl mx-auto">

        <div className="mb-8">
          <h1 className="font-display text-4xl font-black tracking-wider text-white mb-1">
            TALENTLENS<span className="text-accent-green">+</span>
          </h1>
          <p className="text-pitch-400 font-mono text-sm">
            NBA-inspirierte Composite Metrics — über traditionelle Statistiken hinaus
          </p>
        </div>

        {/* Metric Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {METRICS.map(m => (
            <div key={m.key} className="relative group">
              <button
                onClick={() => setActiveMetric(m.key)}
                className={`px-4 py-2 font-mono text-xs font-bold tracking-widest rounded transition-all ${
                  activeMetric === m.key
                    ? 'bg-accent-green text-pitch-950'
                    : 'bg-pitch-800 text-pitch-300 hover:bg-pitch-700'
                }`}
              >
                {m.key}
              </button>
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                <div className="bg-pitch-800 border border-pitch-600 rounded-lg p-3 shadow-xl">
                  <p className="font-mono text-xs font-bold text-accent-green mb-1">{m.label}</p>
                  <p className="font-mono text-xs text-pitch-300 leading-relaxed">{m.desc}</p>
                  <p className="font-mono text-xs text-pitch-500 mt-1">{m.nba}</p>
                </div>
                <div className="w-2 h-2 bg-pitch-800 border-r border-b border-pitch-600 rotate-45 mx-auto -mt-1" />
              </div>
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
                        <span className="font-display font-bold text-sm text-white truncate">
                          {p.name}
                        </span>
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
                          className={`px-2 py-2 text-right relative group cursor-help ${
                            activeMetric === m.key ? 'text-accent-green' : 'text-pitch-500'
                          }`}
                        >
                          {m.key}
                          <div className="absolute bottom-full right-0 mb-2 w-52 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                            <div className="bg-pitch-800 border border-pitch-600 rounded-lg p-3 shadow-xl text-left">
                              <p className="font-mono text-xs font-bold text-accent-green mb-1">{m.label}</p>
                              <p className="font-mono text-xs text-pitch-300 leading-relaxed">{m.desc}</p>
                              <p className="font-mono text-xs text-pitch-500 mt-1">{m.nba}</p>
                            </div>
                          </div>
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
                            <span className="text-white font-bold truncate max-w-28">{p.name}</span>
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
