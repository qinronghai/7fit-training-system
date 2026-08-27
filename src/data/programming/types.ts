import type { MovementPatternId } from '../exercises/types'

export type ProgramLevel = 'l1' | 'l2' | 'l3' | 'l4'

export type TrainingSystem = '3c' | 'body'

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

export type WorkingSetEstimate = NumericRange

export type LateralityTiming = {
  sideRestSeconds?: Count
}

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
} & LateralityTiming

export type RampUpSet = {
  exerciseKey: ExerciseKey
  displayName: string
  order: number
  laterality?: Laterality
  reps: Count
  loadGuidance: string
  restSeconds?: Count
  targetRole: 'PRIMARY' | 'SECONDARY'
} & LateralityTiming

export type AlternativeExercise = {
  exerciseKey: ExerciseKey
  displayName: string
  reason: 'equipment' | 'member-fit' | 'regression' | 'coach-choice' | 'skill-track'
  preserves: {
    primaryGoal: boolean
    movementPattern: boolean
    stimulus: boolean
  }
  prescriptionOverride?: ExercisePrescription
  coachNote?: string
  eligibility?: {
    requiresTechniqueCompetency?: boolean
  }
}

export type OptionalExerciseCondition = {
  maxTotalWorkingSets: number
  maxCalculatedSessionMinutes: number
  coachCondition: 'readiness-permits'
  coachNote: string
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
  optional?: boolean
  optionalCondition?: OptionalExerciseCondition
} & LateralityTiming

export type SelectableExerciseOption = Omit<TrainingExercise, 'role' | 'optional' | 'optionalCondition'> & {
  role: 'ACCESSORY'
  optional?: false
}

export type SelectableExerciseSlot = {
  kind: 'selectable'
  id: string
  required: true
  selectCount: 1
  defaultOptionKey: ExerciseKey
  options: SelectableExerciseOption[]
  allowComplementaryOption?: boolean
  complementaryCondition?: OptionalExerciseCondition
  coachNote?: string
}

export type TrainingBlockEntry = TrainingExercise | SelectableExerciseSlot

export const isSelectableExerciseSlot = (value: unknown): value is SelectableExerciseSlot => (
  typeof value === 'object'
  && value !== null
  && (value as { kind?: unknown }).kind === 'selectable'
)

export const isTrainingExercise = (value: unknown): value is TrainingExercise => (
  typeof value === 'object'
  && value !== null
  && !isSelectableExerciseSlot(value)
  && typeof (value as { exerciseKey?: unknown }).exerciseKey === 'string'
  && typeof (value as { role?: unknown }).role === 'string'
)

export type TrainingBlock = {
  id: string
  kind: 'strength' | 'circuit'
  label: string
  exercises: TrainingBlockEntry[]
  rounds?: Count
  restBetweenSetsSeconds?: Count
  restBetweenRoundsSeconds?: Count
  transitionSeconds?: Count
}

export const getTrainingExercises = (block: TrainingBlock): TrainingExercise[] => (
  block.exercises.filter(isTrainingExercise)
)

export type ResolvedTrainingBlock = Omit<TrainingBlock, 'exercises'> & {
  exercises: TrainingExercise[]
}

export type ProgrammingSelection = {
  selectable?: Record<string, ExerciseKey>
  includeOptional?: boolean
  includeComplementaryOption?: boolean
}

export type ProgressionVariable = 'load' | 'volume' | 'rir' | 'rest' | 'range' | 'control'

export type ProgressionEvidence = {
  variables: ProgressionVariable[]
  note: string
}

export type ProgrammingTemplateLevel = {
  programLevel: ProgramLevel
  primaryGoal: string
  secondaryGoal?: string
  prep: PrepItem[]
  rampUp: RampUpSet[]
  blocks: TrainingBlock[]
  estimatedMinutes: NumericRange
  targetMuscleSetEstimate?: Record<string, Count>
  progressionFromPrevious?: ProgressionEvidence
  coachNote: string
}

export type ResolvedProgrammingLevel = Omit<ProgrammingTemplateLevel, 'blocks'> & {
  blocks: ResolvedTrainingBlock[]
  exercises: TrainingExercise[]
  selections: Record<string, ExerciseKey>
  optionalIncluded: boolean
  complementaryIncluded: boolean
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
  roundRestMinutes: number
  unilateralAdjustmentMinutes: number
  equipmentBufferMinutes: number
  planningOverheadMinutes: number
  totalMinutes: NumericRange
}
