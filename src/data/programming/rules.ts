import type {
  ConditioningRoundPolicy,
  ConditioningPowerPath,
  ConditioningSessionTimeComponentsSeconds,
  Count,
  ExercisePrescription,
  ExerciseRole,
  Laterality,
  NumericRange,
  PowerTrackSlot,
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
import { getTrainingExercises, isPowerTrackSlot, isSelectableExerciseSlot } from './types'

const DEFAULT_SECONDS_PER_REP = 4
const DEFAULT_SECONDS_PER_METER = 1
const DEFAULT_ITEM_SETUP_SECONDS = 15
const DEFAULT_STATION_TRANSITION_SECONDS = 20
const DEFAULT_STRENGTH_REST_SECONDS = 90
const DEFAULT_ROUND_REST_SECONDS = 75
const DEFAULT_BLOCK_BUFFER_SECONDS = 45
const DEFAULT_UNILATERAL_RESET_SECONDS = 10
const DEFAULT_STRENGTH_TRANSITION_SECONDS = 45

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

const VALID_CONDITIONING_OUTPUT_KINDS = new Set([
  'work-bout-distance',
  'pace',
  'power',
  'erg-output',
  'sled-split-time',
  'carry-load',
  'carry-distance',
  'completion-time',
  'round-completion-time',
  'power-quality',
  'explosive-reps',
  'velocity',
  'throw-distance',
  'locomotion-quality',
])

const VALID_CONDITIONING_OUTPUT_SCOPES = new Set(['bout', 'set', 'station', 'round', 'level'])

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
    const optionKeys = slot.options.map((option) => option.exerciseKey)
    if (slot.allowComplementaryOption !== true
      || slot.options.length !== 2
      || new Set(optionKeys).size !== 2
      || slot.options.some((option) => option.role !== 'ACCESSORY')) {
      throw new Error(`${path}: complementary option requires exactly two unique ACCESSORY options`)
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

type ResolvedPowerTrack = {
  path: ConditioningPowerPath
  requestedOptionKey?: string
  resolvedOptionKey: string
  mode: 'selected-track' | 'fallback-option' | 'foundation-regression'
}

const resolvePowerTrackSlot = (
  slot: PowerTrackSlot,
  selection: ProgrammingSelection,
  path: string,
): ResolvedPowerTrack => {
  const selected = selection.powerTracks?.[slot.id]
  const requestedOptionKey = selected?.optionKey
  const requestedKey = requestedOptionKey ?? slot.defaultSelection

  if (requestedKey === 'foundation-regression') {
    if (!slot.foundationRegression) {
      throw new Error(path + ': Foundation Regression is not configured for this Power Track')
    }
    return {
      path: slot.foundationRegression,
      requestedOptionKey,
      resolvedOptionKey: slot.foundationRegression.powerExercise.exerciseKey,
      mode: 'foundation-regression',
    }
  }

  const option = slot.options.find((candidate) => candidate.optionKey === requestedKey)
  if (!option) {
    throw new Error(path + ': Power Track option "' + requestedKey + '" is not approved for this slot')
  }

  if (option.requiresTechniqueCompetency && selected?.techniqueReady !== true) {
    if (slot.fallbackOptionKey) {
      const fallback = slot.options.find((candidate) => candidate.optionKey === slot.fallbackOptionKey)
      if (!fallback) {
        throw new Error(path + ': configured Power Track fallback is not approved for this slot')
      }
      return {
        path: fallback.path,
        requestedOptionKey,
        resolvedOptionKey: fallback.path.powerExercise.exerciseKey,
        mode: 'fallback-option',
      }
    }
    if (slot.foundationRegression) {
      return {
        path: slot.foundationRegression,
        requestedOptionKey,
        resolvedOptionKey: slot.foundationRegression.powerExercise.exerciseKey,
        mode: 'foundation-regression',
      }
    }
    throw new Error(path + ': Power Track requires Technique Competency or an approved fallback')
  }

  return {
    path: option.path,
    requestedOptionKey,
    resolvedOptionKey: option.path.powerExercise.exerciseKey,
    mode: 'selected-track',
  }
}

export const resolveProgrammingLevel = (
  level: ProgrammingTemplateLevel,
  selection: ProgrammingSelection = {},
): ResolvedProgrammingLevel => {
  const slotIds = new Set(level.blocks.flatMap((block) => block.exercises
    .filter(isSelectableExerciseSlot)
    .map((slot) => slot.id)))
  const powerTrackIds = new Set(level.blocks.flatMap((block) => block.exercises
    .filter(isPowerTrackSlot)
    .map((slot) => slot.id)))
  if (powerTrackIds.size > 0 && selection.includeComplementaryOption === true) {
    throw new Error('CON Power Track options cannot use BODY complementary selection semantics')
  }
  const unknownSelectionId = Object.keys(selection.selectable ?? {}).find((slotId) => !slotIds.has(slotId))
  if (unknownSelectionId) {
    throw new Error(`selectable.${unknownSelectionId}: slot does not exist in this Programming level`)
  }
  const unknownPowerTrackId = Object.keys(selection.powerTracks ?? {}).find((slotId) => !powerTrackIds.has(slotId))
  if (unknownPowerTrackId) {
    throw new Error('powerTracks.' + unknownPowerTrackId + ': slot does not exist in this Programming level')
  }
  const conditioningBlockIds = new Set(level.blocks
    .filter((block) => block.kind === 'conditioning')
    .map((block) => block.id))
  const unknownRoundBlockId = Object.keys(selection.conditioningRounds ?? {})
    .find((blockId) => !conditioningBlockIds.has(blockId))
  if (unknownRoundBlockId) {
    throw new Error('conditioningRounds.' + unknownRoundBlockId + ': fixed or unknown conditioning block')
  }
  const selections: Record<string, string> = {}
  const powerTrackSelections: NonNullable<ResolvedProgrammingLevel['powerTrackSelections']> = {}
  let optionalIncluded = false
  let complementaryIncluded = false
  let effectivePrep = level.prep
  let effectiveSpecificBuildUp = level.specificBuildUp
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
      if (isPowerTrackSlot(entry)) {
        const resolvedPowerTrack = resolvePowerTrackSlot(
          entry,
          selection,
          'blocks[' + blockIndex + '].exercises[' + entryIndex + ']',
        )
        if (Object.keys(powerTrackSelections).length > 0) {
          throw new Error('A Conditioning level may resolve only one mutually exclusive Power Track')
        }
        effectivePrep = resolvedPowerTrack.path.prep.map((item) => ({ ...item }))
        effectiveSpecificBuildUp = resolvedPowerTrack.path.specificBuildUp.map((item) => ({ ...item }))
        powerTrackSelections[entry.id] = {
          ...(resolvedPowerTrack.requestedOptionKey
            ? { requestedOptionKey: resolvedPowerTrack.requestedOptionKey }
            : {}),
          resolvedOptionKey: resolvedPowerTrack.resolvedOptionKey,
          mode: resolvedPowerTrack.mode,
        }
        exercises.push({ ...resolvedPowerTrack.path.powerExercise })
        return
      }
      if (entry.optional === true && selection.includeOptional !== true) return
      if (entry.optional === true) optionalIncluded = true
      exercises.push({ ...entry })
    })
    const selectedRounds = selection.conditioningRounds?.[block.id]
    if (selectedRounds !== undefined) {
      if (!block.roundPolicy) {
        throw new Error('conditioningRounds.' + block.id + ': this block has no conditional round policy')
      }
      const standardRounds = block.roundPolicy.standardRounds
      const maximumRounds = block.roundPolicy.conditionalMaxRounds ?? standardRounds
      if (!Number.isInteger(selectedRounds)
        || selectedRounds !== standardRounds
        && selectedRounds !== maximumRounds) {
        throw new Error('conditioningRounds.' + block.id + ': selected rounds are outside the approved policy')
      }
      return { ...block, rounds: selectedRounds, exercises }
    }
    return { ...block, exercises }
  })

  const resolved: ResolvedProgrammingLevel = {
    ...level,
    prep: effectivePrep,
    ...(effectiveSpecificBuildUp ? { specificBuildUp: effectiveSpecificBuildUp } : {}),
    blocks,
    exercises: blocks.flatMap((block) => block.exercises),
    selections,
    optionalIncluded,
    complementaryIncluded,
  }
  if (Object.keys(powerTrackSelections).length > 0) {
    resolved.powerTrackSelections = powerTrackSelections
  }
  return resolved
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
    if (alternative.reason === 'skill-track'
      && (alternative.eligibility?.requiresTechniqueCompetency !== true || alternative.preserves?.stimulus !== false)) {
      issues.push(issue('ALTERNATIVE_INVALID', alternativePath, 'Skill Track alternatives must require technique competency and must not claim identical stimulus.'))
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

const VALID_PROGRESSION_VARIABLES = new Set([
  'load',
  'volume',
  'rir',
  'rest',
  'range',
  'control',
  'output',
  'density',
])

const validateProgressionMetadata = (
  level: ProgrammingTemplateLevel,
  issues: AuditIssue[],
): void => {
  const progression = level.progressionFromPrevious
  if (!progression) return
  if (!Array.isArray(progression.variables)
    || progression.variables.length === 0
    || progression.variables.some((variable) => !VALID_PROGRESSION_VARIABLES.has(variable))) {
    issues.push(issue('PROGRESSION_METADATA_INVALID', 'progressionFromPrevious.variables', 'Progression evidence must name at least one supported progression variable.'))
  }
  if (typeof progression.note !== 'string' || !progression.note.trim()) {
    issues.push(issue('PROGRESSION_METADATA_INVALID', 'progressionFromPrevious.note', 'Progression evidence must include a non-empty design note.'))
  }
}

const validatePrepAndRamp = (
  level: ProgrammingTemplateLevel,
  issues: AuditIssue[],
  requireExplicitPatternPrep = false,
): void => {
  if (level.prep.length < 2 || level.prep.length > 4) {
    issues.push(issue('PREP_COUNT', 'prep', 'Prep must contain 2–4 targeted preparation items.'))
  }
  if (!level.prep.some((item) => item.phase === 'P')
    && (requireExplicitPatternPrep || !level.rampUp.some((set) => set.targetRole === 'PRIMARY'))) {
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
    block.exercises.forEach((entry, exerciseIndex) => {
      if (isSelectableExerciseSlot(entry)) {
        issues.push(issue(
          'SELECTABLE_SLOT_FORBIDDEN',
          path + '.exercises[' + exerciseIndex + ']',
          '3C blocks must contain TrainingExercise entries, not selectable slots.',
        ))
      }
    })
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
  options: {
    requireExplicitPatternPrep?: boolean
    requirePrimaryRole?: boolean
    validatePrepAndRamp?: boolean
  } = {},
): AuditIssue[] => {
  const issues: AuditIssue[] = []
  if (!level.primaryGoal.trim()) {
    issues.push(issue('GOAL_COUNT', 'primaryGoal', 'Every level must define a Primary Goal.'))
  }

  const formalExercises = allExercises(level)
  if (options.requirePrimaryRole !== false) {
    const primaryCount = formalExercises.filter((exercise) => exercise.role === 'PRIMARY').length
    if (primaryCount !== 1) {
      issues.push(issue('PRIMARY_COUNT', 'blocks', 'Every level must contain exactly one PRIMARY exercise.'))
    }
  }
  formalExercises.forEach((exercise, index) => validateExercise(exercise, 'exercise[' + index + ']', issues))
  level.blocks.forEach((block, blockIndex) => {
    block.exercises.forEach((entry, entryIndex) => {
      if (isSelectableExerciseSlot(entry)) {
        validateSelectableSlot(entry, 'blocks[' + blockIndex + '].exercises[' + entryIndex + ']', issues)
      }
    })
  })
  if (options.validatePrepAndRamp !== false) {
    validatePrepAndRamp(level, issues, options.requireExplicitPatternPrep === true)
  }
  validateFatigueStack(level, issues)
  validateProgressionMetadata(level, issues)

  const unilateralCount = formalExercises.filter((exercise) => exercise.laterality === 'unilateral').length
  if (unilateralCount > 5) {
    issues.push(issue('UNILATERAL_COUNT', 'blocks', 'The fixed template must not accumulate excessive unilateral demands.'))
  }

  return issues
}

export const audit3CTemplateLevel = (
  level: ProgrammingTemplateLevel,
): AuditIssue[] => {
  const issues = auditSharedTemplateLevel(level, { requireExplicitPatternPrep: true })
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

const validPlanningRange = (value: NumericRange | undefined): boolean => Boolean(
  value
  && Number.isFinite(value.min)
  && Number.isFinite(value.max)
  && value.min >= 0
  && value.min <= value.max,
)

const validateConditioningPrep = (
  level: ProgrammingTemplateLevel,
  issues: AuditIssue[],
  pathPrefix = '',
): void => {
  const prepPath = pathPrefix + 'prep'
  if (level.prep.length !== 4) {
    issues.push(issue('CON_PREP_COUNT', prepPath, 'CON must contain exactly four R/M/A/P PrepItems.'))
  }
  const expectedPhases = ['R', 'M', 'A', 'P']
  if (level.prep.map((item) => item.phase).join('|') !== expectedPhases.join('|')) {
    issues.push(issue('CON_PREP_PHASES', prepPath, 'CON PrepItems must be ordered R, M, A, P.'))
  }
  level.prep.forEach((item, index) => {
    const path = prepPath + '[' + index + ']'
    if (generatedExerciseKey(item.exerciseKey)
      || !item.displayName.trim()
      || !hasWorkPrescription(item.prescription)) {
      issues.push(issue('CON_PREP_ITEM_INVALID', path, 'Each CON PrepItem must be one explicit exercise with a measurable prescription.'))
    }
    if (!item.displayName.trim() || forbiddenCompoundName(item.displayName)) {
      issues.push(issue('COMPOUND_EXERCISE_NAME', path + '.displayName', 'Prep slots must describe one Exercise.'))
    }
    if (!validPlanningRange(item.planningExecutionSeconds)) {
      issues.push(issue('CON_PLANNING_TIME', path + '.planningExecutionSeconds', 'Each CON PrepItem needs an atomic planning execution range.'))
    }
    if (item.prescription.rir !== undefined) {
      issues.push(issue('CON_RIR_FORBIDDEN', path + '.prescription.rir', 'CON does not use RIR prescriptions.'))
    }
    if (/泡沫轴|筋膜球|foam\s*roll/i.test(item.displayName)) {
      issues.push(issue('FOAM_ROLLING_IN_PREP', path + '.displayName', 'Foam rolling is Individual Prep, not fixed CON Prep.'))
    }
  })

  if (level.rampUp.length !== 0) {
    issues.push(issue('CON_RAMP_UP_FORBIDDEN', 'rampUp', 'CON uses specificBuildUp for S; rampUp must be empty.'))
  }
  const buildUp = level.specificBuildUp ?? []
  if (buildUp.length === 0) {
    issues.push(issue('CON_SPECIFIC_BUILD_UP_REQUIRED', 'specificBuildUp', 'CON must define at least one Specific Build-up item.'))
  }
  buildUp.forEach((item, index) => {
    const path = pathPrefix + 'specificBuildUp[' + index + ']'
    if (!item.id.trim()
      || generatedExerciseKey(item.exerciseKey)
      || !item.displayName.trim()
      || !hasWorkPrescription(item.prescription)) {
      issues.push(issue('CON_BUILD_UP_INVALID', path, 'Each Specific Build-up item must be one explicit modality exposure with a measurable prescription.'))
    }
    if (!item.displayName.trim() || forbiddenCompoundName(item.displayName)) {
      issues.push(issue('COMPOUND_EXERCISE_NAME', path + '.displayName', 'Specific Build-up slots must describe one Exercise.'))
    }
    if (item.order !== index + 1) {
      issues.push(issue('CON_BUILD_UP_INVALID', path + '.order', 'Specific Build-up order must be sequential and explicit.'))
    }
    if (!validPlanningRange(item.planningExecutionSeconds)) {
      issues.push(issue('CON_PLANNING_TIME', path + '.planningExecutionSeconds', 'Each Specific Build-up item needs an atomic planning execution range.'))
    }
    if (item.prescription.rir !== undefined) {
      issues.push(issue('CON_RIR_FORBIDDEN', path + '.prescription.rir', 'CON does not use RIR prescriptions.'))
    }
  })
}

const validateConditioningLaterality = (
  exercise: TrainingExercise,
  path: string,
  issues: AuditIssue[],
): void => {
  if (exercise.laterality !== 'unilateral') return
  if (!exercise.sideExecution || !exercise.startingSidePolicy) {
    issues.push(issue('CON_UNILATERAL_EXECUTION', path, 'Unilateral CON work must define side execution and starting-side policy.'))
  }
  if (exercise.sideExecution === 'one-side-then-opposite'
    && (exercise.sideRestSeconds === undefined || !validPlanningRange(toRange(exercise.sideRestSeconds)))) {
    issues.push(issue('CON_UNILATERAL_RESET', path + '.sideRestSeconds', 'One-side-then-opposite CON work must define a valid side reset.'))
  }
}

const validateConditioningRoundPolicy = (
  policy: ConditioningRoundPolicy,
  path: string,
  issues: AuditIssue[],
): void => {
  if (!Number.isInteger(policy.standardRounds) || policy.standardRounds <= 0) {
    issues.push(issue('CON_ROUND_POLICY_INVALID', path + '.standardRounds', 'Standard conditioning rounds must be a positive integer.'))
  }
  if (policy.conditionalMaxRounds !== undefined
    && (!Number.isInteger(policy.conditionalMaxRounds)
      || policy.conditionalMaxRounds <= policy.standardRounds)) {
    issues.push(issue('CON_ROUND_POLICY_INVALID', path + '.conditionalMaxRounds', 'Conditional maximum rounds must be greater than standard rounds.'))
  }
  if (policy.conditionalMaxRounds !== undefined) {
    const conditions = policy.conditions ?? []
    const validConditions = new Set(['output-stability', 'recovery', 'technique', 'session-time'])
    if (conditions.length === 0
      || new Set(conditions).size !== conditions.length
      || conditions.some((condition) => !validConditions.has(condition))) {
      issues.push(issue('CON_ROUND_POLICY_INVALID', path + '.conditions', 'Conditional rounds must declare unique approved coach conditions.'))
    }
  }
}

const validateConditioningPath = (
  pathValue: ConditioningPowerPath,
  path: string,
  issues: AuditIssue[],
): void => {
  const pathLevel: ProgrammingTemplateLevel = {
    programLevel: 'l4',
    primaryGoal: 'power path',
    prep: pathValue.prep,
    rampUp: [],
    specificBuildUp: pathValue.specificBuildUp,
    blocks: [],
    estimatedMinutes: { min: 0, max: 0 },
    coachNote: 'power path validation',
  }
  validateConditioningPrep(pathLevel, issues, path + '.')
  const power = pathValue.powerExercise
  validateExercise(power, path + '.powerExercise', issues)
  if (power.role !== 'POWER') {
    issues.push(issue('CON_ROLE_MAPPING', path + '.powerExercise.role', 'Power path exercises must use role POWER.'))
  }
  if (!validPlanningRange(power.planningExecutionSeconds)) {
    issues.push(issue('CON_PLANNING_TIME', path + '.powerExercise.planningExecutionSeconds', 'Power path exercises need atomic planning execution time.'))
  }
  if (power.prescription.rir !== undefined) {
    issues.push(issue('CON_RIR_FORBIDDEN', path + '.powerExercise.prescription.rir', 'CON does not use RIR prescriptions.'))
  }
  if (countRange(power.prescription.sets) === null) {
    issues.push(issue('POWER_SETS_REQUIRED', path + '.powerExercise.prescription.sets', 'Power exercises must define sets.'))
  }
}

const validatePowerTrackSlot = (
  slot: PowerTrackSlot,
  path: string,
  issues: AuditIssue[],
): void => {
  if (slot.role !== 'POWER') {
    issues.push(issue('CON_ROLE_MAPPING', path + '.role', 'Power Track slots must use role POWER.'))
  }
  if (slot.options.length === 0) {
    issues.push(issue('CON_POWER_TRACK_INVALID', path + '.options', 'Power Track slots must define at least one peer option.'))
  }
  const optionKeys = slot.options.map((option) => option.optionKey)
  const trackKeys = slot.options.map((option) => option.trackKey)
  if (optionKeys.includes('foundation-regression')) {
    issues.push(issue('CON_FOUNDATION_REGRESSION_INVALID', path + '.options', 'Foundation Regression must be stored separately from peer Power Track options.'))
  }
  if (new Set(optionKeys).size !== optionKeys.length) {
    issues.push(issue('CON_POWER_TRACK_INVALID', path + '.options', 'Power Track options must be unique and cannot include Foundation Regression.'))
  }
  if (new Set(trackKeys).size !== trackKeys.length) {
    issues.push(issue('CON_POWER_TRACK_INVALID', path + '.options', 'Power Track keys must be unique.'))
  }
  if (slot.defaultSelection !== 'foundation-regression' && !optionKeys.includes(slot.defaultSelection)) {
    issues.push(issue('CON_POWER_TRACK_INVALID', path + '.defaultSelection', 'Power Track default must belong to the peer option set or Foundation Regression.'))
  }
  if (slot.defaultSelection === 'foundation-regression' && !slot.foundationRegression) {
    issues.push(issue('CON_FOUNDATION_REGRESSION_INVALID', path + '.foundationRegression', 'Foundation Regression must be configured when selected as the default.'))
  }
  if (slot.fallbackOptionKey !== undefined && !optionKeys.includes(slot.fallbackOptionKey)) {
    issues.push(issue('CON_POWER_TRACK_INVALID', path + '.fallbackOptionKey', 'Power Track fallback must belong to the peer option set.'))
  }
  slot.options.forEach((option, index) => {
    validateConditioningPath(option.path, path + '.options[' + index + '].path', issues)
  })
  if (slot.foundationRegression) {
    validateConditioningPath(slot.foundationRegression, path + '.foundationRegression', issues)
  }
}

const validateConditioningBlockStructure = (
  level: ProgrammingTemplateLevel,
  issues: AuditIssue[],
): void => {
  const actualKinds = level.blocks.map((block) => block.kind)
  if (actualKinds.length < 1
    || actualKinds.length > 2
    || actualKinds.some((kind) => kind !== 'power' && kind !== 'conditioning')
    || actualKinds.filter((kind) => kind === 'conditioning').length !== 1
    || (actualKinds.includes('power') && actualKinds[0] !== 'power')) {
    issues.push(issue('CON_BLOCK_ORDER', 'blocks', 'CON blocks must be one Conditioning Block or Power followed by Conditioning.'))
  }

  const powerIndex = level.blocks.findIndex((block) => block.kind === 'power')
  const conditioningIndex = level.blocks.findIndex((block) => block.kind === 'conditioning')
  level.blocks.forEach((block, blockIndex) => {
    const path = 'blocks[' + blockIndex + ']'
    if (block.kind === 'strength' || block.kind === 'circuit') {
      issues.push(issue('CON_BLOCK_KIND', path + '.kind', 'CON does not use Strength or Circuit Blocks.'))
      return
    }
    block.exercises.forEach((entry, exerciseIndex) => {
      const exercisePath = path + '.exercises[' + exerciseIndex + ']'
      if (isSelectableExerciseSlot(entry)) {
        issues.push(issue('CON_SELECTABLE_SLOT_FORBIDDEN', exercisePath, 'CON uses explicit Power Track paths, not BODY selectable slots.'))
        return
      }
      if (isPowerTrackSlot(entry)) {
        if (block.kind !== 'power') {
          issues.push(issue('CON_POWER_TRACK_INVALID', exercisePath, 'Power Track slots may only appear in a Power Block.'))
        }
        validatePowerTrackSlot(entry, exercisePath, issues)
        return
      }
      validateExercise(entry, exercisePath, issues)
      if (!validPlanningRange(entry.planningExecutionSeconds)) {
        issues.push(issue('CON_PLANNING_TIME', exercisePath + '.planningExecutionSeconds', 'Each CON work station needs an atomic planning execution range.'))
      }
      if (entry.prescription.rir !== undefined) {
        issues.push(issue('CON_RIR_FORBIDDEN', exercisePath + '.prescription.rir', 'CON does not use RIR prescriptions.'))
      }
      if (block.kind === 'conditioning') {
        if (entry.prescription.sets !== undefined) {
          issues.push(issue('CONDITIONING_SETS_FORBIDDEN', exercisePath + '.prescription.sets', 'Conditioning stations are prescribed per round, not with action-level sets.'))
        }
        const expectedRole = entry.movementPattern === 'carry' ? 'CARRY' : 'CONDITIONING'
        if (entry.role !== expectedRole) {
          issues.push(issue('CON_ROLE_MAPPING', exercisePath + '.role', 'CON station roles must map Carry to CARRY and other stations to CONDITIONING.'))
        }
      } else if (entry.role !== 'POWER') {
        issues.push(issue('CON_ROLE_MAPPING', exercisePath + '.role', 'Power Block exercises must use role POWER.'))
      } else if (countRange(entry.prescription.sets) === null) {
        issues.push(issue('POWER_SETS_REQUIRED', exercisePath + '.prescription.sets', 'Power exercises must define sets.'))
      }
      validateConditioningLaterality(entry, exercisePath, issues)
    })

    if (block.kind === 'conditioning') {
      const rounds = countRange(block.rounds)
      if (!rounds || rounds.min <= 0 || !Number.isInteger(rounds.min) || !Number.isInteger(rounds.max)) {
        issues.push(issue('CONDITIONING_ROUNDS', path + '.rounds', 'Conditioning Block must define positive integer rounds.'))
      }
      if (block.exercises.length > 1 && block.transitionSeconds === undefined) {
        issues.push(issue('CONDITIONING_TRANSITION', path + '.transitionSeconds', 'Multi-station Conditioning Blocks need explicit station transition time.'))
      }
      if (rounds && rounds.max > 1 && block.transitionBetweenRoundsSeconds === undefined) {
        issues.push(issue('CONDITIONING_TRANSITION', path + '.transitionBetweenRoundsSeconds', 'Multi-round Conditioning Blocks need explicit inter-round transition time.'))
      }
      if (rounds && rounds.max > 1 && block.restBetweenRoundsSeconds === undefined) {
        issues.push(issue('CONDITIONING_RECOVERY', path + '.restBetweenRoundsSeconds', 'Multi-round Conditioning Blocks need explicit round recovery.'))
      }
      if (block.roundPolicy) {
        validateConditioningRoundPolicy(block.roundPolicy, path + '.roundPolicy', issues)
      } else if (rounds && rounds.min !== rounds.max) {
        issues.push(issue('CON_ROUND_POLICY_INVALID', path + '.roundPolicy', 'A round range requires an explicit conditional round policy.'))
      }
    }
  })

  if (powerIndex >= 0) {
    const power = level.blocks[powerIndex]
    if (power.restBetweenSetsSeconds === undefined
      && !power.exercises.some((entry) => !isSelectableExerciseSlot(entry)
        && !isPowerTrackSlot(entry)
        && entry.restSeconds !== undefined)) {
      issues.push(issue('POWER_RECOVERY_REQUIRED', 'blocks[' + powerIndex + '].restBetweenSetsSeconds', 'Power work needs explicit set recovery.'))
    }
    if (conditioningIndex >= 0 && powerIndex > conditioningIndex) {
      issues.push(issue('CON_BLOCK_ORDER', 'blocks', 'Power must precede Conditioning fatigue.'))
    }
    if (conditioningIndex >= 0 && power.transitionAfterSeconds === undefined) {
      issues.push(issue('POWER_TO_CONDITIONING_TRANSITION_REQUIRED', 'blocks[' + powerIndex + '].transitionAfterSeconds', 'Power-to-Conditioning transition must be explicit.'))
    }
  }
}

const validateConditioningMetadata = (
  level: ProgrammingTemplateLevel,
  issues: AuditIssue[],
): void => {
  if (!level.conditioningIntensityTarget
    || level.conditioningIntensityTarget.rpe === undefined
    || !level.conditioningIntensityTarget.note.trim()) {
    issues.push(issue('CON_INTENSITY_TARGET', 'conditioningIntensityTarget', 'CON must define a level-level RPE target and coach note.'))
  }
  if (!level.outputPlan?.primary
    || level.outputPlan.outputStability?.kind !== 'coach-design-target'
    || !level.outputPlan.outputStability.description.trim()) {
    issues.push(issue('CON_OUTPUT_PLAN', 'outputPlan', 'CON must define output metric metadata and a Coach Design Target.'))
  } else {
    const metrics = [level.outputPlan.primary, ...(level.outputPlan.supporting ?? [])]
    metrics.forEach((metric, index) => {
      if (!VALID_CONDITIONING_OUTPUT_KINDS.has(metric.kind)
        || !VALID_CONDITIONING_OUTPUT_SCOPES.has(metric.scope)
        || (metric.availability !== 'required' && metric.availability !== 'when-available')) {
        issues.push(issue('CON_OUTPUT_PLAN', 'outputPlan.' + (index === 0 ? 'primary' : 'supporting[' + (index - 1) + ']'), 'CON output metrics must use approved design-only kinds, scopes and availability.'))
      }
    })
  }
  if (!level.planningTime || !validPlanningRange(level.planningTime.setupCoachingAllowanceSeconds)) {
    issues.push(issue('CON_PLANNING_TIME', 'planningTime.setupCoachingAllowanceSeconds', 'CON must define a valid session setup/coaching planning range.'))
  }
  if (level.planningTime?.buildUpCoachingAllowanceSeconds !== undefined
    && !validPlanningRange(level.planningTime.buildUpCoachingAllowanceSeconds)) {
    issues.push(issue('CON_PLANNING_TIME', 'planningTime.buildUpCoachingAllowanceSeconds', 'Build-up coaching allowance must be a valid planning range.'))
  }
  if (!level.progressionFromPrevious) {
    issues.push(issue('CON_PROGRESSION_REQUIRED', 'progressionFromPrevious', 'Every CON level must declare progression evidence.'))
  } else if (level.progressionFromPrevious.variables.includes('rir')) {
    issues.push(issue('CON_PROGRESSION_RIR_FORBIDDEN', 'progressionFromPrevious.variables', 'RIR is not a CON progression variable.'))
  }
}

export const auditConditioningTemplateLevel = (
  level: ProgrammingTemplateLevel,
): AuditIssue[] => {
  const issues = auditSharedTemplateLevel(level, {
    requirePrimaryRole: false,
    validatePrepAndRamp: false,
  })
  validateConditioningPrep(level, issues)
  validateConditioningBlockStructure(level, issues)
  validateConditioningMetadata(level, issues)
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
      block.exercises.forEach((entry, entryIndex) => {
        if (isSelectableExerciseSlot(entry)) {
          entry.options.forEach((option, optionIndex) => {
            if (countRange(option.prescription.sets) === null) {
              issues.push(issue('STRENGTH_SETS_REQUIRED', path + '.exercises[' + entryIndex + '].options[' + optionIndex + '].prescription.sets', 'BODY selectable Strength options must define sets.'))
            }
          })
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

    if (resolved.exercises.filter((exercise) => exercise.laterality === 'unilateral').length > 1) {
      issues.push(issue(
        'BODY_UNILATERAL_COUNT',
        'scenario[' + scenarioIndex + '].exercises',
        'BODY should contain no more than one unilateral training exercise per resolved scenario.',
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
    if (scenario.includeComplementaryOption !== true) {
      const manualMax = level.estimatedMinutes.max
      const calculatedMax = estimate.totalMinutes.max
      if (!Number.isFinite(manualMax)
        || manualMax < calculatedMax
        || manualMax - calculatedMax > 10) {
        issues.push(issue('ESTIMATE_MISMATCH', 'estimatedMinutes.max', 'Manual maximum must cover every default calculated scenario maximum and stay within a 10-minute gap.'))
      }
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

      if (template.id === 'body5') {
        let defaultCount: number | null = null
        try {
          defaultCount = resolveProgrammingLevel(level).exercises.length
        } catch {
          defaultCount = null
        }
        if (defaultCount !== 5) {
          issues.push(issue(
            'BODY05_EXERCISE_COUNT',
            template.id + '/' + level.programLevel + '/exercises',
            'BODY05 must resolve to exactly five default exercises.',
          ))
        }

        const scenarioCounts = bodySelectionScenarios(level).map((scenario) => {
          try {
            return resolveProgrammingLevel(level, scenario).exercises.length
          } catch {
            return null
          }
        })
        const maximumCount = scenarioCounts.every((count): count is number => count !== null)
          ? Math.max(...scenarioCounts)
          : null
        if (maximumCount !== 6) {
          issues.push(issue(
            'BODY05_EXERCISE_COUNT',
            template.id + '/' + level.programLevel + '/exercises',
            'BODY05 must resolve to no more than six exercises, with a six-exercise complementary maximum.',
          ))
        }
      }
    })
    for (let index = 1; index < levels.length; index += 1) {
      if (levels[index - 1] && levels[index] && !hasProgression(levels[index - 1], levels[index])) {
        issues.push(issue('PROGRESSION_MISSING', template.id + '/l' + (index + 1), 'Each adjacent BODY level needs a load, volume, rest, range or control progression.'))
      }
    }
  }
  return issues
}

const validateConditioningTemplateSetShape = (
  templates: readonly ProgrammingTemplate[],
  issues: AuditIssue[],
): void => {
  const expectedIds = ['con1', 'con2', 'con3', 'con4', 'con5']
  if (templates.length !== expectedIds.length
    || templates.map((template) => template.id).join('|') !== expectedIds.join('|')) {
    issues.push(issue('TEMPLATE_SET', 'templates', 'The CON Programming source must contain exactly con1 through con5.'))
  }
  const seen = new Set<string>()
  templates.forEach((template, templateIndex) => {
    if (seen.has(template.id)) {
      issues.push(issue('TEMPLATE_SET', 'templates[' + templateIndex + '].id', 'Template IDs must be unique.'))
    }
    seen.add(template.id)
    const levels = Object.keys(template.levels)
    if (levels.length !== 4 || !['l1', 'l2', 'l3', 'l4'].every((programLevel) => levels.includes(programLevel))) {
      issues.push(issue('LEVEL_SET', 'templates[' + templateIndex + '].levels', 'Every CON template must contain L1 through L4.'))
    }
  })
}

export const auditConditioningTemplateSet = (
  templates: readonly ProgrammingTemplate[],
): AuditIssue[] => {
  const issues: AuditIssue[] = []
  validateConditioningTemplateSetShape(templates, issues)
  for (const template of templates) {
    const levels = (['l1', 'l2', 'l3', 'l4'] as const).map((programLevel) => template.levels[programLevel])
    levels.forEach((level) => {
      if (!level) {
        issues.push(issue('LEVEL_SET', template.id, 'Template level is missing.'))
        return
      }
      auditConditioningTemplateLevel(level).forEach((levelIssue) => {
        issues.push({
          ...levelIssue,
          path: template.id + '/' + level.programLevel + '/' + levelIssue.path,
        })
      })
    })
    for (let index = 1; index < levels.length; index += 1) {
      if (levels[index - 1] && levels[index] && !hasProgression(levels[index - 1], levels[index])) {
        issues.push(issue('PROGRESSION_MISSING', template.id + '/l' + (index + 1), 'Each adjacent CON level needs an applicable progression variable.'))
      }
    }

    if (template.id === 'con5') {
      const l3 = template.levels.l3
      const conditioningBlocks = l3?.blocks.filter((block) => block.kind === 'conditioning') ?? []
      const policy = conditioningBlocks.length === 1 ? conditioningBlocks[0].roundPolicy : undefined
      if (!policy
        || policy.standardRounds !== 3
        || policy.conditionalMaxRounds !== 4
        || JSON.stringify(policy.conditions ?? []) !== JSON.stringify(['output-stability', 'recovery', 'technique', 'session-time'])) {
        issues.push(issue('CON05_ROUND_POLICY', 'con5/l3', 'CON05 L3 must use standard 3 rounds and conditional maximum 4 with all approved conditions.'))
      }
    } else if (template.levels.l1 || template.levels.l2 || template.levels.l3 || template.levels.l4) {
      const hasUnexpectedPolicy = (['l1', 'l2', 'l3', 'l4'] as const).some((programLevel) => (
        template.levels[programLevel]?.blocks.some((block) => block.roundPolicy !== undefined) ?? false
      ))
      if (hasUnexpectedPolicy) {
        issues.push(issue('CON_ROUND_POLICY_INVALID', template.id, 'Only CON05 L3 may declare a conditional round policy.'))
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
  const conditioning = templates.filter((template) => template.system === 'conditioning')
  if (threeC.length > 0) issues.push(...audit3CTemplateSet(threeC))
  if (body.length > 0) issues.push(...auditBodyTemplateSet(body))
  if (conditioning.length > 0) issues.push(...auditConditioningTemplateSet(conditioning))
  if (templates.some((template) => template.system !== '3c'
    && template.system !== 'body'
    && template.system !== 'conditioning')) {
    issues.push(issue('SYSTEM_INVALID', 'templates', 'Programming templates must use a supported system.'))
  }
  return issues
}

const workRange = (
  prescription: ExercisePrescription,
  laterality?: Laterality,
  sideRestSeconds?: Count,
): WorkRange => {
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
    unilateralAdjustment: addRange(
      { min: DEFAULT_UNILATERAL_RESET_SECONDS, max: DEFAULT_UNILATERAL_RESET_SECONDS },
      toRange(sideRestSeconds),
    ),
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
 * Conservative private-coaching planning window floors for every supported
 * Programming level. This overhead is separate from equipment setup and never
 * replaces measurable-work validation.
 */
const MINIMUM_PLANNING_WINDOW_SECONDS: Record<ProgramLevel, number> = {
  l1: 34 * 60,
  l2: 37 * 60,
  l3: 42 * 60,
  l4: 44 * 60,
}

/**
 * Additional coaching-window allowance for a full, strength-only BODY
 * session. The measurable work estimator intentionally remains structural;
 * this supplement represents conservative setup, instruction, demonstration,
 * and coaching time that is not encoded on individual prescriptions.
 */
const STRENGTH_ONLY_PLANNING_SUPPLEMENT_SECONDS: Record<ProgramLevel, number> = {
  l1: 10 * 60,
  l2: 9 * 60,
  l3: 6 * 60,
  l4: 6 * 60,
}

const requiredPlanningRange = (
  value: NumericRange | undefined,
  path: string,
): NumericRange => {
  if (!validPlanningRange(value)) {
    throw new Error(path + '.planningExecutionSeconds: CON requires an atomic planning execution range')
  }
  return value as NumericRange
}

const requiredConditioningRounds = (
  block: TrainingBlock,
  path: string,
): NumericRange => {
  const rounds = countRange(block.rounds)
  if (!rounds
    || rounds.min <= 0
    || !Number.isInteger(rounds.min)
    || !Number.isInteger(rounds.max)) {
    throw new Error(path + '.rounds: CON requires positive integer rounds')
  }
  return rounds
}

const unilateralResetFor = (
  laterality: Laterality,
  sideRestSeconds: Count | undefined,
  occurrences: NumericRange,
): NumericRange => laterality === 'unilateral' && sideRestSeconds !== undefined
  ? multiplyRange(toRange(sideRestSeconds), occurrences)
  : { min: 0, max: 0 }

const estimateConditioningPrep = (level: ResolvedProgrammingLevel): NumericRange => (
  sumRanges(level.prep.map((item, index) => {
    const planning = requiredPlanningRange(item.planningExecutionSeconds, 'prep[' + index + ']')
    return planning
  }))
)

const estimateConditioningSpecificBuildUp = (
  level: ResolvedProgrammingLevel,
): NumericRange => {
  const itemTime = sumRanges((level.specificBuildUp ?? []).map((item, index) => addRange(
    requiredPlanningRange(item.planningExecutionSeconds, 'specificBuildUp[' + index + ']'),
    addRange(
      toRange(item.restAfterSeconds),
      toRange(item.transitionAfterSeconds),
    ),
  )))
  const allowance = toRange(level.planningTime?.buildUpCoachingAllowanceSeconds)
  return addRange(itemTime, allowance)
}

const estimateConditioningPowerBlock = (
  block: TrainingBlock,
  blockIndex: number,
): {
  work: NumericRange
  recovery: NumericRange
  unilateralReset: NumericRange
} => {
  const exercises = getTrainingExercises(block)
  const work: NumericRange[] = []
  const recovery: NumericRange[] = []
  const unilateralReset: NumericRange[] = []

  exercises.forEach((exercise, exerciseIndex) => {
    const path = 'blocks[' + blockIndex + '].exercises[' + exerciseIndex + ']'
    const sets = countRange(exercise.prescription.sets)
    if (!sets || sets.min <= 0 || !Number.isInteger(sets.min) || !Number.isInteger(sets.max)) {
      throw new Error(path + '.prescription.sets: CON Power requires positive integer sets')
    }
    work.push(multiplyRange(
      requiredPlanningRange(exercise.planningExecutionSeconds, path),
      sets,
    ))
    const rest = exercise.restSeconds ?? block.restBetweenSetsSeconds
    if (rest === undefined) {
      throw new Error(path + '.restSeconds: CON Power requires explicit set recovery')
    }
    recovery.push(multiplyRange(toRange(rest), {
      min: Math.max(0, sets.min - 1),
      max: Math.max(0, sets.max - 1),
    }))
    unilateralReset.push(unilateralResetFor(exercise.laterality, exercise.sideRestSeconds, sets))
  })

  return {
    work: sumRanges(work),
    recovery: sumRanges(recovery),
    unilateralReset: sumRanges(unilateralReset),
  }
}

const estimateConditioningBlock = (
  block: TrainingBlock,
  blockIndex: number,
): {
  work: NumericRange
  stationTransitions: NumericRange
  roundRecovery: NumericRange
  unilateralReset: NumericRange
} => {
  const rounds = requiredConditioningRounds(block, 'blocks[' + blockIndex + ']')
  const exercises = getTrainingExercises(block)
  const workPerRound = sumRanges(exercises.map((exercise, exerciseIndex) => (
    requiredPlanningRange(
      exercise.planningExecutionSeconds,
      'blocks[' + blockIndex + '].exercises[' + exerciseIndex + ']',
    )
  )))
  const work = multiplyRange(workPerRound, rounds)
  const unilateralReset = sumRanges(exercises.map((exercise) => unilateralResetFor(
    exercise.laterality,
    exercise.sideRestSeconds,
    rounds,
  )))

  const intraRoundTransition = exercises.length > 1
    ? multiplyRange(
      toRange(block.transitionSeconds),
      {
        min: (exercises.length - 1) * rounds.min,
        max: (exercises.length - 1) * rounds.max,
      },
    )
    : { min: 0, max: 0 }
  if (exercises.length > 1 && block.transitionSeconds === undefined) {
    throw new Error('blocks[' + blockIndex + '].transitionSeconds: CON requires explicit station transition')
  }

  const interRoundTransition = rounds.max > 1
    ? multiplyRange(
      toRange(block.transitionBetweenRoundsSeconds),
      {
        min: Math.max(0, rounds.min - 1),
        max: Math.max(0, rounds.max - 1),
      },
    )
    : { min: 0, max: 0 }
  if (rounds.max > 1 && block.transitionBetweenRoundsSeconds === undefined) {
    throw new Error('blocks[' + blockIndex + '].transitionBetweenRoundsSeconds: CON requires explicit inter-round transition')
  }

  const roundRecovery = rounds.max > 1
    ? multiplyRange(
      toRange(block.restBetweenRoundsSeconds),
      {
        min: Math.max(0, rounds.min - 1),
        max: Math.max(0, rounds.max - 1),
      },
    )
    : { min: 0, max: 0 }
  if (rounds.max > 1 && block.restBetweenRoundsSeconds === undefined) {
    throw new Error('blocks[' + blockIndex + '].restBetweenRoundsSeconds: CON requires explicit round recovery')
  }

  return {
    work,
    stationTransitions: addRange(intraRoundTransition, interRoundTransition),
    roundRecovery,
    unilateralReset,
  }
}

const estimateConditioningSessionMinutes = (
  resolved: ResolvedProgrammingLevel,
): SessionTimeEstimate => {
  const prep = estimateConditioningPrep(resolved)
  const specificBuildUp = estimateConditioningSpecificBuildUp(resolved)
  const powerBlocks = resolved.blocks
    .map((block, blockIndex) => block.kind === 'power'
      ? estimateConditioningPowerBlock(block, blockIndex)
      : null)
    .filter((value): value is NonNullable<typeof value> => value !== null)
  const conditioningBlocks = resolved.blocks
    .map((block, blockIndex) => block.kind === 'conditioning'
      ? estimateConditioningBlock(block, blockIndex)
      : null)
    .filter((value): value is NonNullable<typeof value> => value !== null)

  const powerWork = sumRanges(powerBlocks.map((block) => block.work))
  const powerRecovery = sumRanges(powerBlocks.map((block) => block.recovery))
  const conditioningWork = sumRanges(conditioningBlocks.map((block) => block.work))
  const stationTransitions = sumRanges(conditioningBlocks.map((block) => block.stationTransitions))
  const roundRecovery = sumRanges(conditioningBlocks.map((block) => block.roundRecovery))
  const interBlockTransitions = sumRanges(resolved.blocks.map((block, blockIndex) => {
    if (block.transitionAfterSeconds === undefined) return { min: 0, max: 0 }
    return toRange(block.transitionAfterSeconds)
  }))
  const unilateralReset = sumRanges([
    ...resolved.prep.map((item) => unilateralResetFor(
      item.laterality ?? 'bilateral',
      item.sideRestSeconds,
      { min: 1, max: 1 },
    )),
    ...(resolved.specificBuildUp ?? []).map((item) => unilateralResetFor(
      item.laterality ?? 'bilateral',
      item.sideRestSeconds,
      { min: 1, max: 1 },
    )),
    ...powerBlocks.flatMap((block, blockIndex) => {
      const source = resolved.blocks.filter((candidate) => candidate.kind === 'power')[blockIndex]
      return source
        ? getTrainingExercises(source).map((exercise) => unilateralResetFor(
          exercise.laterality,
          exercise.sideRestSeconds,
          countRange(exercise.prescription.sets) ?? { min: 0, max: 0 },
        ))
        : []
    }),
    ...conditioningBlocks.flatMap((block, blockIndex) => {
      const source = resolved.blocks.filter((candidate) => candidate.kind === 'conditioning')[blockIndex]
      return source
        ? getTrainingExercises(source).map((exercise) => unilateralResetFor(
          exercise.laterality,
          exercise.sideRestSeconds,
          countRange(source.rounds) ?? { min: 0, max: 0 },
        ))
        : []
    }),
  ])
  const setupCoachingAllowance = requiredPlanningRange(
    resolved.planningTime?.setupCoachingAllowanceSeconds,
    'planningTime.setupCoachingAllowanceSeconds',
  )

  const components: ConditioningSessionTimeComponentsSeconds = {
    prep,
    specificBuildUp,
    powerWork,
    powerRecovery,
    conditioningWork,
    stationTransitions,
    roundRecovery,
    interBlockTransitions,
    unilateralReset,
    setupCoachingAllowance,
  }
  const totalSeconds = sumRanges(Object.values(components))
  const transitionTotal = addRange(stationTransitions, interBlockTransitions)

  return {
    prepMinutes: prep.max / 60,
    rampUpMinutes: 0,
    strengthExecutionMinutes: 0,
    strengthRestMinutes: 0,
    circuitWorkMinutes: conditioningWork.max / 60,
    transitionMinutes: transitionTotal.max / 60,
    roundRestMinutes: roundRecovery.max / 60,
    unilateralAdjustmentMinutes: unilateralReset.max / 60,
    equipmentBufferMinutes: 0,
    planningOverheadMinutes: setupCoachingAllowance.max / 60,
    totalMinutes: {
      min: totalSeconds.min / 60,
      max: totalSeconds.max / 60,
    },
    conditioningComponentsSeconds: components,
  }
}

export const calculatePlanningFloorSeconds = (
  level: ResolvableProgrammingLevel,
  selection?: ProgrammingSelection,
): number => {
  const resolved = resolvedLevelFor(level, selection)
  const strengthOnlySupplement = resolved.blocks.length === 1
    && resolved.blocks[0]?.kind === 'strength'
    && getTrainingExercises(resolved.blocks[0]).length >= 5
    ? STRENGTH_ONLY_PLANNING_SUPPLEMENT_SECONDS[resolved.programLevel]
    : 0
  const circuitSupplement = resolved.blocks
    .filter((block) => block.kind === 'circuit')
    .reduce((total, block) => total + getTrainingExercises(block).length * 2 * 60, 0)

  return MINIMUM_PLANNING_WINDOW_SECONDS[resolved.programLevel]
    + strengthOnlySupplement
    + circuitSupplement
}

const exerciseSets = (exercise: TrainingExercise): NumericRange => toRange(exercise.prescription.sets, 1)

const estimatePrep = (level: ProgrammingTemplateLevel) => {
  const work = level.prep.map((item) => workRange(item.prescription, item.laterality, item.sideRestSeconds))
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
    const work = workRange({ reps: set.reps }, set.laterality, set.sideRestSeconds)
    const rest = toRange(set.restSeconds)
    return addRange(addRange(work.base, rest), itemSetupRange(1))
  })

  return {
    base: sumRanges(ranges),
    unilateralAdjustment: sumRanges(level.rampUp.map((set) => (
      workRange({ reps: set.reps }, set.laterality, set.sideRestSeconds).unilateralAdjustment
    ))),
  }
}

const estimateStrength = (block: TrainingBlock) => {
  const execution: NumericRange[] = []
  const rest: NumericRange[] = []
  const unilateralAdjustment: NumericRange[] = []
  const exercises = getTrainingExercises(block)

  for (const exercise of exercises) {
    const sets = exerciseSets(exercise)
    const work = workRange(exercise.prescription, exercise.laterality, exercise.sideRestSeconds)
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
    transitions: {
      min: Math.max(0, exercises.length - 1) * DEFAULT_STRENGTH_TRANSITION_SECONDS,
      max: Math.max(0, exercises.length - 1) * DEFAULT_STRENGTH_TRANSITION_SECONDS,
    },
  }
}

const estimateCircuit = (block: TrainingBlock) => {
  const rounds = toRange(block.rounds, 1)
  const exercises = getTrainingExercises(block)
  const work = exercises.map((exercise) => workRange(exercise.prescription, exercise.laterality, exercise.sideRestSeconds))
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
  level: ResolvableProgrammingLevel,
  selection?: ProgrammingSelection,
): SessionTimeEstimate => {
  const resolved = resolvedLevelFor(level, selection)
  if (resolved.blocks.some((block) => block.kind === 'power' || block.kind === 'conditioning')) {
    return estimateConditioningSessionMinutes(resolved)
  }
  const prep = estimatePrep(resolved)
  const rampUp = estimateRampUp(resolved)
  const strengthBlocks = resolved.blocks.filter((block) => block.kind === 'strength')
  const circuitBlocks = resolved.blocks.filter((block) => block.kind === 'circuit')
  const strength = strengthBlocks.map(estimateStrength)
  const circuit = circuitBlocks.map(estimateCircuit)

  const strengthExecution = sumRanges(strength.map((item) => item.execution))
  const strengthRest = sumRanges(strength.map((item) => item.rest))
  const circuitWork = sumRanges(circuit.map((item) => item.work))
  const transitions = sumRanges([
    ...strength.map((item) => item.transitions),
    ...circuit.map((item) => item.stationTransitions),
  ])
  const roundRest = sumRanges(circuit.map((item) => item.roundRest))
  const unilateralAdjustment = sumRanges([
    prep.unilateralAdjustment,
    rampUp.unilateralAdjustment,
    ...strength.map((item) => item.unilateralAdjustment),
    ...circuit.map((item) => item.unilateralAdjustment),
  ])
  const baseEquipmentBuffer = addRange(
    blockBufferRange(resolved.blocks.length),
    itemSetupRange(resolved.blocks.reduce((count, block) => count + block.exercises.length, 0)),
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
    calculatePlanningFloorSeconds(resolved) - totalWithEquipmentBuffer.max,
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
