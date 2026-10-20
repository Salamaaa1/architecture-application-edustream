// Génération des mutants — sans aucune dépendance (Node >= 18).
//
// Principe : le code source est d'abord « classé » caractère par caractère
// (code / chaîne / commentaire / gabarit / expression régulière) afin de ne
// jamais muter ce qui ressemble à un opérateur mais n'en est pas un
// (ex. un « < » dans un commentaire ou un « + » dans une regex).
// Chaque opérateur de mutation propose ensuite des remplacements locaux.

const CODE = 0
const STRING = 1
const COMMENT = 2
const TEMPLATE = 3
const REGEX = 4

/** Classe chaque caractère du source. */
export function classify(src) {
  const n = src.length
  const kind = new Uint8Array(n)
  let i = 0

  const prevSignificant = (from) => {
    let k = from - 1
    while (k >= 0 && (/\s/.test(src[k]) || kind[k] === COMMENT)) k--
    return k
  }

  while (i < n) {
    const c = src[i]
    const d = src[i + 1]

    if (c === '/' && d === '/') {
      let j = i
      while (j < n && src[j] !== '\n') j++
      kind.fill(COMMENT, i, j)
      i = j
      continue
    }
    if (c === '/' && d === '*') {
      let j = src.indexOf('*/', i + 2)
      j = j < 0 ? n : j + 2
      kind.fill(COMMENT, i, j)
      i = j
      continue
    }
    if (c === '"' || c === "'") {
      let j = i + 1
      while (j < n && src[j] !== c && src[j] !== '\n') {
        if (src[j] === '\\') j++
        j++
      }
      j = Math.min(j + 1, n)
      kind.fill(STRING, i, j)
      i = j
      continue
    }
    if (c === '`') {
      let j = i + 1
      let depth = 0
      while (j < n) {
        if (src[j] === '\\') {
          j += 2
          continue
        }
        if (src[j] === '`' && depth === 0) break
        if (src[j] === '$' && src[j + 1] === '{') {
          depth++
          j += 2
          continue
        }
        if (src[j] === '}' && depth > 0) depth--
        j++
      }
      j = Math.min(j + 1, n)
      kind.fill(TEMPLATE, i, j)
      i = j
      continue
    }
    if (c === '/') {
      // Division ou début d'expression régulière ?
      const k = prevSignificant(i)
      let isRegex
      if (k < 0) isRegex = true
      else if (kind[k] === STRING || kind[k] === TEMPLATE || kind[k] === REGEX) isRegex = false
      else {
        const p = src[k]
        if (/[\w$)\]]/.test(p)) {
          const word = /([A-Za-z_$][\w$]*)$/.exec(src.slice(0, k + 1))
          isRegex = !!word && /^(return|typeof|case|in|of|delete|void|throw)$/.test(word[1])
        } else isRegex = true
      }
      if (isRegex) {
        let j = i + 1
        let inClass = false
        let ok = false
        while (j < n && src[j] !== '\n') {
          if (src[j] === '\\') {
            j += 2
            continue
          }
          if (src[j] === '[') inClass = true
          else if (src[j] === ']') inClass = false
          else if (src[j] === '/' && !inClass) {
            ok = true
            break
          }
          j++
        }
        if (ok) {
          j++
          while (j < n && /[a-z]/.test(src[j])) j++
          kind.fill(REGEX, i, j)
          i = j
          continue
        }
      }
    }
    i++
  }
  return kind
}

const allCode = (kind, a, b) => {
  for (let i = a; i < b; i++) if (kind[i] !== CODE) return false
  return true
}

/** Fin de l'expression entre parenthèses ouvrante en `open` (index de « ( »). */
function matchingParen(src, kind, open) {
  let depth = 0
  for (let i = open; i < src.length; i++) {
    if (kind[i] !== CODE) continue
    if (src[i] === '(') depth++
    else if (src[i] === ')') {
      depth--
      if (depth === 0) return i
    }
  }
  return -1
}

/** Fin (exclue) d'une instruction commençant en `start` : équilibre ( [ { puis fin de ligne ou « ; ». */
function statementEnd(src, kind, start) {
  let depth = 0
  for (let i = start; i < src.length; i++) {
    if (kind[i] !== CODE) continue
    const c = src[i]
    if (c === '(' || c === '[' || c === '{') depth++
    else if (c === ')' || c === ']' || c === '}') depth--
    if (depth < 0) return -1
    if (depth === 0 && (c === ';' || c === '\n')) return c === ';' ? i + 1 : i
  }
  return -1
}

const lineOf = (src, index) => {
  let line = 1
  for (let i = 0; i < index; i++) if (src[i] === '\n') line++
  return line
}

/**
 * Retourne la liste des mutants d'un fichier source.
 * Chaque mutant : { operator, start, end, original, replacement, line }.
 */
export function generateMutants(src) {
  const kind = classify(src)
  const out = []
  const seen = new Set()
  const push = (operator, start, end, replacement) => {
    const original = src.slice(start, end)
    if (original === replacement) return
    const key = `${start}:${end}:${replacement}`
    if (seen.has(key)) return
    seen.add(key)
    out.push({ operator, start, end, original, replacement, line: lineOf(src, start) })
  }

  // 1. Opérateurs binaires entourés d'espaces (évite génériques, flèches, ++ / --)
  const BINARY = {
    '<': ['ConditionalBoundary', ['<=']],
    '<=': ['ConditionalBoundary', ['<']],
    '>': ['ConditionalBoundary', ['>=']],
    '>=': ['ConditionalBoundary', ['>']],
    '===': ['NegateConditional', ['!==']],
    '!==': ['NegateConditional', ['===']],
    '==': ['NegateConditional', ['!=']],
    '!=': ['NegateConditional', ['==']],
    '&&': ['LogicalOperator', ['||']],
    '||': ['LogicalOperator', ['&&']],
    '+': ['ArithmeticOperator', ['-']],
    '-': ['ArithmeticOperator', ['+']],
    '*': ['ArithmeticOperator', ['/']],
    '/': ['ArithmeticOperator', ['*']],
    '%': ['ArithmeticOperator', ['*']],
  }
  const binRe = / (<=|>=|===|!==|==|!=|&&|\|\||<|>|\+|-|\*|\/|%) /g
  for (let m; (m = binRe.exec(src)); ) {
    const start = m.index + 1
    const end = start + m[1].length
    if (!allCode(kind, start, end)) continue
    const [operator, repls] = BINARY[m[1]]
    for (const r of repls) push(operator, start, end, r)
  }

  // 2. Littéraux booléens
  const boolRe = /\b(true|false)\b/g
  for (let m; (m = boolRe.exec(src)); ) {
    if (!allCode(kind, m.index, m.index + m[1].length)) continue
    if (src[m.index - 1] === '.') continue
    push('BooleanLiteral', m.index, m.index + m[1].length, m[1] === 'true' ? 'false' : 'true')
  }

  // 3. Conditions de « if » forcées à true / false
  const ifRe = /\bif\s*\(/g
  for (let m; (m = ifRe.exec(src)); ) {
    if (kind[m.index] !== CODE) continue
    const open = m.index + m[0].length - 1
    const close = matchingParen(src, kind, open)
    if (close < 0) continue
    const cond = src.slice(open + 1, close).trim()
    if (cond === 'true' || cond === 'false') continue
    push('IfCondition', open + 1, close, 'true')
    push('IfCondition', open + 1, close, 'false')
  }

  // 4. Suppression de la négation « ! »
  for (let i = 0; i < src.length; i++) {
    if (src[i] !== '!' || kind[i] !== CODE || src[i + 1] === '=') continue
    let k = i - 1
    while (k >= 0 && /\s/.test(src[k])) k--
    if (k >= 0 && /[\w$)\]]/.test(src[k])) continue // opérateur « ! » non nul (x!.y)
    push('NegationRemoval', i, i + 1, '')
  }

  // 5. Suppression d'instructions (appels de méthode d'instance, throw)
  const stmtRe = /^[ \t]*((?:await\s+)?this\.[\w.]+\(|throw\s)/gm
  for (let m; (m = stmtRe.exec(src)); ) {
    const start = m.index + m[0].search(/\S/)
    if (kind[start] !== CODE) continue
    let k = start - 1
    while (k >= 0 && /\s/.test(src[k])) k--
    if (k >= 0 && /[=(,?:&|.+\-*]/.test(src[k])) continue // suite d'une instruction commencée plus haut
    const end = statementEnd(src, kind, start)
    if (end < 0) continue
    push('StatementRemoval', start, end, ';')
  }

  // 6. Chaînes de caractères (messages d'erreur, statuts, ...)
  for (let i = 0; i < src.length; ) {
    if (kind[i] !== STRING) {
      i++
      continue
    }
    // Recherche du guillemet fermant (les échappements sont sautés)
    let end = i + 1
    while (end < src.length) {
      if (src[end] === '\\') {
        end += 2
        continue
      }
      if (src[end] === src[i]) break
      end++
    }
    end++
    const lineStart = src.lastIndexOf('\n', i) + 1
    const before = src.slice(lineStart, i)
    const content = src.slice(i + 1, end - 1)
    const isImport = /\bfrom\s*$/.test(before) || /^\s*import\s*$/.test(before)
    const lineEnd = src.indexOf('\n', i)
    const wholeLine = src.slice(lineStart, lineEnd < 0 ? undefined : lineEnd)
    const isTypeLevel = /\b(Omit|Pick|Record|Exclude|Extract)</.test(wholeLine) // types TypeScript : effacés à la compilation
    if (!isImport && !isTypeLevel && content.length > 0 && content !== 'use client') {
      push('StringLiteral', i, end, `${src[i]}${src[i]}`)
    }
    i = end
  }

  // 7. Littéraux entiers (n -> n + 1)
  const numRe = /(?<![\w.$])\d+(?![\w.])/g
  for (let m; (m = numRe.exec(src)); ) {
    if (!allCode(kind, m.index, m.index + m[0].length)) continue
    const lineStart = src.lastIndexOf('\n', m.index) + 1
    const lineEnd = src.indexOf('\n', m.index)
    const line = src.slice(lineStart, lineEnd < 0 ? undefined : lineEnd)
    if (m[0] === '10' && /parseInt\(/.test(line)) continue // base numérique
    push('NumberLiteral', m.index, m.index + m[0].length, String(Number(m[0]) + 1))
  }

  // 8. Expressions régulières
  for (let i = 0; i < src.length; ) {
    if (kind[i] !== REGEX) {
      i++
      continue
    }
    let j = i
    while (j < src.length && kind[j] === REGEX) j++
    const lit = src.slice(i, j)
    const close = lit.lastIndexOf('/')
    const body = lit.slice(1, close)
    const flags = lit.slice(close + 1)
    const emit = (newBody) => {
      try {
        new RegExp(newBody, flags)
      } catch {
        return
      }
      push('RegexLiteral', i, j, `/${newBody}/${flags}`)
    }
    if (body.startsWith('^')) emit(body.slice(1))
    if (body.endsWith('$') && !body.endsWith('\\$')) emit(body.slice(0, -1))
    for (const [a, b] of [['\\d', '\\D'], ['\\D', '\\d'], ['\\s', '\\S']]) {
      let at = body.indexOf(a)
      while (at >= 0) {
        emit(body.slice(0, at) + b + body.slice(at + a.length))
        at = body.indexOf(a, at + 1)
      }
    }
    for (let q = 0; q < body.length; q++) {
      if (body[q] === '\\') {
        q++
        continue
      }
      if (body[q] === '+') emit(body.slice(0, q) + '*' + body.slice(q + 1))
      if (body[q] === '*') emit(body.slice(0, q) + '+' + body.slice(q + 1))
    }
    const quant = /\{(\d+),(\d+)\}/.exec(body)
    if (quant) emit(body.replace(quant[0], `{${quant[1]}}`))
    i = j
  }

  // 9. Appels de méthode courants
  const methodRe = /Math\.(max|min)\b|\.trim\(\)/g
  for (let m; (m = methodRe.exec(src)); ) {
    if (!allCode(kind, m.index, m.index + m[0].length)) continue
    if (m[1] === 'max') push('MethodExpression', m.index, m.index + m[0].length, 'Math.min')
    else if (m[1] === 'min') push('MethodExpression', m.index, m.index + m[0].length, 'Math.max')
    else push('MethodExpression', m.index, m.index + m[0].length, '')
  }

  out.sort((a, b) => a.start - b.start || a.end - b.end)
  return out
}

/** Clé stable d'un mutant (indépendante des numéros de ligne). */
export function mutantKey(file, src, mutant) {
  const lineStart = src.lastIndexOf('\n', mutant.start - 1) + 1
  const lineEnd = src.indexOf('\n', mutant.start)
  const text = src.slice(lineStart, lineEnd < 0 ? undefined : lineEnd).trim()
  return `${file}|${mutant.operator}|${mutant.original} => ${mutant.replacement}|${text}`
}
