#!/usr/bin/env node
// Compare le moteur de mutation maison et Stryker sur les MEMES fichiers.
//   node tests/mutation/bench/compare.mjs
// Entrees : tests/mutation/reports/bench-custom.json   (moteur maison, tour 2 sans equivalents)
//           reports/mutation/mutation.json              (Stryker)
//           tests/mutation/reports/bench-timing.json    (durees, ecrit par bench.mjs ; optionnel)
// Sorties : tests/mutation/reports/benchmark.json et benchmark_table.tex (inclus dans le rapport).
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
const reportsDir = path.join(root, 'tests/mutation/reports')
const customFile = path.join(reportsDir, 'bench-custom.json')
const strykerFile = path.join(root, 'reports/mutation/mutation.json')
const timingFile = path.join(reportsDir, 'bench-timing.json')
for (const f of [customFile, strykerFile]) {
  if (!fs.existsSync(f)) {
    console.error(`Fichier manquant : ${path.relative(root, f)}\nLancez d'abord : npm run bench:mutation`)
    process.exit(2)
  }
}
const custom = JSON.parse(fs.readFileSync(customFile, 'utf8'))
const stryker = JSON.parse(fs.readFileSync(strykerFile, 'utf8'))
const timing = fs.existsSync(timingFile) ? JSON.parse(fs.readFileSync(timingFile, 'utf8')) : {}

const norm = (f) => f.replace(/\\/g, '/').replace(/^\.?\//, '')
const FILES = [
  'lib/services/validators.ts',
  'lib/services/payment.service.ts',
  'lib/services/enrollment.service.ts',
  'lib/services/student.service.ts',
  'lib/services/course.service.ts',
  'lib/repositories/implementation.ts',
]
const pct = (k, d) => (d ? (100 * k) / d : 100)

// ---- moteur maison : statuts killed/timeout/survived/equivalent/invalid
const cm = {}
for (const r of custom.results) {
  const c = (cm[norm(r.file)] ??= { total: 0, killed: 0, survived: 0, other: 0, survivors: [] })
  c.total++
  if (r.status === 'killed' || r.status === 'timeout') c.killed++
  else if (r.status === 'survived') (c.survived++, c.survivors.push(r))
  else c.other++
}
// ---- Stryker : Killed, Timeout, Survived, NoCoverage, CompileError, RuntimeError, Ignored
const sm = {}
const strykerSurvivors = []
for (const [file, data] of Object.entries(stryker.files)) {
  const f = norm(file)
  const c = (sm[f] ??= { total: 0, killed: 0, survived: 0, nocov: 0, other: 0 })
  for (const m of data.mutants) {
    c.total++
    if (m.status === 'Killed' || m.status === 'Timeout') c.killed++
    else if (m.status === 'Survived') (c.survived++, strykerSurvivors.push({ file: f, line: m.location.start.line, mutator: m.mutatorName, replacement: m.replacement ?? '' }))
    else if (m.status === 'NoCoverage') (c.nocov++, strykerSurvivors.push({ file: f, line: m.location.start.line, mutator: m.mutatorName, replacement: m.replacement ?? '', nocov: true }))
    else c.other++
  }
}
const sumOf = (m, k) => Object.values(m).reduce((a, c) => a + (c[k] ?? 0), 0)
const rows = FILES.map((f) => {
  const c = cm[f] ?? { total: 0, killed: 0, survived: 0, other: 0 }
  const s = sm[f] ?? { total: 0, killed: 0, survived: 0, nocov: 0, other: 0 }
  return {
    file: f,
    custom: { ...c, score: pct(c.killed, c.killed + c.survived) },
    stryker: { ...s, score: pct(s.killed, s.killed + s.survived + s.nocov) },
  }
})
const G = {
  custom: { total: sumOf(cm, 'total'), killed: sumOf(cm, 'killed'), survived: sumOf(cm, 'survived'), other: sumOf(cm, 'other') },
  stryker: { total: sumOf(sm, 'total'), killed: sumOf(sm, 'killed'), survived: sumOf(sm, 'survived'), nocov: sumOf(sm, 'nocov'), other: sumOf(sm, 'other') },
}
G.custom.score = pct(G.custom.killed, G.custom.killed + G.custom.survived)
G.stryker.score = pct(G.stryker.killed, G.stryker.killed + G.stryker.survived + G.stryker.nocov)

// ---- recouvrement des survivants (par fichier:ligne)
const lineKey = (f, l) => `${f}:${l}`
const customLines = new Set(Object.entries(cm).flatMap(([f, c]) => c.survivors.map((s) => lineKey(f, s.line))))
const strykerLines = new Set(strykerSurvivors.map((s) => lineKey(s.file, s.line)))
const both = [...customLines].filter((k) => strykerLines.has(k))
const onlyCustom = [...customLines].filter((k) => !strykerLines.has(k))
const onlyStryker = [...strykerLines].filter((k) => !customLines.has(k))

const out = { generated: new Date().toISOString(), timing, rows, global: G, survivorLines: { both, onlyCustom, onlyStryker }, strykerSurvivors }
fs.writeFileSync(path.join(reportsDir, 'benchmark.json'), JSON.stringify(out, null, 2))

// ---- affichage console
const f1 = (x) => x.toFixed(1)
console.log('\n=========== BENCHMARK : moteur maison vs Stryker ===========')
console.log('Fichier'.padEnd(38), 'Maison (mutants/tues/surv/score)'.padEnd(34), 'Stryker (mutants/tues/surv+nocov/score)')
for (const r of rows) {
  console.log(
    r.file.padEnd(38),
    `${r.custom.total}/${r.custom.killed}/${r.custom.survived}/${f1(r.custom.score)}%`.padEnd(34),
    `${r.stryker.total}/${r.stryker.killed}/${r.stryker.survived + r.stryker.nocov}/${f1(r.stryker.score)}%`
  )
}
console.log('TOTAL'.padEnd(38), `${G.custom.total}/${G.custom.killed}/${G.custom.survived}/${f1(G.custom.score)}%`.padEnd(34), `${G.stryker.total}/${G.stryker.killed}/${G.stryker.survived + G.stryker.nocov}/${f1(G.stryker.score)}%`)
if (timing.customSec) console.log(`Duree : maison ${timing.customSec}s, Stryker ${timing.strykerSec}s`)
console.log(`Lignes survivantes : communes ${both.length}, maison seul ${onlyCustom.length}, Stryker seul ${onlyStryker.length}`)

// ---- table LaTeX pour le rapport
const tex = (s) => String(s).replace(/\\/g, '\\textbackslash{}').replace(/([&%$#_{}])/g, '\\$1').replace(/\^/g, '\\^{}').replace(/~/g, '\\~{}')
const fr = (x) => f1(x).replace('.', '{,}')
let t = '% Genere par tests/mutation/bench/compare.mjs - ne pas modifier a la main\n'
t += '\\begin{table}[H]\n\\centering\n\\footnotesize\n\\begin{tabular}{lrrrrrrrr}\n\\toprule\n'
t += ' & \\multicolumn{4}{c}{\\textbf{Moteur maison}} & \\multicolumn{4}{c}{\\textbf{Stryker}} \\\\\n\\cmidrule(lr){2-5}\\cmidrule(lr){6-9}\n'
t += '\\textbf{Fichier} & Mut. & Tués & Surv. & Score & Mut. & Tués & Surv. & Score \\\\\n\\midrule\n'
for (const r of rows) {
  t += `\\texttt{${tex(path.basename(r.file))}} & ${r.custom.total} & ${r.custom.killed} & ${r.custom.survived} & ${fr(r.custom.score)}\\,\\% & ${r.stryker.total} & ${r.stryker.killed} & ${r.stryker.survived + r.stryker.nocov} & ${fr(r.stryker.score)}\\,\\% \\\\\n`
}
t += `\\midrule\n\\textbf{Total} & \\textbf{${G.custom.total}} & ${G.custom.killed} & ${G.custom.survived} & \\textbf{${fr(G.custom.score)}\\,\\%} & \\textbf{${G.stryker.total}} & ${G.stryker.killed} & ${G.stryker.survived + G.stryker.nocov} & \\textbf{${fr(G.stryker.score)}\\,\\%} \\\\\n`
t += '\\bottomrule\n\\end{tabular}\n\\caption{Résultats mesurés sur les mêmes six fichiers et les mêmes tests (les survivants de Stryker incluent les mutants « sans couverture »)}\n\\label{tab:bench-scores}\n\\end{table}\n\n'

if (timing.customSec) {
  const perC = timing.customSec / G.custom.total
  const perS = timing.strykerSec / G.stryker.total
  t += '\\begin{table}[H]\n\\centering\n\\small\n\\begin{tabular}{lcc}\n\\toprule\n\\textbf{Mesure} & \\textbf{Moteur maison} & \\textbf{Stryker} \\\\\n\\midrule\n'
  t += `Durée totale & ${timing.customSec}\\,s & ${timing.strykerSec}\\,s \\\\\n`
  t += `Mutants générés & ${G.custom.total} & ${G.stryker.total} \\\\\n`
  t += `Temps moyen par mutant & ${perC.toFixed(2).replace('.', '{,}')}\\,s & ${perS.toFixed(2).replace('.', '{,}')}\\,s \\\\\n`
  t += '\\bottomrule\n\\end{tabular}\n\\caption{Performance (mesure de l\'horloge murale, exécutions séquentielles)}\n\\label{tab:bench-perf}\n\\end{table}\n\n'
}

t += '\\begin{table}[H]\n\\centering\n\\small\n\\begin{tabular}{lc}\n\\toprule\n\\textbf{Lignes de code où au moins un mutant survit} & \\textbf{Nombre} \\\\\n\\midrule\n'
t += `Détectées par les deux outils & ${both.length} \\\\\nMoteur maison seulement & ${onlyCustom.length} \\\\\nStryker seulement & ${onlyStryker.length} \\\\\n`
t += '\\bottomrule\n\\end{tabular}\n\\caption{Recouvrement des survivants (par ligne de code)}\n\\label{tab:bench-overlap}\n\\end{table}\n\n'

const shown = strykerSurvivors.slice(0, 20)
if (shown.length) {
  t += '\\begin{table}[H]\n\\centering\n\\footnotesize\n\\begin{tabular}{p{3.6cm}cp{3.3cm}p{4.4cm}}\n\\toprule\n\\textbf{Fichier} & \\textbf{Ligne} & \\textbf{Mutateur Stryker} & \\textbf{Remplacement} \\\\\n\\midrule\n'
  for (const s of shown) t += `\\texttt{${tex(path.basename(s.file))}} & ${s.line} & ${tex(s.mutator)}${s.nocov ? ' (sans couverture)' : ''} & \\texttt{${tex(s.replacement.slice(0, 22).replace(/\\s+/g, ' '))}} \\\\\n`
  t += `\\bottomrule\n\\end{tabular}\n\\caption{Survivants de Stryker${strykerSurvivors.length > shown.length ? ` (${shown.length} premiers sur ${strykerSurvivors.length})` : ''}}\n\\end{table}\n`
}
fs.writeFileSync(path.join(reportsDir, 'benchmark_table.tex'), t)
console.log('\nEcrit : tests/mutation/reports/benchmark.json et benchmark_table.tex')
