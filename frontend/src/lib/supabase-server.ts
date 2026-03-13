import { createClient } from '@supabase/supabase-js'

// Server-side Supabase client — uses variables WITHOUT the NEXT_PUBLIC_ prefix,
// so they are never bundled into the client-side JavaScript.
// Required env vars: SUPABASE_URL, SUPABASE_ANON_KEY
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing required environment variables: SUPABASE_URL and SUPABASE_ANON_KEY must be set.',
  )
}

export const supabaseServer = createClient(supabaseUrl, supabaseKey)
