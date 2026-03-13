import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Server-side Supabase client — uses variables WITHOUT the NEXT_PUBLIC_ prefix,
// so they are never bundled into the client-side JavaScript.
// Required env vars: SUPABASE_URL, SUPABASE_ANON_KEY

let _client: SupabaseClient | null = null

export function getSupabaseServer(): SupabaseClient {
  if (_client) return _client

  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error(
      'Missing required environment variables: SUPABASE_URL and SUPABASE_ANON_KEY must be set.',
    )
  }

  _client = createClient(url, key)
  return _client
}
