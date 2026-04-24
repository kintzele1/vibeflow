"use client";
/**
 * Global error boundary for the App Router. Next.js renders this when an
 * unhandled error escapes a page or layout. We forward it to Sentry so
 * client-side crashes show up alongside server errors.
 *
 * Keep this minimal — it's the "worst case" UI the user sees. Don't import
 * dashboard components here (they might be part of what's broken).
 */
import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{
        fontFamily: "system-ui, -apple-system, sans-serif",
        padding: "60px 24px",
        maxWidth: 540,
        margin: "0 auto",
        color: "#1F1F1F",
      }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>
          Something went wrong.
        </h1>
        <p style={{ fontSize: 16, color: "#555", lineHeight: 1.6, marginBottom: 24 }}>
          We've logged the error and will take a look. Try refreshing the page, or go back to the home screen.
        </p>
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: "#05AD98",
              color: "#FFFFFF",
              border: "none",
              padding: "12px 20px",
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Reload page
          </button>
          <a href="/" style={{
            background: "#F8F8F8",
            color: "#1F1F1F",
            border: "1px solid #EEEEEE",
            padding: "12px 20px",
            borderRadius: 10,
            fontSize: 15,
            fontWeight: 500,
            textDecoration: "none",
          }}>
            Go home
          </a>
        </div>
      </body>
    </html>
  );
}
