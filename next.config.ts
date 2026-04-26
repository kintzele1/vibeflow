import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import createMDX from "@next/mdx";

const nextConfig: NextConfig = {
  // Allow .md and .mdx files to be treated as routable pages and importable
  // modules so the blog can author posts in /content/blog/*.mdx.
  pageExtensions: ["js", "jsx", "ts", "tsx", "md", "mdx"],
};

// MDX plugins are referenced by string name so they survive Turbopack's
// JS-to-Rust boundary (function-based plugins don't work with Turbopack
// per Next.js 16 docs). remark-frontmatter strips the YAML block at the
// top of each post so it doesn't render as text — we re-read the same
// frontmatter server-side in /src/lib/blog.ts via gray-matter for the
// blog index.
const withMDX = createMDX({
  options: {
    remarkPlugins: ["remark-frontmatter"],
    rehypePlugins: [],
  },
});

/**
 * Compose order: MDX wraps the base config, Sentry wraps the result.
 * Sentry wrapping happens last so its instrumentation sees the final config.
 */
export default withSentryConfig(withMDX(nextConfig), {
  silent: true,
  disableLogger: true,
});
