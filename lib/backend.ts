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

// Health check du canary : on ne l'interroge qu'une fois toutes les HEALTH_TTL_MS,
// et on ne l'attend pas plus de HEALTH_TIMEOUT_MS. Si le canary est en panne, les
// visiteurs qui lui etaient destines sont servis par le stable (repli automatique).
const HEALTH_TTL_MS = 10_000
const HEALTH_TIMEOUT_MS = 1_500

let canaryHealth: { ok: boolean; at: number } | null = null
let canaryProbe: Promise<boolean> | null = null

async function isCanaryHealthy(): Promise<boolean> {
  if (canaryHealth && Date.now() - canaryHealth.at < HEALTH_TTL_MS) return canaryHealth.ok

  // une seule sonde a la fois, partagee par toutes les requetes en cours
  canaryProbe ??= fetch(`${CANARY_URL}/api/version`, {
    cache: 'no-store',
    signal: AbortSignal.timeout(HEALTH_TIMEOUT_MS),
  })
    .then((res) => res.ok)
    .catch(() => false)
    .then((ok) => {
      canaryHealth = { ok, at: Date.now() }
      canaryProbe = null
      if (!ok) console.error('[canary] backend canary injoignable, repli sur le stable')
      return ok
    })
  return canaryProbe
}

export async function resolveBackend(): Promise<{
  url: string
  target: BackendTarget
  fallback: boolean
}> {
  if (!CANARY_URL) return { url: STABLE_URL, target: 'stable', fallback: false }

  const sessionId = (await cookies()).get(SESSION_COOKIE)?.value
  const unleash = await getUnleash()
  const wantsCanary = !!unleash && !!sessionId && unleash.isEnabled(CANARY_FLAG, { sessionId })

  if (!wantsCanary) return { url: STABLE_URL, target: 'stable', fallback: false }
  if (!(await isCanaryHealthy())) return { url: STABLE_URL, target: 'stable', fallback: true }
  return { url: CANARY_URL, target: 'canary', fallback: false }
}

export async function getBackendUrl(): Promise<string> {
  return (await resolveBackend()).url
}
