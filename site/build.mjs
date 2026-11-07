// Builds the static site into `dist/`.
//   node site/build.mjs              local build (no analytics, no ads)
//   NODE_ENV=production node site/build.mjs

import { mkdirSync, rmSync, writeFileSync, readFileSync, copyFileSync, readdirSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { createHash } from 'node:crypto'
import { site, series } from './config.mjs'
import { loadPosts, loadDocs, localizeLinks } from './content.mjs'
import { LOCALES, DEFAULT_LOCALE, LOCALE_META, STRINGS, GROUPS_I18N, localePath } from './i18n.mjs'
import { escapeHtml as esc } from './markdown.mjs'
import * as t from './templates.mjs'
import { docsPage, docsHome, docsSearchIndex } from './docs-templates.mjs'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const production = process.env.NODE_ENV === 'production'

export function build() {
  const started = Date.now()
  rmSync(DIST, { recursive: true, force: true })
  mkdirSync(DIST, { recursive: true })
  copyTree(join(ROOT, 'public'), DIST)

  const css = readFileSync(join(ROOT, 'site/styles.css'), 'utf8')
  const js = readFileSync(join(ROOT, 'site/client.js'), 'utf8')
  const hash = (s) => createHash('sha1').update(s).digest('hex').slice(0, 8)
  write('assets/site.css', css)
  write('assets/site.js', js)

  const allPosts = loadPosts()
  const { docs: allDocs, groups: allGroups } = loadDocs()

  // What exists in each language. Chinese has everything; translations only
  // what has been translated (the 剪报 column is never translated).
  const editions = {}
  for (const locale of LOCALES) {
    const posts = allPosts.map((p) => p.alt[locale]).filter(Boolean)
    const docs = allDocs.map((d) => d.alt[locale]).filter(Boolean)
    if (locale !== DEFAULT_LOCALE && !posts.length && !docs.length) continue
    const groups = allGroups
      .map((g) => ({ ...g, title: locale === DEFAULT_LOCALE ? g.title : GROUPS_I18N[locale]?.[g.title] ?? g.title, docs: g.docs.map((d) => d.alt[locale]).filter(Boolean) }))
      .filter((g) => g.docs.length)
    editions[locale] = { posts, docs, groups }
  }
  const enabled = Object.keys(editions)

  // Internal links in translations point at translated pages when they exist.
  const urls = new Set(Object.values(editions).flatMap((e) => [...e.posts, ...e.docs].map((x) => x.url)))
  for (const e of Object.values(editions)) for (const item of [...e.posts, ...e.docs]) localizeLinks(item, urls)

  const sitemap = []
  const report = {}
  for (const locale of enabled) {
    report[locale] = renderEdition(locale, editions, enabled, { css, js, hash, sitemap })
  }

  write(
    'sitemap.xml',
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemap
      .map(
        (u) =>
          `  <url><loc>${site.baseUrl}${u.path}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}<priority>${u.priority}</priority></url>`,
      )
      .join('\n')}\n</urlset>\n`,
  )
  write('robots.txt', ['User-agent: *', 'Allow: /', '', `Sitemap: ${site.baseUrl}/sitemap.xml`, ''].join('\n'))
  write('ads.txt', `google.com, ${site.adsense.publisher.replace(/^ca-/, '')}, DIRECT, f08c47fec0942fa0\n`)
  write(`${site.indexNowKey}.txt`, `${site.indexNowKey}\n`)
  write(`indexnow-${site.indexNowKey}.txt`, `${site.indexNowKey}\n`)

  const summary = enabled.map((l) => `${l}: ${report[l].posts} posts, ${report[l].docs} manuals`).join('; ')
  console.log(`built ${sitemap.length} indexed URLs (${summary}) in ${Date.now() - started} ms → dist/${production ? ' [production]' : ''}`)
  return report
}

function renderEdition(locale, editions, enabled, { css, js, hash, sitemap }) {
  const { posts, docs, groups } = editions[locale]
  t.setLocale(locale, enabled)
  const S = STRINGS[locale]
  const lp = (path) => localePath(locale, path)
  const lang = LOCALE_META[locale].lang

  const seriesCounts = Object.fromEntries(series.map((s) => [s.id, posts.filter((p) => p.series === s.id).length]))
  for (const s of series) s.count = seriesCounts[s.id]
  const stats = {
    posts: posts.filter((p) => p.listed).length,
    episodes: seriesCounts.podcast,
    docs: docs.length,
    seriesCounts,
    cssHash: hash(css),
    jsHash: hash(js),
  }

  // Which language editions have a given section page.
  const has = (loc, path) => {
    const e = editions[loc]
    if (path === '/' || path === '/about' || path === '/blog') return e.posts.length > 0 || path !== '/blog'
    if (path === '/docs') return e.docs.length > 0
    const m = path.match(/^\/blog\/([^/]+)$/)
    return m ? e.posts.some((p) => p.series === m[1]) : false
  }
  const sectionAlternates = (path) => Object.fromEntries(enabled.filter((l) => has(l, path)).map((l) => [l, localePath(l, path)]))
  const itemAlternates = (item) => Object.fromEntries(enabled.filter((l) => item.alt[l]).map((l) => [l, item.alt[l].url]))

  const publisher = { '@type': 'Person', name: site.author.name, url: `${site.baseUrl}${lp('/about')}` }
  const page = (path, opts) => {
    const html = t.layout({ path, production, stats, ...opts })
    write(path === '/' ? 'index.html' : `${path.slice(1)}.html`, html)
  }
  const breadcrumbs = (items) => ({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: `${site.baseUrl}${path}` })),
  })
  const listed = posts.filter((p) => p.listed)
  const showName = t.seriesInfo('podcast').title

  // Home.
  page(lp('/'), {
    title: site.name,
    description: S.description,
    body: t.homePage({ posts, docGroups: groups }),
    bodyClass: 'is-home',
    alternates: sectionAlternates('/'),
    jsonLd: [
      { '@context': 'https://schema.org', '@type': 'WebSite', name: site.name, alternateName: S.tagline, url: `${site.baseUrl}${lp('/')}`, description: S.description, inLanguage: lang, author: publisher },
    ],
  })
  sitemap.push({ path: lp('/'), lastmod: listed[0]?.date, priority: locale === DEFAULT_LOCALE ? '1.0' : '0.9' })

  // Articles.
  for (const post of posts) {
    const sameSeries = posts.filter((p) => p.series === post.series)
    const i = sameSeries.indexOf(post)
    const newer = sameSeries[i - 1]
    const older = sameSeries[i + 1]
    const related = [...sameSeries.filter((p) => p !== post && p !== newer && p !== older), ...listed.filter((p) => p.series !== post.series)].slice(0, 3)
    page(post.url, {
      title: post.title,
      description: post.description,
      image: post.cover,
      type: 'article',
      indexed: post.indexed,
      published: post.date,
      alternates: itemAlternates(post),
      bodyClass: `is-article series-${post.series}`,
      body: t.articlePage({ post, prev: older, next: newer, related }),
      jsonLd: post.indexed
        ? [
            {
              '@context': 'https://schema.org',
              '@type': 'BlogPosting',
              headline: post.fullTitle,
              description: post.description,
              datePublished: post.date,
              dateModified: post.date,
              inLanguage: lang,
              mainEntityOfPage: `${site.baseUrl}${post.url}`,
              image: post.cover ? [`${site.baseUrl}${post.cover}`] : [`${site.baseUrl}/og.png`],
              author: post.account ? { '@type': 'Organization', name: post.account } : publisher,
              publisher: { '@type': 'Person', name: site.author.name },
              articleSection: post.seriesMeta.title,
              ...(post.issue ? { isPartOf: { '@type': 'PodcastSeries', name: showName } } : {}),
            },
            breadcrumbs([[site.name, lp('/')], [post.seriesMeta.title, lp(`/blog/${post.series}`)], [post.title, post.url]]),
          ]
        : [],
    })
    if (post.indexed) sitemap.push({ path: post.url, lastmod: post.date, priority: post.series === 'podcast' ? '0.7' : post.listed ? '0.6' : '0.4' })
  }

  // Archives.
  if (listed.length) {
    page(lp('/blog'), {
      title: S.archiveTitle,
      description: S.archiveDesc(stats.posts),
      alternates: sectionAlternates('/blog'),
      body: t.archivePage({ posts: listed, active: 'all', title: S.archiveTitle, description: S.archiveDek(stats.posts) }),
    })
    sitemap.push({ path: lp('/blog'), lastmod: listed[0]?.date, priority: '0.8' })
  }
  for (const s of series) {
    const list = posts.filter((p) => p.series === s.id)
    if (!list.length) continue
    const info = t.seriesInfo(s.id)
    page(lp(`/blog/${s.id}`), {
      title: info.title,
      description: info.description,
      indexed: s.indexed,
      alternates: sectionAlternates(`/blog/${s.id}`),
      body: t.archivePage({ posts: list, active: s.id, title: info.title, description: S.seriesDek(info.description, list.length) }),
      jsonLd: s.indexed ? [breadcrumbs([[site.name, lp('/')], [info.title, lp(`/blog/${s.id}`)]])] : [],
    })
    if (s.indexed) sitemap.push({ path: lp(`/blog/${s.id}`), lastmod: list[0]?.date, priority: '0.8' })
  }

  // Manuals.
  if (docs.length) {
    page(lp('/docs'), {
      title: S.docsName,
      description: S.docsDesc,
      chrome: 'docs',
      bodyClass: 'is-docs',
      alternates: sectionAlternates('/docs'),
      body: docsHome({ groups, total: docs.length }),
    })
    sitemap.push({ path: lp('/docs'), priority: '0.6' })
    write(`${lp('/docs').slice(1)}/search.json`, JSON.stringify(docsSearchIndex(docs)))
    const ordered = groups.flatMap((g) => g.docs)
    for (const [i, doc] of ordered.entries()) {
      page(doc.url, {
        title: doc.title,
        description: doc.description,
        type: 'article',
        chrome: 'docs',
        bodyClass: 'is-docs',
        alternates: itemAlternates(doc),
        body: docsPage({ doc, groups, prev: ordered[i - 1], next: ordered[i + 1] }),
        jsonLd: [
          { '@context': 'https://schema.org', '@type': 'TechArticle', headline: doc.title, description: doc.description, inLanguage: lang, mainEntityOfPage: `${site.baseUrl}${doc.url}`, author: publisher },
          breadcrumbs([[site.name, lp('/')], [S.docsName, lp('/docs')], [doc.title, doc.url]]),
        ],
      })
      sitemap.push({ path: doc.url, priority: '0.5' })
    }
  }

  page(lp('/about'), {
    title: S.aboutKicker,
    description: S.aboutDesc(site.author.name),
    alternates: sectionAlternates('/about'),
    body: t.aboutPage({ stats }),
  })
  sitemap.push({ path: lp('/about'), priority: '0.3' })

  if (locale === DEFAULT_LOCALE) {
    write('404.html', t.layout({ path: '/404', title: S.notFoundTitle, description: S.notFoundDek, indexed: false, production, stats, body: t.notFoundPage({ posts }) }))
  }

  // Feed per language.
  const feedPosts = listed.slice(0, 30)
  const atom = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="${lang}">
  <title>${esc(site.name)}</title>
  <subtitle>${esc(S.description)}</subtitle>
  <link href="${site.baseUrl}${lp('/feed.xml')}" rel="self"/>
  <link href="${site.baseUrl}${lp('/')}"/>
  <id>${site.baseUrl}${lp('/')}</id>
  <updated>${feedPosts[0]?.date ?? '2026-01-01'}T00:00:00Z</updated>
  <author><name>${esc(site.author.name)}</name></author>
${feedPosts
  .map(
    (p) => `  <entry>
    <title>${esc(p.fullTitle)}</title>
    <link href="${site.baseUrl}${p.url}"/>
    <id>${site.baseUrl}${p.url}</id>
    <published>${p.date}T00:00:00Z</published>
    <updated>${p.date}T00:00:00Z</updated>
    <category term="${esc(p.seriesMeta.title)}"/>
    <summary>${esc(p.description)}</summary>
    <content type="html">${esc(p.html.replace(/(src|href)="\//g, `$1="${site.baseUrl}/`))}</content>
  </entry>`,
  )
  .join('\n')}
</feed>
`
  write(`${lp('/feed.xml').slice(1)}`, atom)
  if (locale === DEFAULT_LOCALE) write('blog/feed.xml', atom)

  return { posts: posts.length, docs: docs.length }
}

function copyTree(from, to) {
  mkdirSync(to, { recursive: true })
  for (const entry of readdirSync(from, { withFileTypes: true })) {
    if (entry.name === '.DS_Store') continue
    const src = join(from, entry.name)
    const dest = join(to, entry.name)
    if (entry.isDirectory()) copyTree(src, dest)
    else copyFileSync(src, dest)
  }
}

function write(rel, content) {
  const path = join(DIST, rel)
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, content)
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  if (!existsSync(join(ROOT, 'content'))) throw new Error('content/ not found')
  build()
}
