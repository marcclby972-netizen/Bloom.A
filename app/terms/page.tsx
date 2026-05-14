import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service — Bloom',
  description: 'Terms governing your use of Bloom',
}

const LAST_UPDATED = 'May 14, 2026'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <article className="max-w-3xl mx-auto prose prose-sm dark:prose-invert">
        <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: {LAST_UPDATED}</p>

        <Section title="1. Agreement">
          <p>
            These Terms of Service (&quot;Terms&quot;) govern your access to and use of Bloom
            (&quot;the Service&quot;, &quot;we&quot;, &quot;us&quot;). By creating an account or using Bloom, you agree
            to be bound by these Terms. If you do not agree, do not use the Service.
          </p>
        </Section>

        <Section title="2. Description of the Service">
          <p>
            Bloom is a personal productivity application that combines task management,
            calendar, time tracking, CRM, marketing analytics, and integrations with
            third-party services (Google Calendar, YouTube, Meta, TikTok, LinkedIn,
            Stripe, etc.).
          </p>
        </Section>

        <Section title="3. Eligibility">
          <p>
            You must be at least 16 years old to use Bloom. By using the Service, you
            represent that you meet this requirement and that all information you provide
            is accurate and complete.
          </p>
        </Section>

        <Section title="4. Account">
          <p>
            You are responsible for maintaining the confidentiality of your account
            credentials (including your master password for the password vault, which we
            cannot recover). You agree to notify us immediately of any unauthorized use.
          </p>
          <p>
            You may not share your account with others, transfer it, or use it for any
            unlawful purpose.
          </p>
        </Section>

        <Section title="5. Your data and content">
          <p>
            You retain all rights to the data you create or import into Bloom. By using
            the Service, you grant us a limited, non-exclusive license to store, transmit,
            and display this data solely for the purpose of providing the Service to you.
          </p>
          <p>
            You are solely responsible for the content you put into Bloom, including any
            data imported from third-party platforms. You represent that you have all
            necessary rights to that content.
          </p>
        </Section>

        <Section title="6. Third-party integrations">
          <p>
            Bloom allows you to connect third-party services via OAuth (Google, Meta,
            TikTok, LinkedIn, Stripe, Anthropic, OpenAI, etc.). Your use of these services
            through Bloom is also subject to their own terms of service and privacy policies.
            We are not responsible for the availability, accuracy, or content of these
            third-party services.
          </p>
          <p>
            When you connect a third-party service, you authorize us to access the scoped
            data described in the OAuth consent screen. You may revoke this authorization
            at any time from Bloom&apos;s Settings page or directly from the third-party
            service provider.
          </p>
        </Section>

        <Section title="7. AI features">
          <p>
            Bloom includes optional AI features powered by third-party providers (Anthropic
            Claude, OpenAI GPT, Google Gemini). You are responsible for providing your own
            API keys for these services. The AI may produce inaccurate, biased, or
            inappropriate output; you should review and verify any AI-generated content
            before acting on it.
          </p>
          <p>
            We do not log or retain the content of your AI conversations beyond what is
            necessary to deliver the response.
          </p>
        </Section>

        <Section title="8. Acceptable use">
          <p>You agree NOT to:</p>
          <ul>
            <li>Use the Service for any illegal purpose or in violation of any laws</li>
            <li>Attempt to gain unauthorized access to other users&apos; accounts or our infrastructure</li>
            <li>Reverse-engineer, decompile, or disassemble the Service except as permitted by law</li>
            <li>Use the Service to send spam, malware, or other harmful content</li>
            <li>Scrape, crawl, or use automated tools to extract data from Bloom at a rate that disrupts the Service</li>
            <li>Resell or sublicense the Service without our written permission</li>
            <li>Violate the terms of any third-party platform you connect through Bloom</li>
          </ul>
        </Section>

        <Section title="9. Service availability">
          <p>
            We strive to keep Bloom available 24/7 but make no guarantees about uptime.
            We may perform maintenance, deploy updates, or suspend access temporarily.
            We are not liable for any loss arising from Service downtime.
          </p>
        </Section>

        <Section title="10. Modifications to the Service">
          <p>
            We may add, modify, or remove features at any time. Major changes affecting
            existing functionality will be communicated by email or in-app notification.
          </p>
        </Section>

        <Section title="11. Termination">
          <p>
            You may delete your account at any time from Bloom&apos;s Settings → Data → Delete
            all data. Upon deletion, your data is permanently removed within 30 days.
          </p>
          <p>
            We may suspend or terminate your account if we believe in good faith that you
            have violated these Terms. We will give you reasonable notice except in cases
            of severe abuse, legal obligation, or security risk.
          </p>
        </Section>

        <Section title="12. Disclaimers">
          <p>
            The Service is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any
            kind, express or implied, including but not limited to merchantability, fitness
            for a particular purpose, and non-infringement.
          </p>
          <p>
            We do not warrant that the Service will be uninterrupted, error-free, secure,
            or that any data you store will be preserved indefinitely. You are strongly
            encouraged to regularly export your data (Settings → Data → Export) for backup.
          </p>
        </Section>

        <Section title="13. Limitation of liability">
          <p>
            To the maximum extent permitted by law, Bloom and its operators shall not be
            liable for any indirect, incidental, special, consequential, or punitive damages,
            or any loss of profits, data, use, or goodwill arising out of your use of (or
            inability to use) the Service.
          </p>
          <p>
            Our total cumulative liability for any claim arising out of or relating to
            these Terms or the Service shall not exceed the amount you paid us in the
            twelve months preceding the claim, or one hundred euros (€100) if you have
            paid nothing.
          </p>
        </Section>

        <Section title="14. Indemnification">
          <p>
            You agree to indemnify and hold harmless Bloom and its operators from any
            claims, damages, liabilities, costs, or expenses (including reasonable
            attorneys&apos; fees) arising out of your use of the Service, your violation of
            these Terms, or your violation of any third-party rights.
          </p>
        </Section>

        <Section title="15. Governing law">
          <p>
            These Terms are governed by the laws of France. Any dispute arising out of or
            in connection with these Terms shall be subject to the exclusive jurisdiction
            of the courts of France, without prejudice to any mandatory consumer protection
            rights you may have in your country of residence.
          </p>
        </Section>

        <Section title="16. Changes to these Terms">
          <p>
            We may update these Terms from time to time. Material changes will be
            communicated by email or in-app notification at least 14 days before they take
            effect. Continued use of the Service after the changes take effect constitutes
            acceptance of the updated Terms.
          </p>
        </Section>

        <Section title="17. Contact">
          <p>
            For any question regarding these Terms, contact:{' '}
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
