export const metadata = {
  title: 'Privacy Policy',
  description: 'Learn how CAR collects, uses, and protects your personal information.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-primary-bg py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-12">
          <h1 className="text-display-lg font-semibold text-primary-text mb-4">
            Privacy Policy
          </h1>
          <p className="text-body-sm text-primary-muted">
            Last updated: January 15, 2026
          </p>
        </div>

        <div className="prose prose-lg max-w-none space-y-10 text-primary-text">
          <section>
            <h2 className="text-heading-md font-semibold mb-4">1. Introduction</h2>
            <p className="text-body-sm leading-relaxed">
              CAR ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services. Please read this policy carefully. If you do not agree with the terms of this policy, please do not access the site.
            </p>
          </section>

          <section>
            <h2 className="text-heading-md font-semibold mb-4">2. Information We Collect</h2>
            <p className="text-body-sm leading-relaxed mb-3">
              We may collect information about you in a variety of ways:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-body-sm">
              <li><strong>Personal Data:</strong> Name, email address, phone number, and other contact information you voluntarily provide when creating an account, submitting an enquiry, or booking a test drive.</li>
              <li><strong>Vehicle Preferences:</strong> Information about your vehicle interests, search history, and saved vehicles.</li>
              <li><strong>Usage Data:</strong> Information about how you interact with our website, including pages visited, time spent on pages, and browser type.</li>
              <li><strong>Communication Data:</strong> Any messages, enquiries, or feedback you send through our forms.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-heading-md font-semibold mb-4">3. How We Use Your Information</h2>
            <p className="text-body-sm leading-relaxed mb-3">
              We use the information we collect for the following purposes:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-body-sm">
              <li>To provide and maintain our services</li>
              <li>To process your enquiries and test-drive bookings</li>
              <li>To send you information about vehicles that match your interests</li>
              <li>To respond to your requests and provide customer support</li>
              <li>To improve our website and user experience</li>
              <li>To detect and prevent fraud or abuse of our services</li>
              <li>To comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-heading-md font-semibold mb-4">4. Sharing Your Information</h2>
            <p className="text-body-sm leading-relaxed">
              We do not sell your personal information. We may share information with third parties only in the following circumstances: with your consent, with service providers who assist in operating our website (such as hosting providers and analytics services), when required by law, or to protect our rights and safety. All third-party service providers are bound by confidentiality agreements.
            </p>
          </section>

          <section>
            <h2 className="text-heading-md font-semibold mb-4">5. Data Security</h2>
            <p className="text-body-sm leading-relaxed">
              We implement appropriate technical and organizational security measures to protect your personal information. However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-heading-md font-semibold mb-4">6. Data Retention</h2>
            <p className="text-body-sm leading-relaxed">
              We retain your personal information only for as long as necessary to fulfill the purposes outlined in this policy, unless a longer retention period is required by law. When we no longer need your data, we will securely delete or anonymize it.
            </p>
          </section>

          <section>
            <h2 className="text-heading-md font-semibold mb-4">7. Your Rights</h2>
            <p className="text-body-sm leading-relaxed mb-3">
              Depending on your location, you may have the following rights regarding your personal data:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-body-sm">
              <li>The right to access the personal information we hold about you</li>
              <li>The right to request correction of inaccurate information</li>
              <li>The right to request deletion of your information</li>
              <li>The right to object to or restrict processing of your data</li>
              <li>The right to data portability</li>
              <li>The right to withdraw consent at any time</li>
            </ul>
            <p className="text-body-sm leading-relaxed mt-3">
              To exercise any of these rights, please contact us using the information provided below.
            </p>
          </section>

          <section>
            <h2 className="text-heading-md font-semibold mb-4">8. Cookies</h2>
            <p className="text-body-sm leading-relaxed">
              We use cookies and similar tracking technologies to track activity on our website and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our website.
            </p>
          </section>

          <section>
            <h2 className="text-heading-md font-semibold mb-4">9. Children's Privacy</h2>
            <p className="text-body-sm leading-relaxed">
              Our services are not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If we become aware that we have collected personal data from a child without parental consent, we will take steps to delete that information.
            </p>
          </section>

          <section>
            <h2 className="text-heading-md font-semibold mb-4">10. Changes to This Policy</h2>
            <p className="text-body-sm leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date. You are advised to review this policy periodically for any changes.
            </p>
          </section>

          <section>
            <h2 className="text-heading-md font-semibold mb-4">11. Contact Us</h2>
            <p className="text-body-sm leading-relaxed">
              If you have any questions about this Privacy Policy or our data practices, please contact us at{' '}
              <a href="mailto:privacy@trycar.com" className="text-primary-accent hover:underline">
                privacy@trycar.com
              </a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
