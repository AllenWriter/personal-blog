# Translating 小举人 into English and Japanese

Chinese (Simplified) is the source language. English and Japanese editions are
translations of individual files. The site builds whatever translations exist;
an untranslated page falls back to the Chinese original.

## Where translations go

A translation sits next to its source with a language suffix:

| Source | English | Japanese |
|---|---|---|
| `content/blog/podcast/coffee-futures-origin.mdx` | `coffee-futures-origin.en.mdx` | `coffee-futures-origin.ja.mdx` |
| `content/docs/multi-ssh.mdx` | `multi-ssh.en.mdx` | `multi-ssh.ja.mdx` |

Never translate `content/blog/wechat/` (republished third-party articles).
Never edit a source `.mdx` file, `content/docs/meta.json`, or anything outside `content/`.

## Frontmatter

A translation's frontmatter has only the fields that change:

```md
---
title: "How Coffee Futures Came to Be"
description: "One or two sentences, natural in the target language."
---
```

- Every other field (date, cover, series, author) comes from the source. Do not copy them.
- Wrap values in double quotes; escape inner double quotes as `\"`.
- Podcast titles in the source start with `冷知识盲盒：`. Drop that prefix in translations; the site shows the show name separately.
- Manuals (`content/docs/`) only: if the source has `coverWord` in Chinese, add a short English or Japanese `coverWord` (one or two words, the key term of the article).

## Body

- Translate everything a reader sees: paragraphs, headings, list items, table cells, image alt text and captions (the `*italic*` line right below an image).
- Keep the Markdown structure exactly: same headings (`##`, `###`), same lists, same tables, same images in the same places.
- Do not change image paths, URLs, code blocks, inline code, file names, commands, or keyboard keys (`<kbd>`).
- Internal links stay as they are (`/blog/...`, `/docs/...`). The build points them at the translated page when one exists.
- Keep it natural, not literal. These are conversational scripts and personal notes: write the way a native writer would say it, keep the author's jokes and asides, and split very long Chinese sentences.
- Numbers, dates and money: keep the source values; use the target language's usual format (English: "October 2025", "$4.38"; Japanese: 「2025年10月」「4.38ドル」).
- Chinese names: English uses pinyin (Shenzhen, Longgang); Japanese uses kanji with the usual Japanese reading where one exists.

## Glossary

| Chinese | English | Japanese |
|---|---|---|
| 小举人 (site name) | 小举人 (keep as is) | 小举人 (keep as is) |
| 冷知识盲盒 (the show) | Cold-Knowledge Blind Box | 冷知識ブラインドボックス |
| 大家好，欢迎收听冷知识盲盒 | Hi everyone, welcome to Cold-Knowledge Blind Box | みなさんこんにちは、冷知識ブラインドボックスへようこそ |
| 手记 | Notes | ノート |
| 手册 | Manuals | マニュアル |
| Jens | Jens | Jens |
| Agent / 智能体 | agent | エージェント |
| 大模型 | large language model (LLM) | 大規模言語モデル（LLM） |
| 出海 | going global | 海外展開 |

## Checking your work

Run `node site/build.mjs && node site/check.mjs`. It must report the same
number of problems as before your change (missing images in drafts are known).
The build fails if a translation has broken frontmatter.
