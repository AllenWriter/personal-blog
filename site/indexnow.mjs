// Pings IndexNow (Bing, Yandex, Seznam, Naver…) with every URL in the
// sitemap. Run after a deploy: `npm run indexnow`.
// Google does not use IndexNow; submit the sitemap in Search Console instead.

import { readFileSync } from 'node:fs'
import { site } from './config.mjs'

const sitemap = readFileSync(new URL('../dist/sitemap.xml', import.meta.url), 'utf8')
const urlList = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])

const response = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'content-type': 'application/json; charset=utf-8' },
  body: JSON.stringify({
    host: new URL(site.baseUrl).host,
    key: site.indexNowKey,
    keyLocation: `${site.baseUrl}/${site.indexNowKey}.txt`,
    urlList,
  }),
})
console.log(`IndexNow: ${response.status} ${response.statusText} (${urlList.length} URLs)`)
