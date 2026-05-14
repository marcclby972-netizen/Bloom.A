import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy — Bloom',
  description: 'How Bloom collects, uses, and protects your data',
}

const LAST_UPDATED = 'May 14, 2026'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <article className="max-w-3xl mx-auto prose prose-sm dark:prose-invert">
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: {LAST_UPDATED}</p>

        <Section title="1. Introduction">
          <p>
            Bloom (&quot;we&quot;, &quot;us&quot;, &quot;the Service&quot;) is a personal productivity, CRM and marketing
            dashboard. This Privacy Policy explains what information we collect, how we use it,
            and the choices you have.
          </p>
        </Section>

        <Section title="2. Information we collect">
          <h3>2.1 Account information</h3>
          <p>
            When you sign up, we collect your email address and any name you choose to provide.
            Authentication is handled by Supabase, an industry-standard authentication provider.
          </p>

          <h3>2.2 Data you create in the app</h3>
          <p>We store the content you choose to enter into Bloom, including:</p>
          <ul>
            <li>Tasks, todos, calendar events, time entries</li>
            <li>Contacts, projects, project notes, vocal notes</li>
            <li>Marketing posts and metrics</li>
            <li>Application settings (theme, AI configuration, integrations)</li>
          </ul>
          <p>
            This data is stored in our Supabase database (PostgreSQL with Row Level Security)
            and is accessible only to your account.
          </p>

          <h3>2.3 Third-party integrations (OAuth)</h3>
          <p>
            When you connect a third-party service (YouTube, Instagram, Facebook, TikTok,
            LinkedIn, Google Calendar, Stripe, etc.), we receive an OAuth access token from
            that service and store it encrypted in our database. We use this token only to
            fetch the data you explicitly request through Bloom&apos;s interface (e.g., your video
            statistics, post metrics, ad spend). We do not post anything on your behalf without
            your explicit action.
          </p>
          <p>
            We do not store the password of any third-party service. Tokens can be revoked
            at any time from the Bloom Settings page or directly from the third-party service
            provider.
          </p>

          <h3>2.4 API keys for AI providers</h3>
          <p>
            If you connect an AI provider (Anthropic, OpenAI, Google), your API key is stored
            locally in your browser (localStorage) and synced encrypted to your account row
            via Supabase. The key is sent server-side only when you make an AI request through
            Bloom and is forwarded directly to the AI provider. We do not log or retain the
            content of your AI conversations on our servers beyond the response delivery.
          </p>

          <h3>2.5 Password vault (optional)</h3>
          <p>
            If you use Bloom&apos;s password vault, your master password is <strong>never</strong>
            transmitted to our servers. All entries are encrypted client-side using AES-256-GCM
            with a key derived from your master password via PBKDF2 (250,000 iterations).
            Only the encrypted blob is stored. If you lose your master password, we cannot
            recover your vault data.
          </p>
        </Section>

        <Section title="3. How we use your information">
          <ul>
            <li>To provide and improve the Service</li>
            <li>To authenticate you and protect your account</li>
            <li>To sync your data across your devices</li>
            <li>To fetch and display data from third-party services you have connected</li>
            <li>To respond to support requests</li>
          </ul>
          <p>
            We do <strong>not</strong> sell, rent, or share your personal data with advertisers,
            data brokers, or other third parties for marketing purposes.
          </p>
        </Section>

        <Section title="4. Data from connected social media platforms">
          <p>When you connect a social media account (YouTube, Meta, TikTok, LinkedIn), we may access:</p>
          <ul>
            <li>Your public profile information (name, username, avatar, channel/page ID)</li>
            <li>Your posts/videos and their public metrics (views, likes, comments, shares)</li>
            <li>Your private insights metrics (impressions, reach, engagement) — only for pages/accounts you administer</li>
            <li>Your ad campaigns metrics (spend, conversions) — only if you grant the ads permission</li>
          </ul>
          <p>
            This data is fetched on-demand when you trigger a refresh in Bloom. It is stored
            in our database under your account only to the extent that you choose to import
            posts into Bloom&apos;s Marketing section.
          </p>
          <p>
            We use this data only to display it back to you within Bloom. We do not aggregate
            it with other users&apos; data, sell it, or share it with third parties.
          </p>
          <p>
            <strong>Meta Platform Terms compliance:</strong> Bloom complies with Meta&apos;s Platform
            Terms and Developer Policies. You can revoke Bloom&apos;s access to your Meta account
            at any time from{' '}
            <a href="https://www.facebook.com/settings?tab=business_tools" target="_blank" rel="noopener noreferrer">
              Facebook Business Integrations settings
            </a>.
          </p>
          <p>
            <strong>TikTok compliance:</strong> Bloom complies with TikTok&apos;s Developer Terms
            of Service. You can disconnect at any time from TikTok&apos;s connected apps page.
          </p>
        </Section>

        <Section title="5. Cookies and tracking">
          <p>
            Bloom uses essential cookies (set by Supabase) to keep you signed in, plus
            optional functional storage in your browser to remember your interface
            preferences. We do not use third-party analytics, advertising trackers, or
            fingerprinting.
          </p>
          <p>
            For an exhaustive list of every cookie and storage entry we use, including
            their purpose and duration, and to manage your consent at any time, see our
            dedicated <a href="/cookies" className="text-primary hover:underline">Cookies Policy</a>.
          </p>
        </Section>

        <Section title="6. Data retention">
          <p>
            Your data is retained as long as your account is active. If you delete your account,
            all your data (tasks, todos, contacts, projects, posts, OAuth tokens, password
            vault encrypted blob) is permanently deleted within 30 days.
          </p>
        </Section>

        <Section title="7. Security">
          <p>We protect your data using:</p>
          <ul>
            <li>HTTPS/TLS for all network traffic</li>
            <li>Supabase Row Level Security (RLS) policies — every database query is scoped to your user ID</li>
            <li>Encrypted storage of OAuth tokens at rest</li>
            <li>AES-256-GCM client-side encryption for the password vault</li>
            <li>Regular security updates and dependency audits</li>
          </ul>
          <p>
            No system is 100% secure. If we become aware of a data breach affecting your
            personal information, we will notify you within 72 hours.
          </p>
        </Section>

        <Section title="8. Your rights">
          <p>Depending on your jurisdiction (GDPR for EU residents, CCPA for California, etc.), you have the right to:</p>
          <ul>
            <li>Access the personal data we hold about you</li>
            <li>Request correction or deletion</li>
            <li>Export your data (Bloom&apos;s Settings → Data → Export provides a full JSON dump)</li>
            <li>Withdraw consent for any optional processing at any time</li>
            <li>Lodge a complaint with your local data protection authority</li>
          </ul>
        </Section>

        <Section title="9. Children">
          <p>
            Bloom is not intended for users under the age of 16. We do not knowingly collect
            personal information from children. If we learn that we have collected such
            information, we will delete it promptly.
          </p>
        </Section>

        <Section title="10. International users">
          <p>
            Bloom is hosted on Vercel (United States) and uses Supabase (which may host data
            in various regions). By using Bloom, you consent to the transfer of your data to
            these regions. We rely on standard contractual clauses where applicable for
            cross-border data transfers.
          </p>
        </Section>

        <Section title="11. Changes to this policy">
          <p>
            We may update this Privacy Policy from time to time. Material changes will be
            communicated by email or in-app notification. The &quot;Last updated&quot; date at the top
            of this page reflects the latest revision.
          </p>
        </Section>

        <Section title="12. Contact">
          <p>
            For any privacy-related question or to exercise your rights, contact us at:{' '}
            <a href="mailto:marc.clby.972@gmail.com">marc.clby.972@gmail.com</a>
          </p>
        </Section>

        <div className="mt-12 pt-6 border-t border-border">
          <a href="/" className="text-sm text-primary hover:underline">← Back to Bloom</a>
        </div>
      </article>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-semibold mb-3 mt-6">{title}</h2>
      <div className="text-sm leading-relaxed text-foreground/80 space-y-3">
        {children}
      </div>
    </section>
  )
}
