// Builds the static site into `dist/`.
//   node site/build.mjs              local build (no analytics, no ads)
//   NODE_ENV=production node site/build.mjs

import { mkdirSync, rmSync, writeFileSync, readFileSync, copyFileSync, readdirSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { createHash } from 'node:crypto'
import { site, series } from './config.mjs'
import { loadPosts, loadDocs } from './content.mjs'
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

  const posts = loadPosts()
  const { docs, groups } = loadDocs()
  const seriesCounts = Object.fromEntries(series.map((s) => [s.id, posts.filter((p) => p.series === s.id).length]))
  for (const s of series) s.count = seriesCounts[s.id]
  const stats = {
    posts: posts.filter((p) => p.listed).length,
    episodes: seriesCounts.podcast,
    seriesCounts,
    cssHash: hash(css),
    jsHash: hash(js),
  }

  const publisher = {
    '@type': 'Person',
    name: site.author.name,
    url: `${site.baseUrl}/about`,
  }
  const page = (path, opts) => {
    const html = t.layout({ path, production, stats, ...opts })
    write(path === '/' ? 'index.html' : `${path.slice(1)}.html`, html)
  }
  const breadcrumbs = (items) => ({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map(([name, path], i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name,
      item: `${site.baseUrl}${path}`,
    })),
  })

  // Home.
  page('/', {
    title: site.name,
    description: site.description,
    body: t.homePage({ posts, docGroups: groups }),
    bodyClass: 'is-home',
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: site.name,
        alternateName: site.tagline,
        url: `${site.baseUrl}/`,
        description: site.description,
        inLanguage: site.lang,
        author: publisher,
      },
    ],
  })

  // Articles.
  for (const post of posts) {
    const sameSeries = posts.filter((p) => p.series === post.series)
    const i = sameSeries.indexOf(post)
    const newer = sameSeries[i - 1]
    const older = sameSeries[i + 1]
    const related = [
      ...sameSeries.filter((p) => p !== post && p !== newer && p !== older),
      ...posts.filter((p) => p.series !== post.series && p.listed),
    ].slice(0, 3)
    page(post.url, {
      title: post.title,
      description: post.description,
      image: post.cover,
      type: 'article',
      indexed: post.indexed,
      published: post.date,
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
              inLanguage: site.lang,
              mainEntityOfPage: `${site.baseUrl}${post.url}`,
              image: post.cover ? [`${site.baseUrl}${post.cover}`] : [`${site.baseUrl}/og.png`],
              author: post.account ? { '@type': 'Organization', name: post.account } : publisher,
              publisher: { '@type': 'Person', name: site.author.name },
              articleSection: post.seriesMeta.title,
              ...(post.issue ? { isPartOf: { '@type': 'PodcastSeries', name: '冷知识盲盒' } } : {}),
            },
            breadcrumbs([
              [site.name, '/'],
              [post.seriesMeta.title, `/blog/${post.series}`],
              [post.title, post.url],
            ]),
          ]
        : [],
    })
  }

  // Archives.
  page('/blog', {
    title: '往期文章',
    description: `小举人的全部文章，共 ${stats.posts} 篇，按时间排列。`,
    body: t.archivePage({
      posts: posts.filter((p) => p.listed),
      active: 'all',
      title: '往期文章',
      description: `共 ${stats.posts} 篇，按时间排列。剪报不在此列。`,
    }),
  })
  for (const s of series) {
    const list = posts.filter((p) => p.series === s.id)
    if (!list.length) continue
    page(`/blog/${s.id}`, {
      title: s.title,
      description: s.description,
      indexed: s.indexed,
      body: t.archivePage({ posts: list, active: s.id, title: s.title, description: `${s.description} 共 ${list.length} 篇。` }),
      jsonLd: s.indexed ? [breadcrumbs([[site.name, '/'], [s.title, `/blog/${s.id}`]])] : [],
    })
  }

  // Manuals.
  page('/docs', {
    title: '手册',
    description: '能照着做的技术笔记：AI 工具、自托管、账号、建站和出海。',
    chrome: 'docs',
    bodyClass: 'is-docs',
    body: docsHome({ groups, total: docs.length }),
  })
  write('docs/search.json', JSON.stringify(docsSearchIndex(docs)))
  for (const [i, doc] of docs.entries()) {
    page(doc.url, {
      title: doc.title,
      description: doc.description,
      type: 'article',
      chrome: 'docs',
      bodyClass: 'is-docs',
      body: docsPage({ doc, groups, prev: docs[i - 1], next: docs[i + 1] }),
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'TechArticle',
          headline: doc.title,
          description: doc.description,
          inLanguage: site.lang,
          mainEntityOfPage: `${site.baseUrl}${doc.url}`,
          author: publisher,
        },
        breadcrumbs([[site.name, '/'], ['手册', '/docs'], [doc.title, doc.url]]),
      ],
    })
  }

  page('/about', {
    title: '关于',
    description: `关于小举人和作者 ${site.author.name}。`,
    body: t.aboutPage({ stats }),
  })

  // 404 (served by the Worker for unknown paths).
  write(
    '404.html',
    t.layout({
      path: '/404',
      title: '页面不存在',
      description: '这个页面不存在。',
      indexed: false,
      production,
      stats,
      body: t.notFoundPage({ posts }),
    }),
  )

  // Crawler files.
  const indexedPosts = posts.filter((p) => p.indexed)
  const urls = [
    { path: '/', lastmod: posts.find((p) => p.listed)?.date, priority: '1.0' },
    { path: '/blog', lastmod: posts.find((p) => p.listed)?.date, priority: '0.8' },
    ...series
      .filter((s) => s.indexed && s.count)
      .map((s) => ({ path: `/blog/${s.id}`, lastmod: posts.find((p) => p.series === s.id)?.date, priority: '0.8' })),
    ...indexedPosts.map((p) => ({ path: p.url, lastmod: p.date, priority: p.series === 'podcast' ? '0.7' : p.listed ? '0.6' : '0.4' })),
    { path: '/docs', priority: '0.6' },
    ...docs.map((d) => ({ path: d.url, priority: '0.5' })),
    { path: '/about', priority: '0.3' },
  ]
  write(
    'sitemap.xml',
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
      .map(
        (u) =>
          `  <url><loc>${site.baseUrl}${u.path}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}<priority>${u.priority}</priority></url>`,
      )
      .join('\n')}\n</urlset>\n`,
  )

  write(
    'robots.txt',
    ['User-agent: *', 'Allow: /', '', `Sitemap: ${site.baseUrl}/sitemap.xml`, ''].join('\n'),
  )

  const feedPosts = posts.filter((p) => p.listed).slice(0, 30)
  const atom = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="${site.lang}">
  <title>${esc(site.name)}</title>
  <subtitle>${esc(site.description)}</subtitle>
  <link href="${site.baseUrl}/feed.xml" rel="self"/>
  <link href="${site.baseUrl}/"/>
  <id>${site.baseUrl}/</id>
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
  write('feed.xml', atom)
  write('blog/feed.xml', atom)

  write('ads.txt', `google.com, ${site.adsense.publisher.replace(/^ca-/, '')}, DIRECT, f08c47fec0942fa0\n`)
  write(`${site.indexNowKey}.txt`, `${site.indexNowKey}\n`)
  write(`indexnow-${site.indexNowKey}.txt`, `${site.indexNowKey}\n`)

  // Old multilingual URLs and retired plugin-catalog pages.
  const redirects = [
    ...['zh-CN', 'zh-TW', 'en', 'ja', 'ko', 'ru', 'de', 'fr', 'es', 'pt'].flatMap((l) => [
      `/${l} / 301`,
      `/${l}/* /:splat 301`,
    ]),
  ]
  write('_redirects', `${redirects.join('\n')}\n`)
  write(
    '_headers',
    [
      '/assets/*',
      '  Cache-Control: public, max-age=31536000, immutable',
      '/blog/covers/*',
      '  Cache-Control: public, max-age=2592000',
      '',
    ].join('\n'),
  )

  const report = {
    pages: posts.length + docs.length + series.filter((s) => s.count).length + 4,
    posts: posts.length,
    indexed: indexedPosts.length,
    noindex: posts.length - indexedPosts.length,
    docs: docs.length,
    ms: Date.now() - started,
  }
  console.log(
    `built ${report.pages} pages (${report.posts} posts, ${report.indexed} indexed, ${report.noindex} noindex, ${report.docs} manuals) in ${report.ms} ms → dist/${production ? ' [production]' : ''}`,
  )
  return report
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
