// A small, dependency-free Markdown renderer for the blog's content.
// It covers the subset the posts actually use: ATX headings, paragraphs,
// emphasis, links, images (with captions), lists, blockquotes, tables,
// fenced code, horizontal rules, and a short allow-list of inline HTML.

const INLINE_HTML_ALLOWED = new Set([
  'kbd', 'br', 'sub', 'sup', 'mark', 'u', 'strong', 'em', 'b', 'i', 'del', 's', 'small',
])

const CJK = /[⺀-鿿豈-﫿＀-￯　-〿]/

export function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function escapeAttr(text) {
  return escapeHtml(text).replace(/'/g, '&#39;')
}

/** Heading id: keeps CJK and word characters, drops punctuation. */
export function slugifyHeading(text) {
  const plain = text
    .replace(/<[^>]+>/g, '')
    .replace(/&[a-z#0-9]+;/gi, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-')
  return plain || 'section'
}

// ---------------------------------------------------------------------------
// Inline

function renderInline(source, ctx) {
  const slots = []
  const hold = (html) => {
    slots.push(html)
    return `\u0000${slots.length - 1}\u0000`
  }

  let text = source

  // Backslash escapes.
  text = text.replace(/\\([\\`*_{}[\]()#+\-.!|~<>])/g, (_, ch) => hold(escapeHtml(ch)))

  // Code spans.
  text = text.replace(/(`+)([\s\S]*?[^`])\1(?!`)/g, (_, _ticks, code) =>
    hold(`<code>${escapeHtml(code.trim() === '' ? code : code.replace(/^ (.*) $/, '$1'))}</code>`),
  )

  // Images.
  text = text.replace(
    /!\[([^\]]*)\]\(\s*<?([^)\s>]+)>?(?:\s+"([^"]*)")?\s*\)/g,
    (_, alt, src, title) =>
      hold(
        `<img src="${escapeAttr(ctx.resolveUrl(src))}" alt="${escapeAttr(alt)}"${
          title ? ` title="${escapeAttr(title)}"` : ''
        } loading="lazy" decoding="async">`,
      ),
  )

  // Links, whose text may itself hold held images or code.
  text = text.replace(
    /\[((?:[^[\]]|\[[^\]]*\])*)\]\(\s*<?([^)\s>]*)>?(?:\s+"([^"]*)")?\s*\)/g,
    (_, label, href, title) => {
      const url = ctx.resolveUrl(href)
      const external = /^https?:\/\//.test(url) && !(ctx.baseUrl && url.startsWith(ctx.baseUrl))
      return hold(
        `<a href="${escapeAttr(url)}"${title ? ` title="${escapeAttr(title)}"` : ''}${
          external ? ' rel="noopener" target="_blank"' : ''
        }>${renderEmphasis(escapeExceptHeld(label))}</a>`,
      )
    },
  )

  // Autolinks <https://…>.
  text = text.replace(/<(https?:\/\/[^\s>]+)>/g, (_, url) =>
    hold(`<a href="${escapeAttr(url)}" rel="noopener" target="_blank">${escapeHtml(url)}</a>`),
  )

  // Allow-listed inline HTML tags.
  text = text.replace(/<\/?([a-zA-Z]+)(\s[^<>]*)?\s*\/?>/g, (tag, name) =>
    INLINE_HTML_ALLOWED.has(name.toLowerCase()) ? hold(tag.replace(/\s+[^\s=]+=("[^"]*"|'[^']*'|\S+)/g, '')) : tag,
  )

  // Bare URLs.
  text = text.replace(/(^|[^"'(=\w])(https?:\/\/[^\s<>"'，。；、）)\]]+[^\s<>"'，。；、）)\].,:;!?])/g, (_, lead, url) =>
    `${lead}${hold(`<a href="${escapeAttr(url)}" rel="noopener" target="_blank">${escapeHtml(url)}</a>`)}`,
  )

  text = renderEmphasis(escapeExceptHeld(text))

  // Hard line breaks (two spaces or a backslash before the newline).
  text = text.replace(/(?: {2,}|\\)\n/g, '<br>\n')
  // Soft breaks: drop the newline between two CJK characters so no stray
  // space shows up in Chinese prose.
  text = text.replace(/(.)\n(.)/g, (m, a, b) => (CJK.test(a) && CJK.test(b) ? a + b : `${a}\n${b}`))

  // Restore held fragments (they may nest).
  let previous
  do {
    previous = text
    text = text.replace(/\u0000(\d+)\u0000/g, (_, i) => slots[Number(i)])
  } while (text !== previous)
  return text
}

function escapeExceptHeld(text) {
  return text.split(/(\u0000\d+\u0000)/).map((part, i) => (i % 2 ? part : escapeHtml(part))).join('')
}

function renderEmphasis(text) {
  return text
    .replace(/\*\*\*(?=\S)([\s\S]*?\S)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(?=\S)([\s\S]*?\S)\*\*/g, '<strong>$1</strong>')
    // Pasted WeChat text often pads the markers: "**text **" or "** text**".
    .replace(/\*\*[ \u3000]*([^*\n]*?[^\s*])[ \u3000]*\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^\w])__(?=\S)([\s\S]*?\S)__(?!\w)/g, '$1<strong>$2</strong>')
    .replace(/\*(?=[^\s*])([^*\n]*?[^\s*])\*/g, '<em>$1</em>')
    .replace(/\*(?=[^\s*])([^*\n])\*/g, '<em>$1</em>')
    .replace(/(^|[^\w])_(?=\S)([^_\n]*?\S)_(?!\w)/g, '$1<em>$2</em>')
    .replace(/~~(?=\S)([\s\S]*?\S)~~/g, '<del>$1</del>')
}

// ---------------------------------------------------------------------------
// Blocks

const FENCE = /^(\s{0,3})(`{3,}|~{3,})\s*([^`\s]*)[^`]*$/
const HEADING = /^\s{0,3}(#{1,6})\s+(.*?)\s*#*\s*$/
const HR = /^\s{0,3}([-*_])(\s*\1){2,}\s*$/
const LIST_ITEM = /^(\s*)([-*+]|\d{1,9}[.)])\s+(.*)$/
const QUOTE = /^\s{0,3}>\s?(.*)$/
const TABLE_SEP = /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/

function isBlank(line) {
  return line.trim() === ''
}

function startsBlock(line) {
  return FENCE.test(line) || HEADING.test(line) || HR.test(line) || QUOTE.test(line) || LIST_ITEM.test(line)
}

function splitRow(line) {
  let row = line.trim()
  if (row.startsWith('|')) row = row.slice(1)
  if (row.endsWith('|') && !row.endsWith('\\|')) row = row.slice(0, -1)
  const cells = []
  let current = ''
  let inCode = false
  for (let i = 0; i < row.length; i++) {
    const ch = row[i]
    if (ch === '\\' && row[i + 1] === '|') {
      current += '|'
      i++
    } else if (ch === '`') {
      inCode = !inCode
      current += ch
    } else if (ch === '|' && !inCode) {
      cells.push(current.trim())
      current = ''
    } else current += ch
  }
  cells.push(current.trim())
  return cells
}

function renderBlocks(lines, ctx) {
  const out = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (isBlank(line)) {
      i++
      continue
    }

    // Fenced code.
    const fence = line.match(FENCE)
    if (fence) {
      const marker = fence[2]
      const lang = fence[3]
      const indent = fence[1].length
      const body = []
      i++
      while (i < lines.length && !new RegExp(`^\\s{0,3}${marker[0]}{${marker.length},}\\s*$`).test(lines[i])) {
        body.push(lines[i].slice(Math.min(indent, lines[i].length - lines[i].trimStart().length)))
        i++
      }
      i++
      out.push(
        `<pre${lang ? ` data-lang="${escapeAttr(lang)}"` : ''}><code${
          lang ? ` class="language-${escapeAttr(lang)}"` : ''
        }>${escapeHtml(body.join('\n'))}</code></pre>`,
      )
      continue
    }

    // Heading.
    const heading = line.match(HEADING)
    if (heading) {
      const level = heading[1].length
      const html = renderInline(heading[2], ctx)
      let id = slugifyHeading(html)
      const seen = ctx.ids.get(id) ?? 0
      ctx.ids.set(id, seen + 1)
      if (seen) id = `${id}-${seen}`
      if (level === 2 || level === 3) ctx.headings.push({ level, id, html: html.replace(/<a [^>]*>|<\/a>/g, '') })
      out.push(`<h${level} id="${escapeAttr(id)}">${html}</h${level}>`)
      i++
      continue
    }

    // Horizontal rule.
    if (HR.test(line)) {
      out.push('<hr>')
      i++
      continue
    }

    // Blockquote.
    if (QUOTE.test(line)) {
      const body = []
      while (i < lines.length && !isBlank(lines[i])) {
        const m = lines[i].match(QUOTE)
        body.push(m ? m[1] : lines[i])
        i++
      }
      // Merge quotes separated by a single blank line followed by '>'.
      while (i + 1 < lines.length && isBlank(lines[i]) && QUOTE.test(lines[i + 1])) {
        body.push('')
        i++
        while (i < lines.length && !isBlank(lines[i])) {
          const m = lines[i].match(QUOTE)
          body.push(m ? m[1] : lines[i])
          i++
        }
      }
      out.push(`<blockquote>${renderBlocks(body, ctx)}</blockquote>`)
      continue
    }

    // List.
    const item = line.match(LIST_ITEM)
    if (item) {
      const [html, next] = renderList(lines, i, ctx)
      out.push(html)
      i = next
      continue
    }

    // Table.
    if (line.includes('|') && i + 1 < lines.length && TABLE_SEP.test(lines[i + 1])) {
      const header = splitRow(line)
      const aligns = splitRow(lines[i + 1]).map((cell) =>
        cell.startsWith(':') && cell.endsWith(':') ? 'center' : cell.endsWith(':') ? 'right' : cell.startsWith(':') ? 'left' : '',
      )
      i += 2
      const rows = []
      while (i < lines.length && !isBlank(lines[i]) && lines[i].includes('|')) {
        rows.push(splitRow(lines[i]))
        i++
      }
      const cell = (tag, text, col) =>
        `<${tag}${aligns[col] ? ` style="text-align:${aligns[col]}"` : ''}>${renderInline(text ?? '', ctx)}</${tag}>`
      out.push(
        `<div class="table-wrap"><table><thead><tr>${header.map((h, c) => cell('th', h, c)).join('')}</tr></thead><tbody>${rows
          .map((r) => `<tr>${header.map((_, c) => cell('td', r[c], c)).join('')}</tr>`)
          .join('')}</tbody></table></div>`,
      )
      continue
    }

    // Paragraph.
    const para = []
    while (i < lines.length && !isBlank(lines[i]) && !(para.length && startsBlock(lines[i]))) {
      para.push(lines[i].trim() === lines[i] ? lines[i] : lines[i].replace(/^\s+/, '').replace(/(\S)\s*$/, (m) => (lines[i].endsWith('  ') ? `${m.trimEnd()}  ` : m.trimEnd())))
      i++
    }
    out.push(renderParagraph(para.join('\n'), ctx))
  }

  return mergeFigureCaptions(out).join('\n')
}

const IMAGE_ONLY = /^\s*!\[[^\]]*\]\([^)]*\)\s*$/

function renderParagraph(text, ctx) {
  if (IMAGE_ONLY.test(text)) {
    const html = renderInline(text.trim(), ctx)
    const alt = (text.match(/^\s*!\[([^\]]*)\]/) ?? [])[1] ?? ''
    return `<figure data-alt="${escapeAttr(alt)}">${html}</figure>`
  }
  // A paragraph made of several images and nothing else becomes a gallery.
  const lines = text.split('\n')
  if (lines.length > 1 && lines.every((l) => IMAGE_ONLY.test(l))) {
    return `<figure class="gallery">${lines.map((l) => renderInline(l.trim(), ctx)).join('')}</figure>`
  }
  return `<p>${renderInline(text, ctx)}</p>`
}

/** `![alt](src)` followed by `*caption*` → one figure with a figcaption. */
function mergeFigureCaptions(blocks) {
  const out = []
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i]
    const next = blocks[i + 1]
    if (block.startsWith('<figure data-alt=')) {
      const caption = next?.match(/^<p><em>([\s\S]*)<\/em><\/p>$/)
      const alt = block.match(/data-alt="([^"]*)"/)[1]
      const body = block.replace(/ data-alt="[^"]*"/, '')
      if (caption) {
        out.push(body.replace('</figure>', `<figcaption>${caption[1]}</figcaption></figure>`))
        i++
      } else if (alt && !/^(image|img|图片|\d+)$/i.test(alt)) {
        out.push(body.replace('</figure>', `<figcaption>${alt}</figcaption></figure>`))
      } else out.push(body)
    } else out.push(block)
  }
  return out
}

function indentOf(line) {
  const m = line.match(/^(\s*)/)
  return m[1].replace(/\t/g, '    ').length
}

function renderList(lines, start, ctx) {
  const first = lines[start].match(LIST_ITEM)
  const baseIndent = indentOf(lines[start])
  const ordered = /\d/.test(first[2])
  const startNum = ordered ? Number.parseInt(first[2], 10) : 1
  const items = []
  let i = start
  let loose = false

  while (i < lines.length) {
    const m = lines[i].match(LIST_ITEM)
    if (!m || indentOf(lines[i]) !== baseIndent || /\d/.test(m[2]) !== ordered) break
    const contentIndent = baseIndent + m[2].length + 1
    const body = [m[3]]
    i++
    while (i < lines.length) {
      const l = lines[i]
      if (isBlank(l)) {
        // Blank line: continue only if the next non-blank line is indented
        // under this item, or is another item of this list (loose list).
        let j = i
        while (j < lines.length && isBlank(lines[j])) j++
        if (j >= lines.length) {
          i = j
          break
        }
        const nm = lines[j].match(LIST_ITEM)
        if (indentOf(lines[j]) >= contentIndent || (indentOf(lines[j]) > baseIndent && !nm)) {
          body.push('')
          i = j
          loose = true
          continue
        }
        if (nm && indentOf(lines[j]) === baseIndent && /\d/.test(nm[2]) === ordered) {
          loose = true
          i = j
        }
        break
      }
      const nm = l.match(LIST_ITEM)
      if (nm && indentOf(l) <= baseIndent) break
      if (!nm && indentOf(l) <= baseIndent && (HEADING.test(l) || FENCE.test(l) || HR.test(l) || QUOTE.test(l))) break
      body.push(indentOf(l) >= contentIndent ? l.replace(/^\s+/, (s) => s.slice(Math.min(s.length, contentIndent))) : l.trimStart())
      i++
    }
    items.push(body)
  }

  const html = items
    .map((body) => {
      const hasBlocks = body.some((l, k) => k > 0 && (LIST_ITEM.test(l) || FENCE.test(l) || isBlank(l) || QUOTE.test(l)))
      let inner
      if (!hasBlocks && !loose) {
        inner = renderInline(body.join('\n'), ctx)
      } else {
        inner = renderBlocks(body, ctx)
        if (!loose) inner = inner.replace(/^<p>([\s\S]*?)<\/p>/, '$1')
      }
      const task = inner.match(/^\[( |x|X)\]\s+/)
      if (task) {
        inner = `<input type="checkbox" disabled${task[1] === ' ' ? '' : ' checked'}> ${inner.slice(task[0].length)}`
      }
      return `<li>${inner}</li>`
    })
    .join('')
  const tag = ordered ? 'ol' : 'ul'
  return [`<${tag}${ordered && startNum !== 1 ? ` start="${startNum}"` : ''}>${html}</${tag}>`, i]
}

/**
 * Render a Markdown document.
 * @returns {{ html: string, headings: {level:number,id:string,html:string}[] }}
 */
export function renderMarkdown(source, { baseUrl = '', resolveUrl = (u) => u } = {}) {
  const ctx = { baseUrl, resolveUrl, headings: [], ids: new Map() }
  const lines = source.replace(/\r\n?/g, '\n').replace(/\t/g, '    ').split('\n')
  const html = renderBlocks(lines, ctx)
  return { html, headings: ctx.headings }
}
