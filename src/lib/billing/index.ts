/**
 * src/lib/billing — barrel
 *
 * Marketer-owned re-exports for the M6 copy modules. Backend-owned
 * modules (sync, get-current-tier, webhook-events) are intentionally
 * not re-exported here — backend may add its own re-exports below
 * this block when it lands its barrel additions.
 */

export {
  TIER_COPY,
  TIER_DISPLAY_ORDER,
  BILLING_CYCLE_DISCOUNT_LABEL,
} from './tier-copy'
export type { TierSlug, TierCopy } from './tier-copy'

export { CHECKOUT_COPY } from './checkout-copy'
export type { CheckoutCopy } from './checkout-copy'

export { UPSELL_MESSAGES, UPSELL_TRIGGERS } from './upsell-copy'
export type { UpsellTrigger, UpsellMessage } from './upsell-copy'
