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
  Row,
  Column,
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
          {/* Attention-Grabbing Header */}
          <Section style={heroSection}>
            <Img
              src="/logo_higres-min.png"
              width="120"
              height="auto"
              alt="Menttor Logo"
              style={{ margin: '0 auto 20px' }}
            />
            <Heading style={heroTitle}>🚀 Transform Your Learning Journey</Heading>
            <Text style={heroSubtitle}>
              <strong style={freeEmphasis}>100% FREE</strong> • Expert-Curated Roadmaps • Zero Hidden Costs
            </Text>
            <Section style={freeCallout}>
              <Text style={freeText}>
                ✨ <strong>COMPLETELY FREE FOREVER</strong> - No trials, no payments, no catch! ✨
              </Text>
            </Section>
          </Section>

          {/* Hook - Problem/Solution */}
          <Section style={section}>
            <Text style={text}>Hi {recipientName}!</Text>
            <Text style={hookText}>
              Tired of scattered learning resources and not knowing what to study next? 
              <strong> What if you could master any skill with a clear, step-by-step path?</strong>
            </Text>
            <Text style={text}>
              Menttor gives you expert-designed roadmaps for 500+ subjects - from Programming to Business, Science to Languages, and everything in between. 
              <strong style={emphasizedText}>And it's completely FREE!</strong>
            </Text>
          </Section>

          {/* Featured Learning Paths Showcase */}
          <Section style={showcaseSection}>
            <Heading style={showcaseTitle}>🎯 Popular Learning Paths (All FREE!)</Heading>
            
            <Row style={roadmapRow}>
              <Column style={roadmapColumn}>
                <Text style={roadmapEmoji}>🌐</Text>
                <Text style={roadmapTitle}>Web Development</Text>
                <Text style={roadmapDesc}>Frontend, Backend & Full-Stack</Text>
                <Link href="/" style={roadmapLink}>Start Free →</Link>
              </Column>
              <Column style={roadmapColumn}>
                <Text style={roadmapEmoji}>📊</Text>
                <Text style={roadmapTitle}>Data Science</Text>
                <Text style={roadmapDesc}>ML, AI & Analytics</Text>
                <Link href="/" style={roadmapLink}>Start Free →</Link>
              </Column>
            </Row>
            
            <Row style={roadmapRow}>
              <Column style={roadmapColumn}>
                <Text style={roadmapEmoji}>📱</Text>
                <Text style={roadmapTitle}>Mobile Development</Text>
                <Text style={roadmapDesc}>iOS, Android & Cross-Platform</Text>
                <Link href="/" style={roadmapLink}>Start Free →</Link>
              </Column>
              <Column style={roadmapColumn}>
                <Text style={roadmapEmoji}>🚀</Text>
                <Text style={roadmapTitle}>Business Skills</Text>
                <Text style={roadmapDesc}>Entrepreneurship & Management</Text>
                <Link href="/" style={roadmapLink}>Start Free →</Link>
              </Column>
            </Row>

            <Row style={roadmapRow}>
              <Column style={roadmapColumn}>
                <Text style={roadmapEmoji}>🔐</Text>
                <Text style={roadmapTitle}>Cybersecurity</Text>
                <Text style={roadmapDesc}>Ethical Hacking & Protection</Text>
                <Link href="/" style={roadmapLink}>Start Free →</Link>
              </Column>
              <Column style={roadmapColumn}>
                <Text style={roadmapEmoji}>🧪</Text>
                <Text style={roadmapTitle}>Science & Research</Text>
                <Text style={roadmapDesc}>Physics, Chemistry & Biology</Text>
                <Link href="/" style={roadmapLink}>Start Free →</Link>
              </Column>
            </Row>
          </Section>

          {/* Value Proposition */}
          <Section style={benefitsSection}>
            <Heading style={benefitsTitle}>💎 What Makes Menttor Special?</Heading>
            <Text style={benefitItem}>✅ <strong>500+ Expert-Curated Learning Paths</strong></Text>
            <Text style={benefitItem}>✅ <strong>Personalized Learning Progress Tracking</strong></Text>
            <Text style={benefitItem}>✅ <strong>Built-in Flashcards & Practice Sessions</strong></Text>
            <Text style={benefitItem}>✅ <strong>AI-Powered Custom Roadmap Generation</strong></Text>
            <Text style={benefitItem}>✅ <strong>Community of 10,000+ Active Learners</strong></Text>
            <Text style={emphasizedBenefit}>
              🎉 <strong>Everything is 100% FREE - No Premium Plans, No Hidden Costs!</strong>
            </Text>
          </Section>

          {/* Social Proof */}
          <Section style={proofSection}>
            <Text style={proofText}>
              💬 "I went from complete beginner to landing my first developer job in 6 months using Menttor's roadmaps. The structured approach and free resources are incredible!" 
              <br /><em>- Alex Chen, Software Developer</em>
            </Text>
          </Section>

          {/* Urgency CTA */}
          <Section style={ctaSection}>
            <Text style={urgencyText}>🔥 Join 10,000+ learners already accelerating their careers</Text>
            <Button style={buttonPrimary} href="/">
              🚀 Start Learning FREE Now
            </Button>
            <Text style={ctaSubtext}>
              Or <Link href="/" style={link}>create your custom roadmap</Link> • Takes less than 2 minutes
            </Text>
            <Text style={guaranteeText}>
              💯 <strong>FREE FOREVER GUARANTEE</strong> - We'll never charge you for core features
            </Text>
          </Section>

          <Hr style={hr} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Ready to transform your learning journey?<br />
              Team Menttor 🎓<br />
              <Link href="/" style={link}>menttor.live</Link> • Building the future of free education
            </Text>
            <Text style={unsubscribeText}>
              <Link href="#" style={unsubscribeLink}>Unsubscribe</Link> • We respect your inbox
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: '#f1f5f9',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '0',
  maxWidth: '600px',
  borderRadius: '12px',
  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
  overflow: 'hidden',
};

const heroSection = {
  padding: '40px 24px 32px',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  textAlign: 'center' as const,
  color: '#ffffff',
};

const heroTitle = {
  color: '#ffffff',
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '0 0 12px',
  lineHeight: '38px',
};

const heroSubtitle = {
  color: '#e2e8f0',
  fontSize: '18px',
  margin: '0 0 20px',
  lineHeight: '24px',
};

const freeEmphasis = {
  background: 'linear-gradient(45deg, #ffd700, #ff6b35)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  fontSize: '20px',
  fontWeight: 'bold',
};

const freeCallout = {
  backgroundColor: 'rgba(255, 255, 255, 0.15)',
  border: '2px solid rgba(255, 255, 255, 0.3)',
  borderRadius: '25px',
  padding: '12px 20px',
  margin: '0 auto',
  maxWidth: '400px',
};

const freeText = {
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0',
  textAlign: 'center' as const,
};

const section = {
  padding: '24px 24px 0',
};

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '0 0 16px',
};

const hookText = {
  color: '#1f2937',
  fontSize: '18px',
  lineHeight: '28px',
  margin: '0 0 20px',
  fontWeight: '500',
};

const emphasizedText = {
  background: 'linear-gradient(45deg, #3b82f6, #10b981)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  fontWeight: '700',
};

const showcaseSection = {
  padding: '32px 24px',
  backgroundColor: '#f8fafc',
  margin: '32px 0',
};

const showcaseTitle = {
  color: '#1f2937',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0 0 24px',
  textAlign: 'center' as const,
};

const roadmapRow = {
  margin: '0 0 16px',
};

const roadmapColumn = {
  backgroundColor: '#ffffff',
  border: '2px solid #e5e7eb',
  borderRadius: '12px',
  padding: '20px 16px',
  margin: '0 8px 16px',
  textAlign: 'center' as const,
  transition: 'all 0.3s ease',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
};

const roadmapEmoji = {
  fontSize: '32px',
  margin: '0 0 8px',
};

const roadmapTitle = {
  color: '#1f2937',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 4px',
};

const roadmapDesc = {
  color: '#6b7280',
  fontSize: '14px',
  margin: '0 0 12px',
};

const roadmapLink = {
  color: '#3b82f6',
  fontSize: '14px',
  fontWeight: '600',
  textDecoration: 'none',
  border: '2px solid #3b82f6',
  borderRadius: '20px',
  padding: '6px 16px',
  display: 'inline-block',
  transition: 'all 0.3s ease',
};

const benefitsSection = {
  padding: '32px 24px',
  backgroundColor: '#ffffff',
};

const benefitsTitle = {
  color: '#1f2937',
  fontSize: '22px',
  fontWeight: 'bold',
  margin: '0 0 20px',
  textAlign: 'center' as const,
};

const benefitItem = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 12px',
  paddingLeft: '8px',
};

const emphasizedBenefit = {
  color: '#059669',
  fontSize: '18px',
  fontWeight: '600',
  margin: '20px 0 0',
  padding: '16px',
  backgroundColor: '#f0fdf4',
  border: '2px solid #10b981',
  borderRadius: '12px',
  textAlign: 'center' as const,
};

const proofSection = {
  padding: '24px',
  backgroundColor: '#fffbeb',
  border: '2px solid #fbbf24',
  borderRadius: '12px',
  margin: '32px 24px',
};

const proofText = {
  color: '#92400e',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0',
  fontStyle: 'italic',
  textAlign: 'center' as const,
};

const ctaSection = {
  padding: '40px 24px',
  textAlign: 'center' as const,
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: '#ffffff',
};

const urgencyText = {
  color: '#ffffff',
  fontSize: '18px',
  fontWeight: '600',
  margin: '0 0 20px',
};

const buttonPrimary = {
  backgroundColor: '#ffffff',
  color: '#3b82f6',
  borderRadius: '30px',
  fontSize: '18px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '16px 32px',
  margin: '0 0 16px',
  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
  border: '3px solid #ffffff',
  transition: 'all 0.3s ease',
};

const ctaSubtext = {
  color: '#e2e8f0',
  fontSize: '14px',
  margin: '0 0 16px',
};

const guaranteeText = {
  color: '#fbbf24',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0',
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  padding: '12px',
  borderRadius: '8px',
};

const hr = {
  borderColor: '#e5e7eb',
  margin: '0',
};

const footer = {
  padding: '32px 24px',
  backgroundColor: '#f8fafc',
  textAlign: 'center' as const,
};

const footerText = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0 0 12px',
};

const unsubscribeText = {
  margin: '12px 0 0',
};

const unsubscribeLink = {
  color: '#9ca3af',
  fontSize: '12px',
  textDecoration: 'none',
};

const link = {
  color: '#3b82f6',
  textDecoration: 'none',
  fontWeight: '600',
};