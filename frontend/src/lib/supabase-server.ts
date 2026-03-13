import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Server-side Supabase client.
// Prefers the non-public env vars (SUPABASE_URL / SUPABASE_ANON_KEY) so the
// key is never bundled into client JS. Falls back to NEXT_PUBLIC_* so existing
// .env.local files work without changes.

let _client: SupabaseClient | null = null

export function getSupabaseServer(): SupabaseClient {
  if (_client) return _client

  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error(
      'Missing Supabase env vars. Set SUPABASE_URL + SUPABASE_ANON_KEY (or the NEXT_PUBLIC_ equivalents) in .env.local.',
    )
  }

  _client = createClient(url, key)
  return _client
}
