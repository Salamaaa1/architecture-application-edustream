import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password } = body

    if (!password) {
      return NextResponse.json({ error: 'Mot de passe administrateur requis' }, { status: 400 })
    }

    const springRes = await fetch(`${BACKEND_URL}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email || 'admin@edustream.ma', password }),
    })

    const data = await springRes.json()
    if (!springRes.ok) {
      return NextResponse.json({ error: data.error || 'Mot de passe administrateur invalide' }, { status: springRes.status })
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur serveur lors de la connexion admin' },
      { status: 500 }
    )
  }
}
