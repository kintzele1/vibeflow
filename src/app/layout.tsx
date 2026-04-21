import type { Metadata } from "next";
import { Outfit, DM_Sans } from "next/font/google";
import { Suspense } from "react";
import Script from "next/script";
import "./globals.css";
import { PostHogProvider } from "@/components/providers/PostHogProvider";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  variable: "--font-syne",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "VibeFlow Marketing — One prompt. Full campaign. Perfectly on-brand.",
  description:
    "AI-powered marketing kit for vibe coders and indie hackers. Describe your app once — get a complete, coordinated campaign across every channel.",
  keywords: ["marketing", "AI", "indie hacker", "vibe coding", "campaign generator"],
  openGraph: {
    title: "VibeFlow Marketing",
    description: "One prompt. Full campaign. Perfectly on-brand.",
    type: "website",
    url: "https://vibeflow.marketing",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "VibeFlow Marketing",
    description: "One prompt. Full campaign. Perfectly on-brand.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  return (
    <html lang="en" className={`${outfit.variable} ${dmSans.variable}`}>
      <body className="antialiased">
        <Suspense fallback={null}>
          <PostHogProvider>{children}</PostHogProvider>
        </Suspense>
        {gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}');
              `}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
