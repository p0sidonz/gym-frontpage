/** Normalize & serialize subscription_plans.features JSON (limits + dynamic modules + legacy flat keys). */

export type PlanModule = {
  key: string
  label: string
  enabled: boolean
  show_on_landing: boolean
}

export type PlanLimits = {
  max_staff: number
  max_members: number
  max_sms_per_month: number
  max_classes_per_week: number
}

export const DEFAULT_MODULE_BLUEPRINTS: { key: string; label: string }[] = [
  { key: 'includes_diet', label: 'Diet plan builder' },
  { key: 'includes_reports', label: 'Reports & analytics' },
]

const LEGACY_MODULE_KEYS: { key: string; label: string }[] = [
  ...DEFAULT_MODULE_BLUEPRINTS,
  { key: 'includes_biometric', label: 'Biometric attendance' },
  { key: 'includes_inventory', label: 'Inventory / POS' },
  { key: 'includes_referral', label: 'Referral program' },
]

export const MODULE_KEYS_HIDDEN_FROM_PUBLIC_PRICING = new Set([
  'includes_biometric',
  'includes_inventory',
  'includes_referral',
])

export const SHOW_SMS_ALLOWANCE_ON_PUBLIC_PRICING = false

export const SHOW_STAFF_CAP_ON_PUBLIC_PRICING = false

export function defaultPlanModules(): PlanModule[] {
  return DEFAULT_MODULE_BLUEPRINTS.map((b) => ({
    key: b.key,
    label: b.label,
    enabled: false,
    show_on_landing: true,
  }))
}

function defaultLimits(): PlanLimits {
  return {
    max_staff: 10,
    max_members: 100,
    max_sms_per_month: 0,
    max_classes_per_week: 10,
  }
}

export function normalizePlanFeatures(
  raw: Record<string, unknown> | null | undefined,
  row?: { max_members?: number | null; max_staff?: number | null },
): { limits: PlanLimits; modules: PlanModule[]; meta: { is_demo?: boolean; demo_period_days?: number } } {
  const r = raw || {}
  const limitsFromJson = r.limits as PlanLimits | undefined
  const base = defaultLimits()
  const limits: PlanLimits = {
    max_staff: Number(limitsFromJson?.max_staff ?? r.max_staff ?? row?.max_staff ?? base.max_staff),
    max_members: Number(limitsFromJson?.max_members ?? r.max_members ?? row?.max_members ?? base.max_members),
    max_sms_per_month: Number(limitsFromJson?.max_sms_per_month ?? r.max_sms_per_month ?? base.max_sms_per_month),
    max_classes_per_week: Number(
      limitsFromJson?.max_classes_per_week ?? r.max_classes_per_week ?? base.max_classes_per_week,
    ),
  }

  const meta = {
    is_demo: r.is_demo === true ? true : r.is_demo === false ? false : undefined,
    demo_period_days: typeof r.demo_period_days === 'number' ? r.demo_period_days : undefined,
  }

  if (Array.isArray(r.modules) && r.modules.length > 0) {
    const modules = (r.modules as unknown[])
      .map((m) => {
        const o = m as Record<string, unknown>
        const key = String(o.key || '').trim() || `custom_${Date.now().toString(36)}`
        return {
          key,
          label: String(o.label || key).trim() || key,
          enabled: o.enabled !== false,
          show_on_landing: o.show_on_landing !== false,
        }
      })
      .filter((m) => m.key)
    return { limits, modules, meta }
  }

  const modules: PlanModule[] = LEGACY_MODULE_KEYS.map(({ key, label }) => ({
    key,
    label,
    enabled: r[key] === true,
    show_on_landing: r[`landing_${key}` as keyof typeof r] === false ? false : true,
  }))

  return { limits, modules, meta }
}

export function publicPricingFeatureLines(plan: {
  features?: Record<string, unknown> | null
  max_members?: number | null
}): string[] {
  const { limits, modules } = normalizePlanFeatures(plan.features, plan)
  const lines: string[] = []
  if (SHOW_SMS_ALLOWANCE_ON_PUBLIC_PRICING && limits.max_sms_per_month > 0) {
    lines.push(`${limits.max_sms_per_month.toLocaleString('en-IN')} SMS / month`)
  }
  if (limits.max_classes_per_week > 0) {
    lines.push(`${limits.max_classes_per_week} classes / week`)
  }
  if (SHOW_STAFF_CAP_ON_PUBLIC_PRICING) {
    lines.push(
      limits.max_staff <= 0
        ? 'Unlimited staff accounts'
        : `Up to ${limits.max_staff.toLocaleString('en-IN')} staff accounts`,
    )
  }
  for (const m of modules) {
    if (!m.enabled || !m.show_on_landing) continue
    if (MODULE_KEYS_HIDDEN_FROM_PUBLIC_PRICING.has(m.key)) continue
    lines.push(m.label)
  }
  return lines
}
