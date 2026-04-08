import * as React from 'react'
import {
  Button,
  Column,
  Heading,
  Hr,
  Img,
  Row,
  Section,
  Text,
} from '@react-email/components'
import EmailLayout from './_layout'

/**
 * Props for the daily habit reminder email.
 *
 * @property userName Recipient's first name (or fallback display name).
 * @property coachName Selected coach persona name (e.g. "Alex").
 * @property coachAvatarUrl DiceBear (or other) avatar URL for the coach.
 * @property habitTitle The habit being nudged (e.g. "10-minute morning walk").
 * @property habitCue Implementation-intention cue (e.g. "After my morning coffee").
 * @property habitReward Intrinsic reward to surface ("Energy + clear head").
 * @property planId CoachingPlan id used in the deep link.
 * @property habitId Habit id used as the focus query param.
 * @property baseUrl Absolute origin (no trailing slash) for building links.
 * @property unsubscribeUrl Fully qualified one-click unsubscribe URL.
 */
export interface DailyHabitReminderProps {
  userName: string
  coachName: string
  coachAvatarUrl: string
  habitTitle: string
  habitCue: string
  habitReward: string
  planId: string
  habitId: string
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
  intro: {
    margin: '0 0 20px 0',
    fontSize: '15px',
    lineHeight: '24px',
    color: '#3f3f46',
  },
  callout: {
    backgroundColor: '#fffbeb',
    border: '1px solid #fde68a',
    borderRadius: '12px',
    padding: '16px 18px',
    margin: '0 0 20px 0',
  },
  calloutLabel: {
    margin: 0,
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    color: '#b45309',
  },
  calloutText: {
    margin: '4px 0 0 0',
    fontSize: '15px',
    lineHeight: '22px',
    color: '#18181b',
  },
  ctaWrap: {
    textAlign: 'center' as const,
    margin: '8px 0 24px 0',
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
  divider: {
    borderColor: '#f4f4f5',
    margin: '24px 0 16px 0',
  },
  research: {
    margin: 0,
    fontSize: '12px',
    lineHeight: '18px',
    color: '#71717a',
    fontStyle: 'italic' as const,
  },
}

/**
 * DailyHabitReminder — gentle daily nudge anchored on cue + reward.
 */
export default function DailyHabitReminder({
  userName,
  coachName,
  coachAvatarUrl,
  habitTitle,
  habitCue,
  habitReward,
  planId,
  habitId,
  baseUrl,
  unsubscribeUrl,
}: DailyHabitReminderProps) {
  const ctaHref = `${baseUrl}/plan/${planId}?focus=${habitId}`
  const previewText = `${habitTitle} — ${coachName} is cheering you on.`

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
          <Text style={styles.greetingLabel}>A note from {coachName}</Text>
          <Text style={styles.greeting}>Hey {userName},</Text>
        </Column>
      </Row>

      <Heading as="h1" style={styles.heading}>
        Time for {habitTitle}.
      </Heading>

      <Text style={styles.intro}>
        Tiny actions, repeated, become identity. You don&apos;t have to be
        perfect — you just have to show up. Two minutes counts.
      </Text>

      <Section style={styles.callout}>
        <Text style={styles.calloutLabel}>Your cue</Text>
        <Text style={styles.calloutText}>{habitCue}</Text>
      </Section>

      <Section style={styles.callout}>
        <Text style={styles.calloutLabel}>Why it matters</Text>
        <Text style={styles.calloutText}>{habitReward}</Text>
      </Section>

      <Section style={styles.ctaWrap}>
        <Button href={ctaHref} style={styles.cta}>
          I&apos;m doing it now
        </Button>
      </Section>

      <Hr style={styles.divider} />
      <Text style={styles.research}>
        Research note — James Clear, Atomic Habits: small habits compound. A 1%
        daily improvement is ~37x better after a year.
      </Text>
    </EmailLayout>
  )
}
