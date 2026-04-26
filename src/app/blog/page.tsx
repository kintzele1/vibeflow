import Link from "next/link";
import type { Metadata } from "next";
import { getAllPosts, formatPostDate } from "@/lib/blog";
import { Nav } from "@/components/nav/Nav";
import { Footer } from "@/components/footer/Footer";

export const metadata: Metadata = {
  title: "Blog — VibeFlow Marketing",
  description: "Build-in-public notes on marketing for indie hackers — what we ship, what we learn, what works.",
  openGraph: {
    title: "Blog — VibeFlow Marketing",
    description: "Build-in-public notes on marketing for indie hackers — what we ship, what we learn, what works.",
    url: "https://vibeflow.marketing/blog",
    siteName: "VibeFlow Marketing",
    type: "website",
  },
  alternates: { canonical: "https://vibeflow.marketing/blog" },
};

export default function BlogIndexPage() {
  const posts = getAllPosts();

  return (
    <>
      <Nav />
      <main style={{ minHeight: "100vh", background: "#FFFFFF", padding: "80px 24px 120px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>

          {/* Hero */}
          <header style={{ marginBottom: 56 }}>
            <div style={{
              fontFamily: "var(--font-dm-sans)", fontSize: 13, fontWeight: 500,
              color: "#05AD98", letterSpacing: "0.1em", textTransform: "uppercase",
              marginBottom: 12,
            }}>
              The VibeFlow Blog
            </div>
            <h1 style={{
              fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 44,
              color: "#1F1F1F", letterSpacing: "-0.02em", marginBottom: 16,
              lineHeight: 1.15,
            }}>
              Build-in-public notes on marketing for indie hackers.
            </h1>
            <p style={{
              fontFamily: "var(--font-dm-sans)", fontSize: 18, color: "#878787",
              lineHeight: 1.65, maxWidth: 640,
            }}>
              What we ship, what we learn, what works. No fluff, no funnels — just the marketing playbook for people who'd rather be building.
            </p>
          </header>

          {/* Posts */}
          {posts.length === 0 ? (
            <div style={{
              background: "#F8F8F8", borderRadius: 16, padding: "40px 32px",
              fontFamily: "var(--font-dm-sans)", fontSize: 16, color: "#878787",
              textAlign: "center", lineHeight: 1.65,
            }}>
              First post coming soon. In the meantime, follow along on{" "}
              <a href="https://x.com/lizkintz" style={{ color: "#05AD98", textDecoration: "underline" }}>X</a>.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {posts.map((post, idx) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  style={{
                    display: "block", textDecoration: "none",
                    padding: "32px 0",
                    borderTop: idx === 0 ? "1px solid #EEEEEE" : undefined,
                    borderBottom: "1px solid #EEEEEE",
                  }}
                >
                  <article>
                    <div style={{
                      display: "flex", alignItems: "center", gap: 10, marginBottom: 10,
                      fontFamily: "var(--font-dm-sans)", fontSize: 13, color: "#AAAAAA",
                    }}>
                      <time dateTime={post.date}>{formatPostDate(post.date)}</time>
                      <span>·</span>
                      <span>{post.readingTimeMinutes} min read</span>
                      {post.tags && post.tags.length > 0 && (
                        <>
                          <span>·</span>
                          <span>{post.tags.slice(0, 2).join(", ")}</span>
                        </>
                      )}
                    </div>
                    <h2 style={{
                      fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 26,
                      color: "#1F1F1F", letterSpacing: "-0.015em", lineHeight: 1.25,
                      marginBottom: 10,
                    }}>
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p style={{
                        fontFamily: "var(--font-dm-sans)", fontSize: 16, color: "#666666",
                        lineHeight: 1.6, marginBottom: 12,
                      }}>
                        {post.excerpt}
                      </p>
                    )}
                    <span style={{
                      fontFamily: "var(--font-dm-sans)", fontSize: 14, fontWeight: 500,
                      color: "#05AD98",
                    }}>
                      Read post →
                    </span>
                  </article>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
