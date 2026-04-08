import * as React from 'react'
import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'

/**
 * Shared props contract for the HabitOS email layout.
 *
 * @property previewText Short preview line shown in inbox list (recommended < 90 chars).
 * @property unsubscribeUrl Fully qualified URL to one-click unsubscribe endpoint.
 * @property children Email body content rendered between header and footer.
 */
export interface EmailLayoutProps {
  previewText: string
  unsubscribeUrl: string
  children: React.ReactNode
}

const fontStack =
  'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'

const styles = {
  body: {
    margin: 0,
    padding: 0,
    backgroundColor: '#fafaf9',
    fontFamily: fontStack,
    color: '#18181b',
    WebkitFontSmoothing: 'antialiased' as const,
  },
  container: {
    maxWidth: '560px',
    margin: '0 auto',
    padding: '32px 16px',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #f4f4f5',
    overflow: 'hidden' as const,
    boxShadow: '0 1px 2px rgba(24, 24, 27, 0.04)',
  },
  header: {
    padding: '28px 32px 0 32px',
  },
  wordmark: {
    margin: 0,
    fontSize: '20px',
    fontWeight: 700,
    letterSpacing: '-0.01em',
    color: '#18181b',
  },
  wordmarkAccent: {
    color: '#f59e0b',
  },
  accentBar: {
    height: '3px',
    width: '48px',
    backgroundColor: '#f59e0b',
    borderRadius: '9999px',
    marginTop: '12px',
    marginBottom: '4px',
    border: 'none',
  },
  body_: {
    padding: '24px 32px 32px 32px',
  },
  footer: {
    padding: '0 16px',
    marginTop: '24px',
    textAlign: 'center' as const,
  },
  footerText: {
    margin: '6px 0',
    fontSize: '12px',
    lineHeight: '18px',
    color: '#71717a',
  },
  footerLink: {
    color: '#71717a',
    textDecoration: 'underline',
  },
}

/**
 * EmailLayout — shared shell used by every HabitOS transactional email.
 *
 * Renders an amber-accented header, a white card for content, and a
 * neutral footer containing the unsubscribe link, copyright and quiet
 * hours disclaimer.
 */
export default function EmailLayout({
  previewText,
  unsubscribeUrl,
  children,
}: EmailLayoutProps) {
  const year = new Date().getFullYear()
  return (
    <Html lang="en">
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.card}>
            <Section style={styles.header}>
              <Text style={styles.wordmark}>
                HabitOS<span style={styles.wordmarkAccent}> AI</span>
              </Text>
              <Hr style={styles.accentBar} />
            </Section>
            <Section style={styles.body_}>{children}</Section>
          </Section>
          <Section style={styles.footer}>
            <Text style={styles.footerText}>
              You&apos;re getting this because you&apos;re building habits with
              HabitOS AI.
            </Text>
            <Text style={styles.footerText}>
              <Link href={unsubscribeUrl} style={styles.footerLink}>
                Unsubscribe
              </Link>
              {' · '}
              We respect your quiet hours — reminders pause overnight.
            </Text>
            <Text style={styles.footerText}>
              © {year} HabitOS AI. Build habits that stick.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
