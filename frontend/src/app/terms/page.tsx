import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service - Menttor',
  description: 'Read our terms of service and understand your rights and responsibilities when using Menttor\'s AI-powered learning platform.',
  robots: {
    index: true,
    follow: true,
  },
};

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="prose prose-gray dark:prose-invert max-w-none">
          <h1 className="text-3xl font-bold text-black dark:text-white mb-8">Terms of Service</h1>
          
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            <strong>Last Updated:</strong> September 2, 2025
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              By accessing or using Menttor ("the Platform," "our Service") operated by Menttor Labs ("we," "us," or "our"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these terms, you may not access or use our Service.
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              These Terms constitute a legally binding agreement between you and Menttor Labs regarding your use of our AI-powered learning platform available at <a href="https://menttor.live" className="text-blue-600 dark:text-blue-400 hover:underline">https://menttor.live</a>.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">2. Description of Service</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Menttor is an AI-powered educational platform that provides:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4">
              <li>Personalized learning roadmaps generated using artificial intelligence</li>
              <li>Adaptive learning content tailored to individual goals and progress</li>
              <li>Progress tracking and performance analytics</li>
              <li>Behavioral learning systems including gamification and smart nudging</li>
              <li>Content sharing and collaborative learning features</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300">
              Our Service uses Google Vertex AI and other third-party services to generate educational content and enhance your learning experience.
            </p>
          </section>



          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">4. Acceptable Use</h2>
            
            <h3 className="text-xl font-medium text-black dark:text-white mb-3">4.1 Permitted Use</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              You may use our Service for:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4">
              <li>Personal educational purposes and skill development</li>
              <li>Creating and sharing educational content within our community guidelines</li>
              <li>Collaborating with other learners in public roadmaps</li>
              <li>Accessing AI-generated learning materials</li>
            </ul>

            <h3 className="text-xl font-medium text-black dark:text-white mb-3">4.2 Prohibited Activities</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              You agree not to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300">
              <li>Use the Service for any unlawful purpose or to violate any laws</li>
              <li>Share inappropriate, harmful, or offensive content</li>
              <li>Attempt to reverse engineer, hack, or exploit our platform</li>
              <li>Use automated tools to scrape, mine, or extract data from our Service</li>
              <li>Impersonate others or provide false information</li>
              <li>Interfere with the proper functioning of the Service</li>
              <li>Upload malicious code, viruses, or other harmful software</li>
              <li>Violate the intellectual property rights of others</li>
              <li>Use the Service to compete with or create a similar product</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">5. Content and Intellectual Property</h2>
            
            <h3 className="text-xl font-medium text-black dark:text-white mb-3">5.1 Your Content</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              You retain ownership of any content you create, including:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4">
              <li>Custom learning goals and preferences</li>
              <li>Personal notes and annotations</li>
              <li>Shared roadmaps and learning materials you explicitly make public</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              By sharing content publicly, you grant us a non-exclusive, worldwide license to display, distribute, and promote that content within our platform.
            </p>

            <h3 className="text-xl font-medium text-black dark:text-white mb-3">5.2 AI-Generated Content</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Content generated by our AI systems based on your inputs becomes available for your use under these Terms. However, you acknowledge that:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4">
              <li>AI-generated content may not be entirely original</li>
              <li>You should verify AI-generated information for accuracy</li>
              <li>We cannot guarantee the complete accuracy of AI-generated educational content</li>
            </ul>

            <h3 className="text-xl font-medium text-black dark:text-white mb-3">5.3 Our Intellectual Property</h3>
            <p className="text-gray-700 dark:text-gray-300">
              The Menttor platform, including its design, functionality, algorithms, and underlying technology, is owned by Menttor Labs and protected by intellectual property laws. You may not copy, modify, or create derivative works without our written permission.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">6. AI and Machine Learning Services</h2>
            
            <h3 className="text-xl font-medium text-black dark:text-white mb-3">6.1 AI-Powered Features</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Our platform uses artificial intelligence to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4">
              <li>Generate personalized learning roadmaps</li>
              <li>Create adaptive educational content</li>
              <li>Analyze learning patterns and provide insights</li>
              <li>Deliver smart nudges and behavioral interventions</li>
            </ul>

            <h3 className="text-xl font-medium text-black dark:text-white mb-3">6.2 AI Content Disclaimer</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              You acknowledge that:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300">
              <li>AI-generated content is provided for educational purposes only</li>
              <li>Content accuracy may vary and should be independently verified</li>
              <li>We are not responsible for decisions made based solely on AI-generated content</li>
              <li>AI models may have limitations and biases inherent in their training data</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">7. Privacy and Data Protection</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Your privacy is important to us. Our collection, use, and protection of your personal information is governed by our <a href="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline">Privacy Policy</a>, which is incorporated into these Terms by reference.
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              By using our Service, you consent to the data practices described in our Privacy Policy, including the use of your learning data to improve our AI algorithms and provide personalized experiences.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">8. Payment and Subscription Terms</h2>
            
            <h3 className="text-xl font-medium text-black dark:text-white mb-3">8.1 Free Services</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              We currently offer our basic learning features at no cost. These include:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4">
              <li>Basic roadmap creation and learning content</li>
              <li>Basic progress tracking</li>
            </ul>

            <h3 className="text-xl font-medium text-black dark:text-white mb-3">8.2 Premium Features</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Future premium features may include:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4">
              <li>Advanced analytics and performance insights</li>
              <li>Priority AI content generation</li>
              <li>Enhanced collaboration features</li>
            </ul>

            <h3 className="text-xl font-medium text-black dark:text-white mb-3">8.3 Billing and Refunds</h3>
            <p className="text-gray-700 dark:text-gray-300">
              If we introduce paid features, billing terms will be clearly communicated. We will provide reasonable refund policies for any premium services offered.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">9. Service Availability and Modifications</h2>
            
            <h3 className="text-xl font-medium text-black dark:text-white mb-3">9.1 Service Availability</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              We strive to maintain high availability of our Service, but we cannot guarantee uninterrupted access. Our Service may be temporarily unavailable due to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4">
              <li>Scheduled maintenance and updates</li>
              <li>Technical issues or system failures</li>
              <li>Third-party service dependencies (Supabase, Google Vertex AI, etc.)</li>
              <li>Network or infrastructure problems</li>
            </ul>

            <h3 className="text-xl font-medium text-black dark:text-white mb-3">9.2 Service Modifications</h3>
            <p className="text-gray-700 dark:text-gray-300">
              We reserve the right to modify, suspend, or discontinue any aspect of our Service at any time. We will provide reasonable notice for significant changes that materially affect your use of the platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">10. User Conduct and Community Guidelines</h2>
            
            <h3 className="text-xl font-medium text-black dark:text-white mb-3">10.1 Learning Environment</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Menttor is designed to be a positive, inclusive learning environment. When sharing content or interacting with the community, you agree to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4">
              <li>Respect other learners and maintain a supportive atmosphere</li>
              <li>Share accurate and helpful educational content</li>
              <li>Respect intellectual property rights</li>
              <li>Report inappropriate behavior or content</li>
            </ul>

            <h3 className="text-xl font-medium text-black dark:text-white mb-3">10.2 Content Moderation</h3>
            <p className="text-gray-700 dark:text-gray-300">
              We reserve the right to review, modify, or remove any user-generated content that violates these Terms or our community standards. Repeated violations may result in account suspension or termination.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">11. Disclaimers and Educational Use</h2>
            
            <h3 className="text-xl font-medium text-black dark:text-white mb-3">11.1 Educational Purpose</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Our Service is provided for educational and informational purposes only. While we strive for accuracy:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4">
              <li>AI-generated content should be independently verified</li>
              <li>Our platform does not replace formal education or professional training</li>
              <li>Learning outcomes may vary based on individual effort and circumstances</li>
              <li>We do not guarantee specific educational or career results</li>
            </ul>

            <h3 className="text-xl font-medium text-black dark:text-white mb-3">11.2 Third-Party Content</h3>
            <p className="text-gray-700 dark:text-gray-300">
              Our platform may include links to external resources or incorporate third-party educational materials. We are not responsible for the accuracy, availability, or content of external sites or resources.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">12. Limitation of Liability</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, MENTTOR LABS SHALL NOT BE LIABLE FOR:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4">
              <li>ANY INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES</li>
              <li>LOSS OF DATA, PROFITS, OR BUSINESS INTERRUPTION</li>
              <li>DAMAGES ARISING FROM YOUR USE OR INABILITY TO USE THE SERVICE</li>
              <li>INACCURACIES IN AI-GENERATED CONTENT OR LEARNING MATERIALS</li>
              <li>THIRD-PARTY ACTIONS OR SERVICE INTERRUPTIONS</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300">
              OUR TOTAL LIABILITY TO YOU SHALL NOT EXCEED THE AMOUNT YOU PAID FOR THE SERVICE IN THE 12 MONTHS PRECEDING THE CLAIM.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">13. Indemnification</h2>
            <p className="text-gray-700 dark:text-gray-300">
              You agree to indemnify and hold harmless Menttor Labs from any claims, damages, losses, or expenses (including attorney fees) arising from your use of the Service, violation of these Terms, or infringement of any third-party rights.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">14. Termination</h2>
            
            <h3 className="text-xl font-medium text-black dark:text-white mb-3">14.1 Termination by You</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              You may terminate your account at any time by:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4">

              <li>Contacting our support team at <a href="mailto:support@menttor.live" className="text-blue-600 dark:text-blue-400 hover:underline">support@menttor.live</a></li>
            </ul>

            <h3 className="text-xl font-medium text-black dark:text-white mb-3">14.2 Termination by Us</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              We may suspend or terminate your account if you:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4">
              <li>Violate these Terms or our community guidelines</li>
              <li>Engage in fraudulent or abusive behavior</li>
              <li>Use the Service in ways that harm our platform or other users</li>
            </ul>

            <h3 className="text-xl font-medium text-black dark:text-white mb-3">14.3 Effect of Termination</h3>
            <p className="text-gray-700 dark:text-gray-300">
              Upon termination, your access to the Service will cease, and we may delete your account data in accordance with our data retention policies. Publicly shared content may remain available unless you specifically request its removal.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">15. Third-Party Services</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Our Service integrates with third-party providers:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4">

              <li><strong>Google Vertex AI:</strong> AI content generation (Google's AI Terms apply)</li>
              <li><strong>Vercel:</strong> Hosting and analytics services</li>
              <li><strong>Render:</strong> Backend infrastructure services</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300">
              Your use of these integrated services is subject to their respective terms of service and privacy policies.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">16. Dispute Resolution</h2>
            
            <h3 className="text-xl font-medium text-black dark:text-white mb-3">16.1 Informal Resolution</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Before initiating formal proceedings, we encourage you to contact us at <a href="mailto:support@menttor.live" className="text-blue-600 dark:text-blue-400 hover:underline">support@menttor.live</a> to resolve any disputes informally.
            </p>

            <h3 className="text-xl font-medium text-black dark:text-white mb-3">16.2 Governing Law</h3>
            <p className="text-gray-700 dark:text-gray-300">
              These Terms are governed by and construed in accordance with the laws of [Your Jurisdiction], without regard to its conflict of law principles. Any legal action or proceeding shall be brought exclusively in the courts of [Your Jurisdiction].
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">17. Changes to Terms</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              We may revise these Terms from time to time. Material changes will be communicated through:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4">
              <li>Email notification to your registered email address</li>
              <li>Prominent notice on our platform</li>
              <li>Updated "Last Updated" date on this page</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300">
              Your continued use of the Service after changes become effective constitutes acceptance of the revised Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">18. Severability and Entire Agreement</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              If any provision of these Terms is found to be unenforceable, the remaining provisions will continue in full force and effect. These Terms, together with our Privacy Policy, constitute the entire agreement between you and Menttor Labs regarding the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">19. Contact Information</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              For questions about these Terms of Service, please contact us:
            </p>
            <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-800">
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                <strong>Email:</strong> <a href="mailto:legal@menttor.live" className="text-blue-600 dark:text-blue-400 hover:underline">legal@menttor.live</a>
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

          <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-500 text-center">
              By using Menttor, you acknowledge that you have read, understood, and agree to these Terms of Service. Thank you for choosing Menttor for your learning journey.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}