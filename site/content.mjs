// Loads posts and manuals from `content/` and renders their Markdown.

import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join, basename } from 'node:path'
import { renderMarkdown } from './markdown.mjs'
import { imageSize } from './image-size.mjs'
import { site, series as SERIES, seriesById } from './config.mjs'
import { LOCALES, DEFAULT_LOCALE, localePath, SERIES_I18N, GROUPS_I18N } from './i18n.mjs'

const ROOT = new URL('..', import.meta.url).pathname
const CONTENT = join(ROOT, 'content')

function parseFrontmatter(raw, file) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  if (!match) throw new Error(`${file}: missing frontmatter`)
  const data = {}
  for (const line of match[1].split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith('#')) continue
    const kv = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/)
    if (!kv) throw new Error(`${file}: cannot read frontmatter line "${line}"`)
    let value = kv[2].trim()
    if (value.startsWith('"')) value = JSON.parse(value)
    else if (value.startsWith("'")) value = value.slice(1, -1).replace(/''/g, "'")
    else if (value === 'true' || value === 'false') value = value === 'true'
    data[kv[1]] = value
  }
  return { data, body: raw.slice(match[0].length) }
}

const resolveUrl = (url) => url

/** Adds intrinsic width/height to local images. */
export function sizeImages(html) {
  return html.replace(/<img src="(\/[^"]+)"/g, (m, src) => {
    const size = imageSize(join(ROOT, 'public', decodeURIComponent(src.split('?')[0])))
    return size ? `${m} width="${size.width}" height="${size.height}"` : m
  })
}

/** Characters of prose, for reading time. CJK counts per char, Latin per word. */
function readingMinutes(markdown) {
  const text = markdown.replace(/```[\s\S]*?```/g, '').replace(/!\[[^\]]*\]\([^)]*\)/g, '')
  const cjk = (text.match(/[一-鿿぀-ヿ]/g) ?? []).length
  const words = (text.replace(/[一-鿿぀-ヿ]/g, ' ').match(/[A-Za-z0-9]+/g) ?? []).length
  return Math.max(1, Math.round(cjk / 400 + words / 220))
}

function excerpt(html, length = 120) {
  const text = html
    .replace(/<(pre|figure|table)[\s\S]*?<\/\1>/g, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&[a-z]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return text.length > length ? `${text.slice(0, length)}…` : text
}

export function loadPosts() {
  const dir = join(CONTENT, 'blog')
  const posts = []
  for (const seriesId of readdirSync(dir)) {
    if (!seriesById.has(seriesId)) throw new Error(`content/blog/${seriesId}: unknown series (add it to site/config.mjs)`)
    for (const file of readdirSync(join(dir, seriesId))) {
      if (!/\.mdx?$/.test(file) || TRANSLATION.test(file)) continue
      const path = join(dir, seriesId, file)
      const { data, body } = parseFrontmatter(readFileSync(path, 'utf8'), path)
      for (const key of ['title', 'date']) {
        if (!data[key]) throw new Error(`${path}: frontmatter needs "${key}"`)
      }
      const slug = basename(file).replace(/\.mdx?$/, '')
      const rendered = renderMarkdown(body, { baseUrl: site.baseUrl, resolveUrl })
      const html = sizeImages(rendered.html)
      const { headings } = rendered
      const meta = seriesById.get(seriesId)
      posts.push({
        kind: 'post',
        slug,
        series: seriesId,
        seriesMeta: meta,
        url: `/blog/${seriesId}/${slug}`,
        title: data.title.replace(/^冷知识盲盒[:：]\s*/, ''),
        fullTitle: data.title,
        description: data.description ?? excerpt(html),
        date: String(data.date),
        author: data.author ?? (data.account ? undefined : site.author.name),
        account: data.account,
        cover: data.cover && existsSync(join(ROOT, 'public', data.cover)) ? data.cover : undefined,
        coverSize: data.cover ? imageSize(join(ROOT, 'public', data.cover)) : null,
        // listed: appears in the main stream (home, archive, feeds).
        // indexed: offered to search engines (robots, sitemap, structured data).
        listed: meta.indexed,
        indexed: data.noindex !== true && (meta.indexed || (meta.indexAccounts ?? []).includes(data.account)),
        html,
        headings,
        minutes: readingMinutes(body),
      })
    }
  }
  posts.sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug))

  // Episode numbers for the show, oldest first.
  const episodes = posts.filter((p) => p.series === 'podcast').reverse()
  episodes.forEach((p, i) => (p.issue = i + 1))

  for (const post of posts) {
    post.locale = DEFAULT_LOCALE
    post.alt = { [DEFAULT_LOCALE]: post }
    for (const locale of LOCALES.slice(1)) {
      const file = join(dir, post.series, `${post.slug}.${locale}.mdx`)
      if (!existsSync(file)) continue
      const { data, body } = parseFrontmatter(readFileSync(file, 'utf8'), file)
      if (!data.title) throw new Error(`${file}: frontmatter needs "title"`)
      const rendered = renderMarkdown(body, { baseUrl: site.baseUrl, resolveUrl })
      const html = sizeImages(rendered.html)
      post.alt[locale] = {
        ...post,
        locale,
        url: localePath(locale, post.url),
        title: data.title,
        fullTitle: data.title,
        description: data.description ?? excerpt(html),
        seriesMeta: { ...post.seriesMeta, ...(SERIES_I18N[locale]?.[post.series] ?? {}) },
        html,
        headings: rendered.headings,
        minutes: readingMinutes(body),
      }
    }
  }
  return posts
}

const TRANSLATION = new RegExp(`\\.(${LOCALES.slice(1).join('|')})\\.mdx?$`)

/** Points internal links in a translation at the same locale when that page exists. */
export function localizeLinks(item, urls) {
  if (item.locale === DEFAULT_LOCALE) return
  item.html = item.html.replace(/href="(\/(?:blog|docs)\/[^"#?]*)([^"]*)"/g, (m, path, rest) => {
    const target = localePath(item.locale, path)
    return urls.has(target) ? `href="${target}${rest}"` : m
  })
}

const DOC_GROUPS = {
  ai: 'AI',
  'self-hosted': '自托管',
  accounts: '账号',
  site: '建站',
  finance: '出海与金融',
  tools: '工具',
  product: '产品',
}

export function loadDocs() {
  const dir = join(CONTENT, 'docs')
  const order = JSON.parse(readFileSync(join(dir, 'meta.json'), 'utf8')).pages
  const groups = []
  let group = null
  const docs = []
  for (const entry of order) {
    const g = entry.match(/^---(.+)---$/)
    if (g) {
      group = { id: g[1], title: DOC_GROUPS[g[1]] ?? g[1], docs: [] }
      groups.push(group)
      continue
    }
    if (entry === 'index') continue
    const path = join(dir, `${entry}.mdx`)
    const { data, body } = parseFrontmatter(readFileSync(path, 'utf8'), path)
    const rendered = renderMarkdown(body, { baseUrl: site.baseUrl, resolveUrl })
      const html = sizeImages(rendered.html)
      const { headings } = rendered
    const doc = {
      kind: 'doc',
      slug: entry,
      url: `/docs/${entry}`,
      title: data.title,
      description: data.description ?? excerpt(html),
      group: group?.title ?? '其他',
      coverWord: data.coverWord,
      html,
      headings,
      minutes: readingMinutes(body),
      indexed: true,
    }
    docs.push(doc)
    group?.docs.push(doc)
  }
  // Cover words: frontmatter `coverWord`, else the title's first unused Latin term, else the group.
  const STOP = new Set(['the', 'and', 'for', 'how', 'with', 'api', 'app', 'gui'])
  const used = new Set(docs.filter((d) => d.coverWord).map((d) => d.coverWord))
  for (const doc of docs) {
    if (doc.coverWord) continue
    const terms = (doc.title.match(/[A-Za-z][A-Za-z0-9.+#-]+/g) ?? []).filter((w) => w.length >= 3 && !STOP.has(w.toLowerCase()))
    doc.coverWord = terms.find((w) => !used.has(w)) ?? terms[0] ?? doc.group
    used.add(doc.coverWord)
  }

  const listed = new Set(order)
  for (const file of readdirSync(dir)) {
    const slug = file.replace(/\.mdx?$/, '')
    if (/\.mdx?$/.test(file) && !TRANSLATION.test(file) && !listed.has(slug)) throw new Error(`content/docs/${file}: not listed in content/docs/meta.json`)
  }
  const isLatin = (w) => /^[A-Za-z]/.test(w)
  for (const doc of docs) {
    doc.locale = DEFAULT_LOCALE
    doc.alt = { [DEFAULT_LOCALE]: doc }
    for (const locale of LOCALES.slice(1)) {
      const file = join(dir, `${doc.slug}.${locale}.mdx`)
      if (!existsSync(file)) continue
      const { data, body } = parseFrontmatter(readFileSync(file, 'utf8'), file)
      if (!data.title) throw new Error(`${file}: frontmatter needs "title"`)
      const rendered = renderMarkdown(body, { baseUrl: site.baseUrl, resolveUrl })
      const html = sizeImages(rendered.html)
      const group = GROUPS_I18N[locale]?.[doc.group] ?? doc.group
      doc.alt[locale] = {
        ...doc,
        locale,
        url: localePath(locale, doc.url),
        title: data.title,
        description: data.description ?? excerpt(html),
        group,
        coverWord: data.coverWord ?? (isLatin(doc.coverWord) ? doc.coverWord : group),
        html,
        headings: rendered.headings,
        minutes: readingMinutes(body),
      }
    }
  }
  return { docs, groups }
}

export { SERIES }
