import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAllSlugs, getPost, formatPostDate } from "@/lib/blog";
import { Nav } from "@/components/nav/Nav";
import { Footer } from "@/components/footer/Footer";

interface RouteProps {
  params: Promise<{ slug: string }>;
}

// Pre-render every post at build time. Anything not in this list 404s
// (dynamicParams = false) so we never try to render a post that doesn't
// exist on disk.
export function generateStaticParams() {
  return getAllSlugs().map(slug => ({ slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: RouteProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: "Post not found — VibeFlow Marketing" };

  const url = `https://vibeflow.marketing/blog/${slug}`;
  return {
    title: `${post.title} — VibeFlow Marketing`,
    description: post.excerpt || `Read "${post.title}" on the VibeFlow Marketing blog.`,
    openGraph: {
      title: post.title,
      description: post.excerpt || `Read "${post.title}" on the VibeFlow Marketing blog.`,
      url,
      siteName: "VibeFlow Marketing",
      type: "article",
      publishedTime: post.date,
      authors: post.author ? [post.author] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt || `Read "${post.title}" on the VibeFlow Marketing blog.`,
    },
    alternates: { canonical: url },
  };
}

export default async function BlogPostPage({ params }: RouteProps) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  // Dynamic import — Next.js compiles each .mdx file into a React component
  // at build time. The default export is the component. Uses the @content
  // path alias defined in tsconfig.json.
  const { default: PostBody } = await import(`@content/blog/${slug}.mdx`);

  // JSON-LD BlogPosting schema for rich SEO results.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    author: post.author ? [{ "@type": "Person", name: post.author }] : [{ "@type": "Organization", name: "VibeFlow Marketing" }],
    publisher: {
      "@type": "Organization",
      name: "VibeFlow Marketing",
      url: "https://vibeflow.marketing",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://vibeflow.marketing/blog/${slug}`,
    },
  };

  return (
    <>
      <Nav />
      <main style={{ minHeight: "100vh", background: "#FFFFFF", padding: "60px 24px 100px" }}>
        <article style={{ maxWidth: 720, margin: "0 auto" }}>

          {/* Back to blog */}
          <Link href="/blog" style={{
            fontFamily: "var(--font-dm-sans)", fontSize: 14, fontWeight: 500,
            color: "#878787", textDecoration: "none", marginBottom: 28,
            display: "inline-block",
          }}>
            ← All posts
          </Link>

          {/* Post header */}
          <header style={{ marginBottom: 40 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 10, marginBottom: 16,
              fontFamily: "var(--font-dm-sans)", fontSize: 13, color: "#AAAAAA",
            }}>
              <time dateTime={post.date}>{formatPostDate(post.date)}</time>
              <span>·</span>
              <span>{post.readingTimeMinutes} min read</span>
              {post.author && (
                <>
                  <span>·</span>
                  <span>by {post.author}</span>
                </>
              )}
            </div>
            <h1 style={{
              fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 40,
              color: "#1F1F1F", letterSpacing: "-0.02em", lineHeight: 1.15,
              marginBottom: 16,
            }}>
              {post.title}
            </h1>
            {post.excerpt && (
              <p style={{
                fontFamily: "var(--font-dm-sans)", fontSize: 19, color: "#666666",
                lineHeight: 1.55, marginBottom: 0,
              }}>
                {post.excerpt}
              </p>
            )}
          </header>

          {/* Post body */}
          <div style={{
            paddingTop: 8,
            borderTop: "1px solid #EEEEEE",
          }}>
            <div style={{ paddingTop: 32 }}>
              <PostBody />
            </div>
          </div>

          {/* Footer CTA */}
          <div style={{
            marginTop: 64, padding: "32px",
            background: "linear-gradient(135deg, #E6FAF8 0%, #F0FAF8 100%)",
            borderRadius: 18, border: "1px solid rgba(5,173,152,0.2)",
            textAlign: "center",
          }}>
            <h3 style={{
              fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 22,
              color: "#1F1F1F", letterSpacing: "-0.015em", marginBottom: 8,
            }}>
              Ship marketing as fast as you ship code.
            </h3>
            <p style={{
              fontFamily: "var(--font-dm-sans)", fontSize: 15, color: "#878787",
              lineHeight: 1.6, marginBottom: 20, maxWidth: 480, margin: "0 auto 20px",
            }}>
              VibeFlow turns one prompt into a full launch — content, social, SEO, ads, ASO, email. Free to try.
            </p>
            <Link href="/login" style={{
              background: "#05AD98", color: "#FFFFFF",
              fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: 15,
              padding: "12px 28px", borderRadius: 999, textDecoration: "none",
              display: "inline-block",
            }}>
              Start free →
            </Link>
          </div>
        </article>
      </main>
      <Footer />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
