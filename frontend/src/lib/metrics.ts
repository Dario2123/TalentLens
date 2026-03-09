import { PlayerWithStats } from './supabase'

export function per90(value: number | null, minutes: number | null): number | null {
  if (!value || !minutes || minutes < 1) return null
  return (value / minutes) * 90
}

export function formatValue(val: number | null, decimals = 2): string {
  if (val === null || val === undefined) return '—'
  return val.toFixed(decimals)
}

export function formatMillions(val: number | null): string {
  if (!val) return '—'
  if (val >= 1_000_000) return `€${(val / 1_000_000).toFixed(1)}M`
  if (val >= 1_000) return `€${(val / 1_000).toFixed(0)}K`
  return `€${val}`
}

// ─────────────────────────────────────────────────────────────
// TalentLens+ Composite Metrics
// ─────────────────────────────────────────────────────────────

/**
 * Goal Threat Score (GTS)
 * Combines xG + shot accuracy + conversion — like True Shooting in NBA
 * Scale: 0–100
 */
export function goalThreatScore(p: PlayerWithStats): number | null {
  if (!p.expected_goals || !p.minutes_played || p.minutes_played < 90) return null
  const xgP90 = per90(p.expected_goals, p.minutes_played)!
  const shotAcc = p.shots_on_target && p.total_shots ? p.shots_on_target / p.total_shots : 0.5
  const conversion = p.goals && p.total_shots ? p.goals / p.total_shots : 0
  return Math.min(100, (xgP90 * 25 + shotAcc * 40 + conversion * 35) * 10)
}

/**
 * Creative Output Rating (COR)
 * Measures chance creation: xA + key passes + big chances created per 90
 * Scale: 0–100
 */
export function creativeOutputRating(p: PlayerWithStats): number | null {
  if (!p.minutes_played || p.minutes_played < 90) return null
  const xaP90 = per90(p.expected_assists, p.minutes_played) ?? 0
  const kpP90 = per90(p.key_passes, p.minutes_played) ?? 0
  const bccP90 = per90(p.big_chances_created, p.minutes_played) ?? 0
  return Math.min(100, (xaP90 * 30 + kpP90 * 8 + bccP90 * 15) * 10)
}

/**
 * Defensive Impact Score (DIS)
 * Tackles won + interceptions + clearances + ball recoveries per 90
 * Scale: 0–100
 */
export function defensiveImpactScore(p: PlayerWithStats): number | null {
  if (!p.minutes_played || p.minutes_played < 90) return null
  const twP90 = per90(p.tackles_won, p.minutes_played) ?? 0
  const intP90 = per90(p.interceptions, p.minutes_played) ?? 0
  const clrP90 = per90(p.clearances, p.minutes_played) ?? 0
  const brP90 = per90(p.ball_recovery, p.minutes_played) ?? 0
  return Math.min(100, (twP90 * 15 + intP90 * 12 + clrP90 * 8 + brP90 * 10) * 5)
}

/**
 * Progressive Ball Carrier (PBC)
 * Dribbles + touches in final third + passes in final third per 90
 * Scale: 0–100
 */
export function progressiveBallCarrier(p: PlayerWithStats): number | null {
  if (!p.minutes_played || p.minutes_played < 90) return null
  const dribP90 = per90(p.successful_dribbles, p.minutes_played) ?? 0
  const fp90 = per90(p.accurate_final_third_passes, p.minutes_played) ?? 0
  return Math.min(100, (dribP90 * 20 + fp90 * 5) * 5)
}

/**
 * Overall TalentLens Score
 * Weighted by position
 */
export function talentLensScore(p: PlayerWithStats): number | null {
  const gts = goalThreatScore(p)
  const cor = creativeOutputRating(p)
  const dis = defensiveImpactScore(p)
  const pbc = progressiveBallCarrier(p)

  const pos = p.position?.toUpperCase()

  if (pos === 'G') {
    // Goalkeepers — rating based
    return p.rating ? Math.min(100, (p.rating - 5) * 20) : null
  }

  if (pos === 'D') {
    // Defenders — defense heavy
    if (!dis) return null
    return Math.min(100,
      (dis ?? 0) * 0.5 +
      (cor ?? 0) * 0.2 +
      (pbc ?? 0) * 0.3
    )
  }

  if (pos === 'M') {
    // Midfielders — balanced
    if (!cor && !dis) return null
    return Math.min(100,
      (gts ?? 0) * 0.2 +
      (cor ?? 0) * 0.35 +
      (dis ?? 0) * 0.25 +
      (pbc ?? 0) * 0.2
    )
  }

  // Forwards — attack heavy
  if (!gts) return null
  return Math.min(100,
    (gts ?? 0) * 0.5 +
    (cor ?? 0) * 0.3 +
    (pbc ?? 0) * 0.2
  )
}
