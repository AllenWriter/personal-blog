# 小举人

Jens 的个人杂志：《冷知识盲盒》节目文稿，以及关于 AI、产品、生活和钱的手记。
线上地址：<https://adjens.com>

整个站点是一个**零依赖的静态站**：只要装了 Node 20+，不用 `npm install`。

## 本地预览

```sh
npm run dev          # http://localhost:4321，改文章会自动重新生成
```

## 写一篇新文章

在 `content/blog/<栏目>/` 下新建一个 `.mdx` 文件，文件名就是网址：

```md
---
title: "冷知识盲盒：标题"
description: "一两句话的摘要，会出现在列表、搜索结果和分享卡片里。"
author: Jens
date: 2026-11-08
cover: /blog/covers/文件名.webp
series: podcast
---

正文用普通 Markdown 写。
```

- 栏目：`podcast`（冷知识盲盒）、`tech`、`finance`、`life`、`travel`、`wechat`（剪报）。栏目配置在 `site/config.mjs`。
- 封面放在 `public/blog/covers/`，正文配图放在 `public/blog/<栏目>/<文章名>/`。
- 图片下面紧跟一行 `*斜体*`，就会变成图注。
- 冷知识盲盒的期数按日期自动编号。
- 手册（`content/docs/`）的顺序和分组在 `content/docs/meta.json` 里。

## 发布

```sh
npm run deploy       # 生成正式版、检查，然后上传到主机
npm run indexnow     # 可选：通知 Bing 等搜索引擎有更新
```

## 目录

| 路径 | 内容 |
|---|---|
| `content/` | 文章和手册（Markdown） |
| `public/` | 图片、封面、图标，原样复制到站点 |
| `site/` | 生成器：`build.mjs` 生成、`markdown.mjs` 渲染、`templates.mjs` 页面、`styles.css` 样式、`check.mjs` 检查 |
| `dist/` | 生成结果（不进 git） |
| `deploy/` | 主机上的 nginx 配置和上传脚本 |

## 线上架构

- 域名 `adjens.com` 托管在 Cloudflare，**必须开代理（橙色云朵）**：主机防火墙只允许 Cloudflare 的 IP 访问 80/443。
- 主机 `103.27.187.131` 上，`/opt/xiaojuren-blog/site` 放生成好的站点，由 `xiaojuren-blog` 容器（nginx）提供，监听 `172.18.0.1:8081`。
- 总入口 `wordpress-yy-proxy-1` 里的 `conf.d/adjens.com.conf` 负责把 adjens.com 转给博客容器，内容和 `deploy/adjens.com.conf` 一致。
- Cloudflare 回源用的是主机上的自签证书（`/opt/wordpress-yy/certs/adjens-*.pem`，有效期 10 年），所以 Cloudflare 的 SSL 模式要选 Full，不能选 Full (strict)。
- 部署密钥在 `.workspace/deploy_key`（不进 git），公钥登记在主机 root 的 `authorized_keys` 里，标注为 `xiaojuren-blog-deploy`。

## 搜索引擎

- `sitemap.xml`、`robots.txt`、`feed.xml` 都由构建自动生成。
- 剪报栏目是转载内容，不进首页、往期和 RSS。默认带 `noindex`；`site/config.mjs` 里 `indexAccounts` 列出的公众号（目前是二小姐后花园）例外，可以进谷歌。
- 旧的多语言地址（`/zh-CN/...`、`/en/...`、`/ja/...`）会 301 跳到新的中文地址。
- 英文版和日文版：在原文旁边放 `文件名.en.mdx` / `文件名.ja.mdx`，网站自动生成 `/en/...`、`/ja/...` 页面和语言切换。还没翻译的页面会跳回中文原文。翻译规范见 [`TRANSLATING.md`](TRANSLATING.md)。

收录排查和 Search Console 提交步骤见 [`SEO.md`](SEO.md)。
