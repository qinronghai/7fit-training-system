import { getExercise } from '../exercises'
import { female111RecipeFamilies } from './blockRecipes'
import { female111ProgressionFamilies } from './progression'
import type {
  Female111RecoveryRecord,
  Female111Template,
  Female111TemplateAction,
  Female111TemplateCatalogEntry,
  Female111TemplateCompatibilityProjection,
  Female111TemplateExerciseProgressionLink,
  Female111TemplateLevel,
  Female111TemplateLevelDefinition,
  Female111TemplateLevelId,
  Female111TemplatePrep,
  Female111TemplatePrepPhase,
  Female111TemplateRampUp,
  Female111TemplateRole,
} from './templateTypes'

export const female111TemplateLevelIds = ['l1', 'l2', 'l3', 'l4'] as const

type Prescription = Female111TemplateAction['prescription']
type LevelSeed = {
  recipeId: string
  level: Female111TemplateLevelId
  focus: string
  primary: string
  ramp: readonly [string, string]
  support: readonly [string, string]
  core: string
  accessory: string
  optional: string
  prepPrime: string
  progressionFromPrevious?: Female111TemplateLevelDefinition['progressionFromPrevious']
  exerciseProgressionFromPrevious?: Female111TemplateExerciseProgressionLink
  coachNote: string
}

const seconds = (min: number, max: number) => ({ min, max })

const progressionEvidence = (
  variables: NonNullable<Female111TemplateLevelDefinition['progressionFromPrevious']>['variables'],
  note: string,
): NonNullable<Female111TemplateLevelDefinition['progressionFromPrevious']> => ({ variables, note })

const edgeId = (from: string, to: string) => `${from}->${to}`

const exerciseProgression = (
  family: Female111TemplateExerciseProgressionLink['family'],
  fromExerciseId: string,
  toExerciseId: string,
  sourceNodeIds: readonly string[],
): Female111TemplateExerciseProgressionLink => ({
  family,
  direction: 'PROGRESSION',
  fromExerciseId,
  toExerciseId,
  sourceNodeIds,
  sourceEdgeIds: sourceNodeIds.slice(0, -1).map((from, index) => edgeId(from, sourceNodeIds[index + 1])),
})

const basePrescriptionByLevel: Readonly<Record<Female111TemplateLevelId, Prescription>> = {
  l1: { sets: 2, reps: { min: 6, max: 8 }, rir: 3, tempo: '3-1-2', rom: 'coach-limited clean range' },
  l2: { sets: 3, reps: { min: 8, max: 10 }, rir: 3, tempo: '3-1-2', rom: 'repeatable full available range' },
  l3: { sets: 3, reps: { min: 8, max: 10 }, rir: 2, tempo: '2-1-2', rom: 'full controlled range' },
  l4: { sets: 4, reps: { min: 6, max: 8 }, rir: 2, tempo: '2-0-2', rom: 'full range with load or integration' },
}

const supportPrescriptionByLevel: Readonly<Record<Female111TemplateLevelId, Prescription>> = {
  l1: { sets: 2, reps: { min: 6, max: 8 }, rir: 4, tempo: '2-1-2', rom: 'small clean range' },
  l2: { sets: 2, reps: { min: 8, max: 10 }, rir: 3, tempo: '2-1-2', rom: 'repeatable range' },
  l3: { sets: 3, reps: { min: 8, max: 10 }, rir: 3, tempo: '2-1-2', rom: 'controlled range' },
  l4: { sets: 3, reps: { min: 10, max: 12 }, rir: 2, tempo: '2-0-2', rom: 'controlled range under fatigue' },
}

const corePrescriptionByLevel: Readonly<Record<Female111TemplateLevelId, Prescription>> = {
  l1: { sets: 2, durationSeconds: { min: 15, max: 20 }, rir: 4, tempo: 'steady', rom: 'position before range' },
  l2: { sets: 3, durationSeconds: { min: 20, max: 25 }, rir: 3, tempo: 'steady', rom: 'position before range' },
  l3: { sets: 3, durationSeconds: { min: 25, max: 30 }, rir: 3, tempo: 'steady', rom: 'longer lever if breathing stays clear' },
  l4: { sets: 3, durationSeconds: { min: 30, max: 40 }, rir: 2, tempo: 'steady', rom: 'full control without breath holding' },
}

const roleReason: Readonly<Record<Female111TemplateRole, string>> = {
  PRIMARY: '承载本模板唯一主训练挑战，其他动作只服务于动作质量和容量。',
  SUPPORT: '补足支撑或控制能力，不抢占主训练挑战边界。',
  CORE: '保持呼吸、肋骨和骨盆控制，让主动作质量可重复。',
  ACCESSORY: '提供低风险补充容量或局部控制，不改变 1+1+1 主结构。',
}

const qualityBoundaryByRole: Readonly<Record<Female111TemplateRole, string>> = {
  PRIMARY: '主动作保持目标路径、稳定速度和 RIR 边界，任何疼痛或代偿都先降级。',
  SUPPORT: '支撑动作保持低疲劳和清晰节奏，不追求力竭。',
  CORE: '核心动作以呼吸连续和躯干位置为边界，不用屏气换完成度。',
  ACCESSORY: '辅助动作只在主训练质量不下降时保留。',
}

const progressionByRole: Readonly<Record<Female111TemplateRole, string>> = {
  PRIMARY: '先增加可重复次数或组数，再增加负荷、范围或整合复杂度。',
  SUPPORT: '只升级一个变量：支撑高度、停留时间、范围或轻阻力。',
  CORE: '先延长控制时间，再增加杠杆或动态变化。',
  ACCESSORY: '训练后仍稳定时增加一组或轻阻力。',
}

const regressionByRole: Readonly<Record<Female111TemplateRole, string>> = {
  PRIMARY: '回到上一等级主动作、提高支撑或缩小范围。',
  SUPPORT: '提高支撑面、缩短杠杆或减少动作范围。',
  CORE: '缩短保持时间、回到更短杠杆并恢复连续呼吸。',
  ACCESSORY: '删除辅助动作或回到自重版本。',
}

const unilateralExerciseMarkers = ['split', 'single', 'lunge', 'step', 'march', 'pallof', 'side', 'suitcase', '90-90', 'open-book']

const lateralityForExercise = (exerciseId: string): Female111TemplateAction['laterality'] => (
  unilateralExerciseMarkers.some((marker) => exerciseId.includes(marker)) ? 'unilateral' : 'bilateral'
)

const prep = (
  phase: Female111TemplatePrepPhase,
  id: string,
  exerciseId: string,
  prescription: Prescription,
  reason: string,
): Female111TemplatePrep => ({
  id,
  exerciseId,
  phase,
  laterality: lateralityForExercise(exerciseId),
  prescription,
  planningExecutionSeconds: seconds(45, 75),
  transitionAfterSeconds: 15,
  reason,
  qualityBoundary: '呼吸连续，骨盆和肋骨位置清楚，再进入下一项。',
  progression: '增加停留或活动范围，但不改变当天主训练难度。',
  regression: '缩小范围，增加支撑，保留连续呼吸。',
})

const rampUp = (
  order: number,
  recipeId: string,
  level: Female111TemplateLevelId,
  exerciseId: string,
): Female111TemplateRampUp => ({
  id: `${recipeId}-${level}-ramp-${order}`,
  exerciseId,
  order,
  laterality: lateralityForExercise(exerciseId),
  prescription: { sets: 1, reps: order === 1 ? { min: 5, max: 6 } : { min: 4, max: 5 }, rir: 5 - order, tempo: 'controlled', rom: order === 1 ? 'pattern rehearsal' : 'training range rehearsal' },
  planningExecutionSeconds: seconds(50, 85),
  restSeconds: order === 1 ? 20 : 30,
  transitionAfterSeconds: 15,
  reason: order === 1 ? '用回归版本确认路径、呼吸和当天活动范围。' : '用目标动作低剂量确认主训练准备度。',
  qualityBoundary: '动作路径稳定，速度可控，没有疼痛或屏气。',
  progression: '准备度稳定时进入主序列第一组。',
  regression: '回到准备动作或降低动作范围后再评估。',
})

const mainAction = (
  recipeId: string,
  level: Female111TemplateLevelId,
  role: Female111TemplateRole,
  index: number,
  exerciseId: string,
): Female111TemplateAction => {
  const prescription = role === 'PRIMARY'
    ? basePrescriptionByLevel[level]
    : role === 'CORE'
      ? corePrescriptionByLevel[level]
      : supportPrescriptionByLevel[level]

  return {
    id: `${recipeId}-${level}-main-${index}`,
    exerciseId,
    role,
    laterality: lateralityForExercise(exerciseId),
    prescription,
    planningExecutionSeconds: role === 'PRIMARY' ? seconds(210, 320) : seconds(120, 210),
    restSeconds: role === 'PRIMARY' ? level === 'l4' ? 75 : 60 : 30,
    transitionAfterSeconds: 20,
    reason: roleReason[role],
    qualityBoundary: qualityBoundaryByRole[role],
    progression: progressionByRole[role],
    regression: regressionByRole[role],
  }
}

const recoveryRecord = (recipeId: string, level: Female111TemplateLevelId): Female111RecoveryRecord => ({
  id: `${recipeId}-${level}-recovery`,
  required: true,
  fields: ['readiness', 'pain', 'breathing', 'primaryQuality', 'nextProgression'],
  coachPrompt: '记录主动作质量、疼痛/压力反应、呼吸连续性和下一次是否可升级。',
})

const estimateSecondsForCount = (value: number | { min: number; max: number } | undefined) => {
  if (typeof value === 'number') return seconds(value, value)
  if (value) return value
  return seconds(0, 0)
}

const sumSeconds = (items: readonly (Female111TemplatePrep | Female111TemplateRampUp | Female111TemplateAction)[]) => (
  items.reduce((total, item) => {
    const rest = estimateSecondsForCount(item.restSeconds)
    const transition = estimateSecondsForCount(item.transitionAfterSeconds)
    return {
      min: total.min + item.planningExecutionSeconds.min + rest.min + transition.min,
      max: total.max + item.planningExecutionSeconds.max + rest.max + transition.max,
    }
  }, seconds(0, 0))
)

const withCalculatedTime = (definition: Female111TemplateLevelDefinition): Female111TemplateLevel => {
  const estimatedSeconds = sumSeconds([
    ...definition.prep,
    ...definition.rampUp,
    ...definition.mainSequence,
    ...definition.optionalAccessory,
  ])
  const estimatedMinutes = {
    min: Math.ceil(estimatedSeconds.min / 60),
    max: Math.ceil(estimatedSeconds.max / 60),
  }
  return {
    ...definition,
    estimatedMinutes,
    timeEstimate: {
      estimatedMinutes,
      source: 'calculated-from-template-items',
    },
  }
}

const countText = (value: Prescription[keyof Prescription] | undefined): string | undefined => {
  if (value === undefined) return undefined
  if (typeof value === 'number') return String(value)
  if (typeof value === 'object' && 'min' in value && 'max' in value) return `${value.min}-${value.max}`
  return undefined
}

const formatPrescription = (prescription: Prescription): string => {
  const parts = [
    countText(prescription.sets) ? `${countText(prescription.sets)} 组` : undefined,
    countText(prescription.reps) ? `${countText(prescription.reps)} 次` : undefined,
    countText(prescription.durationSeconds) ? `${countText(prescription.durationSeconds)} 秒` : undefined,
    countText(prescription.distanceMeters) ? `${countText(prescription.distanceMeters)} 米` : undefined,
    countText(prescription.rir) ? `RIR ${countText(prescription.rir)}` : undefined,
    prescription.tempo ? `节奏 ${prescription.tempo}` : undefined,
  ].filter(Boolean)
  return parts.join(' · ')
}

const compatibilityAction = (
  action: Female111TemplatePrep | Female111TemplateRampUp | Female111TemplateAction,
) => ({
  exerciseId: action.exerciseId,
  prescription: formatPrescription(action.prescription),
  rationale: action.reason,
  progression: action.progression,
  regression: action.regression,
})

const compatibilityProjection = (level: Female111TemplateLevel): Female111TemplateCompatibilityProjection => {
  const primary = level.mainSequence.find((item) => item.role === 'PRIMARY')
  const support = level.mainSequence.find((item) => item.role === 'SUPPORT')
  const core = level.mainSequence.find((item) => item.role === 'CORE')
  if (!primary || !support || !core) throw new Error(`Female111 template level missing compatibility slots: ${level.recipeId}/${level.level}`)
  return {
    prep: compatibilityAction(level.prep[0]),
    slots: {
      PRIMARY: compatibilityAction(primary),
      SUPPORT: compatibilityAction(support),
      CORE: compatibilityAction(core),
    },
    coachFocus: level.coachNote,
    progressionNote: level.exerciseProgressionFromPrevious
      ? `${level.exerciseProgressionFromPrevious.fromExerciseId} -> ${level.exerciseProgressionFromPrevious.toExerciseId}`
      : level.progressionFromPrevious?.note ?? primary.progression,
    regressionNote: primary.regression,
  }
}

const makeLevel = (seed: LevelSeed): Female111TemplateLevel => withCalculatedTime({
  recipeId: seed.recipeId,
  level: seed.level,
  focus: seed.focus,
  prep: [
    prep('R', `${seed.recipeId}-${seed.level}-prep-r`, '90-90-hip-rotation', { sets: 1, reps: { min: 4, max: 5 }, tempo: 'breath-led', rom: 'comfortable hip rotation' }, '重置髋部位置、呼吸和骨盆感知。'),
    prep('M', `${seed.recipeId}-${seed.level}-prep-m`, 'ankle-dorsiflexion', { sets: 1, reps: { min: 6, max: 8 }, tempo: 'slow', rom: 'pain-free ankle range' }, '确认踝背屈和下肢进入训练范围。'),
    prep('A', `${seed.recipeId}-${seed.level}-prep-a`, 'glute-bridge', { sets: 1, reps: { min: 8, max: 10 }, tempo: '2-1-2', rom: 'neutral pelvis hip extension' }, '激活髋伸展和骨盆控制。'),
    prep('P', `${seed.recipeId}-${seed.level}-prep-p`, seed.prepPrime, { sets: 1, reps: { min: 5, max: 6 }, tempo: 'controlled', rom: 'target-pattern rehearsal' }, '用当天主模式的低剂量版本完成专项准备。'),
  ],
  rampUp: [
    rampUp(1, seed.recipeId, seed.level, seed.ramp[0]),
    rampUp(2, seed.recipeId, seed.level, seed.ramp[1]),
  ],
  mainSequence: [
    mainAction(seed.recipeId, seed.level, 'PRIMARY', 1, seed.primary),
    mainAction(seed.recipeId, seed.level, 'SUPPORT', 2, seed.support[0]),
    mainAction(seed.recipeId, seed.level, 'SUPPORT', 3, seed.support[1]),
    mainAction(seed.recipeId, seed.level, 'CORE', 4, seed.core),
    mainAction(seed.recipeId, seed.level, 'ACCESSORY', 5, seed.accessory),
  ],
  optionalAccessory: [
    mainAction(seed.recipeId, seed.level, 'ACCESSORY', 6, seed.optional),
  ],
  recoveryRecord: recoveryRecord(seed.recipeId, seed.level),
  progressionFromPrevious: seed.progressionFromPrevious,
  exerciseProgressionFromPrevious: seed.exerciseProgressionFromPrevious,
  coachNote: seed.coachNote,
})

const catalogLevelSeeds: readonly LevelSeed[] = [
  {
    recipeId: 'F111-01',
    level: 'l1',
    focus: '箱式深蹲基础，前侧支撑与抗伸展只做质量约束。',
    primary: 'box-squat',
    ramp: ['squat', 'box-squat'],
    support: ['incline-push-up', 'scapular-push-up'],
    core: 'dead-bug',
    accessory: 'band-pull-apart',
    optional: 'wall-slide',
    prepPrime: 'squat',
    coachNote: '先确认箱高、脚底压力和呼吸，再考虑组数。',
  },
  {
    recipeId: 'F111-01',
    level: 'l2',
    focus: '从箱式目标过渡到徒手深蹲，维持前侧支撑容量。',
    primary: 'squat',
    ramp: ['box-squat', 'squat'],
    support: ['incline-push-up', 'scapular-push-up'],
    core: 'dead-bug',
    accessory: 'band-pull-apart',
    optional: 'kettlebell-halo',
    prepPrime: 'squat',
    progressionFromPrevious: progressionEvidence(['volume'], 'changed fields: primary.prescription.sets, primary.prescription.reps'),
    exerciseProgressionFromPrevious: exerciseProgression('SQUAT', 'box-squat', 'squat', ['exp-box-squat', 'pp01']),
    coachNote: '升级只发生在深蹲重复性稳定之后。',
  },
  {
    recipeId: 'F111-01',
    level: 'l3',
    focus: '加入高脚杯箱式深蹲，增加范围和控制要求。',
    primary: 'goblet-box-squat',
    ramp: ['box-squat', 'goblet-box-squat'],
    support: ['incline-push-up', 'plank'],
    core: 'dead-bug',
    accessory: 'band-pull-apart',
    optional: 'seated-dumbbell-shoulder-press',
    prepPrime: 'squat',
    progressionFromPrevious: progressionEvidence(['range', 'control'], 'changed fields: primary.exerciseId, primary.qualityBoundary'),
    exerciseProgressionFromPrevious: exerciseProgression('SQUAT', 'squat', 'goblet-box-squat', ['pp01', 'goblet-box-squat']),
    coachNote: '负重不取代动作范围质量，箱高仍可回退。',
  },
  {
    recipeId: 'F111-01',
    level: 'l4',
    focus: '高脚杯深蹲作为唯一主挑战，支持动作不再并列加难。',
    primary: 'goblet-squat',
    ramp: ['goblet-box-squat', 'goblet-squat'],
    support: ['incline-push-up', 'plank'],
    core: 'dead-bug',
    accessory: 'band-pull-apart',
    optional: 'face-pull',
    prepPrime: 'squat',
    progressionFromPrevious: progressionEvidence(['load', 'output'], 'changed fields: primary.exerciseId, primary.prescription.rir'),
    exerciseProgressionFromPrevious: exerciseProgression('SQUAT', 'goblet-box-squat', 'goblet-squat', ['goblet-box-squat', 'goblet-squat']),
    coachNote: '只把高脚杯深蹲作为主挑战，支撑动作保持低疲劳。',
  },
  {
    recipeId: 'F111-02',
    level: 'l1',
    focus: '髋铰链路径建立，四点支撑和侧向核心负责控制。',
    primary: 'hinge-drill',
    ramp: ['hamstring-sweep', 'hinge-drill'],
    support: ['bird-dog', 'bear-crawl'],
    core: 'side-plank',
    accessory: 'glute-bridge',
    optional: 'cable-pull-through',
    prepPrime: 'hinge-drill',
    coachNote: '任何腰背代偿都先回到墙触髋铰链。',
  },
  {
    recipeId: 'F111-02',
    level: 'l2',
    focus: '壶铃硬拉承载髋铰链负荷，核心动作保持辅助边界。',
    primary: 'kettlebell-deadlift',
    ramp: ['hinge-drill', 'kettlebell-deadlift'],
    support: ['bird-dog', 'bear-crawl'],
    core: 'side-plank',
    accessory: 'hamstring-sweep',
    optional: 'cable-pull-through',
    prepPrime: 'hinge-drill',
    progressionFromPrevious: progressionEvidence(['load'], 'changed fields: primary.exerciseId, primary.prescription.rir'),
    exerciseProgressionFromPrevious: exerciseProgression('HINGE', 'hinge-drill', 'kettlebell-deadlift', ['pp02', 'kettlebell-deadlift']),
    coachNote: '负荷增加后，四点支撑不再同步升级。',
  },
  {
    recipeId: 'F111-02',
    level: 'l3',
    focus: '哑铃 RDL 增加离心控制和髋后移范围。',
    primary: 'dumbbell-rdl',
    ramp: ['kettlebell-deadlift', 'dumbbell-rdl'],
    support: ['bird-dog', 'bear-crawl'],
    core: 'side-plank',
    accessory: 'cable-pull-through',
    optional: 'farmer-carry',
    prepPrime: 'hinge-drill',
    progressionFromPrevious: progressionEvidence(['range', 'control'], 'changed fields: primary.exerciseId, primary.prescription.tempo'),
    exerciseProgressionFromPrevious: exerciseProgression('HINGE', 'kettlebell-deadlift', 'dumbbell-rdl', ['kettlebell-deadlift', 'dumbbell-rdl']),
    coachNote: 'L3 回归路径是壶铃硬拉或抬高起始位置。',
  },
  {
    recipeId: 'F111-02',
    level: 'l4',
    focus: '双哑铃 RDL 承载输出升级，侧向核心只维持质量。',
    primary: 'double-dumbbell-rdl',
    ramp: ['dumbbell-rdl', 'double-dumbbell-rdl'],
    support: ['bird-dog', 'bear-crawl'],
    core: 'side-plank',
    accessory: 'cable-pull-through',
    optional: 'farmer-carry',
    prepPrime: 'hinge-drill',
    progressionFromPrevious: progressionEvidence(['load', 'output'], 'changed fields: primary.exerciseId, primary.prescription.sets'),
    exerciseProgressionFromPrevious: exerciseProgression('HINGE', 'dumbbell-rdl', 'double-dumbbell-rdl', ['dumbbell-rdl', 'double-dumbbell-rdl']),
    coachNote: '如果握力或背部位置限制输出，回到单哑铃或壶铃版本。',
  },
  {
    recipeId: 'F111-03',
    level: 'l1',
    focus: '低箱上台阶建立单侧支撑，抗旋转作为低剂量约束。',
    primary: 'low-box-step-up',
    ramp: ['standing-march', 'low-box-step-up'],
    support: ['standing-march', 'high-plank-step-through'],
    core: 'pallof-press',
    accessory: 'side-lying-hip-adduction',
    optional: 'suitcase-carry',
    prepPrime: 'standing-march',
    coachNote: '先看骨盆高度和膝线，再增加台阶或负荷。',
  },
  {
    recipeId: 'F111-03',
    level: 'l2',
    focus: '分腿蹲承载主挑战，动态支撑只保留节奏。',
    primary: 'split-squat',
    ramp: ['low-box-step-up', 'split-squat'],
    support: ['standing-march', 'high-plank-step-through'],
    core: 'pallof-press',
    accessory: 'side-lying-hip-adduction',
    optional: 'suitcase-carry',
    prepPrime: 'standing-march',
    progressionFromPrevious: progressionEvidence(['volume'], 'changed fields: primary.prescription.sets, primary.prescription.reps'),
    exerciseProgressionFromPrevious: exerciseProgression('SINGLE_LEG', 'low-box-step-up', 'split-squat', ['low-box-step-up', 'split-squat']),
    coachNote: '站距、范围和扶持一次只调整一个。',
  },
  {
    recipeId: 'F111-03',
    level: 'l3',
    focus: '反向弓步增加动态重心转移，抗旋转保持可控。',
    primary: 'reverse-lunge',
    ramp: ['split-squat', 'reverse-lunge'],
    support: ['standing-march', 'high-plank-step-through'],
    core: 'pallof-press',
    accessory: 'side-lying-hip-adduction',
    optional: 'suitcase-carry',
    prepPrime: 'standing-march',
    progressionFromPrevious: progressionEvidence(['range', 'control'], 'changed fields: primary.exerciseId, primary.qualityBoundary'),
    exerciseProgressionFromPrevious: exerciseProgression('SINGLE_LEG', 'split-squat', 'reverse-lunge', ['split-squat', 'reverse-lunge']),
    coachNote: 'L3 失控时回到分腿蹲，不把 Pallof 加重当补偿。',
  },
  {
    recipeId: 'F111-03',
    level: 'l4',
    focus: '前脚抬高分腿蹲提升范围和输出。',
    primary: 'front-foot-elevated-split-squat',
    ramp: ['split-squat', 'front-foot-elevated-split-squat'],
    support: ['standing-march', 'high-plank-step-through'],
    core: 'pallof-press',
    accessory: 'side-lying-hip-adduction',
    optional: 'suitcase-carry',
    prepPrime: 'standing-march',
    progressionFromPrevious: progressionEvidence(['range', 'output'], 'changed fields: primary.exerciseId, primary.prescription.rir'),
    exerciseProgressionFromPrevious: exerciseProgression('SINGLE_LEG', 'reverse-lunge', 'front-foot-elevated-split-squat', ['reverse-lunge', 'front-foot-elevated-split-squat']),
    coachNote: '前脚垫高只在膝线和骨盆控制稳定时使用。',
  },
  {
    recipeId: 'F111-04',
    level: 'l1',
    focus: '双侧臀桥建立髋伸展输出，侧向支撑保持低门槛。',
    primary: 'glute-bridge',
    ramp: ['glute-bridge', 'glute-bridge'],
    support: ['side-plank', 'hip-abduction'],
    core: 'dead-bug',
    accessory: 'glute-bridge-abduction',
    optional: 'band-lateral-walk',
    prepPrime: 'glute-bridge',
    coachNote: '臀桥顶端不允许用腰椎伸展换高度。',
  },
  {
    recipeId: 'F111-04',
    level: 'l2',
    focus: '臀桥外展增加髋伸展后的额状面控制。',
    primary: 'glute-bridge-abduction',
    ramp: ['glute-bridge', 'glute-bridge-abduction'],
    support: ['side-plank', 'hip-abduction'],
    core: 'dead-bug',
    accessory: 'band-lateral-walk',
    optional: 'single-leg-stand',
    prepPrime: 'glute-bridge',
    progressionFromPrevious: progressionEvidence(['volume'], 'changed fields: primary.prescription.sets, primary.prescription.reps'),
    exerciseProgressionFromPrevious: exerciseProgression('HIP_EXTENSION', 'glute-bridge', 'glute-bridge-abduction', ['pp10', 'glute-bridge-abduction']),
    coachNote: '弹力带只服务于控制，不用更强弹力破坏骨盆位置。',
  },
  {
    recipeId: 'F111-04',
    level: 'l3',
    focus: '髋推增加髋伸展输出，核心保持抗伸展边界。',
    primary: 'hip-thrust',
    ramp: ['glute-bridge', 'hip-thrust'],
    support: ['side-plank', 'hip-abduction'],
    core: 'dead-bug',
    accessory: 'band-lateral-walk',
    optional: 'single-leg-stand',
    prepPrime: 'glute-bridge',
    progressionFromPrevious: progressionEvidence(['range', 'control'], 'changed fields: primary.exerciseId, primary.qualityBoundary'),
    exerciseProgressionFromPrevious: exerciseProgression('HIP_EXTENSION', 'glute-bridge-abduction', 'hip-thrust', ['glute-bridge-abduction', 'hip-thrust']),
    coachNote: 'L3 回归到臀桥外展或双侧臀桥。',
  },
  {
    recipeId: 'F111-04',
    level: 'l4',
    focus: '单腿臀桥作为髋伸展主挑战，侧向支撑不并列加难。',
    primary: 'single-leg-glute-bridge',
    ramp: ['glute-bridge', 'single-leg-glute-bridge'],
    support: ['side-plank', 'hip-abduction'],
    core: 'dead-bug',
    accessory: 'band-lateral-walk',
    optional: 'single-leg-stand',
    prepPrime: 'glute-bridge',
    progressionFromPrevious: progressionEvidence(['control', 'output'], 'changed fields: primary.exerciseId, primary.prescription.rir'),
    exerciseProgressionFromPrevious: exerciseProgression('HIP_EXTENSION', 'hip-thrust', 'single-leg-glute-bridge', ['hip-thrust', 'exp-single-leg-glute-bridge']),
    coachNote: '单侧髋伸展失去骨盆控制时立即回到双侧版本。',
  },
  {
    recipeId: 'F111-05',
    level: 'l1',
    focus: '高脚杯箱式深蹲连接负重和四点支撑。',
    primary: 'goblet-box-squat',
    ramp: ['box-squat', 'goblet-box-squat'],
    support: ['bird-dog', 'bear-crawl'],
    core: 'side-plank',
    accessory: 'band-lateral-walk',
    optional: 'kettlebell-halo',
    prepPrime: 'squat',
    coachNote: '前方负重只用于组织躯干，不追求疲劳。',
  },
  {
    recipeId: 'F111-05',
    level: 'l2',
    focus: '高脚杯深蹲增加可重复负重深蹲容量。',
    primary: 'goblet-squat',
    ramp: ['goblet-box-squat', 'goblet-squat'],
    support: ['bird-dog', 'bear-crawl'],
    core: 'side-plank',
    accessory: 'band-lateral-walk',
    optional: 'front-rack-carry',
    prepPrime: 'squat',
    progressionFromPrevious: progressionEvidence(['volume'], 'changed fields: primary.prescription.sets, primary.prescription.reps'),
    exerciseProgressionFromPrevious: exerciseProgression('SQUAT', 'goblet-box-squat', 'goblet-squat', ['goblet-box-squat', 'goblet-squat']),
    coachNote: '支持和核心动作不因深蹲升级而同步加难。',
  },
  {
    recipeId: 'F111-05',
    level: 'l3',
    focus: '双哑铃前蹲增加前架控制和范围。',
    primary: 'double-dumbbell-front-squat',
    ramp: ['goblet-squat', 'double-dumbbell-front-squat'],
    support: ['bird-dog', 'bear-crawl'],
    core: 'side-plank',
    accessory: 'band-lateral-walk',
    optional: 'front-rack-carry',
    prepPrime: 'squat',
    progressionFromPrevious: progressionEvidence(['load', 'control'], 'changed fields: primary.exerciseId, primary.qualityBoundary'),
    exerciseProgressionFromPrevious: exerciseProgression('SQUAT', 'goblet-squat', 'double-dumbbell-front-squat', ['goblet-squat', 'double-dumbbell-front-squat']),
    coachNote: 'L3 可回到高脚杯深蹲，前架位置不可压迫呼吸。',
  },
  {
    recipeId: 'F111-05',
    level: 'l4',
    focus: '哈克深蹲承载输出，其他动作维持边界。',
    primary: 'hack-squat',
    ramp: ['goblet-squat', 'hack-squat'],
    support: ['bird-dog', 'bear-crawl'],
    core: 'side-plank',
    accessory: 'band-lateral-walk',
    optional: 'front-rack-carry',
    prepPrime: 'squat',
    progressionFromPrevious: progressionEvidence(['load', 'output'], 'changed fields: primary.exerciseId, primary.prescription.sets'),
    exerciseProgressionFromPrevious: exerciseProgression('SQUAT', 'double-dumbbell-front-squat', 'hack-squat', ['double-dumbbell-front-squat', 'hack-squat']),
    coachNote: '机器输出稳定时才保留 L4，否则回到自由重量可控版本。',
  },
  {
    recipeId: 'F111-06',
    level: 'l1',
    focus: '壶铃硬拉打底，为髋铰链/推的整合做准备。',
    primary: 'kettlebell-deadlift',
    ramp: ['hinge-drill', 'kettlebell-deadlift'],
    support: ['plank', 'high-plank-step-through'],
    core: 'pallof-press',
    accessory: 'straight-arm-pulldown',
    optional: 'face-pull',
    prepPrime: 'hinge-drill',
    coachNote: '只有髋铰链质量稳定时才进入整合路径。',
  },
  {
    recipeId: 'F111-06',
    level: 'l2',
    focus: '哑铃 RDL 增加髋铰链负荷，动态支撑保守处理。',
    primary: 'dumbbell-rdl',
    ramp: ['kettlebell-deadlift', 'dumbbell-rdl'],
    support: ['plank', 'high-plank-step-through'],
    core: 'pallof-press',
    accessory: 'straight-arm-pulldown',
    optional: 'face-pull',
    prepPrime: 'hinge-drill',
    progressionFromPrevious: progressionEvidence(['load'], 'changed fields: primary.exerciseId, primary.prescription.rir'),
    exerciseProgressionFromPrevious: exerciseProgression('INTEGRATED_COMPOUND', 'kettlebell-deadlift', 'dumbbell-rdl', ['kettlebell-deadlift', 'dumbbell-rdl']),
    coachNote: 'RDL 是主挑战，支撑动作不可变成第二个高挑战。',
  },
  {
    recipeId: 'F111-06',
    level: 'l3',
    focus: '硬拉推肩引入整合，但保留清晰回归路径。',
    primary: 'deadlift-to-overhead-press',
    ramp: ['dumbbell-rdl', 'deadlift-to-overhead-press'],
    support: ['plank', 'high-plank-step-through'],
    core: 'pallof-press',
    accessory: 'straight-arm-pulldown',
    optional: 'face-pull',
    prepPrime: 'hinge-drill',
    progressionFromPrevious: progressionEvidence(['control', 'output'], 'changed fields: primary.exerciseId, primary.qualityBoundary'),
    exerciseProgressionFromPrevious: exerciseProgression('INTEGRATED_COMPOUND', 'dumbbell-rdl', 'deadlift-to-overhead-press', ['dumbbell-rdl', 'deadlift-to-overhead-press']),
    coachNote: 'L3 失效时拆回硬拉和坐姿推举，不硬撑整合。',
  },
  {
    recipeId: 'F111-06',
    level: 'l4',
    focus: '硬拉推肩提高连续输出，抗旋转仍是辅助。',
    primary: 'deadlift-to-overhead-press',
    ramp: ['dumbbell-rdl', 'deadlift-to-overhead-press'],
    support: ['plank', 'high-plank-step-through'],
    core: 'pallof-press',
    accessory: 'straight-arm-pulldown',
    optional: 'face-pull',
    prepPrime: 'hinge-drill',
    progressionFromPrevious: progressionEvidence(['volume', 'density'], 'changed fields: primary.prescription.sets, primary.restSeconds'),
    exerciseProgressionFromPrevious: exerciseProgression('INTEGRATED_COMPOUND', 'deadlift-to-overhead-press', 'deadlift-to-overhead-press', ['deadlift-to-overhead-press']),
    coachNote: '只增加连续性或负荷之一，保留拆分动作回归。',
  },
  {
    recipeId: 'F111-07',
    level: 'l1',
    focus: '站立交替抬腿建立移动前的重心转移。',
    primary: 'standing-march',
    ramp: ['single-leg-stand', 'standing-march'],
    support: ['band-lateral-walk', 'lateral-lunge'],
    core: 'supine-open-book',
    accessory: 'hip-abduction',
    optional: 'side-lying-open-book',
    prepPrime: 'standing-march',
    coachNote: '低等级以站立控制为主，不急于低位移动。',
  },
  {
    recipeId: 'F111-07',
    level: 'l2',
    focus: '低箱上台阶增加单侧移动和重心转移。',
    primary: 'low-box-step-up',
    ramp: ['standing-march', 'low-box-step-up'],
    support: ['band-lateral-walk', 'lateral-lunge'],
    core: 'supine-open-book',
    accessory: 'hip-abduction',
    optional: 'side-lying-open-book',
    prepPrime: 'standing-march',
    progressionFromPrevious: progressionEvidence(['volume'], 'changed fields: primary.prescription.sets, primary.prescription.reps'),
    exerciseProgressionFromPrevious: exerciseProgression('LOCOMOTION', 'standing-march', 'low-box-step-up', ['exp-standing-march', 'low-box-step-up']),
    coachNote: '台阶高度和负荷不同时升级。',
  },
  {
    recipeId: 'F111-07',
    level: 'l3',
    focus: '侧弓步推进额状面重心转移，旋转控制仍低负担。',
    primary: 'lateral-lunge',
    ramp: ['low-box-step-up', 'lateral-lunge'],
    support: ['band-lateral-walk', 'single-leg-stand'],
    core: 'side-lying-open-book',
    accessory: 'hip-abduction',
    optional: 'suitcase-carry',
    prepPrime: 'standing-march',
    progressionFromPrevious: progressionEvidence(['range', 'control'], 'changed fields: primary.exerciseId, primary.qualityBoundary'),
    exerciseProgressionFromPrevious: exerciseProgression('LOCOMOTION', 'low-box-step-up', 'lateral-lunge', ['low-box-step-up', 'lateral-lunge']),
    coachNote: 'L3 可回到上台阶或缩小侧向范围。',
  },
  {
    recipeId: 'F111-07',
    level: 'l4',
    focus: '低位鸭步承载移动挑战，额状面支持不并列加难。',
    primary: 'duck-walk',
    ramp: ['lateral-lunge', 'duck-walk'],
    support: ['band-lateral-walk', 'single-leg-stand'],
    core: 'side-lying-open-book',
    accessory: 'hip-abduction',
    optional: 'suitcase-carry',
    prepPrime: 'standing-march',
    progressionFromPrevious: progressionEvidence(['range', 'output'], 'changed fields: primary.exerciseId, primary.prescription.rir'),
    exerciseProgressionFromPrevious: exerciseProgression('LOCOMOTION', 'lateral-lunge', 'duck-walk', ['lateral-lunge', 'duck-walk']),
    coachNote: '低位移动失控时提高身体位置并减少距离。',
  },
  {
    recipeId: 'F111-08',
    level: 'l1',
    focus: '壶铃硬拉和动态支撑建立全身整合前置能力。',
    primary: 'kettlebell-deadlift',
    ramp: ['hinge-drill', 'kettlebell-deadlift'],
    support: ['plank', 'bear-crawl'],
    core: 'dead-bug',
    accessory: 'farmer-carry',
    optional: 'kettlebell-halo',
    prepPrime: 'hinge-drill',
    coachNote: '先建立力传递和支撑，再进入真正整合动作。',
  },
  {
    recipeId: 'F111-08',
    level: 'l2',
    focus: '农夫走作为全身张力输出，动态核心保持基础。',
    primary: 'farmer-carry',
    ramp: ['kettlebell-deadlift', 'farmer-carry'],
    support: ['plank', 'bear-crawl'],
    core: 'dead-bug',
    accessory: 'kettlebell-halo',
    optional: 'front-rack-carry',
    prepPrime: 'hinge-drill',
    progressionFromPrevious: progressionEvidence(['load'], 'changed fields: primary.exerciseId, primary.prescription.rir'),
    exerciseProgressionFromPrevious: exerciseProgression('INTEGRATED_COMPOUND', 'kettlebell-deadlift', 'farmer-carry', ['kettlebell-deadlift', 'farmer-carry']),
    coachNote: '行走负重不应牺牲呼吸或躯干位置。',
  },
  {
    recipeId: 'F111-08',
    level: 'l3',
    focus: '硬拉推肩建立完整整合动作。',
    primary: 'deadlift-to-overhead-press',
    ramp: ['kettlebell-deadlift', 'deadlift-to-overhead-press'],
    support: ['bear-crawl', 'high-plank-step-through'],
    core: 'lateral-bear-crawl',
    accessory: 'front-rack-carry',
    optional: 'kettlebell-halo',
    prepPrime: 'hinge-drill',
    progressionFromPrevious: progressionEvidence(['control', 'output'], 'changed fields: primary.exerciseId, primary.qualityBoundary'),
    exerciseProgressionFromPrevious: exerciseProgression('INTEGRATED_COMPOUND', 'farmer-carry', 'deadlift-to-overhead-press', ['farmer-carry', 'deadlift-to-overhead-press']),
    coachNote: 'L3 回归为硬拉和推举拆分，动态核心缩短距离。',
  },
  {
    recipeId: 'F111-08',
    level: 'l4',
    focus: '硬拉推肩与动态核心提升连续输出。',
    primary: 'deadlift-to-overhead-press',
    ramp: ['kettlebell-deadlift', 'deadlift-to-overhead-press'],
    support: ['bear-crawl', 'high-plank-step-through'],
    core: 'lateral-bear-crawl',
    accessory: 'front-rack-carry',
    optional: 'kettlebell-halo',
    prepPrime: 'hinge-drill',
    progressionFromPrevious: progressionEvidence(['volume', 'density'], 'changed fields: primary.prescription.sets, primary.restSeconds'),
    exerciseProgressionFromPrevious: exerciseProgression('INTEGRATED_COMPOUND', 'deadlift-to-overhead-press', 'deadlift-to-overhead-press', ['deadlift-to-overhead-press']),
    coachNote: '全身整合只升级一个变量，动态核心不抢主挑战。',
  },
]

const recipeById: ReadonlyMap<string, (typeof female111RecipeFamilies)[number]> = new Map(
  female111RecipeFamilies.map((recipe) => [recipe.id, recipe]),
)

const levelsByRecipe = catalogLevelSeeds.reduce((result, seed) => {
  const recipeLevels = result.get(seed.recipeId) ?? new Map<Female111TemplateLevelId, Female111TemplateLevel>()
  recipeLevels.set(seed.level, makeLevel(seed))
  result.set(seed.recipeId, recipeLevels)
  return result
}, new Map<string, Map<Female111TemplateLevelId, Female111TemplateLevel>>())

export const female111TemplateCatalog: readonly Female111TemplateCatalogEntry[] = female111RecipeFamilies.map((recipe) => {
  const levels = levelsByRecipe.get(recipe.id)
  if (!levels) throw new Error(`Female111 template catalog missing recipe: ${recipe.id}`)
  const levelRecord = {
    l1: levels.get('l1')!,
    l2: levels.get('l2')!,
    l3: levels.get('l3')!,
    l4: levels.get('l4')!,
  }
  return {
    ...compatibilityProjection(levelRecord.l1),
    recipe,
    recipeId: recipe.id,
    levels: levelRecord,
  }
})

const allLevelActions = (level: Female111TemplateLevel) => [
  ...level.prep,
  ...level.rampUp,
  ...level.mainSequence,
  ...level.optionalAccessory,
]

const primaryAction = (level: Female111TemplateLevel) => level.mainSequence.find((item) => item.role === 'PRIMARY')

const validateExerciseProgression = (
  template: Female111TemplateCatalogEntry,
  level: Female111TemplateLevel,
  previousLevel: Female111TemplateLevel,
) => {
  const link = level.exerciseProgressionFromPrevious
  const primary = primaryAction(level)
  const previousPrimary = primaryAction(previousLevel)
  if (!link || !primary || !previousPrimary) {
    throw new Error(`Female111 template level must declare primary exercise progression linkage: ${template.recipeId}/${level.level}`)
  }
  if (
    link.family !== template.recipe.primaryFamily
    || link.direction !== 'PROGRESSION'
    || link.fromExerciseId !== previousPrimary.exerciseId
    || link.toExerciseId !== primary.exerciseId
  ) {
    throw new Error(`Female111 template exercise progression identity mismatch: ${template.recipeId}/${level.level}`)
  }
  if (!getExercise(link.fromExerciseId) || !getExercise(link.toExerciseId)) {
    throw new Error(`Female111 template exercise progression must use canonical exercises: ${template.recipeId}/${level.level}`)
  }
  const family = female111ProgressionFamilies.find((item) => item.slot === 'PRIMARY' && item.family === link.family)
  if (!family) throw new Error(`Female111 template progression family missing: ${template.recipeId}/${level.level}`)

  const nodes = link.sourceNodeIds.map((nodeId) => family.nodes.find((node) => node.id === nodeId))
  if (nodes.some((node) => !node)) throw new Error(`Female111 template progression source node missing: ${template.recipeId}/${level.level}`)
  if (nodes[0]?.exerciseId !== link.fromExerciseId || nodes[nodes.length - 1]?.exerciseId !== link.toExerciseId) {
    throw new Error(`Female111 template progression source node endpoint mismatch: ${template.recipeId}/${level.level}`)
  }
  for (const sourceEdgeId of link.sourceEdgeIds) {
    const [from, to] = sourceEdgeId.split('->')
    if (!family.edges.some((edge) => edge.from === from && edge.to === to && edge.direction === link.direction)) {
      throw new Error(`Female111 template progression source edge missing: ${template.recipeId}/${level.level}/${sourceEdgeId}`)
    }
  }
}

const validateCatalog = () => {
  const expectedRecipeIds = new Set(female111RecipeFamilies.map((recipe) => recipe.id))
  const catalogRecipeIds = new Set(female111TemplateCatalog.map((template) => template.recipeId))
  if (expectedRecipeIds.size !== female111TemplateCatalog.length || [...expectedRecipeIds].some((id) => !catalogRecipeIds.has(id))) {
    throw new Error('Female111 template catalog must cover every Recipe Family exactly once')
  }

  for (const template of female111TemplateCatalog) {
    for (const levelId of female111TemplateLevelIds) {
      const level = template.levels[levelId]
      if (level.recipeId !== template.recipeId || level.level !== levelId) {
        throw new Error(`Female111 template level identity mismatch: ${template.recipeId}/${levelId}`)
      }
      if (level.prep.map((item) => item.phase).join('') !== 'RMAP') {
        throw new Error(`Female111 template level must preserve R/M/A/P prep order: ${template.recipeId}/${levelId}`)
      }
      if (level.rampUp.length < 2 || level.rampUp.some((item, index) => item.order !== index + 1)) {
        throw new Error(`Female111 template level must preserve ordered ramp-up: ${template.recipeId}/${levelId}`)
      }
      if (level.mainSequence.length < 5 || level.mainSequence.filter((item) => item.role === 'PRIMARY').length !== 1) {
        throw new Error(`Female111 template level must keep one primary and at least five main actions: ${template.recipeId}/${levelId}`)
      }
      if (levelId === 'l1' && level.progressionFromPrevious) {
        throw new Error(`Female111 L1 must not declare progression evidence: ${template.recipeId}`)
      }
      if (levelId !== 'l1' && (!level.progressionFromPrevious || level.progressionFromPrevious.variables.length > 2)) {
        throw new Error(`Female111 L2-L4 must declare bounded progression evidence: ${template.recipeId}/${levelId}`)
      }
      if (levelId !== 'l1') {
        const previousLevelId = female111TemplateLevelIds[female111TemplateLevelIds.indexOf(levelId) - 1]
        validateExerciseProgression(template, level, template.levels[previousLevelId])
      }
      for (const item of allLevelActions(level)) {
        if (!getExercise(item.exerciseId)) throw new Error(`Female111 template references an unknown Exercise: ${item.exerciseId}`)
        if (typeof item.prescription !== 'object' || item.prescription === null) {
          throw new Error(`Female111 template action must use structured prescription: ${item.id}`)
        }
      }
    }
  }
}

validateCatalog()

export const getFemale111Template = (
  recipeId: string,
  level: Female111TemplateLevelId = 'l1',
): Female111Template | undefined => {
  const catalogEntry = female111TemplateCatalog.find((template) => template.recipeId === recipeId)
  const recipe = recipeById.get(recipeId)
  const selectedLevel = catalogEntry?.levels[level]
  if (!catalogEntry || !recipe || !selectedLevel) return undefined
  return {
    ...compatibilityProjection(selectedLevel),
    recipe,
    recipeId,
    level: selectedLevel,
  }
}
