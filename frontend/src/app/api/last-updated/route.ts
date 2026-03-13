import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

// GET /api/last-updated
// Returns the most recent updated_at timestamp from player_stats.
export async function GET() {
  const { data, error } = await supabaseServer
    .from('player_stats')
    .select('updated_at')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) {
    return NextResponse.json({ updatedAt: null })
  }

  return NextResponse.json({ updatedAt: data.updated_at })
}
