import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Heading,
  Text,
  Link,
  Button,
  Img,
  Hr,
} from '@react-email/components';

interface PromotionalEmailProps {
  recipientName?: string;
}

export default function PromotionalEmail({ recipientName = "there" }: PromotionalEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Img
              src="https://menttor.live/logo_higres-min.png"
              width="100"
              height="auto"
              alt="Menttor Logo"
              style={{ margin: '0 auto 16px' }}
            />
            <Heading style={heading}>Your Learning Resources Are Ready</Heading>
            <Text style={subtitle}>Personalized roadmaps to help you learn more effectively</Text>
          </Section>

          {/* Main Message */}
          <Section style={section}>
            <Text style={text}>Hi {recipientName}!</Text>
            <Text style={text}>
              I wanted to share something that might help with your learning goals. 
              Menttor provides structured roadmaps that can guide you through complex topics step by step.
            </Text>
          </Section>

          {/* Key Benefits */}
          <Section style={section}>
            <Text style={benefitsTitle}>What you'll find helpful:</Text>
            <Text style={bulletText}>• <strong>Curated Learning Paths</strong> - Structured roadmaps for programming, business, and science topics</Text>
            <Text style={bulletText}>• <strong>Progress Tracking</strong> - See where you are in your learning journey</Text>
            <Text style={bulletText}>• <strong>Study Tools</strong> - Flashcards and practice sessions to reinforce learning</Text>
            <Text style={bulletText}>• <strong>Focus on Learning</strong> - Spend time studying, not planning what to study next</Text>
          </Section>

          {/* Social Proof */}
          <Section style={proofSection}>
            <Text style={proofText}>
              "The roadmaps helped me stay organized and focused on what to learn next. Really useful for breaking down complex topics." 
              <br /><em>- Sarah, Software Engineer</em>
            </Text>
          </Section>

          {/* CTA */}
          <Section style={ctaSection}>
            <Button style={buttonPrimary} href="https://menttor.live/explore">
              Explore Learning Paths
            </Button>
            <Text style={ctaSubtext}>
              Free to browse and get started
            </Text>
          </Section>

          <Hr style={hr} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Hope this helps with your learning journey.<br />
              Sankalp, Founder of Menttor<br />
              <Link href="https://menttor.live" style={link}>menttor.live</Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const header = {
  padding: '32px 24px',
  backgroundColor: '#ffffff',
  textAlign: 'center' as const,
};

const heading = {
  color: '#1f2937',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0 0 8px',
  lineHeight: '32px',
};

const subtitle = {
  color: '#6b7280',
  fontSize: '16px',
  margin: '0',
};

const section = {
  padding: '0 24px 24px',
};

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 16px',
};

const benefitsTitle = {
  color: '#1f2937',
  fontSize: '18px',
  fontWeight: '600',
  margin: '0 0 16px',
  lineHeight: '24px',
};

const bulletText = {
  color: '#374151',
  fontSize: '15px',
  lineHeight: '22px',
  margin: '0 0 10px',
};

const proofSection = {
  padding: '20px 24px',
  backgroundColor: '#f8fafc',
  borderLeft: '4px solid #3b82f6',
  margin: '0 24px 24px',
};

const proofText = {
  color: '#475569',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0',
  fontStyle: 'italic',
};

const ctaSection = {
  padding: '0 24px 24px',
  textAlign: 'center' as const,
};

const buttonPrimary = {
  backgroundColor: '#3b82f6',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 28px',
  margin: '0 0 12px',
};

const ctaSubtext = {
  color: '#6b7280',
  fontSize: '12px',
  margin: '0',
};

const hr = {
  borderColor: '#e5e7eb',
  margin: '32px 0',
};

const footer = {
  padding: '0 24px',
};

const footerText = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0',
};

const link = {
  color: '#3b82f6',
  textDecoration: 'none',
};