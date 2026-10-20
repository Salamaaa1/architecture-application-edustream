import { NextResponse } from 'next/server'

import { getBackendUrl } from '@/lib/backend'

export async function GET() {
  const BACKEND_URL = await getBackendUrl()
  try {
    const springRes = await fetch(`${BACKEND_URL}/api/admin/enrollments`)
    const data = await springRes.json()

    if (!springRes.ok) {
      return NextResponse.json({ error: 'Erreur récupération des inscriptions' }, { status: springRes.status })
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 }
    )
  }
}
