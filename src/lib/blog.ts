import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

/**
 * Server-side helpers for the MDX blog. Posts live as .mdx files in
 * /content/blog/ at the repo root. Each file's YAML frontmatter declares
 * title, date, excerpt, and an optional published flag.
 *
 * Why not import every MDX file at the top: it'd force a bundle dependency
 * on every post for the index, which scales poorly. Instead we read raw
 * file contents server-side, parse frontmatter with gray-matter, and let
 * the dynamic import in /blog/[slug]/page.tsx handle actual rendering.
 */

export interface BlogPostFrontmatter {
  title: string;
  date: string;          // ISO YYYY-MM-DD
  excerpt: string;
  author?: string;
  published?: boolean;   // defaults to true if omitted
  tags?: string[];
}

export interface BlogPostMeta extends BlogPostFrontmatter {
  slug: string;          // filename without .mdx extension
  readingTimeMinutes: number;
}

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

function isMdx(file: string): boolean {
  return file.endsWith(".mdx") || file.endsWith(".md");
}

function slugFromFilename(file: string): string {
  return file.replace(/\.mdx?$/, "");
}

function estimateReadingTime(body: string): number {
  // ~225 wpm average for blog content. Round up; minimum 1 minute so a tiny
  // post doesn't render "0 min read".
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 225));
}

function safeReadDir(): string[] {
  try {
    return fs.readdirSync(BLOG_DIR);
  } catch {
    // Directory not yet created — return empty so the index renders cleanly
    // even on the very first deploy before any posts exist.
    return [];
  }
}

/**
 * Returns all published posts sorted newest-first. Drafts (published: false)
 * are filtered out so they never leak to production. Frontmatter validation
 * is permissive — missing fields fall back to safe defaults rather than
 * throwing, so a typo in one post doesn't break the whole blog.
 */
export function getAllPosts(): BlogPostMeta[] {
  const files = safeReadDir().filter(isMdx);

  const posts: BlogPostMeta[] = files.map(file => {
    const slug = slugFromFilename(file);
    const raw = fs.readFileSync(path.join(BLOG_DIR, file), "utf-8");
    const { data, content } = matter(raw);

    const fm: BlogPostFrontmatter = {
      title:     typeof data.title === "string" ? data.title : slug,
      date:      typeof data.date === "string" ? data.date : new Date().toISOString().slice(0, 10),
      excerpt:   typeof data.excerpt === "string" ? data.excerpt : "",
      author:    typeof data.author === "string" ? data.author : undefined,
      published: data.published !== false, // default true
      tags:      Array.isArray(data.tags) ? data.tags.filter((t: unknown): t is string => typeof t === "string") : undefined,
    };

    return {
      ...fm,
      slug,
      readingTimeMinutes: estimateReadingTime(content),
    };
  });

  return posts
    .filter(p => p.published)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

/**
 * Returns a single post's metadata, or null if it doesn't exist or is a
 * draft. Used by /blog/[slug]/page.tsx to render the post header + meta tags.
 */
export function getPost(slug: string): BlogPostMeta | null {
  const all = getAllPosts();
  return all.find(p => p.slug === slug) ?? null;
}

/**
 * Returns the slugs that should be statically generated. Drives
 * generateStaticParams in the dynamic [slug] route so every post gets
 * pre-rendered at build time for fast loads + SEO crawlability.
 */
export function getAllSlugs(): string[] {
  return getAllPosts().map(p => p.slug);
}

export function formatPostDate(date: string): string {
  // Render dates in en-US long form regardless of viewer locale so server
  // and client render identically (no hydration mismatch on locale).
  const d = new Date(date + "T00:00:00Z");
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
}
