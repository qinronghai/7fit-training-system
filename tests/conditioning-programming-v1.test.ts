import { describe, expect, it } from 'vitest'
import {
  isPowerTrackSlot,
  isSelectableExerciseSlot,
  isTrainingExercise,
  type ConditioningPowerPath,
  type ConditioningOutputPlan,
  type ConditioningPlanningTime,
  type ConditioningRoundPolicy,
  type ExercisePrescription,
  type Laterality,
  type PowerTrackSlot,
  type PowerTrackOption,
  type PrepItem,
  type ProgrammingSelection,
  type ProgrammingTemplate,
  type ProgrammingTemplateLevel,
  type ResolvedTrainingBlock,
  type SpecificBuildUpItem,
  type TrainingBlock,
  type TrainingExercise,
  type TrainingSystem,
} from '../src/data/programming/types'
import {
  auditConditioningTemplateLevel,
  auditProgrammingTemplateSet,
  resolveProgrammingLevel,
} from '../src/data/programming/rules'
import { bodyTemplates } from '../src/data/programming/bodyTemplates'

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

const makePrep = (key: string, phase: PrepItem['phase']): PrepItem => ({
  exerciseKey: key,
  displayName: key,
  phase,
  prescription: { reps: 4 },
  reason: 'conditioning resolver fixture',
})

const makePath = (prefix: string, exerciseKey: string): ConditioningPowerPath => ({
  prep: [
    makePrep(prefix + '-r', 'R'),
    makePrep(prefix + '-m', 'M'),
    makePrep(prefix + '-a', 'A'),
    makePrep(prefix + '-p', 'P'),
  ],
  specificBuildUp: [{
    id: prefix + '-build',
    order: 1,
    exerciseKey: prefix + '-build',
    displayName: prefix + ' build-up',
    prescription: { durationSeconds: 10 },
    planningExecutionSeconds: { min: 10, max: 10 },
  }],
  powerExercise: {
    ...powerExercise,
    exerciseKey,
    displayName: exerciseKey,
    prescription: { sets: 3, reps: 5 },
  },
})

const makePowerOption = (
  optionKey: string,
  trackKey: string,
  path: ConditioningPowerPath,
  requiresTechniqueCompetency: boolean,
): PowerTrackOption => ({
  optionKey,
  trackKey,
  path,
  requiresTechniqueCompetency,
})

const makePowerSlot = (
  defaultSelection: PowerTrackSlot['defaultSelection'],
  options: PowerTrackOption[],
  foundationRegression: ConditioningPowerPath,
  fallbackOptionKey?: string,
): PowerTrackSlot => ({
  kind: 'power-track',
  id: 'con03-power',
  exerciseKey: 'con03-power-slot',
  displayName: 'Power Track',
  role: 'POWER',
  movementPattern: 'hinge',
  laterality: 'bilateral',
  fatigueRisk: 'low',
  prescription: {},
  options,
  defaultSelection,
  ...(fallbackOptionKey ? { fallbackOptionKey } : {}),
  foundationRegression,
})

const makeConditioningLevel = (
  defaultSelection: PowerTrackSlot['defaultSelection'],
  options: PowerTrackOption[],
  foundationRegression: ConditioningPowerPath,
  fallbackOptionKey?: string,
): ProgrammingTemplateLevel => ({
  programLevel: 'l3',
  primaryGoal: 'resolver fixture',
  prep: makePath('default', 'medicine-ball-slam').prep,
  rampUp: [],
  specificBuildUp: makePath('default', 'medicine-ball-slam').specificBuildUp,
  blocks: [{
    id: 'power',
    kind: 'power',
    label: 'Power',
    restBetweenSetsSeconds: 60,
    transitionAfterSeconds: 30,
    exercises: [makePowerSlot(defaultSelection, options, foundationRegression, fallbackOptionKey)],
  }, {
    ...conditioningBlock,
    roundPolicy,
  }],
  estimatedMinutes: { min: 20, max: 30 },
  coachNote: 'resolver fixture',
})

const swingPath = makePath('swing', 'kb-swing')
const medicineBallPath = makePath('medicine-ball', 'medicine-ball-slam')
const rotationalPath = makePath('rotational', 'rotational-throw')
const foundationPath = makePath('foundation', 'medicine-ball-slam-regression')

const l3ResolverFixture = makeConditioningLevel(
  'medicine-ball-slam',
  [
    makePowerOption('kb-swing', 'swing', swingPath, true),
    makePowerOption('medicine-ball-slam', 'medicine-ball', medicineBallPath, false),
  ],
  foundationPath,
  'medicine-ball-slam',
)

const conditioningTemplateFixture: ProgrammingTemplate = {
  id: 'con1',
  code: 'CON01',
  system: 'conditioning',
  name: 'Conditioning fixture',
  description: 'Conditioning audit fixture',
  levels: {
    l1: l3ResolverFixture,
    l2: l3ResolverFixture,
    l3: l3ResolverFixture,
    l4: l3ResolverFixture,
  },
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

describe('conditioning audit separation', () => {
  it('does not require a PRIMARY role for a conditioning level', () => {
    expect(auditConditioningTemplateLevel(l3ResolverFixture)).not.toContainEqual(
      expect.objectContaining({ code: 'PRIMARY_COUNT' }),
    )
  })

  it('dispatches conditioning templates without treating the system as invalid', () => {
    expect(auditProgrammingTemplateSet([conditioningTemplateFixture])).not.toContainEqual(
      expect.objectContaining({ code: 'SYSTEM_INVALID' }),
    )
  })
})

describe('conditioning resolver', () => {
  it('resolves the default L3 Medicine Ball path completely', () => {
    const resolved = resolveProgrammingLevel(l3ResolverFixture)

    expect(resolved.prep.map((item) => item.exerciseKey)).toEqual([
      'medicine-ball-r',
      'medicine-ball-m',
      'medicine-ball-a',
      'medicine-ball-p',
    ])
    expect(resolved.specificBuildUp).toBeDefined()
    expect(resolved.specificBuildUp![0].exerciseKey).toBe('medicine-ball-build')
    expect(resolved.blocks[0].exercises[0].exerciseKey).toBe('medicine-ball-slam')
    expect(resolved.powerTrackSelections?.['con03-power']?.mode).toBe('selected-track')
  })

  it('resolves an explicit technique-ready Swing path without Medicine Ball work', () => {
    const resolved = resolveProgrammingLevel(l3ResolverFixture, {
      powerTracks: {
        'con03-power': { optionKey: 'kb-swing', techniqueReady: true },
      },
    })

    expect(resolved.prep[0].exerciseKey).toBe('swing-r')
    expect(resolved.specificBuildUp).toBeDefined()
    expect(resolved.specificBuildUp![0].exerciseKey).toBe('swing-build')
    expect(resolved.blocks[0].exercises.map((exercise) => exercise.exerciseKey)).toEqual(['kb-swing'])
    expect(resolved.blocks[0].exercises.some((exercise) => exercise.exerciseKey === 'medicine-ball-slam')).toBe(false)
  })

  it('uses the separate Foundation Regression as the L4 default path', () => {
    const l4Fixture = makeConditioningLevel(
      'foundation-regression',
      [
        makePowerOption('kb-swing', 'swing', swingPath, true),
        makePowerOption('rotational-throw', 'rotational', rotationalPath, true),
      ],
      foundationPath,
    )

    const resolved = resolveProgrammingLevel(l4Fixture)

    expect(resolved.prep[0].exerciseKey).toBe('foundation-r')
    expect(resolved.specificBuildUp).toBeDefined()
    expect(resolved.specificBuildUp![0].exerciseKey).toBe('foundation-build')
    expect(resolved.blocks[0].exercises.map((exercise) => exercise.exerciseKey)).toEqual([
      'medicine-ball-slam-regression',
    ])
    expect(resolved.powerTrackSelections?.['con03-power']?.mode).toBe('foundation-regression')
  })

  it('resolves each explicit L4 track as one path and never both tracks', () => {
    const l4Fixture = makeConditioningLevel(
      'foundation-regression',
      [
        makePowerOption('kb-swing', 'swing', swingPath, true),
        makePowerOption('rotational-throw', 'rotational', rotationalPath, true),
      ],
      foundationPath,
    )

    const swing = resolveProgrammingLevel(l4Fixture, {
      powerTracks: { 'con03-power': { optionKey: 'kb-swing', techniqueReady: true } },
    })
    const rotational = resolveProgrammingLevel(l4Fixture, {
      powerTracks: { 'con03-power': { optionKey: 'rotational-throw', techniqueReady: true } },
    })

    expect(swing.blocks[0].exercises.map((exercise) => exercise.exerciseKey)).toEqual(['kb-swing'])
    expect(rotational.blocks[0].exercises.map((exercise) => exercise.exerciseKey)).toEqual(['rotational-throw'])
    expect(rotational.blocks[0].exercises).toHaveLength(1)
  })

  it('falls back to Foundation Regression when an advanced path is not technique-ready', () => {
    const l4Fixture = makeConditioningLevel(
      'foundation-regression',
      [makePowerOption('kb-swing', 'swing', swingPath, true)],
      foundationPath,
    )

    const resolved = resolveProgrammingLevel(l4Fixture, {
      powerTracks: { 'con03-power': { optionKey: 'kb-swing', techniqueReady: false } },
    })

    expect(resolved.blocks[0].exercises[0].exerciseKey).toBe('medicine-ball-slam-regression')
    expect(resolved.powerTrackSelections?.['con03-power']?.mode).toBe('foundation-regression')
  })

  it('resolves CON05 L3 standard and legal conditional round counts', () => {
    const standard = resolveProgrammingLevel(l3ResolverFixture)
    const conditional = resolveProgrammingLevel(l3ResolverFixture, {
      conditioningRounds: { 'conditioning-main': 4 },
    })

    expect(standard.blocks[1].rounds).toBe(3)
    expect(conditional.blocks[1].rounds).toBe(4)
  })

  it('does not treat Power Track options as BODY complementary options', () => {
    expect(() => resolveProgrammingLevel(l3ResolverFixture, {
      includeComplementaryOption: true,
    })).toThrow(/complementary/i)
  })

  it('rejects an invalid explicit Power Track key without default fallback', () => {
    expect(() => resolveProgrammingLevel(l3ResolverFixture, {
      powerTracks: {
        'con03-power': { optionKey: 'unapproved-power' },
      },
    })).toThrow(/not approved/i)
  })

  it('keeps Foundation Regression outside the peer track options', () => {
    const l4Slot = makePowerSlot(
      'foundation-regression',
      [
        makePowerOption('kb-swing', 'swing', swingPath, true),
        makePowerOption('rotational-throw', 'rotational', rotationalPath, true),
      ],
      foundationPath,
    )

    expect(l4Slot.options.map((option) => option.optionKey)).not.toContain('medicine-ball-slam-regression')
    expect(l4Slot.foundationRegression?.powerExercise.exerciseKey).toBe('medicine-ball-slam-regression')
  })

  it('accepts only the declared CON05 conditional round count', () => {
    expect(() => resolveProgrammingLevel(l3ResolverFixture, {
      conditioningRounds: { 'conditioning-main': 2 },
    })).toThrow(/approved policy/i)
    expect(() => resolveProgrammingLevel(l3ResolverFixture, {
      conditioningRounds: { 'conditioning-main': 5 },
    })).toThrow(/approved policy/i)
  })

  it('does not add Power Track fields to BODY resolved levels', () => {
    const bodyLevel = bodyTemplates.find((template) => template.id === 'body1')!.levels.l1
    const resolved = resolveProgrammingLevel(bodyLevel)

    expect('powerTrackSelections' in resolved).toBe(false)
    expect(resolved.exercises.length).toBeGreaterThan(0)
  })

  it('returns only TrainingExercise entries after resolving a Power Track slot', () => {
    const resolved = resolveProgrammingLevel(l3ResolverFixture)

    expect(resolved.blocks.every((block) => block.exercises.every(isTrainingExercise))).toBe(true)
  })
})
