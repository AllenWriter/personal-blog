// HTML templates. Plain functions returning strings.

import { escapeHtml as esc } from './markdown.mjs'
import { site, series, seriesById, nav } from './config.mjs'
import { searchDialog } from './docs-templates.mjs'

const WEEKDAYS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']

export function cnDate(iso, { weekday = false } = {}) {
  const [y, m, d] = String(iso).slice(0, 10).split('-').map(Number)
  const day = new Date(Date.UTC(y, m - 1, d)).getUTCDay()
  return `${y}年${m}月${d}日${weekday ? ` ${WEEKDAYS[day]}` : ''}`
}

const abs = (path) => `${site.baseUrl}${path}`

function translateLinks(path) {
  const host = new URL(site.baseUrl).host.replace(/-/g, '--').replace(/\./g, '-')
  return site.translateTo
    .map(
      (t) =>
        `<a href="https://${host}.translate.goog${path}?_x_tr_sl=zh-CN&amp;_x_tr_tl=${t.code}&amp;_x_tr_hl=${t.code}" rel="nofollow noopener" lang="${t.code}" data-translate="${t.code}">${t.label}</a>`,
    )
    .join('')
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
}) {
  const fullTitle = path === '/' ? `${site.name} · ${site.tagline}` : `${title} · ${site.name}`
  const canonical = abs(path === '/' ? '/' : path)
  const ogImage = abs(image ?? '/og.png')
  const today = new Date().toISOString().slice(0, 10)
  const head = [
    `<meta charset="utf-8">`,
    `<meta name="viewport" content="width=device-width, initial-scale=1">`,
    `<title>${esc(fullTitle)}</title>`,
    `<meta name="description" content="${esc(description)}">`,
    indexed
      ? `<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">\n<link rel="canonical" href="${esc(canonical)}">`
      : `<meta name="robots" content="noindex, follow">`,
    `<meta name="author" content="${esc(site.author.name)}">`,
    `<meta name="theme-color" content="#f4efe6" media="(prefers-color-scheme: light)">`,
    `<meta name="theme-color" content="#16130f" media="(prefers-color-scheme: dark)">`,
    `<meta property="og:site_name" content="${esc(site.name)}">`,
    `<meta property="og:locale" content="zh_CN">`,
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
    `<link rel="alternate" type="application/atom+xml" title="${esc(site.name)}" href="${abs('/feed.xml')}">`,
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

  const section = path === '/' ? '/' : nav.slice(1).find((n) => path === n.href || path.startsWith(`${n.href}/`))?.href
  const activeHref =
    path.startsWith('/blog/podcast') ? '/blog/podcast' : path.startsWith('/blog/wechat') ? '/blog/wechat' : section

  return `<!doctype html>
<html lang="${site.lang}">
<head>
${head}
</head>
<body class="${bodyClass}">
<a class="skip" href="#main">跳到正文</a>
${chrome === 'docs' ? docsHeader(path) : magazineHeader({ path, stats, activeHref, today })}
<main id="main">
${body}
</main>
${chrome === 'docs' ? docsFooter() : magazineFooter(stats)}
<script src="/assets/site.js?v=${stats.jsHash}" defer></script>
</body>
</html>
`
}


function magazineHeader({ path, stats, activeHref, today }) {
  return `<header class="masthead${path === '/' ? ' masthead--front' : ''}">
  <div class="topline wrap">
    <span class="topline__date">${cnDate(today, { weekday: true })}</span>
    <span class="topline__motto">${esc(site.tagline)}</span>
    <span class="topline__tools">
      <span class="translate" aria-label="机器翻译本页">译 ${translateLinks(path)}</span>
      <a href="/feed.xml">RSS</a>
    </span>
  </div>
  <div class="nameplate wrap">
    <a class="nameplate__link" href="/" aria-label="${esc(site.name)} 首页">${seal()}<span class="nameplate__name">${esc(site.name)}</span></a>
    ${path === '/' ? `<p class="nameplate__sub">Jens 的个人杂志 · 已刊 ${stats.posts} 篇 · 冷知识盲盒 ${stats.episodes} 期</p>` : ''}
  </div>
  <nav class="sections wrap" aria-label="栏目">
    ${nav.map((n) => `<a href="${n.href}"${n.href === activeHref ? ' aria-current="page"' : ''}>${n.label}</a>`).join('')}
  </nav>
</header>
`
}

function magazineFooter(stats) {
  return `<footer class="colophon">
  <div class="wrap colophon__grid">
    <div>
      <a class="colophon__brand" href="/">${seal(' seal--sm')}${esc(site.name)}</a>
      <p>${esc(site.description)}</p>
    </div>
    <div>
      <h2>栏目</h2>
      <ul>${series
        .filter((s) => stats.seriesCounts[s.id])
        .map((s) => `<li><a href="/blog/${s.id}">${esc(s.title)}</a></li>`)
        .join('')}<li><a href="/docs">手册</a></li></ul>
    </div>
    <div>
      <h2>订阅</h2>
      <ul><li><a href="/feed.xml">RSS / Atom</a></li><li><a href="/about">关于作者</a></li><li><a href="/sitemap.xml">网站地图</a></li></ul>
    </div>
  </div>
  <p class="wrap colophon__fine">© ${new Date().getFullYear()} ${esc(site.author.name)} · 剪报栏目内容版权归原作者</p>
</footer>
`
}

/** Compact top bar for the manuals (documentation-style shell). */
function docsHeader(path) {
  return `<header class="dh">
  <div class="dh__bar">
    <button type="button" class="dh__menu" data-docs-menu aria-label="打开手册目录" aria-expanded="false"><svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true"><path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></button>
    <a class="dh__brand" href="/">${seal(' seal--sm')}<span>${esc(site.name)}</span></a>
    <a class="dh__section" href="/docs">手册</a>
    <button type="button" class="dh__search" data-search-open aria-label="搜索手册">
      <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><circle cx="9" cy="9" r="5.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="m13.2 13.2 3.3 3.3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
      <span>搜索手册</span><kbd>⌘K</kbd>
    </button>
    <nav class="dh__links" aria-label="站点">
      <a href="/blog">文章</a><a href="/blog/podcast">冷知识盲盒</a>
      <span class="translate dh__translate" aria-label="机器翻译本页">译 ${translateLinks(path)}</span>
    </nav>
  </div>
</header>
${searchDialog()}`
}

function docsFooter() {
  return `<footer class="df"><p>© ${new Date().getFullYear()} ${esc(site.author.name)} · <a href="/">${esc(site.name)}</a> · <a href="/feed.xml">RSS</a></p></footer>`
}

// ---------------------------------------------------------------------------
// Pieces

function kicker(post) {
  if (post.kind === 'doc') return `<a href="/docs">手册</a><span>${esc(post.group)}</span>`
  const s = post.seriesMeta
  return `<a href="/blog/${s.id}">${esc(s.title)}</a>${post.issue ? `<span>第 ${post.issue} 期</span>` : ''}${
    post.account ? `<span>${esc(post.account)}</span>` : ''
  }`
}

function byline(post) {
  if (post.kind === 'doc') return `<span>约 ${post.minutes} 分钟读完</span>`
  const who = post.account ? `转自「${esc(post.account)}」` : `文 / ${esc(post.author ?? site.author.name)}`
  return `<span>${who}</span><time datetime="${post.date}">${cnDate(post.date)}</time><span>约 ${post.minutes} 分钟</span>`
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
    <span class="row__meta">${[showSeries ? post.seriesMeta.title : '', post.issue ? `第 ${post.issue} 期` : '', post.account ?? ''].filter(Boolean).map((x) => `<span>${esc(x)}</span>`).join('')}</span>
  </div>
</li>`
}

function sectionHead(title, href, note = '') {
  return `<div class="section-head"><h2>${href ? `<a href="${href}">${esc(title)}</a>` : esc(title)}</h2>${note ? `<p>${note}</p>` : ''}${
    href ? `<a class="section-head__more" href="${href}">查看全部</a>` : ''
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
  const box = episodes.map((p) => ({ i: p.issue, t: p.title, d: p.description, u: p.url }))

  return `
<section class="intro wrap" aria-label="简介">
  <p class="intro__line">你好，我是 ${esc(site.author.name)}。这里有 <a href="/blog/podcast">${count('podcast')} 期冷知识盲盒</a>、<a href="/blog/tech">${count('tech')} 篇技术手记</a>，和 <a href="/docs">${docCount} 篇能照着做的手册</a>。</p>
  <div class="blindbox">
    <button type="button" class="blindbox__open" data-blindbox>拆一个盲盒</button>
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
    <h2 id="contents-title" class="contents__title">本期要目</h2>
    <ol>
      ${contents
        .map(
          (p) => `<li><a href="${p.url}"><span class="contents__series">${esc(p.seriesMeta.short)}</span><span class="contents__headline">${esc(p.title)}</span></a></li>`,
        )
        .join('')}
    </ol>
    <a class="contents__more" href="/blog">往期全部文章</a>
  </aside>
</section>

<section class="band wrap" aria-labelledby="show">
  ${sectionHead('冷知识盲盒', '/blog/podcast', '每期一个冷知识，讲清楚它背后的商业和历史。')}
  <div class="grid grid--3">
    ${moreEpisodes.map((p) => card(p)).join('')}
  </div>
</section>

<section class="band wrap">
  ${sectionHead('手记', '/blog/tech', '做 AI 产品、搭流水线、理财和生活里想明白的事。')}
  <div class="grid grid--3">
    ${notes.map((p) => card(p)).join('')}
  </div>
</section>

<section class="band wrap">
  ${sectionHead('手册', '/docs', '能照着做的技术笔记。')}
  <div class="grid grid--3">
    ${docGroups
      .filter((g) => g.docs.length)
      .map((g) => g.docs[0])
      .slice(0, 6)
      .map((d) => card(d))
      .join('')}
  </div>
</section>

${
  clippings.length
    ? `<section class="band band--clip wrap">
  ${sectionHead('剪报', '/blog/wechat', '从别的公众号剪下来的好文章，版权归原作者。')}
  <ul class="clip-list">
    ${clippings.map((p) => `<li><a href="${p.url}">${esc(p.title)}</a><span>${esc(p.account ?? '')}</span></li>`).join('')}
  </ul>
</section>`
    : ''
}
`
}

export function articlePage({ post, prev, next, related, siblings }) {
  const toc =
    post.headings.filter((h) => h.level === 2).length >= 3
      ? `<nav class="toc" aria-label="本文目录"><h2>本文目录</h2><ol>${post.headings
          .filter((h) => h.level === 2)
          .map((h) => `<li><a href="#${encodeURIComponent(h.id)}">${h.html}</a></li>`)
          .join('')}</ol></nav>`
      : ''

  const notice = post.account
    ? `<aside class="notice">本文转载自公众号「${esc(post.account)}」，版权归原作者所有，仅作个人收藏与分享。如有不妥请联系删除。</aside>`
    : ''

  const docNav =
    post.kind === 'doc' && siblings?.length > 1
      ? `<nav class="doc-siblings" aria-label="${esc(post.group)}"><h2>同组手册 · ${esc(post.group)}</h2><ul>${siblings
          .map((d) => `<li><a href="${d.url}"${d === post ? ' aria-current="page"' : ''}>${esc(d.title)}</a></li>`)
          .join('')}</ul></nav>`
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
      <p class="byline article__byline">${post.kind === 'post' ? byline(post) : `<span>约 ${post.minutes} 分钟</span>`}</p>
    </header>
    <div class="prose">
      ${notice}
      ${post.html}
      <p class="endmark" aria-hidden="true">${seal(' seal--sm')}</p>
    </div>
    ${toc || docNav ? `<aside class="article__aside">${toc}${docNav}</aside>` : ''}
  </div>
  <footer class="article__foot">
    ${
      post.kind === 'post' && !post.account
        ? `<div class="author">${seal(' seal--md')}<div><p class="author__name">${esc(site.author.name)}</p><p>${esc(site.author.bio)}</p><p class="author__links"><a href="/about">关于作者</a><a href="/feed.xml">订阅更新</a></p></div></div>`
        : ''
    }
    ${
      prev || next
        ? `<nav class="pager" aria-label="上一篇和下一篇">${prev ? `<a class="pager__prev" href="${prev.url}"><span>${post.kind === 'doc' ? '上一篇手册' : prev.issue ? `上一期　第 ${prev.issue} 期` : '上一篇'}</span>${esc(prev.title)}</a>` : '<span></span>'}${
            next ? `<a class="pager__next" href="${next.url}"><span>${post.kind === 'doc' ? '下一篇手册' : next.issue ? `下一期　第 ${next.issue} 期` : '下一篇'}</span>${esc(next.title)}</a>` : ''
          }</nav>`
        : ''
    }
  </footer>
</article>
${
  related?.length
    ? `<section class="band wrap related"><div class="section-head"><h2>接着读</h2></div><div class="grid grid--3">${related
        .map((p) => card(p))
        .join('')}</div></section>`
    : ''
}
`
}

export function archivePage({ posts, active, title, description }) {
  const tabs = [{ id: 'all', href: '/blog', title: '全部' }, ...series.filter((s) => s.count).map((s) => ({ id: s.id, href: `/blog/${s.id}`, title: s.title }))]
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
      const k = p.account ?? '其他'
      if (!byAccount.has(k)) byAccount.set(k, [])
      byAccount.get(k).push(p)
    }
    const accounts = [...byAccount.entries()].sort((a, b) => b[1].length - a[1].length)
    listing = `<nav class="accounts" aria-label="公众号">${accounts
      .map(([account, list]) => `<a href="#${encodeURIComponent(account)}">${esc(account)}<span>${list.length}</span></a>`)
      .join('')}</nav>${accounts
      .map(
        ([account, list]) =>
          `<section class="account" id="${esc(account)}"><h2 class="account__name">${esc(account)}<small>${list.length} 篇</small></h2><div class="grid grid--3">${list
            .map((p) => card(p))
            .join('')}</div></section>`,
      )
      .join('')}`
  } else {
    listing = [...byYear.entries()]
      .map(
        ([year, list]) =>
          `<section class="year"><h2 class="year__label">${year}<small>${list.length} 篇</small></h2><ol class="rows">${list
            .map((p) => listRow(p, { showSeries: active === 'all' }))
            .join('')}</ol></section>`,
      )
      .join('')
  }

  return `
<header class="page-head wrap">
  <p class="kicker">${meta ? '栏目' : '往期'}</p>
  <h1>${esc(title)}</h1>
  <p class="page-head__dek">${esc(description)}</p>
  <nav class="tabs" aria-label="栏目筛选">${tabs
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
      <p class="kicker">关于</p>
      <h1 class="article__title">关于小举人</h1>
      <p class="article__dek">${esc(site.description)}</p>
    </header>
    <div class="prose">
      <p>你好，我是 ${esc(site.author.name)}。${esc(site.author.bio)}</p>
      <p>「小举人」是我的个人杂志。它有三个固定栏目：</p>
      <ul>
        <li><a href="/blog/podcast">冷知识盲盒</a>：我做的一档音频节目，每期讲一个商业或历史冷知识。这里放每一期的完整文稿，目前已经 ${stats.episodes} 期。</li>
        <li><a href="/blog/tech">手记</a>：做 AI 产品、搭 Agent 流水线、理财和生活里想明白的事。</li>
        <li><a href="/docs">手册</a>：能照着做的技术笔记。</li>
      </ul>
      <p>另外还有一个<a href="/blog/wechat">剪报</a>栏目，收着我从别的公众号读到的好文章，版权归原作者。</p>
      <h2 id="订阅">订阅</h2>
      <p>新文章会同步到 <a href="/feed.xml">RSS</a>。用 Feedly、Reeder、Folo 之类的阅读器订阅就行。</p>
      <p>页面顶部的「译」可以把当前页面机器翻译成英文或日文。</p>
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
  <h1>这一页被裁掉了</h1>
  <p class="page-head__dek">链接可能写错了，或者这篇文章已经搬家。去首页看看，或者从最近的文章读起。</p>
  <p><a class="button" href="/">回到首页</a> <a class="button button--ghost" href="/blog">往期文章</a></p>
</header>
<div class="wrap archive"><ol class="rows">${posts
    .filter((p) => p.listed)
    .slice(0, 8)
    .map((p) => listRow(p))
    .join('')}</ol></div>
`
}
