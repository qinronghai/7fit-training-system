import type {
  Count,
  ExercisePrescription,
  LateralityTiming,
  NumericRange,
  ProgressionEvidence,
} from '../programming/types'
import type { Female111ProgressionDirection } from './progression'
import type { Female111RecipeFamily } from './types'
import type { Female111ProgressionFamily } from './types'

export type Female111TemplateLevelId = 'l1' | 'l2' | 'l3' | 'l4'
export type Female111TemplateRole = 'PRIMARY' | 'SUPPORT' | 'CORE' | 'ACCESSORY'
export type Female111TemplatePrepPhase = 'R' | 'M' | 'A' | 'P'

type Female111TemplateWorkItem = {
  id: string
  exerciseId: string
  laterality: 'bilateral' | 'unilateral'
  restSeconds?: Count
  prescription: ExercisePrescription & {
    tempo?: string
    rom?: string
  }
  planningExecutionSeconds: NumericRange
  transitionAfterSeconds?: Count
  reason: string
  qualityBoundary: string
  progression: string
  regression: string
} & LateralityTiming

export type Female111TemplatePrep = Female111TemplateWorkItem & {
  phase: Female111TemplatePrepPhase
}

export type Female111TemplateRampUp = Female111TemplateWorkItem & {
  order: number
}

export type Female111TemplateAction = Female111TemplateWorkItem & {
  role: Female111TemplateRole
}

export type Female111TemplateExerciseProgressionLink = {
  family: Female111ProgressionFamily
  direction: Female111ProgressionDirection
  fromExerciseId: string
  toExerciseId: string
  sourceNodeIds: readonly string[]
  sourceEdgeIds: readonly string[]
}

export type Female111RecoveryRecord = {
  id: string
  required: true
  fields: readonly ('readiness' | 'pain' | 'breathing' | 'primaryQuality' | 'nextProgression')[]
  coachPrompt: string
  durationSeconds: NumericRange
}

export type Female111TemplateLevelDefinition = {
  recipeId: string
  level: Female111TemplateLevelId
  focus: string
  prep: Female111TemplatePrep[]
  rampUp: Female111TemplateRampUp[]
  mainSequence: Female111TemplateAction[]
  optionalAccessory: Female111TemplateAction[]
  recoveryRecord: Female111RecoveryRecord
  progressionFromPrevious?: ProgressionEvidence
  exerciseProgressionFromPrevious?: Female111TemplateExerciseProgressionLink
  coachNote: string
}

export type Female111TemplateTimeComponents = {
  prepSeconds: NumericRange
  rampUpSeconds: NumericRange
  mainWorkSeconds: NumericRange
  setRestSeconds: NumericRange
  transitionSeconds: NumericRange
  unilateralAdjustmentSeconds: NumericRange
  equipmentCoachBufferSeconds: NumericRange
  optionalSeconds: NumericRange
  recoverySeconds: NumericRange
  totalSeconds: NumericRange
}

export type Female111TemplateTimeEstimate = {
  components: Female111TemplateTimeComponents
  totalMinutes: NumericRange
  optionalIncluded: boolean
}

export type Female111TemplateLevel = Female111TemplateLevelDefinition & {
  estimatedMinutes: NumericRange
  timeEstimate: Female111TemplateTimeEstimate
}

export type Female111TemplateValidationIssueCode =
  | 'DUPLICATE_PREP_PHASE'
  | 'MAIN_SEQUENCE_TOO_SHORT'
  | 'MISSING_PREP_PHASE'
  | 'OPTIONAL_TIME_GATE'
  | 'PROGRESSION_METADATA_MISMATCH'
  | 'PRESCRIPTION_MISSING'
  | 'PROGRESSION_MISSING'
  | 'PROGRESSION_TOO_MANY_VARIABLES'
  | 'QUALITY_BOUNDARY_MISSING'
  | 'REGRESSION_MISSING'
  | 'REPEATED_HIGH_FATIGUE_SOURCE'
  | 'ROLE_COVERAGE'
  | 'UNKNOWN_EXERCISE'

export type Female111TemplateValidationIssue = {
  code: Female111TemplateValidationIssueCode
  path: string
  message: string
}

export type Female111TemplateCompatibilityAction = {
  exerciseId: string
  prescription: string
  rationale: string
  progression: string
  regression: string
}

export type Female111TemplateCompatibilityProjection = {
  prep: Female111TemplateCompatibilityAction
  slots: Readonly<Record<'PRIMARY' | 'SUPPORT' | 'CORE', Female111TemplateCompatibilityAction>>
  coachFocus: string
  progressionNote: string
  regressionNote: string
}

export type Female111Template = Female111TemplateCompatibilityProjection & {
  recipe: Female111RecipeFamily
  recipeId: string
  level: Female111TemplateLevel
}

export type Female111TemplateCatalogEntry = Female111TemplateCompatibilityProjection & {
  recipe: Female111RecipeFamily
  recipeId: string
  levels: Readonly<Record<Female111TemplateLevelId, Female111TemplateLevel>>
}
