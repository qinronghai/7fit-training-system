export type Level = 'l0' | 'l1' | 'l2' | 'l3' | 'l4'

export type ActionEntity = {
  id: string
  name: string
  englishName: string
  category: string
  movementPatterns: string[]
  level: Level[]
  goals: string[]
  scenarios: string[]
  coachCues: string[]
  commonErrors: string[]
  regressions: string[]
  progressions: string[]
  primaryVideo: string
  secondaryVideo: string
  riskNotes: string[]
  cardContent: {
    overview: string
    trainingTarget: string
    setup: string
    coachingPoints: string[]
    progression: string
    stopSignals: string[]
  }
}

export type TemplateLevel = {
  label: string
  focus: string
  warmup: { name: string; tag: string; prescription: string }[]
  exercises: { name: string; prescription: string; pattern: string }[]
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
import type {
  Count,
  ExercisePrescription,
  Laterality,
  ProgrammingTemplateLevel,
  TrainingBlock,
  TrainingExercise,
} from './programming/types'

type MigratedTemplateLevel = {
  warmup: readonly { name: string; tag: string; prescription: string }[]
  exercises: readonly { name: string; pattern: string; prescription: string }[]
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
  Object.entries(allLegacyTemplateContent).filter(([id]) => !id.startsWith('3c')),
) as Record<string, Record<'l1' | 'l2' | 'l3' | 'l4', MigratedTemplateLevel>>

const ppSeeds: Array<[string, string, string, string, string[], string[], string[], [string, string]]> = [
  ['PP01', '髋主导蹲', 'L1 → L2', '髋模式', ['squat'], ['髋屈髋伸与核心协同'], ['建立髋主导下肢基础蹲型。'], ['https://www.youtube.com/watch?v=1dpapTXF4Qs', 'https://www.youtube.com/watch?v=Z50B4zzadvw']],
  ['PP02', '髋铰链拉', 'L1 → L3', '髋模式', ['hinge'], ['髋折叠与后链发力'], ['建立髋铰链，减少腰部代偿。'], ['https://www.youtube.com/watch?v=2W_gXhut5S8', 'https://www.youtube.com/watch?v=wMU12lpPKiA']],
  ['PP03', '硬拉推肩', 'L4', '髋模式', ['hinge', 'vpush'], ['全身力量传递与上下肢联动'], ['高阶复合动作，连接髋铰链与垂直推。'], ['https://www.drfitology.com/exercises/glutes/deadlift-to-overhead-press', 'https://www.vitalmovementkg.com/blank-5']],
  ['PP04', '90/90 髋转换', 'L1 → L2', '髋模式', ['rotation'], ['髋旋转灵活性与骨盆感知'], ['改善髋内外旋与骨盆—躯干分离控制。'], ['https://www.youtube.com/watch?v=0aeJoPigJJ4', 'https://www.youtube.com/watch?v=plbH81ZlnZs']],
  ['PP05', '90/90 胫骨箱顶髋', 'L2', '髋模式', ['hip', 'rotation'], ['髋伸展与臀部稳定'], ['在 90/90 基础上强化前侧髋伸展。'], ['https://www.youtube.com/watch?v=lpD7TQQkETQ', 'https://www.starnewskorea.com/en/business-life/2026/04/06/2026040610171590926']],
  ['PP06', '坐姿骨盆髋走', 'L1 → L2', '髋模式', ['core'], ['骨盆控制与节律感'], ['重建骨盆前后、左右移动和本体感觉。'], ['https://www.youtube.com/watch?v=eixkcrX_Qh8&t=374s', 'https://vimeo.com/581888799']],
  ['PP07', '低位鸭步', 'L3 → L4', '髋模式', ['single', 'squat'], ['下肢稳定与步态控制'], ['强化髋膝踝对线与下肢耐力。'], ['https://www.youtube.com/watch?v=tXJr-RhR0lo', 'https://www.youtube.com/watch?v=HgX0LfCeEx4']],
  ['PP08', '侧卧髋内收', 'L1', '髋模式', ['adduction'], ['骨盆稳定与髋内收控制'], ['补足常被忽视的髋内收基础能力。'], ['https://www.youtube.com/watch?v=lhwT35sshrI', 'https://www.youtube.com/watch?v=rh0T5yfo1vU']],
  ['PP09', '弹力带半蹲侧向走', 'L2', '髋模式', ['single', 'rotation'], ['臀中肌与骨盆稳定'], ['半蹲位侧向抗阻，提升动态稳定。'], ['https://www.youtube.com/watch?v=wJfKBk1twuc', 'https://www.youtube.com/watch?v=CJ6lwx3Layk']],
  ['PP10', '臀桥', 'L1', '髋模式', ['hip'], ['基础髋伸展'], ['产后恢复常用的基础髋伸展动作。'], ['https://www.youtube.com/watch?v=GccUEieondE', 'https://www.youtube.com/watch?v=dodjximVxVk']],
  ['PP11', '四足游泳', 'L2', '支撑模式', ['core'], ['躯干稳定与四肢分离'], ['四足位对侧伸展，建立支撑控制。'], ['https://www.youtube.com/watch?v=LaLKNS7mxrk', 'https://blueskypt.com/videos/bird-dog/']],
  ['PP12', '四足跪姿单臂胸椎旋转', 'L2', '支撑模式', ['rotation'], ['胸椎活动与肩带稳定'], ['在四足位中进行受控胸椎旋转。'], ['https://www.youtube.com/watch?v=cLEI3hm98PA', 'https://www.youtube.com/watch?v=snzLuyYgbVI']],
  ['PP13', '高位支撑前跨步转体', 'L3', '支撑模式', ['core', 'rotation'], ['动态支撑与髋屈控制'], ['从静态稳定走向动态整合。'], ['https://www.youtube.com/watch?v=qCDFp8cPrqw', 'https://www.youtube.com/watch?v=wQOJDsdb_-Y']],
  ['PP14', '高位平板前跨步', 'L3', '支撑模式', ['core', 'single'], ['核心稳定与髋屈控制'], ['高位平板中加入前跨步挑战。'], ['https://www.menshealth.com/fitness/a39739172/spider-man-lunge-partner-workout/', 'https://www.youtube.com/watch?v=rLxleaS1h-c']],
  ['PP15', '支撑膝撞', 'L3', '支撑模式', ['core'], ['腹壁控制与髋屈结合'], ['支撑位膝撞，提升动态抗伸展。'], ['https://www.youtube.com/watch?v=kXUHAYe215c', 'https://www.youtube.com/watch?v=rte-AzwLcUw']],
  ['PP16', '平板支撑', 'L3', '支撑模式', ['core'], ['前侧支撑与张力传递'], ['基础而关键的前侧支撑动作。'], ['https://www.nasm.org/resource-center/exercise-library/plank', 'https://www.patterson-pt.com/videos']],
  ['PP17', '平板位主动收腹 / 骨盆后倾', 'L3', '支撑模式', ['core'], ['腹壁参与与骨盆位置控制'], ['在平板基础上强化主动收腹。'], ['https://www.youtube.com/watch?v=S53wIIZNBf0', 'https://www.youtube.com/watch?v=O5Ml9Z50dTs']],
  ['PP18', '侧支撑转体', 'L4', '支撑模式', ['core', 'rotation'], ['侧链稳定与旋转控制'], ['高阶侧向支撑结合转体。'], ['https://www.youtube.com/watch?v=Qo0j8L8sXJk', 'https://www.youtube.com/watch?v=c0Znb49CERM']],
  ['PP19', '侧支撑顶髋', 'L3', '支撑模式', ['core'], ['侧链稳定与臀中肌激活'], ['兼顾侧向支撑和髋外展能力。'], ['https://www.bodi.com/blog/side-plank-hip-lifts', 'https://vimeo.com/649281250']],
  ['PP20', '四足支撑', 'L1', '支撑模式', ['core'], ['基础支撑建位'], ['后续四足与爬行训练的起点。'], ['https://library.theprehabguys.com/vimeo-video/quadruped-position-isometric-hold/', 'https://zaccupples.com/quadruped-hold/']],
  ['PP21', '站立 360° 呼吸控制', 'L0', '呼吸 / 核心控制', ['core'], ['呼吸与腹压感知'], ['从站立位建立 360° 呼吸控制。'], ['https://www.youtube.com/watch?v=4KhtReabG2o', 'https://www.youtube.com/watch?v=kLIc56f1gk0']],
  ['PP22', '腹横肌呼吸—肢体联动串联', 'L0 → L2', '呼吸 / 核心控制', ['core'], ['呼吸控制与肢体联动'], ['将呼吸进一步串联到肢体动作。'], ['https://www.youtube.com/watch?v=J82VHm0IRwA', 'https://www.youtube.com/watch?v=ReljeItc27Y']],
  ['PP23', '普拉提单腿伸展', 'L3', '呼吸 / 核心控制', ['core'], ['腹部控制与四肢分离'], ['在腹压稳定下进行单腿交替伸展。'], ['https://www.youtube.com/watch?v=-5-NRRq6q1M', 'https://www.youtube.com/watch?v=dWTA33G8SZ0']],
  ['PP24', '普拉提双腿伸展', 'L4', '呼吸 / 核心控制', ['core'], ['高阶前侧核心控制'], ['要求更强腹压维持的双腿伸展。'], ['https://www.youtube.com/watch?v=qD58bbjzcm0', 'https://www.youtube.com/watch?v=N-jZas9tMSU']],
  ['PP25', '普拉提十字交叉', 'L4', '呼吸 / 核心控制', ['core', 'rotation'], ['旋转型腹部控制'], ['进入高阶核心旋转整合阶段。'], ['https://www.youtube.com/watch?v=0K_NerG1-jw', 'https://www.youtube.com/watch?v=5gC-k_jIFOo']],
  ['PP26', '死虫式', 'L2', '呼吸 / 核心控制', ['core'], ['抗伸展与呼吸协同'], ['在产后恢复与普通训练中都可作为核心基础。'], ['https://www.youtube.com/watch?v=deadbug', 'https://www.youtube.com/watch?v=deadbug-secondary']],
]

const parseLevels = (label: string): Level[] => label.split('→').map((level) => level.trim().toLowerCase() as Level)

export const postpartumMovements: ActionEntity[] = ppSeeds.map(([id, name, levelLabel, category, movementPatterns, goals, scenarios, videoPair]) => {
  const [primaryVideo, secondaryVideo] = videoPair
  return {
    id: id.toLowerCase(),
    name,
    englishName: id,
    category,
    movementPatterns,
    level: parseLevels(levelLabel),
    goals,
    scenarios,
    coachCues: ['保持呼吸连续，骨盆与肋骨稳定。', '动作质量优先，不用疲劳掩盖控制问题。'],
    commonErrors: ['屏气、腰部抢力、腹壁外鼓或借惯性完成。'],
    regressions: ['缩小动作范围', '增加支撑或降低负荷'],
    progressions: ['增加停留与节奏控制', '逐步进入更复杂的整合动作'],
    primaryVideo,
    secondaryVideo,
    riskNotes: ['如出现疼痛、漏尿、坠胀、明显 Doming、屏气或症状加重，应立即退阶或停止。'],
    cardContent: {
      overview: scenarios[0],
      trainingTarget: goals.join('；'),
      setup: '先找到稳定支撑和舒适活动范围，确认呼吸可以连续，再开始动作。',
      coachingPoints: ['保持呼吸连续，骨盆与肋骨稳定。', '动作质量优先，不用疲劳掩盖控制问题。'],
      progression: `退阶：${['缩小动作范围', '增加支撑或降低负荷'].join('、')}；进阶：${['增加停留与节奏控制', '逐步进入更复杂的整合动作'].join('、')}`,
      stopSignals: ['疼痛', '漏尿', '坠胀或膨出感', '明显 Doming', '屏气或症状加重'],
    },
  }
})

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
  name: item.displayName,
  tag: programmingPrepTags[item.phase],
  prescription: formatPrescription(item.prescription, item.laterality),
})

const toLegacyProgrammingRampUp = (
  item: ProgrammingTemplateLevel['rampUp'][number],
): TemplateLevel['warmup'][number] => ({
  name: item.displayName,
  tag: 'Specific Ramp-up',
  prescription: [
    '第 ' + String(item.order) + ' 组',
    formatCount(item.reps, ' 次') + (item.laterality === 'unilateral' ? ' / 侧' : ''),
    item.loadGuidance,
    item.restSeconds === undefined ? '' : '休息 ' + formatCount(item.restSeconds, ' 秒'),
  ].filter(Boolean).join(' · '),
})

const toLegacyProgrammingExercise = (
  item: TrainingExercise,
  block: TrainingBlock,
): TemplateLevel['exercises'][number] => ({
  name: item.displayName,
  pattern: programmingPatternLabels[item.movementPattern],
  prescription: formatPrescription(
    item.prescription,
    item.laterality,
    block.kind === 'strength'
      ? item.restSeconds ?? block.restBetweenSetsSeconds
      : undefined,
  ),
})

const toLegacyProgrammingMetrics = (
  source: ProgrammingTemplateLevel,
): TemplateLevel['metrics'] => {
  const circuit = source.blocks.find((block) => block.kind === 'circuit')
  const primary = source.blocks
    .flatMap((block) => block.exercises)
    .find((item) => item.role === 'PRIMARY')
  const rounds = circuit?.rounds === undefined
    ? source.blocks
      .flatMap((block) => block.exercises)
      .reduce((total, item) => total + (typeof item.prescription.sets === 'number' ? item.prescription.sets : 0), 0) + ' 组'
    : formatCount(circuit.rounds, ' 轮')
  const intensity = primary?.prescription.rpe !== undefined
    ? 'RPE ' + formatCount(primary.prescription.rpe)
    : primary?.prescription.rir !== undefined
      ? 'RIR ' + formatCount(primary.prescription.rir)
      : '按动作处方'
  const rest = circuit?.restBetweenRoundsSeconds !== undefined
    ? '轮间 ' + formatCount(circuit.restBetweenRoundsSeconds, ' 秒')
    : source.blocks[0]?.restBetweenSetsSeconds === undefined
      ? '按动作处方'
      : formatCount(source.blocks[0].restBetweenSetsSeconds, ' 秒')

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
  source: ProgrammingTemplateLevel,
  levelIndex: number,
): TemplateLevel => {
  const metrics = toLegacyProgrammingMetrics(source)
  return {
    label: 'L' + String(levelIndex + 1),
    focus: levelNames[levelIndex],
    warmup: [
      ...source.prep.map(toLegacyProgrammingPrep),
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

const programmingTemplateById = new Map(threeCTemplates.map((template) => [template.id, template]))

export const templates: Template[] = templateSeeds.map(([id, code, system, name, description]) => {
  const programmingTemplate = system === '3c' ? programmingTemplateById.get(id) : undefined
  return {
    id,
    code,
    system,
    name,
    description,
    levels: programmingTemplate
      ? {
        l1: toLegacyProgrammingLevel(programmingTemplate.levels.l1, 0),
        l2: toLegacyProgrammingLevel(programmingTemplate.levels.l2, 1),
        l3: toLegacyProgrammingLevel(programmingTemplate.levels.l3, 2),
        l4: toLegacyProgrammingLevel(programmingTemplate.levels.l4, 3),
      }
      : {
        l1: toTemplateLevel(legacyTemplateContent[id].l1, 0),
        l2: toTemplateLevel(legacyTemplateContent[id].l2, 1),
        l3: toTemplateLevel(legacyTemplateContent[id].l3, 2),
        l4: toTemplateLevel(legacyTemplateContent[id].l4, 3),
      },
  }
})

export type LibraryActionSource = {
  templateId: string
  templateName: string
  level: Exclude<Level, 'l0'>
  role: 'warmup' | 'main'
  prescription: string
}

export type LibraryAction = {
  id: string
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
let actionSequence = 0
const addLibraryAction = (name: string, context: string, role: LibraryActionSource['role'], source: LibraryActionSource) => {
  const key = `${role}::${name}::${context}`
  const existing = actionIndex.get(key)
  if (existing) {
    existing.sources.push(source)
    return
  }
  actionIndex.set(key, {
    id: `action-${String(++actionSequence).padStart(3, '0')}`,
    name,
    category: role === 'warmup' ? '热身与动作准备' : '普通训练动作',
    context,
    goals: role === 'warmup' ? ['提高体温并建立动作准备'] : ['在模板中完成稳定、可重复的训练刺激'],
    coachCues: ['保持连续呼吸，先确认控制质量，再进入更高强度。', '技术下降或出现不适时，降低复杂度或回到更低等级。'],
    regressions: ['减少动作范围', '降低负荷或节奏'],
    progressions: ['增加负荷或动作复杂度', '在不破坏动作质量的前提下提高密度'],
    sources: [source],
  })
}

for (const template of templates) {
  for (const level of ['l1', 'l2', 'l3', 'l4'] as const) {
    const current = template.levels[level]
    current.warmup.forEach((item) => addLibraryAction(item.name, item.tag, 'warmup', {
      templateId: template.id, templateName: template.name, level, role: 'warmup', prescription: item.prescription,
    }))
    current.exercises.forEach((exercise) => addLibraryAction(exercise.name, exercise.pattern, 'main', {
      templateId: template.id, templateName: template.name, level, role: 'main', prescription: exercise.prescription,
    }))
  }
}

export const libraryActions = [...actionIndex.values()]
export const getLibraryAction = (id: string) => libraryActions.find((action) => action.id === id)
export const getLibraryActionId = (name: string, context: string, role?: LibraryActionSource['role']) => {
  const roles = role ? [role] : (['warmup', 'main'] as const)
  for (const candidateRole of roles) {
    const action = actionIndex.get(`${candidateRole}::${name}::${context}`)
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
export const getPostpartumMovement = (id: string) => postpartumMovements.find((movement) => movement.id === id)
