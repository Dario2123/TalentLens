import { NextRequest, NextResponse } from 'next/server'

// In-memory sliding-window rate limiter.
// NOTE: This resets on server restart. For multi-instance deployments,
// replace with a shared store (e.g. Upstash Redis).
const rateLimitMap = new Map<string, number[]>()

const WINDOW_MS = 60_000 // 1 minute
const MAX_REQUESTS = 60  // 60 requests per IP per minute

function getClientIp(req: NextRequest): string {
  // Trust X-Forwarded-For only if behind a trusted proxy (e.g. Vercel, Cloudflare).
  // Take only the first (leftmost) address to prevent IP spoofing.
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return req.headers.get('x-real-ip') ?? '127.0.0.1'
}

// Periodically clean up stale entries to prevent unbounded memory growth.
let lastCleanup = Date.now()
function maybeCleanup() {
  const now = Date.now()
  if (now - lastCleanup < 5 * 60_000) return // clean every 5 minutes
  lastCleanup = now
  const cutoff = now - WINDOW_MS
  Array.from(rateLimitMap.entries()).forEach(([ip, timestamps]) => {
    const recent = timestamps.filter(t => t > cutoff)
    if (recent.length === 0) rateLimitMap.delete(ip)
    else rateLimitMap.set(ip, recent)
  })
}

export function middleware(req: NextRequest) {
  maybeCleanup()

  const ip = getClientIp(req)
  const now = Date.now()
  const windowStart = now - WINDOW_MS

  const timestamps = rateLimitMap.get(ip) ?? []
  const recent = timestamps.filter(t => t > windowStart)

  if (recent.length >= MAX_REQUESTS) {
    // Retry-After: seconds until the oldest request in the window expires
    const retryAfter = Math.ceil((recent[0] + WINDOW_MS - now) / 1000)
    return new NextResponse(
      JSON.stringify({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please slow down.',
        retryAfter,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(retryAfter),
          'X-RateLimit-Limit': String(MAX_REQUESTS),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil((recent[0] + WINDOW_MS) / 1000)),
        },
      },
    )
  }

  recent.push(now)
  rateLimitMap.set(ip, recent)

  const remaining = MAX_REQUESTS - recent.length
  const response = NextResponse.next()
  response.headers.set('X-RateLimit-Limit', String(MAX_REQUESTS))
  response.headers.set('X-RateLimit-Remaining', String(remaining))
  response.headers.set(
    'X-RateLimit-Reset',
    String(Math.ceil((recent[0] + WINDOW_MS) / 1000)),
  )
  return response
}

// Apply rate limiting only to API routes.
export const config = {
  matcher: '/api/:path*',
}
