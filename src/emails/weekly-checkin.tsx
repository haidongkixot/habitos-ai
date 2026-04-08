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
 * Props for the weekly check-in email.
 *
 * @property userName Recipient's first name.
 * @property coachName Coach persona name.
 * @property coachAvatarUrl Coach avatar URL.
 * @property planTitle Human-readable plan title (e.g. "Run a 5K in 8 weeks").
 * @property planId CoachingPlan id used in the deep link.
 * @property weeklyCheckinPrompt Coach-authored reflection prompt.
 * @property momentumScore 0-100 momentum score for the week.
 * @property completionPercent 0-100 percent of habits completed this week.
 * @property streakDays Current streak in days.
 * @property baseUrl Absolute origin (no trailing slash) for building links.
 * @property unsubscribeUrl Fully qualified one-click unsubscribe URL.
 */
export interface WeeklyCheckinProps {
  userName: string
  coachName: string
  coachAvatarUrl: string
  planTitle: string
  planId: string
  weeklyCheckinPrompt: string
  momentumScore: number
  completionPercent: number
  streakDays: number
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
    margin: '8px 0 8px 0',
    fontSize: '24px',
    lineHeight: '32px',
    fontWeight: 600,
    color: '#18181b',
    letterSpacing: '-0.01em',
  },
  subhead: {
    margin: '0 0 20px 0',
    fontSize: '15px',
    lineHeight: '22px',
    color: '#52525b',
  },
  metricsTable: {
    marginBottom: '24px',
  },
  metricCell: {
    backgroundColor: '#fafaf9',
    border: '1px solid #f4f4f5',
    borderRadius: '12px',
    padding: '14px 8px',
    textAlign: 'center' as const,
    width: '33%',
  },
  metricCellSpacer: {
    width: '8px',
  },
  metricValue: {
    margin: 0,
    fontSize: '24px',
    fontWeight: 700,
    color: '#f59e0b',
    lineHeight: '28px',
  },
  metricLabel: {
    margin: '4px 0 0 0',
    fontSize: '11px',
    color: '#71717a',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
  },
  promptCallout: {
    backgroundColor: '#fffbeb',
    border: '1px solid #fde68a',
    borderRadius: '12px',
    padding: '18px 20px',
    margin: '0 0 24px 0',
  },
  promptLabel: {
    margin: 0,
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    color: '#b45309',
  },
  promptText: {
    margin: '6px 0 0 0',
    fontSize: '16px',
    lineHeight: '24px',
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
 * WeeklyCheckin — Sunday-style reflection prompt with momentum metrics.
 */
export default function WeeklyCheckin({
  userName,
  coachName,
  coachAvatarUrl,
  planTitle,
  planId,
  weeklyCheckinPrompt,
  momentumScore,
  completionPercent,
  streakDays,
  baseUrl,
  unsubscribeUrl,
}: WeeklyCheckinProps) {
  const ctaHref = `${baseUrl}/plan/${planId}?checkin=weekly`
  const previewText = `Your week with ${planTitle} — let's reflect together.`

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
          <Text style={styles.greetingLabel}>Weekly check-in</Text>
          <Text style={styles.greeting}>Hey {userName},</Text>
        </Column>
      </Row>

      <Heading as="h1" style={styles.heading}>
        Your week on {planTitle}.
      </Heading>
      <Text style={styles.subhead}>
        {coachName} here. Let&apos;s zoom out together — momentum is built one
        honest reflection at a time.
      </Text>

      <Row style={styles.metricsTable}>
        <Column style={styles.metricCell}>
          <Text style={styles.metricValue}>{momentumScore}</Text>
          <Text style={styles.metricLabel}>Momentum</Text>
        </Column>
        <Column style={styles.metricCellSpacer}>&nbsp;</Column>
        <Column style={styles.metricCell}>
          <Text style={styles.metricValue}>{completionPercent}%</Text>
          <Text style={styles.metricLabel}>Completion</Text>
        </Column>
        <Column style={styles.metricCellSpacer}>&nbsp;</Column>
        <Column style={styles.metricCell}>
          <Text style={styles.metricValue}>{streakDays}d</Text>
          <Text style={styles.metricLabel}>Streak</Text>
        </Column>
      </Row>

      <Section style={styles.promptCallout}>
        <Text style={styles.promptLabel}>This week&apos;s prompt</Text>
        <Text style={styles.promptText}>{weeklyCheckinPrompt}</Text>
      </Section>

      <Section style={styles.ctaWrap}>
        <Button href={ctaHref} style={styles.cta}>
          Share your reflection
        </Button>
      </Section>
    </EmailLayout>
  )
}
