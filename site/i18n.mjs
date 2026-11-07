// Interface strings and locale helpers. Chinese is the source language and
// lives at the root; translations live under /en and /ja.

export const LOCALES = ['zh', 'en', 'ja']
export const DEFAULT_LOCALE = 'zh'

export const LOCALE_META = {
  zh: { lang: 'zh-CN', hreflang: 'zh-Hans', og: 'zh_CN', label: '中文' },
  en: { lang: 'en', hreflang: 'en', og: 'en_US', label: 'English' },
  ja: { lang: 'ja', hreflang: 'ja', og: 'ja_JP', label: '日本語' },
}

/** `/blog/x` → `/en/blog/x` for non-default locales. */
export function localePath(locale, path) {
  if (locale === DEFAULT_LOCALE) return path
  return path === '/' ? `/${locale}` : `/${locale}${path}`
}

/** `/en/blog/x` → `/blog/x`. */
export function stripLocale(path) {
  const m = path.match(/^\/(en|ja)(\/.*)?$/)
  return m ? m[2] || '/' : path
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const WD = {
  zh: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  ja: ['日', '月', '火', '水', '木', '金', '土'],
}

export function formatDate(locale, iso, { weekday = false } = {}) {
  const [y, m, d] = String(iso).slice(0, 10).split('-').map(Number)
  const day = new Date(Date.UTC(y, m - 1, d)).getUTCDay()
  if (locale === 'en') return `${weekday ? `${WD.en[day]}, ` : ''}${MONTHS[m - 1]} ${d}, ${y}`
  if (locale === 'ja') return `${y}年${m}月${d}日${weekday ? `（${WD.ja[day]}）` : ''}`
  return `${y}年${m}月${d}日${weekday ? ` ${WD.zh[day]}` : ''}`
}

export const STRINGS = {
  zh: {
    skip: '跳到正文',
    tagline: '程序 · 观点 · 搞钱',
    description: 'Jens 的个人杂志：冷知识盲盒节目文稿，以及关于 AI、产品、生活和钱的手记。',
    authorBio: 'AI 产品经理，深圳人。白天做产品，晚上做点小东西，周末录《冷知识盲盒》。',
    languages: '语言',
    sectionsAria: '栏目',
    homeAria: (name) => `${name} 首页`,
    nameplateSub: (posts, eps) => `Jens 的个人杂志　已刊 ${posts} 篇　冷知识盲盒 ${eps} 期`,
    nav: { home: '首页', podcast: '冷知识盲盒', blog: '文章', docs: '手册', wechat: '剪报', about: '关于' },
    footerSections: '栏目',
    footerSubscribe: '订阅',
    aboutAuthor: '关于作者',
    sitemap: '网站地图',
    footerFine: '剪报栏目内容版权归原作者',
    docsMenu: '打开手册目录',
    docsName: '手册',
    docsSearch: '搜索手册',
    siteLinks: '站点',
    articles: '文章',
    issue: (n) => `第 ${n} 期`,
    minutes: (n) => `约 ${n} 分钟`,
    docMinutes: (n) => `约 ${n} 分钟读完`,
    by: (name) => `文 / ${name}`,
    reposted: (acc) => `转自「${acc}」`,
    viewAll: '查看全部',
    introAria: '简介',
    intro: ({ name, eps, notes, docs, p }) =>
      `你好，我是 ${name}。这里有 <a href="${p('/blog/podcast')}">${eps} 期冷知识盲盒</a>、<a href="${p('/blog/tech')}">${notes} 篇技术手记</a>，和 <a href="${p('/docs')}">${docs} 篇能照着做的手册</a>。`,
    blindbox: '拆一个盲盒',
    blindboxAgain: '再拆一个',
    contents: '本期要目',
    contentsMore: '往期全部文章',
    podcastNote: '每期一个冷知识，讲清楚它背后的商业和历史。',
    notes: '手记',
    notesNote: '做 AI 产品、搭流水线、理财和生活里想明白的事。',
    docsNote: '能照着做的技术笔记。',
    clipNote: '从别的公众号剪下来的好文章，版权归原作者。',
    toc: '本文目录',
    tocCount: (n) => `${n} 节`,
    repostNotice: (acc) => `本文转载自公众号「${acc}」，版权归原作者所有，仅作个人收藏与分享。如有不妥请联系删除。`,
    subscribe: '订阅更新',
    pagerAria: '上一篇和下一篇',
    prevDoc: '上一篇手册',
    nextDoc: '下一篇手册',
    prevIssue: (n) => `上一期　第 ${n} 期`,
    nextIssue: (n) => `下一期　第 ${n} 期`,
    prev: '上一篇',
    next: '下一篇',
    related: '接着读',
    all: '全部',
    section: '栏目',
    archive: '往期',
    filterAria: '栏目筛选',
    count: (n) => `${n} 篇`,
    accountsAria: '公众号',
    other: '其他',
    archiveTitle: '往期文章',
    archiveDesc: (n) => `小举人的全部文章，共 ${n} 篇，按时间排列。`,
    archiveDek: (n) => `共 ${n} 篇，按时间排列。剪报不在此列。`,
    seriesDek: (desc, n) => `${desc} 共 ${n} 篇。`,
    docsDesc: '能照着做的技术笔记：AI 工具、自托管、账号、建站和出海。',
    aboutTitle: '关于小举人',
    aboutDesc: (name) => `关于小举人和作者 ${name}。`,
    aboutKicker: '关于',
    about: ({ name, bio, eps, p }) => `
      <p>你好，我是 ${name}。${bio}</p>
      <p>「小举人」是我的个人杂志。它有三个固定栏目：</p>
      <ul>
        <li><a href="${p('/blog/podcast')}">冷知识盲盒</a>：我做的一档音频节目，每期讲一个商业或历史冷知识。这里放每一期的完整文稿，目前已经 ${eps} 期。</li>
        <li><a href="${p('/blog/tech')}">手记</a>：做 AI 产品、搭 Agent 流水线、理财和生活里想明白的事。</li>
        <li><a href="${p('/docs')}">手册</a>：能照着做的技术笔记。</li>
      </ul>
      <p>另外还有一个<a href="/blog/wechat">剪报</a>栏目，收着我从别的公众号读到的好文章，版权归原作者。</p>
      <h2 id="subscribe">订阅</h2>
      <p>新文章会同步到 <a href="/feed.xml">RSS</a>。用 Feedly、Reeder、Folo 之类的阅读器订阅就行。</p>`,
    notFoundTitle: '这一页被裁掉了',
    notFoundDek: '链接可能写错了，或者这篇文章已经搬家。去首页看看，或者从最近的文章读起。',
    backHome: '回到首页',
    // manuals shell
    overview: '概览',
    docsHomeDek: (n) => `能照着做的技术笔记，一共 ${n} 篇：AI 工具、自托管、账号、建站和出海。按左边的分组挑一篇，或者按 <kbd>⌘K</kbd> 直接搜。`,
    docsCrumb: '面包屑',
    onThisPage: '本页目录',
    copyLink: '复制链接',
    anchor: '链接到本节',
    docPrev: '← 上一篇',
    docNext: '下一篇 →',
    searchPlaceholder: '搜索手册：标题、小节或正文',
    searchHint: '↑↓ 选择　Enter 打开　Esc 关闭',
    close: '关闭',
    keywords: '搜索关键词',
  },

  en: {
    skip: 'Skip to content',
    tagline: 'Code, takes, and money',
    description: 'A personal magazine by Jens: scripts from the Cold-Knowledge Blind Box show, plus notes on AI, products, life and money.',
    authorBio: 'AI product manager from Shenzhen. Builds products by day, small things by night, and records Cold-Knowledge Blind Box on weekends.',
    languages: 'Language',
    sectionsAria: 'Sections',
    homeAria: (name) => `${name} home`,
    nameplateSub: (posts, eps) => `A personal magazine by Jens　${posts} stories　${eps} episodes`,
    nav: { home: 'Home', podcast: 'Blind Box', blog: 'Articles', docs: 'Manuals', wechat: '', about: 'About' },
    footerSections: 'Sections',
    footerSubscribe: 'Subscribe',
    aboutAuthor: 'About the author',
    sitemap: 'Sitemap',
    footerFine: 'Translated from the Chinese edition.',
    docsMenu: 'Open the manual index',
    docsName: 'Manuals',
    docsSearch: 'Search manuals',
    siteLinks: 'Site',
    articles: 'Articles',
    issue: (n) => `Episode ${n}`,
    minutes: (n) => `${n} min read`,
    docMinutes: (n) => `${n} min read`,
    by: (name) => `By ${name}`,
    reposted: (acc) => `From ${acc}`,
    viewAll: 'View all',
    introAria: 'Introduction',
    intro: ({ name, eps, notes, docs, p }) =>
      `Hi, I'm ${name}. Here you'll find <a href="${p('/blog/podcast')}">${eps} episodes of Cold-Knowledge Blind Box</a>, <a href="${p('/blog/tech')}">${notes} tech notes</a>, and <a href="${p('/docs')}">${docs} hands-on manuals</a>.`,
    blindbox: 'Open a blind box',
    blindboxAgain: 'Open another',
    contents: 'In this issue',
    contentsMore: 'All articles',
    podcastNote: 'One piece of little-known history or business per episode, explained.',
    notes: 'Notes',
    notesNote: 'What I figured out building AI products, pipelines, money and life.',
    docsNote: 'Technical notes you can follow step by step.',
    clipNote: '',
    toc: 'Contents',
    tocCount: (n) => `${n} sections`,
    repostNotice: (acc) => `Republished from ${acc}. All rights belong to the original author.`,
    subscribe: 'Subscribe',
    pagerAria: 'Previous and next',
    prevDoc: 'Previous manual',
    nextDoc: 'Next manual',
    prevIssue: (n) => `Previous episode　${n}`,
    nextIssue: (n) => `Next episode　${n}`,
    prev: 'Previous',
    next: 'Next',
    related: 'Keep reading',
    all: 'All',
    section: 'Section',
    archive: 'Archive',
    filterAria: 'Filter by section',
    count: (n) => `${n} ${n === 1 ? 'post' : 'posts'}`,
    accountsAria: 'Accounts',
    other: 'Other',
    archiveTitle: 'All articles',
    archiveDesc: (n) => `Every article on 小举人 in English, ${n} so far, newest first.`,
    archiveDek: (n) => `${n} articles, newest first.`,
    seriesDek: (desc, n) => `${desc} ${n} ${n === 1 ? 'post' : 'posts'}.`,
    docsDesc: 'Technical notes you can follow: AI tools, self-hosting, accounts, websites and going global.',
    aboutTitle: 'About 小举人',
    aboutDesc: (name) => `About 小举人 and its author, ${name}.`,
    aboutKicker: 'About',
    about: ({ name, bio, eps, p }) => `
      <p>Hi, I'm ${name}. ${bio}</p>
      <p>小举人 (Xiao Juren) is my personal magazine. It has three regular sections:</p>
      <ul>
        <li><a href="${p('/blog/podcast')}">Cold-Knowledge Blind Box</a>: my audio show. Each episode unpacks one little-known story from business or history. This is where the full scripts live; ${eps} episodes so far.</li>
        <li><a href="${p('/blog/tech')}">Notes</a>: what I figured out building AI products and agent pipelines, and about money and life.</li>
        <li><a href="${p('/docs')}">Manuals</a>: technical notes you can follow step by step.</li>
      </ul>
      <p>Everything here was first written in Chinese. The <a href="/">Chinese edition</a> has the complete archive.</p>
      <h2 id="subscribe">Subscribe</h2>
      <p>New English articles go to the <a href="${p('/feed.xml')}">RSS feed</a>.</p>`,
    notFoundTitle: 'This page was cut',
    notFoundDek: 'The link may be wrong, or the article has moved.',
    backHome: 'Back to home',
    overview: 'Overview',
    docsHomeDek: (n) => `${n} technical notes you can follow: AI tools, self-hosting, accounts, websites and going global. Pick one from the groups on the left, or press <kbd>⌘K</kbd> to search.`,
    docsCrumb: 'Breadcrumb',
    onThisPage: 'On this page',
    copyLink: 'Copy link',
    anchor: 'Link to this section',
    docPrev: '← Previous',
    docNext: 'Next →',
    searchPlaceholder: 'Search manuals by title, section or text',
    searchHint: '↑↓ to choose　Enter to open　Esc to close',
    close: 'Close',
    keywords: 'Search terms',
  },

  ja: {
    skip: '本文へスキップ',
    tagline: 'コード・視点・お金',
    description: 'Jens の個人マガジン。音声番組「冷知識ブラインドボックス」の台本と、AI・プロダクト・暮らし・お金についてのノート。',
    authorBio: '深圳出身の AI プロダクトマネージャー。昼はプロダクトを作り、夜は小さなものを作り、週末は「冷知識ブラインドボックス」を収録しています。',
    languages: '言語',
    sectionsAria: 'セクション',
    homeAria: (name) => `${name} ホーム`,
    nameplateSub: (posts, eps) => `Jens の個人マガジン　記事 ${posts} 本　番組 ${eps} 回`,
    nav: { home: 'ホーム', podcast: 'ブラインドボックス', blog: '記事', docs: 'マニュアル', wechat: '', about: '概要' },
    footerSections: 'セクション',
    footerSubscribe: '購読',
    aboutAuthor: '著者について',
    sitemap: 'サイトマップ',
    footerFine: '中国語版から翻訳しています。',
    docsMenu: 'マニュアルの目次を開く',
    docsName: 'マニュアル',
    docsSearch: 'マニュアルを検索',
    siteLinks: 'サイト',
    articles: '記事',
    issue: (n) => `第${n}回`,
    minutes: (n) => `約${n}分`,
    docMinutes: (n) => `約${n}分で読めます`,
    by: (name) => `文：${name}`,
    reposted: (acc) => `転載元：${acc}`,
    viewAll: 'すべて見る',
    introAria: '紹介',
    intro: ({ name, eps, notes, docs, p }) =>
      `こんにちは、${name} です。ここには<a href="${p('/blog/podcast')}">冷知識ブラインドボックス ${eps} 回分</a>、<a href="${p('/blog/tech')}">技術ノート ${notes} 本</a>、そして<a href="${p('/docs')}">手順どおりに試せるマニュアル ${docs} 本</a>があります。`,
    blindbox: 'ブラインドボックスを開ける',
    blindboxAgain: 'もう一つ開ける',
    contents: '今号の目次',
    contentsMore: 'すべての記事',
    podcastNote: '毎回ひとつの「冷知識」から、その裏にあるビジネスと歴史をひもときます。',
    notes: 'ノート',
    notesNote: 'AI プロダクトやパイプライン作り、お金と暮らしで考えたこと。',
    docsNote: '手順どおりに試せる技術ノート。',
    clipNote: '',
    toc: '目次',
    tocCount: (n) => `${n}節`,
    repostNotice: (acc) => `この記事は ${acc} から転載しています。著作権は原著者に帰属します。`,
    subscribe: '更新を購読',
    pagerAria: '前後の記事',
    prevDoc: '前のマニュアル',
    nextDoc: '次のマニュアル',
    prevIssue: (n) => `前の回　第${n}回`,
    nextIssue: (n) => `次の回　第${n}回`,
    prev: '前の記事',
    next: '次の記事',
    related: '続けて読む',
    all: 'すべて',
    section: 'セクション',
    archive: 'アーカイブ',
    filterAria: 'セクションで絞り込む',
    count: (n) => `${n}本`,
    accountsAria: 'アカウント',
    other: 'その他',
    archiveTitle: 'すべての記事',
    archiveDesc: (n) => `小举人の日本語記事すべて（${n}本）、新しい順。`,
    archiveDek: (n) => `全${n}本、新しい順。`,
    seriesDek: (desc, n) => `${desc}全${n}本。`,
    docsDesc: '手順どおりに試せる技術ノート：AI ツール、セルフホスト、アカウント、サイト構築、海外展開。',
    aboutTitle: '小举人について',
    aboutDesc: (name) => `小举人と著者 ${name} について。`,
    aboutKicker: '概要',
    about: ({ name, bio, eps, p }) => `
      <p>こんにちは、${name} です。${bio}</p>
      <p>「小举人」は私の個人マガジンで、三つの連載があります。</p>
      <ul>
        <li><a href="${p('/blog/podcast')}">冷知識ブラインドボックス</a>：私の音声番組です。毎回、ビジネスや歴史の知られざる話をひとつ取り上げます。ここには各回の台本全文を載せていて、現在 ${eps} 回です。</li>
        <li><a href="${p('/blog/tech')}">ノート</a>：AI プロダクトやエージェントのパイプライン作り、お金と暮らしについて考えたこと。</li>
        <li><a href="${p('/docs')}">マニュアル</a>：手順どおりに試せる技術ノート。</li>
      </ul>
      <p>すべての記事はもともと中国語で書いています。全記事は<a href="/">中国語版</a>でお読みいただけます。</p>
      <h2 id="subscribe">購読</h2>
      <p>日本語の新着記事は <a href="${p('/feed.xml')}">RSS</a> で配信しています。</p>`,
    notFoundTitle: 'このページは見つかりません',
    notFoundDek: 'リンクが間違っているか、記事が移動した可能性があります。',
    backHome: 'ホームへ',
    overview: '概要',
    docsHomeDek: (n) => `手順どおりに試せる技術ノート ${n} 本：AI ツール、セルフホスト、アカウント、サイト構築、海外展開。左のグループから選ぶか、<kbd>⌘K</kbd> で検索できます。`,
    docsCrumb: 'パンくずリスト',
    onThisPage: 'このページの内容',
    copyLink: 'リンクをコピー',
    anchor: 'このセクションへのリンク',
    docPrev: '← 前へ',
    docNext: '次へ →',
    searchPlaceholder: 'マニュアルを検索（タイトル・見出し・本文）',
    searchHint: '↑↓ で選択　Enter で開く　Esc で閉じる',
    close: '閉じる',
    keywords: '検索キーワード',
  },
}

/** Series and manual-group names per locale. */
export const SERIES_I18N = {
  en: {
    podcast: { title: 'Cold-Knowledge Blind Box', short: 'Blind Box', description: 'An audio show about little-known stories from business and history. Full scripts of every episode.' },
    tech: { title: 'Tech Notes', short: 'Tech', description: 'What I learned building AI products and agent pipelines.' },
    finance: { title: 'Finance', short: 'Finance', description: 'Markets, money, and the stories behind the numbers.' },
    life: { title: 'Life', short: 'Life', description: 'Shenzhen streets, the roads travelled, and everyday life.' },
    travel: { title: 'Travel', short: 'Travel', description: 'Places I have been, and the way there.' },
  },
  ja: {
    podcast: { title: '冷知識ブラインドボックス', short: 'ブラインドボックス', description: 'ビジネスと歴史の知られざる話を届ける音声番組。各回の台本全文です。' },
    tech: { title: '技術ノート', short: '技術', description: 'AI プロダクトとエージェントのパイプライン作りで学んだこと。' },
    finance: { title: 'お金', short: 'お金', description: '市場とお金、そして数字の裏にある話。' },
    life: { title: '暮らし', short: '暮らし', description: '深圳の街、歩いた道、そして日々の暮らし。' },
    travel: { title: '旅', short: '旅', description: '訪れた場所と、そこへ向かう道。' },
  },
}

export const GROUPS_I18N = {
  en: { AI: 'AI', 自托管: 'Self-hosting', 账号: 'Accounts', 建站: 'Websites', 出海与金融: 'Going global & finance', 工具: 'Tools', 产品: 'Product', 其他: 'Other' },
  ja: { AI: 'AI', 自托管: 'セルフホスト', 账号: 'アカウント', 建站: 'サイト構築', 出海与金融: '海外展開と金融', 工具: 'ツール', 产品: 'プロダクト', 其他: 'その他' },
}
