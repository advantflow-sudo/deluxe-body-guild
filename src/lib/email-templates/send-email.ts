import * as React from 'react'
import { render } from '@react-email/render'
import { EmailAPIError, sendLovableEmail } from '@lovable.dev/email-js'
import { TEMPLATES } from './registry'

// Server-only: reads LOVABLE_API_KEY. Never import from client components.

// Configuration baked in at scaffold time
const SITE_NAME = "Deluxe Athlete Hub"
// SENDER_DOMAIN is the verified sender subdomain FQDN (e.g., "notify.example.com").
// It MUST match the subdomain delegated to Lovable's nameservers. NEVER use the root domain.
const SENDER_DOMAIN = "notify.deluxefitness.app"
// FROM_DOMAIN is the domain shown in the From: header (e.g., "example.com").
// Can be the root domain when display_from_root is enabled — this is cosmetic only.
const FROM_DOMAIN = "deluxefitness.app"

export type SendTemplateEmailResult =
  | { sent: true }
  | { sent: false; reason: 'recipient_suppressed' }

export interface SendTemplateEmailOptions {
  templateData?: Record<string, any>
  /** Dedupes retries of the same logical send; defaults to a random UUID (no dedupe). */
  idempotencyKey?: string
  replyTo?: string
}

/**
 * Renders a registered template and sends it through Lovable's managed email
 * API. Suppression, retries, and rate limits are enforced by Lovable
 * server-side. A suppressed recipient is an expected outcome
 * ({ sent: false }); any other failure throws — EmailAPIError exposes
 * .code and .status for branching.
 */
export async function sendTemplateEmail(
  templateName: string,
  to: string,
  options: SendTemplateEmailOptions = {}
): Promise<SendTemplateEmailResult> {
  const apiKey = process.env['LOVABLE_API_KEY']
  if (!apiKey) {
    throw new Error('LOVABLE_API_KEY is not configured')
  }

  const template = TEMPLATES[templateName]
  if (!template) {
    throw new Error(
      `Template '${templateName}' not found. Available: ${Object.keys(TEMPLATES).join(', ')}`
    )
  }

  // Template-level `to` takes precedence — notification templates always
  // send to their fixed address.
  const recipient = template.to || to
  if (!recipient) {
    throw new Error('Recipient is required (the template defines no fixed recipient)')
  }

  const templateData = options.templateData ?? {}
  const element = React.createElement(template.component, templateData)
  const html = await render(element)
  const text = await render(element, { plainText: true })
  const subject =
    typeof template.subject === 'function'
      ? template.subject(templateData)
      : template.subject

  try {
    await sendLovableEmail(
      {
        to: recipient,
        from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
        sender_domain: SENDER_DOMAIN,
        subject,
        html,
        text,
        purpose: 'transactional',
        label: templateName,
        idempotency_key: options.idempotencyKey || crypto.randomUUID(),
        reply_to: options.replyTo,
      },
      { apiKey, sendUrl: process.env['LOVABLE_SEND_URL'] }
    )
  } catch (error) {
    if (error instanceof EmailAPIError && error.code === 'recipient_suppressed') {
      return { sent: false, reason: 'recipient_suppressed' }
    }
    throw error
  }

  return { sent: true }
}

export type EmailDeliveryReason =
  | 'not_configured'
  | 'domain_not_verified'
  | 'emails_disabled'
  | 'rate_limited'
  | 'recipient_suppressed'
  | 'error'

export type EmailDeliveryStatus =
  | { ready: true; senderDomain: string; fromAddress: string }
  | { ready: false; reason: EmailDeliveryReason; message: string; senderDomain: string; fromAddress: string }

export const EMAIL_FROM_ADDRESS = `${SITE_NAME} <noreply@${FROM_DOMAIN}>`
export const EMAIL_SENDER_DOMAIN = SENDER_DOMAIN

export function emailDeliveryReason(error: unknown): EmailDeliveryReason {
  if (error instanceof EmailAPIError) {
    if (error.status === 429) return 'rate_limited'
    const code = error.code
    if (
      code === 'domain_not_verified' ||
      code === 'emails_disabled' ||
      code === 'recipient_suppressed'
    ) {
      return code
    }
  }
  return 'error'
}

const REASON_MESSAGES: Record<EmailDeliveryReason, string> = {
  not_configured: 'Email delivery is not configured yet.',
  domain_not_verified:
    'The sending domain is still being verified, so emails cannot be delivered yet.',
  emails_disabled: 'Email sending is currently switched off for this app.',
  rate_limited: 'Too many emails were sent recently — try again shortly.',
  recipient_suppressed: 'This address previously unsubscribed or bounced.',
  error: 'Email delivery is unavailable right now.',
}

export function emailDeliveryMessage(reason: EmailDeliveryReason) {
  return REASON_MESSAGES[reason]
}

/**
 * Verifies the whole delivery path (API key, sender domain verification,
 * emails-enabled state) without delivering anything: the send runs in test
 * mode, so nothing reaches an inbox and no delivery event is written.
 */
export async function probeEmailDelivery(recipient: string): Promise<EmailDeliveryStatus> {
  const apiKey = process.env['LOVABLE_API_KEY']
  const base = { senderDomain: SENDER_DOMAIN, fromAddress: EMAIL_FROM_ADDRESS }
  if (!apiKey) {
    return {
      ready: false,
      reason: 'not_configured',
      message: emailDeliveryMessage('not_configured'),
      ...base,
    }
  }

  try {
    await sendLovableEmail(
      {
        to: recipient,
        from: EMAIL_FROM_ADDRESS,
        sender_domain: SENDER_DOMAIN,
        subject: 'Delivery check',
        html: '<p>Delivery check</p>',
        text: 'Delivery check',
        purpose: 'transactional',
        label: 'delivery-probe',
        test_mode: true,
        idempotency_key: crypto.randomUUID(),
      },
      { apiKey, sendUrl: process.env['LOVABLE_SEND_URL'] }
    )
  } catch (error) {
    const reason = emailDeliveryReason(error)
    if (reason === 'recipient_suppressed') {
      return {
        ready: false,
        reason,
        message: emailDeliveryMessage(reason),
        ...base,
      }
    }
    console.error('[email] delivery probe failed', error)
    return { ready: false, reason, message: emailDeliveryMessage(reason), ...base }
  }

  return { ready: true, ...base }
}
