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
          {/* Header */}
          <Section style={header}>
            <Img
              src="https://menttor.live/logo_higres-min.png"
              width="120"
              height="auto"
              alt="Menttor Logo"
              style={{ margin: '0 auto 20px' }}
            />
            <Heading style={heading}>Welcome to Menttor!</Heading>
            <Text style={subtitle}>Your smart learning companion</Text>
          </Section>

          {/* Main Message */}
          <Section style={section}>
            <Text style={text}>Hi {userName}!</Text>
            <Text style={text}>
              We're excited to have you join our community of learners. Get started with personalized roadmaps and smart learning tools.
            </Text>
          </Section>

          {/* Simple Features */}
          <Section style={section}>
            <Text style={featureTitle}>What's waiting for you:</Text>
            <Text style={bulletText}>🗺️ 500+ expertly curated learning roadmaps</Text>
            <Text style={bulletText}>🎯 Interactive progress tracking and analytics</Text>
            <Text style={bulletText}>🧠 Practice exercises and smart study tools</Text>
            <Text style={bulletText}>📈 95% learner success rate</Text>
          </Section>

          {/* CTA */}
          <Section style={section}>
            <Button style={buttonPrimary} href="https://menttor.live">
              Start Your Learning Journey
            </Button>
          </Section>

          <Hr style={hr} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Happy learning!<br />
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

const featureTitle = {
  color: '#1f2937',
  fontSize: '18px',
  fontWeight: '600',
  margin: '0 0 12px',
  lineHeight: '24px',
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