import type {
  Count,
  ExercisePrescription,
  LateralityTiming,
  NumericRange,
  ProgressionEvidence,
} from '../programming/types'
import type { Female111RecipeFamily } from './types'

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

export type Female111RecoveryRecord = {
  id: string
  required: true
  fields: readonly ('readiness' | 'pain' | 'breathing' | 'primaryQuality' | 'nextProgression')[]
  coachPrompt: string
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
  coachNote: string
}

export type Female111TemplateTimeEstimate = {
  estimatedMinutes: NumericRange
  source: 'calculated-from-template-items'
}

export type Female111TemplateLevel = Female111TemplateLevelDefinition & {
  estimatedMinutes: NumericRange
  timeEstimate: Female111TemplateTimeEstimate
}

export type Female111Template = {
  recipe: Female111RecipeFamily
  recipeId: string
  level: Female111TemplateLevel
}

export type Female111TemplateCatalogEntry = {
  recipe: Female111RecipeFamily
  recipeId: string
  levels: Readonly<Record<Female111TemplateLevelId, Female111TemplateLevel>>
}
