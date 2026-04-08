import * as React from 'react'
import {
  Button,
  Column,
  Heading,
  Img,
  Row,
  Section,
  Text,
} from '@react-email/components'
import EmailLayout from './_layout'

/**
 * Props for the "we miss you" / streak recovery email.
 *
 * @property userName Recipient's first name.
 * @property coachName Coach persona name.
 * @property coachAvatarUrl Coach avatar URL.
 * @property hoursSinceLastCheckin Whole hours since the user's last activity.
 * @property planTitle Human-readable plan title.
 * @property planId CoachingPlan id used in the deep link.
 * @property baseUrl Absolute origin (no trailing slash) for building links.
 * @property unsubscribeUrl Fully qualified one-click unsubscribe URL.
 */
export interface MissedStreakProps {
  userName: string
  coachName: string
  coachAvatarUrl: string
  hoursSinceLastCheckin: number
  planTitle: string
  planId: string
  baseUrl: string
  unsubscribeUrl: string
}

const styles = {
  heroRow: {
    marginBottom: '20px',
  },
  avatarCell: {
    width: '64px',
    verticalAlign: 'middle' as const,
  },
  avatar: {
    width: '56px',
    height: '56px',
    borderRadius: '9999px',
    border: '2px solid #fbbf24',
    display: 'block' as const,
  },
  greetingCell: {
    verticalAlign: 'middle' as const,
    paddingLeft: '14px',
  },
  greetingLabel: {
    margin: 0,
    fontSize: '12px',
    color: '#71717a',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
  },
  greeting: {
    margin: '4px 0 0 0',
    fontSize: '18px',
    fontWeight: 600,
    color: '#18181b',
  },
  heading: {
    margin: '8px 0 12px 0',
    fontSize: '24px',
    lineHeight: '32px',
    fontWeight: 600,
    color: '#18181b',
    letterSpacing: '-0.01em',
  },
  body: {
    margin: '0 0 16px 0',
    fontSize: '15px',
    lineHeight: '24px',
    color: '#3f3f46',
  },
  reframeCallout: {
    backgroundColor: '#fffbeb',
    border: '1px solid #fde68a',
    borderRadius: '12px',
    padding: '16px 18px',
    margin: '4px 0 24px 0',
  },
  reframeText: {
    margin: 0,
    fontSize: '15px',
    lineHeight: '22px',
    color: '#18181b',
  },
  ctaWrap: {
    textAlign: 'center' as const,
    margin: '8px 0 0 0',
  },
  cta: {
    backgroundColor: '#f59e0b',
    color: '#18181b',
    padding: '14px 28px',
    borderRadius: '9999px',
    fontWeight: 600,
    fontSize: '15px',
    textDecoration: 'none',
    display: 'inline-block' as const,
  },
}

/**
 * MissedStreak — warm, non-judgmental nudge after a quiet stretch.
 */
export default function MissedStreak({
  userName,
  coachName,
  coachAvatarUrl,
  hoursSinceLastCheckin,
  planTitle,
  planId,
  baseUrl,
  unsubscribeUrl,
}: MissedStreakProps) {
  const ctaHref = `${baseUrl}/plan/${planId}?resume=true`
  const previewText = `${userName}, no guilt. Just a soft door back into ${planTitle}.`
  const dayPhrase =
    hoursSinceLastCheckin >= 48
      ? `${Math.round(hoursSinceLastCheckin / 24)} days`
      : `${hoursSinceLastCheckin} hours`

  return (
    <EmailLayout previewText={previewText} unsubscribeUrl={unsubscribeUrl}>
      <Row style={styles.heroRow}>
        <Column style={styles.avatarCell}>
          <Img
            src={coachAvatarUrl}
            alt={`${coachName} avatar`}
            width={56}
            height={56}
            style={styles.avatar}
          />
        </Column>
        <Column style={styles.greetingCell}>
          <Text style={styles.greetingLabel}>A soft hello</Text>
          <Text style={styles.greeting}>Hey {userName},</Text>
        </Column>
      </Row>

      <Heading as="h1" style={styles.heading}>
        It&apos;s been about {dayPhrase}.
      </Heading>
      <Text style={styles.body}>
        No judgment, no guilt — just {coachName} checking in on {planTitle}.
        Life happens. Real change isn&apos;t linear, and missing a day
        doesn&apos;t erase the work you&apos;ve already put in.
      </Text>

      <Section style={styles.reframeCallout}>
        <Text style={styles.reframeText}>
          Every successful person you&apos;ve ever admired has missed days.
          What separated them wasn&apos;t perfect attendance — it was deciding,
          again, to come back. That&apos;s all today is asking.
        </Text>
      </Section>

      <Text style={styles.body}>
        When you&apos;re ready, the smallest possible step counts. Two minutes
        is a full session in our book.
      </Text>

      <Section style={styles.ctaWrap}>
        <Button href={ctaHref} style={styles.cta}>
          I&apos;m back
        </Button>
      </Section>
    </EmailLayout>
  )
}
