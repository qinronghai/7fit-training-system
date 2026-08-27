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

const buildUpItem = (
  exerciseKey: string,
  displayName: string,
  prescription: ExercisePrescription,
  planningExecutionSeconds: NumericRange,
  order: number,
  options: Partial<Pick<SpecificBuildUpItem, 'restAfterSeconds' | 'transitionAfterSeconds' | 'coachNote'>> = {},
): SpecificBuildUpItem => ({
  id: 'build-' + exerciseKey + '-' + String(order),
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
  options: Partial<Pick<TrainingExercise, 'movementPattern' | 'laterality' | 'sideRestSeconds' | 'sideExecution' | 'startingSidePolicy' | 'coachNote'>> = {},
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
  exercise: PowerTrackSlot,
  restBetweenSetsSeconds: Count,
  transitionAfterSeconds = 30,
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
  supporting: ConditioningOutputPlan['supporting'] = [],
): ConditioningOutputPlan => ({
  primary,
  ...(supporting.length > 0 ? { supporting } : {}),
  outputStability: {
    kind: 'coach-design-target',
    description: 'Later work bouts or rounds remain repeatable without material output or technique degradation.',
  },
})

const planningTime = (
  setupCoachingAllowanceSeconds: NumericRange = range(300, 480),
  buildUpCoachingAllowanceSeconds: NumericRange = range(25, 45),
): ConditioningPlanningTime => ({
  buildUpCoachingAllowanceSeconds,
  setupCoachingAllowanceSeconds,
})

const progression = (
  variables: NonNullable<ProgrammingTemplateLevel['progressionFromPrevious']>['variables'],
  note: string,
): NonNullable<ProgrammingTemplateLevel['progressionFromPrevious']> => ({ variables, note })

const commonCoachNote = 'Output is the primary target. Reduce output target, work duration or distance, then extend recovery and reduce load if local fatigue or technique limits repeatability. Stop for pain, dizziness, or clear technical or output degradation.'

const makeLevel = ({
  programLevel,
  primaryGoal,
  prep,
  specificBuildUp,
  blocks,
  rpe,
  progressionFromPrevious,
  output,
  estimatedMinutes,
  planning = planningTime(),
  coachNote = commonCoachNote,
}: {
  programLevel: ProgramLevel
  primaryGoal: string
  prep: PrepItem[]
  specificBuildUp: SpecificBuildUpItem[]
  blocks: TrainingBlock[]
  rpe: number | NumericRange
  progressionFromPrevious: NonNullable<ProgrammingTemplateLevel['progressionFromPrevious']>
  output: ConditioningOutputPlan
  estimatedMinutes: NumericRange
  planning?: ConditioningPlanningTime
  coachNote?: string
}): ProgrammingTemplateLevel => ({
  programLevel,
  primaryGoal,
  prep,
  rampUp: [],
  specificBuildUp,
  blocks,
  estimatedMinutes,
  conditioningIntensityTarget: { rpe, note: 'Use the target RPE only as a global conditioning ceiling; output repeatability and technique take priority.' },
  outputPlan: output,
  planningTime: planning,
  progressionFromPrevious,
  coachNote,
})

const conPrep = (
  rKey: string,
  mKey: string,
  aKey: string,
  pKey: string,
  rName: string,
  mName: string,
  aName: string,
  pName: string,
  rPrescription: ExercisePrescription = { durationSeconds: 60 },
): PrepItem[] => [
  prepItem(rKey, rName, 'R', rPrescription, rPrescription.durationSeconds === undefined ? range(45, 60) : range(60, 90)),
  prepItem(mKey, mName, 'M', { reps: 6 }, range(45, 60)),
  prepItem(aKey, aName, 'A', { reps: 8 }, range(45, 60)),
  prepItem(pKey, pName, 'P', { reps: 6 }, range(45, 60)),
]

const con01Output = outputPlan(
  { kind: 'work-bout-distance', scope: 'bout', availability: 'required', label: 'Work-bout distance' },
  [
    { kind: 'pace', scope: 'bout', availability: 'when-available', label: 'Pace' },
    { kind: 'power', scope: 'bout', availability: 'when-available', label: 'Average power' },
  ],
)

const con02Output = outputPlan(
  { kind: 'sled-split-time', scope: 'station', availability: 'required', label: 'Sled split time' },
  [
    { kind: 'carry-load', scope: 'station', availability: 'when-available', label: 'Carry load' },
    { kind: 'carry-distance', scope: 'station', availability: 'required', label: 'Carry distance' },
    { kind: 'completion-time', scope: 'station', availability: 'required', label: 'Carry completion time' },
  ],
)

const con03Output = outputPlan(
  { kind: 'power-quality', scope: 'set', availability: 'required', label: 'Power quality' },
  [
    { kind: 'explosive-reps', scope: 'set', availability: 'required', label: 'Repeatable explosive reps' },
    { kind: 'velocity', scope: 'set', availability: 'when-available', label: 'Velocity' },
    { kind: 'throw-distance', scope: 'set', availability: 'when-available', label: 'Throw distance' },
  ],
)

const con04Output = outputPlan(
  { kind: 'erg-output', scope: 'station', availability: 'required', label: 'SkiErg output' },
  [
    { kind: 'sled-split-time', scope: 'station', availability: 'required', label: 'Sled split time' },
    { kind: 'locomotion-quality', scope: 'station', availability: 'required', label: 'Locomotion quality gate' },
  ],
)

const con05Output = outputPlan(
  { kind: 'round-completion-time', scope: 'round', availability: 'required', label: 'Round completion time' },
  [
    { kind: 'erg-output', scope: 'station', availability: 'required', label: 'RowErg output' },
    { kind: 'sled-split-time', scope: 'station', availability: 'required', label: 'Sled split time' },
  ],
)

const rowPrep = (level: ProgramLevel): PrepItem[] => {
  if (level === 'l1' || level === 'l2') {
    return conPrep('row-erg', 'thoracic-rotation', 'band-pull-apart', 'row-erg-technique', 'RowErg', '胸椎旋转', '弹力带拉开', 'RowErg 技术划')
  }
  if (level === 'l3') {
    return conPrep('row-erg', 'lateral-lunge-mobility', 'band-straight-arm-pulldown', 'row-erg-technique', 'RowErg', '侧向箭步活动', '弹力带直臂下压', 'RowErg 技术划')
  }
  return conPrep('row-erg', 'inchworm', 'dead-bug', 'row-erg-technique', 'RowErg', '毛毛虫', '死虫式', 'RowErg 技术划')
}

const rowBuild = (
  key: string,
  durationSeconds: number,
  planningExecutionSeconds: NumericRange,
): SpecificBuildUpItem[] => [buildUpItem(
  key,
  'RowErg 配速练习',
  { sets: 2, durationSeconds },
  planningExecutionSeconds,
  1,
  { coachNote: '每个工作 bout 以可重复的节奏完成，不以首 bout 冲刺。' },
)]

const con01Level = (
  programLevel: ProgramLevel,
  primaryGoal: string,
  durationSeconds: number,
  rounds: number,
  roundRest: Count,
  rpe: number | NumericRange,
  buildKey: string,
  buildPlanning: NumericRange,
  workPlanning: NumericRange,
  progressionFromPrevious: NonNullable<ProgrammingTemplateLevel['progressionFromPrevious']>,
  estimatedMinutes: NumericRange,
): ProgrammingTemplateLevel => makeLevel({
  programLevel,
  primaryGoal,
  prep: rowPrep(programLevel),
  specificBuildUp: rowBuild(buildKey, 20, buildPlanning),
  blocks: [conditioningBlock(
    [conditioningStation('row-erg', 'RowErg', 'hpull', { durationSeconds }, workPlanning)],
    rounds,
    roundRest,
    0,
    0,
  )],
  rpe,
  progressionFromPrevious,
  output: con01Output,
  estimatedMinutes,
})

const sledCarryPrep = (): PrepItem[] => conPrep(
  'row-erg',
  'ankle-dorsiflexion-rock',
  'glute-bridge',
  'hip-hinge-drill',
  'RowErg',
  '踝背屈摇摆',
  '臀桥',
  '髋铰链练习',
  { durationSeconds: 60 },
)

const sledCarryBuild = (
  sledKey: string,
  carryKey: string,
  sledPlanning: NumericRange,
  carryPlanning: NumericRange,
): SpecificBuildUpItem[] => [
  buildUpItem(sledKey, '轻负荷雪橇推', { distanceMeters: 10 }, sledPlanning, 1),
  buildUpItem(carryKey, '轻负荷 Farmer Carry', { distanceMeters: 15 }, carryPlanning, 2),
]

const con02Level = (
  programLevel: ProgramLevel,
  primaryGoal: string,
  sledDistance: Count,
  carryDistance: Count,
  rounds: number,
  roundRest: Count,
  sledKey: string,
  carryKey: string,
  sledPlanning: NumericRange,
  carryPlanning: NumericRange,
  rpe: number | NumericRange,
  progressionFromPrevious: NonNullable<ProgrammingTemplateLevel['progressionFromPrevious']>,
  estimatedMinutes: NumericRange,
  coachNote?: string,
): ProgrammingTemplateLevel => makeLevel({
  programLevel,
  primaryGoal,
  prep: sledCarryPrep(),
  specificBuildUp: sledCarryBuild(sledKey, carryKey, range(10, 15), range(15, 25)),
  blocks: [conditioningBlock([
    conditioningStation('sled-push', 'Sled Push', 'hpush', { distanceMeters: sledDistance }, sledPlanning, {
      coachNote: 'Select a working load that keeps the sled split repeatable across every round.',
    }),
    conditioningStation('farmer-carry', 'Farmer Carry', 'carry', { distanceMeters: carryDistance }, carryPlanning, {
      coachNote: 'Use the highest controllable load that preserves posture and the planned completion time.',
    }),
  ], rounds, roundRest, range(20, 30), range(15, 20))],
  rpe,
  progressionFromPrevious,
  output: con02Output,
  estimatedMinutes,
  coachNote: coachNote ?? commonCoachNote,
})

const powerPathPrep = (
  modality: 'medicine-ball' | 'swing' | 'rotational',
): PrepItem[] => {
  if (modality === 'swing') {
    return conPrep('row-erg', 'wall-hip-hinge', 'standing-brace', 'kettlebell-swing-stance', 'RowErg', '墙面髋铰链', '站姿躯干固定', '壶铃摆动起始位练习')
  }
  if (modality === 'rotational') {
    return conPrep('row-erg', 'thoracic-rotation', 'standing-brace', 'medicine-ball-rotational-throw-stance', 'RowErg', '胸椎旋转', '站姿躯干固定', '药球旋转抛站姿练习')
  }
  return conPrep('row-erg', 'wall-hip-hinge', 'standing-brace', 'medicine-ball-slam-stance', 'RowErg', '墙面髋铰链', '站姿躯干固定', '药球下砸站姿练习')
}

const powerPathBuild = (
  modality: 'medicine-ball' | 'swing' | 'rotational',
): SpecificBuildUpItem[] => {
  if (modality === 'swing') {
    return [buildUpItem('kettlebell-swing-build', '低负荷壶铃摆动', { reps: 4 }, range(20, 30), 1)]
  }
  if (modality === 'rotational') {
    return [buildUpItem('medicine-ball-rotational-throw-build', '低负荷药球旋转抛', { reps: 3 }, range(20, 30), 1)]
  }
  return [buildUpItem('medicine-ball-slam-build', '低负荷药球下砸', { reps: 3 }, range(20, 30), 1)]
}

const makePowerPath = (
  modality: 'medicine-ball' | 'swing' | 'rotational',
  exercise: TrainingExercise,
): ConditioningPowerPath => ({
  prep: powerPathPrep(modality),
  specificBuildUp: powerPathBuild(modality),
  powerExercise: exercise,
})

const makePowerTrackSlot = (
  id: string,
  defaultSelection: PowerTrackSlot['defaultSelection'],
  options: PowerTrackOption[],
  foundationRegression: ConditioningPowerPath,
  prescription: ExercisePrescription,
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
  prescription,
  options,
  defaultSelection,
  foundationRegression,
  ...(fallbackOptionKey ? { fallbackOptionKey } : {}),
})

const makePowerOption = (
  optionKey: string,
  trackKey: string,
  path: ConditioningPowerPath,
  requiresTechniqueCompetency: boolean,
): PowerTrackOption => ({ optionKey, trackKey, path, requiresTechniqueCompetency })

const capacityBlock = (
  exercises: TrainingExercise[],
  rounds: number,
  roundRest: Count,
): TrainingBlock => conditioningBlock(exercises, rounds, roundRest, range(20, 30), range(15, 20))

const con03PowerSlotL1 = makePowerTrackSlot(
  'con3-l1-power',
  'medicine-ball-slam',
  [makePowerOption(
    'medicine-ball-slam',
    'medicine-ball',
    makePowerPath('medicine-ball', powerExercise('medicine-ball-slam', '药球下砸', { sets: 3, reps: 5 }, range(15, 20))),
    false,
  )],
  makePowerPath('medicine-ball', powerExercise('medicine-ball-slam', '药球下砸', { sets: 3, reps: 5 }, range(15, 20))),
  { sets: 3, reps: 5 },
)

const con03PowerSlotL2 = makePowerTrackSlot(
  'con3-l2-power',
  'medicine-ball-slam',
  [makePowerOption(
    'medicine-ball-slam',
    'medicine-ball',
    makePowerPath('medicine-ball', powerExercise('medicine-ball-slam', '药球下砸', { sets: 4, reps: 5 }, range(15, 20))),
    false,
  )],
  makePowerPath('medicine-ball', powerExercise('medicine-ball-slam', '药球下砸', { sets: 4, reps: 5 }, range(15, 20))),
  { sets: 4, reps: 5 },
)

const con03L3MedicinePower = powerExercise('medicine-ball-slam', '药球下砸', { sets: 3, reps: 5 }, range(15, 20))
const con03L3SwingPower = powerExercise('kb-swing', '壶铃摆动', { sets: 5, reps: 6 }, range(20, 25))
const con03L3MedicinePath = makePowerPath('medicine-ball', con03L3MedicinePower)
const con03L3SwingPath = makePowerPath('swing', con03L3SwingPower)
const con03PowerSlotL3 = makePowerTrackSlot(
  'con3-l3-power',
  'medicine-ball-slam',
  [
    makePowerOption('kb-swing', 'swing', con03L3SwingPath, true),
    makePowerOption('medicine-ball-slam', 'medicine-ball', con03L3MedicinePath, false),
  ],
  con03L3MedicinePath,
  { sets: 3, reps: 5 },
  'medicine-ball-slam',
)

const con03L4SwingPower = powerExercise('kb-swing', '壶铃摆动', { sets: 5, reps: { min: 5, max: 6 } }, range(20, 25))
const con03L4ThrowPower = powerExercise('rotational-throw', '药球旋转抛', { sets: 4, reps: 5 }, range(30, 40), {
  movementPattern: 'rotation',
  laterality: 'unilateral',
  sideExecution: 'one-side-then-opposite',
  startingSidePolicy: 'alternate-between-sets',
  sideRestSeconds: range(15, 20),
})
const con03L4FoundationPower = powerExercise('medicine-ball-slam-foundation', '药球下砸', { sets: 3, reps: 5 }, range(15, 20))
const con03L4SwingPath = makePowerPath('swing', con03L4SwingPower)
const con03L4ThrowPath = makePowerPath('rotational', con03L4ThrowPower)
const con03L4FoundationPath = makePowerPath('medicine-ball', con03L4FoundationPower)
const con03PowerSlotL4 = makePowerTrackSlot(
  'con3-l4-power',
  'foundation-regression',
  [
    makePowerOption('kb-swing', 'hinge-power', con03L4SwingPath, true),
    makePowerOption('rotational-throw', 'rotational-power', con03L4ThrowPath, true),
  ],
  con03L4FoundationPath,
  { sets: 3, reps: 5 },
)

const con03Level = (
  programLevel: ProgramLevel,
  primaryGoal: string,
  powerSlot: PowerTrackSlot,
  defaultPath: ConditioningPowerPath,
  capacity: TrainingBlock,
  powerRest: Count,
  rpe: number | NumericRange,
  progressionFromPrevious: NonNullable<ProgrammingTemplateLevel['progressionFromPrevious']>,
  estimatedMinutes: NumericRange,
): ProgrammingTemplateLevel => makeLevel({
  programLevel,
  primaryGoal,
  prep: defaultPath.prep,
  specificBuildUp: defaultPath.specificBuildUp,
  blocks: [powerBlock('power', 'Power Quality', powerSlot, powerRest), capacity],
  rpe,
  progressionFromPrevious,
  output: con03Output,
  estimatedMinutes,
})

const con04Prep = (level: ProgramLevel): PrepItem[] => {
  if (level === 'l1') return conPrep('row-erg', 'ankle-dorsiflexion-rock', 'glute-bridge', 'step-up-pattern', 'RowErg', '踝背屈摇摆', '臀桥', '低箱台阶模式')
  if (level === 'l2') return conPrep('row-erg', 'ankle-dorsiflexion-rock', 'glute-bridge', 'lateral-lunge-pattern', 'RowErg', '踝背屈摇摆', '臀桥', '侧向箭步模式')
  if (level === 'l3') return conPrep('row-erg', 'ankle-dorsiflexion-rock', 'glute-bridge', 'step-up-knee-drive-pattern', 'RowErg', '踝背屈摇摆', '臀桥', '台阶上步提膝模式')
  return conPrep('row-erg', 'ankle-dorsiflexion-rock', 'glute-bridge', 'multidirectional-lunge-pattern', 'RowErg', '踝背屈摇摆', '臀桥', '多方向弓步模式')
}

const con04Build = (level: ProgramLevel): SpecificBuildUpItem[] => {
  const names: Record<ProgramLevel, string[]> = {
    l1: ['low-box-step-up-build', 'skierg-build', 'bear-crawl-shuttle-build', 'sled-push-build'],
    l2: ['lateral-lunge-build', 'skierg-build', 'bear-crawl-build', 'sled-push-build'],
    l3: ['step-up-knee-drive-build', 'skierg-build', 'lateral-bear-crawl-build', 'sled-push-build'],
    l4: ['multidirectional-lunge-build', 'skierg-build', 'lateral-bear-crawl-build', 'sled-push-build'],
  }
  return names[level].map((key, index) => buildUpItem(
    key,
    key.replaceAll('-', ' '),
    index === 1 ? { durationSeconds: 15 } : index === 2 ? { distanceMeters: 5 } : { distanceMeters: 10 },
    index === 1 ? range(15, 25) : range(10, 20),
    index + 1,
  ))
}

const con04LateralTiming = {
  laterality: 'unilateral' as const,
  sideExecution: 'alternating' as const,
  startingSidePolicy: 'alternate-between-sets' as const,
}

const con04Level = (
  programLevel: ProgramLevel,
  primaryGoal: string,
  firstStation: TrainingExercise,
  skiDuration: number,
  crawlStation: TrainingExercise,
  sledDistance: Count,
  roundRest: Count,
  rpe: number | NumericRange,
  progressionFromPrevious: NonNullable<ProgrammingTemplateLevel['progressionFromPrevious']>,
  estimatedMinutes: NumericRange,
): ProgrammingTemplateLevel => makeLevel({
  programLevel,
  primaryGoal,
  prep: con04Prep(programLevel),
  specificBuildUp: con04Build(programLevel),
  blocks: [conditioningBlock([
    firstStation,
    conditioningStation('skierg', 'SkiErg', 'vpull', { durationSeconds: skiDuration }, range(skiDuration, skiDuration + 10)),
    crawlStation,
    conditioningStation('sled-push', 'Sled Push', 'hpush', { distanceMeters: sledDistance }, range(15, 30)),
  ], 3, roundRest, range(20, 30), range(15, 20))],
  rpe,
  progressionFromPrevious,
  output: con04Output,
  estimatedMinutes,
})

const con05Prep = (): PrepItem[] => conPrep('row-erg', 'thoracic-rotation', 'kb-hinge', 'light-sled-push', 'RowErg', '胸椎旋转', '壶铃髋铰链', '轻负荷雪橇推')

const con05Build = (hingeKey: string): SpecificBuildUpItem[] => [
  buildUpItem('row-erg-build', 'RowErg 进阶曝光', { distanceMeters: 50 }, range(25, 35), 1),
  buildUpItem('sled-push-build', '轻负荷雪橇推', { distanceMeters: 10 }, range(10, 20), 2),
  buildUpItem(hingeKey + '-build', hingeKey === 'kb-deadlift' ? '轻负荷壶铃硬拉' : '轻负荷壶铃 RDL', { reps: 5 }, range(20, 30), 3),
  buildUpItem('farmer-carry-build', '轻负荷 Farmer Carry', { distanceMeters: 10 }, range(10, 20), 4),
]

const con05Level = (
  programLevel: ProgramLevel,
  primaryGoal: string,
  rowDistance: Count,
  sledDistance: Count,
  hingeKey: string,
  hingeName: string,
  hingePrescription: ExercisePrescription,
  carryDistance: Count,
  rounds: Count,
  roundRest: Count,
  rpe: number | NumericRange,
  progressionFromPrevious: NonNullable<ProgrammingTemplateLevel['progressionFromPrevious']>,
  estimatedMinutes: NumericRange,
  roundPolicy?: TrainingBlock['roundPolicy'],
  coachNote?: string,
): ProgrammingTemplateLevel => makeLevel({
  programLevel,
  primaryGoal,
  prep: con05Prep(),
  specificBuildUp: con05Build(hingeKey),
  blocks: [conditioningBlock([
    conditioningStation('row-erg', 'RowErg', 'hpull', { distanceMeters: rowDistance }, range(30, 50)),
    conditioningStation('sled-push', 'Sled Push', 'hpush', { distanceMeters: sledDistance }, range(15, 30)),
    conditioningStation(hingeKey, hingeName, 'hinge', hingePrescription, range(20, 35), {
      coachNote: 'Use a load that preserves repeatable speed; no grinding and no local failure target.',
    }),
    conditioningStation('farmer-carry', 'Farmer Carry', 'carry', { distanceMeters: carryDistance }, range(20, 35), {
      coachNote: 'Carry load remains subordinate to repeatable round output and posture.',
    }),
  ], rounds, roundRest, range(20, 30), range(15, 20), roundPolicy)],
  rpe,
  progressionFromPrevious,
  output: con05Output,
  estimatedMinutes,
  coachNote: coachNote ?? commonCoachNote,
})

const roundPolicyL3: NonNullable<TrainingBlock['roundPolicy']> = {
  standardRounds: 3,
  conditionalMaxRounds: 4,
  conditions: ['output-stability', 'recovery', 'technique', 'session-time'],
}

export const conditioningTemplates: ProgrammingTemplate[] = [
  {
    id: 'con1',
    code: 'CON01',
    system: 'conditioning',
    name: 'Erg Interval',
    description: '单一 RowErg 的重复输出训练。',
    levels: {
      l1: con01Level('l1', 'Learn to Pace', 30, 6, 45, range(5, 6), 'row-erg-pacing-bout', range(120, 150), range(30, 35), progression(['control'], '建立可重复的低至中等工作节奏。'), range(12, 24)),
      l2: con01Level('l2', 'Repeat Output', 40, 6, 40, range(6, 7), 'row-erg-repeat-bout', range(120, 150), range(40, 45), progression(['volume', 'output'], '延长 work bout，同时维持每轮距离。'), range(13, 25)),
      l3: con01Level('l3', 'Sustain Output', 45, 6, 30, range(7, 8), 'row-erg-sustain-bout', range(120, 150), range(45, 50), progression(['rest', 'density', 'output'], '缩短恢复后维持重复输出。'), range(14, 26)),
      l4: con01Level('l4', 'High Repeatable Output', 30, 8, 60, range(8, 9), 'row-erg-high-output-bout', range(120, 150), range(30, 35), progression(['volume', 'output'], '增加高质量 bouts，并用充分恢复保持低衰减。'), range(16, 28)),
    },
  },
  {
    id: 'con2',
    code: 'CON02',
    system: 'conditioning',
    name: 'Sled + Carry',
    description: '固定雪橇推与 Farmer Carry 的负重移动体能。',
    levels: {
      l1: con02Level('l1', 'Learn to Move Under Load', 15, 20, 3, range(60, 75), 'light-sled-push', 'light-farmer-carry', range(15, 25), range(15, 25), range(5, 6), progression(['control'], '学习连续移动、稳定呼吸与基础姿势。'), range(14, 28)),
      l2: con02Level('l2', 'Repeat Loaded Movement', 20, 25, 3, 60, 'moderate-sled-push', 'moderate-farmer-carry', range(20, 30), range(20, 30), range(6, 7), progression(['load', 'volume', 'output'], '增加距离并小幅提高可重复工作负荷。'), range(15, 29)),
      l3: con02Level('l3', 'Sustain Loaded Output', 20, 30, 4, range(60, 75), 'moderate-high-sled-push', 'moderate-high-farmer-carry', range(20, 30), range(25, 35), range(7, 8), progression(['load', 'volume', 'output'], '使用中高工作负荷完成四轮，并保留可见输出余量。'), range(19, 36), 'L3 uses a moderate-high working load that preserves four-round repeatability with visible output reserve.'),
      l4: con02Level('l4', 'High Loaded Repeatability', 20, 30, 4, range(75, 90), 'high-control-sled-push', 'high-control-farmer-carry', range(20, 30), range(25, 35), range(8, 9), progression(['load', 'output'], '提高至当前条件下最高可控的 repeatable working load，同时保持目标 split、姿势和四轮完成。'), range(20, 38), 'L4 uses the highest controllable repeatable working load that preserves the target split, posture and all four rounds.'),
    },
  },
  {
    id: 'con3',
    code: 'CON03',
    system: 'conditioning',
    name: 'Power Repeatability',
    description: 'Power Quality Block 与 Capacity Support Block 分离。',
    levels: {
      l1: con03Level('l1', 'Learn to Produce Power', con03PowerSlotL1, con03PowerSlotL1.options[0].path, capacityBlock([
        conditioningStation('kb-deadlift', '壶铃硬拉', 'hinge', { reps: 8 }, range(20, 30)),
        conditioningStation('farmer-carry', 'Farmer Carry', 'carry', { distanceMeters: 20 }, range(20, 30)),
      ], 3, 60), 60, range(5, 6), progression(['control', 'output'], '区分爆发输出与体能疲劳，保持每次下砸的主动快速意图。'), range(18, 32)),
      l2: con03Level('l2', 'Repeat Low-Complexity Power', con03PowerSlotL2, con03PowerSlotL2.options[0].path, capacityBlock([
        conditioningStation('kb-rdl', '壶铃 RDL', 'hinge', { reps: { min: 8, max: 10 } }, range(20, 30)),
        conditioningStation('farmer-carry', 'Farmer Carry', 'carry', { distanceMeters: 25 }, range(20, 30)),
      ], 3, 60), 60, range(6, 7), progression(['volume', 'output'], '增加高质量 Power 组数，而不是延长单组疲劳。'), range(19, 34)),
      l3: con03Level('l3', 'Higher Repeatable Power', con03PowerSlotL3, con03L3MedicinePath, capacityBlock([
        conditioningStation('farmer-carry', 'Farmer Carry', 'carry', { distanceMeters: range(25, 30) }, range(25, 35)),
      ], 4, range(60, 75)), range(60, 75), range(7, 8), progression(['load', 'volume', 'output'], '在具备 Swing Technique Competency 时进入 Swing Track；否则保持 Medicine Ball Power Track。'), range(20, 36)),
      l4: con03Level('l4', 'High Repeatable Power', con03PowerSlotL4, con03L4FoundationPath, capacityBlock([
        conditioningStation('farmer-carry', 'Farmer Carry', 'carry', { distanceMeters: 30 }, range(25, 35)),
      ], 4, range(75, 90)), range(75, 90), range(8, 9), progression(['load', 'output'], '只选择一个 Power Track；提高重复输出质量，不以速度下降换取 RPE。'), range(22, 40)),
    },
  },
  {
    id: 'con4',
    code: 'CON04',
    system: 'conditioning',
    name: 'Multiplanar Capacity',
    description: '固定下肢多平面移动、SkiErg、locomotion 与雪橇站点。',
    levels: {
      l1: con04Level('l1', 'Basic Multiplanar Capacity', conditioningStation('low-box-step-up', '低箱台阶上步', 'single', { reps: 6 }, range(20, 30), con04LateralTiming), 25, conditioningStation('bear-crawl-shuttle', '熊爬往返十米', 'core', { distanceMeters: 10 }, range(20, 30), { coachNote: '前进五米，再后退五米，合计十米。' }), 15, range(60, 75), range(5, 6), progression(['control', 'volume'], '学习方向变化后维持基本控制与呼吸。'), range(20, 38)),
      l2: con04Level('l2', 'Lateral Capacity', conditioningStation('lateral-lunge', '侧向箭步蹲', 'single', { reps: 6 }, range(25, 35), con04LateralTiming), 30, conditioningStation('bear-crawl', '熊爬', 'core', { distanceMeters: range(6, 8) }, range(20, 30)), 20, 60, range(6, 7), progression(['control', 'volume', 'output'], '引入额状面下肢控制并延长 Erg 工作时间。'), range(21, 39)),
      l3: con04Level('l3', 'Sustain Multiplanar Work', conditioningStation('step-up-knee-drive', '台阶上步提膝', 'single', { reps: 6 }, range(25, 35), con04LateralTiming), 35, conditioningStation('lateral-bear-crawl', '侧向熊爬', 'core', { distanceMeters: 6 }, range(25, 35), {
        ...con04LateralTiming,
        sideRestSeconds: 10,
        sideExecution: 'one-side-then-opposite',
      }), 20, range(60, 75), range(7, 8), progression(['control', 'volume', 'output'], '在必要的整合复杂度下提高工作时间，并监控 locomotion quality。'), range(23, 42)),
      l4: con04Level('l4', 'High Multiplanar Capacity', conditioningStation('multidirectional-lunge', '多方向弓步', 'single', { reps: 3 }, range(30, 40), con04LateralTiming), 40, conditioningStation('lateral-bear-crawl', '侧向熊爬', 'core', { distanceMeters: 8 }, range(30, 40), {
        ...con04LateralTiming,
        sideRestSeconds: 10,
        sideExecution: 'one-side-then-opposite',
      }), range(20, 25), range(75, 90), range(8, 9), progression(['control', 'volume', 'output'], '保持较短的多方向序列，在更高输出下避免局部下肢疲劳先于整体输出。'), range(25, 45)),
    },
  },
  {
    id: 'con5',
    code: 'CON05',
    system: 'conditioning',
    name: 'Hybrid Conditioning',
    description: '固定 Erg、雪橇、髋铰链与 Farmer Carry 的混合工作容量。',
    levels: {
      l1: con05Level('l1', 'Hybrid Foundation', 100, 15, 'kb-deadlift', '壶铃硬拉', { reps: 8 }, 20, 3, range(60, 75), range(5, 6), progression(['control', 'volume'], '学习四种 modality 切换，不追求速度。'), range(19, 38)),
      l2: con05Level('l2', 'Repeat Hybrid Work', 125, 20, 'kb-rdl', '壶铃 RDL', { reps: { min: 8, max: 10 } }, 25, 3, 60, range(6, 7), progression(['load', 'volume', 'output'], '增加各站点工作量，并保持每轮完成时间。'), range(21, 40)),
      l3: con05Level('l3', 'Sustain Hybrid Output', 150, 20, 'kb-rdl', '壶铃 RDL', { reps: 10 }, 30, 3, range(60, 75), range(7, 8), progression(['volume', 'density', 'output'], '3 rounds 是 Standard Prescription；第 4 轮只有在 Output Stability、Recovery、Technique 和 Session Time 全部允许时才使用。'), range(23, 44), roundPolicyL3, 'The fourth round is a legal count range, not an optional exercise; use it only when output stability, recovery, technique and session time all permit.'),
      l4: con05Level('l4', 'High Hybrid Repeatability', 150, range(20, 25), 'kb-rdl', '壶铃 RDL', { reps: 8 }, 30, 4, range(75, 90), range(8, 9), progression(['load', 'output', 'density'], '提高可保持重复速度的中高负荷与整体输出；不设 RIR 或局部力竭目标。'), range(26, 48), undefined, 'Use a medium-high KB RDL load that preserves repeatable speed; no grinding, no RIR target and no local failure objective.'),
    },
  },
]
