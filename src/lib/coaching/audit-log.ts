/**
 * HabitOS Phase 3 — Plan audit log helper.
 *
 * The Phase 1 PlanAuditLog model (prisma/schema.prisma line 708) stores:
 *   id, planId, adminId?, userId?, action, before?, after?, reason?, createdAt
 *
 * There is no first-class `metadata` or `actorRole` column, so we encode:
 *   - actorRole via which column we populate (userId vs adminId). "system"
 *     writes land in `reason` with a "[system]" tag.
 *   - arbitrary metadata into `after` as Json (the spec calls it "metadata"
 *     in the role prompt; we keep the signature consistent for callers).
 *
 * Keeps all audit writes consistent so Phase 4 admin tools can trust the
 * shape.
 */

import { prisma } from '@/lib/prisma'

export type PlanAuditActorRole = 'user' | 'admin' | 'system'

export interface WritePlanAuditParams {
  planId: string
  actorId: string
  actorRole: PlanAuditActorRole
  action: string
  /** Optional JSON blob persisted into the `after` column for downstream inspection. */
  metadata?: Record<string, unknown>
  /** Optional snapshot of the row before the change (for update/delete events). */
  before?: Record<string, unknown>
  /** Optional human-readable reason (will be prefixed with [role] for system actors). */
  reason?: string
}

/**
 * Writes a single PlanAuditLog entry. Swallows + logs errors so a failing
 * audit row can never take down the caller's main transaction.
 *
 * Callers that need atomicity should NOT use this helper — do the audit
 * write inside their own `prisma.$transaction` call.
 */
export async function writePlanAudit(params: WritePlanAuditParams): Promise<void> {
  const { planId, actorId, actorRole, action, metadata, before, reason } = params

  try {
    await (prisma as any).planAuditLog.create({
      data: {
        planId,
        // Route actorId into the correct column based on role.
        adminId: actorRole === 'admin' ? actorId : null,
        userId: actorRole === 'user' ? actorId : actorRole === 'system' ? actorId : null,
        action,
        before: before ?? undefined,
        after: metadata ?? undefined,
        reason: actorRole === 'system' && reason ? `[system] ${reason}` : reason ?? null,
      },
    })
  } catch (err) {
    // Audit is best-effort — never crash the caller on a logging failure.
    console.error('[writePlanAudit] failed to write audit entry', {
      planId,
      action,
      err,
    })
  }
}
