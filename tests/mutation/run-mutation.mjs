#!/usr/bin/env node
// Moteur de tests de mutation d'EduStream — sans dépendance (Node >= 18).
//
//   node tests/mutation/run-mutation.mjs --round 1     # tests unitaires initiaux
//   node tests/mutation/run-mutation.mjs --round 2     # + tests « tueurs »
//
// Options : --config <fichier>  --only <texte du chemin>  --limit <n>
//           --list (liste les mutants sans les exécuter)
//           --report <nom.json>  (nom du rapport JSON ; défaut : round-<n>.json)
//           --equivalents / --no-equivalents  (ignorer ou non les mutants équivalents)
//
// Pour chaque mutant : le source est modifié, la commande de test est lancée,
// puis le source d'origine est TOUJOURS restauré (finally + signaux + fichier .mutation.bak).

import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { pathToFileURL, fileURLToPath } from 'node:url'
import { generateMutants, mutantKey } from './engine/operators.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))

// ---------- arguments ----------
const argv = process.argv.slice(2)
const opt = (name, def) => {
  const i = argv.indexOf(`--${name}`)
  return i >= 0 ? argv[i + 1] : def
}
const flag = (name) => argv.includes(`--${name}`)
const round = Number(opt('round', '1'))
const configPath = path.resolve(opt('config', path.join(here, 'mutation.config.mjs')))
const only = opt('only', '')
const reportName = opt('report', `round-${round}.json`)
const limit = Number(opt('limit', '0'))
const listOnly = flag('list')
const useEquivalents = flag('equivalents') || (round >= 2 && !flag('no-equivalents'))

const config = (await import(pathToFileURL(configPath).href)).default
const root = path.resolve(path.dirname(configPath), config.root ?? '../..')
const reportsDir = path.join(here, 'reports')
fs.mkdirSync(reportsDir, { recursive: true })

// Vérification syntaxique optionnelle des mutants (TypeScript du projet, s'il est installé)
let ts = null
try {
  ts = createRequire(path.join(root, 'package.json'))('typescript')
} catch {
  /* sans TypeScript : un mutant invalide sera simplement considéré comme tué */
}
const isValidSyntax = (code, file) => {
  if (!ts) return true
  const res = ts.transpileModule(code, {
    fileName: file,
    reportDiagnostics: true,
    compilerOptions: { target: 'ES2022', module: 'ESNext', jsx: 'preserve' },
  })
  return !(res.diagnostics && res.diagnostics.length)
}

// ---------- sécurité : restauration du source ----------
const BAK = '.mutation.bak'
const active = new Set()
const restoreAll = () => {
  for (const abs of active) {
    try {
      fs.copyFileSync(abs + BAK, abs)
      fs.unlinkSync(abs + BAK)
    } catch {
      /* déjà restauré */
    }
  }
  active.clear()
}
process.on('exit', restoreAll)
for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => {
    restoreAll()
    process.exit(130)
  })
}
for (const t of config.targets) {
  const abs = path.join(root, t.file)
  if (fs.existsSync(abs + BAK)) {
    console.log(`! Reste d'une exécution interrompue : restauration de ${t.file}`)
    fs.copyFileSync(abs + BAK, abs)
    fs.unlinkSync(abs + BAK)
  }
}

// ---------- exécution des tests ----------
const testsFor = (target) => {
  const list = [...target.tests]
  if (round >= 2) for (const k of target.killers ?? []) if (fs.existsSync(path.join(root, k))) list.push(k)
  return list
}
const runTests = (target) => {
  const cmd = config.testCommand.replace('{tests}', testsFor(target).join(' '))
  const r = spawnSync(cmd, {
    cwd: root,
    shell: true,
    encoding: 'utf8',
    timeout: config.timeoutMs ?? 120000,
    env: { ...process.env, CI: '1', FORCE_COLOR: '0' },
  })
  return { status: r.status, timedOut: r.error?.code === 'ETIMEDOUT' || r.signal === 'SIGTERM', output: (r.stdout ?? '') + (r.stderr ?? '') }
}

// ---------- mutants équivalents connus ----------
const equivalentsFile = path.join(here, 'equivalents.json')
const equivalents = new Map()
if (useEquivalents && fs.existsSync(equivalentsFile)) {
  for (const e of JSON.parse(fs.readFileSync(equivalentsFile, 'utf8'))) equivalents.set(e.key, e.reason)
}

// ---------- génération ----------
const plan = []
for (const target of config.targets) {
  if (only && !target.file.includes(only)) continue
  const abs = path.join(root, target.file)
  const src = fs.readFileSync(abs, 'utf8')
  const seen = new Map() // deux mutants peuvent avoir la même ligne de code : on numérote les doublons
  for (const m of generateMutants(src)) {
    const base = mutantKey(target.file, src, m)
    const n = seen.get(base) ?? 0
    seen.set(base, n + 1)
    plan.push({ target, abs, src, m, key: `${base}#${n}` })
  }
}
const selected = limit > 0 ? plan.slice(0, limit) : plan

console.log(`EduStream — tests de mutation, tour ${round} : ${selected.length} mutants sur ${config.targets.length} fichier(s) cible(s)`)
if (listOnly) {
  const byOp = {}
  for (const p of selected) byOp[p.m.operator] = (byOp[p.m.operator] ?? 0) + 1
  console.table(byOp)
  process.exit(0)
}

// ---------- test de référence ----------
for (const target of config.targets) {
  if (only && !target.file.includes(only)) continue
  const base = runTests(target)
  if (base.status !== 0) {
    console.error(`\nLes tests ne passent pas AVANT mutation (${target.file}). Corrigez-les d'abord.\n`)
    console.error(base.output.split('\n').slice(-25).join('\n'))
    process.exit(2)
  }
}
console.log('Test de référence : OK (tous les tests passent sur le code non muté)\n')

// ---------- campagne ----------
const results = []
const started = Date.now()
selected.forEach((p, index) => {
  const { target, abs, src, m, key } = p
  const rel = target.file
  const base = { file: rel, line: m.line, operator: m.operator, original: m.original, replacement: m.replacement, key, lineText: src.split('\n')[m.line - 1].trim() }
  let status
  let reason
  if (equivalents.has(key)) {
    status = 'equivalent'
    reason = equivalents.get(key)
  } else {
    const mutated = src.slice(0, m.start) + m.replacement + src.slice(m.end)
    if (!isValidSyntax(mutated, rel)) {
      status = 'invalid'
    } else {
      fs.copyFileSync(abs, abs + BAK)
      active.add(abs)
      try {
        fs.writeFileSync(abs, mutated)
        const r = runTests(target)
        status = r.timedOut ? 'timeout' : r.status === 0 ? 'survived' : 'killed'
      } finally {
        fs.copyFileSync(abs + BAK, abs)
        fs.unlinkSync(abs + BAK)
        active.delete(abs)
      }
    }
  }
  results.push({ ...base, status, reason })
  const tag = { killed: 'TUÉ      ', timeout: 'TUÉ(time)', survived: 'SURVIVANT', equivalent: 'ÉQUIVAL. ', invalid: 'INVALIDE ' }[status]
  console.log(`[${String(index + 1).padStart(3)}/${selected.length}] ${tag} ${rel}:${m.line}  ${m.operator.padEnd(20)} ${JSON.stringify(m.original)} → ${JSON.stringify(m.replacement)}`)
})

// ---------- synthèse ----------
const score = (rows) => {
  const killed = rows.filter((r) => r.status === 'killed' || r.status === 'timeout').length
  const survived = rows.filter((r) => r.status === 'survived').length
  const equivalent = rows.filter((r) => r.status === 'equivalent').length
  const invalid = rows.filter((r) => r.status === 'invalid').length
  const valid = killed + survived
  return { total: rows.length, killed, survived, equivalent, invalid, score: valid ? (100 * killed) / valid : 100 }
}
const perFile = {}
for (const r of results) (perFile[r.file] ??= []).push(r)
const summary = { round, date: new Date().toISOString(), durationSec: Math.round((Date.now() - started) / 1000), global: score(results), files: Object.fromEntries(Object.entries(perFile).map(([f, rows]) => [f, score(rows)])) }
const survivors = results.filter((r) => r.status === 'survived')

console.log('\n================ SYNTHÈSE ================')
console.log(`Tour ${round} — score de mutation : ${summary.global.score.toFixed(1)} %  (tués ${summary.global.killed}, survivants ${summary.global.survived}, équivalents ${summary.global.equivalent}, invalides ${summary.global.invalid})`)
for (const [f, s] of Object.entries(summary.files)) {
  console.log(`  ${f.padEnd(40)} ${s.score.toFixed(1).padStart(5)} %   (${s.killed} tués / ${s.survived} survivants / ${s.equivalent} équivalents)`)
}
if (survivors.length) {
  console.log('\nMutants SURVIVANTS (le code a été modifié mais aucun test n\'a échoué) :')
  for (const s of survivors) console.log(`  ${s.file}:${s.line}  [${s.operator}]  ${JSON.stringify(s.original)} → ${JSON.stringify(s.replacement)}    ${s.lineText}`)
}

fs.writeFileSync(path.join(reportsDir, reportName), JSON.stringify({ summary, results }, null, 2))
console.log(`\nRapport JSON : tests/mutation/reports/${reportName}`)
process.exit(0)
