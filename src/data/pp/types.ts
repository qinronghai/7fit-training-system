export type ExerciseId = string

export const ppCanonicalMappingStatuses = [
  'mapped',
  'variant',
  'method-only',
  'add-candidate',
  'verify',
] as const

export type PPCanonicalMappingStatus =
  (typeof ppCanonicalMappingStatuses)[number]

export type PPCanonicalMapping =
  | { status: 'mapped'; exerciseId: ExerciseId }
  | {
      status: 'variant'
      exerciseId: ExerciseId
      variantId: string
    }
  | { status: 'method-only' }
  | { status: 'add-candidate'; proposedExerciseId: string }
  | { status: 'verify'; reason: string }

export type PPPathway =
  | 'breath'
  | 'core'
  | 'support'
  | 'lateral-support'
  | 'hip-extension'
  | 'hinge'
  | 'squat'
  | 'hip-rotation'
  | 'frontal-plane'
  | 'thoracic-rotation'
  | 'locomotion'
  | 'integration'

export const ppCapabilities = [
  'breathing-control',
  'rib-pelvis-control',
  'anti-extension',
  'anti-rotation',
  'anti-lateral-flexion',
  'contralateral-control',
  'shoulder-support',
  'pelvic-control',
  'hip-extension',
  'hip-hinge',
  'hip-rotation',
  'hip-adduction',
  'hip-abduction',
  'weight-shift',
  'locomotion',
  'rotation',
  'force-transfer',
  'hip-flexion',
] as const

export type PPCapability = (typeof ppCapabilities)[number]

export type PPProgressionLevel = 'P0' | 'P1' | 'P2' | 'P3' | 'P4'

export type PPMethodNodeId = string
export type PPMethodNodeKind = 'exercise' | 'variant' | 'drill' | 'breathing'
export type PPMethodNodeRole =
  | 'foundation'
  | 'base'
  | 'bridge'
  | 'drill'
  | 'integration'
  | 'optional'

export type PPBreathingStrategy = {
  mode: 'continuous' | 'phase-cued' | 'reset'
  inhale?: string
  exhale?: string
  pressureIntent: string
  mustMaintainBreathing: boolean
  failureSigns: readonly string[]
}

export type PPQualityCriterion = {
  code: string
  domain:
    | 'breathing'
    | 'position'
    | 'control'
    | 'coordination'
    | 'tolerance'
    | 'repetition'
    | 'duration'
  requirement: string
}

export type PPQualityGate = {
  criteria: readonly PPQualityCriterion[]
  passRule: 'all'
}

export const ppMethodReadinessProfileIds = [
  'breath-rib-pelvis-foundation',
  'hinge-control',
  'squat-control',
  'hip-rotation-control',
  'hip-extension-control',
  'frontal-plane-weight-shift',
  'anterior-support',
  'dynamic-support',
  'lateral-support',
  'anti-extension-core',
  'rotation-integration',
  'locomotion',
] as const

export type PPMethodReadinessProfileId =
  (typeof ppMethodReadinessProfileIds)[number]

export type PPMethodReadinessProfile = {
  qualityGate: PPQualityGate
  commonCompensations: readonly string[]
}

export type PPMethodNode = {
  id: PPMethodNodeId
  source?: {
    sourceId: `PP${string}`
    sourceName: string
    origin: 'postpartum-course'
  }
  kind: PPMethodNodeKind
  mapping: PPCanonicalMapping
  hostExerciseId?: ExerciseId
  primaryPathway: PPPathway
  secondaryPathways?: readonly PPPathway[]
  progressionLevel: PPProgressionLevel
  role: PPMethodNodeRole
  capabilities: readonly PPCapability[]
  readinessProfile: PPMethodReadinessProfileId
  breathing: PPBreathingStrategy
  qualityGate: PPQualityGate
  commonCompensations: readonly string[]
  coachNotes?: readonly string[]
}

export type PPProgressionEdge = {
  from: PPMethodNodeId
  to: PPMethodNodeId
  type: 'progression' | 'branch' | 'optional'
  capabilityDelta: readonly PPCapability[]
  reason: string
}

export type PPVerificationLedgerEntry = {
  nodeId: PPMethodNodeId
  sourceId: `PP${string}`
  subject: 'display-category' | 'identity'
  status: 'open'
  reason: string
}
