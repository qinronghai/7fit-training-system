import type {
  Count,
  ExercisePrescription,
  Laterality,
  NumericRange,
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
  const equipmentBuffer = addRange(
    blockBufferRange(level.blocks.length),
    itemSetupRange(level.blocks.reduce((count, block) => count + block.exercises.length, 0)),
  )

  const totalSeconds = sumRanges([
    prep.base,
    rampUp.base,
    strengthExecution,
    strengthRest,
    circuitWork,
    transitions,
    roundRest,
    unilateralAdjustment,
    equipmentBuffer,
  ])

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
