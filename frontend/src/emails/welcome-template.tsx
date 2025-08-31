import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Row,
  Column,
  Heading,
  Text,
  Link,
  Button,
  Img,
  Hr,
} from '@react-email/components';

interface WelcomeEmailProps {
  userName?: string;
}

export default function WelcomeEmail({ userName = "there" }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          {/* Header with Logo */}
          <Section style={header}>
            <Row>
              <Column>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '16px' }}>
                  <Text style={welcomeText}>Welcome to</Text>
                  <Img
                    src="https://menttor.live/logo_higres-min.png"
                    width="140"
                    height="auto"
                    alt="Menttor Logo"
                    style={logoInline}
                  />
                </div>
                <Text style={subtitle}>Your smart learning companion</Text>
              </Column>
            </Row>
          </Section>

          {/* Welcome Message */}
          <Section style={section}>
            <Text style={text}>
              Hi {userName}!
            </Text>
            <Text style={text}>
              We're excited to have you join our community of learners. Menttor is designed to accelerate your learning with personalized roadmaps and smart tools.
            </Text>
          </Section>

          {/* Features Grid */}
          <Section style={section}>
            <Row>
              <Column style={featureColumn}>
                <Text style={featureTitle}>🗺️ 500+ Curated Roadmaps</Text>
                <Text style={featureText}>
                  Expertly crafted learning paths across programming, business, science, and more.
                </Text>
                <Button style={buttonSecondary} href="https://menttor.live/explore">
                  Explore Roadmaps
                </Button>
              </Column>
              <Column style={featureColumn}>
                <Text style={featureTitle}>🎯 Your Learning Journey</Text>
                <Text style={featureText}>
                  Interactive visualization, practice exercises, and performance analytics.
                </Text>
                <Button style={buttonSecondary} href="https://menttor.live/journey">
                  Start Journey
                </Button>
              </Column>
            </Row>
          </Section>

          {/* Key Features */}
          <Section style={section}>
            <Text style={featureTitle}>✨ Tools You'll Love</Text>
            <Text style={bulletText}>• Flashcards & Mind Maps for active learning</Text>
            <Text style={bulletText}>• Smart Timetables & PDF exports</Text>
            <Text style={bulletText}>• Practice sessions tailored to your progress</Text>
            <Text style={bulletText}>• Behavioral insights & milestone rewards</Text>
            <Text style={bulletText}>• 95% learner success rate</Text>
          </Section>

          {/* CTA */}
          <Section style={section}>
            <Button style={buttonPrimary} href="https://menttor.live/dashboard">
              Start Learning Now
            </Button>
          </Section>

          <Hr style={hr} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Best regards,<br />
              Sankalp from Menttor<br />
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

const welcomeText = {
  color: '#1f2937',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0',
  lineHeight: '32px',
};

const logoInline = {
  display: 'inline-block',
  verticalAlign: 'middle',
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

const featureColumn = {
  width: '50%',
  padding: '0 12px',
  verticalAlign: 'top' as const,
};

const featureTitle = {
  color: '#1f2937',
  fontSize: '18px',
  fontWeight: '600',
  margin: '0 0 8px',
  lineHeight: '24px',
};

const featureText = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0 0 16px',
};

const bulletText = {
  color: '#374151',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0 0 8px',
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
  padding: '12px 24px',
  margin: '16px 0',
};

const buttonSecondary = {
  backgroundColor: '#f3f4f6',
  borderRadius: '6px',
  color: '#374151',
  fontSize: '14px',
  fontWeight: '500',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '8px 16px',
  border: '1px solid #d1d5db',
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