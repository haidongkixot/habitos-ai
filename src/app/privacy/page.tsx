import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy - HabitOS AI',
  description: 'Privacy Policy for HabitOS AI, operated by PeeTeeAI.',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h1 className="text-4xl font-bold text-white mb-2">Privacy Policy</h1>
        <p className="text-gray-500 mb-12">Last updated: March 30, 2026</p>

        <div className="space-y-10 text-gray-300 leading-relaxed">
          <section>
            <p>
              HabitOS AI is operated by <strong className="text-white">PeeTeeAI</strong>. This Privacy Policy
              explains how we collect, use, disclose, and safeguard your information when you use the HabitOS AI
              application and website. Please read this policy carefully. By using HabitOS AI, you agree to the
              collection and use of information in accordance with this policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. Information We Collect</h2>
            <h3 className="text-lg font-medium text-emerald-400 mb-2">Personal Information</h3>
            <p className="mb-4">
              When you register for an account, we may collect your name, email address, and authentication
              credentials. If you sign in via a third-party provider (e.g., Google), we receive your profile
              information as permitted by that provider.
            </p>
            <h3 className="text-lg font-medium text-emerald-400 mb-2">Usage Data</h3>
            <p className="mb-4">
              We collect information about how you interact with HabitOS AI, including habit logs, streak data,
              progress metrics, coaching interactions, and session timestamps.
            </p>
            <h3 className="text-lg font-medium text-emerald-400 mb-2">Device and Technical Data</h3>
            <p>
              We automatically collect device type, browser type, operating system, IP address, and general
              location data to improve our service and ensure security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>To provide, maintain, and improve HabitOS AI services</li>
              <li>To personalize your AI coaching experience and habit recommendations</li>
              <li>To track your habit streaks, progress, and analytics</li>
              <li>To send you notifications, reminders, and service-related communications</li>
              <li>To analyze usage trends and optimize the platform</li>
              <li>To detect, prevent, and address technical issues or abuse</li>
              <li>To comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. Data Sharing and Disclosure</h2>
            <p className="mb-4">
              We do not sell your personal information. We may share data with:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li><strong className="text-white">Service Providers:</strong> Third-party vendors who assist in operating our platform (hosting, analytics, AI processing)</li>
              <li><strong className="text-white">HumanOS Ecosystem:</strong> If you use multiple HumanOS apps, limited data may be shared between them to provide an integrated experience, subject to your consent</li>
              <li><strong className="text-white">Legal Requirements:</strong> When required by law, regulation, or legal process</li>
              <li><strong className="text-white">Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. Data Storage and Security</h2>
            <p>
              Your data is stored on secure servers managed by reputable cloud providers. We implement
              industry-standard security measures including encryption in transit (TLS) and at rest, access
              controls, and regular security audits. However, no method of transmission over the internet is
              100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. Your Rights and Choices</h2>
            <p className="mb-4">Depending on your location, you may have the right to:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>Access, correct, or delete your personal information</li>
              <li>Export your habit data in a portable format</li>
              <li>Opt out of non-essential communications</li>
              <li>Withdraw consent for data processing</li>
              <li>Request restriction of processing</li>
            </ul>
            <p className="mt-4">
              To exercise these rights, contact us at{' '}
              <a href="mailto:hai@eagodi.com" className="text-emerald-400 hover:underline">hai@eagodi.com</a>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">6. Cookies and Tracking</h2>
            <p>
              We use essential cookies to maintain your session and preferences. We may use analytics tools to
              understand usage patterns. You can control cookie preferences through your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">7. Children&apos;s Privacy</h2>
            <p>
              HabitOS AI is not intended for children under 13. We do not knowingly collect personal information
              from children under 13. If we learn that we have collected such information, we will take steps to
              delete it promptly.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">8. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of material changes by
              posting the updated policy on this page and updating the &ldquo;Last updated&rdquo; date. Your
              continued use of HabitOS AI after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">9. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy, please contact us at:
            </p>
            <p className="mt-2">
              <strong className="text-white">PeeTeeAI</strong><br />
              Email:{' '}
              <a href="mailto:hai@eagodi.com" className="text-emerald-400 hover:underline">hai@eagodi.com</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
