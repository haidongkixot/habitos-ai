/**
 * HabitOS M5 — Analytics barrel.
 *
 * Re-exports the plan-metrics aggregation, the wizard-to-momentum funnel,
 * and the CSV serializer (+ exportPlansAsCsv convenience). Backend admin
 * routes import from here so they only need a single import line.
 */

export {
  getPlanMetricsSnapshot,
  type PlanMetricsSnapshot,
  type PlanMetricsOptions,
} from './plan-metrics'

export {
  getPlanFunnel,
  type PlanFunnel,
  type PlanFunnelOptions,
} from './plan-funnel'

export {
  serializePlansToCsv,
  exportPlansAsCsv,
  type PlanCsvRow,
  type ExportPlansFilters,
} from './csv-serializer'
