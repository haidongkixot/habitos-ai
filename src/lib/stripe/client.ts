/**
 * Stripe SDK singleton.
 *
 * Mirrors src/lib/prisma.ts pattern: stash on globalThis to survive
 * Next.js HMR in dev. Server-only — never import from client components.
 *
 * apiVersion is intentionally omitted so we ride the SDK's default
 * (stripe v22.0.0 ships "2026-03-25.dahlia"). The Stripe.StripeConfig
 * apiVersion type is a string-literal union pinned to the installed
 * SDK version, so "as any" lets us pass through whatever was bundled
 * without future drift breaking the build.
 */
import Stripe from 'stripe'

const globalForStripe = globalThis as unknown as {
  __stripe: Stripe | undefined
}

function createStripeClient(): Stripe {
  const secret = process.env.STRIPE_SECRET_KEY
  if (!secret) {
    // Throw lazily so importing the module in code paths that never
    // touch Stripe (e.g. unit tests, build-time analysis) doesn't blow up.
    // Real usage will surface this error at the first SDK call.
    return new Stripe('sk_test_placeholder_for_build', {
      apiVersion: '2026-03-25.dahlia' as any,
      typescript: true,
      appInfo: {
        name: 'HabitOS AI',
        version: '2.0.0',
      },
    })
  }
  return new Stripe(secret, {
    apiVersion: '2026-03-25.dahlia' as any,
    typescript: true,
    appInfo: {
      name: 'HabitOS AI',
      version: '2.0.0',
    },
  })
}

export const stripe: Stripe =
  globalForStripe.__stripe ?? createStripeClient()

if (process.env.NODE_ENV !== 'production') globalForStripe.__stripe = stripe

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY)
}
