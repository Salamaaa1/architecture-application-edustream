import { NextRequest, NextResponse } from 'next/server'

const SESSION_COOKIE = 'edustream_sid'

// Donne a chaque visiteur un identifiant stable : Unleash s'en sert pour
// garder le meme visiteur sur la meme version (stable ou canary).
export function proxy(request: NextRequest) {
  if (request.cookies.has(SESSION_COOKIE)) return NextResponse.next()

  const sessionId = crypto.randomUUID()
  request.cookies.set(SESSION_COOKIE, sessionId)
  const response = NextResponse.next({ request: { headers: request.headers } })
  response.cookies.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  })
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|svg|ico)$).*)'],
}
