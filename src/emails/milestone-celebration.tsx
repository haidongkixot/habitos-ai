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
 * Props for the milestone celebration email.
 *
 * @property userName Recipient's first name.
 * @property coachName Coach persona name.
 * @property coachAvatarUrl Coach avatar URL.
 * @property milestoneTitle Title of the milestone reached (e.g. "First 7 days").
 * @property weekIndex 1-based week number this milestone belongs to.
 * @property planId CoachingPlan id used in the deep link.
 * @property baseUrl Absolute origin (no trailing slash) for building links.
 * @property unsubscribeUrl Fully qualified one-click unsubscribe URL.
 */
export interface MilestoneCelebrationProps {
  userName: string
  coachName: string
  coachAvatarUrl: string
  milestoneTitle: string
  weekIndex: number
  planId: string
  baseUrl: string
  unsubscribeUrl: string
}

const styles = {
  celebrationBanner: {
    backgroundColor: '#fef3c7',
    border: '1px solid #fcd34d',
    borderRadius: '14px',
    padding: '24px 20px',
    textAlign: 'center' as const,
    marginBottom: '24px',
  },
  celebrationLabel: {
    margin: 0,
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    color: '#b45309',
  },
  celebrationTitle: {
    margin: '8px 0 0 0',
    fontSize: '26px',
    lineHeight: '32px',
    fontWeight: 700,
    color: '#18181b',
    letterSpacing: '-0.01em',
  },
  weekChip: {
    display: 'inline-block' as const,
    marginTop: '12px',
    padding: '6px 14px',
    backgroundColor: '#f59e0b',
    color: '#18181b',
    borderRadius: '9999px',
    fontSize: '12px',
    fontWeight: 600,
  },
  heroRow: {
    marginBottom: '16px',
  },
  avatarCell: {
    width: '56px',
    verticalAlign: 'middle' as const,
  },
  avatar: {
    width: '48px',
    height: '48px',
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
  },
  greeting: {
    margin: '2px 0 0 0',
    fontSize: '16px',
    fontWeight: 600,
    color: '#18181b',
  },
  heading: {
    margin: '8px 0 12px 0',
    fontSize: '22px',
    lineHeight: '28px',
    fontWeight: 600,
    color: '#18181b',
  },
  body: {
    margin: '0 0 24px 0',
    fontSize: '15px',
    lineHeight: '24px',
    color: '#3f3f46',
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
 * MilestoneCelebration — celebratory note when the user reaches a milestone.
 */
export default function MilestoneCelebration({
  userName,
  coachName,
  coachAvatarUrl,
  milestoneTitle,
  weekIndex,
  planId,
  baseUrl,
  unsubscribeUrl,
}: MilestoneCelebrationProps) {
  const ctaHref = `${baseUrl}/plan/${planId}?view=progress`
  const previewText = `${milestoneTitle} — that's a real win, ${userName}.`

  return (
    <EmailLayout previewText={previewText} unsubscribeUrl={unsubscribeUrl}>
      <Section style={styles.celebrationBanner}>
        <Text style={styles.celebrationLabel}>Milestone reached</Text>
        <Text style={styles.celebrationTitle}>{milestoneTitle}</Text>
        <Text style={styles.weekChip}>Week {weekIndex}</Text>
      </Section>

      <Row style={styles.heroRow}>
        <Column style={styles.avatarCell}>
          <Img
            src={coachAvatarUrl}
            alt={`${coachName} avatar`}
            width={48}
            height={48}
            style={styles.avatar}
          />
        </Column>
        <Column style={styles.greetingCell}>
          <Text style={styles.greetingLabel}>From {coachName}</Text>
          <Text style={styles.greeting}>{userName}, take this in.</Text>
        </Column>
      </Row>

      <Heading as="h1" style={styles.heading}>
        You actually did the thing.
      </Heading>
      <Text style={styles.body}>
        Week {weekIndex} is in the books. This is the part most people skip —
        noticing the win. Take a breath. The version of you that started this
        plan would be genuinely proud of where you are right now.
      </Text>

      <Section style={styles.ctaWrap}>
        <Button href={ctaHref} style={styles.cta}>
          See your progress
        </Button>
      </Section>
    </EmailLayout>
  )
}
