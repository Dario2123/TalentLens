export type PlayerStats = {
  sofascore_id: number
  name: string
  team: string
  league: string
  position: string
  nationality?: string
  age?: number | null
  height?: number | null
  market_value?: number | null
  goals?: number | null
  assists?: number | null
  expected_goals?: number | null
  expected_assists?: number | null
  big_chances_created?: number | null
  big_chances_missed?: number | null
  total_shots?: number | null
  shots_on_target?: number | null
  accurate_passes?: number | null
  total_passes?: number | null
  accurate_passes_pct?: number | null
  accurate_final_third_passes?: number | null
  key_passes?: number | null
  accurate_long_balls?: number | null
  accurate_crosses?: number | null
  total_crosses?: number | null
  successful_dribbles?: number | null
  successful_dribbles_pct?: number | null
  ground_duels_won_pct?: number | null
  aerial_duels_won_pct?: number | null
  total_duels_won?: number | null
  total_duels_won_pct?: number | null
  tackles?: number | null
  tackles_won?: number | null
  tackles_won_pct?: number | null
  interceptions?: number | null
  clearances?: number | null
  possession_lost?: number | null
  ball_recovery?: number | null
  touches?: number | null
  yellow_cards?: number | null
  red_cards?: number | null
  fouls?: number | null
  was_fouled?: number | null
  appearances?: number | null
  minutes_played?: number | null
  rating?: number | null
}

export function per90(value: number | undefined | null, minutes: number | undefined | null): number {
  if (!value || !minutes || minutes === 0) return 0
  return (value / minutes) * 90
}

export function formatValue(value: number | undefined | null, decimals: number = 2): string {
  if (value === undefined || value === null) return '—'
  return value.toFixed(decimals)
}

export function formatMillions(value: number | undefined | null): string {
  if (value === undefined || value === null) return '—'
  return `€${value.toFixed(1)}M`
}

export function calcGTS(p: PlayerStats): number {
  const min = p.minutes_played || 0
  if (min < 90) return 0
  const xgP90 = per90(p.expected_goals, min)
  const shotAcc = (p.shots_on_target || 0) / Math.max(p.total_shots || 1, 1) * 100
  const conversion = (p.goals || 0) / Math.max(p.total_shots || 1, 1) * 100
  return Math.min(100, xgP90 * 25 + shotAcc * 0.4 + conversion * 0.6)
}

export function calcCOR(p: PlayerStats): number {
  const min = p.minutes_played || 0
  if (min < 90) return 0
  const xaP90 = per90(p.expected_assists, min)
  const kpP90 = per90(p.key_passes, min)
  const bcP90 = per90(p.big_chances_created, min)
  return Math.min(100, xaP90 * 20 + kpP90 * 8 + bcP90 * 15)
}

export function calcDIS(p: PlayerStats): number {
  const min = p.minutes_played || 0
  if (min < 90) return 0
  const tacklesWonP90 = per90(p.tackles_won, min)
  const interceptionsP90 = per90(p.interceptions, min)
  const clearancesP90 = per90(p.clearances, min)
  const recoveryP90 = per90(p.ball_recovery, min)
  return Math.min(100, tacklesWonP90 * 10 + interceptionsP90 * 10 + clearancesP90 * 5 + recoveryP90 * 4)
}

export function calcPBC(p: PlayerStats): number {
  const min = p.minutes_played || 0
  if (min < 90) return 0
  const dribblesP90 = per90(p.successful_dribbles, min)
  const finalThirdP90 = per90(p.accurate_final_third_passes, min)
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

export function calcDribblesAttempted(p: PlayerStats): number {
  const success = p.successful_dribbles || 0
  const pct = p.successful_dribbles_pct || 0
  if (pct > 0) return success / (pct / 100)
  return success
}

export function calcOffPEA_p90(p: PlayerStats): number {
  const min = p.minutes_played || 0
  if (min === 0) return 0
  const shots = p.total_shots || 0
  const dribbles = calcDribblesAttempted(p)
  const keyPasses = p.key_passes || 0
  const bigChances = p.big_chances_created || 0
  const offPEA = shots + dribbles + keyPasses + bigChances
  return (offPEA / min) * 90
}

export function calcOffensiveUsageRate(player: PlayerStats, allTeamPlayers: PlayerStats[]): number {
  const playerOffPEA = calcOffPEA_p90(player)
  const teamOffPEA = allTeamPlayers.reduce((sum, p) => sum + calcOffPEA_p90(p), 0)
  if (teamOffPEA === 0) return 0
  return Math.min(100, (playerOffPEA / teamOffPEA) * 100)
}

// Kickbase scoring weights by position (from kickbase.com/de/points-table)
// Goals: GK +120, DEF +100, MF +90, ST +80
const KB_GOAL_PTS: Record<string, number> = { F: 80, M: 90, D: 100, G: 120 }
// Assists: GK +55, DEF +45, MF +35, ST +35
const KB_ASSIST_PTS: Record<string, number> = { F: 35, M: 35, D: 45, G: 55 }

// Shared stat extraction for KB calculations
function kbStats(p: PlayerStats) {
  const pos = p.position || 'M'
  return {
    goalPts: KB_GOAL_PTS[pos] ?? 90,
    assistPts: KB_ASSIST_PTS[pos] ?? 35,
    shotsOnTarget: p.shots_on_target || 0,                              // +12 Torschuss aufs Tor
    shotsOffTarget: Math.max(0, (p.total_shots || 0) - (p.shots_on_target || 0)), // +5 Torschuss vorbei/geblockt avg
    bigChancesCreated: p.big_chances_created || 0,                      // +15 Großchance kreiert
    bigChancesMissed: p.big_chances_missed || 0,                        // -15 Großchance vergeben
    keyPasses: p.key_passes || 0,                                       // +5  Torschussvorlage
    crosses: p.accurate_crosses || 0,                                   // +3  Erfolgreiche Flanke
    dribbles: p.successful_dribbles || 0,                               // +5  Gegner ausgedribbelt
    recovery: p.ball_recovery || 0,                                     // +5  Ballgewinn
    tacklesWon: p.tackles_won || 0,                                     // +5  Gewonnener Zweikampf
    interceptions: p.interceptions || 0,                                // +2  Pass abgefangen (in/außer 16er avg)
    clearances: p.clearances || 0,                                      // +4  Geklärt (in/außer 16er avg)
    longBalls: p.accurate_long_balls || 0,                              // +1  Präziser langer Pass
    finalThirdPasses: p.accurate_final_third_passes || 0,               // +1  Pass vorderes Drittel
    fouls: p.fouls || 0,                                                // -2  Foul
    yellows: p.yellow_cards || 0,                                       // -10 Gelbe Karte
    reds: p.red_cards || 0,                                             // -50 Gelb-Rot / Rote Karte
  }
}

function kbCalc(s: ReturnType<typeof kbStats>, goals: number, assists: number): number {
  return (
    goals * s.goalPts +
    assists * s.assistPts +
    s.shotsOnTarget * 12 +
    s.shotsOffTarget * 5 +
    s.bigChancesCreated * 15 +
    s.bigChancesMissed * (-15) +
    s.keyPasses * 5 +
    s.crosses * 3 +
    s.dribbles * 5 +
    s.recovery * 5 +
    s.tacklesWon * 5 +
    s.interceptions * 2 +
    s.clearances * 4 +
    s.longBalls * 1 +
    s.finalThirdPasses * 1 +
    s.fouls * (-2) +
    s.yellows * (-10) +
    s.reds * (-50)
  )
}

// Estimated Kickbase points from actual season stats
export function calcKickbasePoints(p: PlayerStats): number {
  const s = kbStats(p)
  return kbCalc(s, p.goals || 0, p.assists || 0)
}

// Expected Kickbase points based on xG/xA (what player "should have" earned)
export function calcExpectedKickbasePoints(p: PlayerStats): number {
  const s = kbStats(p)
  return kbCalc(s, p.expected_goals || 0, p.expected_assists || 0)
}

// KB Points per 90 min
export function calcKickbaseP90(p: PlayerStats): number {
  const min = p.minutes_played || 0
  if (min < 90) return 0
  return (calcKickbasePoints(p) / min) * 90
}

// Expected KB Points per 90 min
export function calcExpectedKickbaseP90(p: PlayerStats): number {
  const min = p.minutes_played || 0
  if (min < 90) return 0
  return (calcExpectedKickbasePoints(p) / min) * 90
}

// Underperformance score: positive = underperformed xG/xA (bounce-back candidate)
export function calcKickbaseUnderperformance(p: PlayerStats): number {
  return calcExpectedKickbasePoints(p) - calcKickbasePoints(p)
}
