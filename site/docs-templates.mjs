// The manuals (/docs) use a documentation layout, modelled on Fumadocs:
// grouped sidebar, content column, "on this page" outline, search, pager.

import { escapeHtml as esc } from './markdown.mjs'
import { card, S, lp } from './templates.mjs'

function sidebar(groups, current) {
  return `<aside class="ds" id="docs-sidebar" aria-label="${S.docsMenu}">
  <div class="ds__inner">
    <a class="ds__overview${current === null ? ' is-active' : ''}" href="${lp('/docs')}"${current === null ? ' aria-current="page"' : ''}>${S.overview}</a>
    ${groups
      .filter((g) => g.docs.length)
      .map(
        (g) => `<details class="ds__group" open>
      <summary>${esc(g.title)}</summary>
      <ul>${g.docs
        .map(
          (d) =>
            `<li><a href="${d.url}"${d === current ? ' class="is-active" aria-current="page"' : ''}>${esc(d.title)}</a></li>`,
        )
        .join('')}</ul>
    </details>`,
      )
      .join('')}
  </div>
</aside>
<div class="ds__scrim" data-docs-menu hidden></div>`
}

function outline(headings) {
  const items = headings.filter((h) => h.level <= 3)
  if (items.length < 2) return ''
  return `<nav class="dt" aria-label="${S.onThisPage}">
  <p class="dt__title"><svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M2 4h12M2 8h9M2 12h6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>${S.onThisPage}</p>
  <ol>${items
    .map((h) => `<li class="dt__l${h.level}"><a href="#${encodeURIComponent(h.id)}">${h.html.replace(/<[^>]+>/g, '')}</a></li>`)
    .join('')}</ol>
</nav>`
}

/** Hover anchors on headings, like a docs site. */
function withAnchors(html) {
  return html.replace(
    /<h([234]) id="([^"]+)">([\s\S]*?)<\/h\1>/g,
    (_, level, id, inner) =>
      `<h${level} id="${id}"><a class="hanchor" href="#${encodeURIComponent(id)}" aria-label="${S.anchor}">#</a>${inner}</h${level}>`,
  )
}

function pager(prev, next) {
  if (!prev && !next) return ''
  const card = (doc, dir) =>
    `<a class="dp dp--${dir}" href="${doc.url}"><span class="dp__label">${dir === 'prev' ? S.docPrev : S.docNext}</span><span class="dp__title">${esc(
      doc.title,
    )}</span><span class="dp__group">${esc(doc.group)}</span></a>`
  return `<nav class="dpager" aria-label="${S.pagerAria}">${prev ? card(prev, 'prev') : '<span></span>'}${next ? card(next, 'next') : ''}</nav>`
}

export function docsPage({ doc, groups, prev, next }) {
  const toc = outline(doc.headings)
  return `
<div class="docs">
  ${sidebar(groups, doc)}
  <article class="dmain">
    <nav class="dcrumb" aria-label="${S.docsCrumb}"><a href="${lp('/docs')}">${S.docsName}</a><span aria-hidden="true">›</span><span>${esc(doc.group)}</span></nav>
    <h1 class="dmain__title">${esc(doc.title)}</h1>
    ${doc.description ? `<p class="dmain__dek">${esc(doc.description)}</p>` : ''}
    <div class="dmain__meta">
      <span>${S.docMinutes(doc.minutes)}</span>
      <button type="button" class="dcopy-link" data-copy-link>${S.copyLink}</button>
    </div>
    ${toc ? `<details class="dt-mobile"><summary>${S.onThisPage}</summary>${toc}</details>` : ''}
    <div class="dprose">
      ${withAnchors(doc.html)}
    </div>
    ${pager(prev, next)}
  </article>
  <aside class="dtoc">${toc}</aside>
</div>
`
}

export function docsHome({ groups, total }) {
  return `
<div class="docs">
  ${sidebar(groups, null)}
  <article class="dmain dmain--home">
    <nav class="dcrumb" aria-label="${S.docsCrumb}"><span>${S.docsName}</span></nav>
    <h1 class="dmain__title">${S.docsName}</h1>
    <p class="dmain__dek">${S.docsHomeDek(total)}</p>
    ${groups
      .filter((g) => g.docs.length)
      .map(
        (g) => `<section class="dgroup">
      <h2 id="${esc(g.id)}">${esc(g.title)}<small>${S.count(g.docs.length)}</small></h2>
      <div class="grid grid--docs">${g.docs.map((d) => card(d)).join('')}</div>
    </section>`,
      )
      .join('')}
  </article>
</div>
`
}

/** Compact search index for the manuals. */
export function docsSearchIndex(docs) {
  return docs.map((d) => ({
    u: d.url,
    t: d.title,
    g: d.group,
    d: d.description,
    h: d.headings.map((h) => [h.id, h.html.replace(/<[^>]+>/g, '')]),
    x: d.html
      .replace(/<pre[\s\S]*?<\/pre>/g, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&[a-z#0-9]+;/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 4000),
  }))
}

export function searchDialog() {
  return `<dialog class="dsearch" id="docs-search" aria-label="${S.docsSearch}" data-index="${lp('/docs/search.json')}">
  <form method="dialog" class="dsearch__box">
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><circle cx="9" cy="9" r="5.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="m13.2 13.2 3.3 3.3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
    <input type="search" placeholder="${S.searchPlaceholder}" autocomplete="off" spellcheck="false" aria-label="${S.keywords}">
    <button type="submit" class="dsearch__esc" aria-label="${S.close}">Esc</button>
  </form>
  <ul class="dsearch__results" role="listbox"></ul>
  <p class="dsearch__hint">${S.searchHint}</p>
</dialog>`
}
