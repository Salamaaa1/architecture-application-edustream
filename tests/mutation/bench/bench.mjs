#!/usr/bin/env node
// Benchmark : lance successivement le moteur maison et Stryker, mesure la duree de chacun,
// puis appelle compare.mjs.   Usage : npm run bench:mutation
// Ne lancez AUCUN autre test pendant l'execution (les sources sont modifiees temporairement).
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
const reportsDir = path.join(root, 'tests/mutation/reports')
fs.mkdirSync(reportsDir, { recursive: true })
const run = (label, cmd) => {
  console.log(`\n>>> ${label}\n>>> ${cmd}\n`)
  const t0 = Date.now()
  const r = spawnSync(cmd, { cwd: root, shell: true, stdio: 'inherit' })
  const sec = Math.round((Date.now() - t0) / 1000)
  console.log(`\n>>> ${label} termine en ${sec} s (code ${r.status})`)
  return { sec, status: r.status }
}
const skipCustom = process.argv.includes('--skip-custom')
const skipStryker = process.argv.includes('--skip-stryker')
const timingFile = path.join(reportsDir, 'bench-timing.json')
const timing = fs.existsSync(timingFile) ? JSON.parse(fs.readFileSync(timingFile, 'utf8')) : {}

if (!skipCustom) {
  const c = run('Moteur maison (tour 2, sans mutants equivalents)', 'node tests/mutation/run-mutation.mjs --round 2 --no-equivalents --report bench-custom.json')
  timing.customSec = c.sec
}
if (!skipStryker) {
  const s = run('Stryker Mutator', 'npx stryker run')
  timing.strykerSec = s.sec
  timing.strykerStatus = s.status
}
timing.machine = { node: process.version, platform: process.platform }
fs.writeFileSync(timingFile, JSON.stringify(timing, null, 2))
run('Comparaison', 'node tests/mutation/bench/compare.mjs')
