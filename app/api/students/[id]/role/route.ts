import { NextRequest, NextResponse } from 'next/server'

import { getBackendUrl } from '@/lib/backend'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const BACKEND_URL = await getBackendUrl()
  try {
    const { id } = await params
    const body = await req.json()
    const { role } = body

    const springRes = await fetch(`${BACKEND_URL}/api/students/${id}/role`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: role || 'ADMIN' }),
    })

    const data = await springRes.json()
    if (!springRes.ok) {
      return NextResponse.json({ error: data.error || 'Erreur mise à jour rôle' }, { status: springRes.status })
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 }
    )
  }
}
