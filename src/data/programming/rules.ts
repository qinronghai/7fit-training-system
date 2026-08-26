import type {
 Count,
 ExercisePrescription,
  ExerciseRole,
 Laterality,
 NumericRange,
  ProgramLevel,
  ProgrammingSelection,
 ProgrammingTemplate,
 ProgrammingTemplateLevel,
  ResolvedProgrammingLevel,
  SelectableExerciseSlot,
  SessionTimeEstimate,
  TrainingBlock,
  TrainingExercise,
} from './types'
import { getTrainingExercises } from './types'
import { isSelectableExerciseSlot } from './types'

const DEFAULT_SECONDS_PER_REP = 4
const DEFAULT_SECONDS_PER_METER = 1
const DEFAULT_ITEM_SETUP_SECONDS = 15
const DEFAULT_STATION_TRANSITION_SECONDS = 20
const DEFAULT_STRENGTH_REST_SECONDS = 90
const DEFAULT_ROUND_REST_SECONDS = 75
const DEFAULT_BLOCK_BUFFER_SECONDS = 45
const DEFAULT_UNILATERAL_RESET_SECONDS = 10

type WorkRange = {
  base: NumericRange
  unilateralAdjustment: NumericRange
}

const toRange = (value: Count | undefined, fallback = 0): NumericRange => {
  if (value === undefined) return { min: fallback, max: fallback }
  if (typeof value === 'number') return { min: value, max: value }
  return { min: value.min, max: value.max }
}

const addRange = (left: NumericRange, right: NumericRange): NumericRange => ({
  min: left.min + right.min,
  max: left.max + right.max,
})

const multiplyRange = (value: NumericRange, multiplier: NumericRange | number): NumericRange => {
  if (typeof multiplier === 'number') {
    return { min: value.min * multiplier, max: value.max * multiplier }
  }
  return {
    min: value.min * multiplier.min,
    max: value.max * multiplier.max,
  }
}

export type AuditIssue = {
  code: string
  path: string
  message: string
}

const VALID_ROLES: readonly ExerciseRole[] = [
  'PRIMARY',
  'SECONDARY',
  'UNILATERAL',
  'ACCESSORY',
  'CORE',
  'CARRY',
  'POWER',
  'CONDITIONING',
]

const VALID_MOVEMENT_PATTERNS = new Set([
  'squat',
  'hinge',
  'hip',
  'single',
  'adduction',
  'hpush',
  'vpush',
  'hpull',
  'vpull',
  'core',
  'carry',
  'rotation',
])

const issue = (code: string, path: string, message: string): AuditIssue => ({
  code,
  path,
  message,
})

const countRange = (value: Count | undefined): NumericRange | null => {
  if (value === undefined) return null
  const range = toRange(value)
  if (!Number.isFinite(range.min) || !Number.isFinite(range.max) || range.min > range.max) return null
  return range
}

const hasWorkPrescription = (prescription: ExercisePrescription): boolean => (
  prescription.reps !== undefined
  || prescription.durationSeconds !== undefined
  || prescription.distanceMeters !== undefined
)

const forbiddenCompoundName = (displayName: string): boolean => /[+/]|或/.test(displayName)

const generatedExerciseKey = (exerciseKey: string): boolean => (
  exerciseKey.trim().length === 0 || /^action-\d+$/.test(exerciseKey.trim())
)

const allExercises = (level: ProgrammingTemplateLevel): TrainingExercise[] => (
  level.blocks.flatMap(getTrainingExercises)
)

type ResolvedSlot = {
  exercises: TrainingExercise[]
  selectedKey: string
  complementaryIncluded: boolean
}

const resolveSelectableSlot = (
  slot: SelectableExerciseSlot,
  selection: ProgrammingSelection,
  path: string,
): ResolvedSlot => {
  const explicitKey = selection.selectable?.[slot.id]
  const selectedKey = explicitKey ?? slot.defaultOptionKey
  const selected = slot.options.find((option) => option.exerciseKey === selectedKey)

  if (!selected) {
    throw new Error(`${path}: selectable option "${selectedKey}" is not approved for this slot`)
  }

  const exercises: TrainingExercise[] = [{ ...selected }]
  let complementaryIncluded = false
  if (selection.includeComplementaryOption === true) {
    if (slot.allowComplementaryOption !== true) {
      throw new Error(`${path}: complementary option is not allowed`)
    }
    const complementary = slot.options.find((option) => option.exerciseKey !== selected.exerciseKey)
    if (!complementary) {
      throw new Error(`${path}: complementary option is not uniquely defined`)
    }
    exercises.push({
      ...complementary,
      optional: true,
      ...(slot.complementaryCondition ? { optionalCondition: slot.complementaryCondition } : {}),
    })
    complementaryIncluded = true
  }

  return { exercises, selectedKey, complementaryIncluded }
}

export const resolveProgrammingLevel = (
  level: ProgrammingTemplateLevel,
  selection: ProgrammingSelection = {},
): ResolvedProgrammingLevel => {
  const selections: Record<string, string> = {}
  let optionalIncluded = false
  let complementaryIncluded = false
  const blocks = level.blocks.map((block, blockIndex) => {
    const exercises: TrainingExercise[] = []
    block.exercises.forEach((entry, entryIndex) => {
      if (isSelectableExerciseSlot(entry)) {
        const resolvedSlot = resolveSelectableSlot(
          entry,
          selection,
          `blocks[${blockIndex}].exercises[${entryIndex}]`,
        )
        selections[entry.id] = resolvedSlot.selectedKey
        exercises.push(...resolvedSlot.exercises)
        complementaryIncluded = complementaryIncluded || resolvedSlot.complementaryIncluded
        return
      }
      if (entry.optional === true && selection.includeOptional !== true) return
      if (entry.optional === true) optionalIncluded = true
      exercises.push({ ...entry })
    })
    return { ...block, exercises }
  })

  return {
    ...level,
    blocks,
    exercises: blocks.flatMap((block) => block.exercises),
    selections,
    optionalIncluded,
    complementaryIncluded,
  }
}

const countValue = (value: Count | undefined, fallback = 0): number => {
  if (value === undefined) return fallback
  return typeof value === 'number' ? value : (value.min + value.max) / 2
}

const progressionSignature = (level: ProgrammingTemplateLevel) => ({
  blockKinds: level.blocks.map((block) => block.kind),
  rounds: level.blocks.map((block) => countValue(block.rounds)),
  rest: level.blocks.map((block) => countValue(block.restBetweenSetsSeconds) + countValue(block.restBetweenRoundsSeconds)),
  volume: allExercises(level).reduce((total, exercise) => {
    const sets = countValue(exercise.prescription.sets, 1)
    const reps = countValue(exercise.prescription.reps)
    const duration = countValue(exercise.prescription.durationSeconds)
    const distance = countValue(exercise.prescription.distanceMeters)
    const block = level.blocks.find((candidate) => candidate.exercises.includes(exercise))
    const rounds = block?.kind === 'circuit' ? countValue(block.rounds, 1) : 1
    return total + (sets * (reps + duration + distance) * rounds)
  }, 0),
  unilateralCount: allExercises(level).filter((exercise) => exercise.laterality === 'unilateral').length,
  patterns: allExercises(level).map((exercise) => exercise.movementPattern).join('|'),
  rampReps: level.rampUp.reduce((total, set) => total + countValue(set.reps), 0),
})

const hasProgression = (
  previous: ProgrammingTemplateLevel,
  next: ProgrammingTemplateLevel,
): boolean => JSON.stringify(progressionSignature(previous)) !== JSON.stringify(progressionSignature(next))

const validateExercise = (
  exercise: TrainingExercise,
  path: string,
  issues: AuditIssue[],
): void => {
  if (generatedExerciseKey(exercise.exerciseKey)) {
    issues.push(issue('EXERCISE_KEY_INVALID', path + '.exerciseKey', 'Exercise key must be a stable descriptive Programming-local key.'))
  }
  if (!exercise.displayName.trim() || forbiddenCompoundName(exercise.displayName)) {
    issues.push(issue('COMPOUND_EXERCISE_NAME', path + '.displayName', 'A slot must describe exactly one Exercise.'))
  }
  if (!VALID_ROLES.includes(exercise.role)) {
    issues.push(issue('ROLE_INVALID', path + '.role', 'Formal exercises must use a valid Role.'))
  }
  if (!VALID_MOVEMENT_PATTERNS.has(exercise.movementPattern)) {
    issues.push(issue('ROLE_INVALID', path + '.movementPattern', 'Movement pattern must be a valid single pattern.'))
  }
  if (exercise.laterality !== 'bilateral' && exercise.laterality !== 'unilateral') {
    issues.push(issue('UNILATERAL_COUNT', path + '.laterality', 'Laterality must be explicit.'))
  }
  if (exercise.fatigueRisk !== 'low' && exercise.fatigueRisk !== 'moderate' && exercise.fatigueRisk !== 'high') {
    issues.push(issue('ROLE_INVALID', path + '.fatigueRisk', 'Fatigue risk must be low, moderate or high.'))
  }
  if (!hasWorkPrescription(exercise.prescription)) {
    issues.push(issue('ROLE_INVALID', path + '.prescription', 'Each formal Exercise needs a measurable work prescription.'))
  }

  for (const [alternativeIndex, alternative] of (exercise.alternatives ?? []).entries()) {
    const alternativePath = path + '.alternatives[' + alternativeIndex + ']'
    if (generatedExerciseKey(alternative.exerciseKey) || alternative.exerciseKey === exercise.exerciseKey) {
      issues.push(issue('ALTERNATIVE_INVALID', alternativePath + '.exerciseKey', 'Alternative must use an independent stable Exercise key.'))
    }
    if (!alternative.displayName.trim() || forbiddenCompoundName(alternative.displayName)) {
      issues.push(issue('ALTERNATIVE_INVALID', alternativePath + '.displayName', 'Alternative must describe one independent Exercise.'))
    }
    if (!['equipment', 'member-fit', 'regression', 'coach-choice', 'skill-track'].includes(alternative.reason)) {
      issues.push(issue('ALTERNATIVE_INVALID', alternativePath + '.reason', 'Alternative reason is required.'))
    }
    const preserves = alternative.preserves
    if (!preserves || typeof preserves.primaryGoal !== 'boolean'
      || typeof preserves.movementPattern !== 'boolean'
      || typeof preserves.stimulus !== 'boolean') {
      issues.push(issue('ALTERNATIVE_INVALID', alternativePath + '.preserves', 'Alternative preservation flags are required.'))
    }
  }
}

const validateSelectableSlot = (
  slot: SelectableExerciseSlot,
  path: string,
  issues: AuditIssue[],
): void => {
  if (!slot.id.trim()) {
    issues.push(issue('SELECTABLE_SLOT_INVALID', path + '.id', 'Selectable slot must have a stable id.'))
  }
  if (slot.required !== true || slot.selectCount !== 1) {
    issues.push(issue('SELECTABLE_SLOT_INVALID', path, 'Selectable slots must require exactly one selection.'))
  }
  if (slot.options.length < 1) {
    issues.push(issue('SELECTABLE_SLOT_INVALID', path + '.options', 'Selectable slots must define at least one approved option.'))
    return
  }

  const optionKeys = slot.options.map((option) => option.exerciseKey)
  if (new Set(optionKeys).size !== optionKeys.length) {
    issues.push(issue('SELECTABLE_SLOT_INVALID', path + '.options', 'Selectable option exercise keys must be unique.'))
  }
  if (!slot.options.some((option) => option.exerciseKey === slot.defaultOptionKey)) {
    issues.push(issue('SELECTABLE_SLOT_INVALID', path + '.defaultOptionKey', 'Default selectable option must belong to the approved option set.'))
  }
  slot.options.forEach((option, optionIndex) => {
    validateExercise(option, path + '.options[' + optionIndex + ']', issues)
    if (option.role !== 'ACCESSORY') {
      issues.push(issue('SELECTABLE_SLOT_INVALID', path + '.options[' + optionIndex + '].role', 'Selectable options must resolve as ACCESSORY exercises.'))
    }
  })

  if (slot.allowComplementaryOption === true) {
    if (slot.options.length !== 2) {
      issues.push(issue('COMPLEMENTARY_SLOT_INVALID', path + '.options', 'Complementary slots must define exactly two approved options.'))
    }
    if (new Set(optionKeys).size !== 2) {
      issues.push(issue('COMPLEMENTARY_SLOT_INVALID', path + '.options', 'Complementary slot options must have unique exercise keys.'))
    }
    if (slot.options.some((option) => option.role !== 'ACCESSORY')) {
      issues.push(issue('COMPLEMENTARY_SLOT_INVALID', path + '.options', 'Both complementary options must use role ACCESSORY.'))
    }
  }
}

const validatePrepAndRamp = (
  level: ProgrammingTemplateLevel,
  issues: AuditIssue[],
): void => {
  if (level.prep.length < 2 || level.prep.length > 4) {
    issues.push(issue('PREP_COUNT', 'prep', 'Prep must contain 2–4 targeted preparation items.'))
  }
  if (!level.prep.some((item) => item.phase === 'P')
    && !level.rampUp.some((set) => set.targetRole === 'PRIMARY')) {
    issues.push(issue('PATTERN_PREP_REQUIRED', 'prep', 'Pattern preparation must be provided by a P Prep item or a Primary-targeted ramp-up.'))
  }
  level.prep.forEach((item, index) => {
    const path = 'prep[' + index + ']'
    if (generatedExerciseKey(item.exerciseKey)) {
      issues.push(issue('EXERCISE_KEY_INVALID', path + '.exerciseKey', 'Prep must use a stable Exercise key.'))
    }
    if (!item.displayName.trim() || forbiddenCompoundName(item.displayName)) {
      issues.push(issue('COMPOUND_EXERCISE_NAME', path + '.displayName', 'Prep slots must describe one Exercise.'))
    }
    if (/泡沫轴|筋膜球|foam\s*roll/i.test(item.displayName)) {
      issues.push(issue('FOAM_ROLLING_IN_PREP', path + '.displayName', 'Foam rolling is Individual Prep, not fixed template Prep.'))
    }
  })

  if (level.rampUp.length < 1 || level.rampUp.length > 3) {
    issues.push(issue('RAMP_COUNT', 'rampUp', 'Specific Ramp-up must contain 1–3 sets.'))
  }
  const orders = level.rampUp.map((set) => set.order)
  if (orders.some((order, index) => order !== index + 1)) {
    issues.push(issue('RAMP_COUNT', 'rampUp.order', 'Ramp-up order must be sequential and explicit.'))
  }
  level.rampUp.forEach((set, index) => {
    if (generatedExerciseKey(set.exerciseKey)) {
      issues.push(issue('EXERCISE_KEY_INVALID', 'rampUp[' + index + '].exerciseKey', 'Ramp-up must use a stable Exercise key.'))
    }
  })
}

const validateBlockStructure = (
  level: ProgrammingTemplateLevel,
  issues: AuditIssue[],
): void => {
  const expectedKinds: readonly TrainingBlock['kind'][] = level.programLevel === 'l1' || level.programLevel === 'l2'
    ? ['circuit']
    : ['strength', 'circuit']
  const actualKinds = level.blocks.map((block) => block.kind)
  if (actualKinds.length !== expectedKinds.length
    || actualKinds.some((kind, index) => kind !== expectedKinds[index])) {
    issues.push(issue('BLOCK_ORDER', 'blocks', 'Block structure does not match the Program Level.'))
  }

  level.blocks.forEach((block, blockIndex) => {
    const path = 'blocks[' + blockIndex + ']'
    if (block.kind === 'circuit') {
      const rounds = countRange(block.rounds)
      if (!rounds || rounds.min <= 0) {
        issues.push(issue('CIRCUIT_ROUNDS', path + '.rounds', 'Circuit Block must define positive rounds.'))
      }
      getTrainingExercises(block).forEach((exercise, exerciseIndex) => {
        const exercisePath = path + '.exercises[' + exerciseIndex + ']'
        if (exercise.prescription.sets !== undefined) {
          issues.push(issue('CIRCUIT_SETS_FORBIDDEN', exercisePath + '.prescription.sets', 'Circuit work is expressed per round, not action-level sets.'))
        }
        if ((level.programLevel === 'l3' || level.programLevel === 'l4') && exercise.fatigueRisk === 'high') {
          issues.push(issue('HIGH_RISK_IN_CIRCUIT', exercisePath, 'L3/L4 3C Circuit cannot contain high-risk actions.'))
        }
      })
    }
    if (block.kind === 'strength') {
      if (block.rounds !== undefined) {
        issues.push(issue('BLOCK_ORDER', path + '.rounds', 'Strength Block cannot use circuit rounds.'))
      }
      getTrainingExercises(block).forEach((exercise, exerciseIndex) => {
        if (countRange(exercise.prescription.sets) === null) {
          issues.push(issue('STRENGTH_SETS_REQUIRED', path + '.exercises[' + exerciseIndex + '].prescription.sets', 'Strength actions must define sets.'))
        }
      })
    }
  })
}

const validateFatigueStack = (
  level: ProgrammingTemplateLevel,
  issues: AuditIssue[],
): void => {
  level.blocks.forEach((block, blockIndex) => {
    const exercises = getTrainingExercises(block)
    for (let index = 1; index < exercises.length; index += 1) {
      const previous = exercises[index - 1]
      const current = exercises[index]
      if (previous.fatigueRisk === 'high'
        && current.fatigueRisk === 'high'
        && previous.movementPattern === current.movementPattern) {
        issues.push(issue(
          'PATTERN_FATIGUE_STACK',
          'blocks[' + blockIndex + '].exercises[' + index + ']',
          'Adjacent high-fatigue actions must not repeat the same movement pattern.',
        ))
      }
    }
  })
}

export const auditSharedTemplateLevel = (
  level: ProgrammingTemplateLevel,
): AuditIssue[] => {
  const issues: AuditIssue[] = []
  if (!level.primaryGoal.trim()) {
    issues.push(issue('GOAL_COUNT', 'primaryGoal', 'Every level must define a Primary Goal.'))
  }

  const formalExercises = allExercises(level)
  const primaryCount = formalExercises.filter((exercise) => exercise.role === 'PRIMARY').length
  if (primaryCount !== 1) {
    issues.push(issue('PRIMARY_COUNT', 'blocks', 'Every level must contain exactly one PRIMARY exercise.'))
  }
  formalExercises.forEach((exercise, index) => validateExercise(exercise, 'exercise[' + index + ']', issues))
  level.blocks.forEach((block, blockIndex) => {
    block.exercises.forEach((entry, entryIndex) => {
      if (isSelectableExerciseSlot(entry)) {
        validateSelectableSlot(entry, 'blocks[' + blockIndex + '].exercises[' + entryIndex + ']', issues)
      }
    })
  })
  validatePrepAndRamp(level, issues)
  validateFatigueStack(level, issues)

  const unilateralCount = formalExercises.filter((exercise) => exercise.laterality === 'unilateral').length
  if (unilateralCount > 5) {
    issues.push(issue('UNILATERAL_COUNT', 'blocks', 'The fixed template must not accumulate excessive unilateral demands.'))
  }

  return issues
}

export const audit3CTemplateLevel = (
  level: ProgrammingTemplateLevel,
): AuditIssue[] => {
  const issues = auditSharedTemplateLevel(level)
  validateBlockStructure(level, issues)

  const estimate = estimateSessionMinutes(level)
  if (estimate.totalMinutes.max > 60) {
    issues.push(issue('TIME_OVER_BUDGET', 'estimatedMinutes', 'Calculated session maximum exceeds 60 minutes.'))
  }
  const manualMax = level.estimatedMinutes.max
  const calculatedMax = estimate.totalMinutes.max
  if (!Number.isFinite(manualMax)
    || manualMax < calculatedMax
    || manualMax - calculatedMax > 10) {
    issues.push(issue('ESTIMATE_MISMATCH', 'estimatedMinutes.max', 'Manual maximum must cover the calculated maximum and stay within a 10-minute gap.'))
  }

  return issues
}

// Preserve the Phase 1 public API for callers that audit a 3C level directly.
export const auditTemplateLevel = audit3CTemplateLevel

const normalizeCount = (value: Count | undefined): NumericRange | null => {
  if (value === undefined) return null
  return typeof value === 'number'
    ? { min: value, max: value }
    : { min: value.min, max: value.max }
}

const sameCount = (actual: Count | undefined, expected: Count | undefined): boolean => {
  const actualRange = normalizeCount(actual)
  const expectedRange = normalizeCount(expected)
  return actualRange?.min === expectedRange?.min
    && actualRange?.max === expectedRange?.max
}

const PRESCRIPTION_FIELDS: readonly (keyof ExercisePrescription)[] = [
  'sets',
  'reps',
  'durationSeconds',
  'distanceMeters',
  'rpe',
  'rir',
]

const samePrescription = (
  actual: ExercisePrescription,
  expected: ExercisePrescription,
): boolean => PRESCRIPTION_FIELDS.every((field) => sameCount(actual[field], expected[field]))

type ExerciseExpectation = Pick<TrainingExercise, 'exerciseKey' | 'role' | 'laterality'> & {
  prescription: ExercisePrescription
}

const matchesExercise = (
  actual: TrainingExercise | undefined,
  expected: ExerciseExpectation | undefined,
): boolean => Boolean(
  actual
  && expected
  && actual.exerciseKey === expected.exerciseKey
  && actual.role === expected.role
  && actual.laterality === expected.laterality
  && samePrescription(actual.prescription, expected.prescription),
)

const matchesExerciseBlock = (
  level: ProgrammingTemplateLevel,
  blockIndex: number,
  expected: readonly ExerciseExpectation[],
): boolean => {
  const actual = level.blocks[blockIndex]
    ? getTrainingExercises(level.blocks[blockIndex])
    : undefined
  return Boolean(
    actual
    && actual.length === expected.length
    && actual.every((exercise, index) => matchesExercise(exercise, expected[index])),
  )
}

const hasBarbellLanguage = (level: ProgrammingTemplateLevel): boolean => (
  [
    ...level.prep.map((item) => item.displayName),
    ...level.rampUp.map((item) => item.displayName),
    ...allExercises(level).flatMap((item) => [
      item.displayName,
      ...(item.alternatives ?? []).map((item) => item.displayName),
    ]),
  ].some((name) => /barbell|杠铃/i.test(name))
)

const validateSpecialCases = (
  template: ProgrammingTemplate,
  issues: AuditIssue[],
): void => {
  const l1 = template.levels.l1
  const l4 = template.levels.l4

  if (template.id === '3c3') {
    const expectedL1Exercises: ExerciseExpectation[] = [
      {
        exerciseKey: 'supported-split-squat',
        role: 'PRIMARY',
        laterality: 'unilateral',
        prescription: { reps: { min: 8, max: 10 }, rir: { min: 3, max: 4 } },
      },
      {
        exerciseKey: 'seated-row',
        role: 'SECONDARY',
        laterality: 'bilateral',
        prescription: { reps: { min: 10, max: 12 } },
      },
      {
        exerciseKey: 'machine-chest-press',
        role: 'SECONDARY',
        laterality: 'bilateral',
        prescription: { reps: 10 },
      },
      {
        exerciseKey: 'bilateral-farmer-carry',
        role: 'CARRY',
        laterality: 'bilateral',
        prescription: { distanceMeters: 20 },
      },
      {
        exerciseKey: 'dead-bug',
        role: 'CORE',
        laterality: 'bilateral',
        prescription: { reps: { min: 8, max: 10 } },
      },
    ]
    if (!matchesExerciseBlock(l1, 0, expectedL1Exercises)) {
      issues.push(issue('SPECIAL_CASE', template.id + '/l1', '3C03 L1 must use one supported split squat plus row, chest press, bilateral Farmer Carry and dead bug.'))
    }
    if (l1.blocks[0] && getTrainingExercises(l1.blocks[0]).filter((exercise) => exercise.movementPattern === 'single').length !== 1) {
      issues.push(issue('SPECIAL_CASE', template.id + '/l1', '3C03 L1 may contain only one knee-dominant single-leg action.'))
    }

    const l4Circuit = l4.blocks[1]
    const l4Rounds = countRange(l4Circuit?.rounds)
    const expectedL4Strength: ExerciseExpectation[] = [
      {
        exerciseKey: 'front-foot-elevated-split-squat',
        role: 'PRIMARY',
        laterality: 'unilateral',
        prescription: { sets: { min: 3, max: 4 }, reps: { min: 6, max: 8 }, rir: 2 },
      },
      {
        exerciseKey: 'chest-supported-row',
        role: 'SECONDARY',
        laterality: 'bilateral',
        prescription: { sets: 3, reps: { min: 6, max: 8 }, rir: 2 },
      },
    ]
    const expectedL4Circuit: ExerciseExpectation[] = [
      {
        exerciseKey: 'double-dumbbell-rdl',
        role: 'SECONDARY',
        laterality: 'bilateral',
        prescription: { reps: 8 },
      },
      {
        exerciseKey: 'seated-dumbbell-shoulder-press',
        role: 'SECONDARY',
        laterality: 'bilateral',
        prescription: { reps: { min: 6, max: 8 } },
      },
      {
        exerciseKey: 'suitcase-carry',
        role: 'CARRY',
        laterality: 'unilateral',
        prescription: { distanceMeters: 20 },
      },
    ]
    if (!matchesExerciseBlock(l4, 0, expectedL4Strength)
      || !matchesExerciseBlock(l4, 1, expectedL4Circuit)
      || l4Rounds?.min !== 2
      || l4Rounds?.max !== 3
      || !sameCount(l4Circuit?.restBetweenRoundsSeconds, 90)
      || (l4Circuit ? getTrainingExercises(l4Circuit).some((exercise) => exercise.prescription.sets !== undefined) : false)) {
      issues.push(issue('SPECIAL_CASE', template.id + '/l4', '3C03 L4 must use the frozen Strength plus three-action Circuit prescription.'))
    }
  }

  if (template.id === '3c6') {
    const programLevels: ProgramLevel[] = ['l1', 'l2', 'l3', 'l4']
    if (programLevels.some((programLevel) => hasBarbellLanguage(template.levels[programLevel]))) {
      issues.push(issue('SPECIAL_CASE', template.id, '3C06 must keep KB/DB language and contain no barbell language.'))
    }
    const expectedL4Strength: ExerciseExpectation[] = [
      {
        exerciseKey: 'heavy-double-dumbbell-rdl',
        role: 'PRIMARY',
        laterality: 'bilateral',
        prescription: { sets: { min: 3, max: 4 }, reps: { min: 5, max: 6 }, rir: 2 },
      },
      {
        exerciseKey: 'dumbbell-chest-supported-row',
        role: 'SECONDARY',
        laterality: 'bilateral',
        prescription: { sets: 3, reps: { min: 6, max: 8 }, rir: 2 },
      },
    ]
    const expectedL4Circuit: ExerciseExpectation[] = [
      {
        exerciseKey: 'double-dumbbell-front-squat',
        role: 'SECONDARY',
        laterality: 'bilateral',
        prescription: { reps: { min: 6, max: 8 } },
      },
      {
        exerciseKey: 'seated-dumbbell-shoulder-press',
        role: 'SECONDARY',
        laterality: 'bilateral',
        prescription: { reps: { min: 6, max: 8 } },
      },
      {
        exerciseKey: 'bilateral-farmer-carry',
        role: 'CARRY',
        laterality: 'bilateral',
        prescription: { distanceMeters: { min: 20, max: 30 } },
      },
    ]
    const primaryAlternative = l4.blocks[0] ? getTrainingExercises(l4.blocks[0])[0]?.alternatives?.[0] : undefined
    const alternativeValid = primaryAlternative?.exerciseKey === 'double-kettlebell-rdl'
      && primaryAlternative.reason === 'equipment'
      && primaryAlternative.preserves.primaryGoal === true
      && primaryAlternative.preserves.movementPattern === true
      && primaryAlternative.preserves.stimulus === true
    if (!matchesExerciseBlock(l4, 0, expectedL4Strength)
      || !matchesExerciseBlock(l4, 1, expectedL4Circuit)
      || !alternativeValid) {
      issues.push(issue('SPECIAL_CASE', template.id + '/l4', '3C06 L4 must use the frozen heavy double-dumbbell Strength Block and KB/DB Circuit.'))
    }
  }
}

const validateTemplateSetShape = (
  templates: readonly ProgrammingTemplate[],
  issues: AuditIssue[],
): void => {
  const expectedIds = ['3c1', '3c2', '3c3', '3c4', '3c5', '3c6']
  if (templates.length !== expectedIds.length
    || templates.map((template) => template.id).join('|') !== expectedIds.join('|')) {
    issues.push(issue('TEMPLATE_SET', 'templates', 'The Programming source must contain exactly 3c1 through 3c6.'))
  }
  const seen = new Set<string>()
  templates.forEach((template, templateIndex) => {
    if (seen.has(template.id)) {
      issues.push(issue('TEMPLATE_SET', 'templates[' + templateIndex + '].id', 'Template IDs must be unique.'))
    }
    seen.add(template.id)
    const levels = Object.keys(template.levels)
    if (levels.length !== 4 || !['l1', 'l2', 'l3', 'l4'].every((programLevel) => levels.includes(programLevel))) {
      issues.push(issue('LEVEL_SET', 'templates[' + templateIndex + '].levels', 'Every template must contain L1 through L4.'))
    }
  })
}

export const audit3CTemplateSet = (
  templates: readonly ProgrammingTemplate[],
): AuditIssue[] => {
  const issues: AuditIssue[] = []
  validateTemplateSetShape(templates, issues)

  for (const template of templates) {
    const levels = (['l1', 'l2', 'l3', 'l4'] as const).map((programLevel) => template.levels[programLevel])
    levels.forEach((level) => {
      if (!level) {
        issues.push(issue('LEVEL_SET', template.id, 'Template level is missing.'))
        return
      }
      for (const levelIssue of audit3CTemplateLevel(level)) {
        issues.push({
          ...levelIssue,
          path: template.id + '/' + level.programLevel + '/' + levelIssue.path,
        })
      }
    })

    for (let index = 1; index < levels.length; index += 1) {
      if (levels[index - 1] && levels[index] && !hasProgression(levels[index - 1], levels[index])) {
        issues.push(issue('PROGRESSION_MISSING', template.id + '/l' + (index + 1), 'Each adjacent level needs a load, volume, rest, density, range or control progression.'))
      }
    }

    const unilateralCounts = levels.map((level) => (
      level ? allExercises(level).filter((exercise) => exercise.laterality === 'unilateral').length : 0
    ))
    if (template.id !== '3c3' && unilateralCounts.some((count) => count > 2)) {
      issues.push(issue('UNILATERAL_COUNT', template.id, 'Non-3C03 templates must not add unilateral demand merely to signal a higher level.'))
    }
    validateSpecialCases(template, issues)
  }

  return issues
}

// Preserve the Phase 1 public API for the 3C source set.
export const auditTemplateSet = audit3CTemplateSet

const sumRanges = (ranges: NumericRange[]): NumericRange => ranges.reduce(
  (total, range) => addRange(total, range),
  { min: 0, max: 0 },
)

type ResolvableProgrammingLevel = ProgrammingTemplateLevel | ResolvedProgrammingLevel

const isResolvedProgrammingLevel = (
  level: ResolvableProgrammingLevel,
): level is ResolvedProgrammingLevel => 'selections' in level

const resolvedLevelFor = (
  level: ResolvableProgrammingLevel,
  selection?: ProgrammingSelection,
): ResolvedProgrammingLevel => (
  isResolvedProgrammingLevel(level) ? level : resolveProgrammingLevel(level, selection)
)

export const calculateWorkingSetEstimate = (
  level: ResolvableProgrammingLevel,
  selection?: ProgrammingSelection,
): NumericRange => {
  const resolved = resolvedLevelFor(level, selection)
  return sumRanges(resolved.exercises.map((exercise) => toRange(exercise.prescription.sets, 1)))
}

// Descriptive alias for callers that prefer the metric's full name.
export const calculateTotalWorkingSets = calculateWorkingSetEstimate

const bodySelectionScenarios = (
  level: ProgrammingTemplateLevel,
): ProgrammingSelection[] => {
  const slots = level.blocks.flatMap((block) => block.exercises.filter(isSelectableExerciseSlot))
  const fixedOptional = level.blocks.some((block) => getTrainingExercises(block).some((exercise) => exercise.optional === true))
  let scenarios: ProgrammingSelection[] = [{}]

  for (const slot of slots) {
    scenarios = scenarios.flatMap((scenario) => slot.options.map((option) => ({
      ...scenario,
      selectable: {
        ...(scenario.selectable ?? {}),
        [slot.id]: option.exerciseKey,
      },
    })))
  }

  if (slots.some((slot) => slot.allowComplementaryOption === true)) {
    scenarios = scenarios.flatMap((scenario) => [
      scenario,
      { ...scenario, includeComplementaryOption: true },
    ])
  }
  if (fixedOptional) {
    scenarios = scenarios.flatMap((scenario) => [
      scenario,
      { ...scenario, includeOptional: true },
    ])
  }
  return scenarios
}

const validateBodyBlockStructure = (
  level: ProgrammingTemplateLevel,
  issues: AuditIssue[],
): void => {
  if (level.blocks.length !== 1 || level.blocks[0]?.kind !== 'strength') {
    issues.push(issue('BODY_BLOCK_STRUCTURE', 'blocks', 'BODY must contain one Strength / Volume Block.'))
  }
  level.blocks.forEach((block, blockIndex) => {
    const path = 'blocks[' + blockIndex + ']'
    if (block.kind === 'circuit') {
      issues.push(issue('BODY_CIRCUIT_FORBIDDEN', path, 'BODY does not use Circuit Blocks.'))
    }
    if (block.kind === 'strength') {
      if (block.rounds !== undefined) {
        issues.push(issue('BODY_BLOCK_STRUCTURE', path + '.rounds', 'BODY Strength Block cannot define circuit rounds.'))
      }
      getTrainingExercises(block).forEach((exercise, exerciseIndex) => {
        if (countRange(exercise.prescription.sets) === null) {
          issues.push(issue('STRENGTH_SETS_REQUIRED', path + '.exercises[' + exerciseIndex + '].prescription.sets', 'BODY Strength actions must define sets.'))
        }
      })
    }
  })
}

export const auditBodyTemplateLevel = (
  level: ProgrammingTemplateLevel,
  selection?: ProgrammingSelection,
): AuditIssue[] => {
  const issues = auditSharedTemplateLevel(level)
  validateBodyBlockStructure(level, issues)

  const scenarios = selection ? [selection] : bodySelectionScenarios(level)
  scenarios.forEach((scenario, scenarioIndex) => {
    let resolved: ResolvedProgrammingLevel
    try {
      resolved = resolvedLevelFor(level, scenario)
    } catch (error) {
      issues.push(issue(
        'RESOLUTION_INVALID',
        'scenario[' + scenarioIndex + ']',
        error instanceof Error ? error.message : 'Programming selection could not be resolved.',
      ))
      return
    }

    const workingSets = calculateWorkingSetEstimate(resolved)
    if (workingSets.min < 12 || workingSets.max > 16) {
      issues.push(issue(
        'WORKING_SET_RANGE',
        'scenario[' + scenarioIndex + '].blocks',
        'BODY total working sets must remain within 12–16 for every resolved scenario.',
      ))
    }

    const fixedExerciseCount = resolved.exercises.filter((exercise) => exercise.optional !== true).length
    const totalExerciseCount = resolved.exercises.length
    if (fixedExerciseCount < 4 || fixedExerciseCount > 5 || totalExerciseCount > 6) {
      issues.push(issue(
        'BODY_EXERCISE_COUNT',
        'scenario[' + scenarioIndex + '].exercises',
        'BODY defaults must contain 4–5 exercises and optional additions may not exceed 6.',
      ))
    }

    const estimate = estimateSessionMinutes(resolved)
    if (estimate.totalMinutes.max > 60) {
      issues.push(issue('TIME_OVER_BUDGET', 'scenario[' + scenarioIndex + '].estimatedMinutes', 'Calculated BODY session maximum exceeds 60 minutes.'))
    }
    const manualMax = level.estimatedMinutes.max
    const calculatedMax = estimate.totalMinutes.max
    if (!Number.isFinite(manualMax)
      || manualMax < calculatedMax
      || manualMax - calculatedMax > 10) {
      issues.push(issue('ESTIMATE_MISMATCH', 'estimatedMinutes.max', 'Manual maximum must cover every calculated scenario maximum and stay within a 10-minute gap.'))
    }
  })

  return issues
}

const validateBodyTemplateSetShape = (
  templates: readonly ProgrammingTemplate[],
  issues: AuditIssue[],
): void => {
  const expectedIds = ['body1', 'body2', 'body3', 'body4', 'body5']
  if (templates.length !== expectedIds.length
    || templates.map((template) => template.id).join('|') !== expectedIds.join('|')) {
    issues.push(issue('TEMPLATE_SET', 'templates', 'The BODY Programming source must contain exactly body1 through body5.'))
  }
  const seen = new Set<string>()
  templates.forEach((template, templateIndex) => {
    if (seen.has(template.id)) {
      issues.push(issue('TEMPLATE_SET', 'templates[' + templateIndex + '].id', 'Template IDs must be unique.'))
    }
    seen.add(template.id)
    const levels = Object.keys(template.levels)
    if (levels.length !== 4 || !['l1', 'l2', 'l3', 'l4'].every((programLevel) => levels.includes(programLevel))) {
      issues.push(issue('LEVEL_SET', 'templates[' + templateIndex + '].levels', 'Every BODY template must contain L1 through L4.'))
    }
  })
}

export const auditBodyTemplateSet = (
  templates: readonly ProgrammingTemplate[],
): AuditIssue[] => {
  const issues: AuditIssue[] = []
  validateBodyTemplateSetShape(templates, issues)
  for (const template of templates) {
    const levels = (['l1', 'l2', 'l3', 'l4'] as const).map((programLevel) => template.levels[programLevel])
    levels.forEach((level) => {
      if (!level) {
        issues.push(issue('LEVEL_SET', template.id, 'Template level is missing.'))
        return
      }
      auditBodyTemplateLevel(level).forEach((levelIssue) => {
        issues.push({
          ...levelIssue,
          path: template.id + '/' + level.programLevel + '/' + levelIssue.path,
        })
      })
    })
    for (let index = 1; index < levels.length; index += 1) {
      if (levels[index - 1] && levels[index] && !hasProgression(levels[index - 1], levels[index])) {
        issues.push(issue('PROGRESSION_MISSING', template.id + '/l' + (index + 1), 'Each adjacent BODY level needs a load, volume, rest, range or control progression.'))
      }
    }
  }
  return issues
}

export const auditProgrammingTemplateSet = (
  templates: readonly ProgrammingTemplate[],
): AuditIssue[] => {
  const issues: AuditIssue[] = []
  const threeC = templates.filter((template) => template.system === '3c')
  const body = templates.filter((template) => template.system === 'body')
  if (threeC.length > 0) issues.push(...audit3CTemplateSet(threeC))
  if (body.length > 0) issues.push(...auditBodyTemplateSet(body))
  if (templates.some((template) => template.system !== '3c' && template.system !== 'body')) {
    issues.push(issue('SYSTEM_INVALID', 'templates', 'Programming templates must use a supported system.'))
  }
  return issues
}

const workRange = (prescription: ExercisePrescription, laterality?: Laterality): WorkRange => {
  const base = prescription.durationSeconds !== undefined
    ? toRange(prescription.durationSeconds)
    : prescription.distanceMeters !== undefined
      ? multiplyRange(toRange(prescription.distanceMeters), DEFAULT_SECONDS_PER_METER)
      : prescription.reps !== undefined
        ? multiplyRange(toRange(prescription.reps), DEFAULT_SECONDS_PER_REP)
        : { min: 0, max: 0 }

  if (laterality !== 'unilateral') {
    return {
      base,
      unilateralAdjustment: { min: 0, max: 0 },
    }
  }

  return {
    base: multiplyRange(base, 2),
    unilateralAdjustment: {
      min: DEFAULT_UNILATERAL_RESET_SECONDS,
      max: DEFAULT_UNILATERAL_RESET_SECONDS,
    },
  }
}

const itemSetupRange = (count: number): NumericRange => ({
  min: count * DEFAULT_ITEM_SETUP_SECONDS,
  max: count * DEFAULT_ITEM_SETUP_SECONDS,
})

const blockBufferRange = (count: number): NumericRange => ({
  min: count * DEFAULT_BLOCK_BUFFER_SECONDS,
  max: count * DEFAULT_BLOCK_BUFFER_SECONDS,
})

/**
 * Conservative private-coaching planning window floors for the fixed 3C levels.
 * This overhead is separate from equipment setup and never replaces the
 * measurable-work validation performed by auditTemplateLevel.
 */
const MINIMUM_PLANNING_WINDOW_SECONDS: Record<ProgramLevel, number> = {
  l1: 34 * 60,
  l2: 37 * 60,
  l3: 42 * 60,
  l4: 44 * 60,
}

const minimumPlanningWindowSeconds = (level: ProgrammingTemplateLevel): number => (
  MINIMUM_PLANNING_WINDOW_SECONDS[level.programLevel]
  + level.blocks
    .filter((block) => block.kind === 'circuit')
    .reduce((total, block) => total + block.exercises.length * 2 * 60, 0)
)

const exerciseSets = (exercise: TrainingExercise): NumericRange => toRange(exercise.prescription.sets, 1)

const estimatePrep = (level: ProgrammingTemplateLevel) => {
  const work = level.prep.map((item) => workRange(item.prescription, item.laterality))
  const baseWork = sumRanges(work.map((item) => item.base))
  const unilateralAdjustment = sumRanges(work.map((item) => item.unilateralAdjustment))
  const setup = itemSetupRange(level.prep.length)
  const transitions = {
    min: Math.max(0, level.prep.length - 1) * DEFAULT_STATION_TRANSITION_SECONDS,
    max: Math.max(0, level.prep.length - 1) * DEFAULT_STATION_TRANSITION_SECONDS,
  }

  return {
    base: addRange(addRange(baseWork, setup), transitions),
    unilateralAdjustment,
  }
}

const estimateRampUp = (level: ProgrammingTemplateLevel) => {
  const ranges = level.rampUp.map((set) => {
    const reps = multiplyRange(toRange(set.reps), DEFAULT_SECONDS_PER_REP)
    const work = set.laterality === 'unilateral' ? multiplyRange(reps, 2) : reps
    const rest = toRange(set.restSeconds)
    return addRange(addRange(work, rest), itemSetupRange(1))
  })

  return {
    base: sumRanges(ranges),
    unilateralAdjustment: sumRanges(level.rampUp.map((set) => (
      set.laterality === 'unilateral'
        ? { min: DEFAULT_UNILATERAL_RESET_SECONDS, max: DEFAULT_UNILATERAL_RESET_SECONDS }
        : { min: 0, max: 0 }
    ))),
  }
}

const estimateStrength = (block: TrainingBlock) => {
  const execution: NumericRange[] = []
  const rest: NumericRange[] = []
  const unilateralAdjustment: NumericRange[] = []

  for (const exercise of getTrainingExercises(block)) {
    const sets = exerciseSets(exercise)
    const work = workRange(exercise.prescription, exercise.laterality)
    execution.push(multiplyRange(work.base, sets))
    unilateralAdjustment.push(multiplyRange(work.unilateralAdjustment, sets))

    const effectiveRest = exercise.restSeconds
      ?? block.restBetweenSetsSeconds
      ?? DEFAULT_STRENGTH_REST_SECONDS
    const intervals = {
      min: Math.max(0, sets.min - 1),
      max: Math.max(0, sets.max - 1),
    }
    rest.push(multiplyRange(toRange(effectiveRest), intervals))
  }

  return {
    execution: sumRanges(execution),
    rest: sumRanges(rest),
    unilateralAdjustment: sumRanges(unilateralAdjustment),
  }
}

const estimateCircuit = (block: TrainingBlock) => {
  const rounds = toRange(block.rounds, 1)
  const exercises = getTrainingExercises(block)
  const work = exercises.map((exercise) => workRange(exercise.prescription, exercise.laterality))
  const basePerRound = sumRanges(work.map((item) => item.base))
  const unilateralPerRound = sumRanges(work.map((item) => item.unilateralAdjustment))
  const transitionSeconds = toRange(block.transitionSeconds, DEFAULT_STATION_TRANSITION_SECONDS)
  const stationCount = Math.max(0, exercises.length - 1)
  const stationTransitions = multiplyRange(
    transitionSeconds,
    {
      min: stationCount * rounds.min,
      max: stationCount * rounds.max,
    },
  )
  const roundRestSeconds = toRange(block.restBetweenRoundsSeconds, DEFAULT_ROUND_REST_SECONDS)
  const roundRest = multiplyRange(roundRestSeconds, {
    min: Math.max(0, rounds.min - 1),
    max: Math.max(0, rounds.max - 1),
  })

  return {
    work: multiplyRange(basePerRound, rounds),
    unilateralAdjustment: multiplyRange(unilateralPerRound, rounds),
    stationTransitions,
    roundRest,
  }
}

export const estimateSessionMinutes = (
  level: ProgrammingTemplateLevel,
): SessionTimeEstimate => {
  const prep = estimatePrep(level)
  const rampUp = estimateRampUp(level)
  const strengthBlocks = level.blocks.filter((block) => block.kind === 'strength')
  const circuitBlocks = level.blocks.filter((block) => block.kind === 'circuit')
  const strength = strengthBlocks.map(estimateStrength)
  const circuit = circuitBlocks.map(estimateCircuit)

  const strengthExecution = sumRanges(strength.map((item) => item.execution))
  const strengthRest = sumRanges(strength.map((item) => item.rest))
  const circuitWork = sumRanges(circuit.map((item) => item.work))
  const transitions = sumRanges(circuit.map((item) => item.stationTransitions))
  const roundRest = sumRanges(circuit.map((item) => item.roundRest))
  const unilateralAdjustment = sumRanges([
    prep.unilateralAdjustment,
    rampUp.unilateralAdjustment,
    ...strength.map((item) => item.unilateralAdjustment),
    ...circuit.map((item) => item.unilateralAdjustment),
  ])
  const baseEquipmentBuffer = addRange(
    blockBufferRange(level.blocks.length),
    itemSetupRange(level.blocks.reduce((count, block) => count + block.exercises.length, 0)),
  )

  const totalBeforeEquipmentBuffer = sumRanges([
    prep.base,
    rampUp.base,
    strengthExecution,
    strengthRest,
    circuitWork,
    transitions,
    roundRest,
    unilateralAdjustment,
  ])
  const equipmentBuffer = baseEquipmentBuffer
  const totalWithEquipmentBuffer = addRange(totalBeforeEquipmentBuffer, equipmentBuffer)
  const planningOverheadSupplement = Math.max(
    0,
    minimumPlanningWindowSeconds(level) - totalWithEquipmentBuffer.max,
  )
  const planningOverhead = {
    min: planningOverheadSupplement,
    max: planningOverheadSupplement,
  }
  const totalSeconds = addRange(totalWithEquipmentBuffer, planningOverhead)

  return {
    prepMinutes: prep.base.max / 60,
    rampUpMinutes: rampUp.base.max / 60,
    strengthExecutionMinutes: strengthExecution.max / 60,
    strengthRestMinutes: strengthRest.max / 60,
    circuitWorkMinutes: circuitWork.max / 60,
    transitionMinutes: transitions.max / 60,
    roundRestMinutes: roundRest.max / 60,
    unilateralAdjustmentMinutes: unilateralAdjustment.max / 60,
    equipmentBufferMinutes: equipmentBuffer.max / 60,
    planningOverheadMinutes: planningOverhead.max / 60,
    totalMinutes: {
      min: totalSeconds.min / 60,
      max: totalSeconds.max / 60,
    },
  }
}
