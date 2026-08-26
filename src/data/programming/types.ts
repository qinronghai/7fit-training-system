import type { MovementPatternId } from '../exercises/types'

export type ProgramLevel = 'l1' | 'l2' | 'l3' | 'l4'

export type TrainingSystem = '3c'

// Programming-local stable keys. Canonical Exercise IDs are a later migration concern.
export type ExerciseKey = string

export type Laterality = 'bilateral' | 'unilateral'

export type ExerciseRole =
  | 'PRIMARY'
  | 'SECONDARY'
  | 'UNILATERAL'
  | 'ACCESSORY'
  | 'CORE'
  | 'CARRY'
  | 'POWER'
  | 'CONDITIONING'

export type PrepPhase = 'R' | 'M' | 'A' | 'P'

export type NumericRange = {
  min: number
  max: number
}

export type Count = number | NumericRange

export type Intensity = {
  rpe?: number | NumericRange
  rir?: number | NumericRange
}

export type ExercisePrescription = Intensity & {
  sets?: Count
  reps?: Count
  durationSeconds?: Count
  distanceMeters?: Count
}

export type PrepItem = {
  exerciseKey: ExerciseKey
  displayName: string
  phase: PrepPhase
  laterality?: Laterality
  prescription: ExercisePrescription
  optional?: boolean
  reason: string
}

export type RampUpSet = {
  exerciseKey: ExerciseKey
  displayName: string
  order: number
  laterality?: Laterality
  reps: Count
  loadGuidance: string
  restSeconds?: Count
  targetRole: 'PRIMARY' | 'SECONDARY'
}

export type AlternativeExercise = {
  exerciseKey: ExerciseKey
  displayName: string
  reason: 'equipment' | 'member-fit' | 'regression' | 'coach-choice'
  preserves: {
    primaryGoal: boolean
    movementPattern: boolean
    stimulus: boolean
  }
  prescriptionOverride?: ExercisePrescription
  coachNote?: string
}

export type TrainingExercise = {
  exerciseKey: ExerciseKey
  displayName: string
  role: ExerciseRole
  movementPattern: MovementPatternId
  laterality: Laterality
  fatigueRisk: 'low' | 'moderate' | 'high'
  prescription: ExercisePrescription
  restSeconds?: Count
  alternatives?: AlternativeExercise[]
  coachNote?: string
}

export type TrainingBlock = {
  id: string
  kind: 'strength' | 'circuit'
  label: string
  exercises: TrainingExercise[]
  rounds?: Count
  restBetweenSetsSeconds?: Count
  restBetweenRoundsSeconds?: Count
  transitionSeconds?: Count
}

export type ProgrammingTemplateLevel = {
  programLevel: ProgramLevel
  primaryGoal: string
  secondaryGoal?: string
  prep: PrepItem[]
  rampUp: RampUpSet[]
  blocks: TrainingBlock[]
  estimatedMinutes: NumericRange
  coachNote: string
}

export type ProgrammingTemplate = {
  id: string
  code: string
  system: TrainingSystem
  name: string
  description: string
  levels: Record<ProgramLevel, ProgrammingTemplateLevel>
}

export type SessionTimeEstimate = {
  prepMinutes: number
  rampUpMinutes: number
  strengthExecutionMinutes: number
  strengthRestMinutes: number
  circuitWorkMinutes: number
  transitionMinutes: number
  unilateralAdjustmentMinutes: number
  equipmentBufferMinutes: number
  totalMinutes: NumericRange
}
