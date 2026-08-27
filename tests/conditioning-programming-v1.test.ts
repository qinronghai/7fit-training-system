import { describe, expect, it } from 'vitest'
import {
  isPowerTrackSlot,
  isSelectableExerciseSlot,
  type ConditioningOutputPlan,
  type ConditioningPlanningTime,
  type ConditioningRoundPolicy,
  type ExercisePrescription,
  type Laterality,
  type PowerTrackSlot,
  type PrepItem,
  type ProgrammingSelection,
  type ResolvedTrainingBlock,
  type SpecificBuildUpItem,
  type TrainingBlock,
  type TrainingExercise,
  type TrainingSystem,
} from '../src/data/programming/types'

const prep: PrepItem = {
  exerciseKey: 'conditioning-prep',
  displayName: 'Conditioning Prep',
  phase: 'R',
  prescription: { durationSeconds: 60 },
  reason: 'conditioning type contract',
}

const buildUp: SpecificBuildUpItem = {
  id: 'build-up-1',
  order: 1,
  exerciseKey: 'row-erg',
  displayName: 'RowErg',
  prescription: { durationSeconds: 20 },
  planningExecutionSeconds: { min: 20, max: 20 },
}

const powerExercise: TrainingExercise = {
  exerciseKey: 'medicine-ball-slam',
  displayName: 'Medicine Ball Slam',
  role: 'POWER',
  movementPattern: 'hinge',
  laterality: 'bilateral',
  fatigueRisk: 'moderate',
  prescription: { sets: 3, reps: 5 },
}

const conditioningBlock: TrainingBlock = {
  id: 'conditioning-main',
  kind: 'conditioning',
  label: 'Conditioning',
  rounds: 3,
  restBetweenRoundsSeconds: 60,
  transitionSeconds: 20,
  transitionBetweenRoundsSeconds: 15,
  transitionAfterSeconds: 30,
  exercises: [],
}

const roundPolicy: ConditioningRoundPolicy = {
  standardRounds: 3,
  conditionalMaxRounds: 4,
  conditions: ['output-stability', 'recovery', 'technique', 'session-time'],
}

const selection: ProgrammingSelection = {
  powerTracks: {
    'con03-power': {
      optionKey: 'medicine-ball-slam',
      techniqueReady: false,
    },
  },
  conditioningRounds: {
    'conditioning-main': 4,
  },
}

const outputPlan: ConditioningOutputPlan = {
  primary: {
    kind: 'work-bout-distance',
    scope: 'bout',
    availability: 'required',
  },
  outputStability: {
    kind: 'coach-design-target',
    description: 'Later work bouts remain repeatable.',
  },
}

const planningTime: ConditioningPlanningTime = {
  buildUpCoachingAllowanceSeconds: { min: 25, max: 45 },
  setupCoachingAllowanceSeconds: { min: 300, max: 480 },
}

describe('conditioning Programming type contract', () => {
  it('accepts the conditioning system and conditioning block kind', () => {
    const system: TrainingSystem = 'conditioning'

    expect(system).toBe('conditioning')
    expect(conditioningBlock.kind).toBe('conditioning')
  })

  it('keeps CON-only fields optional for the shared 3C/BODY shape', () => {
    const existingBlock: TrainingBlock = {
      id: 'strength',
      kind: 'strength',
      label: 'Strength',
      exercises: [],
    }

    expect(existingBlock.roundPolicy).toBeUndefined()
    expect(existingBlock.transitionAfterSeconds).toBeUndefined()
  })

  it('represents an atomic Specific Build-up item and planning time', () => {
    expect(buildUp.exerciseKey).toBe('row-erg')
    expect(buildUp.planningExecutionSeconds).toEqual({ min: 20, max: 20 })
    expect(planningTime.buildUpCoachingAllowanceSeconds).toEqual({ min: 25, max: 45 })
  })

  it('represents the round selection contract', () => {
    expect(selection.conditioningRounds).toEqual({ 'conditioning-main': 4 })
    expect(roundPolicy.standardRounds).toBe(3)
    expect(roundPolicy.conditionalMaxRounds).toBe(4)
  })

  it('distinguishes a Power Track slot from a BODY selectable slot', () => {
    const slot: PowerTrackSlot = {
      kind: 'power-track',
      id: 'con03-power',
      exerciseKey: 'con03-power-slot',
      displayName: 'Power Track',
      role: 'POWER',
      movementPattern: 'hinge',
      laterality: 'bilateral',
      fatigueRisk: 'low',
      prescription: {},
      options: [],
      defaultSelection: 'medicine-ball-slam',
      foundationRegression: {
        prep: [prep],
        specificBuildUp: [buildUp],
        powerExercise,
      },
    }

    expect(isPowerTrackSlot(slot)).toBe(true)
    expect(isSelectableExerciseSlot(slot)).toBe(false)
  })

  it('contains output metadata without storing telemetry', () => {
    expect(outputPlan.outputStability.kind).toBe('coach-design-target')
    expect('watts' in outputPlan.primary).toBe(false)
    expect('paceValue' in outputPlan.primary).toBe(false)
  })

  it('preserves every TrainingBlock field in the resolved block contract', () => {
    const resolvedBlock: ResolvedTrainingBlock = {
      ...conditioningBlock,
      roundPolicy,
      exercises: [],
    }

    expect(resolvedBlock.rounds).toBe(3)
    expect(resolvedBlock.restBetweenRoundsSeconds).toBe(60)
    expect(resolvedBlock.transitionSeconds).toBe(20)
    expect(resolvedBlock.transitionBetweenRoundsSeconds).toBe(15)
    expect(resolvedBlock.transitionAfterSeconds).toBe(30)
    expect(resolvedBlock.roundPolicy).toEqual(roundPolicy)
  })
})

describe('conditioning type contract fixture sanity', () => {
  it('keeps existing prescription and laterality types usable', () => {
    const prescription: ExercisePrescription = { distanceMeters: 20 }
    const laterality: Laterality = 'unilateral'

    expect(prescription.distanceMeters).toBe(20)
    expect(laterality).toBe('unilateral')
  })
})
