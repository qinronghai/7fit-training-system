import type { MovementPatternId } from '../exercises/types'

export type ProgramLevel = 'l1' | 'l2' | 'l3' | 'l4'

export type TrainingSystem = '3c' | 'body' | 'conditioning'

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
  sideExecution?: 'alternating' | 'one-side-then-opposite'
  startingSidePolicy?: 'alternate-between-sets' | 'coach-directed'
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
  planningExecutionSeconds?: NumericRange
  optional?: boolean
  reason: string
} & LateralityTiming

export type SpecificBuildUpItem = {
  id: string
  exerciseKey: ExerciseKey
  displayName: string
  order: number
  laterality?: Laterality
  prescription: ExercisePrescription
  planningExecutionSeconds: NumericRange
  restAfterSeconds?: Count
  transitionAfterSeconds?: Count
  coachNote?: string
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
  planningExecutionSeconds?: NumericRange
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

export type ConditioningPowerPath = {
  prep: PrepItem[]
  specificBuildUp: SpecificBuildUpItem[]
  powerExercise: TrainingExercise
  planningTime?: Pick<ConditioningPlanningTime, 'buildUpCoachingAllowanceSeconds'>
}

export type PowerTrackOption = {
  optionKey: ExerciseKey
  trackKey: string
  path: ConditioningPowerPath
  requiresTechniqueCompetency: boolean
}

export type PowerTrackSlot = {
  kind: 'power-track'
  id: string
  exerciseKey: ExerciseKey
  displayName: string
  role: ExerciseRole
  movementPattern: MovementPatternId
  laterality: Laterality
  fatigueRisk: TrainingExercise['fatigueRisk']
  prescription: ExercisePrescription
  optional?: boolean
  optionalCondition?: OptionalExerciseCondition
  options: PowerTrackOption[]
  defaultSelection: ExerciseKey | 'foundation-regression'
  fallbackOptionKey?: ExerciseKey
  foundationRegression?: ConditioningPowerPath
  coachNote?: string
}

export type TrainingBlockEntry = TrainingExercise | SelectableExerciseSlot | PowerTrackSlot

export const isSelectableExerciseSlot = (value: unknown): value is SelectableExerciseSlot => (
  typeof value === 'object'
  && value !== null
  && (value as { kind?: unknown }).kind === 'selectable'
)

export const isPowerTrackSlot = (value: unknown): value is PowerTrackSlot => (
  typeof value === 'object'
  && value !== null
  && (value as { kind?: unknown }).kind === 'power-track'
)

export const isTrainingExercise = (value: unknown): value is TrainingExercise => (
  typeof value === 'object'
  && value !== null
  && !isSelectableExerciseSlot(value)
  && !isPowerTrackSlot(value)
  && typeof (value as { exerciseKey?: unknown }).exerciseKey === 'string'
  && typeof (value as { role?: unknown }).role === 'string'
)

export type TrainingBlock = {
  id: string
  kind: 'strength' | 'circuit' | 'power' | 'conditioning'
  label: string
  exercises: TrainingBlockEntry[]
  rounds?: Count
  restBetweenSetsSeconds?: Count
  restBetweenRoundsSeconds?: Count
  transitionSeconds?: Count
  transitionBetweenRoundsSeconds?: Count
  transitionAfterSeconds?: Count
  roundPolicy?: ConditioningRoundPolicy
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
  powerTracks?: Record<string, PowerTrackSelection>
  conditioningRounds?: Record<string, number>
}

export type PowerTrackSelection = {
  optionKey: ExerciseKey | 'foundation-regression'
  techniqueReady?: boolean
}

export type ConditioningRoundCondition =
  | 'output-stability'
  | 'recovery'
  | 'technique'
  | 'session-time'

export type ConditioningRoundPolicy = {
  standardRounds: number
  conditionalMaxRounds?: number
  conditions?: ConditioningRoundCondition[]
}

export type ConditioningIntensityTarget = {
  rpe: number | NumericRange
  note: string
}

export type ConditioningOutputMetricKind =
  | 'work-bout-distance'
  | 'pace'
  | 'power'
  | 'erg-output'
  | 'sled-split-time'
  | 'carry-load'
  | 'carry-distance'
  | 'completion-time'
  | 'round-completion-time'
  | 'power-quality'
  | 'explosive-reps'
  | 'velocity'
  | 'throw-distance'
  | 'locomotion-quality'

export type ConditioningOutputMetricScope = 'bout' | 'set' | 'station' | 'round' | 'level'

export type OutputMetricSpec = {
  kind: ConditioningOutputMetricKind
  scope: ConditioningOutputMetricScope
  availability: 'required' | 'when-available'
  label?: string
  note?: string
}

export type CoachDesignTarget = {
  kind: 'coach-design-target'
  description: string
}

export type ConditioningOutputPlan = {
  primary: OutputMetricSpec
  supporting?: OutputMetricSpec[]
  outputStability: CoachDesignTarget
}

export type ConditioningPlanningTime = {
  buildUpCoachingAllowanceSeconds?: NumericRange
  setupCoachingAllowanceSeconds: NumericRange
}

export type ConditioningSessionTimeComponentsSeconds = {
  prep: NumericRange
  specificBuildUp: NumericRange
  powerWork: NumericRange
  powerRecovery: NumericRange
  conditioningWork: NumericRange
  stationTransitions: NumericRange
  roundRecovery: NumericRange
  interBlockTransitions: NumericRange
  unilateralReset: NumericRange
  setupCoachingAllowance: NumericRange
}

export type ProgressionVariable = 'load' | 'volume' | 'rir' | 'rest' | 'range' | 'control' | 'output' | 'density'

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
  specificBuildUp?: SpecificBuildUpItem[]
  blocks: TrainingBlock[]
  estimatedMinutes: NumericRange
  conditioningIntensityTarget?: ConditioningIntensityTarget
  outputPlan?: ConditioningOutputPlan
  planningTime?: ConditioningPlanningTime
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
  powerTrackSelections?: Record<string, {
    requestedOptionKey?: ExerciseKey | 'foundation-regression'
    resolvedOptionKey: ExerciseKey
    mode: 'selected-track' | 'fallback-option' | 'foundation-regression'
  }>
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
  conditioningComponentsSeconds?: ConditioningSessionTimeComponentsSeconds
}
