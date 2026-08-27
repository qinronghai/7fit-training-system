export type TechniqueLevel = 'tl0' | 'tl1' | 'tl2' | 'tl3' | 'tl4'

export type MovementPatternId =
  | 'squat'
  | 'hinge'
  | 'hip'
  | 'single'
  | 'adduction'
  | 'hpush'
  | 'vpush'
  | 'hpull'
  | 'vpull'
  | 'core'
  | 'carry'
  | 'rotation'

export type ExerciseDisplayCategoryId =
  | 'lower'
  | 'glute'
  | 'pull'
  | 'push'
  | 'shoulder'
  | 'arms'
  | 'core'
  | 'carry'
  | 'power'
  | 'conditioning'
  | 'mobility'

export type ExerciseVideo = {
  url: string
  provider: 'youtube' | 'vimeo' | 'website'
  role: 'primary' | 'backup'
  verified: boolean
  verifiedAt?: string
  match: 'exact' | 'close' | 'reference'
  timestamp?: { start?: number; end?: number }
}

export type Exercise = {
  id: string
  name: string
  englishName: string
  aliases: string[]
  patternIds: MovementPatternId[]
  displayCategoryId: ExerciseDisplayCategoryId
  bodyRegions: string[]
  primaryMuscles: string[]
  secondaryMuscles: string[]
  equipment: string[]
  techniqueLevel: TechniqueLevel
  goals: string[]
  coachCues: string[]
  commonErrors: string[]
  regressions: string[]
  progressions: string[]
  contraindications: string[]
  riskNotes: string[]
  videos?: ExerciseVideo[]
}

export type ExerciseRole = 'warmup' | 'main' | 'conditioning' | 'recovery'

export type ExerciseUsage = {
  exerciseId: string
  templateId: string
  level: 'l1' | 'l2' | 'l3' | 'l4'
  role: ExerciseRole
  prescription: string
  context: string
}
