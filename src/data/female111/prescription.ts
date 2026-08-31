export const female111PrescriptionVariables = [
  'loadKg',
  'reps',
  'sets',
  'volume',
  'rir',
  'restSeconds',
  'rom',
  'tempo',
  'leverLength',
  'support',
  'laterality',
  'complexity',
  'integration',
  'density',
  'breathingDemand',
  'coordinationDemand',
] as const

export type Female111PrescriptionVariable = (typeof female111PrescriptionVariables)[number]

export type Female111Prescription = {
  exerciseId: string
  loadKg?: number
  reps?: number
  sets?: number
  volume?: number
  rir?: number
  restSeconds?: number
  rom?: 'limited' | 'targeted' | 'full'
  tempo?: string
  leverLength?: 'short' | 'long'
  support?: 'supported' | 'reduced' | 'none'
  laterality?: 'bilateral' | 'unilateral'
  complexity?: 'stable' | 'dynamic'
  integration?: 'isolated' | 'integrated'
  density?: 'low' | 'normal' | 'high'
  breathingDemand?: 'reset' | 'continuous' | 'phase-cued'
  coordinationDemand?: 'low' | 'moderate' | 'high'
}

export type Female111PrescriptionComparison = {
  valid: boolean
  changedVariables: readonly Female111PrescriptionVariable[]
  reason?: string
}

export const compareFemale111Prescription = (
  previous: Female111Prescription,
  next: Female111Prescription,
): Female111PrescriptionComparison => {
  if (previous.exerciseId !== next.exerciseId) {
    return { valid: false, changedVariables: [], reason: '双进阶的处方进阶要求动作不变；动作替换属于 Exercise Progression。' }
  }

  const changedVariables = female111PrescriptionVariables.filter((key) => previous[key] !== next[key])
  if (changedVariables.length > 2) {
    return { valid: false, changedVariables, reason: '一次处方进阶最多改变两项主要变量。' }
  }
  return { valid: true, changedVariables }
}

export const buildFemale111PrescriptionProgression = (
  previous: Female111Prescription,
  changes: Partial<Omit<Female111Prescription, 'exerciseId'>>,
): Female111Prescription => {
  const next = { ...previous, ...changes }
  const comparison = compareFemale111Prescription(previous, next)
  if (!comparison.valid) throw new Error(comparison.reason ?? '处方进阶不合法。')
  return next
}
