// Fails when a raw colour appears outside the design-token file, so every colour goes through a named token.
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

const TOKEN_FILE = join('src', 'styles', 'global.css')
const EXTS = ['.astro', '.tsx', '.ts', '.css', '.mjs']
const COLOUR = /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|lab|lch)\(/g

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) yield* walk(path)
    else if (EXTS.some((ext) => name.endsWith(ext))) yield path
  }
}

const problems = []
for (const file of walk('src')) {
  if (relative('.', file) === TOKEN_FILE) continue
  readFileSync(file, 'utf8')
    .split('\n')
    .forEach((line, i) => {
      // Allow `#id` fragments in hrefs and entity-like refs, which are not colours.
      for (const match of line.matchAll(COLOUR)) {
        if (/href=["'][^"']*$/.test(line.slice(0, match.index))) continue
        problems.push(`${file.split(sep).join('/')}:${i + 1}  raw colour ${match[0]}`)
      }
    })
}

if (problems.length) {
  console.error(problems.join('\n'))
  console.error(
    `\n${problems.length} raw colour(s). Add or reuse a token in ${TOKEN_FILE} (e.g. var(--color-key) or a Tailwind class like text-key).`,
  )
  process.exit(1)
}
console.log('check-tokens: no raw colours outside the token file')
