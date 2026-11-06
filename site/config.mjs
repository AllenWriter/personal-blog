// Everything about the site that is not an article lives here.

export const site = {
  name: '小举人',
  tagline: '程序 · 观点 · 搞钱',
  description: 'Jens 的个人杂志：冷知识盲盒节目文稿，以及关于 AI、产品、生活和钱的手记。',
  baseUrl: (process.env.PUBLIC_BASE_URL ?? 'https://adjens.com').replace(/\/+$/, ''),
  lang: 'zh-CN',
  author: {
    name: 'Jens',
    bio: 'AI 产品经理，深圳人。白天做产品，晚上做点小东西，周末录《冷知识盲盒》。',
  },
  // Public identifiers. They only load in production builds.
  analytics: { ga4: 'G-20QH0B1FFG' },
  adsense: { publisher: 'ca-pub-4028911961301674' },
  indexNowKey: '8935711bcea6a78530892e1c7684c828',
  // Languages offered by the translate tool (machine translation on demand).
  translateTo: [
    { code: 'en', label: 'English' },
    { code: 'ja', label: '日本語' },
  ],
}

/**
 * Columns of the magazine. `indexed: false` keeps a column out of the home
 * page, the archive and the feeds, and out of search engines unless the
 * post's account is listed in `indexAccounts`.
 */
export const series = [
  {
    id: 'podcast',
    title: '冷知识盲盒',
    short: '盲盒',
    description: '一档讲商业与历史冷知识的音频节目。这里是每一期的完整文稿。',
    indexed: true,
  },
  {
    id: 'tech',
    title: '技术手记',
    short: '技术',
    description: '做 AI 产品、搭 Agent 流水线时踩过的坑和想明白的事。',
    indexed: true,
  },
  {
    id: 'finance',
    title: '财经',
    short: '财经',
    description: '市场、钱，以及数字背后的事。',
    indexed: true,
  },
  {
    id: 'life',
    title: '生活',
    short: '生活',
    description: '深圳的街道、走过的路，和日子本身。',
    indexed: true,
  },
  {
    id: 'travel',
    title: '旅行',
    short: '旅行',
    description: '去过的地方，和去的路上。',
    indexed: true,
  },
  {
    id: 'wechat',
    title: '剪报',
    short: '剪报',
    description: '从别的公众号剪下来、值得再读一遍的文章。版权归原作者。',
    indexed: false,
    // Accounts in this column that search engines may index anyway.
    indexAccounts: ['二小姐后花园'],
  },
]

export const seriesById = new Map(series.map((s) => [s.id, s]))

export const nav = [
  { href: '/', label: '首页' },
  { href: '/blog/podcast', label: '冷知识盲盒' },
  { href: '/blog', label: '文章' },
  { href: '/docs', label: '手册' },
  { href: '/blog/wechat', label: '剪报' },
  { href: '/about', label: '关于' },
]
