# 谷歌收录：原因和步骤

## 为什么之前搜不到

2026 年 11 月查 `site:blog.moneynew.net（旧域名）`，谷歌一条结果都没有，说明整站还没进索引。代码里能看到的原因：

1. **站点身份混乱。** 旧代码是从 dsh.fish 插件站改来的：默认语言是英文，每页声明 6 种语言的 hreflang，还留着插件目录、`/api`、`llms.txt` 等页面。谷歌很难判断这是一个什么站。
2. **大量重复内容。** 61 篇公众号全文转载，加上几十篇机翻的英文、日文稿。新站内容里重复和低质量的比例一高，谷歌往往整站都不急着收。
3. **大概率没在 Search Console 提交过。** 一个没有外链的新域名，不提交 sitemap，谷歌可能几个月都不来抓。

这次改版已经处理了 1 和 2：只保留中文，剪报 `noindex`，sitemap 里只有 113 个原创页面（67 篇文章、38 篇手册和栏目页），每篇文章都带 canonical、BlogPosting 结构化数据和真实的图片尺寸。第 3 条需要你自己操作。

## 上线后要做的事（一次性）

1. **部署。** `npm run deploy`。
2. **验证域名。** 打开 [Google Search Console](https://search.google.com/search-console)，添加「网域」资源 `adjens.com`，按提示把 TXT 记录加到 Cloudflare DNS。
3. **提交 sitemap。** 在 Search Console 左侧「站点地图」里提交 `https://adjens.com/sitemap.xml`。
4. **请求收录重点页。** 用顶部「网址检查」逐个检查首页、`/blog/podcast`，以及最好的 5–10 篇文章，点「请求编入索引」。
5. **Bing。** 在 [Bing Webmaster Tools](https://www.bing.com/webmasters) 里直接从 Google Search Console 导入，然后跑一次 `npm run indexnow`。

## 之后每发一篇

- 发布后跑一次 `npm run indexnow`（Bing 等）。
- 好文章在 Search Console 里手动「请求编入索引」。
- 在公众号、即刻、小红书、YouTube 简介里放文章链接。外链是新站被发现最快的方式。

## 一周后检查

Search Console →「网页」报告：

- **已编入索引**：数字在涨就对了。
- **已抓取 - 尚未编入索引**：多半是内容太短或太像别处，先把这几篇写厚。
- **已发现 - 尚未编入索引**：谷歌知道但还没来抓，新站正常，等。
- **已排除（noindex）**：剪报栏目会出现在这里，这是故意的。
