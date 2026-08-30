import type {
  AlternativeExercise,
  Count,
  ExerciseKey,
  ExercisePrescription,
  ExerciseRole,
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
import { isSelectableExerciseSlot } from './types'

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

const BODY_ROLE_REST_SECONDS: Record<ProgramLevel, Partial<Record<ExerciseRole, Count>>> = {
  l1: {
    PRIMARY: 90,
    SECONDARY: { min: 75, max: 90 },
    UNILATERAL: { min: 60, max: 75 },
    ACCESSORY: { min: 45, max: 60 },
  },
  l2: {
    PRIMARY: { min: 90, max: 120 },
    SECONDARY: 90,
    UNILATERAL: 75,
    ACCESSORY: 60,
  },
  l3: {
    PRIMARY: { min: 120, max: 150 },
    SECONDARY: { min: 90, max: 120 },
    UNILATERAL: { min: 75, max: 90 },
    ACCESSORY: 60,
  },
  l4: {
    PRIMARY: { min: 120, max: 150 },
    SECONDARY: 120,
    UNILATERAL: 90,
    ACCESSORY: { min: 60, max: 75 },
  },
}

const withBodyRoleSpecificRest = (
  programLevel: ProgramLevel,
  blocks: TrainingBlock[],
): TrainingBlock[] => blocks.map((block) => ({
  ...block,
  exercises: block.exercises.map((entry) => {
    if (isSelectableExerciseSlot(entry)) {
      return {
        ...entry,
        options: entry.options.map((option) => ({
          ...option,
          restSeconds: BODY_ROLE_REST_SECONDS[programLevel][option.role],
        })),
      }
    }

    return {
      ...entry,
      restSeconds: BODY_ROLE_REST_SECONDS[programLevel][entry.role],
    }
  }),
}))

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
  blocks: withBodyRoleSpecificRest(programLevel, blocks),
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
  reps: Count,
  rir: Count,
): SelectableExerciseOption => ({
  exerciseKey,
  displayName,
  role: 'ACCESSORY',
  movementPattern: rolePattern,
  laterality: 'bilateral',
  fatigueRisk: 'low',
  prescription: { sets: 2, reps, rir },
})

const armSlot = (programLevel: ProgramLevel): SelectableExerciseSlot => ({
  kind: 'selectable',
  id: 'body05-arm',
  required: true,
  selectCount: 1,
  defaultOptionKey: 'dumbbell-curl',
  options: [
    armOption(
      'dumbbell-curl',
      '哑铃弯举',
      'hpull',
      programLevel === 'l1' || programLevel === 'l2' ? { min: 10, max: 15 } : { min: 8, max: 12 },
      programLevel === 'l1' ? { min: 2, max: 3 } : programLevel === 'l2' ? 2 : { min: 1, max: 2 },
    ),
    armOption(
      'rope-triceps-pressdown',
      '绳索三头下压',
      'hpush',
      programLevel === 'l1' || programLevel === 'l2' ? { min: 10, max: 15 } : { min: 8, max: 12 },
      programLevel === 'l1' ? { min: 2, max: 3 } : programLevel === 'l2' ? 2 : { min: 1, max: 2 },
    ),
  ],
  allowComplementaryOption: true,
  complementaryCondition: armCondition,
  coachNote: '第 5 槽必须二选一；互补项是独立的可选第 6 个 ACCESSORY。',
})

const body01L1 = level(
  'l1',
  '建立膝主导深蹲模式和下肢控制',
  [
    prep('rower-easy', '划船机轻划', 'R', { durationSeconds: 120 }, '提高体温并建立连续呼吸。'),
    prep('ankle-dorsiflexion-rock', '跪姿踝背屈前移', 'M', { reps: 6 }, '准备深蹲所需的踝背屈。', 'unilateral'),
    prep('band-lateral-walk', '迷你带侧向走', 'A', { reps: 8 }, '激活髋外侧并建立骨盆控制。', 'unilateral'),
  ],
  [
    ramp('box-squat', '轻负荷箱式深蹲', 1, 8, '轻负荷，确认深度和支撑。', 30),
    ramp('box-squat', '轻中负荷箱式深蹲', 2, 5, '接近工作负荷，保持可重复动作。', 45),
  ],
  [strengthBlock([
    exercise({ exerciseKey: 'box-squat', displayName: '箱式深蹲', role: 'PRIMARY', movementPattern: 'squat', laterality: 'bilateral', fatigueRisk: 'moderate', prescription: { sets: 3, reps: 8, rir: { min: 3, max: 4 } } }),
    exercise({ exerciseKey: 'floor-glute-bridge', displayName: '地面臀桥', role: 'SECONDARY', movementPattern: 'hip', laterality: 'bilateral', fatigueRisk: 'low', prescription: { sets: 3, reps: 10, rir: 3 } }),
    exercise({ exerciseKey: 'supported-split-squat', displayName: '扶持分腿蹲', role: 'UNILATERAL', movementPattern: 'single', laterality: 'unilateral', fatigueRisk: 'moderate', prescription: { sets: 2, reps: 8, rir: 3 } }),
    exercise({ exerciseKey: 'leg-extension', displayName: '腿屈伸', role: 'ACCESSORY', movementPattern: 'squat', laterality: 'bilateral', fatigueRisk: 'low', prescription: { sets: 2, reps: { min: 10, max: 12 }, rir: { min: 2, max: 3 } } }),
    exercise({ exerciseKey: 'hip-abduction', displayName: '髋外展', role: 'ACCESSORY', movementPattern: 'hip', laterality: 'bilateral', fatigueRisk: 'low', prescription: { sets: 2, reps: { min: 12, max: 15 }, rir: { min: 2, max: 3 } } }),
  ], 90)],
  { min: 48, max: 53 },
  { gluteus: 8, quadriceps: 7, hipAbductors: 2 },
)

const body01L2 = level(
  'l2',
  '增加可控深蹲负荷和基础臀腿训练量',
  [
    prep('rower-easy', '划船机轻划', 'R', { durationSeconds: 120 }, '提高体温并建立连续呼吸。'),
    prep('ankle-dorsiflexion-rock', '跪姿踝背屈前移', 'M', { reps: 6 }, '准备深蹲所需的踝背屈。', 'unilateral'),
    prep('band-lateral-walk', '迷你带侧向走', 'A', { reps: 8 }, '激活髋外侧并建立骨盆控制。', 'unilateral'),
  ],
  [
    ramp('goblet-squat', '轻重量高脚杯深蹲', 1, 8, '轻负荷，建立腹压和深度。', 30),
    ramp('goblet-squat', '中轻重量高脚杯深蹲', 2, 5, '逐步接近工作负荷，保持节奏。', 45),
  ],
  [strengthBlock([
    exercise({ exerciseKey: 'goblet-squat', displayName: '高脚杯深蹲', role: 'PRIMARY', movementPattern: 'squat', laterality: 'bilateral', fatigueRisk: 'moderate', prescription: { sets: 4, reps: 8, rir: { min: 2, max: 3 } } }),
    exercise({ exerciseKey: 'hip-thrust', displayName: '标准臀推', role: 'SECONDARY', movementPattern: 'hip', laterality: 'bilateral', fatigueRisk: 'moderate', prescription: { sets: 3, reps: { min: 8, max: 10 }, rir: { min: 2, max: 3 } } }),
    exercise({ exerciseKey: 'supported-reverse-lunge', displayName: '扶持反向箭步蹲', role: 'UNILATERAL', movementPattern: 'single', laterality: 'unilateral', fatigueRisk: 'moderate', prescription: { sets: 2, reps: 8, rir: { min: 2, max: 3 } } }),
    exercise({ exerciseKey: 'leg-extension', displayName: '腿屈伸', role: 'ACCESSORY', movementPattern: 'squat', laterality: 'bilateral', fatigueRisk: 'low', prescription: { sets: 2, reps: { min: 10, max: 12 }, rir: 2 } }),
    exercise({ exerciseKey: 'hip-abduction', displayName: '髋外展', role: 'ACCESSORY', movementPattern: 'hip', laterality: 'bilateral', fatigueRisk: 'low', prescription: { sets: 2, reps: { min: 12, max: 15 }, rir: 2 } }),
  ], 90)],
  { min: 50, max: 55 },
  { gluteus: 9, quadriceps: 8, hipAbductors: 2 },
  progression(['load', 'volume', 'rir'], '箱式深蹲进阶到高脚杯深蹲，并增加 Primary 1 组；不增加不稳定因素。'),
)

const body01L3 = level(
  'l3',
  '提高稳定器械上的下肢张力和训练量',
  [
    prep('rower-easy', '划船机轻划', 'R', { durationSeconds: { min: 75, max: 90 } }, '提高体温并建立连续呼吸。'),
    prep('ankle-dorsiflexion-rock', '跪姿踝背屈前移', 'M', { reps: 5 }, '准备深蹲所需的踝背屈。', 'unilateral'),
    prep('bodyweight-squat', '自重深蹲', 'P', { reps: 6 }, '排练当天的膝主导深蹲模式。'),
  ],
  [
    ramp('hack-squat', '轻重量哈克深蹲', 1, 8, '轻负荷确认轨迹和深度。', 45),
    ramp('hack-squat', '中轻重量哈克深蹲', 2, 5, '逐步接近工作负荷。', 60),
    ramp('hack-squat', '接近工作负荷哈克深蹲', 3, 3, '确认工作重量下仍能保持动作质量。', 75),
  ],
  [strengthBlock([
    exercise({ exerciseKey: 'hack-squat', displayName: '哈克深蹲', role: 'PRIMARY', movementPattern: 'squat', laterality: 'bilateral', fatigueRisk: 'high', prescription: { sets: 4, reps: { min: 6, max: 8 }, rir: 2 } }),
    exercise({ exerciseKey: 'overload-hip-thrust', displayName: '超程臀推', role: 'SECONDARY', movementPattern: 'hip', laterality: 'bilateral', fatigueRisk: 'moderate', prescription: { sets: 4, reps: 8, rir: 2 } }),
    exercise({ exerciseKey: 'supported-bulgarian-split-squat', displayName: '扶持保加利亚分腿蹲', role: 'UNILATERAL', movementPattern: 'single', laterality: 'unilateral', fatigueRisk: 'moderate', prescription: { sets: 2, reps: 8, rir: 2 } }),
    exercise({ exerciseKey: 'leg-extension', displayName: '腿屈伸', role: 'ACCESSORY', movementPattern: 'squat', laterality: 'bilateral', fatigueRisk: 'low', prescription: { sets: 2, reps: { min: 8, max: 12 }, rir: { min: 1, max: 2 } } }),
    exercise({ exerciseKey: 'hip-abduction', displayName: '髋外展', role: 'ACCESSORY', movementPattern: 'hip', laterality: 'bilateral', fatigueRisk: 'low', prescription: { sets: 2, reps: { min: 12, max: 15 }, rir: { min: 1, max: 2 } } }),
  ], 120)],
  { min: 52, max: 57 },
  { gluteus: 10, quadriceps: 8, hipAbductors: 2 },
  progression(['load', 'volume', 'rir'], '由基础自由重量进阶到稳定器械高张力，并提高训练量；单腿动作仍保持扶持。'),
)

const body01L4 = level(
  'l4',
  '在稳定器械上提供高负荷、可重复的下肢刺激',
  [
    prep('rower-easy', '划船机轻划', 'R', { durationSeconds: { min: 60, max: 90 } }, '提高体温并建立连续呼吸。'),
    prep('ankle-dorsiflexion-rock', '跪姿踝背屈前移', 'M', { reps: 5 }, '准备深蹲所需的踝背屈。', 'unilateral'),
    prep('bodyweight-squat', '自重深蹲', 'P', { reps: 5 }, '排练当天的膝主导深蹲模式。'),
  ],
  [
    ramp('heavy-hack-squat', '轻重量大负荷哈克深蹲', 1, 8, '轻负荷确认轨迹和深度。', 60),
    ramp('heavy-hack-squat', '中轻重量大负荷哈克深蹲', 2, 5, '逐步接近高负荷工作重量。', 90),
    ramp('heavy-hack-squat', '接近工作负荷大负荷哈克深蹲', 3, 3, '确认高负荷下仍能保持动作质量。', 120),
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
    exercise({ exerciseKey: 'heavy-overload-hip-thrust', displayName: '大负荷超程臀推', role: 'SECONDARY', movementPattern: 'hip', laterality: 'bilateral', fatigueRisk: 'high', prescription: { sets: 4, reps: { min: 6, max: 8 }, rir: { min: 1, max: 2 } } }),
    exercise({ exerciseKey: 'supported-front-foot-elevated-split-squat', displayName: '扶持前脚抬高分腿蹲', role: 'UNILATERAL', movementPattern: 'single', laterality: 'unilateral', fatigueRisk: 'moderate', prescription: { sets: 2, reps: { min: 6, max: 8 }, rir: 2 } }),
    exercise({ exerciseKey: 'leg-extension', displayName: '腿屈伸', role: 'ACCESSORY', movementPattern: 'squat', laterality: 'bilateral', fatigueRisk: 'low', prescription: { sets: 2, reps: { min: 8, max: 10 }, rir: { min: 1, max: 2 } } }),
    exercise({ exerciseKey: 'hip-abduction', displayName: '髋外展', role: 'ACCESSORY', movementPattern: 'hip', laterality: 'bilateral', fatigueRisk: 'low', prescription: { sets: 2, reps: { min: 10, max: 15 }, rir: { min: 1, max: 2 } } }),
  ], 150)],
  { min: 54, max: 59 },
  { gluteus: 10, quadriceps: 8, hipAbductors: 2 },
  progression(['load', 'rir', 'control'], '保持 Heavy Hack Squat 默认刺激；进阶来自负荷、RIR 和动作重复质量，不来自动作复杂度。'),
)

const body02L1 = level(
  'l1',
  '建立垂直拉动作和肩胛控制',
  [
    prep('ski-erg-easy', '滑雪机轻拉', 'R', { durationSeconds: 120 }, '提高体温并建立上肢节律。'),
    prep('quadruped-t-spine-rotation', '四点跪姿胸椎 T 旋转', 'M', { reps: 5 }, '准备胸椎活动和肩胛运动。', 'unilateral'),
    prep('band-scapular-depression', '弹力带肩胛下压', 'A', { reps: 10 }, '激活肩胛下沉并准备垂直拉。'),
  ],
  [
    ramp('neutral-grip-lat-pulldown', '轻负荷中立握高位下拉', 1, 8, '轻负荷，先建立肩胛下沉。', 30),
    ramp('neutral-grip-lat-pulldown', '轻中负荷中立握高位下拉', 2, 5, '接近工作负荷，保持肩胛控制。', 45),
  ],
  [strengthBlock([
    exercise({ exerciseKey: 'neutral-grip-lat-pulldown', displayName: '中立握高位下拉', role: 'PRIMARY', movementPattern: 'vpull', laterality: 'bilateral', fatigueRisk: 'moderate', prescription: { sets: 3, reps: { min: 8, max: 10 }, rir: { min: 3, max: 4 } } }),
    exercise({ exerciseKey: 'seated-row', displayName: '坐姿划船', role: 'SECONDARY', movementPattern: 'hpull', laterality: 'bilateral', fatigueRisk: 'moderate', prescription: { sets: 3, reps: { min: 8, max: 10 }, rir: 3 } }),
    exercise({ exerciseKey: 'face-pull', displayName: '弹力带面拉', role: 'ACCESSORY', movementPattern: 'hpull', laterality: 'bilateral', fatigueRisk: 'low', prescription: { sets: 2, reps: { min: 12, max: 15 }, rir: { min: 2, max: 3 } } }),
    exercise({ exerciseKey: 'rear-delt-fly', displayName: '反向飞鸟', role: 'ACCESSORY', movementPattern: 'hpull', laterality: 'bilateral', fatigueRisk: 'low', prescription: { sets: 2, reps: { min: 12, max: 15 }, rir: { min: 2, max: 3 } } }),
    exercise({ exerciseKey: 'dumbbell-curl', displayName: '哑铃弯举', role: 'ACCESSORY', movementPattern: 'hpull', laterality: 'bilateral', fatigueRisk: 'low', prescription: { sets: 2, reps: { min: 10, max: 12 }, rir: { min: 2, max: 3 } } }),
  ], 90)],
  { min: 47, max: 52 },
  { lats: 5, upperBack: 3, rearDelts: 2, biceps: 2 },
)

const body02L2 = level(
  'l2',
  '从高位下拉过渡到辅助引体并建立基础单侧控制',
  [
    prep('ski-erg-easy', '滑雪机轻拉', 'R', { durationSeconds: 90 }, '提高体温并建立上肢节律。'),
    prep('supine-open-book', '仰卧开书', 'M', { reps: 5 }, '准备胸椎旋转和肩带位置。', 'unilateral'),
    prep('face-pull', '面拉', 'A', { reps: 10 }, '激活肩胛后缩与后束。'),
    prep('neutral-grip-lat-pulldown', '轻重量中立握高位下拉', 'P', { reps: 8 }, '排练垂直拉路径。'),
  ],
  [
    ramp('assisted-pull-up', '高辅助量引体向上', 1, 6, '高辅助量 × 6，建立完整活动范围。', 45),
    ramp('assisted-pull-up', '中辅助量引体向上', 2, 4, '中辅助量 × 4，接近工作辅助量。', 60),
  ],
  [strengthBlock([
    exercise({ exerciseKey: 'assisted-pull-up', displayName: '辅助引体向上', role: 'PRIMARY', movementPattern: 'vpull', laterality: 'bilateral', fatigueRisk: 'moderate', prescription: { sets: 4, reps: { min: 6, max: 8 }, rir: { min: 2, max: 3 } } }),
    exercise({ exerciseKey: 'chest-supported-row', displayName: '胸托划船', role: 'SECONDARY', movementPattern: 'hpull', laterality: 'bilateral', fatigueRisk: 'moderate', prescription: { sets: 3, reps: { min: 8, max: 10 }, rir: { min: 2, max: 3 } } }),
    exercise({ exerciseKey: 'single-arm-cable-row', displayName: '单臂绳索划船', role: 'UNILATERAL', movementPattern: 'hpull', laterality: 'unilateral', fatigueRisk: 'moderate', prescription: { sets: 2, reps: { min: 8, max: 10 }, rir: { min: 2, max: 3 } } }),
    exercise({ exerciseKey: 'rear-delt-fly', displayName: '反向飞鸟', role: 'ACCESSORY', movementPattern: 'hpull', laterality: 'bilateral', fatigueRisk: 'low', prescription: { sets: 2, reps: { min: 12, max: 15 }, rir: 2 } }),
    exercise({ exerciseKey: 'dumbbell-curl', displayName: '哑铃弯举', role: 'ACCESSORY', movementPattern: 'hpull', laterality: 'bilateral', fatigueRisk: 'low', prescription: { sets: 2, reps: { min: 10, max: 12 }, rir: 2 } }),
  ], 90)],
  { min: 49, max: 54 },
  { lats: 4, upperBack: 5, rearDelts: 2, biceps: 2 },
  progression(['load', 'volume', 'control'], '由高位下拉进阶到辅助引体，并保留一个低复杂度单臂划船作为基础控制变量。'),
)

const body02L3 = level(
  'l3',
  '在较低辅助下提高垂直拉和水平拉机械张力',
  [
    prep('ski-erg-easy', '滑雪机轻拉', 'R', { durationSeconds: { min: 75, max: 90 } }, '提高体温并建立上肢节律。'),
    prep('chest-t-spine-rotation', '胸椎 T 旋转', 'M', { reps: 5 }, '准备胸椎活动和肩胛运动。', 'unilateral'),
    prep('assisted-scapular-pull-up', '辅助肩胛引体', 'A', { reps: 5 }, '激活肩胛下沉并准备引体。'),
    prep('lat-pulldown', '轻重量高位下拉', 'P', { reps: 6 }, '排练垂直拉路径。'),
  ],
  [
    ramp('assisted-pull-up', '高辅助量引体向上', 1, 6, '高辅助量 × 6，建立完整活动范围。', 45),
    ramp('assisted-pull-up', '中辅助量引体向上', 2, 4, '中辅助量 × 4，接近工作辅助量。', 60),
    ramp('assisted-pull-up', '接近工作辅助量引体向上', 3, 2, '接近工作辅助量 × 2，确认工作重量。', 75),
  ],
  [strengthBlock([
    exercise({ exerciseKey: 'assisted-pull-up', displayName: '辅助引体向上', role: 'PRIMARY', movementPattern: 'vpull', laterality: 'bilateral', fatigueRisk: 'high', prescription: { sets: 4, reps: { min: 5, max: 8 }, rir: 2 } }),
    exercise({ exerciseKey: 'chest-supported-row', displayName: '胸托划船', role: 'SECONDARY', movementPattern: 'hpull', laterality: 'bilateral', fatigueRisk: 'moderate', prescription: { sets: 4, reps: { min: 6, max: 8 }, rir: 2 } }),
    exercise({ exerciseKey: 'straight-arm-pulldown', displayName: '直臂下压', role: 'ACCESSORY', movementPattern: 'vpull', laterality: 'bilateral', fatigueRisk: 'low', prescription: { sets: 2, reps: { min: 10, max: 15 }, rir: { min: 1, max: 2 } } }),
    exercise({ exerciseKey: 'rear-delt-fly', displayName: '反向飞鸟', role: 'ACCESSORY', movementPattern: 'hpull', laterality: 'bilateral', fatigueRisk: 'low', prescription: { sets: 2, reps: { min: 10, max: 15 }, rir: { min: 1, max: 2 } } }),
    exercise({ exerciseKey: 'dumbbell-curl', displayName: '哑铃弯举', role: 'ACCESSORY', movementPattern: 'hpull', laterality: 'bilateral', fatigueRisk: 'low', prescription: { sets: 2, reps: { min: 8, max: 12 }, rir: { min: 1, max: 2 } } }),
  ], 120)],
  { min: 51, max: 56 },
  { lats: 6, upperBack: 4, rearDelts: 2, biceps: 2 },
  progression(['load', 'rir', 'control'], '降低辅助量并提高胸托划船输出；不通过增加单侧复杂度表示 L3。'),
)

const body02L4 = level(
  'l4',
  '以低辅助垂直拉和高负荷水平拉完成背部张力训练',
  [
    prep('ski-erg-easy', '滑雪机轻拉', 'R', { durationSeconds: { min: 60, max: 90 } }, '提高体温并建立上肢节律。'),
    prep('chest-rotation', '胸椎旋转', 'M', { reps: 4 }, '准备胸椎活动和肩带位置。', 'unilateral'),
    prep('assisted-scapular-pull-up', '辅助肩胛引体', 'P', { reps: 5 }, '排练低辅助垂直拉路径。'),
  ],
  [
    ramp('low-assistance-pull-up', '高辅助量引体向上', 1, 5, '高辅助量 × 5，先确认轨迹。', 60),
    ramp('low-assistance-pull-up', '中辅助量引体向上', 2, 3, '中辅助量 × 3，接近工作辅助量。', 90),
    ramp('low-assistance-pull-up', '接近工作辅助量引体向上', 3, 2, '接近工作辅助量 × 2，确认工作重量。', 120),
  ],
  [strengthBlock([
    exercise({ exerciseKey: 'low-assistance-pull-up', displayName: '低辅助引体向上', role: 'PRIMARY', movementPattern: 'vpull', laterality: 'bilateral', fatigueRisk: 'high', prescription: { sets: 4, reps: { min: 4, max: 6 }, rir: { min: 1, max: 2 } } }),
    exercise({ exerciseKey: 'heavy-chest-supported-row', displayName: '大负荷胸托划船', role: 'SECONDARY', movementPattern: 'hpull', laterality: 'bilateral', fatigueRisk: 'high', prescription: { sets: 4, reps: { min: 6, max: 8 }, rir: { min: 1, max: 2 } } }),
    exercise({ exerciseKey: 'cable-pullover', displayName: '绳索上拉', role: 'ACCESSORY', movementPattern: 'vpull', laterality: 'bilateral', fatigueRisk: 'low', prescription: { sets: 2, reps: { min: 10, max: 15 }, rir: { min: 1, max: 2 } } }),
    exercise({ exerciseKey: 'rear-delt-fly', displayName: '反向飞鸟', role: 'ACCESSORY', movementPattern: 'hpull', laterality: 'bilateral', fatigueRisk: 'low', prescription: { sets: 2, reps: { min: 10, max: 15 }, rir: { min: 1, max: 2 } } }),
    exercise({ exerciseKey: 'incline-dumbbell-curl', displayName: '上斜哑铃弯举', role: 'ACCESSORY', movementPattern: 'hpull', laterality: 'bilateral', fatigueRisk: 'low', prescription: { sets: 2, reps: { min: 8, max: 12 }, rir: { min: 1, max: 2 } } }),
  ], 150)],
  { min: 53, max: 58 },
  { lats: 6, upperBack: 4, rearDelts: 2, biceps: 2 },
  progression(['load', 'rir', 'control'], '辅助量下降、水平拉负荷提高；保持双侧稳定动作，不追加对侧负重单臂划船。'),
)

const body03L1 = level(
  'l1',
  '建立髋铰链、臀部发力和后链基础容量',
  [
    prep('rower-easy', '划船机轻划', 'R', { durationSeconds: 120 }, '提高体温并建立连续呼吸。'),
    prep('dynamic-hamstring-sweep', '腘绳肌动态扫腿', 'M', { reps: 5 }, '准备后链活动范围。', 'unilateral'),
    prep('glute-bridge', '臀桥', 'A', { reps: 8 }, '激活臀部并建立髋伸展。'),
    prep('wall-assisted-hip-hinge', '墙辅助髋铰链', 'P', { reps: 8 }, '排练当天的髋铰链模式。'),
  ],
  [
    ramp('high-kettlebell-deadlift', '轻负荷高把位壶铃硬拉', 1, 8, '轻负荷，学习髋铰链和地面距离。', 30),
    ramp('high-kettlebell-deadlift', '轻中负荷高把位壶铃硬拉', 2, 5, '接近工作负荷，保持脊柱位置。', 45),
  ],
  [strengthBlock([
    exercise({ exerciseKey: 'high-kettlebell-deadlift', displayName: '高把位壶铃硬拉', role: 'PRIMARY', movementPattern: 'hinge', laterality: 'bilateral', fatigueRisk: 'moderate', prescription: { sets: 3, reps: 8, rir: { min: 3, max: 4 } } }),
    exercise({ exerciseKey: 'floor-glute-bridge', displayName: '地面臀桥', role: 'SECONDARY', movementPattern: 'hip', laterality: 'bilateral', fatigueRisk: 'low', prescription: { sets: 3, reps: 10, rir: 3 } }),
    exercise({ exerciseKey: 'supported-split-squat', displayName: '扶持分腿蹲', role: 'UNILATERAL', movementPattern: 'single', laterality: 'unilateral', fatigueRisk: 'moderate', prescription: { sets: 2, reps: 8, rir: 3 } }),
    exercise({ exerciseKey: 'seated-leg-curl', displayName: '坐姿腿弯举', role: 'ACCESSORY', movementPattern: 'hinge', laterality: 'bilateral', fatigueRisk: 'low', prescription: { sets: 3, reps: { min: 10, max: 12 }, rir: { min: 2, max: 3 } } }),
    exercise({ exerciseKey: 'seated-hip-adduction', displayName: '坐姿髋内收', role: 'ACCESSORY', movementPattern: 'adduction', laterality: 'bilateral', fatigueRisk: 'low', prescription: { sets: 2, reps: { min: 12, max: 15 }, rir: { min: 2, max: 3 } } }),
  ], 90)],
  { min: 49, max: 54 },
  { gluteus: 8, hamstrings: 6, quadriceps: 2, hipAdductors: 2 },
)

const body03L2 = level(
  'l2',
  '提高髋铰链和臀推负荷，同时保留髋内收补量',
  [
    prep('rower-easy', '划船机轻划', 'R', { durationSeconds: 120 }, '提高体温并建立连续呼吸。'),
    prep('90-90-hip-rotation', '90-90 髋旋转', 'M', { reps: 5 }, '准备髋部活动范围。', 'unilateral'),
    prep('band-glute-bridge', '弹力带臀桥', 'A', { reps: 8 }, '激活臀部并建立髋伸展。'),
    prep('wall-assisted-hip-hinge', '墙辅助髋铰链', 'P', { reps: 6 }, '排练当天的髋铰链模式。'),
  ],
  [
    ramp('kettlebell-rdl', '轻壶铃罗马尼亚硬拉', 1, 8, '轻负荷确认髋折叠。', 30),
    ramp('kettlebell-rdl', '中轻壶铃罗马尼亚硬拉', 2, 5, '接近工作负荷，保持脊柱位置。', 45),
  ],
  [strengthBlock([
    exercise({ exerciseKey: 'kettlebell-rdl', displayName: '壶铃罗马尼亚硬拉', role: 'PRIMARY', movementPattern: 'hinge', laterality: 'bilateral', fatigueRisk: 'moderate', prescription: { sets: 4, reps: 8, rir: { min: 2, max: 3 } } }),
    exercise({ exerciseKey: 'hip-thrust', displayName: '臀推', role: 'SECONDARY', movementPattern: 'hip', laterality: 'bilateral', fatigueRisk: 'moderate', prescription: { sets: 3, reps: { min: 8, max: 10 }, rir: { min: 2, max: 3 } } }),
    exercise({ exerciseKey: 'supported-reverse-lunge', displayName: '扶持反向箭步蹲', role: 'UNILATERAL', movementPattern: 'single', laterality: 'unilateral', fatigueRisk: 'moderate', prescription: { sets: 2, reps: 8, rir: { min: 2, max: 3 } } }),
    exercise({ exerciseKey: 'seated-leg-curl', displayName: '坐姿腿弯举', role: 'ACCESSORY', movementPattern: 'hinge', laterality: 'bilateral', fatigueRisk: 'low', prescription: { sets: 3, reps: { min: 8, max: 12 }, rir: 2 } }),
    exercise({ exerciseKey: 'seated-hip-adduction', displayName: '坐姿髋内收', role: 'ACCESSORY', movementPattern: 'adduction', laterality: 'bilateral', fatigueRisk: 'low', prescription: { sets: 2, reps: { min: 12, max: 15 }, rir: 2 } }),
  ], 90)],
  { min: 51, max: 56 },
  { gluteus: 9, hamstrings: 7, quadriceps: 2, hipAdductors: 2 },
  progression(['load', 'volume', 'rir'], '提高髋铰链和腿弯举总量，髋内收保持为独立的直接补量动作。'),
)

const body03L3 = level(
  'l3',
  '在可控高张力下训练臀部与腘绳肌',
  [
    prep('rower-easy', '划船机轻划', 'R', { durationSeconds: 90 }, '提高体温并建立连续呼吸。'),
    prep('90-90-hip-rotation', '90-90 髋旋转', 'M', { reps: 5 }, '准备髋部活动范围。', 'unilateral'),
    prep('wall-assisted-hip-hinge', '墙辅助髋铰链', 'P', { reps: 6 }, '排练当天的髋铰链模式。'),
  ],
  [
    ramp('double-dumbbell-rdl', '轻负荷双哑铃罗马尼亚硬拉', 1, 8, '轻负荷确认髋铰链。', 45),
    ramp('double-dumbbell-rdl', '中轻负荷双哑铃罗马尼亚硬拉', 2, 5, '逐步接近工作负荷。', 60),
    ramp('double-dumbbell-rdl', '接近工作负荷双哑铃罗马尼亚硬拉', 3, 3, '确认工作重量下仍能保持动作质量。', 75),
  ],
  [strengthBlock([
    exercise({ exerciseKey: 'double-dumbbell-rdl', displayName: '双哑铃罗马尼亚硬拉', role: 'PRIMARY', movementPattern: 'hinge', laterality: 'bilateral', fatigueRisk: 'high', prescription: { sets: 4, reps: { min: 6, max: 8 }, rir: 2 } }),
    exercise({ exerciseKey: 'overload-hip-thrust', displayName: '超程臀推', role: 'SECONDARY', movementPattern: 'hip', laterality: 'bilateral', fatigueRisk: 'high', prescription: { sets: 3, reps: 8, rir: 2 } }),
    exercise({ exerciseKey: 'supported-reverse-lunge', displayName: '扶持反向箭步蹲', role: 'UNILATERAL', movementPattern: 'single', laterality: 'unilateral', fatigueRisk: 'moderate', prescription: { sets: 2, reps: 8, rir: 2 } }),
    exercise({ exerciseKey: 'seated-leg-curl', displayName: '坐姿腿弯举', role: 'ACCESSORY', movementPattern: 'hinge', laterality: 'bilateral', fatigueRisk: 'moderate', prescription: { sets: 2, reps: { min: 8, max: 12 }, rir: { min: 1, max: 2 } } }),
    exercise({ exerciseKey: 'seated-hip-adduction', displayName: '坐姿髋内收', role: 'ACCESSORY', movementPattern: 'adduction', laterality: 'bilateral', fatigueRisk: 'low', prescription: { sets: 2, reps: { min: 12, max: 15 }, rir: { min: 1, max: 2 } } }),
  ], 120)],
  { min: 51, max: 56 },
  { gluteus: 9, hamstrings: 6, quadriceps: 2, hipAdductors: 2 },
  progression(['load', 'rir'], '总工作组收至 13 组；高级性来自哑铃髋铰链张力和 RIR，而不是重复单腿髋铰链。'),
)

const body03L4 = level(
  'l4',
  '以高负荷髋铰链为主建立后链机械张力',
  [
    prep('rower-easy', '划船机轻划', 'R', { durationSeconds: { min: 60, max: 90 } }, '提高体温并建立连续呼吸。'),
    prep('90-90-hip-rotation', '90-90 髋旋转', 'M', { reps: 4 }, '准备髋部活动范围。', 'unilateral'),
    prep('wall-assisted-hip-hinge', '墙辅助髋铰链', 'P', { reps: 5 }, '排练当天的髋铰链模式。'),
  ],
  [
    ramp('barbell-rdl', '空杆或轻负荷杠铃罗马尼亚硬拉', 1, 8, '空杆或轻负荷确认髋铰链和杠铃路径。', 60),
    ramp('barbell-rdl', '轻负荷杠铃罗马尼亚硬拉', 2, 5, '逐步接近高负荷工作重量。', 90),
    ramp('barbell-rdl', '接近工作负荷杠铃罗马尼亚硬拉', 3, 3, '确认高负荷下仍能保持动作质量。', 120),
  ],
  [strengthBlock([
    exercise({ exerciseKey: 'barbell-rdl', displayName: '杠铃罗马尼亚硬拉', role: 'PRIMARY', movementPattern: 'hinge', laterality: 'bilateral', fatigueRisk: 'high', prescription: { sets: 4, reps: { min: 5, max: 6 }, rir: { min: 1, max: 2 } } }),
    exercise({ exerciseKey: 'heavy-overload-hip-thrust', displayName: '大负荷超程臀推', role: 'SECONDARY', movementPattern: 'hip', laterality: 'bilateral', fatigueRisk: 'high', prescription: { sets: 3, reps: { min: 6, max: 8 }, rir: { min: 1, max: 2 } } }),
    exercise({ exerciseKey: 'supported-reverse-lunge', displayName: '扶持反向箭步蹲', role: 'UNILATERAL', movementPattern: 'single', laterality: 'unilateral', fatigueRisk: 'moderate', prescription: { sets: 2, reps: { min: 6, max: 8 }, rir: 2 } }),
    exercise({ exerciseKey: 'seated-leg-curl', displayName: '坐姿腿弯举', role: 'ACCESSORY', movementPattern: 'hinge', laterality: 'bilateral', fatigueRisk: 'moderate', prescription: { sets: 2, reps: { min: 8, max: 10 }, rir: { min: 1, max: 2 } } }),
    exercise({ exerciseKey: 'seated-hip-adduction', displayName: '坐姿髋内收', role: 'ACCESSORY', movementPattern: 'adduction', laterality: 'bilateral', fatigueRisk: 'low', prescription: { sets: 2, reps: { min: 10, max: 15 }, rir: { min: 1, max: 2 } } }),
  ], 150)],
  { min: 53, max: 58 },
  { gluteus: 9, hamstrings: 6, quadriceps: 2, hipAdductors: 2 },
  progression(['load', 'rir'], '总工作组保持 13 组；高等级由杠铃髋铰链负荷和 RIR 表示，不再增加重复后链动作。'),
)

const body04L1 = level(
  'l1',
  '建立水平推基础、肩胛控制和胸肩训练秩序',
  [
    prep('ski-erg-easy', '滑雪机轻拉', 'R', { durationSeconds: 120 }, '提高体温并建立上肢节律。'),
    prep('wall-slide', '墙面滑动', 'M', { reps: 8 }, '准备肩胛上回旋和肩部活动。'),
    prep('scapular-push-up', '肩胛俯卧撑', 'A', { reps: 8 }, '激活肩胛控制并准备推类动作。'),
  ],
  [
    ramp('machine-chest-press', '轻负荷器械胸推', 1, 8, '轻负荷，确认肩胛稳定和推程。', 30),
    ramp('machine-chest-press', '轻中负荷器械胸推', 2, 5, '接近工作负荷，保持推程控制。', 45),
  ],
  [strengthBlock([
    exercise({ exerciseKey: 'machine-chest-press', displayName: '器械胸推', role: 'PRIMARY', movementPattern: 'hpush', laterality: 'bilateral', fatigueRisk: 'moderate', prescription: { sets: 3, reps: { min: 8, max: 10 }, rir: { min: 3, max: 4 } } }),
    exercise({ exerciseKey: 'seated-dumbbell-shoulder-press', displayName: '坐姿哑铃肩推', role: 'SECONDARY', movementPattern: 'vpush', laterality: 'bilateral', fatigueRisk: 'moderate', prescription: { sets: 3, reps: { min: 8, max: 10 }, rir: 3 } }),
    exercise({ exerciseKey: 'incline-push-up', displayName: '高斜度俯卧撑', role: 'ACCESSORY', movementPattern: 'hpush', laterality: 'bilateral', fatigueRisk: 'low', prescription: { sets: 2, reps: { min: 8, max: 12 }, rir: { min: 2, max: 3 } } }),
    exercise({ exerciseKey: 'lateral-raise', displayName: '侧平举', role: 'ACCESSORY', movementPattern: 'vpush', laterality: 'bilateral', fatigueRisk: 'low', prescription: { sets: 2, reps: { min: 12, max: 15 }, rir: { min: 2, max: 3 } } }),
    exercise({ exerciseKey: 'rope-triceps-pressdown', displayName: '绳索三头下压', role: 'ACCESSORY', movementPattern: 'hpush', laterality: 'bilateral', fatigueRisk: 'low', prescription: { sets: 2, reps: { min: 10, max: 15 }, rir: { min: 2, max: 3 } } }),
  ], 90)],
  { min: 47, max: 52 },
  { chest: 5, deltoids: 5, triceps: 2 },
)

const body04L2 = level(
  'l2',
  '提高哑铃卧推负荷，并以胸部孤立动作补充训练量',
  [
    prep('ski-erg-easy', '滑雪机轻拉', 'R', { durationSeconds: { min: 75, max: 90 } }, '提高体温并建立上肢节律。'),
    prep('half-kneeling-t-spine-rotation', '半跪姿胸椎旋转', 'M', { reps: 5 }, '准备胸椎活动和肩带位置。', 'unilateral'),
    prep('band-external-rotation', '弹力带外旋', 'A', { reps: 10 }, '激活肩袖并准备推类动作。'),
  ],
  [
    ramp('dumbbell-bench-press', '轻哑铃卧推', 1, 8, '轻负荷确认肩胛位置。', 30),
    ramp('dumbbell-bench-press', '中轻哑铃卧推', 2, 5, '接近工作负荷，保持对称推举。', 45),
  ],
  [strengthBlock([
    exercise({ exerciseKey: 'dumbbell-bench-press', displayName: '哑铃卧推', role: 'PRIMARY', movementPattern: 'hpush', laterality: 'bilateral', fatigueRisk: 'moderate', prescription: { sets: 4, reps: { min: 6, max: 8 }, rir: { min: 2, max: 3 } } }),
    exercise({ exerciseKey: 'seated-dumbbell-shoulder-press', displayName: '坐姿哑铃肩推', role: 'SECONDARY', movementPattern: 'vpush', laterality: 'bilateral', fatigueRisk: 'moderate', prescription: { sets: 3, reps: { min: 8, max: 10 }, rir: { min: 2, max: 3 } } }),
    exercise({ exerciseKey: 'cable-fly', displayName: '绳索夹胸', role: 'ACCESSORY', movementPattern: 'hpush', laterality: 'bilateral', fatigueRisk: 'low', prescription: { sets: 2, reps: { min: 10, max: 15 }, rir: 2 }, alternatives: [alternative({ exerciseKey: 'pec-deck', displayName: '蝴蝶机夹胸', reason: 'equipment', preserves: { primaryGoal: true, movementPattern: true, stimulus: true }, coachNote: '器械可获得性不足时，独立替代绳索夹胸。' })] }),
    exercise({ exerciseKey: 'lateral-raise', displayName: '侧平举', role: 'ACCESSORY', movementPattern: 'vpush', laterality: 'bilateral', fatigueRisk: 'low', prescription: { sets: 2, reps: { min: 12, max: 15 }, rir: 2 } }),
    exercise({ exerciseKey: 'rope-triceps-pressdown', displayName: '绳索三头下压', role: 'ACCESSORY', movementPattern: 'hpush', laterality: 'bilateral', fatigueRisk: 'low', prescription: { sets: 2, reps: { min: 10, max: 15 }, rir: 2 } }),
  ], 90)],
  { min: 49, max: 54 },
  { chest: 6, deltoids: 5, triceps: 2 },
  progression(['load', 'volume', 'rir'], '提高哑铃卧推工作组并以胸部孤立动作补量，不增加第三个复合推。'),
)

const body04L3 = level(
  'l3',
  '提高上胸机械张力并保持稳定肩部控制',
  [
    prep('ski-erg-easy', '滑雪机轻拉', 'R', { durationSeconds: 75 }, '提高体温并建立上肢节律。'),
    prep('chest-rotation', '胸椎旋转', 'M', { reps: 5 }, '准备胸椎活动和肩带位置。', 'unilateral'),
    prep('scapular-push-up', '肩胛俯卧撑', 'A', { reps: 8 }, '激活肩胛控制并准备推类动作。'),
  ],
  [
    ramp('incline-dumbbell-press', '轻负荷上斜哑铃卧推', 1, 8, '轻负荷确认上胸角度和肩胛位置。', 45),
    ramp('incline-dumbbell-press', '中轻负荷上斜哑铃卧推', 2, 5, '逐步接近工作负荷。', 60),
    ramp('incline-dumbbell-press', '接近工作负荷上斜哑铃卧推', 3, 3, '确认工作重量下仍能保持动作质量。', 75),
  ],
  [strengthBlock([
    exercise({ exerciseKey: 'incline-dumbbell-press', displayName: '上斜哑铃卧推', role: 'PRIMARY', movementPattern: 'hpush', laterality: 'bilateral', fatigueRisk: 'high', prescription: { sets: 4, reps: { min: 6, max: 8 }, rir: 2 } }),
    exercise({ exerciseKey: 'seated-dumbbell-shoulder-press', displayName: '坐姿哑铃肩推', role: 'SECONDARY', movementPattern: 'vpush', laterality: 'bilateral', fatigueRisk: 'moderate', prescription: { sets: 3, reps: { min: 6, max: 8 }, rir: 2 } }),
    exercise({ exerciseKey: 'cable-fly', displayName: '绳索夹胸', role: 'ACCESSORY', movementPattern: 'hpush', laterality: 'bilateral', fatigueRisk: 'low', prescription: { sets: 2, reps: { min: 10, max: 15 }, rir: { min: 1, max: 2 } } }),
    exercise({ exerciseKey: 'lateral-raise', displayName: '侧平举', role: 'ACCESSORY', movementPattern: 'vpush', laterality: 'bilateral', fatigueRisk: 'low', prescription: { sets: 2, reps: { min: 12, max: 15 }, rir: { min: 1, max: 2 } } }),
    exercise({ exerciseKey: 'rope-triceps-pressdown', displayName: '绳索三头下压', role: 'ACCESSORY', movementPattern: 'hpush', laterality: 'bilateral', fatigueRisk: 'low', prescription: { sets: 2, reps: { min: 10, max: 15 }, rir: { min: 1, max: 2 } } }),
  ], 120)],
  { min: 51, max: 56 },
  { chest: 6, deltoids: 5, triceps: 2 },
  progression(['load', 'rir', 'control'], '默认上斜哑铃卧推与坐姿肩推保持稳定，不用半跪或单臂稳定性制造等级差异。'),
)

const body04L4 = level(
  'l4',
  '以高负荷水平推完成胸部机械张力训练',
  [
    prep('ski-erg-easy', '滑雪机轻拉', 'R', { durationSeconds: { min: 60, max: 90 } }, '提高体温并建立上肢节律。'),
    prep('chest-extension', '胸椎伸展', 'M', { reps: 5 }, '准备胸椎伸展和肩带位置。'),
  ],
  [
    ramp('barbell-bench-press', '空杠卧推', 1, 8, '空杠确认肩胛和杠铃路径。', 60),
    ramp('barbell-bench-press', '轻负荷杠铃卧推', 2, 5, '逐步接近高负荷工作重量。', 90),
    ramp('barbell-bench-press', '接近工作负荷杠铃卧推', 3, 3, '确认高负荷下仍能保持动作质量。', 120),
  ],
  [strengthBlock([
    exercise({ exerciseKey: 'barbell-bench-press', displayName: '杠铃卧推', role: 'PRIMARY', movementPattern: 'hpush', laterality: 'bilateral', fatigueRisk: 'high', prescription: { sets: 4, reps: { min: 5, max: 6 }, rir: { min: 1, max: 2 } } }),
    exercise({ exerciseKey: 'seated-dumbbell-shoulder-press', displayName: '坐姿哑铃肩推', role: 'SECONDARY', movementPattern: 'vpush', laterality: 'bilateral', fatigueRisk: 'moderate', prescription: { sets: 3, reps: { min: 6, max: 8 }, rir: { min: 1, max: 2 } } }),
    exercise({ exerciseKey: 'cable-fly', displayName: '绳索夹胸', role: 'ACCESSORY', movementPattern: 'hpush', laterality: 'bilateral', fatigueRisk: 'low', prescription: { sets: 2, reps: { min: 10, max: 15 }, rir: { min: 1, max: 2 } }, alternatives: [alternative({ exerciseKey: 'pec-deck', displayName: '蝴蝶机夹胸', reason: 'equipment', preserves: { primaryGoal: true, movementPattern: true, stimulus: true }, coachNote: '器械可获得性不足时，独立替代绳索夹胸。' })] }),
    exercise({ exerciseKey: 'lateral-raise', displayName: '侧平举', role: 'ACCESSORY', movementPattern: 'vpush', laterality: 'bilateral', fatigueRisk: 'low', prescription: { sets: 2, reps: { min: 10, max: 15 }, rir: { min: 1, max: 2 } } }),
    exercise({ exerciseKey: 'rope-triceps-pressdown', displayName: '绳索三头下压', role: 'ACCESSORY', movementPattern: 'hpush', laterality: 'bilateral', fatigueRisk: 'low', prescription: { sets: 2, reps: { min: 8, max: 12 }, rir: { min: 1, max: 2 } } }),
  ], 150)],
  { min: 53, max: 58 },
  { chest: 6, deltoids: 5, triceps: 2 },
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
  [strengthBlock([primary, secondary, unilateral, shoulder, armSlot(programLevel)], programLevel === 'l1' ? 90 : programLevel === 'l2' ? 90 : programLevel === 'l3' ? 120 : 150)],
  estimatedMinutes,
  targetMuscleSetEstimate,
  progressionFromPrevious,
)

const body05L1 = body05Level(
  'l1',
  '建立臀部主导的全身线条训练基础',
  exercise({ exerciseKey: 'floor-glute-bridge', displayName: '臀桥', role: 'PRIMARY', movementPattern: 'hip', laterality: 'bilateral', fatigueRisk: 'low', prescription: { sets: 3, reps: 10, rir: { min: 3, max: 4 } } }),
  exercise({ exerciseKey: 'neutral-grip-lat-pulldown', displayName: '中立握高位下拉', role: 'SECONDARY', movementPattern: 'vpull', laterality: 'bilateral', fatigueRisk: 'moderate', prescription: { sets: 3, reps: { min: 8, max: 10 }, rir: 3 } }),
  exercise({ exerciseKey: 'supported-low-box-step-up', displayName: '扶持低箱台阶上步', role: 'UNILATERAL', movementPattern: 'single', laterality: 'unilateral', fatigueRisk: 'moderate', prescription: { sets: 2, reps: 8, rir: 3 } }),
  exercise({ exerciseKey: 'machine-lateral-raise', displayName: '器械侧平举', role: 'ACCESSORY', movementPattern: 'vpush', laterality: 'bilateral', fatigueRisk: 'low', prescription: { sets: 2, reps: { min: 12, max: 15 }, rir: { min: 2, max: 3 } } }),
  [
    prep('rower-easy', '划船机轻划', 'R', { durationSeconds: 120 }, '提高体温并建立连续呼吸。'),
    prep('half-kneeling-hip-flexor-stretch', '半跪姿髋屈肌拉伸', 'M', { reps: 5 }, '准备髋部活动范围。', 'unilateral'),
    prep('band-lateral-walk', '迷你带侧向走', 'A', { reps: 8 }, '激活髋外侧并建立骨盆控制。', 'unilateral'),
  ],
  [
    ramp('floor-glute-bridge', '轻负荷臀桥', 1, 8, '轻负荷，确认臀部发力而非腰部代偿。', 30),
    ramp('floor-glute-bridge', '轻中负荷臀桥', 2, 5, '接近工作负荷并保持骨盆控制。', 45),
  ],
  { min: 47, max: 52 },
  { gluteus: 5, quadriceps: 2, lats: 3, lateralDelts: 2, selectedArm: 2 },
)

const body05L2 = body05Level(
  'l2',
  '在臀部主导下提高全身训练量与动作稳定性',
  exercise({ exerciseKey: 'hip-thrust', displayName: '臀推', role: 'PRIMARY', movementPattern: 'hip', laterality: 'bilateral', fatigueRisk: 'moderate', prescription: { sets: 4, reps: { min: 8, max: 10 }, rir: { min: 2, max: 3 } } }),
  exercise({ exerciseKey: 'chest-supported-row', displayName: '胸托划船', role: 'SECONDARY', movementPattern: 'hpull', laterality: 'bilateral', fatigueRisk: 'moderate', prescription: { sets: 3, reps: { min: 8, max: 10 }, rir: { min: 2, max: 3 } } }),
  exercise({ exerciseKey: 'supported-reverse-lunge', displayName: '扶持反向箭步蹲', role: 'UNILATERAL', movementPattern: 'single', laterality: 'unilateral', fatigueRisk: 'moderate', prescription: { sets: 2, reps: 8, rir: { min: 2, max: 3 } } }),
  exercise({ exerciseKey: 'machine-lateral-raise', displayName: '器械侧平举', role: 'ACCESSORY', movementPattern: 'vpush', laterality: 'bilateral', fatigueRisk: 'low', prescription: { sets: 2, reps: { min: 12, max: 15 }, rir: 2 } }),
  [
    prep('ski-erg-easy', '滑雪机轻拉', 'R', { durationSeconds: 90 }, '提高体温并建立上肢节律。'),
    prep('half-kneeling-hip-flexor-stretch', '半跪姿髋屈肌拉伸', 'M', { reps: 5 }, '准备髋部活动范围。', 'unilateral'),
    prep('band-lateral-walk', '弹力带侧向走', 'A', { reps: 10 }, '激活髋外侧并建立骨盆控制。', 'unilateral'),
  ],
  [ramp('hip-thrust', '轻重量臀推', 1, 8, '轻负荷确认髋伸展位置。', 30), ramp('hip-thrust', '中轻重量臀推', 2, 5, '接近工作负荷并保持骨盆控制。', 45)],
  { min: 49, max: 54 },
  { gluteus: 6, quadriceps: 2, upperBack: 3, lateralDelts: 2, selectedArm: 2 },
  progression(['load', 'volume', 'rir'], '臀推和水平拉负荷提高，单腿动作保持为可控的下肢补充。'),
)

const body05L3 = body05Level(
  'l3',
  '以高张力臀部训练为主并保持全身线条平衡',
  exercise({ exerciseKey: 'overload-hip-thrust', displayName: '超程臀推', role: 'PRIMARY', movementPattern: 'hip', laterality: 'bilateral', fatigueRisk: 'high', prescription: { sets: 4, reps: { min: 6, max: 8 }, rir: 2 } }),
  exercise({ exerciseKey: 'chest-supported-row', displayName: '胸托划船', role: 'SECONDARY', movementPattern: 'hpull', laterality: 'bilateral', fatigueRisk: 'moderate', prescription: { sets: 4, reps: { min: 6, max: 8 }, rir: 2 } }),
  exercise({ exerciseKey: 'supported-split-squat', displayName: '扶持分腿蹲', role: 'UNILATERAL', movementPattern: 'single', laterality: 'unilateral', fatigueRisk: 'moderate', prescription: { sets: 2, reps: 8, rir: 2 } }),
  exercise({ exerciseKey: 'machine-lateral-raise', displayName: '器械侧平举', role: 'ACCESSORY', movementPattern: 'vpush', laterality: 'bilateral', fatigueRisk: 'low', prescription: { sets: 2, reps: { min: 10, max: 15 }, rir: { min: 1, max: 2 } } }),
  [
    prep('rower-easy', '划船机轻划', 'R', { durationSeconds: 75 }, '提高体温并建立连续呼吸。'),
    prep('half-kneeling-hip-flexor-stretch', '半跪姿髋屈肌拉伸', 'M', { reps: 4 }, '准备髋部活动范围。', 'unilateral'),
  ],
  [
    ramp('overload-hip-thrust', '轻负荷超程臀推', 1, 8, '轻负荷确认活动范围。', 45),
    ramp('overload-hip-thrust', '中轻负荷超程臀推', 2, 5, '逐步接近工作负荷。', 60),
    ramp('overload-hip-thrust', '接近工作负荷超程臀推', 3, 3, '确认工作重量下仍能保持动作质量。', 75),
  ],
  { min: 51, max: 56 },
  { gluteus: 6, quadriceps: 2, upperBack: 4, lateralDelts: 2, selectedArm: 2 },
  progression(['load', 'rir'], '臀部机械张力提高，拉类和单腿动作仍采用稳定、可恢复的默认选择。'),
)

const body05L4 = body05Level(
  'l4',
  '以高负荷臀部刺激为主完成稳定的全身线条训练',
  exercise({ exerciseKey: 'heavy-hip-thrust', displayName: '大负荷臀推', role: 'PRIMARY', movementPattern: 'hip', laterality: 'bilateral', fatigueRisk: 'high', prescription: { sets: 4, reps: { min: 5, max: 8 }, rir: { min: 1, max: 2 } } }),
  exercise({ exerciseKey: 'chest-supported-row', displayName: '胸托划船', role: 'SECONDARY', movementPattern: 'hpull', laterality: 'bilateral', fatigueRisk: 'moderate', prescription: { sets: 4, reps: { min: 6, max: 8 }, rir: { min: 1, max: 2 } } }),
  exercise({ exerciseKey: 'supported-split-squat', displayName: '扶持分腿蹲', role: 'UNILATERAL', movementPattern: 'single', laterality: 'unilateral', fatigueRisk: 'moderate', prescription: { sets: 2, reps: { min: 6, max: 8 }, rir: 2 } }),
  exercise({ exerciseKey: 'machine-lateral-raise', displayName: '器械侧平举', role: 'ACCESSORY', movementPattern: 'vpush', laterality: 'bilateral', fatigueRisk: 'low', prescription: { sets: 2, reps: { min: 10, max: 15 }, rir: { min: 1, max: 2 } } }),
  [
    prep('rower-easy', '划船机轻划', 'R', { durationSeconds: { min: 60, max: 90 } }, '提高体温并建立连续呼吸。'),
    prep('half-kneeling-hip-flexor-stretch', '半跪姿髋屈肌拉伸', 'M', { reps: 4 }, '准备髋部活动范围。', 'unilateral'),
  ],
  [
    ramp('heavy-hip-thrust', '轻负荷大负荷臀推', 1, 8, '轻负荷确认髋伸展位置。', 60),
    ramp('heavy-hip-thrust', '中轻负荷大负荷臀推', 2, 5, '逐步接近高负荷工作重量。', 90),
    ramp('heavy-hip-thrust', '接近工作负荷大负荷臀推', 3, 3, '确认高负荷下仍能保持动作质量。', 120),
  ],
  { min: 53, max: 58 },
  { gluteus: 6, quadriceps: 2, upperBack: 4, lateralDelts: 2, selectedArm: 2 },
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
