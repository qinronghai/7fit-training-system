import { describe, expect, it } from 'vitest'
import {
  isPowerTrackSlot,
  isSelectableExerciseSlot,
  isTrainingExercise,
  type ConditioningPowerPath,
  type ConditioningOutputPlan,
  type ConditioningPlanningTime,
  type ConditioningRoundPolicy,
  type Count,
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

type FrozenPrepManifest = {
  exerciseKey: string
  phase: PrepItem['phase']
  prescription: ExercisePrescription
  planningExecutionSeconds: NumericRange
  laterality: Laterality
}

type FrozenBuildManifest = {
  exerciseKey: string
  order: number
  prescription: ExercisePrescription
  planningExecutionSeconds: NumericRange
  laterality?: Laterality
  sideExecution?: SpecificBuildUpItem['sideExecution']
  sideRestSeconds?: Count
  restAfterSeconds?: Count
  transitionAfterSeconds?: Count
}

type FrozenStationManifest = {
  exerciseKey: string
  role: string
  movementPattern: string
  laterality: Laterality
  prescription: ExercisePrescription
  planningExecutionSeconds: NumericRange
  sideExecution?: TrainingExercise['sideExecution']
  sideRestSeconds?: Count
  startingSidePolicy?: TrainingExercise['startingSidePolicy']
  restSeconds?: Count
}

type FrozenBlockManifest = {
  id: string
  kind: TrainingBlock['kind']
  rounds?: number
  restBetweenSetsSeconds?: Count
  restBetweenRoundsSeconds?: Count
  transitionSeconds?: Count
  transitionBetweenRoundsSeconds?: Count
  transitionAfterSeconds?: Count
  stations: FrozenStationManifest[]
}

type FrozenScenarioManifest = {
  name: string
  selection: ProgrammingSelection
  prep: FrozenPrepManifest[]
  specificBuildUp: FrozenBuildManifest[]
  blocks?: FrozenBlockManifest[]
  planningTime?: ConditioningPlanningTime
  powerExercise?: FrozenStationManifest
  calculatedTime: NumericRange
}

type FrozenLevelManifest = {
  templateId: string
  level: 'l1' | 'l2' | 'l3' | 'l4'
  primaryGoal: string
  secondaryGoal: string
  prep: FrozenPrepManifest[]
  specificBuildUp: FrozenBuildManifest[]
  blocks: FrozenBlockManifest[]
  outputStability: string
  coachNoteIncludes: string[]
  planningTime: ConditioningPlanningTime
  calculatedTime: NumericRange
  scenarios?: FrozenScenarioManifest[]
}

const frozenPrep = (
  exerciseKey: string,
  phase: PrepItem['phase'],
  prescription: ExercisePrescription,
  planningExecutionSeconds: NumericRange,
  laterality: Laterality = 'bilateral',
): FrozenPrepManifest => ({ exerciseKey, phase, prescription, planningExecutionSeconds, laterality })

const frozenBuild = (
  exerciseKey: string,
  order: number,
  prescription: ExercisePrescription,
  planningExecutionSeconds: NumericRange,
  options: Pick<FrozenBuildManifest, 'laterality' | 'sideExecution' | 'sideRestSeconds' | 'restAfterSeconds' | 'transitionAfterSeconds'> = {},
): FrozenBuildManifest => ({ exerciseKey, order, prescription, planningExecutionSeconds, ...options })

const frozenStation = (
  exerciseKey: string,
  role: string,
  movementPattern: string,
  prescription: ExercisePrescription,
  planningExecutionSeconds: NumericRange,
  options: Partial<Pick<FrozenStationManifest, 'laterality' | 'sideExecution' | 'sideRestSeconds' | 'startingSidePolicy' | 'restSeconds'>> = {},
): FrozenStationManifest => ({
  exerciseKey,
  role,
  movementPattern,
  prescription,
  planningExecutionSeconds,
  ...options,
  laterality: options.laterality ?? 'bilateral',
})

const conditioningBlockManifest = (
  stations: FrozenStationManifest[],
  rounds: number,
  restBetweenRoundsSeconds: Count,
  transitionSeconds: Count,
  transitionBetweenRoundsSeconds: Count,
): FrozenBlockManifest => ({
  id: 'conditioning-main',
  kind: 'conditioning',
  rounds,
  restBetweenRoundsSeconds,
  transitionSeconds,
  transitionBetweenRoundsSeconds,
  stations,
})

const powerBlockManifest = (
  station: FrozenStationManifest,
  restBetweenSetsSeconds: Count,
  transitionAfterSeconds: Count,
): FrozenBlockManifest => ({
  id: 'power',
  kind: 'power',
  restBetweenSetsSeconds,
  transitionAfterSeconds,
  stations: [station],
})

const frozenOutputStability = (description: string): string => description

const frozenPlanning = (
  setupCoachingAllowanceSeconds: NumericRange,
  buildUpCoachingAllowanceSeconds: NumericRange,
): ConditioningPlanningTime => ({
  setupCoachingAllowanceSeconds,
  buildUpCoachingAllowanceSeconds,
})

const frozenConditioningManifest: FrozenLevelManifest[] = [
  {
    templateId: 'con1', level: 'l1', primaryGoal: 'Learn to Pace', secondaryGoal: '建立基础划船技术和恢复节奏。',
    prep: [
      frozenPrep('row-erg', 'R', { durationSeconds: 90 }, { min: 90, max: 90 }),
      frozenPrep('side-lying-open-book', 'M', { reps: 4 }, { min: 45, max: 60 }, 'unilateral'),
      frozenPrep('dead-bug', 'A', { reps: 5 }, { min: 45, max: 60 }, 'unilateral'),
      frozenPrep('row-erg-technique', 'P', { reps: 6 }, { min: 45, max: 60 }),
    ],
    specificBuildUp: [
      frozenBuild('row-erg-build-easy', 1, { durationSeconds: 20, sets: 2 }, { min: 20, max: 20 }),
      frozenBuild('row-erg-build-recovery', 2, { durationSeconds: 40, sets: 2 }, { min: 40, max: 40 }, { transitionAfterSeconds: { min: 15, max: 20 } }),
    ],
    blocks: [conditioningBlockManifest([
      frozenStation('row-erg', 'CONDITIONING', 'hpull', { durationSeconds: 30 }, { min: 30, max: 30 }),
    ], 6, 45, 0, 0)],
    outputStability: frozenOutputStability('第 6 轮距离应接近前几轮；不得出现首轮明显快于后续轮次的输出崩落。'),
    coachNoteIncludes: ['降低目标配速', '停止训练'],
    planningTime: frozenPlanning({ min: 240, max: 360 }, { min: 0, max: 0 }),
    calculatedTime: { min: 16.75, max: 19.58 },
  },
  {
    templateId: 'con1', level: 'l2', primaryGoal: 'Repeat Output', secondaryGoal: '提高 40s 工作段的配速控制能力。',
    prep: [
      frozenPrep('row-erg', 'R', { durationSeconds: 90 }, { min: 90, max: 90 }),
      frozenPrep('side-lying-open-book', 'M', { reps: 4 }, { min: 45, max: 60 }, 'unilateral'),
      frozenPrep('band-straight-arm-pulldown', 'A', { reps: 8 }, { min: 45, max: 60 }),
      frozenPrep('row-erg-rhythm', 'P', { reps: { min: 6, max: 8 } }, { min: 45, max: 60 }),
    ],
    specificBuildUp: [
      frozenBuild('row-erg-build-moderate', 1, { durationSeconds: 20 }, { min: 20, max: 20 }),
      frozenBuild('row-erg-build-easy', 2, { durationSeconds: 20 }, { min: 20, max: 20 }),
      frozenBuild('row-erg-build-target', 3, { durationSeconds: 20 }, { min: 20, max: 20 }),
      frozenBuild('row-erg-build-recovery', 4, { durationSeconds: 20 }, { min: 20, max: 20 }, { transitionAfterSeconds: { min: 15, max: 20 } }),
    ],
    blocks: [conditioningBlockManifest([
      frozenStation('row-erg', 'CONDITIONING', 'hpull', { durationSeconds: 40 }, { min: 40, max: 40 }),
    ], 6, 40, 0, 0)],
    outputStability: frozenOutputStability('第 6 轮仍应保持接近前几轮的距离和配速。'),
    coachNoteIncludes: ['降低目标配速', '恢复时间回到 45s'],
    planningTime: frozenPlanning({ min: 240, max: 360 }, { min: 0, max: 0 }),
    calculatedTime: { min: 16.67, max: 19.50 },
  },
  {
    templateId: 'con1', level: 'l3', primaryGoal: 'Sustain Output', secondaryGoal: '提高可持续 Work density，而不是追求单轮最大速度。',
    prep: [
      frozenPrep('row-erg', 'R', { durationSeconds: { min: 75, max: 90 } }, { min: 75, max: 90 }),
      frozenPrep('side-lying-open-book', 'M', { reps: 4 }, { min: 45, max: 60 }, 'unilateral'),
      frozenPrep('dead-bug', 'A', { reps: 5 }, { min: 45, max: 60 }, 'unilateral'),
      frozenPrep('row-erg-long-stroke', 'P', { reps: 6 }, { min: 45, max: 60 }),
    ],
    specificBuildUp: [
      frozenBuild('row-erg-build-target-long', 1, { durationSeconds: 30 }, { min: 30, max: 30 }),
      frozenBuild('row-erg-build-easy', 2, { durationSeconds: 30 }, { min: 30, max: 30 }),
      frozenBuild('row-erg-build-target-short', 3, { durationSeconds: 20 }, { min: 20, max: 20 }),
      frozenBuild('row-erg-build-recovery-short', 4, { durationSeconds: 20 }, { min: 20, max: 20 }, { transitionAfterSeconds: { min: 25, max: 30 } }),
    ],
    blocks: [conditioningBlockManifest([
      frozenStation('row-erg', 'CONDITIONING', 'hpull', { durationSeconds: 45 }, { min: 45, max: 45 }),
    ], 6, 30, 0, 0)],
    outputStability: frozenOutputStability('在 Recovery 缩短后，第 4–6 轮仍需保持目标距离，不能通过首轮过度冲刺换取高 RPE。'),
    coachNoteIncludes: ['Recovery 从 30s 调回 45s', '停止该 Block'],
    planningTime: frozenPlanning({ min: 300, max: 420 }, { min: 0, max: 0 }),
    calculatedTime: { min: 17.58, max: 20.67 },
  },
  {
    templateId: 'con1', level: 'l4', primaryGoal: 'High Repeatable Output', secondaryGoal: '建立高输出但可重复的 Erg interval 能力。',
    prep: [
      frozenPrep('row-erg', 'R', { durationSeconds: 90 }, { min: 90, max: 90 }),
      frozenPrep('side-lying-open-book', 'M', { reps: 4 }, { min: 45, max: 60 }, 'unilateral'),
      frozenPrep('band-straight-arm-pulldown', 'A', { reps: 8 }, { min: 45, max: 60 }),
      frozenPrep('row-erg-target-pace', 'P', { reps: 5 }, { min: 45, max: 60 }),
    ],
    specificBuildUp: [
      frozenBuild('row-erg-build-control', 1, { durationSeconds: 20 }, { min: 20, max: 20 }),
      frozenBuild('row-erg-build-easy', 2, { durationSeconds: 20 }, { min: 20, max: 20 }),
      frozenBuild('row-erg-build-target', 3, { durationSeconds: 30 }, { min: 30, max: 30 }),
      frozenBuild('row-erg-build-easy-long', 4, { durationSeconds: 30 }, { min: 30, max: 30 }),
      frozenBuild('row-erg-build-target-final', 5, { durationSeconds: 30 }, { min: 30, max: 30 }),
      frozenBuild('row-erg-build-recovery-final', 6, { durationSeconds: { min: 25, max: 30 } }, { min: 25, max: 30 }),
    ],
    blocks: [conditioningBlockManifest([
      frozenStation('row-erg', 'CONDITIONING', 'hpull', { durationSeconds: 30 }, { min: 30, max: 30 }),
    ], 8, 60, 0, 0)],
    outputStability: frozenOutputStability('第 7–8 轮仍应维持接近前两轮的距离；不得通过第一轮超出可持续范围的冲刺制造虚假成绩。'),
    coachNoteIncludes: ['降低目标距离', '停止 Block'],
    planningTime: frozenPlanning({ min: 300, max: 420 }, { min: 0, max: 0 }),
    calculatedTime: { min: 22.33, max: 25.17 },
  },
  {
    templateId: 'con2', level: 'l1', primaryGoal: 'Learn to Move Under Load', secondaryGoal: '保持姿势、呼吸和站点转换质量。',
    prep: [
      frozenPrep('row-erg', 'R', { durationSeconds: { min: 60, max: 90 } }, { min: 60, max: 90 }),
      frozenPrep('wall-ankle-knee-to-wall', 'M', { reps: 5 }, { min: 45, max: 60 }, 'unilateral'),
      frozenPrep('glute-bridge', 'A', { reps: 8 }, { min: 45, max: 60 }),
      frozenPrep('wall-hip-hinge', 'P', { reps: 6 }, { min: 45, max: 60 }),
    ],
    specificBuildUp: [
      frozenBuild('light-sled-push', 1, { distanceMeters: 10 }, { min: 15, max: 25 }),
      frozenBuild('light-farmer-carry', 2, { distanceMeters: 10 }, { min: 15, max: 25 }),
    ],
    blocks: [conditioningBlockManifest([
      frozenStation('sled-push', 'CONDITIONING', 'hpush', { distanceMeters: 15 }, { min: 25, max: 45 }),
      frozenStation('farmer-carry', 'CARRY', 'carry', { distanceMeters: 20 }, { min: 30, max: 50 }),
    ], 3, { min: 60, max: 75 }, { min: 20, max: 30 }, { min: 15, max: 20 })],
    outputStability: frozenOutputStability('三轮之间 Sled split 不应逐轮明显变慢；Carry 应保持躯干稳定、步幅连续和握持控制。'),
    coachNoteIncludes: ['降低雪橇负荷', '降低 Carry 负荷', '延长站点转换'],
    planningTime: frozenPlanning({ min: 300, max: 420 }, { min: 25, max: 45 }),
    calculatedTime: { min: 15.42, max: 22.50 },
  },
  {
    templateId: 'con2', level: 'l2', primaryGoal: 'Repeat Loaded Movement', secondaryGoal: '在标准 Recovery 下保持 Sled split 和 Carry 姿势。',
    prep: [
      frozenPrep('row-erg', 'R', { durationSeconds: 75 }, { min: 75, max: 75 }),
      frozenPrep('wall-ankle-knee-to-wall', 'M', { reps: 5 }, { min: 45, max: 60 }, 'unilateral'),
      frozenPrep('glute-bridge', 'A', { reps: 8 }, { min: 45, max: 60 }),
      frozenPrep('wall-hip-hinge', 'P', { reps: 6 }, { min: 45, max: 60 }),
    ],
    specificBuildUp: [
      frozenBuild('moderate-sled-push', 1, { distanceMeters: 10 }, { min: 15, max: 25 }),
      frozenBuild('moderate-farmer-carry', 2, { distanceMeters: 15 }, { min: 20, max: 30 }),
    ],
    blocks: [conditioningBlockManifest([
      frozenStation('sled-push', 'CONDITIONING', 'hpush', { distanceMeters: 20 }, { min: 35, max: 55 }),
      frozenStation('farmer-carry', 'CARRY', 'carry', { distanceMeters: 25 }, { min: 40, max: 60 }),
    ], 3, 60, { min: 20, max: 30 }, { min: 15, max: 20 })],
    outputStability: frozenOutputStability('在距离增加后，第 3 轮仍需保持稳定呼吸和可接受的 Sled split。'),
    coachNoteIncludes: ['降低负荷', '增加 Round Recovery'],
    planningTime: frozenPlanning({ min: 300, max: 420 }, { min: 20, max: 40 }),
    calculatedTime: { min: 16.67, max: 22.75 },
  },
  {
    templateId: 'con2', level: 'l3', primaryGoal: 'Sustain Loaded Output', secondaryGoal: '建立可重复的高工作容量，同时保留输出余量。',
    prep: [
      frozenPrep('row-erg', 'R', { durationSeconds: 90 }, { min: 90, max: 90 }),
      frozenPrep('wall-ankle-knee-to-wall', 'M', { reps: 5 }, { min: 45, max: 60 }, 'unilateral'),
      frozenPrep('glute-bridge', 'A', { reps: 8 }, { min: 45, max: 60 }),
      frozenPrep('wall-hip-hinge', 'P', { reps: 6 }, { min: 45, max: 60 }),
    ],
    specificBuildUp: [
      frozenBuild('moderate-high-sled-push', 1, { distanceMeters: 10 }, { min: 15, max: 25 }),
      frozenBuild('moderate-high-farmer-carry', 2, { distanceMeters: 15 }, { min: 20, max: 30 }),
    ],
    blocks: [conditioningBlockManifest([
      frozenStation('sled-push', 'CONDITIONING', 'hpush', { distanceMeters: 20 }, { min: 35, max: 55 }),
      frozenStation('farmer-carry', 'CARRY', 'carry', { distanceMeters: 30 }, { min: 50, max: 75 }),
    ], 4, { min: 60, max: 75 }, { min: 20, max: 30 }, { min: 15, max: 20 })],
    outputStability: frozenOutputStability('第 4 轮仍需保持目标 split 和姿势；L3 要求存在可观察的输出余量，而不是每轮都接近失败。'),
    coachNoteIncludes: ['降低雪橇负荷', '降低 Carry 负荷', '不通过增加复杂 Carry'],
    planningTime: frozenPlanning({ min: 360, max: 480 }, { min: 25, max: 40 }),
    calculatedTime: { min: 21.50, max: 29.50 },
  },
  {
    templateId: 'con2', level: 'l4', primaryGoal: 'High Loaded Repeatability', secondaryGoal: '保持目标 split、Carry 姿势和四轮输出稳定。',
    prep: [
      frozenPrep('row-erg', 'R', { durationSeconds: 90 }, { min: 90, max: 90 }),
      frozenPrep('wall-ankle-knee-to-wall', 'M', { reps: 5 }, { min: 45, max: 60 }, 'unilateral'),
      frozenPrep('glute-bridge', 'A', { reps: 8 }, { min: 45, max: 60 }),
      frozenPrep('wall-hip-hinge', 'P', { reps: 6 }, { min: 45, max: 60 }),
    ],
    specificBuildUp: [
      frozenBuild('high-control-sled-push', 1, { distanceMeters: 10 }, { min: 15, max: 25 }),
      frozenBuild('high-control-farmer-carry', 2, { distanceMeters: 15 }, { min: 20, max: 30 }),
    ],
    blocks: [conditioningBlockManifest([
      frozenStation('sled-push', 'CONDITIONING', 'hpush', { distanceMeters: 20 }, { min: 35, max: 55 }),
      frozenStation('farmer-carry', 'CARRY', 'carry', { distanceMeters: 30 }, { min: 50, max: 75 }),
    ], 4, { min: 75, max: 90 }, { min: 20, max: 30 }, { min: 15, max: 20 })],
    outputStability: frozenOutputStability('L4 的负荷必须能够让四轮都完成。若第 3–4 轮明显崩盘，该负荷不属于可重复工作负荷。'),
    coachNoteIncludes: ['降低 Sled 或 Carry 负荷', '延长 Round Recovery', '不以更复杂的 Carry'],
    planningTime: frozenPlanning({ min: 360, max: 480 }, { min: 25, max: 40 }),
    calculatedTime: { min: 22.25, max: 30.25 },
  },
  {
    templateId: 'con3', level: 'l1', primaryGoal: 'Learn to Produce Power', secondaryGoal: '建立基础爆发动作和低复杂度负重移动能力。',
    prep: [
      frozenPrep('row-erg', 'R', { durationSeconds: { min: 60, max: 90 } }, { min: 60, max: 90 }),
      frozenPrep('wall-hip-hinge', 'M', { reps: 6 }, { min: 45, max: 60 }),
      frozenPrep('glute-bridge', 'A', { reps: 8 }, { min: 45, max: 60 }),
      frozenPrep('medicine-ball-slam-technique', 'P', { reps: 3 }, { min: 45, max: 60 }),
    ],
    specificBuildUp: [
      frozenBuild('medicine-ball-slam-build', 1, { reps: 3 }, { min: 6, max: 12 }),
      frozenBuild('kb-deadlift-build', 2, { reps: 4 }, { min: 10, max: 20 }),
      frozenBuild('farmer-carry-build', 3, { distanceMeters: 10 }, { min: 15, max: 25 }),
    ],
    blocks: [
      powerBlockManifest(frozenStation('medicine-ball-slam', 'POWER', 'hinge', { sets: 3, reps: 5 }, { min: 10, max: 20 }, { restSeconds: 60 }), 60, { min: 45, max: 60 }),
      conditioningBlockManifest([
        frozenStation('kb-deadlift', 'CONDITIONING', 'hinge', { reps: 8 }, { min: 20, max: 35 }),
        frozenStation('farmer-carry', 'CARRY', 'carry', { distanceMeters: 20 }, { min: 30, max: 50 }),
      ], 3, 60, { min: 20, max: 30 }, { min: 15, max: 20 }),
    ],
    outputStability: frozenOutputStability('Medicine Ball Slam 的每组 5 次保持主动速度意图；Capacity 三轮不因局部疲劳破坏 Carry 姿势。'),
    coachNoteIncludes: ['立即结束该组', '降低负荷', '不把 Power 动作移入 Capacity'],
    planningTime: frozenPlanning({ min: 300, max: 420 }, { min: 35, max: 45 }),
    calculatedTime: { min: 18.60, max: 25.62 },
  },
  {
    templateId: 'con3', level: 'l2', primaryGoal: 'Repeat Low-Complexity Power', secondaryGoal: '提高低复杂度 Hinge 与 Carry 的重复输出。',
    prep: [
      frozenPrep('row-erg', 'R', { durationSeconds: { min: 75, max: 90 } }, { min: 75, max: 90 }),
      frozenPrep('wall-hip-hinge', 'M', { reps: 6 }, { min: 45, max: 55 }),
      frozenPrep('dead-bug', 'A', { reps: 5 }, { min: 45, max: 55 }, 'unilateral'),
      frozenPrep('medicine-ball-slam-technique', 'P', { reps: 3 }, { min: 45, max: 55 }),
    ],
    specificBuildUp: [
      frozenBuild('medicine-ball-slam-build', 1, { reps: 3 }, { min: 6, max: 12 }),
      frozenBuild('kb-rdl-build', 2, { reps: 4 }, { min: 15, max: 25 }),
      frozenBuild('farmer-carry-build', 3, { distanceMeters: 15 }, { min: 20, max: 30 }),
    ],
    blocks: [
      powerBlockManifest(frozenStation('medicine-ball-slam', 'POWER', 'hinge', { sets: 4, reps: 5 }, { min: 10, max: 20 }, { restSeconds: 60 }), 60, { min: 45, max: 60 }),
      conditioningBlockManifest([
        frozenStation('kb-rdl', 'CONDITIONING', 'hinge', { reps: { min: 8, max: 10 } }, { min: 25, max: 40 }),
        frozenStation('farmer-carry', 'CARRY', 'carry', { distanceMeters: 25 }, { min: 40, max: 60 }),
      ], 3, 60, { min: 20, max: 30 }, { min: 15, max: 20 }),
    ],
    outputStability: frozenOutputStability('四组 Medicine Ball Slam 的第 4 组仍需保持主动速度意图；Capacity 第 3 轮不出现明显 Carry 姿势下降。'),
    coachNoteIncludes: ['停止当前组', '降低 KB 负荷', '延长 Round Recovery'],
    planningTime: frozenPlanning({ min: 300, max: 420 }, { min: 30, max: 45 }),
    calculatedTime: { min: 20.85, max: 27.62 },
  },
  {
    templateId: 'con3', level: 'l3', primaryGoal: 'Higher Repeatable Power', secondaryGoal: '在 Power Block 后维持四轮 Carry 输出。',
    prep: [], specificBuildUp: [], blocks: [
      powerBlockManifest(
        frozenStation('medicine-ball-slam', 'POWER', 'hinge', { sets: 4, reps: 5 }, { min: 10, max: 20 }, { restSeconds: { min: 60, max: 75 } }),
        { min: 60, max: 75 },
        { min: 60, max: 90 },
      ),
      conditioningBlockManifest([
        frozenStation('farmer-carry', 'CARRY', 'carry', { distanceMeters: { min: 25, max: 30 } }, { min: 40, max: 75 }),
      ], 4, { min: 60, max: 75 }, 0, 0),
    ],
    outputStability: frozenOutputStability('Power Block 每组动作质量保持稳定；Carry 第 4 轮仍需完成目标距离和姿势控制。'),
    coachNoteIncludes: ['不在 Swing 前先做另一条 Power 路径', '降低负荷', '不用 RIR'],
    planningTime: frozenPlanning({ min: 360, max: 480 }, { min: 31, max: 50 }),
    calculatedTime: { min: 20.52, max: 31.00 },
    scenarios: [
      {
        name: 'Medicine Ball Power Track',
        selection: {},
        prep: [
          frozenPrep('row-erg', 'R', { durationSeconds: { min: 75, max: 90 } }, { min: 75, max: 90 }),
          frozenPrep('wall-slide', 'M', { reps: 6 }, { min: 45, max: 60 }),
          frozenPrep('dead-bug', 'A', { reps: 5 }, { min: 45, max: 60 }, 'unilateral'),
          frozenPrep('medicine-ball-slam-technique', 'P', { reps: 3 }, { min: 45, max: 60 }),
        ],
        specificBuildUp: [
          frozenBuild('medicine-ball-slam-build', 1, { reps: 3 }, { min: 6, max: 12 }),
          frozenBuild('medicine-ball-slam-target-build', 2, { reps: 2 }, { min: 4, max: 8 }),
        ],
        planningTime: frozenPlanning({ min: 360, max: 480 }, { min: 31, max: 50 }),
        powerExercise: frozenStation('medicine-ball-slam', 'POWER', 'hinge', { sets: 4, reps: 5 }, { min: 10, max: 20 }, { restSeconds: { min: 60, max: 75 } }),
        calculatedTime: { min: 20.52, max: 29.00 },
      },
      {
        name: 'Swing Track',
        selection: { powerTracks: { 'con3-l3-power': { optionKey: 'kb-swing', techniqueReady: true } } },
        prep: [
          frozenPrep('row-erg', 'R', { durationSeconds: { min: 75, max: 90 } }, { min: 75, max: 90 }),
          frozenPrep('wall-hip-hinge', 'M', { reps: 6 }, { min: 45, max: 60 }),
          frozenPrep('glute-bridge', 'A', { reps: 8 }, { min: 45, max: 60 }),
          frozenPrep('kettlebell-swing-stance', 'P', { reps: 3 }, { min: 45, max: 60 }),
        ],
        specificBuildUp: [
          frozenBuild('kb-deadlift-build', 1, { reps: 3 }, { min: 8, max: 15 }),
          frozenBuild('kb-swing-build', 2, { reps: 3 }, { min: 10, max: 15 }),
        ],
        planningTime: frozenPlanning({ min: 360, max: 480 }, { min: 23, max: 40 }),
        powerExercise: frozenStation('kb-swing', 'POWER', 'hinge', { sets: 5, reps: 6 }, { min: 15, max: 25 }, { restSeconds: { min: 60, max: 75 } }),
        calculatedTime: { min: 22.10, max: 31.00 },
      },
    ],
  },
  {
    templateId: 'con3', level: 'l4', primaryGoal: 'High Repeatable Power', secondaryGoal: '维持四轮 Carry 输出，而不是用疲劳吞掉爆发质量。',
    prep: [], specificBuildUp: [], blocks: [
      powerBlockManifest(
        frozenStation('medicine-ball-slam', 'POWER', 'hinge', { sets: 4, reps: 5 }, { min: 10, max: 20 }, { restSeconds: 60 }),
        { min: 75, max: 90 },
        { min: 75, max: 120 },
      ),
      conditioningBlockManifest([
        frozenStation('farmer-carry', 'CARRY', 'carry', { distanceMeters: 30 }, { min: 50, max: 75 }),
      ], 4, { min: 75, max: 90 }, 0, 0),
    ],
    outputStability: frozenOutputStability('L4 需要表现为高质量 Power + 可重复 Capacity。若后半段动作速度、投掷距离或 Carry 姿势明显下降，应调整恢复或负荷。'),
    coachNoteIncludes: ['Foundation Regression', '不同时执行', '停止当前组', '不降低 Program Level'],
    planningTime: frozenPlanning({ min: 360, max: 480 }, { min: 31, max: 50 }),
    calculatedTime: { min: 22.43, max: 34.75 },
    scenarios: [
      {
        name: 'Foundation Regression', selection: {},
        prep: [
          frozenPrep('row-erg', 'R', { durationSeconds: 90 }, { min: 90, max: 90 }),
          frozenPrep('wall-slide', 'M', { reps: 6 }, { min: 45, max: 60 }),
          frozenPrep('dead-bug', 'A', { reps: 5 }, { min: 45, max: 60 }, 'unilateral'),
          frozenPrep('medicine-ball-slam-technique', 'P', { reps: 3 }, { min: 45, max: 60 }),
        ],
        specificBuildUp: [
          frozenBuild('medicine-ball-slam-build', 1, { reps: 3 }, { min: 6, max: 12 }),
          frozenBuild('medicine-ball-slam-target-build', 2, { reps: 2 }, { min: 4, max: 8 }),
        ],
        planningTime: frozenPlanning({ min: 360, max: 480 }, { min: 31, max: 50 }),
        powerExercise: frozenStation('medicine-ball-slam', 'POWER', 'hinge', { sets: 4, reps: 5 }, { min: 10, max: 20 }, { restSeconds: 60 }),
        calculatedTime: { min: 22.43, max: 29.50 },
      },
      {
        name: 'Track A | Hinge Power', selection: { powerTracks: { 'con3-l4-power': { optionKey: 'kb-swing', techniqueReady: true } } },
        prep: [
          frozenPrep('row-erg', 'R', { durationSeconds: 90 }, { min: 90, max: 90 }),
          frozenPrep('wall-hip-hinge', 'M', { reps: 6 }, { min: 45, max: 60 }),
          frozenPrep('glute-bridge', 'A', { reps: 8 }, { min: 45, max: 60 }),
          frozenPrep('kettlebell-swing-stance', 'P', { reps: 3 }, { min: 45, max: 60 }),
        ],
        specificBuildUp: [
          frozenBuild('kb-deadlift-build', 1, { reps: 3 }, { min: 8, max: 15 }),
          frozenBuild('kb-swing-build', 2, { reps: 3 }, { min: 10, max: 15 }),
        ],
        planningTime: frozenPlanning({ min: 360, max: 480 }, { min: 23, max: 40 }),
        powerExercise: frozenStation('kb-swing', 'POWER', 'hinge', { sets: 5, reps: { min: 5, max: 6 } }, { min: 15, max: 25 }, { restSeconds: { min: 75, max: 90 } }),
        calculatedTime: { min: 25.02, max: 33.25 },
      },
      {
        name: 'Track B | Rotational Power', selection: { powerTracks: { 'con3-l4-power': { optionKey: 'rotational-throw', techniqueReady: true } } },
        prep: [
          frozenPrep('row-erg', 'R', { durationSeconds: 90 }, { min: 90, max: 90 }),
          frozenPrep('side-lying-open-book', 'M', { reps: 4 }, { min: 45, max: 60 }, 'unilateral'),
          frozenPrep('dead-bug', 'A', { reps: 5 }, { min: 45, max: 60 }, 'unilateral'),
          frozenPrep('medicine-ball-rotational-throw-stance', 'P', { reps: 2 }, { min: 45, max: 60 }, 'unilateral'),
        ],
        specificBuildUp: [
          frozenBuild('rotational-throw-build', 1, { reps: 2 }, { min: 12, max: 20 }, { laterality: 'unilateral', sideExecution: 'one-side-then-opposite', sideRestSeconds: { min: 15, max: 20 } }),
        ],
        planningTime: frozenPlanning({ min: 360, max: 480 }, { min: 14, max: 55 }),
        powerExercise: frozenStation('rotational-throw', 'POWER', 'rotation', { sets: 4, reps: 5 }, { min: 30, max: 50 }, { laterality: 'unilateral', sideExecution: 'one-side-then-opposite', sideRestSeconds: { min: 15, max: 20 }, startingSidePolicy: 'alternate-between-sets', restSeconds: { min: 75, max: 90 } }),
        calculatedTime: { min: 25.52, max: 34.75 },
      },
    ],
  },
  {
    templateId: 'con4', level: 'l1', primaryGoal: 'Basic Multiplanar Capacity', secondaryGoal: '建立 Erg、locomotion 与 Sled 之间的基础转换能力。',
    prep: [
      frozenPrep('row-erg', 'R', { durationSeconds: 60 }, { min: 60, max: 60 }),
      frozenPrep('wall-ankle-knee-to-wall', 'M', { reps: 5 }, { min: 45, max: 60 }, 'unilateral'),
      frozenPrep('band-lateral-walk', 'A', { reps: 6 }, { min: 45, max: 60 }, 'unilateral'),
      frozenPrep('low-box-step-up', 'P', { reps: 3 }, { min: 45, max: 60 }, 'unilateral'),
    ],
    specificBuildUp: [
      frozenBuild('skierg-build', 1, { durationSeconds: 15 }, { min: 15, max: 15 }),
      frozenBuild('bear-crawl-shuttle-build', 2, { distanceMeters: 6 }, { min: 25, max: 35 }),
      frozenBuild('sled-push-build', 3, { distanceMeters: 10 }, { min: 15, max: 25 }),
    ],
    blocks: [conditioningBlockManifest([
      frozenStation('low-box-step-up', 'CONDITIONING', 'single', { reps: 6 }, { min: 45, max: 75 }, { laterality: 'unilateral', sideExecution: 'alternating', startingSidePolicy: 'coach-directed' }),
      frozenStation('skierg', 'CONDITIONING', 'vpull', { durationSeconds: 25 }, { min: 25, max: 25 }),
      frozenStation('bear-crawl-shuttle', 'CONDITIONING', 'core', { distanceMeters: 10 }, { min: 35, max: 55 }),
      frozenStation('sled-push', 'CONDITIONING', 'hpush', { distanceMeters: 15 }, { min: 25, max: 45 }),
    ], 3, 60, { min: 20, max: 30 }, { min: 15, max: 20 })],
    outputStability: frozenOutputStability('方向转换后仍能保持步态、躯干位置和呼吸控制；不得因追求速度而破坏熊爬或台阶上步质量。'),
    coachNoteIncludes: ['降低箱高', '缩短距离', '降低负荷'],
    planningTime: frozenPlanning({ min: 360, max: 480 }, { min: 40, max: 70 }),
    calculatedTime: { min: 22.83, max: 31.58 },
  },
  {
    templateId: 'con4', level: 'l2', primaryGoal: 'Lateral Capacity', secondaryGoal: '在侧向动作后保持 Erg 与 Sled 输出。',
    prep: [
      frozenPrep('row-erg', 'R', { durationSeconds: 60 }, { min: 60, max: 60 }),
      frozenPrep('wall-ankle-knee-to-wall', 'M', { reps: 5 }, { min: 45, max: 60 }, 'unilateral'),
      frozenPrep('band-lateral-walk', 'A', { reps: 6 }, { min: 45, max: 60 }, 'unilateral'),
      frozenPrep('lateral-lunge', 'P', { reps: 3 }, { min: 45, max: 60 }, 'unilateral'),
    ],
    specificBuildUp: [
      frozenBuild('skierg-build', 1, { durationSeconds: 15 }, { min: 15, max: 15 }),
      frozenBuild('lateral-lunge-build', 2, { reps: 3 }, { min: 25, max: 40 }, { laterality: 'unilateral', sideExecution: 'alternating' }),
      frozenBuild('bear-crawl-build', 3, { distanceMeters: 4 }, { min: 20, max: 30 }),
      frozenBuild('sled-push-build', 4, { distanceMeters: 10 }, { min: 15, max: 25 }),
    ],
    blocks: [conditioningBlockManifest([
      frozenStation('lateral-lunge', 'CONDITIONING', 'single', { reps: 6 }, { min: 45, max: 75 }, { laterality: 'unilateral', sideExecution: 'alternating', startingSidePolicy: 'coach-directed' }),
      frozenStation('skierg', 'CONDITIONING', 'vpull', { durationSeconds: 30 }, { min: 30, max: 30 }),
      frozenStation('bear-crawl', 'CONDITIONING', 'core', { distanceMeters: 6 }, { min: 25, max: 40 }),
      frozenStation('sled-push', 'CONDITIONING', 'hpush', { distanceMeters: 20 }, { min: 35, max: 55 }),
    ], 3, 60, { min: 20, max: 30 }, { min: 15, max: 20 })],
    outputStability: frozenOutputStability('额状面工作增加后，后两轮 SkiErg 与 Sled 输出仍需保持稳定；不以加快转换牺牲侧向控制。'),
    coachNoteIncludes: ['缩短动作幅度', '缩短距离', '恢复 60s → 75s'],
    planningTime: frozenPlanning({ min: 360, max: 480 }, { min: 20, max: 35 }),
    calculatedTime: { min: 23.08, max: 31.58 },
  },
  {
    templateId: 'con4', level: 'l3', primaryGoal: 'Sustain Multiplanar Work', secondaryGoal: '提高方向变化后的重复能力，而不是堆叠更多动作。',
    prep: [
      frozenPrep('row-erg', 'R', { durationSeconds: 60 }, { min: 60, max: 60 }),
      frozenPrep('wall-ankle-knee-to-wall', 'M', { reps: 5 }, { min: 45, max: 60 }, 'unilateral'),
      frozenPrep('band-lateral-walk', 'A', { reps: 6 }, { min: 45, max: 60 }, 'unilateral'),
      frozenPrep('step-up-knee-drive', 'P', { reps: 3 }, { min: 45, max: 60 }, 'unilateral'),
    ],
    specificBuildUp: [
      frozenBuild('skierg-build', 1, { durationSeconds: 20 }, { min: 20, max: 20 }),
      frozenBuild('step-up-knee-drive-build', 2, { reps: 3 }, { min: 25, max: 40 }, { laterality: 'unilateral', sideExecution: 'alternating' }),
      frozenBuild('lateral-bear-crawl-build', 3, { distanceMeters: 3 }, { min: 30, max: 45 }, { laterality: 'unilateral', sideExecution: 'alternating' }),
      frozenBuild('sled-push-build', 4, { distanceMeters: 10 }, { min: 15, max: 25 }),
    ],
    blocks: [conditioningBlockManifest([
      frozenStation('step-up-knee-drive', 'CONDITIONING', 'single', { reps: 6 }, { min: 50, max: 80 }, { laterality: 'unilateral', sideExecution: 'alternating', startingSidePolicy: 'coach-directed' }),
      frozenStation('skierg', 'CONDITIONING', 'vpull', { durationSeconds: 35 }, { min: 35, max: 35 }),
      frozenStation('lateral-bear-crawl', 'CONDITIONING', 'core', { distanceMeters: 6 }, { min: 50, max: 75 }, { laterality: 'unilateral', sideExecution: 'one-side-then-opposite', sideRestSeconds: { min: 10, max: 15 }, startingSidePolicy: 'alternate-between-sets' }),
      frozenStation('sled-push', 'CONDITIONING', 'hpush', { distanceMeters: 20 }, { min: 35, max: 55 }),
    ], 3, { min: 60, max: 75 }, { min: 20, max: 30 }, { min: 15, max: 20 })],
    outputStability: frozenOutputStability('第 3 轮仍需维持 SkiErg 和 Sled 输出；locomotion 不能出现髋部塌陷、支撑失控或明显路线偏移。'),
    coachNoteIncludes: ['降低箱高', '延长 Reset', '降低负荷'],
    planningTime: frozenPlanning({ min: 360, max: 480 }, { min: 45, max: 70 }),
    calculatedTime: { min: 26.00, max: 36.00 },
  },
  {
    templateId: 'con4', level: 'l4', primaryGoal: 'High Multiplanar Capacity', secondaryGoal: '提高方向整合，而不让第一站局部下肢疲劳限制整节课。',
    prep: [
      frozenPrep('row-erg', 'R', { durationSeconds: { min: 60, max: 90 } }, { min: 60, max: 90 }),
      frozenPrep('side-lying-open-book', 'M', { reps: 4 }, { min: 45, max: 60 }, 'unilateral'),
      frozenPrep('band-lateral-walk', 'A', { reps: 6 }, { min: 45, max: 60 }, 'unilateral'),
      frozenPrep('forward-lunge', 'P', { reps: 3 }, { min: 45, max: 60 }, 'unilateral'),
    ],
    specificBuildUp: [
      frozenBuild('skierg-build', 1, { durationSeconds: 25 }, { min: 25, max: 25 }),
      frozenBuild('multidirectional-lunge-build', 2, { reps: 3 }, { min: 25, max: 40 }, { laterality: 'unilateral', sideExecution: 'alternating' }),
      frozenBuild('lateral-bear-crawl-build', 3, { distanceMeters: 4 }, { min: 40, max: 60 }, { laterality: 'unilateral', sideExecution: 'alternating' }),
      frozenBuild('sled-push-build', 4, { distanceMeters: 10 }, { min: 15, max: 25 }),
    ],
    blocks: [conditioningBlockManifest([
      frozenStation('multidirectional-lunge', 'CONDITIONING', 'single', { reps: 3 }, { min: 45, max: 75 }, { laterality: 'unilateral', sideExecution: 'alternating', startingSidePolicy: 'coach-directed' }),
      frozenStation('skierg', 'CONDITIONING', 'vpull', { durationSeconds: 40 }, { min: 40, max: 40 }),
      frozenStation('lateral-bear-crawl', 'CONDITIONING', 'core', { distanceMeters: 8 }, { min: 65, max: 90 }, { laterality: 'unilateral', sideExecution: 'one-side-then-opposite', sideRestSeconds: { min: 15, max: 20 }, startingSidePolicy: 'alternate-between-sets' }),
      frozenStation('sled-push', 'CONDITIONING', 'hpush', { distanceMeters: { min: 20, max: 25 } }, { min: 35, max: 65 }),
    ], 3, { min: 75, max: 90 }, { min: 20, max: 30 }, { min: 15, max: 20 })],
    outputStability: frozenOutputStability('第 3 轮仍需维持 SkiErg 与 Sled 的目标输出；若多方向弓步先造成局部下肢失败，则该负荷或动作量不合格。'),
    coachNoteIncludes: ['减少动作幅度', '减少每侧距离', '使用 20m 版本'],
    planningTime: frozenPlanning({ min: 420, max: 540 }, { min: 45, max: 65 }),
    calculatedTime: { min: 28.75, max: 39.75 },
  },
  {
    templateId: 'con5', level: 'l1', primaryGoal: 'Hybrid Foundation', secondaryGoal: '建立低技术、可恢复的混合工作容量。',
    prep: [
      frozenPrep('row-erg', 'R', { durationSeconds: 60 }, { min: 60, max: 60 }),
      frozenPrep('side-lying-open-book', 'M', { reps: 4 }, { min: 45, max: 60 }, 'unilateral'),
      frozenPrep('dead-bug', 'A', { reps: 5 }, { min: 45, max: 60 }, 'unilateral'),
      frozenPrep('wall-hip-hinge', 'P', { reps: 6 }, { min: 45, max: 60 }),
    ],
    specificBuildUp: [
      frozenBuild('row-erg-build', 1, { durationSeconds: 20 }, { min: 20, max: 20 }),
      frozenBuild('sled-push-build', 2, { distanceMeters: 10 }, { min: 15, max: 25 }),
      frozenBuild('kb-deadlift-build', 3, { reps: 4 }, { min: 10, max: 20 }),
      frozenBuild('farmer-carry-build', 4, { distanceMeters: 10 }, { min: 15, max: 25 }),
    ],
    blocks: [conditioningBlockManifest([
      frozenStation('row-erg', 'CONDITIONING', 'hpull', { distanceMeters: 100 }, { min: 45, max: 75 }),
      frozenStation('sled-push', 'CONDITIONING', 'hpush', { distanceMeters: 15 }, { min: 25, max: 45 }),
      frozenStation('kb-deadlift', 'CONDITIONING', 'hinge', { reps: 8 }, { min: 20, max: 35 }),
      frozenStation('farmer-carry', 'CARRY', 'carry', { distanceMeters: 20 }, { min: 30, max: 50 }),
    ], 3, { min: 60, max: 75 }, { min: 20, max: 30 }, { min: 15, max: 20 })],
    outputStability: frozenOutputStability('三轮切换顺畅，后两轮不因 KB Deadlift 或 Carry 局部疲劳破坏 RowErg 与 Sled 输出。'),
    coachNoteIncludes: ['降低 KB 或 Carry 负荷', '降低负荷', '延长站点转换'],
    planningTime: frozenPlanning({ min: 360, max: 480 }, { min: 45, max: 85 }),
    calculatedTime: { min: 22.50, max: 32.83 },
  },
  {
    templateId: 'con5', level: 'l2', primaryGoal: 'Repeat Hybrid Work', secondaryGoal: '保持每轮完成时间和 RowErg 输出稳定。',
    prep: [
      frozenPrep('row-erg', 'R', { durationSeconds: 75 }, { min: 75, max: 75 }),
      frozenPrep('side-lying-open-book', 'M', { reps: 4 }, { min: 45, max: 60 }, 'unilateral'),
      frozenPrep('dead-bug', 'A', { reps: 5 }, { min: 45, max: 60 }, 'unilateral'),
      frozenPrep('wall-hip-hinge', 'P', { reps: 6 }, { min: 45, max: 60 }),
    ],
    specificBuildUp: [
      frozenBuild('row-erg-build', 1, { durationSeconds: 25 }, { min: 25, max: 25 }),
      frozenBuild('sled-push-build', 2, { distanceMeters: 10 }, { min: 15, max: 25 }),
      frozenBuild('kb-rdl-build', 3, { reps: 4 }, { min: 15, max: 25 }),
      frozenBuild('farmer-carry-build', 4, { distanceMeters: 10 }, { min: 15, max: 25 }),
    ],
    blocks: [conditioningBlockManifest([
      frozenStation('row-erg', 'CONDITIONING', 'hpull', { distanceMeters: 125 }, { min: 60, max: 90 }),
      frozenStation('sled-push', 'CONDITIONING', 'hpush', { distanceMeters: 20 }, { min: 35, max: 55 }),
      frozenStation('kb-rdl', 'CONDITIONING', 'hinge', { reps: { min: 8, max: 10 } }, { min: 25, max: 50 }),
      frozenStation('farmer-carry', 'CARRY', 'carry', { distanceMeters: 25 }, { min: 40, max: 60 }),
    ], 3, 60, { min: 20, max: 30 }, { min: 15, max: 20 })],
    outputStability: frozenOutputStability('第 3 轮完成时间不应明显长于前两轮；KB RDL 不得先于整体输出成为限制因素。'),
    coachNoteIncludes: ['降低 KB RDL', '降低雪橇负荷', '降低负荷'],
    planningTime: frozenPlanning({ min: 360, max: 480 }, { min: 60, max: 105 }),
    calculatedTime: { min: 25.17, max: 35.58 },
  },
  {
    templateId: 'con5', level: 'l3', primaryGoal: 'Sustain Hybrid Output', secondaryGoal: '在合法 3–4 轮范围内维持每轮完成时间和器械输出。',
    prep: [
      frozenPrep('row-erg', 'R', { durationSeconds: 90 }, { min: 90, max: 90 }),
      frozenPrep('side-lying-open-book', 'M', { reps: 4 }, { min: 45, max: 60 }, 'unilateral'),
      frozenPrep('dead-bug', 'A', { reps: 5 }, { min: 45, max: 60 }, 'unilateral'),
      frozenPrep('wall-hip-hinge', 'P', { reps: 6 }, { min: 45, max: 60 }),
    ],
    specificBuildUp: [
      frozenBuild('row-erg-build', 1, { durationSeconds: 30 }, { min: 30, max: 30 }),
      frozenBuild('sled-push-build', 2, { distanceMeters: 10 }, { min: 15, max: 25 }),
      frozenBuild('kb-rdl-build', 3, { reps: 5 }, { min: 15, max: 25 }),
      frozenBuild('farmer-carry-build', 4, { distanceMeters: 15 }, { min: 20, max: 30 }),
    ],
    blocks: [conditioningBlockManifest([
      frozenStation('row-erg', 'CONDITIONING', 'hpull', { distanceMeters: 150 }, { min: 75, max: 105 }),
      frozenStation('sled-push', 'CONDITIONING', 'hpush', { distanceMeters: 20 }, { min: 35, max: 55 }),
      frozenStation('kb-rdl', 'CONDITIONING', 'hinge', { reps: 10 }, { min: 30, max: 50 }),
      frozenStation('farmer-carry', 'CARRY', 'carry', { distanceMeters: 30 }, { min: 50, max: 75 }),
    ], 3, { min: 60, max: 75 }, { min: 20, max: 30 }, { min: 15, max: 20 })],
    outputStability: frozenOutputStability('第 4 轮只有在前三轮输出稳定、Recovery 足够、动作技术可接受时才执行；第 4 轮不以单纯增加疲劳为目的。'),
    coachNoteIncludes: ['只完成标准 3 轮', '不进入第 4 轮', '保持 3 轮'],
    planningTime: frozenPlanning({ min: 360, max: 480 }, { min: 60, max: 115 }),
    calculatedTime: { min: 27.08, max: 46.00 },
    scenarios: [
      {
        name: 'Standard 3 rounds',
        selection: {},
        prep: [
          frozenPrep('row-erg', 'R', { durationSeconds: 90 }, { min: 90, max: 90 }),
          frozenPrep('side-lying-open-book', 'M', { reps: 4 }, { min: 45, max: 60 }, 'unilateral'),
          frozenPrep('dead-bug', 'A', { reps: 5 }, { min: 45, max: 60 }, 'unilateral'),
          frozenPrep('wall-hip-hinge', 'P', { reps: 6 }, { min: 45, max: 60 }),
        ],
        specificBuildUp: [
          frozenBuild('row-erg-build', 1, { durationSeconds: 30 }, { min: 30, max: 30 }),
          frozenBuild('sled-push-build', 2, { distanceMeters: 10 }, { min: 15, max: 25 }),
          frozenBuild('kb-rdl-build', 3, { reps: 5 }, { min: 15, max: 25 }),
          frozenBuild('farmer-carry-build', 4, { distanceMeters: 15 }, { min: 20, max: 30 }),
        ],
        planningTime: frozenPlanning({ min: 360, max: 480 }, { min: 60, max: 115 }),
        blocks: [conditioningBlockManifest([
          frozenStation('row-erg', 'CONDITIONING', 'hpull', { distanceMeters: 150 }, { min: 75, max: 105 }),
          frozenStation('sled-push', 'CONDITIONING', 'hpush', { distanceMeters: 20 }, { min: 35, max: 55 }),
          frozenStation('kb-rdl', 'CONDITIONING', 'hinge', { reps: 10 }, { min: 30, max: 50 }),
          frozenStation('farmer-carry', 'CARRY', 'carry', { distanceMeters: 30 }, { min: 50, max: 75 }),
        ], 3, { min: 60, max: 75 }, { min: 20, max: 30 }, { min: 15, max: 20 })],
        calculatedTime: { min: 27.08, max: 38.17 },
      },
      {
        name: 'Conditional 4 rounds',
        selection: { conditioningRounds: { 'conditioning-main': 4 } },
        prep: [
          frozenPrep('row-erg', 'R', { durationSeconds: 90 }, { min: 90, max: 90 }),
          frozenPrep('side-lying-open-book', 'M', { reps: 4 }, { min: 45, max: 60 }, 'unilateral'),
          frozenPrep('dead-bug', 'A', { reps: 5 }, { min: 45, max: 60 }, 'unilateral'),
          frozenPrep('wall-hip-hinge', 'P', { reps: 6 }, { min: 45, max: 60 }),
        ],
        specificBuildUp: [
          frozenBuild('row-erg-build', 1, { durationSeconds: 30 }, { min: 30, max: 30 }),
          frozenBuild('sled-push-build', 2, { distanceMeters: 10 }, { min: 15, max: 25 }),
          frozenBuild('kb-rdl-build', 3, { reps: 5 }, { min: 15, max: 25 }),
          frozenBuild('farmer-carry-build', 4, { distanceMeters: 15 }, { min: 20, max: 30 }),
        ],
        planningTime: frozenPlanning({ min: 360, max: 480 }, { min: 60, max: 115 }),
        blocks: [conditioningBlockManifest([
          frozenStation('row-erg', 'CONDITIONING', 'hpull', { distanceMeters: 150 }, { min: 75, max: 105 }),
          frozenStation('sled-push', 'CONDITIONING', 'hpush', { distanceMeters: 20 }, { min: 35, max: 55 }),
          frozenStation('kb-rdl', 'CONDITIONING', 'hinge', { reps: 10 }, { min: 30, max: 50 }),
          frozenStation('farmer-carry', 'CARRY', 'carry', { distanceMeters: 30 }, { min: 50, max: 75 }),
        ], 4, { min: 60, max: 75 }, { min: 20, max: 30 }, { min: 15, max: 20 })],
        calculatedTime: { min: 32.50, max: 46.00 },
      },
    ],
  },
  {
    templateId: 'con5', level: 'l4', primaryGoal: 'High Hybrid Repeatability', secondaryGoal: '让后两轮仍然保持可比较的完成时间、Erg 输出和 Sled split。',
    prep: [
      frozenPrep('row-erg', 'R', { durationSeconds: 90 }, { min: 90, max: 90 }),
      frozenPrep('side-lying-open-book', 'M', { reps: 4 }, { min: 45, max: 60 }, 'unilateral'),
      frozenPrep('dead-bug', 'A', { reps: 5 }, { min: 45, max: 60 }, 'unilateral'),
      frozenPrep('wall-hip-hinge', 'P', { reps: 6 }, { min: 45, max: 60 }),
    ],
    specificBuildUp: [
      frozenBuild('row-erg-build', 1, { durationSeconds: 30 }, { min: 30, max: 30 }),
      frozenBuild('sled-push-build', 2, { distanceMeters: 10 }, { min: 15, max: 25 }),
      frozenBuild('kb-rdl-build', 3, { reps: 4 }, { min: 15, max: 25 }),
      frozenBuild('farmer-carry-build', 4, { distanceMeters: 15 }, { min: 20, max: 30 }),
    ],
    blocks: [conditioningBlockManifest([
      frozenStation('row-erg', 'CONDITIONING', 'hpull', { distanceMeters: 150 }, { min: 75, max: 105 }),
      frozenStation('sled-push', 'CONDITIONING', 'hpush', { distanceMeters: { min: 20, max: 25 } }, { min: 35, max: 65 }),
      frozenStation('kb-rdl', 'CONDITIONING', 'hinge', { reps: 8 }, { min: 25, max: 40 }),
      frozenStation('farmer-carry', 'CARRY', 'carry', { distanceMeters: 30 }, { min: 50, max: 75 }),
    ], 4, { min: 75, max: 90 }, { min: 20, max: 30 }, { min: 15, max: 20 })],
    outputStability: frozenOutputStability('L4 的重点是第 3、4 轮仍可与前两轮比较。首轮更快但后两轮明显崩盘，不符合目标。'),
    coachNoteIncludes: ['降低 KB RDL', '使用 20m 版本', '不增加复杂度'],
    planningTime: frozenPlanning({ min: 420, max: 540 }, { min: 55, max: 110 }),
    calculatedTime: { min: 33.83, max: 47.67 },
  },
]

const frozenCalculatedSessionTimes: Record<string, NumericRange> = Object.fromEntries(
  frozenConditioningManifest.map((manifest) => [manifest.templateId + '/' + manifest.level, manifest.calculatedTime]),
)

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

const frozenPrepSignature = (item: PrepItem) => ({
  exerciseKey: item.exerciseKey,
  phase: item.phase,
  prescription: item.prescription,
  planningExecutionSeconds: item.planningExecutionSeconds,
  laterality: item.laterality ?? 'bilateral',
})

const frozenBuildSignature = (item: SpecificBuildUpItem) => ({
  exerciseKey: item.exerciseKey,
  order: item.order,
  prescription: item.prescription,
  planningExecutionSeconds: item.planningExecutionSeconds,
  ...(item.laterality ? { laterality: item.laterality } : {}),
  ...(item.sideExecution ? { sideExecution: item.sideExecution } : {}),
  ...(item.sideRestSeconds !== undefined ? { sideRestSeconds: item.sideRestSeconds } : {}),
  ...(item.restAfterSeconds !== undefined ? { restAfterSeconds: item.restAfterSeconds } : {}),
  ...(item.transitionAfterSeconds !== undefined ? { transitionAfterSeconds: item.transitionAfterSeconds } : {}),
})

const frozenEntrySignature = (entry: TrainingBlock['exercises'][number]) => {
  expect(isTrainingExercise(entry)).toBe(true)
  if (!isTrainingExercise(entry)) return null
  return {
    exerciseKey: entry.exerciseKey,
    role: entry.role,
    movementPattern: entry.movementPattern,
    laterality: entry.laterality,
    prescription: entry.prescription,
    planningExecutionSeconds: entry.planningExecutionSeconds,
    ...(entry.sideExecution ? { sideExecution: entry.sideExecution } : {}),
    ...(entry.sideRestSeconds !== undefined ? { sideRestSeconds: entry.sideRestSeconds } : {}),
    ...(entry.startingSidePolicy ? { startingSidePolicy: entry.startingSidePolicy } : {}),
    ...(entry.restSeconds !== undefined ? { restSeconds: entry.restSeconds } : {}),
  }
}

const frozenBlockSignature = (block: ResolvedTrainingBlock) => ({
  id: block.id,
  kind: block.kind,
  ...(block.rounds !== undefined ? { rounds: block.rounds } : {}),
  ...(block.restBetweenSetsSeconds !== undefined ? { restBetweenSetsSeconds: block.restBetweenSetsSeconds } : {}),
  ...(block.restBetweenRoundsSeconds !== undefined ? { restBetweenRoundsSeconds: block.restBetweenRoundsSeconds } : {}),
  ...(block.transitionSeconds !== undefined ? { transitionSeconds: block.transitionSeconds } : {}),
  ...(block.transitionBetweenRoundsSeconds !== undefined ? { transitionBetweenRoundsSeconds: block.transitionBetweenRoundsSeconds } : {}),
  ...(block.transitionAfterSeconds !== undefined ? { transitionAfterSeconds: block.transitionAfterSeconds } : {}),
  stations: block.exercises.map(frozenEntrySignature),
})

const frozenOutputManifest: Record<string, { primary: string; supporting: string[] }> = {
  con1: { primary: 'work-bout-distance', supporting: ['pace', 'power'] },
  con2: { primary: 'sled-split-time', supporting: ['carry-load', 'carry-distance', 'completion-time'] },
  con3: { primary: 'power-quality', supporting: ['explosive-reps', 'velocity', 'throw-distance'] },
  con4: { primary: 'erg-output', supporting: ['sled-split-time', 'locomotion-quality'] },
  con5: { primary: 'round-completion-time', supporting: ['erg-output', 'sled-split-time'] },
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
    expect(level?.secondaryGoal).toBe(expected.secondaryGoal)
    expect(level?.rampUp).toEqual([])
    expect(level?.outputPlan?.primary.kind).toBe(frozenOutputManifest[expected.templateId].primary)
    expect(level?.outputPlan?.supporting?.map((metric) => metric.kind)).toEqual(frozenOutputManifest[expected.templateId].supporting)
    expect(level?.outputPlan?.outputStability.description).toBe(expected.outputStability)
    for (const phrase of expected.coachNoteIncludes) expect(level?.coachNote).toContain(phrase)

    const defaultScenario = expected.scenarios?.[0]
    const resolved = resolveProgrammingLevel(level!, defaultScenario?.selection ?? {})
    const expectedPrep = defaultScenario?.prep ?? expected.prep
    const expectedBuild = defaultScenario?.specificBuildUp ?? expected.specificBuildUp
    const expectedBlocks = defaultScenario?.blocks ?? expected.blocks
    expect(resolved.planningTime).toEqual(defaultScenario?.planningTime ?? expected.planningTime)
    expect(resolved.prep.map(frozenPrepSignature)).toEqual(expectedPrep)
    expect(resolved.specificBuildUp?.map(frozenBuildSignature)).toEqual(expectedBuild)
    expect(resolved.blocks.map(frozenBlockSignature)).toEqual(expectedBlocks.map((block) => ({
      ...block,
      stations: block.stations,
    })))
  })

  it.each(frozenConditioningManifest.filter((manifest) => (manifest.scenarios?.length ?? 0) > 0))(
    '$templateId $level resolves every independent legal Power path from the frozen manifest',
    (expected) => {
      const level = conditioningTemplates.find((candidate) => candidate.id === expected.templateId)!.levels[expected.level]
      for (const scenario of expected.scenarios ?? []) {
        const resolved = resolveProgrammingLevel(level, scenario.selection)
        expect(resolved.planningTime).toEqual(scenario.planningTime ?? expected.planningTime)
        expect(resolved.prep.map(frozenPrepSignature)).toEqual(scenario.prep)
        expect(resolved.specificBuildUp?.map(frozenBuildSignature)).toEqual(scenario.specificBuildUp)
        if (scenario.powerExercise) {
          expect(resolved.blocks[0]?.exercises.map(frozenEntrySignature)).toEqual([
            scenario.powerExercise,
          ])
          expect(resolved.blocks[1]?.exercises.map(frozenEntrySignature)).toEqual(expected.blocks[1]?.stations)
        } else {
          expect(resolved.blocks.map(frozenBlockSignature)).toEqual((scenario.blocks ?? expected.blocks).map((block) => ({
            ...block,
            stations: block.stations,
          })))
        }
      }
    },
  )

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

  it('matches the independently snapshotted calculated session range for every default level', () => {
    for (const expected of frozenConditioningManifest) {
      const level = conditioningTemplates.find((template) => template.id === expected.templateId)!.levels[expected.level]
      const scenarioEstimates = expected.scenarios?.map((scenario) => (
        estimateSessionMinutes(level, scenario.selection).totalMinutes
      )) ?? [estimateSessionMinutes(level).totalMinutes]
      const actual = {
        min: Math.min(...scenarioEstimates.map((estimate) => estimate.min)),
        max: Math.max(...scenarioEstimates.map((estimate) => estimate.max)),
      }
      expect(actual.min).toBeCloseTo(expected.calculatedTime.min, 1)
      expect(actual.max).toBeCloseTo(expected.calculatedTime.max, 1)
      expect(actual.max).toBeLessThanOrEqual(60)
      expect(level.estimatedMinutes.max).toBeGreaterThanOrEqual(actual.max)
      for (const scenario of expected.scenarios ?? []) {
        const path = estimateSessionMinutes(level, scenario.selection).totalMinutes
        expect(path.min).toBeCloseTo(scenario.calculatedTime.min, 1)
        expect(path.max).toBeCloseTo(scenario.calculatedTime.max, 1)
        expect(path.max).toBeLessThanOrEqual(60)
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
    expect(isTrainingExercise(lateralCrawl) && lateralCrawl.sideRestSeconds).toEqual({ min: 10, max: 15 })
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
      expect(l3Slot.foundationRegression).toBeUndefined()
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

  it('keeps CON03 L1 and L2 on fixed Power prescriptions, not selectable tracks', () => {
    const con3 = conditioningTemplates.find((template) => template.id === 'con3')!
    expect(isPowerTrackSlot(con3.levels.l1.blocks[0].exercises[0])).toBe(false)
    expect(isPowerTrackSlot(con3.levels.l2.blocks[0].exercises[0])).toBe(false)
    expect(isTrainingExercise(con3.levels.l1.blocks[0].exercises[0])).toBe(true)
    expect(isTrainingExercise(con3.levels.l2.blocks[0].exercises[0])).toBe(true)
  })

  it('resolves and times every legal CON03 L3 and L4 path independently', () => {
    const con3 = conditioningTemplates.find((template) => template.id === 'con3')!
    const l3 = con3.levels.l3
    const l4 = con3.levels.l4

    const l3Medicine = estimateSessionMinutes(l3)
    const l3Swing = estimateSessionMinutes(l3, {
      powerTracks: { 'con3-l3-power': { optionKey: 'kb-swing', techniqueReady: true } },
    })
    expect(l3Medicine.conditioningComponentsSeconds!.powerWork).toEqual({ min: 40, max: 80 })
    expect(l3Swing.conditioningComponentsSeconds!.powerWork).toEqual({ min: 75, max: 125 })
    expect(l3Swing.totalMinutes.min).toBeGreaterThan(l3Medicine.totalMinutes.min)
    expect(l3Swing.totalMinutes.max).toBeGreaterThan(l3Medicine.totalMinutes.max)

    const l4Foundation = estimateSessionMinutes(l4)
    const l4Swing = estimateSessionMinutes(l4, {
      powerTracks: { 'con3-l4-power': { optionKey: 'kb-swing', techniqueReady: true } },
    })
    const l4Rotational = estimateSessionMinutes(l4, {
      powerTracks: { 'con3-l4-power': { optionKey: 'rotational-throw', techniqueReady: true } },
    })
    expect(l4Foundation.conditioningComponentsSeconds!.powerWork).toEqual({ min: 40, max: 80 })
    expect(l4Swing.conditioningComponentsSeconds!.powerWork).toEqual({ min: 75, max: 125 })
    expect(l4Rotational.conditioningComponentsSeconds!.powerWork).toEqual({ min: 120, max: 200 })
    expect(l4Rotational.conditioningComponentsSeconds!.unilateralReset).toEqual({ min: 60, max: 80 })
    expect(l4Rotational.totalMinutes.max).toBeGreaterThan(l4Foundation.totalMinutes.max)
  })

  it('keeps CON05 L3 standard and conditional round time paths separate', () => {
    const l3 = conditioningTemplates.find((template) => template.id === 'con5')!.levels.l3
    const standard = estimateSessionMinutes(l3)
    const conditional = estimateSessionMinutes(l3, {
      conditioningRounds: { 'conditioning-main': 4 },
    })
    expect(standard.conditioningComponentsSeconds!.conditioningWork).toEqual({ min: 570, max: 855 })
    expect(conditional.conditioningComponentsSeconds!.conditioningWork).toEqual({ min: 760, max: 1140 })
    expect(conditional.totalMinutes.max).toBeGreaterThan(standard.totalMinutes.max)
  })

  it('uses the real resolver and estimator for the legal CON03 path envelope', () => {
    const l3 = conditioningTemplates.find((template) => template.id === 'con3')!.levels.l3
    const l4 = conditioningTemplates.find((template) => template.id === 'con3')!.levels.l4
    const l3Medicine = estimateSessionMinutes(l3).totalMinutes
    const l3Swing = estimateSessionMinutes(l3, {
      powerTracks: { 'con3-l3-power': { optionKey: 'kb-swing', techniqueReady: true } },
    }).totalMinutes
    const l4Foundation = estimateSessionMinutes(l4).totalMinutes
    const l4Swing = estimateSessionMinutes(l4, {
      powerTracks: { 'con3-l4-power': { optionKey: 'kb-swing', techniqueReady: true } },
    }).totalMinutes
    const l4Rotational = estimateSessionMinutes(l4, {
      powerTracks: { 'con3-l4-power': { optionKey: 'rotational-throw', techniqueReady: true } },
    }).totalMinutes

    expect(l3Medicine.min).toBeCloseTo(20.52, 1)
    expect(l3Medicine.max).toBeCloseTo(29.00, 1)
    expect(l3Swing.min).toBeCloseTo(22.10, 1)
    expect(l3Swing.max).toBeCloseTo(31.00, 1)
    expect({ min: Math.min(l3Medicine.min, l3Swing.min), max: Math.max(l3Medicine.max, l3Swing.max) }).toEqual({
      min: expect.closeTo(20.52, 1),
      max: expect.closeTo(31.00, 1),
    })

    expect(l4Foundation.min).toBeCloseTo(22.43, 1)
    expect(l4Foundation.max).toBeCloseTo(29.50, 1)
    expect(l4Swing.min).toBeCloseTo(25.02, 1)
    expect(l4Swing.max).toBeCloseTo(33.25, 1)
    expect(l4Rotational.min).toBeCloseTo(25.52, 1)
    expect(l4Rotational.max).toBeCloseTo(34.75, 1)
    expect({
      min: Math.min(l4Foundation.min, l4Swing.min, l4Rotational.min),
      max: Math.max(l4Foundation.max, l4Swing.max, l4Rotational.max),
    }).toEqual({
      min: expect.closeTo(22.43, 1),
      max: expect.closeTo(34.75, 1),
    })
  })

  it('does not let a manual estimatedMinutes value bypass the calculated 60-minute gate', () => {
    const invalid = makeAuditConditioningLevel()
    invalid.blocks[0] = {
      ...invalid.blocks[0],
      exercises: invalid.blocks[0].exercises.map((entry) => ({
        ...(entry as TrainingExercise),
        planningExecutionSeconds: { min: 1800, max: 1800 },
      })),
    }
    invalid.estimatedMinutes = { min: 1, max: 60 }
    expect(auditConditioningTemplateLevel(invalid)).toContainEqual(
      expect.objectContaining({ code: 'TIME_OVER_BUDGET' }),
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
    expect(() => resolveProgrammingLevel(l3ResolverFixture, {
      conditioningRounds: { 'conditioning-main': 3 },
    })).toThrow(/approved policy/i)
  })

  it('audits every legal CON03 path and both CON05 L3 round scenarios', () => {
    const issues = auditConditioningTemplateSet(conditioningTemplates)
    expect(issues.filter((entry) => entry.code === 'TIME_OVER_BUDGET')).toEqual([])

    const con3 = conditioningTemplates.find((template) => template.id === 'con3')!
    const con5 = conditioningTemplates.find((template) => template.id === 'con5')!
    const scenarios = [
      [con3.levels.l3, {}],
      [con3.levels.l3, { powerTracks: { 'con3-l3-power': { optionKey: 'kb-swing', techniqueReady: true } } }],
      [con3.levels.l4, {}],
      [con3.levels.l4, { powerTracks: { 'con3-l4-power': { optionKey: 'kb-swing', techniqueReady: true } } }],
      [con3.levels.l4, { powerTracks: { 'con3-l4-power': { optionKey: 'rotational-throw', techniqueReady: true } } }],
      [con5.levels.l3, {}],
      [con5.levels.l3, { conditioningRounds: { 'conditioning-main': 4 } }],
    ] as const

    for (const [level, selection] of scenarios) {
      expect(estimateSessionMinutes(level, selection).totalMinutes.max).toBeLessThanOrEqual(60)
    }
  })

  it('hard-audits a mutated legal path instead of checking only the default scenario', () => {
    const con3 = conditioningTemplates.find((template) => template.id === 'con3')!
    const l4 = con3.levels.l4
    const powerSlot = l4.blocks[0].exercises[0]
    expect(isPowerTrackSlot(powerSlot)).toBe(true)
    if (!isPowerTrackSlot(powerSlot)) return

    const mutatedPowerSlot: PowerTrackSlot = {
      ...powerSlot,
      options: powerSlot.options.map((option) => option.optionKey === 'kb-swing'
        ? {
          ...option,
          path: {
            ...option.path,
            powerExercise: {
              ...option.path.powerExercise,
              planningExecutionSeconds: { min: 2000, max: 2000 },
            },
          },
        }
        : option),
    }
    const mutatedTemplates = conditioningTemplates.map((template) => template.id === 'con3'
      ? {
        ...template,
        levels: {
          ...template.levels,
          l4: {
            ...l4,
            blocks: l4.blocks.map((block, index) => index === 0
              ? { ...block, exercises: [mutatedPowerSlot] }
              : block),
          },
        },
      }
      : template)

    expect(auditConditioningTemplateSet(mutatedTemplates)).toContainEqual(
      expect.objectContaining({
        code: 'TIME_OVER_BUDGET',
        path: expect.stringContaining('con3/l4/scenario-swing-track'),
      }),
    )
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
