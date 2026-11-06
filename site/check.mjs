// Post-build checks: broken internal links, missing images, leftover Markdown.
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const DIST = new URL('../dist', import.meta.url).pathname
const files = []
const walk = (d) => readdirSync(d).forEach((f) => { const p = join(d, f); statSync(p).isDirectory() ? walk(p) : p.endsWith('.html') && files.push(p) })
walk(DIST)

const exists = (path) => {
  const clean = decodeURIComponent(path.split(/[?#]/)[0]).replace(/\/+$/, '') || '/'
  if (clean === '/') return true
  return [clean, `${clean}.html`, `${clean}/index.html`].some((c) => existsSync(join(DIST, c)) && statSync(join(DIST, c)).isFile())
}

const problems = []
for (const file of files) {
  const html = readFileSync(file, 'utf8')
  const rel = file.slice(DIST.length)
  for (const [, attr, url] of html.matchAll(/\s(href|src)="(\/[^"]*)"/g)) {
    if (url.startsWith('//')) continue
    if (!exists(url)) problems.push(`${rel}: ${attr} ${url}`)
  }
  const body = html.replace(/<pre[\s\S]*?<\/pre>|<code>[\s\S]*?<\/code>|<script[\s\S]*?<\/script>/g, '')
  for (const pattern of [/\*\*\S/, /\]\(/, /\u0000/, /^\s*\|[-:]+\|/m]) {
    const m = body.match(pattern)
    if (m) problems.push(`${rel}: leftover markdown near "${body.slice(Math.max(0, m.index - 30), m.index + 30).replace(/\s+/g, ' ')}"`)
  }
}
const unique = [...new Set(problems)]
console.log(`${files.length} pages checked, ${unique.length} problems`)
unique.slice(0, 60).forEach((p) => console.log('  ' + p))
process.exitCode = unique.length ? 1 : 0
