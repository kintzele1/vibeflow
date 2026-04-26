# Blog content

Posts live as `.mdx` files in this directory. Each file maps to a URL like `/blog/{filename-without-extension}`.

## Adding a new post

1. Create a new file: `content/blog/your-slug-here.mdx`
2. Add YAML frontmatter at the top (see template below)
3. Write the post body in markdown — you can use any Markdown syntax + JSX components
4. Commit and push — Vercel rebuilds the site and the post is live

## Frontmatter template

```mdx
---
title: "Your post title"
date: "2026-04-26"          # ISO YYYY-MM-DD — drives ordering on the index
excerpt: "One-sentence hook that shows on the index and in social previews."
author: "Liz Kintzele"      # optional
published: true             # set to false to keep a draft out of the index
tags: ["build-in-public"]   # optional, first two appear on the index
---

# Your post

Content goes here. Use markdown — `**bold**`, `[links](https://...)`, lists, headings.

## Subheadings

You can also embed React components:

<MyCustomComponent />

— but for plain posts, markdown is enough.
```

## Slug rules

- File name = URL slug. `welcome-to-the-vibeflow-blog.mdx` → `/blog/welcome-to-the-vibeflow-blog`
- Use lowercase, hyphenated words. No spaces, no underscores.
- Once published, don't rename — it'll break inbound links and lose SEO.

## Drafts

Set `published: false` in frontmatter to keep a post out of the index and out of the route list (it'll 404 even if you visit the URL directly). Flip to `true` when ready.

## Reading time

Auto-calculated from word count (~225 wpm). No need to set it manually.

## Styling

Markdown elements (headings, paragraphs, lists, links, code blocks, etc.) are styled globally in `/src/mdx-components.tsx`. Edit that file to change how every post renders.
