import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — VibeFlow Marketing",
  description: "How VibeFlow Marketing collects, uses, and protects your data.",
};

export default function PrivacyPage() {
  return (
    <main style={{
      minHeight: "100vh",
      background: "#FFFFFF",
      padding: "80px 24px 120px",
      fontFamily: "var(--font-dm-sans)",
    }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>

        <Link href="/" style={{
          fontFamily: "var(--font-dm-sans)", fontSize: 14, fontWeight: 500,
          color: "#05AD98", textDecoration: "none", marginBottom: 32, display: "inline-block",
        }}>← Back to VibeFlow</Link>

        {/* Review banner */}
        <div style={{
          background: "#FFF8E1", border: "1px solid rgba(245,158,11,0.3)",
          borderRadius: 12, padding: "14px 18px", marginBottom: 40,
          fontFamily: "var(--font-dm-sans)", fontSize: 14, color: "#92670A", lineHeight: 1.6,
        }}>
          <strong>Policy under final review.</strong> This Privacy Policy is a clear-language summary. Formal legal copy is being finalized. Questions? Email <a href="mailto:hello@vibeflow.marketing" style={{ color: "#92670A", textDecoration: "underline" }}>hello@vibeflow.marketing</a>.
        </div>

        <h1 style={{
          fontFamily: "var(--font-syne)", fontWeight: 700,
          fontSize: 36, color: "#1F1F1F", letterSpacing: "-0.02em",
          marginBottom: 8,
        }}>Privacy Policy</h1>
        <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: 13, color: "#878787", marginBottom: 40 }}>
          Last updated: April 23, 2026
        </p>

        <section style={{ fontSize: 15, color: "#333333", lineHeight: 1.75, marginBottom: 28 }}>

          <h2 style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 20, color: "#1F1F1F", marginBottom: 8, marginTop: 24 }}>What we collect</h2>
          <p style={{ margin: 0, marginBottom: 12 }}>When you use VibeFlow Marketing, we collect:</p>
          <ul style={{ margin: 0, marginBottom: 16, paddingLeft: 22 }}>
            <li><strong>Account data:</strong> email, name, OAuth provider (Google/GitHub if used).</li>
            <li><strong>Your content:</strong> prompts, brand kit fields, generated campaigns, and saved calendar events. Stored so you can access them across devices.</li>
            <li><strong>Usage data:</strong> which agents you use, when, and how often. Used to calculate searches remaining and to improve the product.</li>
            <li><strong>Payment data:</strong> handled entirely by Stripe — we never see your full card number. We receive only a payment token and subscription status.</li>
            <li><strong>Integration data:</strong> if you connect Google Analytics, we store an encrypted OAuth token (AES-256-GCM at rest) so we can show your dashboard metrics. We never write to your GA4 property.</li>
            <li><strong>Product analytics:</strong> anonymous usage events via PostHog (page views, button clicks, feature adoption). Used for product improvement, not advertising.</li>
          </ul>

          <h2 style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 20, color: "#1F1F1F", marginBottom: 8, marginTop: 24 }}>What we don't do</h2>
          <ul style={{ margin: 0, marginBottom: 16, paddingLeft: 22 }}>
            <li>Sell your data. Ever.</li>
            <li>Use your content to train the underlying AI models. Your prompts are sent to Anthropic Claude for generation under their zero-retention API settings — they do not train on it.</li>
            <li>Serve ads. VibeFlow products are ad-free.</li>
            <li>Share your campaigns with other users.</li>
          </ul>

          <h2 style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 20, color: "#1F1F1F", marginBottom: 8, marginTop: 24 }}>Continuous Learning Engine — opt-in only</h2>
          <p style={{ margin: 0, marginBottom: 12 }}>
            VibeFlow is building a <strong>Learning & Improvement Engine</strong> — a system that watches which agent outputs perform well across the user base and auto-refines the agents' instructions over time. We only participate in this if you explicitly opt in.
          </p>
          <p style={{ margin: 0, marginBottom: 12 }}>
            If you opt in, we collect <strong>anonymized performance signals</strong> every time you generate a campaign:
          </p>
          <ul style={{ margin: 0, marginBottom: 12, paddingLeft: 22 }}>
            <li>Which agent type you used (e.g., <em>social_x_post</em>).</li>
            <li>Approximate prompt length and output length.</li>
            <li>A one-way hash of your brand kit (we never see the raw contents).</li>
            <li>Optional engagement signals you authorize from connected integrations (e.g., GA4 clicks on a campaign URL).</li>
            <li>Any thumbs-up / thumbs-down ratings you give generated content.</li>
          </ul>
          <p style={{ margin: 0, marginBottom: 12 }}>
            We never collect the text of your prompts, campaign content, brand kit fields, or any identifying information in the learning signals. Signals are keyed on a rotating anonymous ID, not your account.
          </p>
          <p style={{ margin: 0, marginBottom: 16 }}>
            You can opt out anytime from Settings. Opting out stops new signals from being collected. If you want existing signals deleted too, email us.
          </p>

          <h2 style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 20, color: "#1F1F1F", marginBottom: 8, marginTop: 24 }}>Where your data lives</h2>
          <p style={{ margin: 0, marginBottom: 16 }}>
            Account data, content, and usage data are stored in Supabase (US region). Payment data lives at Stripe. Encrypted OAuth tokens live in Supabase. Product analytics events live at PostHog.
          </p>

          <h2 style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 20, color: "#1F1F1F", marginBottom: 8, marginTop: 24 }}>Your rights</h2>
          <ul style={{ margin: 0, marginBottom: 16, paddingLeft: 22 }}>
            <li><strong>Access + export:</strong> Download your campaigns anytime as Markdown, CSV, or ICS from the Calendar and Campaigns pages.</li>
            <li><strong>Delete:</strong> Delete individual campaigns from the Campaigns page. To delete your entire account and all associated data, email us.</li>
            <li><strong>Disconnect integrations:</strong> Revoke GA4 access from the Integrations tab any time.</li>
            <li><strong>Opt-out of learning signals:</strong> toggle in Settings.</li>
          </ul>

          <h2 style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 20, color: "#1F1F1F", marginBottom: 8, marginTop: 24 }}>Cookies</h2>
          <p style={{ margin: 0, marginBottom: 16 }}>
            We use essential cookies for login session management (Supabase Auth). We use PostHog's privacy-preserving analytics cookies. No ad cookies.
          </p>

          <h2 style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 20, color: "#1F1F1F", marginBottom: 8, marginTop: 24 }}>Children</h2>
          <p style={{ margin: 0, marginBottom: 16 }}>
            VibeFlow is not intended for users under 13. If we learn an account belongs to a minor, we'll close it.
          </p>

          <h2 style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 20, color: "#1F1F1F", marginBottom: 8, marginTop: 24 }}>Contact</h2>
          <p style={{ margin: 0, marginBottom: 16 }}>
            Privacy questions, access/deletion requests, or concerns: <a href="mailto:hello@vibeflow.marketing" style={{ color: "#05AD98" }}>hello@vibeflow.marketing</a>.
          </p>

        </section>

      </div>
    </main>
  );
}
