import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy - Menttor',
  description: 'Learn how Menttor collects, uses, and protects your personal information. Read our comprehensive privacy policy.',
  robots: {
    index: true,
    follow: true,
  },
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="prose prose-gray dark:prose-invert max-w-none">
          <h1 className="text-3xl font-bold text-black dark:text-white mb-8">Privacy Policy</h1>
          
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            <strong>Last Updated:</strong> September 2, 2025
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">1. Introduction</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Welcome to Menttor Labs ("we," "our," or "us"). We are committed to protecting your privacy and ensuring you have a positive experience on our platform. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered learning platform at <a href="https://menttor.live" className="text-blue-600 dark:text-blue-400 hover:underline">https://menttor.live</a> and related services.
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              By using our services, you agree to the collection and use of information in accordance with this policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">2. Information We Collect</h2>
            
            <h3 className="text-xl font-medium text-black dark:text-white mb-3">2.1 Personal Information</h3>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4">
              <li>Email address (for account creation and communication)</li>
              <li>Display name (optional, for personalization)</li>
              <li>Authentication credentials (managed securely through Firebase)</li>
              <li>Phone number (if you choose phone authentication)</li>
            </ul>

            <h3 className="text-xl font-medium text-black dark:text-white mb-3">2.2 Learning Data</h3>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4">
              <li>Learning roadmaps you create or adopt</li>
              <li>Progress through courses, modules, and subtopics</li>
              <li>Quiz attempts, scores, and performance metrics</li>
              <li>Practice session data and question responses</li>
              <li>Time spent on learning activities</li>
              <li>Learning preferences and goals</li>
            </ul>

            <h3 className="text-xl font-medium text-black dark:text-white mb-3">2.3 Behavioral and Analytics Data</h3>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4">
              <li>Session duration and activity patterns</li>
              <li>Page views and navigation patterns</li>
              <li>Feature usage and interaction data</li>
              <li>Learning streaks and gamification metrics (XP, levels)</li>
              <li>Device and browser information</li>
              <li>IP address (anonymized for analytics)</li>
            </ul>

            <h3 className="text-xl font-medium text-black dark:text-white mb-3">2.4 Content Data</h3>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300">
              <li>AI-generated learning content you create or save</li>
              <li>Shared learning materials and public content</li>
              <li>Custom practice sessions and configurations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300">
              <li><strong>Personalization:</strong> Create customized learning experiences and recommendations</li>
              <li><strong>Progress Tracking:</strong> Monitor and display your learning progress and achievements</li>
              <li><strong>Content Generation:</strong> Use AI to create relevant learning materials based on your goals</li>
              <li><strong>Platform Improvement:</strong> Analyze usage patterns to enhance our services</li>
              <li><strong>Communication:</strong> Send important updates about your account or our services</li>
              <li><strong>Security:</strong> Detect and prevent fraud, abuse, and security issues</li>
              <li><strong>Legal Compliance:</strong> Meet our legal obligations and enforce our terms</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">4. Information Sharing and Disclosure</h2>
            
            <h3 className="text-xl font-medium text-black dark:text-white mb-3">4.1 Third-Party Services</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              We work with trusted third-party services to provide our platform:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4">
              <li><strong>Firebase (Google):</strong> Authentication and user management</li>
              <li><strong>Google Vertex AI:</strong> AI content generation (data is processed securely)</li>
              <li><strong>Vercel Analytics:</strong> Website performance and usage analytics</li>
              <li><strong>Google Analytics:</strong> Anonymized usage statistics</li>
            </ul>

            <h3 className="text-xl font-medium text-black dark:text-white mb-3">4.2 Data Protection</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              We do not sell, trade, or rent your personal information to third parties. We only share data when:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300">
              <li>Required by law or legal process</li>
              <li>Necessary to protect our rights or safety</li>
              <li>You explicitly consent to sharing</li>
              <li>For processing by trusted service providers under strict data protection agreements</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">5. Data Security</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              We implement industry-standard security measures to protect your information:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300">
              <li>Encrypted data transmission (HTTPS/TLS)</li>
              <li>Secure database storage with access controls</li>
              <li>Regular security updates and monitoring</li>
              <li>Firebase's enterprise-grade authentication security</li>
              <li>Input validation and sanitization</li>
              <li>Regular security audits and vulnerability assessments</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">6. Cookies and Tracking</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              We use cookies and similar technologies to enhance your experience:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4">
              <li><strong>Essential Cookies:</strong> Required for authentication and core functionality</li>
              <li><strong>Analytics Cookies:</strong> Help us understand how you use our platform</li>
              <li><strong>Preference Cookies:</strong> Remember your theme and interface preferences</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300">
              You can control cookies through your browser settings, though disabling essential cookies may limit platform functionality.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">7. Your Rights and Choices</h2>
            
            <h3 className="text-xl font-medium text-black dark:text-white mb-3">7.1 Data Rights</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Depending on your location, you may have the right to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Rectification:</strong> Correct inaccurate or incomplete information</li>
              <li><strong>Erasure:</strong> Request deletion of your personal data</li>
              <li><strong>Portability:</strong> Receive your data in a machine-readable format</li>
              <li><strong>Restriction:</strong> Limit how we process your data</li>
              <li><strong>Objection:</strong> Object to certain types of data processing</li>
            </ul>

            <h3 className="text-xl font-medium text-black dark:text-white mb-3">7.2 Account Controls</h3>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300">
              <li>Update your profile and preferences in your account settings</li>
              <li>Control sharing of your learning content</li>
              <li>Manage notification preferences</li>
              <li>Delete your account and associated data</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">8. Data Retention</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              We retain your information for as long as necessary to provide our services and fulfill the purposes outlined in this policy:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300">
              <li><strong>Account Data:</strong> Until you delete your account or request deletion</li>
              <li><strong>Learning Progress:</strong> Maintained to preserve your educational journey</li>
              <li><strong>Analytics Data:</strong> Aggregated and anonymized data may be retained longer for platform improvement</li>
              <li><strong>Legal Requirements:</strong> Some data may be retained to comply with legal obligations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">9. Children's Privacy</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Our service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately.
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              For users between 13-18, we recommend parental guidance when using our platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">10. International Data Transfers</h2>
            <p className="text-gray-700 dark:text-gray-300">
              Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your data in accordance with this privacy policy and applicable laws, including GDPR adequacy decisions and standard contractual clauses.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">11. Changes to This Privacy Policy</h2>
            <p className="text-gray-700 dark:text-gray-300">
              We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. Your continued use of our services after such modifications constitutes acceptance of the updated Privacy Policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">12. Contact Us</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-800">
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                <strong>Email:</strong> <a href="mailto:privacy@menttor.live" className="text-blue-600 dark:text-blue-400 hover:underline">privacy@menttor.live</a>
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                <strong>Support:</strong> <a href="mailto:support@menttor.live" className="text-blue-600 dark:text-blue-400 hover:underline">support@menttor.live</a>
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <strong>Company:</strong> Menttor Labs<br />
                <strong>Website:</strong> <a href="https://menttor.live" className="text-blue-600 dark:text-blue-400 hover:underline">https://menttor.live</a>
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">13. Specific Data Practices</h2>
            
            <h3 className="text-xl font-medium text-black dark:text-white mb-3">13.1 AI Content Generation</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              When you create learning roadmaps or practice sessions, we use Google Vertex AI to generate personalized educational content. Your learning goals and preferences are processed to create relevant materials, but this data is not stored by Google beyond the processing period.
            </p>

            <h3 className="text-xl font-medium text-black dark:text-white mb-3">13.2 Behavioral Learning System</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              We track your learning behavior to optimize your educational experience, including:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4">
              <li>Learning streaks and consistency patterns</li>
              <li>Optimal learning time windows</li>
              <li>Focus session tracking</li>
              <li>XP and gamification progress</li>
              <li>Concept mastery levels (ELO ratings)</li>
            </ul>

            <h3 className="text-xl font-medium text-black dark:text-white mb-3">13.3 Shared Content</h3>
            <p className="text-gray-700 dark:text-gray-300">
              If you choose to share learning content publicly, that content becomes available to other users. You can control the privacy settings of your content and revoke public access at any time.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">14. Legal Basis for Processing (GDPR)</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              For users in the European Economic Area, our legal basis for processing personal data includes:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300">
              <li><strong>Consent:</strong> When you agree to specific processing activities</li>
              <li><strong>Contract Performance:</strong> To provide our educational services</li>
              <li><strong>Legitimate Interest:</strong> To improve our platform and provide better learning experiences</li>
              <li><strong>Legal Obligation:</strong> To comply with applicable laws and regulations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">15. California Privacy Rights (CCPA)</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              California residents have additional rights under the California Consumer Privacy Act:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300">
              <li>Right to know what personal information is collected</li>
              <li>Right to delete personal information</li>
              <li>Right to opt-out of the sale of personal information (we do not sell personal information)</li>
              <li>Right to non-discrimination for exercising privacy rights</li>
            </ul>
          </section>

          <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-500 text-center">
              This privacy policy is designed to be transparent about our data practices while ensuring compliance with international privacy laws. If you have questions about any section, please don't hesitate to contact us.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}