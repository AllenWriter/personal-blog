// Local preview: builds once, serves dist/ like Cloudflare does, rebuilds on change.
//   node site/dev.mjs            → http://localhost:4321

import { createServer } from 'node:http'
import { readFileSync, existsSync, statSync, watch } from 'node:fs'
import { join, extname } from 'node:path'
import { build } from './build.mjs'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const PORT = Number(process.env.PORT ?? 4321)

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
}

build()

let timer
for (const dir of ['content', 'site', 'public']) {
  watch(join(ROOT, dir), { recursive: true }, () => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      try {
        build()
      } catch (error) {
        console.error(error.message)
      }
    }, 150)
  })
}

function resolve(pathname) {
  const clean = decodeURIComponent(pathname).replace(/\/+$/, '') || '/'
  const candidates = clean === '/' ? ['index.html'] : [clean.slice(1), `${clean.slice(1)}.html`, `${clean.slice(1)}/index.html`]
  for (const c of candidates) {
    const file = join(DIST, c)
    if (file.startsWith(DIST) && existsSync(file) && statSync(file).isFile()) return file
  }
  return null
}

createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost')
  const legacy = url.pathname.match(/^\/(zh-CN|zh-TW|en|ja|ko|ru)(\/.*)?$/)
  if (legacy) {
    res.writeHead(301, { location: legacy[2] || '/' })
    return res.end()
  }
  const file = resolve(url.pathname)
  if (!file) {
    res.writeHead(404, { 'content-type': TYPES['.html'] })
    return res.end(readFileSync(join(DIST, '404.html')))
  }
  res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' })
  res.end(readFileSync(file))
}).listen(PORT, () => console.log(`小举人 preview → http://localhost:${PORT}`))
