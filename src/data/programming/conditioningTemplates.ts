import type {
  ConditioningOutputPlan,
  ConditioningPlanningTime,
  ConditioningPowerPath,
  Count,
  ExercisePrescription,
  Laterality,
  NumericRange,
  PowerTrackOption,
  PowerTrackSlot,
  PrepItem,
  ProgramLevel,
  ProgrammingTemplate,
  ProgrammingTemplateLevel,
  SpecificBuildUpItem,
  TrainingBlock,
  TrainingExercise,
} from './types'

type ConditioningModality = 'medicine-ball' | 'swing' | 'rotational'

const range = (min: number, max: number): NumericRange => ({ min, max })

const prepItem = (
  exerciseKey: string,
  displayName: string,
  phase: PrepItem['phase'],
  prescription: ExercisePrescription,
  planningExecutionSeconds: NumericRange,
  laterality: Laterality = 'bilateral',
): PrepItem => ({
  exerciseKey,
  displayName,
  phase,
  laterality,
  prescription,
  planningExecutionSeconds,
  reason: 'CON fixed template preparation',
})

const genericPrepTime = range(45, 60)

const prep = (
  r: PrepItem,
  m: PrepItem,
  a: PrepItem,
  p: PrepItem,
): PrepItem[] => [r, m, a, p]

const buildUpItem = (
  id: string,
  exerciseKey: string,
  displayName: string,
  prescription: ExercisePrescription,
  planningExecutionSeconds: NumericRange,
  order: number,
  options: Partial<Pick<SpecificBuildUpItem, 'laterality' | 'sideExecution' | 'startingSidePolicy' | 'sideRestSeconds' | 'restAfterSeconds' | 'transitionAfterSeconds' | 'coachNote'>> = {},
): SpecificBuildUpItem => ({
  id,
  exerciseKey,
  displayName,
  order,
  prescription,
  planningExecutionSeconds,
  ...options,
})

const powerExercise = (
  exerciseKey: string,
  displayName: string,
  prescription: ExercisePrescription,
  planningExecutionSeconds: NumericRange,
  options: Partial<Pick<TrainingExercise, 'movementPattern' | 'laterality' | 'sideRestSeconds' | 'sideExecution' | 'startingSidePolicy' | 'restSeconds' | 'coachNote'>> = {},
): TrainingExercise => ({
  exerciseKey,
  displayName,
  role: 'POWER',
  movementPattern: options.movementPattern ?? 'hinge',
  laterality: options.laterality ?? 'bilateral',
  fatigueRisk: 'moderate',
  prescription,
  planningExecutionSeconds,
  ...options,
})

const conditioningStation = (
  exerciseKey: string,
  displayName: string,
  movementPattern: TrainingExercise['movementPattern'],
  prescription: ExercisePrescription,
  planningExecutionSeconds: NumericRange,
  options: Partial<Pick<TrainingExercise, 'laterality' | 'sideRestSeconds' | 'sideExecution' | 'startingSidePolicy' | 'coachNote'>> = {},
): TrainingExercise => ({
  exerciseKey,
  displayName,
  role: movementPattern === 'carry' ? 'CARRY' : 'CONDITIONING',
  movementPattern,
  laterality: options.laterality ?? 'bilateral',
  fatigueRisk: 'moderate',
  prescription,
  planningExecutionSeconds,
  ...options,
})

const powerBlock = (
  id: string,
  label: string,
  exercise: TrainingBlock['exercises'][number],
  restBetweenSetsSeconds: Count,
  transitionAfterSeconds: Count,
): TrainingBlock => ({
  id,
  kind: 'power',
  label,
  restBetweenSetsSeconds,
  transitionAfterSeconds,
  exercises: [exercise],
})

const conditioningBlock = (
  exercises: TrainingExercise[],
  rounds: Count,
  restBetweenRoundsSeconds: Count,
  transitionSeconds: Count,
  transitionBetweenRoundsSeconds: Count,
  roundPolicy?: TrainingBlock['roundPolicy'],
): TrainingBlock => ({
  id: 'conditioning-main',
  kind: 'conditioning',
  label: 'Conditioning',
  rounds,
  restBetweenRoundsSeconds,
  transitionSeconds,
  transitionBetweenRoundsSeconds,
  ...(roundPolicy ? { roundPolicy } : {}),
  exercises,
})

const outputPlan = (
  primary: ConditioningOutputPlan['primary'],
  supporting: ConditioningOutputPlan['supporting'],
  outputStability: string,
): ConditioningOutputPlan => ({
  primary,
  ...(supporting && supporting.length > 0 ? { supporting } : {}),
  outputStability: {
    kind: 'coach-design-target',
    description: outputStability,
  },
})

const planningTime = (
  setupCoachingAllowanceSeconds: NumericRange,
  buildUpCoachingAllowanceSeconds: NumericRange,
): ConditioningPlanningTime => ({
  buildUpCoachingAllowanceSeconds,
  setupCoachingAllowanceSeconds,
})

const progression = (
  variables: NonNullable<ProgrammingTemplateLevel['progressionFromPrevious']>['variables'],
  note: string,
): NonNullable<ProgrammingTemplateLevel['progressionFromPrevious']> => ({ variables, note })

const makeLevel = ({
  programLevel,
  primaryGoal,
  secondaryGoal,
  prepItems,
  specificBuildUp,
  blocks,
  rpe,
  progressionFromPrevious,
  output,
  estimatedMinutes,
  planning,
  coachNote,
}: {
  programLevel: ProgramLevel
  primaryGoal: string
  secondaryGoal: string
  prepItems: PrepItem[]
  specificBuildUp: SpecificBuildUpItem[]
  blocks: TrainingBlock[]
  rpe: number | NumericRange
  progressionFromPrevious: NonNullable<ProgrammingTemplateLevel['progressionFromPrevious']>
  output: ConditioningOutputPlan
  estimatedMinutes: NumericRange
  planning: ConditioningPlanningTime
  coachNote: string
}): ProgrammingTemplateLevel => ({
  programLevel,
  primaryGoal,
  secondaryGoal,
  prep: prepItems,
  rampUp: [],
  specificBuildUp,
  blocks,
  estimatedMinutes,
  conditioningIntensityTarget: {
    rpe,
    note: 'Power quality and output repeatability take priority over chasing the top of the RPE range.',
  },
  outputPlan: output,
  planningTime: planning,
  progressionFromPrevious,
  coachNote,
})

const con01PrimaryOutput = (
  outputStability: string,
): ConditioningOutputPlan => outputPlan(
  { kind: 'work-bout-distance', scope: 'bout', availability: 'required', label: 'Work-bout distance' },
  [
    { kind: 'pace', scope: 'bout', availability: 'when-available', label: 'Pace' },
    { kind: 'power', scope: 'bout', availability: 'when-available', label: 'Average power' },
  ],
  outputStability,
)

const con02PrimaryOutput = (
  outputStability: string,
): ConditioningOutputPlan => outputPlan(
  { kind: 'sled-split-time', scope: 'station', availability: 'required', label: 'Sled split time' },
  [
    { kind: 'carry-load', scope: 'station', availability: 'when-available', label: 'Carry load' },
    { kind: 'carry-distance', scope: 'station', availability: 'required', label: 'Carry distance' },
    { kind: 'completion-time', scope: 'station', availability: 'required', label: 'Carry completion time' },
  ],
  outputStability,
)

const con03PrimaryOutput = (
  outputStability: string,
): ConditioningOutputPlan => outputPlan(
  { kind: 'power-quality', scope: 'set', availability: 'required', label: 'Power quality' },
  [
    { kind: 'explosive-reps', scope: 'set', availability: 'required', label: 'Repeatable explosive reps' },
    { kind: 'velocity', scope: 'set', availability: 'when-available', label: 'Velocity' },
    { kind: 'throw-distance', scope: 'set', availability: 'when-available', label: 'Throw distance' },
  ],
  outputStability,
)

const con04PrimaryOutput = (
  outputStability: string,
): ConditioningOutputPlan => outputPlan(
  { kind: 'erg-output', scope: 'station', availability: 'required', label: 'SkiErg output' },
  [
    { kind: 'sled-split-time', scope: 'station', availability: 'required', label: 'Sled split time' },
    { kind: 'locomotion-quality', scope: 'station', availability: 'required', label: 'Locomotion quality gate' },
  ],
  outputStability,
)

const con05PrimaryOutput = (
  outputStability: string,
): ConditioningOutputPlan => outputPlan(
  { kind: 'round-completion-time', scope: 'round', availability: 'required', label: 'Round completion time' },
  [
    { kind: 'erg-output', scope: 'station', availability: 'required', label: 'RowErg output' },
    { kind: 'sled-split-time', scope: 'station', availability: 'required', label: 'Sled split time' },
  ],
  outputStability,
)

const rowPrep = (level: ProgramLevel): PrepItem[] => {
  const row = prepItem('row-erg', 'RowErg 轻划', 'R', { durationSeconds: level === 'l3' ? range(75, 90) : 90 }, level === 'l3' ? range(75, 90) : range(90, 90))
  const openBook = prepItem('side-lying-open-book', '侧卧开书式', 'M', { reps: 4 }, genericPrepTime, 'unilateral')
  const activation = level === 'l1' || level === 'l3'
    ? prepItem('dead-bug', '死虫式', 'A', { reps: 5 }, genericPrepTime, 'unilateral')
    : prepItem('band-straight-arm-pulldown', '弹力带直臂下压', 'A', { reps: 8 }, genericPrepTime)
  const pattern = level === 'l1'
    ? prepItem('row-erg-technique', 'RowErg 划船技术划', 'P', { reps: 6 }, genericPrepTime)
    : level === 'l2'
      ? prepItem('row-erg-rhythm', 'RowErg 节奏划', 'P', { reps: range(6, 8) }, genericPrepTime)
      : level === 'l3'
        ? prepItem('row-erg-long-stroke', 'RowErg 低频率长划', 'P', { reps: 6 }, genericPrepTime)
        : prepItem('row-erg-target-pace', 'RowErg 目标配速技术划', 'P', { reps: 5 }, genericPrepTime)
  return prep(row, openBook, activation, pattern)
}

const rowBuild = (level: ProgramLevel): SpecificBuildUpItem[] => {
  if (level === 'l1') {
    return [
      buildUpItem('row-erg-build-easy', 'row-erg-build-easy', 'RowErg 轻快划', { durationSeconds: 20, sets: 2 }, range(20, 20), 1),
      buildUpItem('row-erg-build-recovery', 'row-erg-build-recovery', 'RowErg 轻松划', { durationSeconds: 40, sets: 2 }, range(40, 40), 2, { transitionAfterSeconds: range(15, 20) }),
    ]
  }
  if (level === 'l2') {
    return [
      buildUpItem('row-erg-build-moderate', 'row-erg-build-moderate', 'RowErg 中等配速划', { durationSeconds: 20 }, range(20, 20), 1),
      buildUpItem('row-erg-build-easy', 'row-erg-build-easy', 'RowErg 轻松恢复划', { durationSeconds: 20 }, range(20, 20), 2),
      buildUpItem('row-erg-build-target', 'row-erg-build-target', 'RowErg 目标配速划', { durationSeconds: 20 }, range(20, 20), 3),
      buildUpItem('row-erg-build-recovery', 'row-erg-build-recovery', 'RowErg 轻松恢复划', { durationSeconds: 20 }, range(20, 20), 4, { transitionAfterSeconds: range(15, 20) }),
    ]
  }
  if (level === 'l3') {
    return [
      buildUpItem('row-erg-build-target-long', 'row-erg-build-target-long', 'RowErg 目标配速长划', { durationSeconds: 30 }, range(30, 30), 1),
      buildUpItem('row-erg-build-easy', 'row-erg-build-easy', 'RowErg 轻松划', { durationSeconds: 30 }, range(30, 30), 2),
      buildUpItem('row-erg-build-target-short', 'row-erg-build-target-short', 'RowErg 目标配速短划', { durationSeconds: 20 }, range(20, 20), 3),
      buildUpItem('row-erg-build-recovery-short', 'row-erg-build-recovery-short', 'RowErg 轻松恢复短划', { durationSeconds: 20 }, range(20, 20), 4, { transitionAfterSeconds: range(25, 30) }),
    ]
  }
  return [
    buildUpItem('row-erg-build-control', 'row-erg-build-control', 'RowErg 控制配速划', { durationSeconds: 20 }, range(20, 20), 1),
    buildUpItem('row-erg-build-easy', 'row-erg-build-easy', 'RowErg 轻松划', { durationSeconds: 20 }, range(20, 20), 2),
    buildUpItem('row-erg-build-target', 'row-erg-build-target', 'RowErg 目标配速划', { durationSeconds: 30 }, range(30, 30), 3),
    buildUpItem('row-erg-build-easy-long', 'row-erg-build-easy-long', 'RowErg 长恢复划', { durationSeconds: 30 }, range(30, 30), 4),
    buildUpItem('row-erg-build-target-final', 'row-erg-build-target-final', 'RowErg 最终目标配速划', { durationSeconds: 30 }, range(30, 30), 5),
    buildUpItem('row-erg-build-recovery-final', 'row-erg-build-recovery-final', 'RowErg 最终恢复划', { durationSeconds: range(25, 30) }, range(25, 30), 6),
  ]
}

const con01Level = (
  programLevel: ProgramLevel,
  primaryGoal: string,
  secondaryGoal: string,
  durationSeconds: number,
  rounds: number,
  roundRest: Count,
  rpe: NumericRange,
  progressionFromPrevious: NonNullable<ProgrammingTemplateLevel['progressionFromPrevious']>,
  outputStability: string,
  estimatedMinutes: NumericRange,
  setupAllowance: NumericRange,
): ProgrammingTemplateLevel => makeLevel({
  programLevel,
  primaryGoal,
  secondaryGoal,
  prepItems: rowPrep(programLevel),
  specificBuildUp: rowBuild(programLevel),
  blocks: [conditioningBlock([
    conditioningStation('row-erg', 'RowErg', 'hpull', { durationSeconds }, range(durationSeconds, durationSeconds)),
  ], rounds, roundRest, 0, 0)],
  rpe,
  progressionFromPrevious,
  output: con01PrimaryOutput(outputStability),
  estimatedMinutes,
  planning: planningTime(setupAllowance, range(0, 0)),
  coachNote: programLevel === 'l1'
    ? '首轮明显冲高时降低目标配速；出现疼痛或头晕时停止训练。'
    : programLevel === 'l2'
      ? '连续输出下降时降低目标配速；若恢复不足，将恢复时间回到 45s。'
      : programLevel === 'l3'
        ? '若第 4–6 轮下降，将 Recovery 从 30s 调回 45s；持续技术下降时停止该 Block。'
        : '若后半段下降，降低目标距离；若技术下降则停止 Block。',
})

const sledCarryPrep = (rowDuration: Count): PrepItem[] => prep(
  prepItem('row-erg', 'RowErg 轻划', 'R', { durationSeconds: rowDuration }, typeof rowDuration === 'number' ? range(rowDuration, rowDuration) : rowDuration),
  prepItem('wall-ankle-knee-to-wall', '踝背屈靠墙膝触墙', 'M', { reps: 5 }, genericPrepTime, 'unilateral'),
  prepItem('glute-bridge', '臀桥', 'A', { reps: 8 }, genericPrepTime),
  prepItem('wall-hip-hinge', '墙面髋铰链', 'P', { reps: 6 }, genericPrepTime),
)

const sledCarryBuild = (
  sledKey: string,
  carryKey: string,
  carryDistance: Count,
  buildAllowance: NumericRange,
): { items: SpecificBuildUpItem[]; allowance: NumericRange } => ({
  items: [
    buildUpItem('sled-' + sledKey + '-build', sledKey, '轻负荷雪橇推', { distanceMeters: 10 }, range(15, 25), 1),
    buildUpItem('carry-' + carryKey + '-build', carryKey, '轻负荷 Farmer Carry', { distanceMeters: carryDistance }, carryDistance === 10 ? range(15, 25) : range(20, 30), 2),
  ],
  allowance: buildAllowance,
})

const con02Level = (
  programLevel: ProgramLevel,
  primaryGoal: string,
  secondaryGoal: string,
  sledDistance: Count,
  carryDistance: Count,
  rounds: number,
  roundRest: Count,
  sledKey: string,
  carryKey: string,
  sledPlanning: NumericRange,
  carryPlanning: NumericRange,
  rpe: NumericRange,
  progressionFromPrevious: NonNullable<ProgrammingTemplateLevel['progressionFromPrevious']>,
  outputStability: string,
  estimatedMinutes: NumericRange,
  setupAllowance: NumericRange,
  buildAllowance: NumericRange,
  coachNote: string,
): ProgrammingTemplateLevel => {
  const build = sledCarryBuild(sledKey, carryKey, programLevel === 'l1' ? 10 : 15, buildAllowance)
  return makeLevel({
    programLevel,
    primaryGoal,
    secondaryGoal,
    prepItems: sledCarryPrep(programLevel === 'l1' ? range(60, 90) : programLevel === 'l2' ? 75 : 90),
    specificBuildUp: build.items,
    blocks: [conditioningBlock([
      conditioningStation('sled-push', 'Sled Push', 'hpush', { distanceMeters: sledDistance }, sledPlanning, {
        coachNote: 'Select a load that preserves the target sled split across every round.',
      }),
      conditioningStation('farmer-carry', 'Farmer Carry', 'carry', { distanceMeters: carryDistance }, carryPlanning, {
        coachNote: 'Carry load remains subordinate to repeatable speed, posture and breathing.',
      }),
    ], rounds, roundRest, range(20, 30), range(15, 20))],
    rpe,
    progressionFromPrevious,
    output: con02PrimaryOutput(outputStability),
    estimatedMinutes,
    planning: planningTime(setupAllowance, build.allowance),
    coachNote,
  })
}

const powerPathPrep = (modality: ConditioningModality, rowDuration: Count): PrepItem[] => {
  const row = prepItem('row-erg', 'RowErg 轻划', 'R', { durationSeconds: rowDuration }, typeof rowDuration === 'number' ? range(rowDuration, rowDuration) : rowDuration)
  if (modality === 'swing') {
    return prep(
      row,
      prepItem('wall-hip-hinge', '墙面髋铰链', 'M', { reps: 6 }, genericPrepTime),
      prepItem('glute-bridge', '臀桥', 'A', { reps: 8 }, genericPrepTime),
      prepItem('kettlebell-swing-stance', '壶铃摆动起始位练习', 'P', { reps: 3 }, genericPrepTime),
    )
  }
  if (modality === 'rotational') {
    return prep(
      row,
      prepItem('side-lying-open-book', '侧卧开书式', 'M', { reps: 4 }, genericPrepTime, 'unilateral'),
      prepItem('dead-bug', '死虫式', 'A', { reps: 5 }, genericPrepTime, 'unilateral'),
      prepItem('medicine-ball-rotational-throw-stance', '药球旋转抛站姿练习', 'P', { reps: 2 }, genericPrepTime, 'unilateral'),
    )
  }
  return prep(
    row,
    prepItem('wall-slide', '墙滑', 'M', { reps: 6 }, genericPrepTime),
    prepItem('dead-bug', '死虫式', 'A', { reps: 5 }, genericPrepTime, 'unilateral'),
    prepItem('medicine-ball-slam-technique', '药球下砸技术练习', 'P', { reps: 3 }, genericPrepTime),
  )
}

const powerPathBuild = (modality: ConditioningModality): SpecificBuildUpItem[] => {
  if (modality === 'swing') {
    return [
      buildUpItem('kb-deadlift-build', 'kb-deadlift-build', '壶铃硬拉准备组', { reps: 3 }, range(8, 15), 1),
      buildUpItem('kb-swing-build', 'kb-swing-build', '低负荷壶铃摆动', { reps: 3 }, range(10, 15), 2),
    ]
  }
  if (modality === 'rotational') {
    return [buildUpItem(
      'rotational-throw-build',
      'rotational-throw-build',
      '低负荷药球旋转抛',
      { reps: 2 },
      range(12, 20),
      1,
      {
        laterality: 'unilateral',
        sideExecution: 'one-side-then-opposite',
        startingSidePolicy: 'alternate-between-sets',
        sideRestSeconds: range(15, 20),
      },
    )]
  }
  return [
    buildUpItem('medicine-ball-slam-build', 'medicine-ball-slam-build', '轻药球下砸', { reps: 3 }, range(6, 12), 1),
    buildUpItem('medicine-ball-slam-target-build', 'medicine-ball-slam-target-build', '目标药球下砸', { reps: 2 }, range(4, 8), 2),
  ]
}

const powerPathBuildAllowance = (modality: ConditioningModality): NumericRange => (
  modality === 'swing' ? range(23, 40) : modality === 'rotational' ? range(14, 55) : range(31, 50)
)

const makePowerPath = (
  modality: ConditioningModality,
  power: TrainingExercise,
  rowDuration: Count,
): ConditioningPowerPath => ({
  prep: powerPathPrep(modality, rowDuration),
  specificBuildUp: powerPathBuild(modality),
  powerExercise: power,
  planningTime: {
    buildUpCoachingAllowanceSeconds: powerPathBuildAllowance(modality),
  },
})

const makePowerOption = (
  optionKey: string,
  trackKey: string,
  path: ConditioningPowerPath,
  requiresTechniqueCompetency: boolean,
): PowerTrackOption => ({ optionKey, trackKey, path, requiresTechniqueCompetency })

const makePowerTrackSlot = (
  id: string,
  defaultSelection: PowerTrackSlot['defaultSelection'],
  options: PowerTrackOption[],
  foundationRegression?: ConditioningPowerPath,
  fallbackOptionKey?: string,
): PowerTrackSlot => ({
  kind: 'power-track',
  id,
  exerciseKey: id,
  displayName: 'Power Track',
  role: 'POWER',
  movementPattern: 'hinge',
  laterality: 'bilateral',
  fatigueRisk: 'moderate',
  prescription: {},
  options,
  defaultSelection,
  ...(foundationRegression ? { foundationRegression } : {}),
  ...(fallbackOptionKey ? { fallbackOptionKey } : {}),
})

const capacityBlock = (
  exercises: TrainingExercise[],
  rounds: number,
  roundRest: Count,
  transitionSeconds: Count = 0,
  transitionBetweenRoundsSeconds: Count = 0,
): TrainingBlock => conditioningBlock(
  exercises,
  rounds,
  roundRest,
  transitionSeconds,
  transitionBetweenRoundsSeconds,
)

const con03FixedLevel = (
  programLevel: 'l1' | 'l2',
  primaryGoal: string,
  secondaryGoal: string,
  powerSets: number,
  hingeKey: string,
  hingeName: string,
  hingePrescription: ExercisePrescription,
  carryDistance: number,
  carryPlanning: NumericRange,
  rpe: NumericRange,
  progressionFromPrevious: NonNullable<ProgrammingTemplateLevel['progressionFromPrevious']>,
  outputStability: string,
  estimatedMinutes: NumericRange,
  prepItems: PrepItem[],
  specificBuildUp: SpecificBuildUpItem[],
  buildAllowance: NumericRange,
  setupAllowance: NumericRange,
  coachNote: string,
): ProgrammingTemplateLevel => makeLevel({
  programLevel,
  primaryGoal,
  secondaryGoal,
  prepItems,
  specificBuildUp,
  blocks: [
    powerBlock('power', 'Power Quality', powerExercise('medicine-ball-slam', '药球下砸', { sets: powerSets, reps: 5 }, range(10, 20), { restSeconds: 60 }), 60, range(45, 60)),
    capacityBlock([
      conditioningStation(hingeKey, hingeName, 'hinge', hingePrescription, hingeKey === 'kb-deadlift' ? range(20, 35) : range(25, 40), {
        coachNote: 'Use a load that preserves output repeatability; no grinding and no local failure target.',
      }),
      conditioningStation('farmer-carry', 'Farmer Carry', 'carry', { distanceMeters: carryDistance }, carryPlanning, {
        coachNote: 'Carry load remains subordinate to repeatable round output and posture.',
      }),
    ], 3, 60, range(20, 30), range(15, 20)),
  ],
  rpe,
  progressionFromPrevious,
  output: con03PrimaryOutput(outputStability),
  estimatedMinutes,
  planning: planningTime(setupAllowance, buildAllowance),
  coachNote,
})

const con03L3MedicinePower = powerExercise('medicine-ball-slam', '药球下砸', { sets: 4, reps: 5 }, range(10, 20), { restSeconds: range(60, 75) })
const con03L3SwingPower = powerExercise('kb-swing', '壶铃摆动', { sets: 5, reps: 6 }, range(15, 25), { restSeconds: range(60, 75) })
const con03L3MedicinePath = makePowerPath('medicine-ball', con03L3MedicinePower, range(75, 90))
const con03L3SwingPath = makePowerPath('swing', con03L3SwingPower, range(75, 90))

const con03L4SwingPower = powerExercise('kb-swing', '壶铃摆动', { sets: 5, reps: range(5, 6) }, range(15, 25), { restSeconds: range(75, 90) })
const con03L4ThrowPower = powerExercise('rotational-throw', '药球旋转抛', { sets: 4, reps: 5 }, range(30, 50), {
  movementPattern: 'rotation',
  laterality: 'unilateral',
  sideExecution: 'one-side-then-opposite',
  startingSidePolicy: 'alternate-between-sets',
  sideRestSeconds: range(15, 20),
  restSeconds: range(75, 90),
})
const con03L4FoundationPower = powerExercise('medicine-ball-slam', '药球下砸', { sets: 4, reps: 5 }, range(10, 20), { restSeconds: 60 })
const con03L4SwingPath = makePowerPath('swing', con03L4SwingPower, 90)
const con03L4ThrowPath = makePowerPath('rotational', con03L4ThrowPower, 90)
const con03L4FoundationPath = makePowerPath('medicine-ball', con03L4FoundationPower, 90)

const con03TrackLevel = (
  programLevel: 'l3' | 'l4',
  primaryGoal: string,
  secondaryGoal: string,
  powerSlot: PowerTrackSlot,
  defaultPath: ConditioningPowerPath,
  capacityPlanning: NumericRange,
  rounds: number,
  roundRest: Count,
  rpe: NumericRange,
  progressionFromPrevious: NonNullable<ProgrammingTemplateLevel['progressionFromPrevious']>,
  outputStability: string,
  estimatedMinutes: NumericRange,
  setupAllowance: NumericRange,
  coachNote: string,
): ProgrammingTemplateLevel => makeLevel({
  programLevel,
  primaryGoal,
  secondaryGoal,
  prepItems: defaultPath.prep,
  specificBuildUp: defaultPath.specificBuildUp,
  blocks: [
    powerBlock('power', 'Power Quality', powerSlot, roundRest, programLevel === 'l3' ? range(60, 90) : range(75, 120)),
    capacityBlock([
      conditioningStation('farmer-carry', 'Farmer Carry', 'carry', { distanceMeters: programLevel === 'l3' ? range(25, 30) : 30 }, capacityPlanning, {
        coachNote: 'Carry load remains subordinate to repeatable round output and posture.',
      }),
    ], rounds, roundRest),
  ],
  rpe,
  progressionFromPrevious,
  output: con03PrimaryOutput(outputStability),
  estimatedMinutes,
  planning: planningTime(setupAllowance, defaultPath.planningTime?.buildUpCoachingAllowanceSeconds ?? range(0, 0)),
  coachNote,
})

const con04LateralTiming = {
  laterality: 'unilateral' as const,
  sideExecution: 'alternating' as const,
  startingSidePolicy: 'coach-directed' as const,
}

const con04Prep = (level: ProgramLevel): PrepItem[] => {
  const row = prepItem('row-erg', 'RowErg 轻划', 'R', { durationSeconds: level === 'l4' ? range(60, 90) : 60 }, level === 'l4' ? range(60, 90) : range(60, 60))
  const mobility = level === 'l4'
    ? prepItem('side-lying-open-book', '侧卧开书式', 'M', { reps: 4 }, genericPrepTime, 'unilateral')
    : prepItem('wall-ankle-knee-to-wall', '踝背屈靠墙膝触墙', 'M', { reps: 5 }, genericPrepTime, 'unilateral')
  const activation = prepItem('band-lateral-walk', '弹力带侧向走', 'A', { reps: 6 }, genericPrepTime, 'unilateral')
  const pattern = level === 'l1'
    ? prepItem('low-box-step-up', '低箱台阶上步', 'P', { reps: 3 }, genericPrepTime, 'unilateral')
    : level === 'l2'
      ? prepItem('lateral-lunge', '侧向箭步蹲', 'P', { reps: 3 }, genericPrepTime, 'unilateral')
      : level === 'l3'
        ? prepItem('step-up-knee-drive', '台阶上步提膝', 'P', { reps: 3 }, genericPrepTime, 'unilateral')
        : prepItem('forward-lunge', '前向弓步', 'P', { reps: 3 }, genericPrepTime, 'unilateral')
  return prep(row, mobility, activation, pattern)
}

const con04Build = (level: ProgramLevel): SpecificBuildUpItem[] => {
  if (level === 'l1') {
    return [
      buildUpItem('skierg-build', 'skierg-build', 'SkiErg 专项曝光', { durationSeconds: 15 }, range(15, 15), 1),
      buildUpItem('bear-crawl-shuttle-build', 'bear-crawl-shuttle-build', '熊爬往返专项曝光', { distanceMeters: 6 }, range(25, 35), 2),
      buildUpItem('sled-push-build', 'sled-push-build', '轻负荷雪橇推', { distanceMeters: 10 }, range(15, 25), 3),
    ]
  }
  if (level === 'l2') {
    return [
      buildUpItem('skierg-build', 'skierg-build', 'SkiErg 专项曝光', { durationSeconds: 15 }, range(15, 15), 1),
      buildUpItem('lateral-lunge-build', 'lateral-lunge-build', '侧向箭步蹲专项曝光', { reps: 3 }, range(25, 40), 2, { laterality: 'unilateral', sideExecution: 'alternating' }),
      buildUpItem('bear-crawl-build', 'bear-crawl-build', '熊爬前进专项曝光', { distanceMeters: 4 }, range(20, 30), 3),
      buildUpItem('sled-push-build', 'sled-push-build', '轻负荷雪橇推', { distanceMeters: 10 }, range(15, 25), 4),
    ]
  }
  if (level === 'l3') {
    return [
      buildUpItem('skierg-build', 'skierg-build', 'SkiErg 专项曝光', { durationSeconds: 20 }, range(20, 20), 1),
      buildUpItem('step-up-knee-drive-build', 'step-up-knee-drive-build', '台阶上步提膝专项曝光', { reps: 3 }, range(25, 40), 2, { laterality: 'unilateral', sideExecution: 'alternating' }),
      buildUpItem('lateral-bear-crawl-build', 'lateral-bear-crawl-build', '侧向熊爬专项曝光', { distanceMeters: 3 }, range(30, 45), 3, { laterality: 'unilateral', sideExecution: 'alternating' }),
      buildUpItem('sled-push-build', 'sled-push-build', '轻负荷雪橇推', { distanceMeters: 10 }, range(15, 25), 4),
    ]
  }
  return [
    buildUpItem('skierg-build', 'skierg-build', 'SkiErg 专项曝光', { durationSeconds: 25 }, range(25, 25), 1),
    buildUpItem('multidirectional-lunge-build', 'multidirectional-lunge-build', '多方向弓步专项曝光', { reps: 3 }, range(25, 40), 2, { laterality: 'unilateral', sideExecution: 'alternating' }),
    buildUpItem('lateral-bear-crawl-build', 'lateral-bear-crawl-build', '侧向熊爬专项曝光', { distanceMeters: 4 }, range(40, 60), 3, { laterality: 'unilateral', sideExecution: 'alternating' }),
    buildUpItem('sled-push-build', 'sled-push-build', '轻负荷雪橇推', { distanceMeters: 10 }, range(15, 25), 4),
  ]
}

const con04Level = (
  programLevel: ProgramLevel,
  primaryGoal: string,
  secondaryGoal: string,
  firstStation: TrainingExercise,
  skiDuration: number,
  crawlStation: TrainingExercise,
  sledDistance: Count,
  roundRest: Count,
  rpe: NumericRange,
  progressionFromPrevious: NonNullable<ProgrammingTemplateLevel['progressionFromPrevious']>,
  outputStability: string,
  estimatedMinutes: NumericRange,
  setupAllowance: NumericRange,
  buildAllowance: NumericRange,
  coachNote: string,
): ProgrammingTemplateLevel => makeLevel({
  programLevel,
  primaryGoal,
  secondaryGoal,
  prepItems: con04Prep(programLevel),
  specificBuildUp: con04Build(programLevel),
  blocks: [conditioningBlock([
    firstStation,
    conditioningStation('skierg', 'SkiErg', 'vpull', { durationSeconds: skiDuration }, range(skiDuration, skiDuration)),
    crawlStation,
    conditioningStation('sled-push', 'Sled Push', 'hpush', { distanceMeters: sledDistance }, sledDistance === 15 ? range(25, 45) : sledDistance === 20 ? range(35, 55) : range(35, 65)),
  ], 3, roundRest, range(20, 30), range(15, 20))],
  rpe,
  progressionFromPrevious,
  output: con04PrimaryOutput(outputStability),
  estimatedMinutes,
  planning: planningTime(setupAllowance, buildAllowance),
  coachNote,
})

const con05Prep = (rowDuration: Count): PrepItem[] => prep(
  prepItem('row-erg', 'RowErg 轻划', 'R', { durationSeconds: rowDuration }, typeof rowDuration === 'number' ? range(rowDuration, rowDuration) : rowDuration),
  prepItem('side-lying-open-book', '侧卧开书式', 'M', { reps: 4 }, genericPrepTime, 'unilateral'),
  prepItem('dead-bug', '死虫式', 'A', { reps: 5 }, genericPrepTime, 'unilateral'),
  prepItem('wall-hip-hinge', '墙面髋铰链', 'P', { reps: 6 }, genericPrepTime),
)

const con05Build = (hingeKey: string, rowDuration: number, carryDistance: number, hingeReps: number): SpecificBuildUpItem[] => [
  buildUpItem('row-erg-build', 'row-erg-build', 'RowErg 专项曝光', { durationSeconds: rowDuration }, range(rowDuration, rowDuration), 1),
  buildUpItem('sled-push-build', 'sled-push-build', '轻负荷雪橇推', { distanceMeters: 10 }, range(15, 25), 2),
  buildUpItem(hingeKey + '-build', hingeKey + '-build', hingeKey === 'kb-deadlift' ? '轻负荷壶铃硬拉' : '轻负荷壶铃 RDL', { reps: hingeReps }, hingeKey === 'kb-deadlift' ? range(10, 20) : range(15, 25), 3),
  buildUpItem('farmer-carry-build', 'farmer-carry-build', '轻负荷 Farmer Carry', { distanceMeters: carryDistance }, carryDistance === 10 ? range(15, 25) : range(20, 30), 4),
]

const roundPolicyL3: NonNullable<TrainingBlock['roundPolicy']> = {
  standardRounds: 3,
  conditionalMaxRounds: 4,
  conditions: ['output-stability', 'recovery', 'technique', 'session-time'],
}

const con05Level = (
  programLevel: ProgramLevel,
  primaryGoal: string,
  secondaryGoal: string,
  rowDistance: Count,
  rowBuildDuration: number,
  sledDistance: Count,
  hingeKey: string,
  hingeName: string,
  hingePrescription: ExercisePrescription,
  carryDistance: Count,
  rounds: Count,
  roundRest: Count,
  rpe: NumericRange,
  progressionFromPrevious: NonNullable<ProgrammingTemplateLevel['progressionFromPrevious']>,
  outputStability: string,
  estimatedMinutes: NumericRange,
  setupAllowance: NumericRange,
  buildAllowance: NumericRange,
  coachNote: string,
  roundPolicy?: TrainingBlock['roundPolicy'],
): ProgrammingTemplateLevel => makeLevel({
  programLevel,
  primaryGoal,
  secondaryGoal,
  prepItems: con05Prep(programLevel === 'l1' ? 60 : programLevel === 'l2' ? 75 : 90),
  specificBuildUp: con05Build(
    hingeKey,
    rowBuildDuration,
    programLevel === 'l3' || programLevel === 'l4' ? 15 : 10,
    programLevel === 'l3' ? 5 : 4,
  ),
  blocks: [conditioningBlock([
    conditioningStation('row-erg', 'RowErg', 'hpull', { distanceMeters: rowDistance }, rowDistance === 100 ? range(45, 75) : rowDistance === 125 ? range(60, 90) : range(75, 105)),
    conditioningStation('sled-push', 'Sled Push', 'hpush', { distanceMeters: sledDistance }, sledDistance === 15 ? range(25, 45) : sledDistance === 20 ? range(35, 55) : range(35, 65)),
    conditioningStation(hingeKey, hingeName, 'hinge', hingePrescription, hingeKey === 'kb-deadlift'
      ? range(20, 35)
      : typeof hingePrescription.reps === 'object'
        ? range(25, 50)
        : hingePrescription.reps === 10
          ? range(30, 50)
          : range(25, 40), {
      coachNote: 'Use a load that preserves repeatable speed; no grinding, no RIR target and no local failure objective.',
    }),
    conditioningStation('farmer-carry', 'Farmer Carry', 'carry', { distanceMeters: carryDistance }, carryDistance === 20 ? range(30, 50) : carryDistance === 25 ? range(40, 60) : range(50, 75), {
      coachNote: 'Carry load remains subordinate to repeatable round output and posture.',
    }),
  ], rounds, roundRest, range(20, 30), range(15, 20), roundPolicy)],
  rpe,
  progressionFromPrevious,
  output: con05PrimaryOutput(outputStability),
  estimatedMinutes,
  planning: planningTime(setupAllowance, buildAllowance),
  coachNote,
})

export const conditioningTemplates: ProgrammingTemplate[] = [
  {
    id: 'con1',
    code: 'CON01',
    system: 'conditioning',
    name: 'Erg Interval',
    description: '单一 RowErg 的重复输出训练。',
    levels: {
      l1: con01Level('l1', 'Learn to Pace', '建立基础划船技术和恢复节奏。', 30, 6, 45, range(5, 6), progression(['control'], '建立可重复的低至中等工作节奏。'), '第 6 轮距离应接近前几轮；不得出现首轮明显快于后续轮次的输出崩落。', range(16.75, 19.58), range(240, 360)),
      l2: con01Level('l2', 'Repeat Output', '提高 40s 工作段的配速控制能力。', 40, 6, 40, range(6, 7), progression(['volume', 'output'], '延长 Work bout，同时维持每轮距离。'), '第 6 轮仍应保持接近前几轮的距离和配速。', range(16.67, 19.50), range(240, 360)),
      l3: con01Level('l3', 'Sustain Output', '提高可持续 Work density，而不是追求单轮最大速度。', 45, 6, 30, range(7, 8), progression(['rest', 'density', 'output'], '缩短 Recovery 后维持重复输出。'), '在 Recovery 缩短后，第 4–6 轮仍需保持目标距离，不能通过首轮过度冲刺换取高 RPE。', range(17.58, 20.67), range(300, 420)),
      l4: con01Level('l4', 'High Repeatable Output', '建立高输出但可重复的 Erg interval 能力。', 30, 8, 60, range(8, 9), progression(['volume', 'output'], '增加高质量 bouts，并用充分 Recovery 保持低衰减。'), '第 7–8 轮仍应维持接近前两轮的距离；不得通过第一轮超出可持续范围的冲刺制造虚假成绩。', range(22.33, 25.17), range(300, 420)),
    },
  },
  {
    id: 'con2',
    code: 'CON02',
    system: 'conditioning',
    name: 'Sled + Carry',
    description: '固定雪橇推与 Farmer Carry 的负重移动体能。',
    levels: {
      l1: con02Level('l1', 'Learn to Move Under Load', '保持姿势、呼吸和站点转换质量。', 15, 20, 3, range(60, 75), 'light-sled-push', 'light-farmer-carry', range(25, 45), range(30, 50), range(5, 6), progression(['control'], '学习连续移动、稳定呼吸与基础姿势。'), '三轮之间 Sled split 不应逐轮明显变慢；Carry 应保持躯干稳定、步幅连续和握持控制。', range(15.42, 22.50), range(300, 420), range(25, 45), 'Sled split 下降时降低雪橇负荷；Carry 姿势破坏时降低 Carry 负荷；转换混乱时延长站点转换。'),
      l2: con02Level('l2', 'Repeat Loaded Movement', '在标准 Recovery 下保持 Sled split 和 Carry 姿势。', 20, 25, 3, 60, 'moderate-sled-push', 'moderate-farmer-carry', range(35, 55), range(40, 60), range(6, 7), progression(['load', 'volume', 'output'], '增加距离并小幅提高可重复工作负荷。'), '在距离增加后，第 3 轮仍需保持稳定呼吸和可接受的 Sled split。', range(16.67, 22.75), range(300, 420), range(20, 40), 'Sled split 连续下降时降低负荷；Carry 姿势下降时降低负荷；恢复不足时增加 Round Recovery。'),
      l3: con02Level('l3', 'Sustain Loaded Output', '建立可重复的高工作容量，同时保留输出余量。', 20, 30, 4, range(60, 75), 'moderate-high-sled-push', 'moderate-high-farmer-carry', range(35, 55), range(50, 75), range(7, 8), progression(['load', 'volume', 'output'], '使用中高工作负荷完成四轮，并保留可见输出余量。'), '第 4 轮仍需保持目标 split 和姿势；L3 要求存在可观察的输出余量，而不是每轮都接近失败。', range(21.50, 29.50), range(360, 480), range(25, 40), '不能维持四轮时先降低雪橇负荷；Carry 姿势下降时降低 Carry 负荷；不通过增加复杂 Carry 方式解决输出问题。'),
      l4: con02Level('l4', 'High Loaded Repeatability', '保持目标 split、Carry 姿势和四轮输出稳定。', 20, 30, 4, range(75, 90), 'high-control-sled-push', 'high-control-farmer-carry', range(35, 55), range(50, 75), range(8, 9), progression(['load', 'output'], '提高至当前条件下最高可控的 repeatable working load，同时保持目标 split、姿势和四轮完成。'), 'L4 的负荷必须能够让四轮都完成。若第 3–4 轮明显崩盘，该负荷不属于可重复工作负荷。', range(22.25, 30.25), range(360, 480), range(25, 40), '第 3 轮开始 split 明显变慢时降低 Sled 或 Carry 负荷；恢复不足时延长 Round Recovery；不以更复杂的 Carry 形式补偿。'),
    },
  },
  {
    id: 'con3',
    code: 'CON03',
    system: 'conditioning',
    name: 'Power Repeatability',
    description: 'Power Quality Block 与 Capacity Support Block 分离。',
    levels: {
      l1: con03FixedLevel('l1', 'Learn to Produce Power', '建立基础爆发动作和低复杂度负重移动能力。', 3, 'kb-deadlift', '壶铃硬拉', { reps: 8 }, 20, range(30, 50), range(5, 6), progression(['control', 'output'], '区分爆发输出与体能疲劳，保持每次下砸的主动速度意图。'), 'Medicine Ball Slam 的每组 5 次保持主动速度意图；Capacity 三轮不因局部疲劳破坏 Carry 姿势。', range(18.60, 25.62), prep(
        prepItem('row-erg', 'RowErg 轻划', 'R', { durationSeconds: range(60, 90) }, range(60, 90)),
        prepItem('wall-hip-hinge', '墙面髋铰链', 'M', { reps: 6 }, genericPrepTime),
        prepItem('glute-bridge', '臀桥', 'A', { reps: 8 }, genericPrepTime),
        prepItem('medicine-ball-slam-technique', '药球下砸技术练习', 'P', { reps: 3 }, genericPrepTime),
      ), [
        buildUpItem('medicine-ball-slam-build', 'medicine-ball-slam-build', '轻药球下砸', { reps: 3 }, range(6, 12), 1),
        buildUpItem('kb-deadlift-build', 'kb-deadlift-build', '壶铃硬拉准备组', { reps: 4 }, range(10, 20), 2),
        buildUpItem('farmer-carry-build', 'farmer-carry-build', '轻负荷 Farmer Carry', { distanceMeters: 10 }, range(15, 25), 3),
      ], range(35, 45), range(300, 420), 'Power 速度下降时立即结束该组；KB 局部疲劳先出现时降低负荷；不把 Power 动作移入 Capacity。'),
      l2: con03FixedLevel('l2', 'Repeat Low-Complexity Power', '提高低复杂度 Hinge 与 Carry 的重复输出。', 4, 'kb-rdl', '壶铃 RDL', { reps: range(8, 10) }, 25, range(40, 60), range(6, 7), progression(['volume', 'output'], '增加高质量 Power 组数，而不是延长单组疲劳。'), '四组 Medicine Ball Slam 的第 4 组仍需保持主动速度意图；Capacity 第 3 轮不出现明显 Carry 姿势下降。', range(20.85, 27.62), prep(
        prepItem('row-erg', 'RowErg 轻划', 'R', { durationSeconds: range(75, 90) }, range(75, 90)),
        prepItem('wall-hip-hinge', '墙面髋铰链', 'M', { reps: 6 }, range(45, 55)),
        prepItem('dead-bug', '死虫式', 'A', { reps: 5 }, range(45, 55), 'unilateral'),
        prepItem('medicine-ball-slam-technique', '药球下砸技术练习', 'P', { reps: 3 }, range(45, 55)),
      ), [
        buildUpItem('medicine-ball-slam-build', 'medicine-ball-slam-build', '轻药球下砸', { reps: 3 }, range(6, 12), 1),
        buildUpItem('kb-rdl-build', 'kb-rdl-build', '壶铃 RDL 准备组', { reps: 4 }, range(15, 25), 2),
        buildUpItem('farmer-carry-build', 'farmer-carry-build', '轻负荷 Farmer Carry', { distanceMeters: 15 }, range(20, 30), 3),
      ], range(30, 45), range(300, 420), 'Power 速度下降时停止当前组；KB RDL 局部疲劳限制 Carry 时降低 KB 负荷；必要时延长 Round Recovery。'),
      l3: con03TrackLevel('l3', 'Higher Repeatable Power', '在 Power Block 后维持四轮 Carry 输出。', makePowerTrackSlot('con3-l3-power', 'medicine-ball-slam', [
        makePowerOption('kb-swing', 'swing', con03L3SwingPath, true),
        makePowerOption('medicine-ball-slam', 'medicine-ball', con03L3MedicinePath, false),
      ], undefined, 'medicine-ball-slam'), con03L3MedicinePath, range(40, 75), 4, range(60, 75), range(7, 8), progression(['load', 'volume', 'output'], '具备 Swing Technique Competency 时进入 Swing Track；否则保持 Medicine Ball Power Track；Capacity 改为单一 Carry 以避免 Hinge 疲劳叠加。'), 'Power Block 每组动作质量保持稳定；Carry 第 4 轮仍需完成目标距离和姿势控制。', range(20.52, 31.00), range(360, 480), '未达到 Swing Technique Competency 时保持 Medicine Ball Track；不在 Swing 前先做另一条 Power 路径；Carry 局部疲劳限制整体输出时降低负荷；不用 RIR。'),
      l4: con03TrackLevel('l4', 'High Repeatable Power', '维持四轮 Carry 输出，而不是用疲劳吞掉爆发质量。', makePowerTrackSlot('con3-l4-power', 'foundation-regression', [
        makePowerOption('kb-swing', 'hinge-power', con03L4SwingPath, true),
        makePowerOption('rotational-throw', 'rotational-power', con03L4ThrowPath, true),
      ], con03L4FoundationPath), con03L4FoundationPath, range(50, 75), 4, range(75, 90), range(8, 9), progression(['load', 'output'], '只选择一个 Power Track；提高重复输出质量，不以速度下降换取 RPE；Foundation Regression 不降低 Program Level。'), 'L4 需要表现为高质量 Power + 可重复 Capacity。若后半段动作速度、投掷距离或 Carry 姿势明显下降，应调整恢复或负荷。', range(22.43, 34.75), range(360, 480), 'Foundation Regression；Track A 与 Track B 不同时执行；未满足 Technique Competency 时不降低 Program Level；停止当前组；不用增加 Power 次数或缩短 Recovery 追求 RPE。'),
    },
  },
  {
    id: 'con4',
    code: 'CON04',
    system: 'conditioning',
    name: 'Multiplanar Capacity',
    description: '固定下肢多平面移动、SkiErg、locomotion 与雪橇站点。',
    levels: {
      l1: con04Level('l1', 'Basic Multiplanar Capacity', '建立 Erg、locomotion 与 Sled 之间的基础转换能力。', conditioningStation('low-box-step-up', '低箱台阶上步', 'single', { reps: 6 }, range(45, 75), con04LateralTiming), 25, conditioningStation('bear-crawl-shuttle', '熊爬往返十米', 'core', { distanceMeters: 10 }, range(35, 55), { coachNote: '熊爬往返十米表示前进五米、后退五米。' }), 15, 60, range(5, 6), progression(['control', 'volume'], '学习方向变化后维持基本控制与呼吸。'), '方向转换后仍能保持步态、躯干位置和呼吸控制；不得因追求速度而破坏熊爬或台阶上步质量。', range(22.83, 31.58), range(360, 480), range(40, 70), '动作质量下降时降低箱高；输出无法重复时缩短距离；负荷限制后续输出时降低负荷。'),
      l2: con04Level('l2', 'Lateral Capacity', '在侧向动作后保持 Erg 与 Sled 输出。', conditioningStation('lateral-lunge', '侧向箭步蹲', 'single', { reps: 6 }, range(45, 75), con04LateralTiming), 30, conditioningStation('bear-crawl', '熊爬前进六米', 'core', { distanceMeters: 6 }, range(25, 40)), 20, 60, range(6, 7), progression(['control', 'volume', 'output'], '引入额状面下肢控制并延长 Erg 工作时间。'), '额状面工作增加后，后两轮 SkiErg 与 Sled 输出仍需保持稳定；不以加快转换牺牲侧向控制。', range(23.08, 31.58), range(360, 480), range(20, 35), '侧向控制下降时缩短动作幅度；恢复不足时将恢复 60s → 75s；locomotion 质量下降时缩短距离。'),
      l3: con04Level('l3', 'Sustain Multiplanar Work', '提高方向变化后的重复能力，而不是堆叠更多动作。', conditioningStation('step-up-knee-drive', '台阶上步提膝', 'single', { reps: 6 }, range(50, 80), con04LateralTiming), 35, conditioningStation('lateral-bear-crawl', '侧向熊爬', 'core', { distanceMeters: 6 }, range(50, 75), { laterality: 'unilateral', sideExecution: 'one-side-then-opposite', startingSidePolicy: 'alternate-between-sets', sideRestSeconds: range(10, 15) }), 20, range(60, 75), range(7, 8), progression(['control', 'volume', 'output'], '在必要的整合复杂度下提高工作时间，并监控 locomotion quality。'), '第 3 轮仍需维持 SkiErg 和 Sled 输出；locomotion 不能出现髋部塌陷、支撑失控或明显路线偏移。', range(26.00, 36.00), range(360, 480), range(45, 70), '台阶控制下降时降低箱高；侧向熊爬需要更长 Reset 时延长 Reset；Sled 输出下降时降低负荷。'),
      l4: con04Level('l4', 'High Multiplanar Capacity', '提高方向整合，而不让第一站局部下肢疲劳限制整节课。', conditioningStation('multidirectional-lunge', '多方向弓步', 'single', { reps: 3 }, range(45, 75), con04LateralTiming), 40, conditioningStation('lateral-bear-crawl', '侧向熊爬', 'core', { distanceMeters: 8 }, range(65, 90), { laterality: 'unilateral', sideExecution: 'one-side-then-opposite', startingSidePolicy: 'alternate-between-sets', sideRestSeconds: range(15, 20) }), range(20, 25), range(75, 90), range(8, 9), progression(['control', 'volume', 'output'], '保持较短的多方向序列，在更高输出下避免局部下肢疲劳先于整体输出。'), '第 3 轮仍需维持 SkiErg 与 Sled 的目标输出；若多方向弓步先造成局部下肢失败，则该负荷或动作量不合格。', range(28.75, 39.75), range(420, 540), range(45, 65), '若局部下肢先失败则减少动作幅度；侧向熊爬受限时减少每侧距离；Sled 使用 20m 版本时降低距离，不增加复杂度。'),
    },
  },
  {
    id: 'con5',
    code: 'CON05',
    system: 'conditioning',
    name: 'Hybrid Conditioning',
    description: '固定 Erg、雪橇、髋铰链与 Farmer Carry 的混合工作容量。',
    levels: {
      l1: con05Level('l1', 'Hybrid Foundation', '建立低技术、可恢复的混合工作容量。', 100, 20, 15, 'kb-deadlift', '壶铃硬拉', { reps: 8 }, 20, 3, range(60, 75), range(5, 6), progression(['control', 'volume'], '学习四种 modality 切换，不追求速度。'), '三轮切换顺畅，后两轮不因 KB Deadlift 或 Carry 局部疲劳破坏 RowErg 与 Sled 输出。', range(22.50, 32.83), range(360, 480), range(45, 85), '降低负荷（可降低 KB 或 Carry 负荷）；转换混乱时延长站点转换。'),
      l2: con05Level('l2', 'Repeat Hybrid Work', '保持每轮完成时间和 RowErg 输出稳定。', 125, 25, 20, 'kb-rdl', '壶铃 RDL', { reps: range(8, 10) }, 25, 3, 60, range(6, 7), progression(['load', 'volume', 'output'], '增加各站点工作量，并保持每轮完成时间。'), '第 3 轮完成时间不应明显长于前两轮；KB RDL 不得先于整体输出成为限制因素。', range(25.17, 35.58), range(360, 480), range(60, 105), 'KB RDL 局部疲劳限制输出时降低 KB RDL；雪橇 split 下降时降低雪橇负荷；恢复不足时降低负荷。'),
      l3: con05Level('l3', 'Sustain Hybrid Output', '在合法 3–4 轮范围内维持每轮完成时间和器械输出。', 150, 30, 20, 'kb-rdl', '壶铃 RDL', { reps: 10 }, 30, 3, range(60, 75), range(7, 8), progression(['volume', 'density', 'output'], '3 rounds 是 Standard Prescription；第 4 轮只有在 Output Stability、Recovery、Technique 和 Session Time 全部允许时才使用。'), '第 4 轮只有在前三轮输出稳定、Recovery 足够、动作技术可接受时才执行；第 4 轮不以单纯增加疲劳为目的。', range(27.08, 46.00), range(360, 480), range(60, 115), '第 4 轮不是 Optional Exercise；只完成标准 3 轮时保持 3 轮，不进入第 4 轮。', roundPolicyL3),
      l4: con05Level('l4', 'High Hybrid Repeatability', '让后两轮仍然保持可比较的完成时间、Erg 输出和 Sled split。', 150, 30, range(20, 25), 'kb-rdl', '壶铃 RDL', { reps: 8 }, 30, 4, range(75, 90), range(8, 9), progression(['load', 'output', 'density'], '提高可保持重复速度的中高负荷与整体输出；不设 RIR 或局部力竭目标。'), 'L4 的重点是第 3、4 轮仍可与前两轮比较。首轮更快但后两轮明显崩盘，不符合目标。', range(33.83, 47.67), range(420, 540), range(55, 110), '降低 KB RDL 负荷；使用 20m 版本；不增加复杂度。'),
    },
  },
]
