import { cookies } from 'next/headers'
import { initialize, Unleash, UnleashEvents } from 'unleash-client'

// Canary : le flag Unleash "backend-canary" (strategie Gradual rollout, stickiness sessionId)
// decide si un visiteur est servi par le backend canary ou par le backend stable.
export const CANARY_FLAG = 'backend-canary'
export const SESSION_COOKIE = 'edustream_sid'

const STABLE_URL = process.env.BACKEND_URL || 'http://localhost:8080'
const CANARY_URL = process.env.BACKEND_CANARY_URL

let clientPromise: Promise<Unleash | null> | null = null

function getUnleash(): Promise<Unleash | null> {
  const url = process.env.UNLEASH_URL
  const token = process.env.UNLEASH_API_TOKEN
  if (!url || !token) return Promise.resolve(null)

  clientPromise ??= new Promise((resolve) => {
    const client = initialize({
      url,
      appName: 'edustream-frontend',
      customHeaders: { Authorization: token },
      refreshInterval: 5000,
      metricsInterval: 10000,
    })
    client.on(UnleashEvents.Error, (err: Error) => console.error('[unleash]', err.message))
    // Si Unleash ne repond pas, on n'attend pas : le flag vaut false, donc backend stable.
    const timer = setTimeout(() => resolve(client), 3000)
    client.once(UnleashEvents.Synchronized, () => {
      clearTimeout(timer)
      resolve(client)
    })
  })
  return clientPromise
}

export type BackendTarget = 'stable' | 'canary'

export async function resolveBackend(): Promise<{ url: string; target: BackendTarget }> {
  if (!CANARY_URL) return { url: STABLE_URL, target: 'stable' }

  const sessionId = (await cookies()).get(SESSION_COOKIE)?.value
  const unleash = await getUnleash()
  const canary = !!unleash && !!sessionId && unleash.isEnabled(CANARY_FLAG, { sessionId })

  return canary ? { url: CANARY_URL, target: 'canary' } : { url: STABLE_URL, target: 'stable' }
}

export async function getBackendUrl(): Promise<string> {
  return (await resolveBackend()).url
}
