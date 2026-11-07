// HTML templates. Plain functions returning strings.

import { escapeHtml as esc } from './markdown.mjs'
import { site, series, seriesById } from './config.mjs'
import { searchDialog } from './docs-templates.mjs'
import { STRINGS, LOCALE_META, SERIES_I18N, localePath, stripLocale, formatDate } from './i18n.mjs'

// The locale being rendered. The build renders one locale at a time.
export let L = 'zh'
export let S = STRINGS.zh
let enabledLocales = ['zh']
export function setLocale(locale, enabled) {
  L = locale
  S = STRINGS[locale]
  enabledLocales = enabled
}
/** Path in the current locale. */
export const lp = (path) => localePath(L, path)

export function seriesInfo(id) {
  const base = seriesById.get(id)
  return L === 'zh' ? base : { ...base, ...(SERIES_I18N[L]?.[id] ?? {}) }
}

const abs = (path) => `${site.baseUrl}${path}`

/** 中文 / English / 日本語 — links to this page in each language that has it. */
function languageSwitch(alternates, extra = '') {
  if (enabledLocales.length < 2) return ''
  return `<nav class="langs${extra}" aria-label="${S.languages}">${enabledLocales
    .map((loc) => {
      const href = alternates?.[loc] ?? localePath(loc, '/')
      const meta = LOCALE_META[loc]
      return loc === L
        ? `<a href="${href}" aria-current="true" lang="${meta.lang}">${meta.label}</a>`
        : `<a href="${href}" lang="${meta.lang}" hreflang="${meta.hreflang}">${meta.label}</a>`
    })
    .join('')}</nav>`
}

function seal(extra = '') {
  return `<span class="seal${extra}" aria-hidden="true">举</span>`
}

// ---------------------------------------------------------------------------
// Shell

export function layout({
  path,
  title,
  description,
  body,
  image,
  type = 'website',
  indexed = true,
  jsonLd = [],
  bodyClass = '',
  chrome = 'magazine',
  production,
  stats,
  published,
  alternates,
}) {
  const home = stripLocale(path) === '/'
  const fullTitle = home ? `${site.name} · ${S.tagline}` : `${title} · ${site.name}`
  const canonical = abs(path)
  const hreflang = indexed && alternates
    ? [
        ...Object.entries(alternates).map(([loc, url]) => `<link rel="alternate" hreflang="${LOCALE_META[loc].hreflang}" href="${esc(abs(url))}">`),
        alternates.zh ? `<link rel="alternate" hreflang="x-default" href="${esc(abs(alternates.zh))}">` : '',
      ].join('\n')
    : ''
  const ogImage = abs(image ?? '/og.png')
  const today = new Date().toISOString().slice(0, 10)
  const head = [
    `<meta charset="utf-8">`,
    `<meta name="viewport" content="width=device-width, initial-scale=1">`,
    `<title>${esc(fullTitle)}</title>`,
    `<meta name="description" content="${esc(description)}">`,
    indexed
      ? `<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">\n<link rel="canonical" href="${esc(canonical)}">${hreflang ? `\n${hreflang}` : ''}`
      : `<meta name="robots" content="noindex, follow">`,
    `<meta name="author" content="${esc(site.author.name)}">`,
    `<meta name="theme-color" content="#f4efe6" media="(prefers-color-scheme: light)">`,
    `<meta name="theme-color" content="#16130f" media="(prefers-color-scheme: dark)">`,
    `<meta property="og:site_name" content="${esc(site.name)}">`,
    `<meta property="og:locale" content="${LOCALE_META[L].og}">`,
    `<meta property="og:type" content="${type}">`,
    `<meta property="og:title" content="${esc(title)}">`,
    `<meta property="og:description" content="${esc(description)}">`,
    `<meta property="og:url" content="${esc(canonical)}">`,
    `<meta property="og:image" content="${esc(ogImage)}">`,
    published ? `<meta property="article:published_time" content="${published}">` : '',
    `<meta name="twitter:card" content="summary_large_image">`,
    `<link rel="icon" href="/favicon.svg" type="image/svg+xml">`,
    `<link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png">`,
    `<link rel="apple-touch-icon" href="/apple-touch-icon.png">`,
    `<link rel="alternate" type="application/atom+xml" title="${esc(site.name)}" href="${abs(lp('/feed.xml'))}">`,
    `<link rel="stylesheet" href="/assets/site.css?v=${stats.cssHash}">`,
    ...jsonLd.map((block) => `<script type="application/ld+json">${JSON.stringify(block).replace(/</g, '\\u003c')}</script>`),
    production && site.analytics.ga4
      ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${site.analytics.ga4}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${site.analytics.ga4}');</script>`
      : '',
    production && indexed && site.adsense.publisher
      ? `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${site.adsense.publisher}" crossorigin="anonymous"></script>`
      : '',
  ]
    .filter(Boolean)
    .join('\n')

  const bare = stripLocale(path)
  const activeHref = bare === '/' ? '/' : bare.startsWith('/blog/podcast')
    ? '/blog/podcast'
    : bare.startsWith('/blog/wechat')
      ? '/blog/wechat'
      : ['/blog', '/docs', '/about'].find((h) => bare === h || bare.startsWith(`${h}/`))

  return `<!doctype html>
<html lang="${LOCALE_META[L].lang}">
<head>
${head}
</head>
<body class="${bodyClass}">
<a class="skip" href="#main">${S.skip}</a>
${chrome === 'docs' ? docsHeader(alternates) : magazineHeader({ path, stats, activeHref, today, alternates })}
<main id="main">
${body}
</main>
${chrome === 'docs' ? docsFooter() : magazineFooter(stats)}
<script src="/assets/site.js?v=${stats.jsHash}" defer></script>
</body>
</html>
`
}


function navItems() {
  return [
    ['/', S.nav.home],
    ['/blog/podcast', S.nav.podcast],
    ['/blog', S.nav.blog],
    ['/docs', S.nav.docs],
    ['/blog/wechat', S.nav.wechat],
    ['/about', S.nav.about],
  ].filter(([, label]) => label)
}

function magazineHeader({ path, stats, activeHref, today, alternates }) {
  const front = stripLocale(path) === '/'
  return `<header class="masthead${front ? ' masthead--front' : ''}">
  <div class="topline wrap">
    <span class="topline__date">${formatDate(L, today, { weekday: true })}</span>
    <span class="topline__motto">${esc(S.tagline)}</span>
    <span class="topline__tools">
      ${languageSwitch(alternates)}
      <a href="${lp('/feed.xml')}">RSS</a>
    </span>
  </div>
  <div class="nameplate wrap">
    <a class="nameplate__link" href="${lp('/')}" aria-label="${esc(S.homeAria(site.name))}">${seal()}<span class="nameplate__name">${esc(site.name)}</span></a>
    ${front ? `<p class="nameplate__sub">${S.nameplateSub(stats.posts, stats.episodes)}</p>` : ''}
  </div>
  <nav class="sections wrap" aria-label="${S.sectionsAria}">
    ${navItems().map(([href, label]) => `<a href="${lp(href)}"${href === activeHref ? ' aria-current="page"' : ''}>${label}</a>`).join('')}
  </nav>
</header>
`
}

function magazineFooter(stats) {
  return `<footer class="colophon">
  <div class="wrap colophon__grid">
    <div>
      <a class="colophon__brand" href="${lp('/')}">${seal(' seal--sm')}${esc(site.name)}</a>
      <p>${esc(S.description)}</p>
    </div>
    <div>
      <h2>${S.footerSections}</h2>
      <ul>${series
        .filter((s) => stats.seriesCounts[s.id])
        .map((s) => `<li><a href="${lp(`/blog/${s.id}`)}">${esc(seriesInfo(s.id).title)}</a></li>`)
        .join('')}${stats.docs ? `<li><a href="${lp('/docs')}">${S.docsName}</a></li>` : ''}</ul>
    </div>
    <div>
      <h2>${S.footerSubscribe}</h2>
      <ul><li><a href="${lp('/feed.xml')}">RSS / Atom</a></li><li><a href="${lp('/about')}">${S.aboutAuthor}</a></li><li><a href="/sitemap.xml">${S.sitemap}</a></li></ul>
    </div>
  </div>
  <p class="wrap colophon__fine">© ${new Date().getFullYear()} ${esc(site.author.name)}　${S.footerFine}</p>
</footer>
`
}

/** Compact top bar for the manuals (documentation-style shell). */
function docsHeader(alternates) {
  return `<header class="dh">
  <div class="dh__bar">
    <button type="button" class="dh__menu" data-docs-menu aria-label="${S.docsMenu}" aria-expanded="false"><svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true"><path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></button>
    <a class="dh__brand" href="${lp('/')}">${seal(' seal--sm')}<span>${esc(site.name)}</span></a>
    <a class="dh__section" href="${lp('/docs')}">${S.docsName}</a>
    <button type="button" class="dh__search" data-search-open aria-label="${S.docsSearch}">
      <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><circle cx="9" cy="9" r="5.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="m13.2 13.2 3.3 3.3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
      <span>${S.docsSearch}</span><kbd>⌘K</kbd>
    </button>
    <nav class="dh__links" aria-label="${S.siteLinks}">
      <a href="${lp('/blog')}">${S.articles}</a><a href="${lp('/blog/podcast')}">${S.nav.podcast}</a>
    </nav>
    ${languageSwitch(alternates, ' dh__langs')}
  </div>
</header>
${searchDialog()}`
}

function docsFooter() {
  return `<footer class="df"><p>© ${new Date().getFullYear()} ${esc(site.author.name)}　<a href="${lp('/')}">${esc(site.name)}</a>　<a href="${lp('/feed.xml')}">RSS</a></p></footer>`
}

// ---------------------------------------------------------------------------
// Pieces

function kicker(post) {
  if (post.kind === 'doc') return `<a href="${lp('/docs')}">${S.docsName}</a><span>${esc(post.group)}</span>`
  const s = post.seriesMeta
  return `<a href="${lp(`/blog/${s.id}`)}">${esc(s.title)}</a>${post.issue ? `<span>${S.issue(post.issue)}</span>` : ''}${
    post.account ? `<span>${esc(post.account)}</span>` : ''
  }`
}

function byline(post) {
  if (post.kind === 'doc') return `<span>${S.docMinutes(post.minutes)}</span>`
  const who = post.account ? esc(S.reposted(post.account)) : esc(S.by(post.author ?? site.author.name))
  return `<span>${who}</span><time datetime="${post.date}">${formatDate(L, post.date)}</time><span>${S.minutes(post.minutes)}</span>`
}

function typeCover(doc) {
  const word = doc.coverWord
  const latin = /^[A-Za-z]/.test(word)
  return `<div class="cover cover--type${latin ? '' : ' cover--cjk'}${word.length > 9 ? ' cover--long' : ''}" aria-hidden="true"><span class="cover__word">${esc(word)}</span>${seal(' seal--sm')}</div>`
}

function cover(post, { sizes = '(min-width: 60rem) 40rem, 100vw', eager = false } = {}) {
  if (post.kind === 'doc') return typeCover(post)
  if (!post.cover) return `<div class="cover cover--blank">${seal(' seal--lg')}</div>`
 const dims = post.coverSize ? ` width="${post.coverSize.width}" height="${post.coverSize.height}"` : ''
  return `<img class="cover" src="${esc(post.cover)}"${dims} alt="" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" sizes="${sizes}">`
}

export function card(post, { withCover = true, level = 3 } = {}) {
  return `<article class="card">
  ${withCover ? `<a class="card__media" href="${post.url}" tabindex="-1" aria-hidden="true">${cover(post)}</a>` : ''}
  <p class="kicker">${kicker(post)}</p>
  <h${level} class="card__title"><a href="${post.url}">${esc(post.title)}</a></h${level}>
  <p class="card__dek">${esc(post.description)}</p>
  <p class="byline">${byline(post)}</p>
</article>`
}

function listRow(post, { showSeries = true } = {}) {
  return `<li class="row">
  <time datetime="${post.date}">${post.date.slice(5).replace('-', '.')}</time>
  <div>
    <a class="row__title" href="${post.url}">${esc(post.title)}</a>
    <span class="row__meta">${[showSeries ? post.seriesMeta.title : '', post.issue ? S.issue(post.issue) : '', post.account ?? ''].filter(Boolean).map((x) => `<span>${esc(x)}</span>`).join('')}</span>
  </div>
</li>`
}

function sectionHead(title, href, note = '') {
  return `<div class="section-head"><h2>${href ? `<a href="${href}">${esc(title)}</a>` : esc(title)}</h2>${note ? `<p>${note}</p>` : ''}${
    href ? `<a class="section-head__more" href="${href}">${S.viewAll}</a>` : ''
  }</div>`
}

// ---------------------------------------------------------------------------
// Pages

export function homePage({ posts, docGroups }) {
  const indexed = posts.filter((p) => p.listed)
  const episodes = indexed.filter((p) => p.series === 'podcast')
  const lead = episodes[0] ?? indexed[0]
  const contents = indexed.filter((p) => p !== lead).slice(0, 6)
  const moreEpisodes = episodes.filter((p) => p !== lead).slice(0, 6)
  const notes = indexed.filter((p) => p.series !== 'podcast').slice(0, 6)
  const clippings = posts.filter((p) => p.series === 'wechat').slice(0, 8)

  const count = (id) => posts.filter((p) => p.series === id).length
  const docCount = docGroups.reduce((n, g) => n + g.docs.length, 0)
  const box = episodes.map((p) => ({ i: S.issue(p.issue), t: p.title, d: p.description, u: p.url }))
  const hasNotes = notes.length > 0
  const hasDocs = docCount > 0

  return `
<section class="intro wrap" aria-label="${S.introAria}">
  <p class="intro__line">${S.intro({ name: esc(site.author.name), eps: count('podcast'), notes: count('tech'), docs: docCount, p: lp })}</p>
  <div class="blindbox">
    <button type="button" class="blindbox__open" data-blindbox data-again="${S.blindboxAgain}">${S.blindbox}</button>
    <a class="blindbox__result" href="${lead.url}" hidden aria-live="polite"></a>
    <script type="application/json" id="blindbox-data">${JSON.stringify(box).replace(/</g, '\\u003c')}</script>
  </div>
</section>

<section class="front wrap">
  <article class="lead">
    <a class="lead__media" href="${lead.url}" tabindex="-1" aria-hidden="true">${cover(lead, { eager: true, sizes: '(min-width: 60rem) 60vw, 100vw' })}</a>
    <div class="lead__text">
      <p class="kicker">${kicker(lead)}</p>
      <h2 class="lead__title"><a href="${lead.url}">${esc(lead.title)}</a></h2>
      <p class="lead__dek">${esc(lead.description)}</p>
      <p class="byline">${byline(lead)}</p>
    </div>
  </article>
  <aside class="contents" aria-labelledby="contents-title">
    <h2 id="contents-title" class="contents__title">${S.contents}</h2>
    <ol>
      ${contents
        .map(
          (p) => `<li><a href="${p.url}"><span class="contents__series">${esc(p.seriesMeta.short)}</span><span class="contents__headline">${esc(p.title)}</span></a></li>`,
        )
        .join('')}
    </ol>
    <a class="contents__more" href="${lp('/blog')}">${S.contentsMore}</a>
  </aside>
</section>

<section class="band wrap" aria-labelledby="show">
  ${sectionHead(seriesInfo('podcast').title, lp('/blog/podcast'), S.podcastNote)}
  <div class="grid grid--3">
    ${moreEpisodes.map((p) => card(p)).join('')}
  </div>
</section>

${hasNotes ? `<section class="band wrap">
  ${sectionHead(S.notes, lp('/blog/tech'), S.notesNote)}
  <div class="grid grid--3">
    ${notes.map((p) => card(p)).join('')}
  </div>
</section>` : ''}

${hasDocs ? `<section class="band wrap">
  ${sectionHead(S.docsName, lp('/docs'), S.docsNote)}
  <div class="grid grid--3">
    ${docGroups
      .filter((g) => g.docs.length)
      .map((g) => g.docs[0])
      .slice(0, 6)
      .map((d) => card(d))
      .join('')}
  </div>
</section>` : ''}

${
  clippings.length
    ? `<section class="band band--clip wrap">
  ${sectionHead(seriesInfo('wechat').title, '/blog/wechat', S.clipNote)}
  <ul class="clip-list">
    ${clippings.map((p) => `<li><a href="${p.url}">${esc(p.title)}</a><span>${esc(p.account ?? '')}</span></li>`).join('')}
  </ul>
</section>`
    : ''
}
`
}

export function articlePage({ post, prev, next, related }) {
  const sections = post.headings.filter((h) => h.level === 2)
  const toc =
    sections.length >= 3
      ? `<details class="toc"><summary>${S.toc}<span>${S.tocCount(sections.length)}</span></summary><ol>${sections
          .map((h) => `<li><a href="#${encodeURIComponent(h.id)}">${h.html.replace(/<a [^>]*>|<\/a>/g, '')}</a></li>`)
          .join('')}</ol></details>`
      : ''

  const notice = post.account
    ? `<aside class="notice">${esc(S.repostNotice(post.account))}</aside>`
    : ''

  return `
<div class="progress" aria-hidden="true"><span></span></div>
<article class="article${post.kind === 'doc' ? ' article--doc' : ''}">
  ${post.kind === 'post' && post.cover ? `<figure class="article__cover">${cover(post, { eager: true, sizes: '(min-width: 56rem) 54rem, 100vw' })}</figure>` : ''}
  <div class="article__grid">
    <header class="article__head">
      <p class="kicker">${kicker(post)}</p>
      <h1 class="article__title">${esc(post.title)}</h1>
      ${post.description ? `<p class="article__dek">${esc(post.description)}</p>` : ''}
      <p class="byline article__byline">${byline(post)}</p>
      ${toc}
    </header>
    <div class="prose">
      ${notice}
      ${post.html}
      <p class="endmark" aria-hidden="true">${seal(' seal--sm')}</p>
    </div>
  </div>
  <footer class="article__foot">
    ${
      post.kind === 'post' && !post.account
        ? `<div class="author">${seal(' seal--md')}<div><p class="author__name">${esc(site.author.name)}</p><p>${esc(S.authorBio)}</p><p class="author__links"><a href="${lp('/about')}">${S.aboutAuthor}</a><a href="${lp('/feed.xml')}">${S.subscribe}</a></p></div></div>`
        : ''
    }
    ${
      prev || next
        ? `<nav class="pager" aria-label="${S.pagerAria}">${prev ? `<a class="pager__prev" href="${prev.url}"><span>${post.kind === 'doc' ? S.prevDoc : prev.issue ? S.prevIssue(prev.issue) : S.prev}</span>${esc(prev.title)}</a>` : '<span></span>'}${
            next ? `<a class="pager__next" href="${next.url}"><span>${post.kind === 'doc' ? S.nextDoc : next.issue ? S.nextIssue(next.issue) : S.next}</span>${esc(next.title)}</a>` : ''
          }</nav>`
        : ''
    }
  </footer>
</article>
${
  related?.length
    ? `<section class="band wrap related"><div class="section-head"><h2>${S.related}</h2></div><div class="grid grid--3">${related
        .map((p) => card(p))
        .join('')}</div></section>`
    : ''
}
`
}

export function archivePage({ posts, active, title, description }) {
  const tabs = [{ id: 'all', href: lp('/blog'), title: S.all }, ...series.filter((s) => s.count).map((s) => ({ id: s.id, href: lp(`/blog/${s.id}`), title: seriesInfo(s.id).title }))]
  const byYear = new Map()
  for (const p of posts) {
    const y = p.date.slice(0, 4)
    if (!byYear.has(y)) byYear.set(y, [])
    byYear.get(y).push(p)
  }
  const meta = active === 'all' ? null : seriesById.get(active)

  let listing
  if (active !== 'all' && active !== 'wechat') {
    listing = `<div class="grid grid--3 grid--episodes">${posts.map((p) => card(p)).join('')}</div>`
  } else if (active === 'wechat') {
    const byAccount = new Map()
    for (const p of posts) {
      const k = p.account ?? S.other
      if (!byAccount.has(k)) byAccount.set(k, [])
      byAccount.get(k).push(p)
    }
    const accounts = [...byAccount.entries()].sort((a, b) => b[1].length - a[1].length)
    listing = `<nav class="accounts" aria-label="${S.accountsAria}">${accounts
      .map(([account, list]) => `<a href="#${encodeURIComponent(account)}">${esc(account)}<span>${list.length}</span></a>`)
      .join('')}</nav>${accounts
      .map(
        ([account, list]) =>
          `<section class="account" id="${esc(account)}"><h2 class="account__name">${esc(account)}<small>${S.count(list.length)}</small></h2><div class="grid grid--3">${list
            .map((p) => card(p))
            .join('')}</div></section>`,
      )
      .join('')}`
  } else {
    listing = [...byYear.entries()]
      .map(
        ([year, list]) =>
          `<section class="year"><h2 class="year__label">${year}<small>${S.count(list.length)}</small></h2><ol class="rows">${list
            .map((p) => listRow(p, { showSeries: active === 'all' }))
            .join('')}</ol></section>`,
      )
      .join('')
  }

  return `
<header class="page-head wrap">
  <p class="kicker">${meta ? S.section : S.archive}</p>
  <h1>${esc(title)}</h1>
  <p class="page-head__dek">${esc(description)}</p>
  <nav class="tabs" aria-label="${S.filterAria}">${tabs
    .map((t) => `<a href="${t.href}"${t.id === active ? ' aria-current="page"' : ''}>${esc(t.title)}</a>`)
    .join('')}</nav>
</header>
<div class="wrap archive">
${listing}
</div>
`
}

export function aboutPage({ stats }) {
  return `
<article class="article">
  <div class="article__grid">
    <header class="article__head">
      <p class="kicker">${S.aboutKicker}</p>
      <h1 class="article__title">${S.aboutTitle}</h1>
      <p class="article__dek">${esc(S.description)}</p>
    </header>
    <div class="prose">
      ${S.about({ name: esc(site.author.name), bio: esc(S.authorBio), eps: stats.episodes, p: lp })}
      <p class="endmark" aria-hidden="true">${seal(' seal--sm')}</p>
    </div>
  </div>
</article>
`
}

export function notFoundPage({ posts }) {
  return `
<header class="page-head wrap notfound">
  <p class="kicker">404</p>
  <h1>${S.notFoundTitle}</h1>
  <p class="page-head__dek">${S.notFoundDek}</p>
  <p><a class="button" href="${lp('/')}">${S.backHome}</a> <a class="button button--ghost" href="${lp('/blog')}">${S.archiveTitle}</a></p>
</header>
<div class="wrap archive"><ol class="rows">${posts
    .filter((p) => p.listed)
    .slice(0, 8)
    .map((p) => listRow(p))
    .join('')}</ol></div>
`
}
