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
  type NumericRange,
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
  auditConditioningTemplateSet,
  auditProgrammingTemplateSet,
  calculatePlanningFloorSeconds,
  estimateSessionMinutes,
  resolveProgrammingLevel,
} from '../src/data/programming/rules'
import { bodyTemplates } from '../src/data/programming/bodyTemplates'
import { threeCTemplates } from '../src/data/programming/threeCTemplates'
import { conditioningTemplates } from '../src/data/programming/conditioningTemplates'

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

const makeAuditPrep = (
  exerciseKey: string,
  phase: PrepItem['phase'],
): PrepItem => ({
  exerciseKey,
  displayName: exerciseKey,
  phase,
  prescription: { durationSeconds: 45 },
  planningExecutionSeconds: { min: 45, max: 60 },
  reason: 'conditioning audit fixture',
})

const makeAuditSpecificBuildUp = (
  exerciseKey = 'row-erg',
): SpecificBuildUpItem => ({
  id: 'audit-build-up',
  order: 1,
  exerciseKey,
  displayName: exerciseKey,
  prescription: { durationSeconds: 20 },
  planningExecutionSeconds: { min: 20, max: 25 },
})

const makeAuditPowerPath = (
  prefix: string,
  exerciseKey: string,
): ConditioningPowerPath => ({
  prep: [
    makeAuditPrep(prefix + '-r', 'R'),
    makeAuditPrep(prefix + '-m', 'M'),
    makeAuditPrep(prefix + '-a', 'A'),
    makeAuditPrep(prefix + '-p', 'P'),
  ],
  specificBuildUp: [makeAuditSpecificBuildUp(prefix + '-build')],
  powerExercise: {
    ...powerExercise,
    exerciseKey,
    displayName: exerciseKey,
    planningExecutionSeconds: { min: 20, max: 25 },
    prescription: { sets: 3, reps: 5 },
  },
})

const makeAuditConditioningStation = (
  exerciseKey: string,
  role: TrainingExercise['role'],
  prescription: ExercisePrescription,
  planningExecutionSeconds: NumericRange = { min: 20, max: 30 },
): TrainingExercise => ({
  exerciseKey,
  displayName: exerciseKey,
  role,
  movementPattern: role === 'CARRY' ? 'carry' : 'hpull',
  laterality: 'bilateral',
  fatigueRisk: 'moderate',
  prescription,
  planningExecutionSeconds,
})

const makeAuditConditioningLevel = (): ProgrammingTemplateLevel => ({
  programLevel: 'l3',
  primaryGoal: 'repeatable output',
  prep: [
    makeAuditPrep('row-erg', 'R'),
    makeAuditPrep('ankle-dorsiflexion-rock', 'M'),
    makeAuditPrep('glute-bridge', 'A'),
    makeAuditPrep('row-erg-technique', 'P'),
  ],
  rampUp: [],
  specificBuildUp: [makeAuditSpecificBuildUp()],
  blocks: [{
    id: 'conditioning-main',
    kind: 'conditioning',
    label: 'Conditioning',
    rounds: 3,
    restBetweenRoundsSeconds: 60,
    transitionSeconds: 20,
    transitionBetweenRoundsSeconds: 15,
    exercises: [
      makeAuditConditioningStation('row-erg', 'CONDITIONING', { distanceMeters: 100 }),
      makeAuditConditioningStation('farmer-carry', 'CARRY', { distanceMeters: 20 }),
    ],
  }],
  estimatedMinutes: { min: 20, max: 30 },
  conditioningIntensityTarget: {
    rpe: { min: 6, max: 7 },
    note: 'Repeat output without local failure.',
  },
  outputPlan: outputPlan,
  planningTime,
  progressionFromPrevious: {
    variables: ['volume', 'output'],
    note: 'Increase repeatable output while preserving recovery.',
  },
  coachNote: 'conditioning audit fixture',
})

const makeAuditPowerTrackLevel = (): ProgrammingTemplateLevel => {
  const level = makeAuditConditioningLevel()
  const path = makeAuditPowerPath('audit-medicine-ball', 'medicine-ball-slam')
  const powerSlot: PowerTrackSlot = {
    kind: 'power-track',
    id: 'con03-power',
    exerciseKey: 'con03-power-slot',
    displayName: 'Power Track',
    role: 'POWER',
    movementPattern: 'hinge',
    laterality: 'bilateral',
    fatigueRisk: 'low',
    prescription: {},
    options: [{
      optionKey: 'medicine-ball-slam',
      trackKey: 'medicine-ball',
      path,
      requiresTechniqueCompetency: false,
    }],
    defaultSelection: 'medicine-ball-slam',
    foundationRegression: path,
  }
  return {
    ...level,
    prep: path.prep,
    specificBuildUp: path.specificBuildUp,
    blocks: [{
      id: 'power',
      kind: 'power',
      label: 'Power',
      restBetweenSetsSeconds: 60,
      transitionAfterSeconds: 30,
      exercises: [powerSlot],
    }, ...level.blocks],
  }
}

const makeAuditMultiStationLevel = (stationCount: number): ProgrammingTemplateLevel => {
  const level = makeAuditConditioningLevel()
  level.blocks[0] = {
    ...level.blocks[0],
    transitionSeconds: { min: 20, max: 30 },
    transitionBetweenRoundsSeconds: { min: 15, max: 20 },
    exercises: Array.from({ length: stationCount }, (_value, index) => (
      makeAuditConditioningStation(
        'conditioning-station-' + index,
        index === stationCount - 1 ? 'CARRY' : 'CONDITIONING',
        index === stationCount - 1 ? { distanceMeters: 20 } : { durationSeconds: 20 },
        { min: 20, max: 30 },
      )
    )),
  }
  return level
}

type FrozenStationManifest = {
  exerciseKey: string
  role: string
  movementPattern: string
  laterality: Laterality
  prescription: ExercisePrescription
}

type FrozenLevelManifest = {
  templateId: string
  level: 'l1' | 'l2' | 'l3' | 'l4'
  primaryGoal: string
  prepKeys: string[]
  specificBuildUpKeys: string[]
  blockKinds: TrainingBlock['kind'][]
  blockIds: string[]
  rounds: (number | NumericRange | undefined)[]
  stations: FrozenStationManifest[][]
}

const station = (
  exerciseKey: string,
  role: string,
  movementPattern: string,
  prescription: ExercisePrescription,
  laterality: Laterality = 'bilateral',
): FrozenStationManifest => ({ exerciseKey, role, movementPattern, laterality, prescription })

const frozenConditioningManifest: FrozenLevelManifest[] = [
  {
    templateId: 'con1', level: 'l1', primaryGoal: 'Learn to Pace',
    prepKeys: ['row-erg', 'thoracic-rotation', 'band-pull-apart', 'row-erg-technique'],
    specificBuildUpKeys: ['row-erg-pacing-bout'], blockKinds: ['conditioning'], blockIds: ['conditioning-main'],
    rounds: [6], stations: [[station('row-erg', 'CONDITIONING', 'hpull', { durationSeconds: 30 })]],
  },
  {
    templateId: 'con1', level: 'l2', primaryGoal: 'Repeat Output',
    prepKeys: ['row-erg', 'thoracic-rotation', 'band-pull-apart', 'row-erg-technique'],
    specificBuildUpKeys: ['row-erg-repeat-bout'], blockKinds: ['conditioning'], blockIds: ['conditioning-main'],
    rounds: [6], stations: [[station('row-erg', 'CONDITIONING', 'hpull', { durationSeconds: 40 })]],
  },
  {
    templateId: 'con1', level: 'l3', primaryGoal: 'Sustain Output',
    prepKeys: ['row-erg', 'lateral-lunge-mobility', 'band-straight-arm-pulldown', 'row-erg-technique'],
    specificBuildUpKeys: ['row-erg-sustain-bout'], blockKinds: ['conditioning'], blockIds: ['conditioning-main'],
    rounds: [6], stations: [[station('row-erg', 'CONDITIONING', 'hpull', { durationSeconds: 45 })]],
  },
  {
    templateId: 'con1', level: 'l4', primaryGoal: 'High Repeatable Output',
    prepKeys: ['row-erg', 'inchworm', 'dead-bug', 'row-erg-technique'],
    specificBuildUpKeys: ['row-erg-high-output-bout'], blockKinds: ['conditioning'], blockIds: ['conditioning-main'],
    rounds: [8], stations: [[station('row-erg', 'CONDITIONING', 'hpull', { durationSeconds: 30 })]],
  },
  {
    templateId: 'con2', level: 'l1', primaryGoal: 'Learn to Move Under Load',
    prepKeys: ['row-erg', 'ankle-dorsiflexion-rock', 'glute-bridge', 'hip-hinge-drill'],
    specificBuildUpKeys: ['light-sled-push', 'light-farmer-carry'], blockKinds: ['conditioning'], blockIds: ['conditioning-main'],
    rounds: [3], stations: [[
      station('sled-push', 'CONDITIONING', 'hpush', { distanceMeters: 15 }),
      station('farmer-carry', 'CARRY', 'carry', { distanceMeters: 20 }),
    ]],
  },
  {
    templateId: 'con2', level: 'l2', primaryGoal: 'Repeat Loaded Movement',
    prepKeys: ['row-erg', 'ankle-dorsiflexion-rock', 'glute-bridge', 'hip-hinge-drill'],
    specificBuildUpKeys: ['moderate-sled-push', 'moderate-farmer-carry'], blockKinds: ['conditioning'], blockIds: ['conditioning-main'],
    rounds: [3], stations: [[
      station('sled-push', 'CONDITIONING', 'hpush', { distanceMeters: 20 }),
      station('farmer-carry', 'CARRY', 'carry', { distanceMeters: 25 }),
    ]],
  },
  {
    templateId: 'con2', level: 'l3', primaryGoal: 'Sustain Loaded Output',
    prepKeys: ['row-erg', 'ankle-dorsiflexion-rock', 'glute-bridge', 'hip-hinge-drill'],
    specificBuildUpKeys: ['moderate-high-sled-push', 'moderate-high-farmer-carry'], blockKinds: ['conditioning'], blockIds: ['conditioning-main'],
    rounds: [4], stations: [[
      station('sled-push', 'CONDITIONING', 'hpush', { distanceMeters: 20 }),
      station('farmer-carry', 'CARRY', 'carry', { distanceMeters: 30 }),
    ]],
  },
  {
    templateId: 'con2', level: 'l4', primaryGoal: 'High Loaded Repeatability',
    prepKeys: ['row-erg', 'ankle-dorsiflexion-rock', 'glute-bridge', 'hip-hinge-drill'],
    specificBuildUpKeys: ['high-control-sled-push', 'high-control-farmer-carry'], blockKinds: ['conditioning'], blockIds: ['conditioning-main'],
    rounds: [4], stations: [[
      station('sled-push', 'CONDITIONING', 'hpush', { distanceMeters: 20 }),
      station('farmer-carry', 'CARRY', 'carry', { distanceMeters: 30 }),
    ]],
  },
  {
    templateId: 'con3', level: 'l1', primaryGoal: 'Learn to Produce Power',
    prepKeys: ['row-erg', 'wall-hip-hinge', 'standing-brace', 'medicine-ball-slam-stance'],
    specificBuildUpKeys: ['medicine-ball-slam-build'], blockKinds: ['power', 'conditioning'], blockIds: ['power', 'conditioning-main'],
    rounds: [undefined, 3], stations: [[
      station('con3-l1-power', 'POWER', 'hinge', { sets: 3, reps: 5 }),
    ], [
      station('kb-deadlift', 'CONDITIONING', 'hinge', { reps: 8 }),
      station('farmer-carry', 'CARRY', 'carry', { distanceMeters: 20 }),
    ]],
  },
  {
    templateId: 'con3', level: 'l2', primaryGoal: 'Repeat Low-Complexity Power',
    prepKeys: ['row-erg', 'wall-hip-hinge', 'standing-brace', 'medicine-ball-slam-stance'],
    specificBuildUpKeys: ['medicine-ball-slam-build'], blockKinds: ['power', 'conditioning'], blockIds: ['power', 'conditioning-main'],
    rounds: [undefined, 3], stations: [[
      station('con3-l2-power', 'POWER', 'hinge', { sets: 4, reps: 5 }),
    ], [
      station('kb-rdl', 'CONDITIONING', 'hinge', { reps: { min: 8, max: 10 } }),
      station('farmer-carry', 'CARRY', 'carry', { distanceMeters: 25 }),
    ]],
  },
  {
    templateId: 'con3', level: 'l3', primaryGoal: 'Higher Repeatable Power',
    prepKeys: ['row-erg', 'wall-hip-hinge', 'standing-brace', 'medicine-ball-slam-stance'],
    specificBuildUpKeys: ['medicine-ball-slam-build'], blockKinds: ['power', 'conditioning'], blockIds: ['power', 'conditioning-main'],
    rounds: [undefined, 4], stations: [[
      station('con3-l3-power', 'POWER', 'hinge', { sets: 3, reps: 5 }),
    ], [station('farmer-carry', 'CARRY', 'carry', { distanceMeters: { min: 25, max: 30 } })]],
  },
  {
    templateId: 'con3', level: 'l4', primaryGoal: 'High Repeatable Power',
    prepKeys: ['row-erg', 'wall-hip-hinge', 'standing-brace', 'medicine-ball-slam-stance'],
    specificBuildUpKeys: ['medicine-ball-slam-build'], blockKinds: ['power', 'conditioning'], blockIds: ['power', 'conditioning-main'],
    rounds: [undefined, 4], stations: [[
      station('con3-l4-power', 'POWER', 'hinge', { sets: 3, reps: 5 }),
    ], [station('farmer-carry', 'CARRY', 'carry', { distanceMeters: 30 })]],
  },
  {
    templateId: 'con4', level: 'l1', primaryGoal: 'Basic Multiplanar Capacity',
    prepKeys: ['row-erg', 'ankle-dorsiflexion-rock', 'glute-bridge', 'step-up-pattern'],
    specificBuildUpKeys: ['low-box-step-up-build', 'skierg-build', 'bear-crawl-shuttle-build', 'sled-push-build'], blockKinds: ['conditioning'], blockIds: ['conditioning-main'],
    rounds: [3], stations: [[
      station('low-box-step-up', 'CONDITIONING', 'single', { reps: 6 }, 'unilateral'),
      station('skierg', 'CONDITIONING', 'vpull', { durationSeconds: 25 }),
      station('bear-crawl-shuttle', 'CONDITIONING', 'core', { distanceMeters: 10 }),
      station('sled-push', 'CONDITIONING', 'hpush', { distanceMeters: 15 }),
    ]],
  },
  {
    templateId: 'con4', level: 'l2', primaryGoal: 'Lateral Capacity',
    prepKeys: ['row-erg', 'ankle-dorsiflexion-rock', 'glute-bridge', 'lateral-lunge-pattern'],
    specificBuildUpKeys: ['lateral-lunge-build', 'skierg-build', 'bear-crawl-build', 'sled-push-build'], blockKinds: ['conditioning'], blockIds: ['conditioning-main'],
    rounds: [3], stations: [[
      station('lateral-lunge', 'CONDITIONING', 'single', { reps: 6 }, 'unilateral'),
      station('skierg', 'CONDITIONING', 'vpull', { durationSeconds: 30 }),
      station('bear-crawl', 'CONDITIONING', 'core', { distanceMeters: { min: 6, max: 8 } }),
      station('sled-push', 'CONDITIONING', 'hpush', { distanceMeters: 20 }),
    ]],
  },
  {
    templateId: 'con4', level: 'l3', primaryGoal: 'Sustain Multiplanar Work',
    prepKeys: ['row-erg', 'ankle-dorsiflexion-rock', 'glute-bridge', 'step-up-knee-drive-pattern'],
    specificBuildUpKeys: ['step-up-knee-drive-build', 'skierg-build', 'lateral-bear-crawl-build', 'sled-push-build'], blockKinds: ['conditioning'], blockIds: ['conditioning-main'],
    rounds: [3], stations: [[
      station('step-up-knee-drive', 'CONDITIONING', 'single', { reps: 6 }, 'unilateral'),
      station('skierg', 'CONDITIONING', 'vpull', { durationSeconds: 35 }),
      station('lateral-bear-crawl', 'CONDITIONING', 'core', { distanceMeters: 6 }, 'unilateral'),
      station('sled-push', 'CONDITIONING', 'hpush', { distanceMeters: 20 }),
    ]],
  },
  {
    templateId: 'con4', level: 'l4', primaryGoal: 'High Multiplanar Capacity',
    prepKeys: ['row-erg', 'ankle-dorsiflexion-rock', 'glute-bridge', 'multidirectional-lunge-pattern'],
    specificBuildUpKeys: ['multidirectional-lunge-build', 'skierg-build', 'lateral-bear-crawl-build', 'sled-push-build'], blockKinds: ['conditioning'], blockIds: ['conditioning-main'],
    rounds: [3], stations: [[
      station('multidirectional-lunge', 'CONDITIONING', 'single', { reps: 3 }, 'unilateral'),
      station('skierg', 'CONDITIONING', 'vpull', { durationSeconds: 40 }),
      station('lateral-bear-crawl', 'CONDITIONING', 'core', { distanceMeters: 8 }, 'unilateral'),
      station('sled-push', 'CONDITIONING', 'hpush', { distanceMeters: { min: 20, max: 25 } }),
    ]],
  },
  {
    templateId: 'con5', level: 'l1', primaryGoal: 'Hybrid Foundation',
    prepKeys: ['row-erg', 'thoracic-rotation', 'kb-hinge', 'light-sled-push'],
    specificBuildUpKeys: ['row-erg-build', 'sled-push-build', 'kb-deadlift-build', 'farmer-carry-build'], blockKinds: ['conditioning'], blockIds: ['conditioning-main'],
    rounds: [3], stations: [[
      station('row-erg', 'CONDITIONING', 'hpull', { distanceMeters: 100 }),
      station('sled-push', 'CONDITIONING', 'hpush', { distanceMeters: 15 }),
      station('kb-deadlift', 'CONDITIONING', 'hinge', { reps: 8 }),
      station('farmer-carry', 'CARRY', 'carry', { distanceMeters: 20 }),
    ]],
  },
  {
    templateId: 'con5', level: 'l2', primaryGoal: 'Repeat Hybrid Work',
    prepKeys: ['row-erg', 'thoracic-rotation', 'kb-hinge', 'light-sled-push'],
    specificBuildUpKeys: ['row-erg-build', 'sled-push-build', 'kb-rdl-build', 'farmer-carry-build'], blockKinds: ['conditioning'], blockIds: ['conditioning-main'],
    rounds: [3], stations: [[
      station('row-erg', 'CONDITIONING', 'hpull', { distanceMeters: 125 }),
      station('sled-push', 'CONDITIONING', 'hpush', { distanceMeters: 20 }),
      station('kb-rdl', 'CONDITIONING', 'hinge', { reps: { min: 8, max: 10 } }),
      station('farmer-carry', 'CARRY', 'carry', { distanceMeters: 25 }),
    ]],
  },
  {
    templateId: 'con5', level: 'l3', primaryGoal: 'Sustain Hybrid Output',
    prepKeys: ['row-erg', 'thoracic-rotation', 'kb-hinge', 'light-sled-push'],
    specificBuildUpKeys: ['row-erg-build', 'sled-push-build', 'kb-rdl-build', 'farmer-carry-build'], blockKinds: ['conditioning'], blockIds: ['conditioning-main'],
    rounds: [3], stations: [[
      station('row-erg', 'CONDITIONING', 'hpull', { distanceMeters: 150 }),
      station('sled-push', 'CONDITIONING', 'hpush', { distanceMeters: 20 }),
      station('kb-rdl', 'CONDITIONING', 'hinge', { reps: 10 }),
      station('farmer-carry', 'CARRY', 'carry', { distanceMeters: 30 }),
    ]],
  },
  {
    templateId: 'con5', level: 'l4', primaryGoal: 'High Hybrid Repeatability',
    prepKeys: ['row-erg', 'thoracic-rotation', 'kb-hinge', 'light-sled-push'],
    specificBuildUpKeys: ['row-erg-build', 'sled-push-build', 'kb-rdl-build', 'farmer-carry-build'], blockKinds: ['conditioning'], blockIds: ['conditioning-main'],
    rounds: [4], stations: [[
      station('row-erg', 'CONDITIONING', 'hpull', { distanceMeters: 150 }),
      station('sled-push', 'CONDITIONING', 'hpush', { distanceMeters: { min: 20, max: 25 } }),
      station('kb-rdl', 'CONDITIONING', 'hinge', { reps: 8 }),
      station('farmer-carry', 'CARRY', 'carry', { distanceMeters: 30 }),
    ]],
  },
]

const frozenCalculatedSessionTimes: Record<string, NumericRange> = {
  'con1/l1': { min: 17.42, max: 23.00 },
  'con1/l2': { min: 18.00, max: 23.58 },
  'con1/l3': { min: 17.67, max: 23.25 },
  'con1/l4': { min: 21.67, max: 27.42 },
  'con2/l1': { min: 14.08, max: 21.08 },
  'con2/l2': { min: 14.58, max: 21.08 },
  'con2/l3': { min: 17.17, max: 25.00 },
  'con2/l4': { min: 17.92, max: 25.75 },
  'con3/l1': { min: 17.75, max: 24.42 },
  'con3/l2': { min: 19.00, max: 25.75 },
  'con3/l3': { min: 17.67, max: 24.83 },
  'con3/l4': { min: 18.92, max: 26.08 },
  'con4/l1': { min: 18.92, max: 28.58 },
  'con4/l2': { min: 19.42, max: 28.58 },
  'con4/l3': { min: 20.42, max: 30.08 },
  'con4/l4': { min: 21.67, max: 31.33 },
  'con5/l1': { min: 19.50, max: 30.17 },
  'con5/l2': { min: 19.50, max: 29.67 },
  'con5/l3': { min: 19.50, max: 30.17 },
  'con5/l4': { min: 23.92, max: 36.50 },
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

  it('enforces the con1 through con5 template set boundary', () => {
    expect(auditConditioningTemplateSet([conditioningTemplateFixture])).toContainEqual(
      expect.objectContaining({ code: 'TEMPLATE_SET' }),
    )
  })
})

describe('conditioning structural audit', () => {
  it('accepts a complete conditioning level without requiring a PRIMARY exercise', () => {
    expect(auditConditioningTemplateLevel(makeAuditConditioningLevel())).toEqual([])
  })

  it('requires exactly four ordered R/M/A/P PrepItems', () => {
    const tooShort = makeAuditConditioningLevel()
    tooShort.prep = tooShort.prep.slice(0, 3)
    expect(auditConditioningTemplateLevel(tooShort)).toContainEqual(
      expect.objectContaining({ code: 'CON_PREP_COUNT' }),
    )

    const wrongPhase = makeAuditConditioningLevel()
    wrongPhase.prep[3] = { ...wrongPhase.prep[3], phase: 'R' }
    expect(auditConditioningTemplateLevel(wrongPhase)).toContainEqual(
      expect.objectContaining({ code: 'CON_PREP_PHASES' }),
    )
  })

  it('requires one canonical Prep identity and an explicit planning prescription', () => {
    const compound = makeAuditConditioningLevel()
    compound.prep[0] = { ...compound.prep[0], displayName: 'RowErg / SkiErg' }
    expect(auditConditioningTemplateLevel(compound)).toContainEqual(
      expect.objectContaining({ code: 'COMPOUND_EXERCISE_NAME' }),
    )

    const missingPlanning = makeAuditConditioningLevel()
    missingPlanning.prep[1] = { ...missingPlanning.prep[1], planningExecutionSeconds: undefined }
    expect(auditConditioningTemplateLevel(missingPlanning)).toContainEqual(
      expect.objectContaining({ code: 'CON_PLANNING_TIME' }),
    )
  })

  it('uses specificBuildUp for S and keeps rampUp empty', () => {
    const withRamp = makeAuditConditioningLevel()
    withRamp.rampUp = [{
      exerciseKey: 'row-erg',
      displayName: 'RowErg',
      order: 1,
      reps: 5,
      loadGuidance: 'easy',
      targetRole: 'SECONDARY',
    }]
    expect(auditConditioningTemplateLevel(withRamp)).toContainEqual(
      expect.objectContaining({ code: 'CON_RAMP_UP_FORBIDDEN' }),
    )

    const missingBuildUp = makeAuditConditioningLevel()
    missingBuildUp.specificBuildUp = []
    expect(auditConditioningTemplateLevel(missingBuildUp)).toContainEqual(
      expect.objectContaining({ code: 'CON_SPECIFIC_BUILD_UP_REQUIRED' }),
    )
  })

  it('requires atomic planning time for build-up and conditioning stations', () => {
    const missingBuildUpPlanning = makeAuditConditioningLevel()
    missingBuildUpPlanning.specificBuildUp![0] = {
      ...missingBuildUpPlanning.specificBuildUp![0],
      planningExecutionSeconds: undefined as never,
    }
    expect(auditConditioningTemplateLevel(missingBuildUpPlanning)).toContainEqual(
      expect.objectContaining({ code: 'CON_PLANNING_TIME' }),
    )

    const missingStationPlanning = makeAuditConditioningLevel()
    const station = missingStationPlanning.blocks[0].exercises[0] as TrainingExercise
    missingStationPlanning.blocks[0].exercises[0] = {
      ...station,
      planningExecutionSeconds: undefined,
    }
    expect(auditConditioningTemplateLevel(missingStationPlanning)).toContainEqual(
      expect.objectContaining({ code: 'CON_PLANNING_TIME' }),
    )
  })

  it('requires positive rounds, explicit station transition, and round recovery', () => {
    const invalidRounds = makeAuditConditioningLevel()
    invalidRounds.blocks[0] = { ...invalidRounds.blocks[0], rounds: 0 }
    expect(auditConditioningTemplateLevel(invalidRounds)).toContainEqual(
      expect.objectContaining({ code: 'CONDITIONING_ROUNDS' }),
    )

    const invalid = makeAuditConditioningLevel()
    invalid.blocks[0] = {
      ...invalid.blocks[0],
      transitionSeconds: undefined,
      restBetweenRoundsSeconds: undefined,
    }
    const issues = auditConditioningTemplateLevel(invalid)
    expect(issues).toContainEqual(expect.objectContaining({ code: 'CONDITIONING_TRANSITION' }))
    expect(issues).toContainEqual(expect.objectContaining({ code: 'CONDITIONING_RECOVERY' }))
  })

  it('keeps Power before Conditioning and requires the Power recovery boundary', () => {
    const powerLevel = makeAuditPowerTrackLevel()
    expect(auditConditioningTemplateLevel(powerLevel)).toEqual([])

    const outOfOrder = makeAuditPowerTrackLevel()
    outOfOrder.blocks = [outOfOrder.blocks[1], outOfOrder.blocks[0]]
    expect(auditConditioningTemplateLevel(outOfOrder)).toContainEqual(
      expect.objectContaining({ code: 'CON_BLOCK_ORDER' }),
    )

    const missingPowerRecovery = makeAuditPowerTrackLevel()
    missingPowerRecovery.blocks[0] = { ...missingPowerRecovery.blocks[0], restBetweenSetsSeconds: undefined }
    expect(auditConditioningTemplateLevel(missingPowerRecovery)).toContainEqual(
      expect.objectContaining({ code: 'POWER_RECOVERY_REQUIRED' }),
    )

    const missingBoundary = makeAuditPowerTrackLevel()
    missingBoundary.blocks[0] = { ...missingBoundary.blocks[0], transitionAfterSeconds: undefined }
    expect(auditConditioningTemplateLevel(missingBoundary)).toContainEqual(
      expect.objectContaining({ code: 'POWER_TO_CONDITIONING_TRANSITION_REQUIRED' }),
    )
  })

  it('rejects strength semantics, RIR, and action-level sets in conditioning work', () => {
    const withRir = makeAuditConditioningLevel()
    const firstStation = withRir.blocks[0].exercises[0] as TrainingExercise
    withRir.blocks[0].exercises[0] = {
      ...firstStation,
      prescription: { ...firstStation.prescription, rir: 2 },
    }
    expect(auditConditioningTemplateLevel(withRir)).toContainEqual(
      expect.objectContaining({ code: 'CON_RIR_FORBIDDEN' }),
    )

    const withSets = makeAuditConditioningLevel()
    const setStation = withSets.blocks[0].exercises[0] as TrainingExercise
    withSets.blocks[0].exercises[0] = {
      ...setStation,
      prescription: { ...setStation.prescription, sets: 3 },
    }
    expect(auditConditioningTemplateLevel(withSets)).toContainEqual(
      expect.objectContaining({ code: 'CONDITIONING_SETS_FORBIDDEN' }),
    )

    const withStrength = makeAuditConditioningLevel()
    withStrength.blocks[0] = { ...withStrength.blocks[0], kind: 'strength' }
    expect(auditConditioningTemplateLevel(withStrength)).toContainEqual(
      expect.objectContaining({ code: 'CON_BLOCK_KIND' }),
    )
  })

  it('enforces CON role mapping without requiring PRIMARY', () => {
    const invalid = makeAuditConditioningLevel()
    const carry = invalid.blocks[0].exercises[1] as TrainingExercise
    invalid.blocks[0].exercises[1] = { ...carry, role: 'CONDITIONING' }
    expect(auditConditioningTemplateLevel(invalid)).toContainEqual(
      expect.objectContaining({ code: 'CON_ROLE_MAPPING' }),
    )
  })

  it('requires output, intensity, progression, and planning metadata', () => {
    const incomplete = makeAuditConditioningLevel()
    incomplete.outputPlan = undefined
    incomplete.conditioningIntensityTarget = undefined
    incomplete.planningTime = undefined
    incomplete.progressionFromPrevious = undefined
    const issues = auditConditioningTemplateLevel(incomplete)
    expect(issues).toContainEqual(expect.objectContaining({ code: 'CON_OUTPUT_PLAN' }))
    expect(issues).toContainEqual(expect.objectContaining({ code: 'CON_INTENSITY_TARGET' }))
    expect(issues).toContainEqual(expect.objectContaining({ code: 'CON_PLANNING_TIME' }))
    expect(issues).toContainEqual(expect.objectContaining({ code: 'CON_PROGRESSION_REQUIRED' }))
  })

  it('allows applicable progression variables plus output and density, but rejects RIR', () => {
    const valid = makeAuditConditioningLevel()
    valid.progressionFromPrevious = {
      variables: ['load', 'volume', 'rest', 'control', 'output', 'density'],
      note: 'Increase output and density while preserving repeatability.',
    }
    expect(auditConditioningTemplateLevel(valid)).toEqual([])

    const invalid = makeAuditConditioningLevel()
    invalid.progressionFromPrevious = { variables: ['rir'], note: 'Do more.' }
    expect(auditConditioningTemplateLevel(invalid)).toContainEqual(
      expect.objectContaining({ code: 'CON_PROGRESSION_RIR_FORBIDDEN' }),
    )
  })

  it('validates conditional round policy without treating four rounds as an optional exercise', () => {
    const valid = makeAuditConditioningLevel()
    valid.blocks[0] = {
      ...valid.blocks[0],
      roundPolicy,
    }
    expect(auditConditioningTemplateLevel(valid)).toEqual([])

    const invalid = makeAuditConditioningLevel()
    invalid.blocks[0] = {
      ...invalid.blocks[0],
      roundPolicy: { standardRounds: 3, conditionalMaxRounds: 3, conditions: ['output-stability'] },
    }
    expect(auditConditioningTemplateLevel(invalid)).toContainEqual(
      expect.objectContaining({ code: 'CON_ROUND_POLICY_INVALID' }),
    )
  })

  it('keeps Foundation Regression separate from peer Power Track options', () => {
    const invalid = makeAuditPowerTrackLevel()
    const slot = invalid.blocks[0].exercises[0] as PowerTrackSlot
    slot.options = [...slot.options, {
      optionKey: 'foundation-regression',
      trackKey: 'foundation',
      path: makeAuditPowerPath('foundation-peer', 'medicine-ball-slam'),
      requiresTechniqueCompetency: false,
    }]
    expect(auditConditioningTemplateLevel(invalid)).toContainEqual(
      expect.objectContaining({ code: 'CON_FOUNDATION_REGRESSION_INVALID' }),
    )
  })

  it('does not require absolute pace, watts, or load values to pass the design audit', () => {
    const level = makeAuditConditioningLevel()
    level.outputPlan = {
      ...outputPlan,
      primary: { kind: 'pace', scope: 'bout', availability: 'when-available' },
    }
    expect(auditConditioningTemplateLevel(level)).toEqual([])
  })

  it('validates output metric semantics without introducing telemetry requirements', () => {
    const invalid = makeAuditConditioningLevel()
    invalid.outputPlan = {
      ...outputPlan,
      primary: { kind: 'watts' as never, scope: 'bout', availability: 'required' },
    }
    expect(auditConditioningTemplateLevel(invalid)).toContainEqual(
      expect.objectContaining({ code: 'CON_OUTPUT_PLAN' }),
    )

    const designOnly = makeAuditConditioningLevel()
    designOnly.outputPlan = {
      ...outputPlan,
      primary: { kind: 'power', scope: 'bout', availability: 'when-available' },
      outputStability: {
        kind: 'coach-design-target',
        description: 'Keep later bouts repeatable; do not use a numeric hard-fail threshold.',
      },
    }
    expect(auditConditioningTemplateLevel(designOnly)).toEqual([])
  })
})

describe('conditioning component time estimator', () => {
  it('keeps the conditioning component branch additive for 3C and BODY', () => {
    expect(estimateSessionMinutes(threeCTemplates[0].levels.l1).conditioningComponentsSeconds).toBeUndefined()
    expect(estimateSessionMinutes(bodyTemplates[0].levels.l1).conditioningComponentsSeconds).toBeUndefined()
  })

  it('uses the resolved selection before calculating the time components', () => {
    const powerLevel = makeAuditPowerTrackLevel()
    const estimate = estimateSessionMinutes(powerLevel)
    const components = estimate.conditioningComponentsSeconds!

    expect(components.powerWork).toEqual({ min: 60, max: 75 })
    expect(components.powerRecovery).toEqual({ min: 120, max: 120 })
    expect(components.interBlockTransitions).toEqual({ min: 30, max: 30 })
    expect(estimate.totalMinutes.max).toBeGreaterThan(0)
  })

  it('counts four-station transition arithmetic exactly', () => {
    const estimate = estimateSessionMinutes(makeAuditMultiStationLevel(4))
    expect(estimate.conditioningComponentsSeconds!.stationTransitions).toEqual({
      min: 210,
      max: 310,
    })
  })

  it('counts two-station transitions as A→B for each round and B→A between rounds', () => {
    const estimate = estimateSessionMinutes(makeAuditMultiStationLevel(2))
    expect(estimate.conditioningComponentsSeconds!.stationTransitions).toEqual({
      min: 90,
      max: 130,
    })
  })

  it('uses atomic planning ranges for distance and repetition stations', () => {
    const level = makeAuditConditioningLevel()
    const estimate = estimateSessionMinutes(level)
    expect(estimate.conditioningComponentsSeconds!.conditioningWork).toEqual({
      min: 120,
      max: 180,
    })
  })

  it('counts unilateral active work once for both sides and keeps side reset separate', () => {
    const level = makeAuditConditioningLevel()
    const unilateral = level.blocks[0].exercises[0] as TrainingExercise
    level.blocks[0].exercises[0] = {
      ...unilateral,
      laterality: 'unilateral',
      sideExecution: 'one-side-then-opposite',
      startingSidePolicy: 'coach-directed',
      sideRestSeconds: { min: 15, max: 20 },
      planningExecutionSeconds: { min: 30, max: 40 },
    }
    const components = estimateSessionMinutes(level).conditioningComponentsSeconds!

    expect(components.conditioningWork).toEqual({ min: 150, max: 210 })
    expect(components.unilateralReset).toEqual({ min: 45, max: 60 })
    expect(components.conditioningWork.max).toBeLessThan(240)
  })

  it('does not add a unilateral reset for alternating execution without a prescribed reset', () => {
    const level = makeAuditConditioningLevel()
    const unilateral = level.blocks[0].exercises[0] as TrainingExercise
    level.blocks[0].exercises[0] = {
      ...unilateral,
      laterality: 'unilateral',
      sideExecution: 'alternating',
      startingSidePolicy: 'alternate-between-sets',
      planningExecutionSeconds: { min: 30, max: 40 },
    }
    expect(estimateSessionMinutes(level).conditioningComponentsSeconds!.unilateralReset).toEqual({
      min: 0,
      max: 0,
    })
  })

  it('keeps Power Recovery, Power-to-Capacity transition, and round recovery distinct', () => {
    const components = estimateSessionMinutes(makeAuditPowerTrackLevel()).conditioningComponentsSeconds!
    expect(components.powerRecovery).toEqual({ min: 120, max: 120 })
    expect(components.interBlockTransitions).toEqual({ min: 30, max: 30 })
    expect(components.roundRecovery).toEqual({ min: 120, max: 120 })
    expect(components.stationTransitions).toEqual({ min: 90, max: 90 })
  })

  it('adds build-up coaching allowance exactly once', () => {
    const components = estimateSessionMinutes(makeAuditConditioningLevel()).conditioningComponentsSeconds!
    expect(components.specificBuildUp).toEqual({ min: 45, max: 70 })
  })

  it('reports zero Power Work and Power Recovery for non-Power CON levels', () => {
    const components = estimateSessionMinutes(makeAuditConditioningLevel()).conditioningComponentsSeconds!
    expect(components.powerWork).toEqual({ min: 0, max: 0 })
    expect(components.powerRecovery).toEqual({ min: 0, max: 0 })
  })

  it('rejects a CON level that lacks atomic planning time', () => {
    const level = makeAuditConditioningLevel()
    level.blocks[0].exercises[0] = {
      ...(level.blocks[0].exercises[0] as TrainingExercise),
      planningExecutionSeconds: undefined,
    }
    expect(() => estimateSessionMinutes(level)).toThrow(/planningExecutionSeconds/)
  })

  it('bypasses the generic planning floor for CON', () => {
    const level = makeAuditConditioningLevel()
    const estimate = estimateSessionMinutes(level)
    expect(estimate.totalMinutes.max).toBeLessThan(calculatePlanningFloorSeconds(level) / 60)
  })

  it('resolves a legal conditional fourth round before estimating', () => {
    const level = makeAuditConditioningLevel()
    level.blocks[0] = { ...level.blocks[0], roundPolicy }
    const standard = estimateSessionMinutes(level)
    const conditional = estimateSessionMinutes(level, {
      conditioningRounds: { 'conditioning-main': 4 },
    })
    expect(standard.conditioningComponentsSeconds!.conditioningWork).toEqual({ min: 120, max: 180 })
    expect(conditional.conditioningComponentsSeconds!.conditioningWork).toEqual({ min: 160, max: 240 })
    expect(conditional.totalMinutes.max).toBeGreaterThan(standard.totalMinutes.max)
  })
})

const frozenEntrySignature = (entry: TrainingBlock['exercises'][number]) => {
  if (isPowerTrackSlot(entry)) {
    return {
      exerciseKey: entry.exerciseKey,
      role: entry.role,
      movementPattern: entry.movementPattern,
      laterality: entry.laterality,
      prescription: entry.prescription,
    }
  }
  if (!isTrainingExercise(entry)) {
    return { kind: entry.kind }
  }
  return {
    exerciseKey: entry.exerciseKey,
    role: entry.role,
    movementPattern: entry.movementPattern,
    laterality: entry.laterality,
    prescription: entry.prescription,
  }
}

describe('Frozen CON 20-level manifest', () => {
  it('contains exactly runtime con1 through con5 with four levels each', () => {
    expect(conditioningTemplates.map((template) => template.id)).toEqual([
      'con1',
      'con2',
      'con3',
      'con4',
      'con5',
    ])
    expect(conditioningTemplates.every((template) => Object.keys(template.levels).length === 4)).toBe(true)
  })

  it.each(frozenConditioningManifest)('$templateId $level matches the frozen core manifest', (expected) => {
    const template = conditioningTemplates.find((candidate) => candidate.id === expected.templateId)
    const level = template?.levels[expected.level]
    expect(level).toBeDefined()
    expect(level?.primaryGoal).toBe(expected.primaryGoal)
    expect(level?.prep.map((item) => item.exerciseKey)).toEqual(expected.prepKeys)
    expect(level?.prep.map((item) => item.phase)).toEqual(['R', 'M', 'A', 'P'])
    expect(level?.rampUp).toEqual([])
    expect(level?.specificBuildUp?.map((item) => item.exerciseKey)).toEqual(expected.specificBuildUpKeys)
    expect(level?.blocks.map((block) => block.kind)).toEqual(expected.blockKinds)
    expect(level?.blocks.map((block) => block.id)).toEqual(expected.blockIds)
    expect(level?.blocks.map((block) => block.rounds)).toEqual(expected.rounds)
    expect(level?.blocks.map((block) => block.exercises.map(frozenEntrySignature))).toEqual(expected.stations)
  })

  it('locks every Prep, Build-up, and work item to an explicit planning range and prescription', () => {
    for (const template of conditioningTemplates) {
      for (const level of Object.values(template.levels)) {
        expect(level.prep).toHaveLength(4)
        for (const item of level.prep) {
          expect(item.exerciseKey).not.toMatch(/^action-\d+$/)
          expect(item.displayName).not.toMatch(/[+/]|或/)
          expect(item.prescription).not.toEqual({})
          expect(item.planningExecutionSeconds).toEqual(expect.objectContaining({ min: expect.any(Number), max: expect.any(Number) }))
        }
        expect(level.specificBuildUp?.length).toBeGreaterThan(0)
        for (const item of level.specificBuildUp ?? []) {
          expect(item.exerciseKey).not.toMatch(/^action-\d+$/)
          expect(item.displayName).not.toMatch(/[+/]|或/)
          expect(item.prescription).not.toEqual({})
          expect(item.planningExecutionSeconds).toEqual(expect.objectContaining({ min: expect.any(Number), max: expect.any(Number) }))
        }
        for (const block of level.blocks) {
          for (const item of block.exercises) {
            if (isTrainingExercise(item)) {
              expect(item.exerciseKey).not.toMatch(/^action-\d+$/)
              expect(item.displayName).not.toMatch(/[+/]|或/)
              expect(item.prescription).not.toEqual({})
              expect(item.planningExecutionSeconds).toEqual(expect.objectContaining({ min: expect.any(Number), max: expect.any(Number) }))
            } else if (isPowerTrackSlot(item)) {
              expect(item.exerciseKey).not.toMatch(/^action-\d+$/)
              expect(item.displayName).not.toMatch(/[+/]|或/)
            }
          }
        }
      }
    }
  })

  it('matches the frozen CON audit contract across all 20 levels', () => {
    expect(auditConditioningTemplateSet(conditioningTemplates)).toEqual([])
  })

  it('matches the independently snapshotted calculated session range for every level', () => {
    for (const template of conditioningTemplates) {
      for (const [levelKey, level] of Object.entries(template.levels)) {
        const expected = frozenCalculatedSessionTimes[template.id + '/' + levelKey]
        const actual = estimateSessionMinutes(level).totalMinutes
        expect(actual.min).toBeCloseTo(expected.min, 1)
        expect(actual.max).toBeCloseTo(expected.max, 1)
        expect(actual.max).toBeLessThanOrEqual(60)
        expect(level.estimatedMinutes.max).toBeGreaterThanOrEqual(actual.max)
      }
    }
  })

  it('snapshots explicit recovery and transition semantics for every block', () => {
    for (const template of conditioningTemplates) {
      for (const level of Object.values(template.levels)) {
        for (const block of level.blocks) {
          if (block.kind === 'conditioning') {
            expect(block.restBetweenRoundsSeconds).toBeDefined()
            expect(block.transitionSeconds).toBeDefined()
            expect(block.transitionBetweenRoundsSeconds).toBeDefined()
          }
          if (block.kind === 'power') {
            expect(block.restBetweenSetsSeconds).toBeDefined()
            expect(block.transitionAfterSeconds).toBeDefined()
          }
        }
      }
    }
  })

  it('snapshots unilateral execution and reset rules without doubling working sets', () => {
    const con4L1 = conditioningTemplates.find((template) => template.id === 'con4')!.levels.l1
    const con4L3 = conditioningTemplates.find((template) => template.id === 'con4')!.levels.l3
    const con3L4 = conditioningTemplates.find((template) => template.id === 'con3')!.levels.l4
    const stepUp = con4L1.blocks[0].exercises[0]
    const lateralCrawl = con4L3.blocks[0].exercises[2]
    const powerSlot = con3L4.blocks[0].exercises[0]

    expect(isTrainingExercise(stepUp) && stepUp.laterality).toBe('unilateral')
    expect(isTrainingExercise(stepUp) && stepUp.sideExecution).toBe('alternating')
    expect(isTrainingExercise(lateralCrawl) && lateralCrawl.sideExecution).toBe('one-side-then-opposite')
    expect(isTrainingExercise(lateralCrawl) && lateralCrawl.sideRestSeconds).toEqual(10)
    expect(isPowerTrackSlot(powerSlot)).toBe(true)
    if (isPowerTrackSlot(powerSlot)) {
      const throwPath = powerSlot.options.find((option) => option.optionKey === 'rotational-throw')!
      expect(throwPath.path.powerExercise.laterality).toBe('unilateral')
      expect(throwPath.path.powerExercise.sideExecution).toBe('one-side-then-opposite')
      expect(throwPath.path.powerExercise.sideRestSeconds).toEqual({ min: 15, max: 20 })
      expect(throwPath.path.powerExercise.startingSidePolicy).toBe('alternate-between-sets')
    }
  })

  it('preserves mutually exclusive CON03 Power paths and CON05 L3 round policy', () => {
    const con3L3 = conditioningTemplates.find((template) => template.id === 'con3')!.levels.l3
    const con3L4 = conditioningTemplates.find((template) => template.id === 'con3')!.levels.l4
    const l3Slot = con3L3.blocks[0].exercises[0]
    const l4Slot = con3L4.blocks[0].exercises[0]
    expect(isPowerTrackSlot(l3Slot)).toBe(true)
    expect(isPowerTrackSlot(l4Slot)).toBe(true)
    if (isPowerTrackSlot(l3Slot) && isPowerTrackSlot(l4Slot)) {
      expect(l3Slot.options.map((option) => option.optionKey)).toEqual(['kb-swing', 'medicine-ball-slam'])
      expect(l4Slot.options.map((option) => option.optionKey)).toEqual(['kb-swing', 'rotational-throw'])
      expect(l3Slot.foundationRegression).toBeDefined()
      expect(l4Slot.foundationRegression).toBeDefined()
      expect(l3Slot.options.some((option) => option.optionKey === 'foundation-regression')).toBe(false)
      expect(l4Slot.options.some((option) => option.optionKey === 'foundation-regression')).toBe(false)
    }

    const con5L3 = conditioningTemplates.find((template) => template.id === 'con5')!.levels.l3
    const block = con5L3.blocks.find((candidate) => candidate.id === 'conditioning-main')!
    expect(block.rounds).toBe(3)
    expect(block.roundPolicy).toEqual({
      standardRounds: 3,
      conditionalMaxRounds: 4,
      conditions: ['output-stability', 'recovery', 'technique', 'session-time'],
    })
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
