export type PlayerStats = {
  sofascore_id: number
  name: string
  team: string
  league: string
  position: string
  nationality?: string
  age?: number
  height?: number
  market_value?: number
  goals?: number
  assists?: number
  expectedGoals?: number
  expectedAssists?: number
  bigChancesCreated?: number
  bigChancesMissed?: number
  totalShots?: number
  shotsOnTarget?: number
  accuratePasses?: number
  totalPasses?: number
  accuratePassesPercentage?: number
  accurateFinalThirdPasses?: number
  keyPasses?: number
  accurateLongBalls?: number
  totalLongBalls?: number
  accurateCrosses?: number
  totalCross?: number
  successfulDribbles?: number
  successfulDribblesPercentage?: number
  groundDuelsWon?: number
  groundDuelsWonPercentage?: number
  aerialDuelsWon?: number
  aerialDuelsWonPercentage?: number
  totalDuelsWon?: number
  totalDuelsWonPercentage?: number
  dribbledPast?: number
  tackles?: number
  tacklesWon?: number
  tacklesWonPercentage?: number
  interceptions?: number
  clearances?: number
  blockedShots?: number
  possessionLost?: number
  dispossessed?: number
  ballRecovery?: number
  touches?: number
  yellowCards?: number
  redCards?: number
  fouls?: number
  wasFouled?: number
  appearances?: number
  minutesPlayed?: number
  rating?: number
}

export function per90(value: number | undefined | null, minutes: number | undefined | null): number {
  if (!value || !minutes || minutes === 0) return 0
  return (value / minutes) * 90
}

export function formatValue(value: number | undefined): string {
  if (value === undefined || value === null) return '—'
  return value.toFixed(2)
}

export function formatMillions(value: number | undefined): string {
  if (value === undefined || value === null) return '—'
  return `€${value.toFixed(1)}M`
}

// ─── Individual Metric Scores ────────────────────────────────────────────────

export function calcGTS(p: PlayerStats): number {
  const min = p.minutesPlayed || 0
  if (min < 90) return 0
  const xgP90 = per90(p.expectedGoals, min)
  const shotAcc = (p.shotsOnTarget || 0) / Math.max(p.totalShots || 1, 1) * 100
  const conversion = (p.goals || 0) / Math.max(p.totalShots || 1, 1) * 100
  return Math.min(100, xgP90 * 25 + shotAcc * 0.4 + conversion * 0.6)
}

export function calcCOR(p: PlayerStats): number {
  const min = p.minutesPlayed || 0
  if (min < 90) return 0
  const xaP90 = per90(p.expectedAssists, min)
  const kpP90 = per90(p.keyPasses, min)
  const bcP90 = per90(p.bigChancesCreated, min)
  return Math.min(100, xaP90 * 20 + kpP90 * 8 + bcP90 * 15)
}

export function calcDIS(p: PlayerStats): number {
  const min = p.minutesPlayed || 0
  if (min < 90) return 0
  const tacklesWonP90 = per90(p.tacklesWon, min)
  const interceptionsP90 = per90(p.interceptions, min)
  const clearancesP90 = per90(p.clearances, min)
  const recoveryP90 = per90(p.ballRecovery, min)
  return Math.min(100, tacklesWonP90 * 10 + interceptionsP90 * 10 + clearancesP90 * 5 + recoveryP90 * 4)
}

export function calcPBC(p: PlayerStats): number {
  const min = p.minutesPlayed || 0
  if (min < 90) return 0
  const dribblesP90 = per90(p.successfulDribbles, min)
  const finalThirdP90 = per90(p.accurateFinalThirdPasses, min)
  return Math.min(100, dribblesP90 * 8 + finalThirdP90 * 2.5)
}

export function calcTLS(p: PlayerStats): number {
  const gts = calcGTS(p)
  const cor = calcCOR(p)
  const dis = calcDIS(p)
  const pbc = calcPBC(p)
  const pos = p.position || 'M'
  if (pos === 'F') return gts * 0.5 + cor * 0.3 + pbc * 0.2
  if (pos === 'M') return gts * 0.2 + cor * 0.35 + dis * 0.25 + pbc * 0.2
  if (pos === 'D') return dis * 0.5 + cor * 0.2 + pbc * 0.3
  return (p.rating || 6) * 10
}

// ─── Offensive Usage Rate ─────────────────────────────────────────────────────
// Inspired by NBA Usage Rate — % of team's offensive actions a player uses
// Offensive PEA = totalShots + dribblesAttempted + keyPasses + bigChancesCreated

export function calcDribblesAttempted(p: PlayerStats): number {
  const success = p.successfulDribbles || 0
  const pct = p.successfulDribblesPercentage || 0
  if (pct > 0) return success / (pct / 100)
  return success
}

export function calcOffPEA_p90(p: PlayerStats): number {
  const min = p.minutesPlayed || 0
  if (min === 0) return 0
  const shots = p.totalShots || 0
  const dribbles = calcDribblesAttempted(p)
  const keyPasses = p.keyPasses || 0
  const bigChances = p.bigChancesCreated || 0
  const offPEA = shots + dribbles + keyPasses + bigChances
  return (offPEA / min) * 90
}

export function calcOffensiveUsageRate(player: PlayerStats, allTeamPlayers: PlayerStats[]): number {
  const playerOffPEA = calcOffPEA_p90(player)
  const teamOffPEA = allTeamPlayers.reduce((sum, p) => sum + calcOffPEA_p90(p), 0)
  if (teamOffPEA === 0) return 0
  return Math.min(100, (playerOffPEA / teamOffPEA) * 100)
}
