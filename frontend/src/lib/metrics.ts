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

// ---------------------------------------------------------------------------
// KICKBASE SCORING ENGINE
// Source: kickbase.com/de/points-table
//
// HOW TO ADD NEW DATA:
//   1. Add the field to PlayerStats type
//   2. Find the entry below with getValue: null
//   3. Replace null with: (p) => p.yourNewField || 0
//   That's it. The calc functions pick it up automatically.
// ---------------------------------------------------------------------------

// Position-dependent goal/assist points (handled separately from flat entries)
const KB_GOAL_PTS: Record<string, number> = { F: 80, M: 90, D: 100, G: 120 }
const KB_ASSIST_PTS: Record<string, number> = { F: 35, M: 35, D: 45, G: 55 }

export type KBEntry = {
  short_name: string        // matches kickbase CSV short_name
  name: string              // German display name
  pts: number               // points per occurrence
  getValue: ((p: PlayerStats) => number) | null  // null = data not yet available
  dataNeeded?: string       // what DB field/scraper change is needed
  note?: string             // why we map it this way (estimates, approximations)
}

// All non-goal/assist KB scoring entries.
// Entries with getValue: null are placeholders — add getValue when data arrives.
export const KB_ENTRIES: KBEntry[] = [

  // ── SHOTS ─────────────────────────────────────────────────────────────────
  { short_name: 'shot_on_target',  name: 'Torschuss (aufs Tor)',    pts: 12,  getValue: p => p.shots_on_target || 0 },
  { short_name: 'shot_near_miss',  name: 'Torschuss knapp vorbei',  pts: 10,  getValue: null, dataNeeded: 'near_miss_shots count from Sofascore' },
  { short_name: 'shot_blocked',    name: 'Torschuss geblockt',       pts: 8,   getValue: null, dataNeeded: 'blocked_shots count from Sofascore' },
  { short_name: 'shot_wide',       name: 'Torschuss weit vorbei',    pts: 5,   getValue: p => Math.max(0, (p.total_shots || 0) - (p.shots_on_target || 0)), note: 'Approximation: all off-target shots (includes near-miss and blocked)' },

  // ── CHANCES ───────────────────────────────────────────────────────────────
  { short_name: 'big_chance_created', name: 'Großchance kreiert',   pts: 15,  getValue: p => p.big_chances_created || 0 },
  { short_name: 'big_chance_missed',  name: 'Großchance vergeben',  pts: -15, getValue: p => p.big_chances_missed || 0 },

  // ── PASSING ───────────────────────────────────────────────────────────────
  { short_name: 'shot_assist',         name: 'Torschussvorlage',          pts: 5, getValue: p => p.key_passes || 0 },
  { short_name: 'accurate_long_pass',  name: 'Präziser langer Pass',      pts: 1, getValue: p => p.accurate_long_balls || 0 },
  { short_name: 'pass_final_third',    name: 'Pass vorderes Drittel',     pts: 1, getValue: p => p.accurate_final_third_passes || 0 },
  { short_name: 'pass_opponent_half',  name: 'Pass in gegnerische Hälfte',pts: 1, getValue: null, dataNeeded: 'accurate_passes_opponent_half from Sofascore' },
  { short_name: 'corner_won',          name: 'Ecke rausgeholt',           pts: 1, getValue: null, dataNeeded: 'corners_won from Sofascore' },

  // ── CROSSING ──────────────────────────────────────────────────────────────
  { short_name: 'successful_cross', name: 'Erfolgreiche Flanke',    pts: 3,  getValue: p => p.accurate_crosses || 0 },
  { short_name: 'cross_blocked',    name: 'Flanke geblockt',        pts: 2,  getValue: null, dataNeeded: 'blocked_crosses count (total_crosses - accurate_crosses is inaccurate, not all become blocked)' },

  // ── DRIBBLING ─────────────────────────────────────────────────────────────
  { short_name: 'opponent_dribbled', name: 'Gegner ausgedribbelt',  pts: 5,  getValue: p => p.successful_dribbles || 0 },
  { short_name: 'dribbled_past',     name: 'Ausgespielt worden',    pts: -3, getValue: null, dataNeeded: 'times_dribbled_past from Sofascore' },

  // ── DEFENSE ───────────────────────────────────────────────────────────────
  { short_name: 'duel_won',              name: 'Gewonnener Zweikampf',          pts: 5,  getValue: p => p.tackles_won || 0 },
  { short_name: 'ball_recovery',         name: 'Ballgewinn',                    pts: 5,  getValue: p => p.ball_recovery || 0 },
  { short_name: 'interception_box',      name: 'Pass abgefangen (im 16er)',     pts: 3,  getValue: p => Math.round((p.interceptions || 0) * 0.3), note: '~30% of interceptions estimated in box' },
  { short_name: 'interception_outside_box', name: 'Pass abgefangen (außerhalb)',pts: 1,  getValue: p => Math.round((p.interceptions || 0) * 0.7), note: '~70% of interceptions estimated outside box' },
  { short_name: 'clearance_box',         name: 'Geklärt (im 16er)',             pts: 5,  getValue: p => Math.round((p.clearances || 0) * 0.4), note: '~40% of clearances estimated in box' },
  { short_name: 'clearance_outside_box', name: 'Geklärt (außerhalb 16er)',      pts: 3,  getValue: p => Math.round((p.clearances || 0) * 0.6), note: '~60% of clearances estimated outside box' },
  { short_name: 'aerial_duel_won',       name: 'Luftzweikampf gewonnen',        pts: 3,  getValue: null, dataNeeded: 'aerial_duels_won count (have pct, need total aerial duels count)' },
  { short_name: 'aerial_duel_lost',      name: 'Luftzweikampf verloren',        pts: -1, getValue: null, dataNeeded: 'aerial_duels_lost count (have pct, need total aerial duels count)' },
  { short_name: 'last_man_tackle',       name: 'Zweikampf als letzter Mann',    pts: 15, getValue: null, dataNeeded: 'last_man_tackles from Sofascore (rare, high value)' },
  { short_name: 'goal_line_clearance',   name: 'Auf der Linie geklärt',         pts: 15, getValue: null, dataNeeded: 'goal_line_clearances from Sofascore (rare, high value)' },

  // ── PENALTIES ─────────────────────────────────────────────────────────────
  { short_name: 'penalty_won',      name: 'Elfmeter rausgeholt',    pts: 30,  getValue: null, dataNeeded: 'penalties_won from Sofascore' },
  { short_name: 'penalty_conceded', name: 'Elfmeter verschuldet',   pts: -45, getValue: null, dataNeeded: 'penalties_conceded from Sofascore' },
  { short_name: 'penalty_missed',   name: 'Elfmeter verschossen',   pts: -60, getValue: null, dataNeeded: 'penalties_missed from Sofascore' },

  // ── GAME RESULTS (per player) ─────────────────────────────────────────────
  { short_name: 'match_won',       name: 'Spiel gewonnen',         pts: 15,  getValue: null, dataNeeded: 'wins_played count per player (games played × win rate from team data)' },
  { short_name: 'match_lost',      name: 'Spiel verloren',         pts: -15, getValue: null, dataNeeded: 'losses_played count per player' },
  { short_name: 'starting_eleven', name: 'Startelf',               pts: 5,   getValue: null, dataNeeded: 'starts count from Sofascore (separate from appearances)' },
  { short_name: 'substitution',    name: 'Eingewechselt',          pts: 2,   getValue: null, dataNeeded: 'sub_appearances count (appearances - starts)' },
  { short_name: 'minutes_bonus',   name: 'Minutenbonus',           pts: 1,   getValue: null, dataNeeded: 'per-game minutes bands (e.g. 1pt per 15min played)' },

  // ── CLEAN SHEETS (per player) ─────────────────────────────────────────────
  { short_name: 'clean_sheet_def', name: 'Zu null gespielt (ABW)', pts: 3,   getValue: null, dataNeeded: 'clean_sheets count per player from match data' },
  { short_name: 'clean_sheet_mid', name: 'Zu null gespielt (MF)',  pts: 2,   getValue: null, dataNeeded: 'clean_sheets count per player from match data' },
  { short_name: 'clean_sheet_fwd', name: 'Zu null gespielt (ANG)', pts: 1,   getValue: null, dataNeeded: 'clean_sheets count per player from match data' },
  { short_name: 'goal_conceded',   name: 'Tor kassiert',           pts: -5,  getValue: null, dataNeeded: 'goals_conceded per player from match data (outfield: when on pitch)' },

  // ── ERRORS ────────────────────────────────────────────────────────────────
  { short_name: 'error_leading_goal',  name: 'Fehler vor Gegentor',   pts: -45, getValue: null, dataNeeded: 'errors_leading_to_goal from Sofascore' },
  { short_name: 'error_before_shot',   name: 'Fehler vor Torschuss',  pts: -15, getValue: null, dataNeeded: 'errors_leading_to_shot from Sofascore' },
  { short_name: 'own_goal',            name: 'Eigentor',              pts: -60, getValue: null, dataNeeded: 'own_goals from Sofascore' },

  // ── NEGATIVE ACTIONS ──────────────────────────────────────────────────────
  { short_name: 'ball_loss',     name: 'Ballverlust',       pts: -1, getValue: p => p.possession_lost || 0 },
  { short_name: 'foul',         name: 'Foul',              pts: -2, getValue: p => p.fouls || 0 },
  { short_name: 'offside',      name: 'Abseits',           pts: -3, getValue: null, dataNeeded: 'offsides count from Sofascore' },
  { short_name: 'yellow_card',  name: 'Gelbe Karte',       pts: -10, getValue: p => p.yellow_cards || 0 },
  { short_name: 'second_yellow_card', name: 'Gelb-Rot Karte', pts: -50, getValue: p => p.red_cards || 0 },
]

// Derived: how many entries are currently mapped vs total
export const KB_COVERAGE = {
  mapped: KB_ENTRIES.filter(e => e.getValue !== null).length,
  total: KB_ENTRIES.length,
}

// ---------------------------------------------------------------------------
// Calculation — goals/assists handled separately (position-dependent)
// ---------------------------------------------------------------------------

function kbSum(p: PlayerStats): number {
  return KB_ENTRIES.reduce((sum, entry) => {
    if (!entry.getValue) return sum
    return sum + entry.pts * entry.getValue(p)
  }, 0)
}

// Estimated Kickbase points from actual season stats
export function calcKickbasePoints(p: PlayerStats): number {
  const pos = p.position || 'M'
  return (
    (p.goals || 0) * (KB_GOAL_PTS[pos] ?? 90) +
    (p.assists || 0) * (KB_ASSIST_PTS[pos] ?? 35) +
    kbSum(p)
  )
}

// Expected Kickbase points — swaps goals→xG and assists→xA, rest identical
export function calcExpectedKickbasePoints(p: PlayerStats): number {
  const pos = p.position || 'M'
  return (
    (p.expected_goals || 0) * (KB_GOAL_PTS[pos] ?? 90) +
    (p.expected_assists || 0) * (KB_ASSIST_PTS[pos] ?? 35) +
    kbSum(p)
  )
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

// Underperformance: positive = underperformed xG/xA (bounce-back candidate)
export function calcKickbaseUnderperformance(p: PlayerStats): number {
  return calcExpectedKickbasePoints(p) - calcKickbasePoints(p)
}
