import { paypalRequest } from './client'

export async function createPayPalSubscription({
  paypalPlanId, email, userId, appUrl,
}: { paypalPlanId: string; email: string; userId: string; appUrl: string }) {
  const base = appUrl.replace(/\/$/, '')
  const data = await paypalRequest<any>('POST', '/v1/billing/subscriptions', {
    plan_id: paypalPlanId,
    custom_id: userId,
    subscriber: { email_address: email },
    application_context: {
      return_url: `${base}/checkout/success?provider=paypal`,
      cancel_url: `${base}/checkout/canceled`,
      user_action: 'SUBSCRIBE_NOW',
      shipping_preference: 'NO_SHIPPING',
    },
  })
  const approvalLink = data.links?.find((l: any) => l.rel === 'approve')
  if (!approvalLink) throw new Error('No approval URL in PayPal response')
  return { subscriptionId: data.id as string, approvalUrl: approvalLink.href as string }
}

export async function getPayPalSubscription(subscriptionId: string): Promise<any> {
  return paypalRequest('GET', `/v1/billing/subscriptions/${subscriptionId}`)
}
