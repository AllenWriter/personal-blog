# 小举人 — agent guide

A personal magazine (blog) by Jens. Chinese-first, static, zero npm dependencies.

## How it works

- `node site/build.mjs` reads `content/` and `public/`, writes static HTML to `dist/`.
- `node site/dev.mjs` serves `dist/` on :4321 and rebuilds on change.
- `node site/check.mjs` fails on broken internal links, missing images, or unrendered Markdown. Run it after any change.
- `npm run deploy` (`deploy/deploy.sh`) builds and rsyncs `dist/` to the host (see README「线上架构」). The host also runs other people-facing services (WordPress, xboard): never change their configs; always `nginx -t` before reloading the shared proxy.

## Rules

- **Keep zero dependencies.** Node built-ins only. Don't add a framework or npm package without asking.
- Content is Markdown with YAML-ish frontmatter (`title`, `description`, `date`, `series`, `cover`, `author`, `account`). There is no MDX/JSX.
- Series live in `site/config.mjs`. `indexed: false` (the `wechat` 剪报 column) keeps posts out of the home page, archive and feeds, and noindex. Only accounts the owner listed in `indexAccounts` may be indexed; don't add others without asking.
- URLs: posts `/blog/<series>/<slug>`, manuals `/docs/<slug>`. Don't change existing URLs; add a line to `_redirects` (in `site/build.mjs`) if one must move.
- User-facing copy is Simplified Chinese. Code, comments and commit messages are English.
- Design tokens are CSS custom properties at the top of `site/styles.css`. Light and dark both have to work; check phone width (390px) too.
- Commits: Conventional Commits, e.g. `feat(blog): add 咖啡期货`.
