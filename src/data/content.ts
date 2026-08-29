import { getPostpartumMovement, postpartumMovements } from './postpartumPresentationData'
import type { ActionEntity, Level } from './postpartumPresentationData'

export { getPostpartumMovement, postpartumMovements }
export type { ActionEntity, Level }

export type TemplateLevel = {
  label: string
  focus: string
  warmup: { exerciseId?: string; name: string; tag: string; prescription: string }[]
  exercises: { exerciseId?: string; name: string; prescription: string; pattern: string; displayCategory?: string }[]
  metrics: { label: string; value: string }[]
  sectionTitle: string
  sectionCount: string
  coachNote: string
  parameter: string
}

export type Template = {
  id: string
  code: string
  system: '3c' | 'body' | 'conditioning'
  name: string
  description: string
  levels: Record<'l1' | 'l2' | 'l3' | 'l4', TemplateLevel>
}

import { legacyTemplateContentPart1 } from './legacyTemplateContentPart1'
import { legacyTemplateContentPart2 } from './legacyTemplateContentPart2'
import { legacyTemplateContentPart3 } from './legacyTemplateContentPart3'
import { legacyTemplateContentPart4 } from './legacyTemplateContentPart4'
import { threeCTemplates } from './programming/threeCTemplates'
import { bodyTemplates } from './programming/bodyTemplates'
import { conditioningTemplates } from './programming/conditioningTemplates'
import { exerciseDisplayCategoryLabels, getExercise, resolveProgrammingExerciseId } from './exercises'
import { resolveProgrammingLevel } from './programming/rules'
import type {
  Count,
  ExercisePrescription,
  Laterality,
  ProgrammingTemplateLevel,
  ResolvedProgrammingLevel,
  ResolvedTrainingBlock,
  TrainingExercise,
} from './programming/types'

type MigratedTemplateLevel = {
  warmup: readonly { exerciseId?: string; name: string; tag: string; prescription: string }[]
  exercises: readonly { exerciseId?: string; name: string; pattern: string; prescription: string }[]
  metrics: readonly (readonly [string, string])[]
  sectionTitle: string
  sectionCount: string
  coachNote: string
}

const allLegacyTemplateContent = {
  ...legacyTemplateContentPart1,
  ...legacyTemplateContentPart2,
  ...legacyTemplateContentPart3,
  ...legacyTemplateContentPart4,
} as Record<string, Record<'l1' | 'l2' | 'l3' | 'l4', MigratedTemplateLevel>>

const legacyTemplateContent = Object.fromEntries(
  Object.entries(allLegacyTemplateContent).filter(([id]) => (
    !id.startsWith('3c') && !id.startsWith('body') && !id.startsWith('con')
  )),
) as Record<string, Record<'l1' | 'l2' | 'l3' | 'l4', MigratedTemplateLevel>>

const patternSeeds: Array<[string, string, string, string[]]> = [
  ['squat', '深蹲模式', 'Squat', ['pp01', 'pp07']],
  ['hinge', '髋铰链模式', 'Hinge', ['pp02', 'pp03']],
  ['hip', '臀桥 / 臀推模式', 'Hip Extension', ['pp05', 'pp10']],
  ['single', '单腿 / 弓步模式', 'Single Leg', ['pp07', 'pp09', 'pp14']],
  ['adduction', '髋内收模式', 'Adduction', ['pp08']],
  ['hpush', '水平推模式', 'Horizontal Push', []],
  ['vpush', '垂直推模式', 'Vertical Push', ['pp03']],
  ['hpull', '水平拉模式', 'Horizontal Pull', []],
  ['vpull', '垂直拉模式', 'Vertical Pull', []],
  ['core', '核心稳定模式', 'Core Stability', ['pp06', 'pp11', 'pp13', 'pp14', 'pp15', 'pp16', 'pp17', 'pp18', 'pp19', 'pp20', 'pp21', 'pp22', 'pp23', 'pp24', 'pp25', 'pp26']],
  ['carry', '负重移动模式', 'Carry', []],
  ['rotation', '旋转 / 多平面模式', 'Rotation / Multiplanar', ['pp04', 'pp05', 'pp09', 'pp12', 'pp13', 'pp18', 'pp25']],
]

export const movementPatterns = patternSeeds.map(([id, name, englishName, postpartumIds]) => ({ id, name, englishName, postpartumIds }))

const levelNames = ['动作学习', '基础负重', '进阶整合', '高阶整合']
const toTemplateLevel = (source: MigratedTemplateLevel, levelIndex: number): TemplateLevel => {
  const metrics = source.metrics.map(([label, value]) => ({ label, value }))
  return {
    label: `L${levelIndex + 1}`,
    focus: levelNames[levelIndex],
    warmup: source.warmup.map((item) => ({ ...item })),
    exercises: source.exercises.map((item) => ({ name: item.name, prescription: item.prescription, pattern: item.pattern })),
    metrics,
    sectionTitle: source.sectionTitle,
    sectionCount: source.sectionCount,
    coachNote: source.coachNote,
    parameter: metrics.map((metric) => `${metric.label} ${metric.value}`).join(' · '),
  }
}

const programmingPrepTags: Record<ProgrammingTemplateLevel['prep'][number]['phase'], string> = {
  R: 'Raise',
  M: 'Mobilize',
  A: 'Activate',
  P: 'Pattern',
}

const formatCount = (value: Count | undefined, unit = ''): string => {
  if (value === undefined) return ''
  if (typeof value === 'number') return String(value) + unit
  const text = value.min === value.max
    ? String(value.min)
    : String(value.min) + '–' + String(value.max)
  return text + unit
}

const formatPrescription = (
  prescription: ExercisePrescription,
  laterality?: Laterality,
  restSeconds?: Count,
): string => {
  const parts: string[] = []
  const sideSuffix = laterality === 'unilateral' ? ' / 侧' : ''
  if (prescription.sets !== undefined && prescription.reps !== undefined) {
    parts.push(formatCount(prescription.sets) + ' × ' + formatCount(prescription.reps, ' 次') + sideSuffix)
  } else if (prescription.reps !== undefined) {
    parts.push(formatCount(prescription.reps, ' 次') + sideSuffix)
  }
  if (prescription.durationSeconds !== undefined) {
    parts.push(formatCount(prescription.durationSeconds, ' 秒') + sideSuffix)
  }
  if (prescription.distanceMeters !== undefined) {
    parts.push(formatCount(prescription.distanceMeters, ' 米') + sideSuffix)
  }
  if (prescription.rpe !== undefined) parts.push('RPE ' + formatCount(prescription.rpe))
  if (prescription.rir !== undefined) parts.push('RIR ' + formatCount(prescription.rir))
  if (restSeconds !== undefined) parts.push('休息 ' + formatCount(restSeconds, ' 秒'))
  return parts.join(' · ') || '按教练指导'
}

const programmingPatternLabels: Record<TrainingExercise['movementPattern'], string> = {
  squat: '下肢 · 蹲',
  hinge: '后链 · 髋铰链',
  hip: '臀部 · 髋伸展',
  single: '下肢 · 单腿',
  adduction: '髋内收 · 稳定',
  hpush: '胸部 · 水平推',
  vpush: '肩部 · 垂直推',
  hpull: '背部 · 水平拉',
  vpull: '背部 · 垂直拉',
  core: '核心 · 稳定',
  carry: '全身 · Carry',
  rotation: '核心 · 抗旋转',
}

const toLegacyProgrammingPrep = (
  item: ProgrammingTemplateLevel['prep'][number],
): TemplateLevel['warmup'][number] => ({
  exerciseId: resolveProgrammingExerciseId(item.exerciseKey),
  name: item.displayName,
  tag: programmingPrepTags[item.phase],
  prescription: formatPrescription(item.prescription, item.laterality),
})

const toLegacyProgrammingRampUp = (
  item: ProgrammingTemplateLevel['rampUp'][number],
): TemplateLevel['warmup'][number] => ({
  exerciseId: resolveProgrammingExerciseId(item.exerciseKey),
  name: item.displayName,
  tag: 'Specific Ramp-up',
  prescription: [
    '第 ' + String(item.order) + ' 组',
    formatCount(item.reps, ' 次') + (item.laterality === 'unilateral' ? ' / 侧' : ''),
    item.loadGuidance,
    item.restSeconds === undefined ? '' : '休息 ' + formatCount(item.restSeconds, ' 秒'),
  ].filter(Boolean).join(' · '),
})

const toLegacyProgrammingSpecificBuildUp = (
  item: NonNullable<ProgrammingTemplateLevel['specificBuildUp']>[number],
): TemplateLevel['warmup'][number] => ({
  exerciseId: resolveProgrammingExerciseId(item.exerciseKey),
  name: item.displayName,
  tag: 'Specific Build-up',
  prescription: [
    formatPrescription(item.prescription, item.laterality),
    item.restAfterSeconds === undefined ? '' : '恢复 ' + formatCount(item.restAfterSeconds, ' 秒'),
    item.transitionAfterSeconds === undefined ? '' : '转换 ' + formatCount(item.transitionAfterSeconds, ' 秒'),
  ].filter(Boolean).join(' · '),
})

const toLegacyProgrammingExercise = (
  item: TrainingExercise,
  block: ResolvedTrainingBlock,
): TemplateLevel['exercises'][number] => {
  const exerciseId = resolveProgrammingExerciseId(item.exerciseKey)
  const exercise = getExercise(exerciseId)
  if (!exercise) throw new Error(`Missing canonical exercise for exerciseId: ${exerciseId}`)
  return {
    exerciseId,
    name: item.displayName,
    pattern: programmingPatternLabels[item.movementPattern],
    displayCategory: exerciseDisplayCategoryLabels[exercise.displayCategoryId],
    prescription: formatPrescription(
      item.prescription,
      item.laterality,
      block.kind === 'strength' || block.kind === 'power'
        ? item.restSeconds ?? block.restBetweenSetsSeconds
        : undefined,
    ),
  }
}

const sameCount = (left: Count | undefined, right: Count | undefined): boolean => {
  if (left === undefined || right === undefined) return left === right
  const leftRange = typeof left === 'number' ? { min: left, max: left } : left
  const rightRange = typeof right === 'number' ? { min: right, max: right } : right
  return leftRange.min === rightRange.min && leftRange.max === rightRange.max
}

const toLegacyProgrammingMetrics = (
  source: ResolvedProgrammingLevel,
): TemplateLevel['metrics'] => {
  const conditioning = source.blocks.find((block) => block.kind === 'conditioning')
  const power = source.blocks.find((block) => block.kind === 'power')
  if (conditioning) {
    const restParts = [
      power?.restBetweenSetsSeconds === undefined
        ? ''
        : 'Power 组间 ' + formatCount(power.restBetweenSetsSeconds, ' 秒'),
      power?.transitionAfterSeconds === undefined
        ? ''
        : 'Power→Conditioning 转换 ' + formatCount(power.transitionAfterSeconds, ' 秒'),
      conditioning.restBetweenRoundsSeconds === undefined
        ? ''
        : '轮间 ' + formatCount(conditioning.restBetweenRoundsSeconds, ' 秒'),
      source.exercises.some((item) => item.laterality === 'unilateral' && item.sideRestSeconds !== undefined)
        ? '单侧 reset 按动作处方'
        : '',
    ].filter(Boolean)
    return [
      { label: '轮数', value: formatCount(conditioning.rounds, ' 轮') },
      {
        label: '主观强度',
        value: source.conditioningIntensityTarget?.rpe === undefined
          ? '按动作处方'
          : 'RPE ' + formatCount(source.conditioningIntensityTarget.rpe),
      },
      { label: '恢复与转换', value: restParts.join(' · ') || '按动作处方' },
    ]
  }
  const circuit = source.blocks.find((block) => block.kind === 'circuit')
  const primary = source.exercises.find((item) => item.role === 'PRIMARY')
  const strengthBlocks = source.blocks.filter((block) => block.kind === 'strength')
  const strengthRests = strengthBlocks.flatMap((block) => block.exercises.map((item) => item.restSeconds ?? block.restBetweenSetsSeconds))
  const firstStrengthRest = strengthRests[0]
  const hasMixedStrengthRests = strengthRests.length > 1
    && strengthRests.some((rest) => !sameCount(rest, firstStrengthRest))
  const rounds = circuit?.rounds === undefined
    ? source.exercises
      .reduce((total, item) => total + (typeof item.prescription.sets === 'number' ? item.prescription.sets : 0), 0) + ' 组'
    : formatCount(circuit.rounds, ' 轮')
  const intensity = primary?.prescription.rpe !== undefined
    ? 'RPE ' + formatCount(primary.prescription.rpe)
    : primary?.prescription.rir !== undefined
      ? 'RIR ' + formatCount(primary.prescription.rir)
      : '按动作处方'
  const rest = circuit?.restBetweenRoundsSeconds !== undefined
    ? '轮间 ' + formatCount(circuit.restBetweenRoundsSeconds, ' 秒')
    : hasMixedStrengthRests
      ? '按动作处方'
      : firstStrengthRest === undefined
      ? '按动作处方'
      : formatCount(firstStrengthRest, ' 秒')

  return [
    { label: '轮数', value: rounds },
    { label: '主观强度', value: intensity },
    { label: '休息', value: rest },
  ]
}

const toLegacyProgrammingParameter = (
  metrics: TemplateLevel['metrics'],
): string => metrics.map((metric) => metric.label + ' ' + metric.value).join(' · ')

const toLegacyProgrammingLevel = (
  source: ResolvedProgrammingLevel,
  levelIndex: number,
): TemplateLevel => {
  const metrics = toLegacyProgrammingMetrics(source)
  return {
    label: 'L' + String(levelIndex + 1),
    focus: levelNames[levelIndex],
    warmup: [
      ...source.prep.map(toLegacyProgrammingPrep),
      ...(source.specificBuildUp ?? []).map(toLegacyProgrammingSpecificBuildUp),
      ...source.rampUp.map(toLegacyProgrammingRampUp),
    ],
    exercises: source.blocks.flatMap((block) => (
      block.exercises.map((item) => toLegacyProgrammingExercise(item, block))
    )),
    metrics,
    sectionTitle: source.blocks.map((block) => block.label).join(' + '),
    sectionCount: String(source.blocks.reduce((count, block) => count + block.exercises.length, 0)) + '个动作',
    coachNote: source.coachNote,
    parameter: toLegacyProgrammingParameter(metrics),
  }
}

const templateSeeds: Array<[string, string, Template['system'], string, string]> = [
  ['3c1', '3C · 1', '3c', '臀腿 + 上肢拉 + 核心', '下肢 / 拉 / 核心交替，提高密度但保留动作质量'],
  ['3c2', '3C · 2', '3c', '臀腿 + 上肢推 + 核心', '下肢与推类交替，控制肩部与核心疲劳'],
  ['3c3', '3C · 3', '3c', '单腿 + 上肢 + 核心', '从分腿支撑到单腿与对侧负重整合'],
  ['3c4', '3C · 4', '3c', '全身器械循环', '以稳定器械为主，逐级提高训练密度'],
  ['3c5', '3C · 5', '3c', '后链 + 背部循环', '髋铰链与水平 / 垂直拉交替，避免后链堆积'],
  ['3c6', '3C · 6', '3c', '壶铃 / 哑铃复合训练', '先学连接，再进入连续复合；不以疲劳取代技术'],
  ['body1', 'BODY · 1', 'body', '臀腿 A｜臀 + 股四头', '先建立深蹲与臀推模式，再提高机械张力'],
  ['body2', 'BODY · 2', 'body', '上肢拉｜背 + 后束 + 二头', '垂直拉与水平拉同步升级，孤立动作服务线条'],
  ['body3', 'BODY · 3', 'body', '臀腿 B｜臀 + 腘绳肌', '髋铰链与臀推从学习逐级进入高负荷'],
  ['body4', 'BODY · 4', 'body', '上肢推｜胸 + 肩 + 三头', '水平推与垂直推按稳定性逐级升级'],
  ['body5', 'BODY · 5', 'body', '女性线条专项｜臀 + 肩 + 背 + 手臂', '保留稳定动作，同时让下肢和拉类随等级进阶'],
  ['con1', 'CON · 1', 'conditioning', '器械心肺间歇', '划船机 / 滑雪机为主，量化并控制体能输出'],
  ['con2', 'CON · 2', 'conditioning', '雪橇 + Carry', '低技术门槛、高全身参与，强化工作容量'],
  ['con3', 'CON · 3', 'conditioning', '壶铃 + 药球', '自由器械体能，从基础进入摆动与力量传递'],
  ['con4', 'CON · 4', 'conditioning', '全身功能循环', '台阶、熊爬、雪橇、Carry 与器械组合'],
  ['con5', 'CON · 5', 'conditioning', '混合体能', '器械 + 雪橇 + 自由重量 + Carry 综合体能'],
]

const programmingTemplates = [...threeCTemplates, ...bodyTemplates, ...conditioningTemplates]
const programmingTemplateById = new Map(programmingTemplates.map((template) => [template.id, template]))

export const templates: Template[] = templateSeeds.map(([id, code, system, name, description]) => {
  const programmingTemplate = programmingTemplateById.get(id)
  return {
    id,
    code,
    system,
    name,
    description,
    levels: programmingTemplate
      ? {
        l1: toLegacyProgrammingLevel(resolveProgrammingLevel(programmingTemplate.levels.l1), 0),
        l2: toLegacyProgrammingLevel(resolveProgrammingLevel(programmingTemplate.levels.l2), 1),
        l3: toLegacyProgrammingLevel(resolveProgrammingLevel(programmingTemplate.levels.l3), 2),
        l4: toLegacyProgrammingLevel(resolveProgrammingLevel(programmingTemplate.levels.l4), 3),
      }
      : (() => {
        const legacy = legacyTemplateContent[id]
        if (!legacy) {
          throw new Error('No runtime Programming source or legacy fallback exists for template ' + id)
        }
        return {
          l1: toTemplateLevel(legacy.l1, 0),
          l2: toTemplateLevel(legacy.l2, 1),
          l3: toTemplateLevel(legacy.l3, 2),
          l4: toTemplateLevel(legacy.l4, 3),
        }
      })(),
  }
})

export type LibraryActionSource = {
  exerciseId: string
  templateId: string
  templateName: string
  level: Exclude<Level, 'l0'>
  role: 'warmup' | 'main'
  prescription: string
}

export type LibraryAction = {
  id: string
  exerciseId: string
  name: string
  category: string
  context: string
  goals: string[]
  coachCues: string[]
  regressions: string[]
  progressions: string[]
  sources: LibraryActionSource[]
}

const actionIndex = new Map<string, LibraryAction>()
const presentationActionIndex = new Map<string, LibraryAction>()
let actionSequence = 0
const addLibraryAction = (exerciseId: string, name: string, context: string, role: LibraryActionSource['role'], source: LibraryActionSource) => {
  const key = `${exerciseId}::${role}::${context}`
  const presentationKey = `${role}::${name}::${context}`
  const existing = actionIndex.get(key)
  if (existing) {
    existing.sources.push(source)
    if (!presentationActionIndex.has(presentationKey)) presentationActionIndex.set(presentationKey, existing)
    return
  }
  const exercise = getExercise(exerciseId)
  if (!exercise) throw new Error(`Missing canonical exercise for library action: ${exerciseId}`)
  const action: LibraryAction = {
    id: `action-${String(++actionSequence).padStart(3, '0')}`,
    exerciseId,
    name,
    category: exerciseDisplayCategoryLabels[exercise.displayCategoryId],
    context,
    goals: role === 'warmup' ? ['提高体温并建立动作准备'] : ['在模板中完成稳定、可重复的训练刺激'],
    coachCues: ['保持连续呼吸，先确认控制质量，再进入更高强度。', '技术下降或出现不适时，降低复杂度或回到更低等级。'],
    regressions: ['减少动作范围', '降低负荷或节奏'],
    progressions: ['增加负荷或动作复杂度', '在不破坏动作质量的前提下提高密度'],
    sources: [source],
  }
  actionIndex.set(key, action)
  presentationActionIndex.set(presentationKey, action)
}

for (const template of templates) {
  for (const level of ['l1', 'l2', 'l3', 'l4'] as const) {
    const current = template.levels[level]
    current.warmup.forEach((item) => {
      if (!item.exerciseId) throw new Error(`Missing canonical exerciseId for warmup item: ${item.name}`)
      addLibraryAction(item.exerciseId, item.name, item.tag, 'warmup', {
        exerciseId: item.exerciseId,
        templateId: template.id, templateName: template.name, level, role: 'warmup', prescription: item.prescription,
      })
    })
    current.exercises.forEach((exercise) => {
      if (!exercise.exerciseId) throw new Error(`Missing canonical exerciseId for exercise item: ${exercise.name}`)
      addLibraryAction(exercise.exerciseId, exercise.name, exercise.pattern, 'main', {
        exerciseId: exercise.exerciseId,
        templateId: template.id, templateName: template.name, level, role: 'main', prescription: exercise.prescription,
      })
    })
  }
}

export const libraryActions = [...actionIndex.values()]
export const getLibraryAction = (id: string) => libraryActions.find((action) => action.id === id)
export const getLibraryActionsByExerciseId = (exerciseId: string) => libraryActions.filter((action) => action.exerciseId === exerciseId)
export const getLibraryActionId = (name: string, context: string, role?: LibraryActionSource['role']) => {
  const roles = role ? [role] : (['warmup', 'main'] as const)
  for (const candidateRole of roles) {
    const action = presentationActionIndex.get(`${candidateRole}::${name}::${context}`)
    if (action) return action.id
  }
  return undefined
}

export const librarySections = [
  { id: 'lower', name: '下肢', description: '深蹲、髋铰链、臀桥与单腿动作库' },
  { id: 'pull', name: '上肢拉', description: '水平拉、垂直拉与肩胛控制' },
  { id: 'push', name: '上肢推', description: '水平推、垂直推与肩部稳定' },
  { id: 'core', name: '核心', description: '抗伸展、抗旋转与支撑控制' },
  { id: 'functional', name: '功能区', description: 'Carry、台阶与全身协同' },
  { id: 'multiplanar', name: '侧向 / 旋转', description: '多平面与旋转动作' },
  { id: 'postpartum', name: '产后恢复', description: 'PP01–PP26 专项动作库' },
  { id: 'cardio', name: '课后有氧', description: '训练后低门槛恢复与心肺' },
]

export const allRoutes = [
  '#/home', '#/templates', '#/patterns', '#/library',
  ...templates.map((template) => `#/templates/${template.id}/l1`),
  ...movementPatterns.map((pattern) => `#/patterns/${pattern.id}`),
  ...librarySections.map((section) => `#/library/${section.id}`),
  ...postpartumMovements.map((movement) => `#/postpartum/${movement.id}`),
]

export const getTemplate = (id: string) => templates.find((template) => template.id === id)
export const getPattern = (id: string) => movementPatterns.find((pattern) => pattern.id === id)
