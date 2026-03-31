import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service - HabitOS AI',
  description: 'Terms of Service for HabitOS AI, a product of PeeTeeAI.',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h1 className="text-4xl font-bold text-white mb-2">Terms of Service</h1>
        <p className="text-gray-500 mb-12">Last updated: March 30, 2026</p>

        <div className="space-y-10 text-gray-300 leading-relaxed">
          <section>
            <p>
              HabitOS AI is a product of <strong className="text-white">PeeTeeAI</strong>. These Terms of
              Service (&ldquo;Terms&rdquo;) govern your access to and use of the HabitOS AI application,
              website, and related services (collectively, the &ldquo;Service&rdquo;). By accessing or using
              the Service, you agree to be bound by these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
            <p>
              By creating an account or using HabitOS AI, you agree to these Terms and our Privacy Policy. If
              you do not agree to these Terms, do not use the Service. We reserve the right to modify these
              Terms at any time. Continued use after modifications constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. Description of Service</h2>
            <p>
              HabitOS AI provides an AI-powered habit tracking platform that includes habit logging, streak
              tracking, progress analytics, personalized AI coaching, and integration with the HumanOS ecosystem
              of applications. Features may vary based on your subscription plan.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. User Accounts</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>You must provide accurate and complete information when creating an account</li>
              <li>You are responsible for maintaining the security of your account credentials</li>
              <li>You must notify us immediately of any unauthorized access to your account</li>
              <li>You are responsible for all activities that occur under your account</li>
              <li>You must be at least 13 years old to use the Service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. Acceptable Use</h2>
            <p className="mb-4">You agree not to:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>Use the Service for any unlawful purpose or in violation of any applicable laws</li>
              <li>Attempt to gain unauthorized access to any part of the Service</li>
              <li>Interfere with or disrupt the Service or its infrastructure</li>
              <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
              <li>Use automated systems to access the Service without our written permission</li>
              <li>Transmit malicious code, viruses, or harmful data through the Service</li>
              <li>Impersonate any person or entity or misrepresent your affiliation</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. Intellectual Property</h2>
            <p>
              The Service, including its design, features, content, and underlying technology, is owned by
              PeeTeeAI and is protected by intellectual property laws. You retain ownership of any habit data
              and content you create within the Service. By using the Service, you grant PeeTeeAI a limited
              license to use your data solely to provide and improve the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">6. AI Coaching Disclaimer</h2>
            <p>
              The AI coaching features in HabitOS AI provide general guidance and suggestions for habit
              building and behavior change. This is not professional medical, psychological, or therapeutic
              advice. Always consult qualified professionals for health-related decisions. PeeTeeAI is not
              liable for any actions taken based on AI coaching suggestions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">7. Subscription and Payments</h2>
            <p>
              Certain features of HabitOS AI may require a paid subscription. Subscription terms, pricing, and
              billing cycles will be presented to you before purchase. You may cancel your subscription at any
              time. Refunds are handled in accordance with our refund policy. PeeTeeAI reserves the right to
              modify pricing with reasonable notice.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">8. Termination</h2>
            <p>
              We may suspend or terminate your access to the Service at any time for violation of these Terms
              or for any other reason at our discretion. Upon termination, your right to use the Service ceases
              immediately. You may request export of your data before account deletion.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">9. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, PeeTeeAI shall not be liable for any indirect,
              incidental, special, consequential, or punitive damages, including loss of data, profits, or
              goodwill, arising from your use of the Service. Our total liability shall not exceed the amount
              you paid to us in the twelve months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">10. Disclaimer of Warranties</h2>
            <p>
              The Service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties
              of any kind, either express or implied, including but not limited to implied warranties of
              merchantability, fitness for a particular purpose, and non-infringement.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">11. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with applicable laws, without regard
              to conflict of law principles.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">12. Contact</h2>
            <p>
              For questions about these Terms of Service, please contact us at:
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
