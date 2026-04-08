/**
 * HabitOS — Checkout Copy
 *
 * Owner: marketer role (M6)
 * Consumers: builder (/checkout/success, /checkout/canceled, /settings/billing)
 *
 * Pure constants. Used by post-Stripe-redirect landing pages and
 * by the inline error toasts in the billing flow.
 *
 * Voice: warm, grounded, no FOMO. The success state celebrates the
 * commitment without overpromising outcomes (.shared/memory/brand.md).
 */

export const CHECKOUT_COPY = {
  success: {
    title: 'You are in. Welcome to your next habit.',
    body: 'Your subscription is active and your new tier is unlocked across HabitOS. Take a breath, then pick the goal you want to build first — your coach is ready when you are.',
    primaryCtaLabel: 'Go to your dashboard',
    secondaryCtaLabel: 'Manage subscription',
  },
  canceled: {
    title: 'No worries — nothing was charged.',
    body: 'Checkout was canceled before your subscription started, so your card was not billed. You can keep building on the Free plan, or come back to pricing whenever you are ready.',
    primaryCtaLabel: 'Back to pricing',
    secondaryCtaLabel: 'Continue with Free',
  },
  errors: {
    checkoutFailed:
      'We could not start your checkout session. Please try again in a moment, and if it keeps happening reach out to support.',
    portalFailed:
      'We could not open your billing portal right now. Please try again, or contact support if the issue continues.',
    invalidPriceSlug:
      'That plan is not available right now. Please pick another tier from the pricing page.',
    notSignedIn:
      'Please sign in to your HabitOS account before subscribing or managing your billing.',
  },
} as const

export type CheckoutCopy = typeof CHECKOUT_COPY
