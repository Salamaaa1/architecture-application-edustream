import { NextResponse } from 'next/server'
import { resolveBackend } from '@/lib/backend'

// Indique quel backend (stable ou canary) sert ce visiteur, et sa version.
export async function GET() {
  const { url, target } = await resolveBackend()
  let backendVersion: string | null = null
  try {
    const res = await fetch(`${url}/api/version`, { cache: 'no-store' })
    if (res.ok) backendVersion = (await res.json()).version
  } catch {}

  return NextResponse.json(
    { target, backendVersion },
    { headers: { 'X-Backend': target, 'Cache-Control': 'no-store' } }
  )
}
