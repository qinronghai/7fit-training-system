import type {
  AlternativeExercise,
  Count,
  ExerciseKey,
  ExercisePrescription,
  Laterality,
  PrepItem,
  PrepPhase,
  ProgramLevel,
  ProgrammingTemplate,
  ProgrammingTemplateLevel,
  ProgressionEvidence,
  ProgressionVariable,
  RampUpSet,
  SelectableExerciseOption,
  SelectableExerciseSlot,
  TrainingBlock,
  TrainingBlockEntry,
  TrainingExercise,
} from './types'

const COACH_NOTE = '以动作质量和可重复训练刺激为先；RIR 与动作技术能力分开管理，教练按当日状态调整负荷。'

const prep = (
  exerciseKey: ExerciseKey,
  displayName: string,
  phase: PrepPhase,
  prescription: ExercisePrescription,
  reason: string,
  laterality?: Laterality,
): PrepItem => ({
  exerciseKey,
  displayName,
  phase,
  prescription,
  reason,
  ...(laterality ? { laterality } : {}),
})

const ramp = (
  exerciseKey: ExerciseKey,
  displayName: string,
  order: number,
  reps: Count,
  loadGuidance: string,
  restSeconds: Count,
): RampUpSet => ({
  exerciseKey,
  displayName,
  order,
  reps,
  loadGuidance,
  restSeconds,
  targetRole: 'PRIMARY',
})

const exercise = (value: TrainingExercise): TrainingExercise => value

const alternative = (
  value: AlternativeExercise,
): AlternativeExercise => value

const strengthBlock = (
  exercises: TrainingBlockEntry[],
  restBetweenSetsSeconds: Count,
): TrainingBlock => ({
  id: 'strength',
  kind: 'strength',
  label: 'Strength / Volume',
  exercises,
  restBetweenSetsSeconds,
})

const progression = (
  variables: ProgressionVariable[],
  note: string,
): ProgressionEvidence => ({ variables, note })

const level = (
  programLevel: ProgramLevel,
  primaryGoal: string,
  prepItems: PrepItem[],
  rampUp: RampUpSet[],
  blocks: TrainingBlock[],
  estimatedMinutes: { min: number; max: number },
  targetMuscleSetEstimate: Record<string, Count>,
  progressionFromPrevious?: ProgressionEvidence,
): ProgrammingTemplateLevel => ({
  programLevel,
  primaryGoal,
  prep: prepItems,
  rampUp,
  blocks,
  estimatedMinutes,
  targetMuscleSetEstimate,
  ...(progressionFromPrevious ? { progressionFromPrevious } : {}),
  coachNote: COACH_NOTE,
})

const template = (
  id: string,
  code: string,
  name: string,
  description: string,
  levels: Record<ProgramLevel, ProgrammingTemplateLevel>,
): ProgrammingTemplate => ({
  id,
  code,
  system: 'body',
  name,
  description,
  levels,
})

const lowerPrep = (): PrepItem[] => [
  prep('rower-easy', '划船机轻划', 'R', { durationSeconds: 90 }, '提高体温并建立连续呼吸。'),
  prep('ankle-dorsiflexion-rock', '跪姿踝背屈前移', 'M', { reps: 6 }, '准备深蹲和下肢活动范围。', 'unilateral'),
  prep('band-lateral-walk', '迷你带侧向走', 'A', { reps: 8 }, '激活髋外侧并建立骨盆控制。', 'unilateral'),
]

const pullPrep = (): PrepItem[] => [
  prep('ski-erg-easy', '滑雪机轻拉', 'R', { durationSeconds: 90 }, '提高体温并建立上肢节律。'),
  prep('quadruped-t-spine-rotation', '四点跪姿胸椎旋转', 'M', { reps: 6 }, '准备胸椎活动和肩胛运动。', 'unilateral'),
  prep('band-pull-apart', '弹力带拉开', 'A', { reps: 12 }, '激活肩胛后缩与后束。'),
]

const pushPrep = (): PrepItem[] => [
  prep('ski-erg-easy', '滑雪机轻拉', 'R', { durationSeconds: 90 }, '提高体温并建立上肢节律。'),
  prep('quadruped-t-spine-rotation', '四点跪姿胸椎旋转', 'M', { reps: 6 }, '准备胸椎活动和肩带位置。', 'unilateral'),
  prep('band-external-rotation', '弹力带外旋', 'A', { reps: 10 }, '激活肩袖并准备推类动作。'),
]

const fullBodyPrep = (): PrepItem[] => [
  prep('rower-easy', '划船机轻划', 'R', { durationSeconds: 90 }, '提高体温并建立连续呼吸。'),
  prep('ankle-dorsiflexion-rock', '跪姿踝背屈前移', 'M', { reps: 6 }, '准备下肢活动范围。', 'unilateral'),
  prep('band-pull-apart', '弹力带拉开', 'A', { reps: 12 }, '准备肩胛控制和上肢拉类。'),
]

const armCondition = {
  maxTotalWorkingSets: 16,
  maxCalculatedSessionMinutes: 60,
  coachCondition: 'readiness-permits' as const,
  coachNote: '只有在总工作组和时间预算仍合规，且会员当日恢复状态允许时，才加入互补手臂动作。',
}

const armOption = (
  exerciseKey: ExerciseKey,
  displayName: string,
  rolePattern: 'hpull' | 'hpush',
): SelectableExerciseOption => ({
  exerciseKey,
  displayName,
  role: 'ACCESSORY',
  movementPattern: rolePattern,
  laterality: 'bilateral',
  fatigueRisk: 'low',
  prescription: { sets: 2, reps: { min: 10, max: 15 }, rir: 2 },
})

const armSlot = (): SelectableExerciseSlot => ({
  kind: 'selectable',
  id: 'body05-arm',
  required: true,
  selectCount: 1,
  defaultOptionKey: 'dumbbell-curl',
  options: [
    armOption('dumbbell-curl', '哑铃弯举', 'hpull'),
    armOption('rope-triceps-pressdown', '绳索三头下压', 'hpush'),
  ],
  allowComplementaryOption: true,
  complementaryCondition: armCondition,
  coachNote: '第 5 槽必须二选一；互补项是独立的可选第 6 个 ACCESSORY。',
})

const body01L1 = level(
  'l1',
  '建立深蹲模式与臀腿基础训练容量',
  lowerPrep(),
  [ramp('box-squat', '徒手箱式深蹲', 1, 8, '徒手或极轻负荷，确认深度和支撑。', 30)],
  [strengthBlock([
    exercise({ exerciseKey: 'box-squat', displayName: '箱式深蹲', role: 'PRIMARY', movementPattern: 'squat', laterality: 'bilateral', fatigueRisk: 'moderate', prescription: { sets: 3, reps: { min: 10, max: 12 }, rir: { min: 3, max: 4 } } }),
    exercise({ exerciseKey: 'floor-glute-bridge', displayName: '地面臀桥', role: 'SECONDARY', movementPattern: 'hip', laterality: 'bilateral', fatigueRisk: 'low', prescription: { sets: 3, reps: { min: 12, max: 15 }, rir: { min: 3, max: 4 } } }),
    exercise({ exerciseKey: 'supported-split-squat', displayName: '扶持分腿蹲', role: 'UNILATERAL', movementPattern: 'single', laterality: 'unilateral', fatigueRisk: 'moderate', prescription: { sets: 2, reps: { min: 8, max: 10 }, rir: { min: 3, max: 4 } } }),
    exercise({ exerciseKey: 'leg-extension', displayName: '腿屈伸', role: 'ACCESSORY', movementPattern: 'squat', laterality: 'bilateral', fatigueRisk: 'low', prescription: { sets: 2, reps: { min: 12, max: 15 }, rir: 3 } }),
    exercise({ exerciseKey: 'hip-abduction', displayName: '髋外展', role: 'ACCESSORY', movementPattern: 'hip', laterality: 'bilateral', fatigueRisk: 'low', prescription: { sets: 2, reps: { min: 15, max: 20 }, rir: 3 } }),
  ], 90)],
  { min: 30, max: 44 },
  { gluteus: 8, quadriceps: 5, hamstrings: 2, hipAbductors: 2 },
)

const body01L2 = level(
  'l2',
  '在稳定深蹲基础上提高臀腿负荷与训练量',
  lowerPrep(),
  [
    ramp('goblet-squat', '轻重量高脚杯深蹲', 1, 8, '轻负荷，建立腹压和深度。', 30),
    ramp('goblet-squat', '中轻重量高脚杯深蹲', 2, 5, '逐步接近工作负荷，保持节奏。', 45),
  ],
  [strengthBlock([
    exercise({ exerciseKey: 'goblet-squat', displayName: '高脚杯深蹲', role: 'PRIMARY', movementPattern: 'squat', laterality: 'bilateral', fatigueRisk: 'moderate', prescription: { sets: 4, reps: { min: 8, max: 12 }, rir: { min: 2, max: 3 } } }),
    exercise({ exerciseKey: 'hip-thrust', displayName: '标准臀推', role: 'SECONDARY', movementPattern: 'hip', laterality: 'bilateral', fatigueRisk: 'moderate', prescription: { sets: 3, reps: { min: 8, max: 12 }, rir: { min: 2, max: 3 } } }),
    exercise({ exerciseKey: 'reverse-lunge', displayName: '反向箭步蹲', role: 'UNILATERAL', movementPattern: 'single', laterality: 'unilateral', fatigueRisk: 'moderate', prescription: { sets: 3, reps: { min: 8, max: 10 }, rir: 2 } }),
    exercise({ exerciseKey: 'leg-extension', displayName: '腿屈伸', role: 'ACCESSORY', movementPattern: 'squat', laterality: 'bilateral', fatigueRisk: 'low', prescription: { sets: 2, reps: { min: 12, max: 15 }, rir: 2 } }),
    exercise({ exerciseKey: 'hip-abduction', displayName: '髋外展', role: 'ACCESSORY', movementPattern: 'hip', laterality: 'bilateral', fatigueRisk: 'low', prescription: { sets: 2, reps: { min: 15, max: 20 }, rir: 2 } }),
  ], 90)],
  { min: 34, max: 47 },
  { gluteus: 9, quadriceps: 8, hamstrings: 2, hipAbductors: 2 },
  progression(['load', 'volume', 'rir'], '提高深蹲和臀推负荷，并增加稳定的下肢工作组。'),
)

const body01L3 = level(
  'l3',
  '以稳定器械提供更高下肢机械张力',
  lowerPrep(),
  [
    ramp('hack-squat', '轻重量哈克深蹲', 1, 6, '轻负荷确认轨迹和深度。', 45),
    ramp('hack-squat', '中轻重量哈克深蹲', 2, 4, '逐步接近工作负荷。', 60),
  ],
  [strengthBlock([
    exercise({ exerciseKey: 'hack-squat', displayName: '哈克深蹲', role: 'PRIMARY', movementPattern: 'squat', laterality: 'bilateral', fatigueRisk: 'high', prescription: { sets: 4, reps: { min: 8, max: 10 }, rir: { min: 2, max: 3 } } }),
    exercise({ exerciseKey: 'hip-thrust', displayName: '标准臀推', role: 'SECONDARY', movementPattern: 'hip', laterality: 'bilateral', fatigueRisk: 'moderate', prescription: { sets: 3, reps: { min: 8, max: 12 }, rir: 2 } }),
    exercise({ exerciseKey: 'supported-reverse-lunge', displayName: '扶持反向箭步', role: 'UNILATERAL', movementPattern: 'single', laterality: 'unilateral', fatigueRisk: 'moderate', prescription: { sets: 2, reps: { min: 8, max: 10 }, rir: 2 } }),
    exercise({ exerciseKey: 'leg-extension', displayName: '腿屈伸', role: 'ACCESSORY', movementPattern: 'squat', laterality: 'bilateral', fatigueRisk: 'low', prescription: { sets: 2, reps: { min: 10, max: 15 }, rir: 2 } }),
    exercise({ exerciseKey: 'hip-abduction', displayName: '髋外展', role: 'ACCESSORY', movementPattern: 'hip', laterality: 'bilateral', fatigueRisk: 'low', prescription: { sets: 2, reps: { min: 15, max: 20 }, rir: 2 } }),
  ], 120)],
  { min: 39, max: 52 },
  { gluteus: 9, quadriceps: 8, hamstrings: 2, hipAbductors: 2 },
  progression(['load', 'rir', 'control'], '由自由负重学习转为稳定器械高张力，保持工作组可恢复。'),
)

const body01L4 = level(
  'l4',
  '在稳定深蹲刺激上使用高负荷工作组',
  lowerPrep(),
  [
    ramp('heavy-hack-squat', '轻重量哈克深蹲', 1, 6, '轻负荷确认轨迹和深度。', 60),
    ramp('heavy-hack-squat', '中轻重量哈克深蹲', 2, 4, '逐步接近高负荷工作重量。', 90),
  ],
  [strengthBlock([
    exercise({
      exerciseKey: 'heavy-hack-squat',
      displayName: '大负荷哈克深蹲',
      role: 'PRIMARY',
      movementPattern: 'squat',
      laterality: 'bilateral',
      fatigueRisk: 'high',
      prescription: { sets: 4, reps: { min: 5, max: 7 }, rir: { min: 1, max: 2 } },
      alternatives: [alternative({
        exerciseKey: 'barbell-squat',
        displayName: '杠铃深蹲',
        reason: 'skill-track',
        preserves: { primaryGoal: true, movementPattern: true, stimulus: false },
        eligibility: { requiresTechniqueCompetency: true },
        coachNote: '仅在会员具备稳定杠铃深蹲技术时使用；这不是由 L4 自动触发的动作升级。',
      })],
    }),
    exercise({ exerciseKey: 'heavy-hip-thrust', displayName: '大负荷臀推', role: 'SECONDARY', movementPattern: 'hip', laterality: 'bilateral', fatigueRisk: 'high', prescription: { sets: 3, reps: { min: 6, max: 10 }, rir: { min: 1, max: 2 } } }),
    exercise({ exerciseKey: 'supported-reverse-lunge', displayName: '扶持反向箭步', role: 'UNILATERAL', movementPattern: 'single', laterality: 'unilateral', fatigueRisk: 'moderate', prescription: { sets: 2, reps: { min: 8, max: 10 }, rir: 2 } }),
    exercise({ exerciseKey: 'leg-extension', displayName: '腿屈伸', role: 'ACCESSORY', movementPattern: 'squat', laterality: 'bilateral', fatigueRisk: 'low', prescription: { sets: 2, reps: { min: 10, max: 15 }, rir: 2 } }),
    exercise({ exerciseKey: 'hip-abduction', displayName: '髋外展', role: 'ACCESSORY', movementPattern: 'hip', laterality: 'bilateral', fatigueRisk: 'low', prescription: { sets: 2, reps: { min: 15, max: 20 }, rir: 2 } }),
  ], 150)],
  { min: 42, max: 54 },
  { gluteus: 9, quadriceps: 8, hamstrings: 2, hipAbductors: 2 },
  progression(['load', 'rir', 'control'], '保持 Heavy Hack Squat 默认刺激；进阶来自负荷与接近力竭程度，不来自动作复杂度。'),
)

const body02L1 = level(
  'l1',
  '建立垂直拉、水平拉与肩胛控制',
  pullPrep(),
  [ramp('lat-pulldown', '轻重量高位下拉', 1, 8, '轻负荷，先建立肩胛下沉。', 30)],
  [strengthBlock([
    exercise({ exerciseKey: 'lat-pulldown', displayName: '高位下拉', role: 'PRIMARY', movementPattern: 'vpull', laterality: 'bilateral', fatigueRisk: 'moderate', prescription: { sets: 3, reps: { min: 10, max: 12 }, rir: { min: 3, max: 4 } } }),
    exercise({ exerciseKey: 'seated-row', displayName: '坐姿划船', role: 'SECONDARY', movementPattern: 'hpull', laterality: 'bilateral', fatigueRisk: 'moderate', prescription: { sets: 3, reps: { min: 10, max: 12 }, rir: { min: 3, max: 4 } } }),
    exercise({ exerciseKey: 'face-pull', displayName: '弹力带面拉', role: 'ACCESSORY', movementPattern: 'hpull', laterality: 'bilateral', fatigueRisk: 'low', prescription: { sets: 2, reps: { min: 12, max: 15 }, rir: 3 } }),
    exercise({ exerciseKey: 'rear-delt-fly', displayName: '后束飞鸟', role: 'ACCESSORY', movementPattern: 'hpush', laterality: 'bilateral', fatigueRisk: 'low', prescription: { sets: 2, reps: { min: 12, max: 15 }, rir: 3 } }),
    exercise({ exerciseKey: 'dumbbell-curl', displayName: '哑铃弯举', role: 'ACCESSORY', movementPattern: 'hpull', laterality: 'bilateral', fatigueRisk: 'low', prescription: { sets: 2, reps: { min: 10, max: 15 }, rir: 3 } }),
  ], 90)],
  { min: 30, max: 44 },
  { lats: 6, upperBack: 5, rearDelts: 4, biceps: 2 },
)

const body02L2 = level(
  'l2',
  '提高拉类负荷并建立基础单侧控制',
  pullPrep(),
  [
    ramp('neutral-grip-lat-pulldown', '轻重量中立握高位下拉', 1, 8, '轻负荷确认肩胛路径。', 30),
    ramp('neutral-grip-lat-pulldown', '中轻重量中立握高位下拉', 2, 5, '接近工作负荷但不牺牲控制。', 45),
  ],
  [strengthBlock([
    exercise({ exerciseKey: 'neutral-grip-lat-pulldown', displayName: '中立握高位下拉', role: 'PRIMARY', movementPattern: 'vpull', laterality: 'bilateral', fatigueRisk: 'moderate', prescription: { sets: 4, reps: { min: 8, max: 12 }, rir: { min: 2, max: 3 } } }),
    exercise({ exerciseKey: 'chest-supported-row', displayName: '胸托划船', role: 'SECONDARY', movementPattern: 'hpull', laterality: 'bilateral', fatigueRisk: 'moderate', prescription: { sets: 3, reps: { min: 8, max: 12 }, rir: 2 } }),
    exercise({ exerciseKey: 'single-arm-cable-row', displayName: '单臂绳索划船', role: 'UNILATERAL', movementPattern: 'hpull', laterality: 'unilateral', fatigueRisk: 'moderate', prescription: { sets: 2, reps: { min: 10, max: 12 }, rir: 2 } }),
    exercise({ exerciseKey: 'rear-delt-fly', displayName: '后束飞鸟', role: 'ACCESSORY', movementPattern: 'hpush', laterality: 'bilateral', fatigueRisk: 'low', prescription: { sets: 2, reps: { min: 12, max: 15 }, rir: 2 } }),
    exercise({ exerciseKey: 'dumbbell-curl', displayName: '哑铃弯举', role: 'ACCESSORY', movementPattern: 'hpull', laterality: 'bilateral', fatigueRisk: 'low', prescription: { sets: 2, reps: { min: 10, max: 12 }, rir: 2 } }),
  ], 90)],
  { min: 34, max: 47 },
  { lats: 8, upperBack: 6, rearDelts: 2, biceps: 2 },
  progression(['load', 'volume', 'control'], '增加垂直拉工作组，并保留一个低复杂度单臂划船作为基础控制变量。'),
)

const body02L3 = level(
  'l3',
  '在较低辅助下提高垂直拉和水平拉机械张力',
  pullPrep(),
  [
    ramp('assisted-pull-up', '高辅助量引体向上', 1, 6, '高辅助量 × 6，建立完整活动范围。', 45),
    ramp('assisted-pull-up', '中辅助量引体向上', 2, 3, '中辅助量 × 3，接近工作辅助量。', 60),
  ],
  [strengthBlock([
    exercise({ exerciseKey: 'assisted-pull-up', displayName: '辅助引体向上', role: 'PRIMARY', movementPattern: 'vpull', laterality: 'bilateral', fatigueRisk: 'high', prescription: { sets: 4, reps: { min: 6, max: 10 }, rir: { min: 1, max: 3 } } }),
    exercise({ exerciseKey: 'chest-supported-row', displayName: '胸托划船', role: 'SECONDARY', movementPattern: 'hpull', laterality: 'bilateral', fatigueRisk: 'moderate', prescription: { sets: 4, reps: { min: 8, max: 10 }, rir: 2 } }),
    exercise({ exerciseKey: 'straight-arm-pulldown', displayName: '直臂下压', role: 'ACCESSORY', movementPattern: 'vpull', laterality: 'bilateral', fatigueRisk: 'low', prescription: { sets: 2, reps: { min: 10, max: 15 }, rir: 2 } }),
    exercise({ exerciseKey: 'rear-delt-fly', displayName: '后束飞鸟', role: 'ACCESSORY', movementPattern: 'hpush', laterality: 'bilateral', fatigueRisk: 'low', prescription: { sets: 2, reps: { min: 12, max: 15 }, rir: 2 } }),
    exercise({ exerciseKey: 'dumbbell-curl', displayName: '哑铃弯举', role: 'ACCESSORY', movementPattern: 'hpull', laterality: 'bilateral', fatigueRisk: 'low', prescription: { sets: 2, reps: { min: 10, max: 12 }, rir: 2 } }),
  ], 120)],
  { min: 39, max: 52 },
  { lats: 10, upperBack: 8, rearDelts: 2, biceps: 2 },
  progression(['load', 'rir', 'control'], '降低辅助量并提高胸托划船输出；不通过增加单侧复杂度表示 L3。'),
)

const body02L4 = level(
  'l4',
  '以低辅助垂直拉和高负荷水平拉完成背部张力训练',
  pullPrep(),
  [
    ramp('low-assistance-pull-up', '高辅助量引体向上', 1, 5, '高辅助量 × 5，先确认轨迹。', 60),
    ramp('low-assistance-pull-up', '中辅助量引体向上', 2, 2, '中辅助量 × 2，接近工作辅助量。', 90),
  ],
  [strengthBlock([
    exercise({ exerciseKey: 'low-assistance-pull-up', displayName: '低辅助引体向上', role: 'PRIMARY', movementPattern: 'vpull', laterality: 'bilateral', fatigueRisk: 'high', prescription: { sets: 4, reps: { min: 5, max: 8 }, rir: { min: 1, max: 2 } } }),
    exercise({ exerciseKey: 'heavy-chest-supported-row', displayName: '大负荷胸托划船', role: 'SECONDARY', movementPattern: 'hpull', laterality: 'bilateral', fatigueRisk: 'high', prescription: { sets: 4, reps: { min: 6, max: 10 }, rir: { min: 1, max: 2 } } }),
    exercise({ exerciseKey: 'cable-pulldown', displayName: '绳索下拉', role: 'ACCESSORY', movementPattern: 'vpull', laterality: 'bilateral', fatigueRisk: 'low', prescription: { sets: 2, reps: { min: 10, max: 15 }, rir: 2 } }),
    exercise({ exerciseKey: 'rear-delt-fly', displayName: '后束飞鸟', role: 'ACCESSORY', movementPattern: 'hpush', laterality: 'bilateral', fatigueRisk: 'low', prescription: { sets: 2, reps: { min: 12, max: 15 }, rir: 2 } }),
    exercise({ exerciseKey: 'incline-dumbbell-curl', displayName: '上斜哑铃弯举', role: 'ACCESSORY', movementPattern: 'hpull', laterality: 'bilateral', fatigueRisk: 'low', prescription: { sets: 2, reps: { min: 8, max: 12 }, rir: 2 } }),
  ], 150)],
  { min: 42, max: 54 },
  { lats: 10, upperBack: 8, rearDelts: 2, biceps: 2 },
  progression(['load', 'rir', 'control'], '辅助量下降、水平拉负荷提高；保持双侧稳定动作，不追加对侧负重单臂划船。'),
)

const body03L1 = level(
  'l1',
  '建立髋铰链、臀部发力和后链基础容量',
  lowerPrep(),
  [ramp('high-kettlebell-deadlift', '高位轻壶铃硬拉', 1, 8, '轻负荷，学习髋铰链和地面距离。', 30)],
  [strengthBlock([
    exercise({ exerciseKey: 'high-kettlebell-deadlift', displayName: '高位壶铃硬拉', role: 'PRIMARY', movementPattern: 'hinge', laterality: 'bilateral', fatigueRisk: 'moderate', prescription: { sets: 3, reps: { min: 10, max: 12 }, rir: { min: 3, max: 4 } } }),
    exercise({ exerciseKey: 'floor-glute-bridge', displayName: '地面臀桥', role: 'SECONDARY', movementPattern: 'hip', laterality: 'bilateral', fatigueRisk: 'low', prescription: { sets: 3, reps: { min: 12, max: 15 }, rir: { min: 3, max: 4 } } }),
    exercise({ exerciseKey: 'leg-curl', displayName: '腿弯举', role: 'ACCESSORY', movementPattern: 'hinge', laterality: 'bilateral', fatigueRisk: 'low', prescription: { sets: 2, reps: { min: 12, max: 15 }, rir: 3 } }),
    exercise({ exerciseKey: 'supported-split-squat', displayName: '扶持分腿蹲', role: 'UNILATERAL', movementPattern: 'single', laterality: 'unilateral', fatigueRisk: 'moderate', prescription: { sets: 2, reps: { min: 8, max: 10 }, rir: 3 } }),
    exercise({ exerciseKey: 'seated-hip-adduction', displayName: '坐姿髋内收', role: 'ACCESSORY', movementPattern: 'adduction', laterality: 'bilateral', fatigueRisk: 'low', prescription: { sets: 2, reps: { min: 12, max: 15 }, rir: 3 } }),
  ], 90)],
  { min: 30, max: 44 },
  { gluteus: 8, hamstrings: 5, quadriceps: 2, hipAdductors: 2 },
)

const body03L2 = level(
  'l2',
  '提高髋铰链和臀推负荷，同时保留髋内收补量',
  lowerPrep(),
  [
    ramp('kettlebell-rdl', '轻壶铃罗马尼亚硬拉', 1, 8, '轻负荷确认髋折叠。', 30),
    ramp('kettlebell-rdl', '中轻壶铃罗马尼亚硬拉', 2, 5, '接近工作负荷，保持脊柱位置。', 45),
  ],
  [strengthBlock([
    exercise({ exerciseKey: 'kettlebell-rdl', displayName: '壶铃罗马尼亚硬拉', role: 'PRIMARY', movementPattern: 'hinge', laterality: 'bilateral', fatigueRisk: 'moderate', prescription: { sets: 4, reps: { min: 8, max: 12 }, rir: { min: 2, max: 3 } } }),
    exercise({ exerciseKey: 'hip-thrust', displayName: '标准臀推', role: 'SECONDARY', movementPattern: 'hip', laterality: 'bilateral', fatigueRisk: 'moderate', prescription: { sets: 3, reps: { min: 8, max: 12 }, rir: 2 } }),
    exercise({ exerciseKey: 'leg-curl', displayName: '腿弯举', role: 'ACCESSORY', movementPattern: 'hinge', laterality: 'bilateral', fatigueRisk: 'low', prescription: { sets: 3, reps: { min: 10, max: 12 }, rir: 2 } }),
    exercise({ exerciseKey: 'reverse-lunge', displayName: '反向箭步蹲', role: 'UNILATERAL', movementPattern: 'single', laterality: 'unilateral', fatigueRisk: 'moderate', prescription: { sets: 2, reps: { min: 8, max: 10 }, rir: 2 } }),
    exercise({ exerciseKey: 'seated-hip-adduction', displayName: '坐姿髋内收', role: 'ACCESSORY', movementPattern: 'adduction', laterality: 'bilateral', fatigueRisk: 'low', prescription: { sets: 2, reps: { min: 12, max: 15 }, rir: 2 } }),
  ], 90)],
  { min: 34, max: 47 },
  { gluteus: 9, hamstrings: 8, quadriceps: 2, hipAdductors: 2 },
  progression(['load', 'volume', 'rir'], '提高髋铰链和腿弯举总量，髋内收保持为独立的直接补量动作。'),
)

const body03L3 = level(
  'l3',
  '在可控高张力下训练臀部与腘绳肌',
  lowerPrep(),
  [
    ramp('dumbbell-rdl', '轻哑铃罗马尼亚硬拉', 1, 6, '轻负荷确认髋铰链。', 45),
    ramp('dumbbell-rdl', '中轻哑铃罗马尼亚硬拉', 2, 4, '逐步接近工作负荷。', 60),
  ],
  [strengthBlock([
    exercise({ exerciseKey: 'dumbbell-rdl', displayName: '哑铃罗马尼亚硬拉', role: 'PRIMARY', movementPattern: 'hinge', laterality: 'bilateral', fatigueRisk: 'high', prescription: { sets: 4, reps: { min: 8, max: 10 }, rir: { min: 1, max: 2 } } }),
    exercise({ exerciseKey: 'overload-hip-thrust', displayName: '超程臀推', role: 'SECONDARY', movementPattern: 'hip', laterality: 'bilateral', fatigueRisk: 'high', prescription: { sets: 3, reps: { min: 8, max: 12 }, rir: { min: 1, max: 2 } } }),
    exercise({ exerciseKey: 'leg-curl', displayName: '腿弯举', role: 'ACCESSORY', movementPattern: 'hinge', laterality: 'bilateral', fatigueRisk: 'moderate', prescription: { sets: 2, reps: { min: 8, max: 12 }, rir: 2 } }),
    exercise({ exerciseKey: 'supported-reverse-lunge', displayName: '扶持反向箭步', role: 'UNILATERAL', movementPattern: 'single', laterality: 'unilateral', fatigueRisk: 'moderate', prescription: { sets: 2, reps: { min: 8, max: 10 }, rir: 2 } }),
    exercise({ exerciseKey: 'hip-abduction', displayName: '髋外展', role: 'ACCESSORY', movementPattern: 'hip', laterality: 'bilateral', fatigueRisk: 'low', prescription: { sets: 2, reps: { min: 15, max: 20 }, rir: 2 } }),
  ], 120)],
  { min: 39, max: 52 },
  { gluteus: 9, hamstrings: 8, quadriceps: 2, hipAbductors: 2 },
  progression(['load', 'rir'], '总工作组收至 13 组；高级性来自哑铃髋铰链张力和 RIR，而不是重复单腿髋铰链。'),
)

const body03L4 = level(
  'l4',
  '以高负荷髋铰链为主建立后链机械张力',
  lowerPrep(),
  [
    ramp('barbell-rdl', '轻杠铃罗马尼亚硬拉', 1, 6, '轻负荷确认髋铰链和杠铃路径。', 60),
    ramp('barbell-rdl', '中轻杠铃罗马尼亚硬拉', 2, 4, '逐步接近高负荷工作重量。', 90),
  ],
  [strengthBlock([
    exercise({ exerciseKey: 'barbell-rdl', displayName: '杠铃罗马尼亚硬拉', role: 'PRIMARY', movementPattern: 'hinge', laterality: 'bilateral', fatigueRisk: 'high', prescription: { sets: 4, reps: { min: 6, max: 8 }, rir: { min: 1, max: 2 } } }),
    exercise({ exerciseKey: 'heavy-overload-hip-thrust', displayName: '大负荷超程臀推', role: 'SECONDARY', movementPattern: 'hip', laterality: 'bilateral', fatigueRisk: 'high', prescription: { sets: 3, reps: { min: 6, max: 10 }, rir: { min: 1, max: 2 } } }),
    exercise({ exerciseKey: 'leg-curl', displayName: '腿弯举', role: 'ACCESSORY', movementPattern: 'hinge', laterality: 'bilateral', fatigueRisk: 'moderate', prescription: { sets: 2, reps: { min: 8, max: 10 }, rir: 2 } }),
    exercise({ exerciseKey: 'supported-reverse-lunge', displayName: '扶持反向箭步', role: 'UNILATERAL', movementPattern: 'single', laterality: 'unilateral', fatigueRisk: 'moderate', prescription: { sets: 2, reps: { min: 8, max: 10 }, rir: 2 } }),
    exercise({ exerciseKey: 'hip-abduction', displayName: '髋外展', role: 'ACCESSORY', movementPattern: 'hip', laterality: 'bilateral', fatigueRisk: 'low', prescription: { sets: 2, reps: { min: 15, max: 20 }, rir: 2 } }),
  ], 150)],
  { min: 42, max: 54 },
  { gluteus: 9, hamstrings: 8, quadriceps: 2, hipAbductors: 2 },
  progression(['load', 'rir'], '总工作组保持 13 组；高等级由杠铃髋铰链负荷和 RIR 表示，不再增加重复后链动作。'),
)

const body04L1 = level(
  'l1',
  '建立水平推、垂直推和肩胛控制',
  pushPrep(),
  [ramp('machine-chest-press', '轻重量器械胸推', 1, 8, '轻负荷，确认肩胛稳定和推程。', 30)],
  [strengthBlock([
    exercise({ exerciseKey: 'machine-chest-press', displayName: '器械胸推', role: 'PRIMARY', movementPattern: 'hpush', laterality: 'bilateral', fatigueRisk: 'moderate', prescription: { sets: 3, reps: { min: 10, max: 12 }, rir: { min: 3, max: 4 } } }),
    exercise({ exerciseKey: 'seated-dumbbell-shoulder-press', displayName: '坐姿哑铃肩推', role: 'SECONDARY', movementPattern: 'vpush', laterality: 'bilateral', fatigueRisk: 'moderate', prescription: { sets: 3, reps: { min: 10, max: 12 }, rir: { min: 3, max: 4 } } }),
    exercise({ exerciseKey: 'incline-push-up', displayName: '高位俯卧撑', role: 'ACCESSORY', movementPattern: 'hpush', laterality: 'bilateral', fatigueRisk: 'low', prescription: { sets: 2, reps: { min: 8, max: 12 }, rir: 3 } }),
    exercise({ exerciseKey: 'lateral-raise', displayName: '侧平举', role: 'ACCESSORY', movementPattern: 'vpush', laterality: 'bilateral', fatigueRisk: 'low', prescription: { sets: 2, reps: { min: 12, max: 15 }, rir: 3 } }),
    exercise({ exerciseKey: 'rope-triceps-pressdown', displayName: '绳索三头下压', role: 'ACCESSORY', movementPattern: 'hpush', laterality: 'bilateral', fatigueRisk: 'low', prescription: { sets: 2, reps: { min: 12, max: 15 }, rir: 3 } }),
  ], 90)],
  { min: 30, max: 44 },
  { chest: 7, frontDelts: 4, lateralDelts: 2, triceps: 2 },
)

const body04L2 = level(
  'l2',
  '在稳定推类动作中提高胸肩负荷和训练量',
  pushPrep(),
  [
    ramp('dumbbell-bench-press', '轻哑铃卧推', 1, 8, '轻负荷确认肩胛位置。', 30),
    ramp('dumbbell-bench-press', '中轻哑铃卧推', 2, 5, '接近工作负荷，保持对称推举。', 45),
  ],
  [strengthBlock([
    exercise({ exerciseKey: 'dumbbell-bench-press', displayName: '哑铃卧推', role: 'PRIMARY', movementPattern: 'hpush', laterality: 'bilateral', fatigueRisk: 'moderate', prescription: { sets: 4, reps: { min: 8, max: 12 }, rir: { min: 2, max: 3 } } }),
    exercise({ exerciseKey: 'seated-dumbbell-shoulder-press', displayName: '坐姿哑铃肩推', role: 'SECONDARY', movementPattern: 'vpush', laterality: 'bilateral', fatigueRisk: 'moderate', prescription: { sets: 3, reps: { min: 8, max: 10 }, rir: 2 } }),
    exercise({ exerciseKey: 'cable-fly', displayName: '绳索夹胸', role: 'ACCESSORY', movementPattern: 'hpush', laterality: 'bilateral', fatigueRisk: 'low', prescription: { sets: 2, reps: { min: 10, max: 15 }, rir: 2 } }),
    exercise({ exerciseKey: 'lateral-raise', displayName: '侧平举', role: 'ACCESSORY', movementPattern: 'vpush', laterality: 'bilateral', fatigueRisk: 'low', prescription: { sets: 2, reps: { min: 12, max: 15 }, rir: 2 } }),
    exercise({ exerciseKey: 'rope-triceps-pressdown', displayName: '绳索三头下压', role: 'ACCESSORY', movementPattern: 'hpush', laterality: 'bilateral', fatigueRisk: 'low', prescription: { sets: 2, reps: { min: 10, max: 15 }, rir: 2 } }),
  ], 90)],
  { min: 34, max: 47 },
  { chest: 9, frontDelts: 5, lateralDelts: 2, triceps: 2 },
  progression(['load', 'volume', 'rir'], '提高哑铃卧推工作组并以胸部孤立动作补量，不增加第三个复合推。'),
)

const body04L3 = level(
  'l3',
  '提高上胸机械张力并保持稳定肩部控制',
  pushPrep(),
  [
    ramp('incline-dumbbell-press', '轻哑铃上斜卧推', 1, 6, '轻负荷确认上胸角度和肩胛位置。', 45),
    ramp('incline-dumbbell-press', '中轻哑铃上斜卧推', 2, 4, '逐步接近工作负荷。', 60),
  ],
  [strengthBlock([
    exercise({ exerciseKey: 'incline-dumbbell-press', displayName: '上斜哑铃卧推', role: 'PRIMARY', movementPattern: 'hpush', laterality: 'bilateral', fatigueRisk: 'high', prescription: { sets: 4, reps: { min: 6, max: 8 }, rir: { min: 1, max: 2 } } }),
    exercise({ exerciseKey: 'seated-dumbbell-shoulder-press', displayName: '坐姿哑铃肩推', role: 'SECONDARY', movementPattern: 'vpush', laterality: 'bilateral', fatigueRisk: 'moderate', prescription: { sets: 3, reps: { min: 6, max: 8 }, rir: 2 } }),
    exercise({ exerciseKey: 'cable-fly', displayName: '绳索夹胸', role: 'ACCESSORY', movementPattern: 'hpush', laterality: 'bilateral', fatigueRisk: 'low', prescription: { sets: 2, reps: { min: 10, max: 15 }, rir: 2 } }),
    exercise({ exerciseKey: 'lateral-raise', displayName: '侧平举', role: 'ACCESSORY', movementPattern: 'vpush', laterality: 'bilateral', fatigueRisk: 'low', prescription: { sets: 2, reps: { min: 12, max: 15 }, rir: 2 } }),
    exercise({ exerciseKey: 'rope-triceps-pressdown', displayName: '绳索三头下压', role: 'ACCESSORY', movementPattern: 'hpush', laterality: 'bilateral', fatigueRisk: 'low', prescription: { sets: 2, reps: { min: 10, max: 15 }, rir: 2 } }),
  ], 120)],
  { min: 39, max: 52 },
  { chest: 9, frontDelts: 5, lateralDelts: 2, triceps: 2 },
  progression(['load', 'rir', 'control'], '默认上斜哑铃卧推与坐姿肩推保持稳定，不用半跪或单臂稳定性制造等级差异。'),
)

const body04L4 = level(
  'l4',
  '以高负荷水平推完成胸部机械张力训练',
  pushPrep(),
  [
    ramp('barbell-bench-press', '空杠卧推', 1, 6, '空杠确认肩胛和杠铃路径。', 60),
    ramp('barbell-bench-press', '中轻重量杠铃卧推', 2, 4, '逐步接近高负荷工作重量。', 90),
  ],
  [strengthBlock([
    exercise({ exerciseKey: 'barbell-bench-press', displayName: '杠铃卧推', role: 'PRIMARY', movementPattern: 'hpush', laterality: 'bilateral', fatigueRisk: 'high', prescription: { sets: 4, reps: { min: 5, max: 7 }, rir: { min: 1, max: 2 } } }),
    exercise({ exerciseKey: 'seated-dumbbell-shoulder-press', displayName: '坐姿哑铃肩推', role: 'SECONDARY', movementPattern: 'vpush', laterality: 'bilateral', fatigueRisk: 'moderate', prescription: { sets: 3, reps: { min: 6, max: 8 }, rir: { min: 1, max: 2 } } }),
    exercise({ exerciseKey: 'cable-fly', displayName: '绳索夹胸', role: 'ACCESSORY', movementPattern: 'hpush', laterality: 'bilateral', fatigueRisk: 'low', prescription: { sets: 2, reps: { min: 10, max: 15 }, rir: 2 } }),
    exercise({ exerciseKey: 'lateral-raise', displayName: '侧平举', role: 'ACCESSORY', movementPattern: 'vpush', laterality: 'bilateral', fatigueRisk: 'low', prescription: { sets: 2, reps: { min: 12, max: 15 }, rir: 2 } }),
    exercise({ exerciseKey: 'rope-triceps-pressdown', displayName: '绳索三头下压', role: 'ACCESSORY', movementPattern: 'hpush', laterality: 'bilateral', fatigueRisk: 'low', prescription: { sets: 2, reps: { min: 8, max: 12 }, rir: 2 } }),
  ], 150)],
  { min: 42, max: 54 },
  { chest: 9, frontDelts: 5, lateralDelts: 2, triceps: 2 },
  progression(['load', 'rir'], '高等级来自杠铃卧推负荷与 RIR 控制；第三项保持胸部孤立，不返回复合胸推堆积。'),
)

const body05Level = (
  programLevel: ProgramLevel,
  primaryGoal: string,
  primary: TrainingExercise,
  secondary: TrainingExercise,
  unilateral: TrainingExercise,
  shoulder: TrainingExercise,
  prepItems: PrepItem[],
  rampUp: RampUpSet[],
  estimatedMinutes: { min: number; max: number },
  targetMuscleSetEstimate: Record<string, Count>,
  progressionFromPrevious?: ProgressionEvidence,
): ProgrammingTemplateLevel => level(
  programLevel,
  primaryGoal,
  prepItems,
  rampUp,
  [strengthBlock([primary, secondary, unilateral, shoulder, armSlot()], programLevel === 'l1' ? 90 : programLevel === 'l2' ? 90 : programLevel === 'l3' ? 120 : 150)],
  estimatedMinutes,
  targetMuscleSetEstimate,
  progressionFromPrevious,
)

const body05L1 = body05Level(
  'l1',
  '建立臀部主导的全身线条训练基础',
  exercise({ exerciseKey: 'floor-glute-bridge', displayName: '地面臀桥', role: 'PRIMARY', movementPattern: 'hip', laterality: 'bilateral', fatigueRisk: 'low', prescription: { sets: 3, reps: { min: 12, max: 15 }, rir: { min: 3, max: 4 } } }),
  exercise({ exerciseKey: 'lat-pulldown', displayName: '高位下拉', role: 'SECONDARY', movementPattern: 'vpull', laterality: 'bilateral', fatigueRisk: 'moderate', prescription: { sets: 3, reps: { min: 10, max: 12 }, rir: { min: 3, max: 4 } } }),
  exercise({ exerciseKey: 'low-box-step-up', displayName: '低箱台阶上步', role: 'UNILATERAL', movementPattern: 'single', laterality: 'unilateral', fatigueRisk: 'moderate', prescription: { sets: 2, reps: { min: 8, max: 10 }, rir: 3 } }),
  exercise({ exerciseKey: 'lateral-raise', displayName: '侧平举', role: 'ACCESSORY', movementPattern: 'vpush', laterality: 'bilateral', fatigueRisk: 'low', prescription: { sets: 2, reps: { min: 12, max: 15 }, rir: 3 } }),
  fullBodyPrep(),
  [ramp('floor-glute-bridge', '徒手臀桥', 1, 10, '徒手，确认臀部发力而非腰部代偿。', 30)],
  { min: 30, max: 44 },
  { gluteus: 8, upperBack: 4, quadriceps: 2, lateralDelts: 2, biceps: 2, triceps: 2 },
)

const body05L2 = body05Level(
  'l2',
  '在臀部主导下提高全身训练量与动作稳定性',
  exercise({ exerciseKey: 'hip-thrust', displayName: '标准臀推', role: 'PRIMARY', movementPattern: 'hip', laterality: 'bilateral', fatigueRisk: 'moderate', prescription: { sets: 4, reps: { min: 8, max: 12 }, rir: { min: 2, max: 3 } } }),
  exercise({ exerciseKey: 'chest-supported-row', displayName: '胸托划船', role: 'SECONDARY', movementPattern: 'hpull', laterality: 'bilateral', fatigueRisk: 'moderate', prescription: { sets: 3, reps: { min: 8, max: 12 }, rir: 2 } }),
  exercise({ exerciseKey: 'reverse-lunge', displayName: '反向箭步蹲', role: 'UNILATERAL', movementPattern: 'single', laterality: 'unilateral', fatigueRisk: 'moderate', prescription: { sets: 3, reps: { min: 8, max: 10 }, rir: 2 } }),
  exercise({ exerciseKey: 'lateral-raise', displayName: '侧平举', role: 'ACCESSORY', movementPattern: 'vpush', laterality: 'bilateral', fatigueRisk: 'low', prescription: { sets: 2, reps: { min: 12, max: 15 }, rir: 2 } }),
  lowerPrep(),
  [ramp('hip-thrust', '轻重量臀推', 1, 8, '轻负荷确认髋伸展位置。', 30), ramp('hip-thrust', '中轻重量臀推', 2, 5, '接近工作负荷并保持骨盆控制。', 45)],
  { min: 34, max: 47 },
  { gluteus: 10, upperBack: 6, quadriceps: 3, lateralDelts: 2, biceps: 2, triceps: 2 },
  progression(['load', 'volume', 'rir'], '臀推和水平拉负荷提高，单腿动作保持为可控的下肢补充。'),
)

const body05L3 = body05Level(
  'l3',
  '以高张力臀部训练为主并保持全身线条平衡',
  exercise({ exerciseKey: 'overload-hip-thrust', displayName: '超程臀推', role: 'PRIMARY', movementPattern: 'hip', laterality: 'bilateral', fatigueRisk: 'high', prescription: { sets: 4, reps: { min: 8, max: 12 }, rir: { min: 1, max: 2 } } }),
  exercise({ exerciseKey: 'assisted-pull-up', displayName: '辅助引体向上', role: 'SECONDARY', movementPattern: 'vpull', laterality: 'bilateral', fatigueRisk: 'high', prescription: { sets: 3, reps: { min: 6, max: 10 }, rir: 2 } }),
  exercise({ exerciseKey: 'bulgarian-split-squat', displayName: '保加利亚分腿蹲', role: 'UNILATERAL', movementPattern: 'single', laterality: 'unilateral', fatigueRisk: 'moderate', prescription: { sets: 2, reps: { min: 8, max: 10 }, rir: 2 } }),
  exercise({ exerciseKey: 'lateral-raise', displayName: '侧平举', role: 'ACCESSORY', movementPattern: 'vpush', laterality: 'bilateral', fatigueRisk: 'low', prescription: { sets: 2, reps: { min: 12, max: 15 }, rir: 2 } }),
  fullBodyPrep(),
  [ramp('overload-hip-thrust', '轻重量超程臀推', 1, 6, '轻负荷确认活动范围。', 45), ramp('overload-hip-thrust', '中轻重量超程臀推', 2, 4, '接近工作负荷。', 60)],
  { min: 39, max: 52 },
  { gluteus: 10, upperBack: 6, quadriceps: 2, lateralDelts: 2, biceps: 2, triceps: 2 },
  progression(['load', 'rir'], '臀部机械张力提高，拉类和单腿动作仍采用稳定、可恢复的默认选择。'),
)

const body05L4 = body05Level(
  'l4',
  '以高负荷臀部刺激为主完成稳定的全身线条训练',
  exercise({ exerciseKey: 'heavy-hip-thrust', displayName: '大负荷臀推', role: 'PRIMARY', movementPattern: 'hip', laterality: 'bilateral', fatigueRisk: 'high', prescription: { sets: 4, reps: { min: 6, max: 10 }, rir: { min: 1, max: 2 } } }),
  exercise({ exerciseKey: 'heavy-chest-supported-row', displayName: '大负荷胸托划船', role: 'SECONDARY', movementPattern: 'hpull', laterality: 'bilateral', fatigueRisk: 'high', prescription: { sets: 4, reps: { min: 6, max: 10 }, rir: { min: 1, max: 2 } } }),
  exercise({ exerciseKey: 'supported-reverse-lunge', displayName: '扶持反向箭步', role: 'UNILATERAL', movementPattern: 'single', laterality: 'unilateral', fatigueRisk: 'moderate', prescription: { sets: 2, reps: { min: 8, max: 10 }, rir: 2 } }),
  exercise({ exerciseKey: 'lateral-raise', displayName: '侧平举', role: 'ACCESSORY', movementPattern: 'vpush', laterality: 'bilateral', fatigueRisk: 'low', prescription: { sets: 2, reps: { min: 12, max: 15 }, rir: 2 } }),
  fullBodyPrep(),
  [ramp('heavy-hip-thrust', '轻重量臀推', 1, 6, '轻负荷确认髋伸展位置。', 60), ramp('heavy-hip-thrust', '中轻重量臀推', 2, 4, '逐步接近高负荷工作重量。', 90)],
  { min: 42, max: 54 },
  { gluteus: 10, upperBack: 8, quadriceps: 2, lateralDelts: 2, biceps: 2, triceps: 2 },
  progression(['load', 'rir'], '高级性来自臀推与胸托划船的张力和 RIR；第五槽仍是可选择的单一 ACCESSORY。'),
)

export const bodyTemplates: readonly ProgrammingTemplate[] = [
  template('body1', 'BODY01', '臀腿 A', '臀部与股四头主导的 Stimulus + Volume 训练。', {
    l1: body01L1,
    l2: body01L2,
    l3: body01L3,
    l4: body01L4,
  }),
  template('body2', 'BODY02', '上肢拉', '背部、后束与二头主导的稳定拉类训练。', {
    l1: body02L1,
    l2: body02L2,
    l3: body02L3,
    l4: body02L4,
  }),
  template('body3', 'BODY03', '臀腿 B', '臀部与腘绳肌主导，并在基础等级保留独立髋内收补量。', {
    l1: body03L1,
    l2: body03L2,
    l3: body03L3,
    l4: body03L4,
  }),
  template('body4', 'BODY04', '上肢推', '胸部、肩部与三头主导的稳定推类训练。', {
    l1: body04L1,
    l2: body04L2,
    l3: body04L3,
    l4: body04L4,
  }),
  template('body5', 'BODY05', '女性线条专项', '臀部主导，配合背部、单腿、肩部和一个可选择手臂槽。', {
    l1: body05L1,
    l2: body05L2,
    l3: body05L3,
    l4: body05L4,
  }),
]
