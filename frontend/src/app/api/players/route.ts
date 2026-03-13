import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { validateLeague, findUnexpectedParams } from '@/lib/validation'

// GET /api/players?league=<ValidLeague>
// Returns all players with their stats for the requested league.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)

  // Reject unexpected query parameters (schema enforcement)
  const unexpected = findUnexpectedParams(searchParams, ['league'])
  if (unexpected.length > 0) {
    return NextResponse.json(
      { error: `Bad Request: unexpected parameter(s): ${unexpected.join(', ')}` },
      { status: 400 },
    )
  }

  // Validate league against whitelist (type check + length limit inside validateLeague)
  const league = validateLeague(searchParams.get('league'))
  if (!league) {
    return NextResponse.json(
      { error: 'Bad Request: missing or invalid "league" parameter' },
      { status: 400 },
    )
  }

  const { data, error } = await supabaseServer
    .from('players')
    .select('*, player_stats(*)')
    .eq('league', league)

  if (error) {
    // Do not expose internal Supabase error details to the client
    console.error('[/api/players] Supabase error:', error.message)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }

  return NextResponse.json({ data })
}
