import { getExercise } from '../exercises'
import type { Count, ExercisePrescription, NumericRange } from '../programming/types'
import type {
  Female111TemplateAction,
  Female111TemplateLevelDefinition,
  Female111TemplatePrep,
  Female111TemplatePrepPhase,
  Female111TemplateRampUp,
  Female111TemplateRole,
  Female111TemplateTimeComponents,
  Female111TemplateTimeEstimate,
  Female111TemplateValidationIssue,
  Female111TemplateValidationIssueCode,
} from './templateTypes'

const HIGH_FATIGUE_EXERCISE_IDS = new Set([
  'assisted-pull-up',
  'deadlift-to-overhead-press',
  'hack-squat',
  'low-assistance-pull-up',
  'overload-hip-thrust',
])

const REQUIRED_PREP_PHASES: readonly Female111TemplatePrepPhase[] = ['R', 'M', 'A', 'P']
const REQUIRED_MAIN_ROLES: readonly Female111TemplateRole[] = ['PRIMARY', 'SUPPORT', 'CORE']
const zeroRange = (): NumericRange => ({ min: 0, max: 0 })
const unitRange = (): NumericRange => ({ min: 1, max: 1 })

type Female111TemplateWorkItem = Female111TemplatePrep | Female111TemplateRampUp | Female111TemplateAction

const toRange = (value: Count | undefined, fallback = 0): NumericRange => {
  if (value === undefined) return { min: fallback, max: fallback }
  if (typeof value === 'number') return { min: value, max: value }
  return { min: value.min, max: value.max }
}

const countRange = (value: Count | undefined): NumericRange | null => {
  if (value === undefined) return null
  const range = toRange(value)
  if (!Number.isFinite(range.min) || !Number.isFinite(range.max) || range.min > range.max) return null
  return range
}

const addRange = (left: NumericRange, right: NumericRange): NumericRange => ({
  min: left.min + right.min,
  max: left.max + right.max,
})

const multiplyRange = (value: NumericRange, multiplier: NumericRange | number): NumericRange => {
  if (typeof multiplier === 'number') {
    return {
      min: value.min * multiplier,
      max: value.max * multiplier,
    }
  }

  return {
    min: value.min * multiplier.min,
    max: value.max * multiplier.max,
  }
}

const issue = (
  code: Female111TemplateValidationIssueCode,
  path: string,
  message: string,
): Female111TemplateValidationIssue => ({
  code,
  path,
  message,
})

const allWorkItems = (
  level: Female111TemplateLevelDefinition,
  options: { includeOptional?: boolean } = {},
): Female111TemplateWorkItem[] => {
  const includeOptional = options.includeOptional ?? true
  return [
    ...level.prep,
    ...level.rampUp,
    ...level.mainSequence,
    ...(includeOptional ? level.optionalAccessory : []),
  ]
}

const sumPlanningSeconds = (items: readonly Female111TemplateWorkItem[]): NumericRange => (
  items.reduce(
    (total, item) => addRange(total, item.planningExecutionSeconds),
    zeroRange(),
  )
)

const sumCountField = (
  items: readonly Female111TemplateWorkItem[],
  readCount: (item: Female111TemplateWorkItem) => Count | undefined,
): NumericRange => items.reduce(
  (total, item) => addRange(total, toRange(readCount(item))),
  zeroRange(),
)

const estimateUnilateralAdjustment = (item: Female111TemplateWorkItem): NumericRange => {
  if (item.laterality !== 'unilateral') return zeroRange()

  const sets = countRange(item.prescription.sets) ?? unitRange()
  const explicitSideRest = countRange(item.sideRestSeconds)

  if (item.sideExecution === 'alternating' && explicitSideRest === null) {
    return zeroRange()
  }

  const sideReset = explicitSideRest ?? { min: 10, max: 20 }
  const coachSwap = item.sideExecution === 'alternating'
    ? zeroRange()
    : item.startingSidePolicy === 'alternate-between-sets'
      ? { min: 0, max: 5 }
      : { min: 5, max: 10 }

  return multiplyRange(addRange(sideReset, coachSwap), sets)
}

const estimateEquipmentCoachBuffer = (item: Female111TemplateWorkItem): NumericRange => {
  const exercise = getExercise(item.exerciseId)
  if (!exercise) return zeroRange()

  const externalEquipmentCount = exercise.equipment.filter((equipment) => equipment !== '自重').length
  const equipmentSetup = externalEquipmentCount > 0 ? { min: 10, max: 15 } : { min: 5, max: 10 }
  const coachComplexity = exercise.techniqueLevel === 'tl0' || exercise.techniqueLevel === 'tl1'
    ? { min: 0, max: 5 }
    : exercise.techniqueLevel === 'tl2'
      ? { min: 5, max: 10 }
      : { min: 10, max: 15 }

  return addRange(equipmentSetup, coachComplexity)
}

const sumDerivedComponent = (
  items: readonly Female111TemplateWorkItem[],
  estimate: (item: Female111TemplateWorkItem) => NumericRange,
): NumericRange => items.reduce(
  (total, item) => addRange(total, estimate(item)),
  zeroRange(),
)

const toMinutes = (seconds: NumericRange): NumericRange => ({
  min: seconds.min / 60,
  max: seconds.max / 60,
})

const hasDoseField = (prescription: ExercisePrescription): boolean => (
  prescription.sets !== undefined
  || prescription.reps !== undefined
  || prescription.durationSeconds !== undefined
  || prescription.distanceMeters !== undefined
)

const hasFatigueSignals = (item: Female111TemplateAction): boolean => {
  if (HIGH_FATIGUE_EXERCISE_IDS.has(item.exerciseId)) return true

  const sets = countRange(item.prescription.sets)
  const rir = countRange(item.prescription.rir)
  const exercise = getExercise(item.exerciseId)
  const heavyPattern = exercise?.patternIds.some((pattern) => pattern === 'squat' || pattern === 'hinge' || pattern === 'vpull')

  return item.role === 'PRIMARY'
    && heavyPattern === true
    && (sets?.max ?? 0) >= 4
    && (rir?.min ?? Number.POSITIVE_INFINITY) <= 2
}

export const estimateFemale111TemplateMinutes = (
  level: Female111TemplateLevelDefinition,
  options: { includeOptional?: boolean } = {},
): Female111TemplateTimeEstimate => {
  const includeOptional = options.includeOptional ?? false
  const includedItems = allWorkItems(level, { includeOptional })
  const prepSeconds = sumPlanningSeconds(level.prep)
  const rampUpSeconds = sumPlanningSeconds(level.rampUp)
  const mainWorkSeconds = sumPlanningSeconds(level.mainSequence)
  const optionalSeconds = includeOptional ? sumPlanningSeconds(level.optionalAccessory) : zeroRange()
  const setRestSeconds = sumCountField(includedItems, (item) => item.restSeconds)
  const transitionSeconds = sumCountField(includedItems, (item) => item.transitionAfterSeconds)
  const unilateralAdjustmentSeconds = sumDerivedComponent(includedItems, estimateUnilateralAdjustment)
  const equipmentCoachBufferSeconds = sumDerivedComponent(includedItems, estimateEquipmentCoachBuffer)
  const recoverySeconds = level.recoveryRecord.durationSeconds

  const totalSeconds = [
    prepSeconds,
    rampUpSeconds,
    mainWorkSeconds,
    setRestSeconds,
    transitionSeconds,
    unilateralAdjustmentSeconds,
    equipmentCoachBufferSeconds,
    optionalSeconds,
    recoverySeconds,
  ].reduce(addRange, zeroRange())

  const components: Female111TemplateTimeComponents = {
    prepSeconds,
    rampUpSeconds,
    mainWorkSeconds,
    setRestSeconds,
    transitionSeconds,
    unilateralAdjustmentSeconds,
    equipmentCoachBufferSeconds,
    optionalSeconds,
    recoverySeconds,
    totalSeconds,
  }

  return {
    components,
    totalMinutes: toMinutes(totalSeconds),
    optionalIncluded: includeOptional,
  }
}

export const validateFemale111TemplateLevel = (
  level: Female111TemplateLevelDefinition,
  previousLevel?: Female111TemplateLevelDefinition,
): readonly Female111TemplateValidationIssue[] => {
  const issues: Female111TemplateValidationIssue[] = []
  const prepPhaseCounts = new Map<Female111TemplatePrepPhase, number>(
    REQUIRED_PREP_PHASES.map((phase) => [phase, 0]),
  )

  for (const item of level.prep) {
    prepPhaseCounts.set(item.phase, (prepPhaseCounts.get(item.phase) ?? 0) + 1)
  }

  for (const phase of REQUIRED_PREP_PHASES) {
    const count = prepPhaseCounts.get(phase) ?? 0
    if (count === 0) {
      issues.push(issue('MISSING_PREP_PHASE', 'prep', `Prep must include phase ${phase}.`))
    }
    if (count > 1) {
      issues.push(issue('DUPLICATE_PREP_PHASE', 'prep', `Prep phase ${phase} appears more than once.`))
    }
  }

  if (level.mainSequence.length < 5) {
    issues.push(issue('MAIN_SEQUENCE_TOO_SHORT', 'mainSequence', 'Main sequence must contain at least five actions.'))
  }

  const primaryCount = level.mainSequence.filter((item) => item.role === 'PRIMARY').length
  if (primaryCount !== 1 || REQUIRED_MAIN_ROLES.some((role) => !level.mainSequence.some((item) => item.role === role))) {
    issues.push(issue('ROLE_COVERAGE', 'mainSequence', 'Main sequence must keep one PRIMARY plus SUPPORT and CORE coverage.'))
  }

  for (const [index, item] of allWorkItems(level).entries()) {
    const section = index < level.prep.length
      ? `prep[${index}]`
      : index < level.prep.length + level.rampUp.length
        ? `rampUp[${index - level.prep.length}]`
        : index < level.prep.length + level.rampUp.length + level.mainSequence.length
          ? `mainSequence[${index - level.prep.length - level.rampUp.length}]`
          : `optionalAccessory[${index - level.prep.length - level.rampUp.length - level.mainSequence.length}]`

    if (!getExercise(item.exerciseId)) {
      issues.push(issue('UNKNOWN_EXERCISE', `${section}.exerciseId`, `Unknown canonical Exercise id: ${item.exerciseId}`))
    }
    if (!hasDoseField(item.prescription)) {
      issues.push(issue('PRESCRIPTION_MISSING', `${section}.prescription`, 'Action prescription must define sets, reps, durationSeconds, or distanceMeters.'))
    }
    if (!item.qualityBoundary.trim()) {
      issues.push(issue('QUALITY_BOUNDARY_MISSING', `${section}.qualityBoundary`, 'Action must define a quality boundary.'))
    }
    if (!item.regression.trim()) {
      issues.push(issue('REGRESSION_MISSING', `${section}.regression`, 'Action must define a regression path.'))
    }
  }

  for (let index = 1; index < level.mainSequence.length; index += 1) {
    const previous = level.mainSequence[index - 1]
    const current = level.mainSequence[index]
    const previousExercise = getExercise(previous.exerciseId)
    const currentExercise = getExercise(current.exerciseId)

    if (
      previousExercise
      && currentExercise
      && hasFatigueSignals(previous)
      && hasFatigueSignals(current)
      && previousExercise.patternIds.some((pattern) => currentExercise.patternIds.includes(pattern))
    ) {
      issues.push(issue(
        'REPEATED_HIGH_FATIGUE_SOURCE',
        `mainSequence[${index}]`,
        'Adjacent high-fatigue actions must not repeat the same primary fatigue source.',
      ))
    }
  }

  if (level.level === 'l1') {
    if (level.progressionFromPrevious) {
      issues.push(issue('PROGRESSION_TOO_MANY_VARIABLES', 'progressionFromPrevious', 'L1 must not declare progressionFromPrevious.'))
    }
  } else {
    if (!level.progressionFromPrevious || level.progressionFromPrevious.variables.length === 0) {
      issues.push(issue('PROGRESSION_MISSING', 'progressionFromPrevious', 'L2-L4 must declare progression evidence from the previous level.'))
    } else if (level.progressionFromPrevious.variables.length > 2) {
      issues.push(issue('PROGRESSION_TOO_MANY_VARIABLES', 'progressionFromPrevious.variables', 'Progression evidence may change at most two variables.'))
    }
  }

  if (previousLevel && level.level !== 'l1' && previousLevel.recipeId !== level.recipeId) {
    issues.push(issue('PROGRESSION_MISSING', 'progressionFromPrevious', 'Progression evidence must compare levels from the same recipe.'))
  }

  const withOptional = estimateFemale111TemplateMinutes(level, { includeOptional: true })
  if (withOptional.totalMinutes.max > 60) {
    issues.push(issue('OPTIONAL_TIME_GATE', 'optionalAccessory', 'Optional work pushes the calculated session maximum above 60 minutes.'))
  }

  return issues
}
