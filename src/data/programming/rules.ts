import type {
 Count,
 ExercisePrescription,
  ExerciseRole,
 Laterality,
 NumericRange,
  ProgramLevel,
  ProgrammingTemplate,
 ProgrammingTemplateLevel,
  SessionTimeEstimate,
  TrainingBlock,
  TrainingExercise,
} from './types'

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
  level.blocks.flatMap((block) => block.exercises)
)

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
    if (!['equipment', 'member-fit', 'regression', 'coach-choice'].includes(alternative.reason)) {
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

const validatePrepAndRamp = (
  level: ProgrammingTemplateLevel,
  issues: AuditIssue[],
): void => {
  if (level.prep.length < 2 || level.prep.length > 4) {
    issues.push(issue('PREP_COUNT', 'prep', 'Prep must contain 2–4 targeted preparation items.'))
  }
  if (!level.prep.some((item) => item.phase === 'P')) {
    issues.push(issue('PATTERN_PREP_REQUIRED', 'prep', 'Prep must include a Pattern item.'))
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
      block.exercises.forEach((exercise, exerciseIndex) => {
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
      block.exercises.forEach((exercise, exerciseIndex) => {
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
    for (let index = 1; index < block.exercises.length; index += 1) {
      const previous = block.exercises[index - 1]
      const current = block.exercises[index]
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

export const auditTemplateLevel = (
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
  validatePrepAndRamp(level, issues)
  validateBlockStructure(level, issues)
  validateFatigueStack(level, issues)

  const unilateralCount = formalExercises.filter((exercise) => exercise.laterality === 'unilateral').length
  if (unilateralCount > 5) {
    issues.push(issue('UNILATERAL_COUNT', 'blocks', 'The fixed template must not accumulate excessive unilateral demands.'))
  }

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

const sameKeys = (
  level: ProgrammingTemplateLevel,
  blockIndex: number,
  keys: readonly string[],
): boolean => (
  level.blocks[blockIndex]?.exercises.map((exercise) => exercise.exerciseKey).join('|') === keys.join('|')
)

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
    const l1Keys = l1.blocks[0]?.exercises.map((exercise) => exercise.exerciseKey)
    const l1Roles = l1.blocks[0]?.exercises.map((exercise) => exercise.role)
    const expectedL1Keys = [
      'supported-split-squat',
      'seated-row',
      'machine-chest-press',
      'bilateral-farmer-carry',
      'dead-bug',
    ]
    if (l1Keys?.join('|') !== expectedL1Keys.join('|')
      || l1Roles?.join('|') !== ['PRIMARY', 'SECONDARY', 'SECONDARY', 'CARRY', 'CORE'].join('|')
      || l1Keys?.includes('low-box-step')) {
      issues.push(issue('SPECIAL_CASE', template.id + '/l1', '3C03 L1 must use one supported split squat plus row, chest press, bilateral Farmer Carry and dead bug.'))
    }
    if (l1.blocks[0]?.exercises.filter((exercise) => exercise.movementPattern === 'single').length !== 1) {
      issues.push(issue('SPECIAL_CASE', template.id + '/l1', '3C03 L1 may contain only one knee-dominant single-leg action.'))
    }

    const l4Circuit = l4.blocks[1]
    const l4Rounds = countRange(l4Circuit?.rounds)
    if (!sameKeys(l4, 0, ['front-foot-elevated-split-squat', 'chest-supported-row'])
      || !sameKeys(l4, 1, ['double-dumbbell-rdl', 'seated-dumbbell-shoulder-press', 'suitcase-carry'])
      || l4Rounds?.min !== 2
      || l4Rounds?.max !== 3
      || l4Circuit?.restBetweenRoundsSeconds !== 90
      || (l4Circuit?.exercises ?? []).some((exercise) => exercise.prescription.sets !== undefined)) {
      issues.push(issue('SPECIAL_CASE', template.id + '/l4', '3C03 L4 must use the frozen Strength plus three-action Circuit prescription.'))
    }
  }

  if (template.id === '3c6') {
    const programLevels: ProgramLevel[] = ['l1', 'l2', 'l3', 'l4']
    if (programLevels.some((programLevel) => hasBarbellLanguage(template.levels[programLevel]))) {
      issues.push(issue('SPECIAL_CASE', template.id, '3C06 must keep KB/DB language and contain no barbell language.'))
    }
    if (!sameKeys(l4, 0, ['heavy-double-dumbbell-rdl', 'dumbbell-chest-supported-row'])
      || !sameKeys(l4, 1, ['double-dumbbell-front-squat', 'seated-dumbbell-shoulder-press', 'bilateral-farmer-carry'])
      || l4.blocks[0]?.exercises[0]?.alternatives?.[0]?.exerciseKey !== 'double-kettlebell-rdl') {
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

export const auditTemplateSet = (
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
      for (const levelIssue of auditTemplateLevel(level)) {
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

const sumRanges = (ranges: NumericRange[]): NumericRange => ranges.reduce(
  (total, range) => addRange(total, range),
  { min: 0, max: 0 },
)

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
    base,
    unilateralAdjustment: {
      min: base.min + DEFAULT_UNILATERAL_RESET_SECONDS,
      max: base.max + DEFAULT_UNILATERAL_RESET_SECONDS,
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

const MINIMUM_STATIC_SESSION_BASE_SECONDS: Record<ProgramLevel, number> = {
  l1: 34 * 60,
  l2: 37 * 60,
  l3: 42 * 60,
  l4: 44 * 60,
}

const minimumStaticSessionSeconds = (level: ProgrammingTemplateLevel): number => (
  MINIMUM_STATIC_SESSION_BASE_SECONDS[level.programLevel]
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
    const rest = toRange(set.restSeconds)
    return addRange(addRange(reps, rest), itemSetupRange(1))
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

  for (const exercise of block.exercises) {
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
  const work = block.exercises.map((exercise) => workRange(exercise.prescription, exercise.laterality))
  const basePerRound = sumRanges(work.map((item) => item.base))
  const unilateralPerRound = sumRanges(work.map((item) => item.unilateralAdjustment))
  const transitionSeconds = toRange(block.transitionSeconds, DEFAULT_STATION_TRANSITION_SECONDS)
  const stationCount = Math.max(0, block.exercises.length - 1)
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
  const equipmentSupplement = Math.max(
    0,
    minimumStaticSessionSeconds(level) - totalBeforeEquipmentBuffer.max - baseEquipmentBuffer.max,
  )
  const equipmentBuffer = addRange(
    baseEquipmentBuffer,
    { min: equipmentSupplement, max: equipmentSupplement },
  )
  const totalSeconds = addRange(totalBeforeEquipmentBuffer, equipmentBuffer)

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
    totalMinutes: {
      min: totalSeconds.min / 60,
      max: totalSeconds.max / 60,
    },
  }
}
