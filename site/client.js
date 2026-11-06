// Small reading aids: progress bar, serif/sans toggle, table-of-contents highlight.
(function () {
  var root = document.documentElement

  var bar = document.querySelector('.progress span')
  var article = document.querySelector('.prose')
  if (bar && article) {
    var tick = false
    var update = function () {
      var rect = article.getBoundingClientRect()
      var total = rect.height - window.innerHeight
      var done = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 1
      bar.style.transform = 'scaleX(' + done + ')'
      tick = false
    }
    window.addEventListener('scroll', function () {
      if (!tick) {
        tick = true
        requestAnimationFrame(update)
      }
    }, { passive: true })
    update()
  }

  var links = document.querySelectorAll('.toc a')
  if (links.length && 'IntersectionObserver' in window) {
    var byId = {}
    links.forEach(function (a) { byId[decodeURIComponent(a.hash.slice(1))] = a })
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return
        links.forEach(function (a) { a.classList.remove('is-active') })
        var hit = byId[entry.target.id]
        if (hit) hit.classList.add('is-active')
      })
    }, { rootMargin: '0px 0px -70% 0px' })
    document.querySelectorAll('.prose h2[id]').forEach(function (h) { observer.observe(h) })
  }
})()

// ---------------------------------------------------------------- manuals
;(function () {
  if (!document.body.classList.contains('is-docs')) return

  // Mobile sidebar.
  var body = document.body
  var menuButton = document.querySelector('.dh__menu')
  var scrim = document.querySelector('.ds__scrim')
  function setMenu(open) {
    body.classList.toggle('docs-nav-open', open)
    if (menuButton) menuButton.setAttribute('aria-expanded', String(open))
    if (scrim) scrim.hidden = !open
  }
  document.querySelectorAll('[data-docs-menu]').forEach(function (el) {
    el.addEventListener('click', function () { setMenu(!body.classList.contains('docs-nav-open')) })
  })
  var active = document.querySelector('.ds a.is-active')
  if (active && active.scrollIntoView) active.scrollIntoView({ block: 'center' })
  window.scrollTo(0, 0)

  // Code blocks: language label and copy button.
  document.querySelectorAll('.dprose > pre, .dprose li > pre').forEach(function (pre) {
    var wrap = document.createElement('div')
    wrap.className = 'dcode'
    var bar = document.createElement('div')
    bar.className = 'dcode__bar'
    var lang = document.createElement('span')
    lang.textContent = pre.dataset.lang || '代码'
    var copy = document.createElement('button')
    copy.type = 'button'
    copy.className = 'dcode__copy'
    copy.textContent = '复制'
    copy.addEventListener('click', function () {
      var text = pre.innerText
      var done = function () { copy.textContent = '已复制'; setTimeout(function () { copy.textContent = '复制' }, 1600) }
      if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, function () {})
    })
    bar.appendChild(lang)
    bar.appendChild(copy)
    pre.parentNode.insertBefore(wrap, pre)
    wrap.appendChild(bar)
    wrap.appendChild(pre)
  })

  var copyLink = document.querySelector('[data-copy-link]')
  if (copyLink && navigator.clipboard) {
    copyLink.addEventListener('click', function () {
      navigator.clipboard.writeText(location.href.split('#')[0]).then(function () {
        copyLink.textContent = '已复制'
        setTimeout(function () { copyLink.textContent = '复制链接' }, 1600)
      }, function () {})
    })
  }

  // Outline highlight.
  var links = document.querySelectorAll('.dt a')
  if (links.length && 'IntersectionObserver' in window) {
    var byId = {}
    links.forEach(function (a) {
      var id = decodeURIComponent(a.hash.slice(1))
      ;(byId[id] = byId[id] || []).push(a)
    })
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting || !byId[entry.target.id]) return
        links.forEach(function (a) { a.classList.remove('is-active') })
        byId[entry.target.id].forEach(function (a) { a.classList.add('is-active') })
      })
    }, { rootMargin: '-64px 0px -70% 0px' })
    document.querySelectorAll('.dprose h2[id], .dprose h3[id]').forEach(function (h) { observer.observe(h) })
  }

  // Search (⌘K / Ctrl+K / "/").
  var dialog = document.getElementById('docs-search')
  if (!dialog || typeof dialog.showModal !== 'function') return
  var input = dialog.querySelector('input')
  var list = dialog.querySelector('.dsearch__results')
  var index = null
  var selected = 0

  function load() {
    if (index) return Promise.resolve(index)
    return fetch('/docs/search.json').then(function (r) { return r.json() }).then(function (data) { index = data; return data })
  }
  function escapeHtml(s) {
    return s.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] })
  }
  function mark(text, q) {
    var i = text.toLowerCase().indexOf(q)
    if (i < 0) return escapeHtml(text)
    return escapeHtml(text.slice(0, i)) + '<mark>' + escapeHtml(text.slice(i, i + q.length)) + '</mark>' + escapeHtml(text.slice(i + q.length))
  }
  function search(q) {
    q = q.trim().toLowerCase()
    var results = []
    if (!q) {
      index.slice(0, 8).forEach(function (d) { results.push({ url: d.u, title: d.t, meta: d.g, snip: d.d }) })
      return results
    }
    index.forEach(function (d) {
      var score = 0
      var url = d.u
      var meta = d.g
      var snip = d.d || ''
      if (d.t.toLowerCase().indexOf(q) >= 0) score += 10
      if ((d.d || '').toLowerCase().indexOf(q) >= 0) score += 4
      for (var k = 0; k < d.h.length; k++) {
        if (d.h[k][1].toLowerCase().indexOf(q) >= 0) {
          score += 5
          if (score < 10) { url = d.u + '#' + encodeURIComponent(d.h[k][0]); meta = d.g + ' › ' + d.h[k][1] }
          break
        }
      }
      var at = d.x.toLowerCase().indexOf(q)
      if (at >= 0) {
        score += 1
        if (score < 4) snip = (at > 30 ? '…' : '') + d.x.slice(Math.max(0, at - 30), at + 70) + '…'
      }
      if (score) results.push({ url: url, title: d.t, meta: meta, snip: snip, score: score })
    })
    return results.sort(function (a, b) { return b.score - a.score }).slice(0, 20)
  }
  function render() {
    var q = input.value.trim().toLowerCase()
    var results = search(input.value)
    selected = 0
    if (!results.length) {
      list.innerHTML = '<li class="dsearch__empty">没有找到「' + escapeHtml(input.value.trim()) + '」相关的手册</li>'
      return
    }
    list.innerHTML = results.map(function (r, i) {
      return '<li><a href="' + r.url + '" role="option"' + (i === 0 ? ' aria-selected="true"' : '') + '>' +
        '<span class="r-title">' + mark(r.title, q) + '</span>' +
        '<span class="r-meta">' + escapeHtml(r.meta) + '</span>' +
        (r.snip ? '<span class="r-snip">' + mark(r.snip, q) + '</span>' : '') + '</a></li>'
    }).join('')
  }
  function move(step) {
    var items = list.querySelectorAll('a')
    if (!items.length) return
    items[selected].removeAttribute('aria-selected')
    selected = (selected + step + items.length) % items.length
    items[selected].setAttribute('aria-selected', 'true')
    items[selected].scrollIntoView({ block: 'nearest' })
  }
  function open() {
    if (dialog.open) return
    dialog.showModal()
    input.focus()
    input.select()
    load().then(render)
  }
  document.querySelectorAll('[data-search-open]').forEach(function (b) { b.addEventListener('click', open) })
  document.addEventListener('keydown', function (e) {
    if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) { e.preventDefault(); open() }
    else if (e.key === '/' && !dialog.open && !/input|textarea/i.test(document.activeElement.tagName)) { e.preventDefault(); open() }
  })
  input.addEventListener('input', function () { if (index) render() })
  input.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); move(1) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1) }
    else if (e.key === 'Enter') {
      var hit = list.querySelectorAll('a')[selected]
      if (hit) { e.preventDefault(); location.href = hit.href }
    }
  })
  dialog.addEventListener('click', function (e) { if (e.target === dialog) dialog.close() })
})()

// ------------------------------------------------------------ blind box
// "拆一个盲盒": pick a random episode and reveal it. Motion only answers the click.
;(function () {
  var box = document.querySelector('.blindbox')
  var data = document.getElementById('blindbox-data')
  if (!box || !data) return
  var episodes = JSON.parse(data.textContent)
  var button = box.querySelector('[data-blindbox]')
  var result = box.querySelector('.blindbox__result')
  var last = -1

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] }) }

  button.addEventListener('click', function () {
    if (!episodes.length) return
    var k
    do { k = Math.floor(Math.random() * episodes.length) } while (episodes.length > 1 && k === last)
    last = k
    var ep = episodes[k]
    box.classList.add('is-opening')
    setTimeout(function () { box.classList.remove('is-opening') }, 300)
    result.href = ep.u
    result.innerHTML = '<span class="blindbox__issue">第 ' + ep.i + ' 期</span><span class="blindbox__title">' + esc(ep.t) + '</span>'
    result.hidden = false
    result.classList.remove('is-in')
    void result.offsetWidth
    result.classList.add('is-in')
    button.textContent = '再拆一个'
  })
})()
