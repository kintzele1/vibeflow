import type { MDXComponents } from "mdx/types";
import type { CSSProperties, ReactNode } from "react";

/**
 * Global MDX components — these style every .mdx file rendered in the app.
 * Tuned to match VibeFlow's existing brand: Syne for headings, DM Sans for
 * body, #1F1F1F primary text, #878787 secondary, #05AD98 accent.
 *
 * App Router requires this file at /src/mdx-components.tsx (or root) when
 * @next/mdx is installed.
 */

const styles: Record<string, CSSProperties> = {
  h1: {
    fontFamily: "var(--font-syne)",
    fontWeight: 700,
    fontSize: 36,
    color: "#1F1F1F",
    letterSpacing: "-0.02em",
    marginTop: 0,
    marginBottom: 16,
    lineHeight: 1.2,
  },
  h2: {
    fontFamily: "var(--font-syne)",
    fontWeight: 700,
    fontSize: 26,
    color: "#1F1F1F",
    letterSpacing: "-0.015em",
    marginTop: 40,
    marginBottom: 14,
    lineHeight: 1.3,
  },
  h3: {
    fontFamily: "var(--font-syne)",
    fontWeight: 700,
    fontSize: 20,
    color: "#1F1F1F",
    marginTop: 32,
    marginBottom: 10,
    lineHeight: 1.35,
  },
  p: {
    fontFamily: "var(--font-dm-sans)",
    fontSize: 17,
    color: "#333333",
    lineHeight: 1.75,
    marginBottom: 18,
  },
  ul: {
    fontFamily: "var(--font-dm-sans)",
    fontSize: 17,
    color: "#333333",
    lineHeight: 1.75,
    marginBottom: 18,
    paddingLeft: 24,
  },
  ol: {
    fontFamily: "var(--font-dm-sans)",
    fontSize: 17,
    color: "#333333",
    lineHeight: 1.75,
    marginBottom: 18,
    paddingLeft: 24,
  },
  li: {
    marginBottom: 6,
  },
  a: {
    color: "#05AD98",
    textDecoration: "underline",
    textDecorationThickness: 1,
    textUnderlineOffset: 3,
  },
  blockquote: {
    fontFamily: "var(--font-dm-sans)",
    fontSize: 17,
    fontStyle: "italic",
    color: "#555555",
    borderLeft: "3px solid #05AD98",
    paddingLeft: 18,
    marginLeft: 0,
    marginRight: 0,
    marginBottom: 22,
  },
  code: {
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
    fontSize: 14,
    background: "#F0F0F0",
    color: "#1F1F1F",
    padding: "2px 6px",
    borderRadius: 4,
  },
  pre: {
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
    fontSize: 14,
    background: "#1F1F1F",
    color: "#F8F8F8",
    padding: "18px 20px",
    borderRadius: 12,
    overflow: "auto",
    marginBottom: 22,
    lineHeight: 1.6,
  },
  hr: {
    border: "none",
    borderTop: "1px solid #EEEEEE",
    margin: "32px 0",
  },
  img: {
    maxWidth: "100%",
    height: "auto",
    borderRadius: 12,
    margin: "20px 0",
  },
  strong: {
    fontWeight: 600,
    color: "#1F1F1F",
  },
};

const components: MDXComponents = {
  h1: ({ children }: { children?: ReactNode }) => <h1 style={styles.h1}>{children}</h1>,
  h2: ({ children }: { children?: ReactNode }) => <h2 style={styles.h2}>{children}</h2>,
  h3: ({ children }: { children?: ReactNode }) => <h3 style={styles.h3}>{children}</h3>,
  p: ({ children }: { children?: ReactNode }) => <p style={styles.p}>{children}</p>,
  ul: ({ children }: { children?: ReactNode }) => <ul style={styles.ul}>{children}</ul>,
  ol: ({ children }: { children?: ReactNode }) => <ol style={styles.ol}>{children}</ol>,
  li: ({ children }: { children?: ReactNode }) => <li style={styles.li}>{children}</li>,
  a: ({ children, href }: { children?: ReactNode; href?: string }) => (
    <a href={href} style={styles.a}>{children}</a>
  ),
  blockquote: ({ children }: { children?: ReactNode }) => (
    <blockquote style={styles.blockquote}>{children}</blockquote>
  ),
  code: ({ children }: { children?: ReactNode }) => <code style={styles.code}>{children}</code>,
  pre: ({ children }: { children?: ReactNode }) => <pre style={styles.pre}>{children}</pre>,
  hr: () => <hr style={styles.hr} />,
  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
  img: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...props} style={styles.img} alt={props.alt ?? ""} />,
  strong: ({ children }: { children?: ReactNode }) => <strong style={styles.strong}>{children}</strong>,
};

export function useMDXComponents(): MDXComponents {
  return components;
}
