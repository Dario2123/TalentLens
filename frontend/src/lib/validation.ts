// Input validation helpers — used by API routes to reject bad or unexpected inputs.

export const VALID_LEAGUES = [
  'Bundesliga',
  '2. Bundesliga',
  'Premier League',
  'Championship',
  'La Liga',
  'Serie A',
  'Ligue 1',
  'Eredivisie',
  'Primeira Liga',
  'Super Lig',
] as const

export type ValidLeague = (typeof VALID_LEAGUES)[number]

/**
 * Returns the league string if it is in the whitelist, otherwise null.
 * Prevents arbitrary strings from reaching the database query.
 */
export function validateLeague(league: string | null | undefined): ValidLeague | null {
  if (!league) return null
  // Length guard — a league name should never be more than 64 chars
  if (league.length > 64) return null
  return (VALID_LEAGUES as readonly string[]).includes(league)
    ? (league as ValidLeague)
    : null
}

/**
 * Asserts that `params` contains only keys from `allowed`.
 * Returns the disallowed keys (empty array = all OK).
 */
export function findUnexpectedParams(
  params: URLSearchParams,
  allowed: string[],
): string[] {
  const allowedSet = new Set(allowed)
  const unexpected: string[] = []
  Array.from(params.keys()).forEach(key => {
    if (!allowedSet.has(key)) unexpected.push(key)
  })
  return unexpected
}
