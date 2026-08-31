import * as React from 'react'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  /** XP still left to claim today. */
  remainingXp?: number
  /** Deep link into the mission screen. */
  claimUrl?: string
  isTest?: boolean
}

const main = { backgroundColor: '#ffffff', fontFamily: 'Helvetica, Arial, sans-serif' }
const container = { padding: '28px 24px', maxWidth: '560px' }
const panel = {
  backgroundColor: '#0c0c0d',
  borderRadius: '16px',
  padding: '28px 24px',
  textAlign: 'center' as const,
}
const brand = {
  color: '#c9a227',
  fontSize: '12px',
  letterSpacing: '3px',
  textTransform: 'uppercase' as const,
  margin: '0 0 12px',
}
const heading = { color: '#ffffff', fontSize: '24px', margin: '0 0 8px' }
const sub = { color: '#d5d5d8', fontSize: '15px', margin: '0 0 20px', lineHeight: '22px' }
const button = {
  backgroundColor: '#c9a227',
  color: '#0c0c0d',
  fontWeight: 700,
  fontSize: '15px',
  padding: '13px 26px',
  borderRadius: '999px',
  textDecoration: 'none',
  display: 'inline-block',
}
const foot = { color: '#6b6b70', fontSize: '12px', lineHeight: '18px', margin: '18px 0 0' }

const MissionReminderEmail = ({
  remainingXp = 100,
  claimUrl = 'https://deluxefitness.app/app?mission=1',
  isTest = false,
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{`${remainingXp} XP left on today's Deluxe mission`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={panel}>
          <Text style={brand}>Deluxe Fitness</Text>
          <Heading style={heading}>
            {isTest ? 'Test reminder' : 'Your daily mission is ready'}
          </Heading>
          <Text style={sub}>
            {remainingXp > 0
              ? `You have ${remainingXp} XP left to claim today. Finish your actions to keep your streak alive.`
              : 'Your mission is complete for today — nice work.'}
          </Text>
          <Button href={claimUrl} style={button}>
            Claim your XP
          </Button>
        </Section>
        <Hr />
        <Text style={foot}>
          You are receiving this because mission reminder emails are switched on in your Deluxe
          Fitness profile.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: MissionReminderEmail,
  subject: (data: Record<string, any>) =>
    data?.isTest
      ? 'Test mission reminder'
      : `${data?.remainingXp ?? 100} XP left on today's mission`,
  displayName: 'Mission reminder',
  previewData: { remainingXp: 40, claimUrl: 'https://deluxefitness.app/app?mission=1' },
} satisfies TemplateEntry
