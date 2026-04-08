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
 * Props for the momentum-drop email.
 *
 * @property userName Recipient's first name.
 * @property coachName Coach persona name.
 * @property coachAvatarUrl Coach avatar URL.
 * @property previousScore Last week's momentum score (0-100).
 * @property currentScore Current momentum score (0-100). Should be < previousScore.
 * @property planId CoachingPlan id used in the deep link.
 * @property planTitle Human-readable plan title.
 * @property baseUrl Absolute origin (no trailing slash) for building links.
 * @property unsubscribeUrl Fully qualified one-click unsubscribe URL.
 */
export interface MomentumDropProps {
  userName: string
  coachName: string
  coachAvatarUrl: string
  previousScore: number
  currentScore: number
  planId: string
  planTitle: string
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
  scoreRow: {
    margin: '0 0 24px 0',
  },
  scoreCell: {
    backgroundColor: '#fafaf9',
    border: '1px solid #f4f4f5',
    borderRadius: '12px',
    padding: '14px 8px',
    textAlign: 'center' as const,
    width: '46%',
  },
  scoreSpacer: {
    width: '8%',
    textAlign: 'center' as const,
    verticalAlign: 'middle' as const,
    color: '#a1a1aa',
    fontSize: '20px',
  },
  scoreValuePrev: {
    margin: 0,
    fontSize: '24px',
    fontWeight: 700,
    color: '#71717a',
    lineHeight: '28px',
  },
  scoreValueCurrent: {
    margin: 0,
    fontSize: '24px',
    fontWeight: 700,
    color: '#f59e0b',
    lineHeight: '28px',
  },
  scoreLabel: {
    margin: '4px 0 0 0',
    fontSize: '11px',
    color: '#71717a',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
  },
  body: {
    margin: '0 0 16px 0',
    fontSize: '15px',
    lineHeight: '24px',
    color: '#3f3f46',
  },
  actionCallout: {
    backgroundColor: '#fffbeb',
    border: '1px solid #fde68a',
    borderRadius: '12px',
    padding: '16px 18px',
    margin: '4px 0 24px 0',
  },
  actionLabel: {
    margin: 0,
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    color: '#b45309',
  },
  actionText: {
    margin: '6px 0 0 0',
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
 * MomentumDrop — gentle reframe + one tiny action when momentum slips.
 */
export default function MomentumDrop({
  userName,
  coachName,
  coachAvatarUrl,
  previousScore,
  currentScore,
  planId,
  planTitle,
  baseUrl,
  unsubscribeUrl,
}: MomentumDropProps) {
  const ctaHref = `${baseUrl}/plan/${planId}?focus=two-minute`
  const previewText = `${planTitle} — let's pick one tiny win, ${userName}.`

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
          <Text style={styles.greetingLabel}>Momentum check</Text>
          <Text style={styles.greeting}>Hey {userName},</Text>
        </Column>
      </Row>

      <Heading as="h1" style={styles.heading}>
        Your momentum dipped — that&apos;s okay.
      </Heading>

      <Row style={styles.scoreRow}>
        <Column style={styles.scoreCell}>
          <Text style={styles.scoreValuePrev}>{previousScore}</Text>
          <Text style={styles.scoreLabel}>Last week</Text>
        </Column>
        <Column style={styles.scoreSpacer}>→</Column>
        <Column style={styles.scoreCell}>
          <Text style={styles.scoreValueCurrent}>{currentScore}</Text>
          <Text style={styles.scoreLabel}>This week</Text>
        </Column>
      </Row>

      <Text style={styles.body}>
        {coachName} here. Dips happen to everyone working on {planTitle} — and
        they almost always tell us the same thing: the next step we asked of
        ourselves was a little too big.
      </Text>
      <Text style={styles.body}>
        So let&apos;s shrink it. Not skip it, not retreat — shrink it. Two
        minutes. Today. That&apos;s the whole ask.
      </Text>

      <Section style={styles.actionCallout}>
        <Text style={styles.actionLabel}>Your 2-minute win</Text>
        <Text style={styles.actionText}>
          Open your plan, pick the smallest habit on the list, and do the
          first 120 seconds of it. That&apos;s a full success today.
        </Text>
      </Section>

      <Section style={styles.ctaWrap}>
        <Button href={ctaHref} style={styles.cta}>
          Pick my 2-minute win
        </Button>
      </Section>
    </EmailLayout>
  )
}
