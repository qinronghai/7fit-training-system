import type {
  PPBreathingStrategy,
  PPCanonicalMapping,
  PPCapability,
  PPMethodNode,
  PPMethodNodeId,
  PPMethodNodeKind,
  PPMethodNodeRole,
  PPPathway,
  PPProgressionLevel,
  PPQualityGate,
  PPVerificationLedgerEntry,
} from './types'

const continuousBreathing: PPBreathingStrategy = {
  mode: 'continuous',
  pressureIntent: '维持胸廓—骨盆控制，同时保持连续、不过度用力的呼吸。',
  mustMaintainBreathing: true,
  failureSigns: ['屏气', '吸气时腰椎代偿', '明显肋骨外翻', '耸肩'],
}

const phaseCuedBreathing: PPBreathingStrategy = {
  mode: 'phase-cued',
  inhale: '控制回落或准备下一次重复。',
  exhale: '完成主要发力或稳定阶段。',
  pressureIntent: '呼气时组织腹壁参与，完成动作而不牺牲躯干位置。',
  mustMaintainBreathing: true,
  failureSigns: ['发力时屏气', '呼气后无法恢复吸气', '顶端腰椎过伸'],
}

const resetBreathing: PPBreathingStrategy = {
  mode: 'reset',
  inhale: '扩张胸廓和后外侧肋骨。',
  exhale: '感受腹壁回收与骨盆—肋骨堆叠。',
  pressureIntent: '用呼吸建立可重复的腹压与躯干位置，而非追求最大用力。',
  mustMaintainBreathing: true,
  failureSigns: ['呼吸变浅', '颈肩代偿', '腹壁持续外鼓'],
}

const defaultQualityGate: PPQualityGate = {
  passRule: 'all',
  criteria: [
    { code: 'BREATH', domain: 'breathing', requirement: '在规定重复或停留期间保持连续呼吸。' },
    { code: 'POSITION', domain: 'position', requirement: '保持起始位与目标躯干、骨盆位置。' },
    { code: 'CONTROL', domain: 'control', requirement: '动作范围内无明显代偿或借惯性完成。' },
  ],
}

const mapping = {
  mapped: (exerciseId: string): PPCanonicalMapping => ({ status: 'mapped', exerciseId }),
  variant: (exerciseId: string, variantId: string): PPCanonicalMapping => ({ status: 'variant', exerciseId, variantId }),
  methodOnly: (): PPCanonicalMapping => ({ status: 'method-only' }),
  add: (proposedExerciseId: string): PPCanonicalMapping => ({ status: 'add-candidate', proposedExerciseId }),
  verify: (reason: string): PPCanonicalMapping => ({ status: 'verify', reason }),
}

type NodeOptions = {
  id: PPMethodNodeId
  kind: PPMethodNodeKind
  mapping: PPCanonicalMapping
  primaryPathway: PPPathway
  progressionLevel: PPProgressionLevel
  role: PPMethodNodeRole
  capabilities: readonly PPCapability[]
  source?: PPMethodNode['source']
  secondaryPathways?: readonly PPPathway[]
  hostExerciseId?: string
  breathing?: PPBreathingStrategy
  qualityGate?: PPQualityGate
  commonCompensations?: readonly string[]
  coachNotes?: readonly string[]
}

const node = (options: NodeOptions): PPMethodNode => ({
  ...options,
  breathing: options.breathing ?? continuousBreathing,
  qualityGate: options.qualityGate ?? defaultQualityGate,
  commonCompensations: options.commonCompensations ?? ['屏气或用惯性完成动作。'],
})

const source = (sourceId: string, sourceName: string): PPMethodNode['source'] => ({
  sourceId: sourceId as `PP${string}`,
  sourceName,
  origin: 'postpartum-course',
})

export const ppMethodNodes: readonly PPMethodNode[] = [
  node({ id: 'pp01', source: source('PP01', '髋主导蹲'), kind: 'variant', mapping: mapping.variant('squat', 'pp01-hip-dominant-squat'), primaryPathway: 'squat', progressionLevel: 'P1', role: 'foundation', capabilities: ['hip-hinge', 'pelvic-control', 'rib-pelvis-control'] }),
  node({ id: 'pp02', source: source('PP02', '髋铰链拉'), kind: 'variant', mapping: mapping.variant('hinge-drill', 'pp02-hip-hinge-pull'), primaryPathway: 'hinge', progressionLevel: 'P1', role: 'foundation', capabilities: ['hip-hinge', 'hip-extension', 'rib-pelvis-control'] }),
  node({ id: 'pp03', source: source('PP03', '硬拉推肩'), kind: 'exercise', mapping: mapping.mapped('deadlift-to-overhead-press'), primaryPathway: 'integration', secondaryPathways: ['hinge', 'support'], progressionLevel: 'P4', role: 'integration', capabilities: ['hip-hinge', 'hip-extension', 'force-transfer', 'shoulder-support'], breathing: phaseCuedBreathing }),
  node({ id: 'pp04', source: source('PP04', '90/90 髋转换'), kind: 'variant', mapping: mapping.variant('90-90-hip-rotation', 'pp04-90-90-hip-switch'), primaryPathway: 'hip-rotation', progressionLevel: 'P1', role: 'foundation', capabilities: ['hip-rotation', 'pelvic-control'] }),
  node({ id: 'pp05', source: source('PP05', '90/90 胫骨箱顶髋'), kind: 'exercise', mapping: mapping.mapped('shin-box-hip-lift'), primaryPathway: 'hip-rotation', progressionLevel: 'P2', role: 'bridge', capabilities: ['hip-rotation', 'hip-extension', 'pelvic-control'] }),
  node({ id: 'pp06', source: source('PP06', '坐姿骨盆髋走'), kind: 'drill', mapping: mapping.methodOnly(), primaryPathway: 'locomotion', secondaryPathways: ['hip-rotation'], progressionLevel: 'P1', role: 'drill', capabilities: ['pelvic-control', 'weight-shift', 'breathing-control'], breathing: resetBreathing }),
  node({ id: 'pp07', source: source('PP07', '低位鸭步'), kind: 'exercise', mapping: mapping.mapped('duck-walk'), primaryPathway: 'locomotion', secondaryPathways: ['squat', 'frontal-plane'], progressionLevel: 'P3', role: 'optional', capabilities: ['locomotion', 'weight-shift', 'hip-abduction'] }),
  node({ id: 'pp08', source: source('PP08', '侧卧髋内收'), kind: 'exercise', mapping: mapping.mapped('side-lying-hip-adduction'), primaryPathway: 'frontal-plane', secondaryPathways: ['lateral-support'], progressionLevel: 'P1', role: 'foundation', capabilities: ['hip-adduction', 'pelvic-control'] }),
  node({ id: 'pp09', source: source('PP09', '弹力带半蹲侧向走'), kind: 'variant', mapping: mapping.variant('band-lateral-walk', 'pp09-band-lateral-walk-half-squat'), primaryPathway: 'frontal-plane', secondaryPathways: ['locomotion', 'squat'], progressionLevel: 'P2', role: 'bridge', capabilities: ['hip-abduction', 'weight-shift', 'pelvic-control', 'locomotion'] }),
  node({ id: 'pp10', source: source('PP10', '臀桥'), kind: 'exercise', mapping: mapping.mapped('glute-bridge'), primaryPathway: 'hip-extension', progressionLevel: 'P1', role: 'base', capabilities: ['hip-extension', 'pelvic-control'], breathing: phaseCuedBreathing }),
  node({ id: 'pp11', source: source('PP11', '四足游泳'), kind: 'variant', mapping: mapping.variant('bird-dog', 'pp11-contralateral-bird-dog'), primaryPathway: 'support', secondaryPathways: ['core'], progressionLevel: 'P3', role: 'integration', capabilities: ['contralateral-control', 'anti-rotation', 'rib-pelvis-control', 'breathing-control'] }),
  node({ id: 'pp12', source: source('PP12', '四足跪姿单臂胸椎旋转'), kind: 'variant', mapping: mapping.variant('thoracic-rotation', 'pp12-quadruped-thoracic-rotation'), primaryPathway: 'thoracic-rotation', secondaryPathways: ['support'], progressionLevel: 'P2', role: 'bridge', capabilities: ['rotation', 'shoulder-support', 'pelvic-control'] }),
  node({ id: 'pp13', source: source('PP13', '高位支撑前跨步转体'), kind: 'variant', mapping: mapping.variant('high-plank-step-through', 'pp13-high-plank-step-through-rotation'), primaryPathway: 'integration', secondaryPathways: ['support', 'locomotion', 'thoracic-rotation'], progressionLevel: 'P3', role: 'integration', capabilities: ['shoulder-support', 'anti-rotation', 'rotation', 'locomotion', 'force-transfer'] }),
  node({ id: 'pp14', source: source('PP14', '高位平板前跨步'), kind: 'exercise', mapping: mapping.mapped('high-plank-step-through'), primaryPathway: 'support', secondaryPathways: ['locomotion'], progressionLevel: 'P3', role: 'bridge', capabilities: ['shoulder-support', 'anti-extension', 'weight-shift', 'locomotion'] }),
  node({ id: 'pp15', source: source('PP15', '支撑膝撞'), kind: 'exercise', mapping: mapping.mapped('cross-body-plank-knee-drive'), primaryPathway: 'support', progressionLevel: 'P3', role: 'bridge', capabilities: ['shoulder-support', 'anti-extension', 'weight-shift'] }),
  node({ id: 'pp16', source: source('PP16', '平板支撑'), kind: 'exercise', mapping: mapping.mapped('plank'), primaryPathway: 'support', secondaryPathways: ['core'], progressionLevel: 'P2', role: 'base', capabilities: ['shoulder-support', 'anti-extension', 'rib-pelvis-control'] }),
  node({ id: 'pp17', source: source('PP17', '平板位主动收腹 / 骨盆后倾'), kind: 'drill', mapping: mapping.methodOnly(), hostExerciseId: 'plank', primaryPathway: 'support', progressionLevel: 'P1', role: 'drill', capabilities: ['rib-pelvis-control', 'pelvic-control', 'breathing-control'], breathing: resetBreathing, coachNotes: ['该节点是依附于 plank 执行的控制 Drill，不是独立 exercise variant。'] }),
  node({ id: 'pp18', source: source('PP18', '侧支撑转体'), kind: 'variant', mapping: mapping.variant('side-plank', 'pp18-side-plank-rotation'), primaryPathway: 'lateral-support', secondaryPathways: ['thoracic-rotation'], progressionLevel: 'P4', role: 'integration', capabilities: ['anti-lateral-flexion', 'shoulder-support', 'rotation', 'force-transfer'] }),
  node({ id: 'pp19', source: source('PP19', '侧支撑顶髋'), kind: 'variant', mapping: mapping.variant('side-plank', 'pp19-side-plank-hip-lift'), primaryPathway: 'lateral-support', secondaryPathways: ['frontal-plane'], progressionLevel: 'P3', role: 'bridge', capabilities: ['anti-lateral-flexion', 'shoulder-support', 'hip-abduction', 'pelvic-control'] }),
  node({ id: 'pp20', source: source('PP20', '四足支撑'), kind: 'drill', mapping: mapping.methodOnly(), primaryPathway: 'support', progressionLevel: 'P0', role: 'foundation', capabilities: ['shoulder-support', 'rib-pelvis-control', 'breathing-control'], breathing: resetBreathing }),
  node({ id: 'pp21', source: source('PP21', '站立 360° 呼吸控制'), kind: 'breathing', mapping: mapping.methodOnly(), primaryPathway: 'breath', secondaryPathways: ['core'], progressionLevel: 'P0', role: 'foundation', capabilities: ['breathing-control', 'rib-pelvis-control'], breathing: resetBreathing }),
  node({ id: 'pp22', source: source('PP22', '腹横肌呼吸—肢体联动串联'), kind: 'breathing', mapping: mapping.methodOnly(), primaryPathway: 'breath', secondaryPathways: ['core', 'integration'], progressionLevel: 'P1', role: 'bridge', capabilities: ['breathing-control', 'rib-pelvis-control', 'force-transfer'], breathing: phaseCuedBreathing }),
  node({ id: 'pp23', source: source('PP23', '普拉提单腿伸展'), kind: 'exercise', mapping: mapping.mapped('pilates-single-leg-stretch'), primaryPathway: 'core', progressionLevel: 'P3', role: 'integration', capabilities: ['anti-extension', 'breathing-control', 'contralateral-control'] }),
  node({ id: 'pp24', source: source('PP24', '普拉提双腿伸展'), kind: 'exercise', mapping: mapping.mapped('pilates-double-leg-stretch'), primaryPathway: 'core', progressionLevel: 'P4', role: 'integration', capabilities: ['anti-extension', 'breathing-control', 'force-transfer'] }),
  node({ id: 'pp25', source: source('PP25', '普拉提十字交叉'), kind: 'exercise', mapping: mapping.mapped('pilates-criss-cross'), primaryPathway: 'core', secondaryPathways: ['thoracic-rotation'], progressionLevel: 'P4', role: 'integration', capabilities: ['anti-extension', 'rotation', 'breathing-control'] }),
  node({ id: 'pp26', source: source('PP26', '死虫式'), kind: 'exercise', mapping: mapping.mapped('dead-bug'), primaryPathway: 'core', progressionLevel: 'P2', role: 'base', capabilities: ['anti-extension', 'rib-pelvis-control', 'contralateral-control', 'breathing-control'] }),

  node({ id: 'exp-supine-90-90-breathing', kind: 'breathing', mapping: mapping.methodOnly(), primaryPathway: 'breath', secondaryPathways: ['hip-rotation'], progressionLevel: 'P0', role: 'foundation', capabilities: ['breathing-control', 'rib-pelvis-control'], breathing: resetBreathing }),
  node({ id: 'exp-side-lying-breathing', kind: 'breathing', mapping: mapping.methodOnly(), primaryPathway: 'breath', secondaryPathways: ['lateral-support'], progressionLevel: 'P0', role: 'foundation', capabilities: ['breathing-control', 'rib-pelvis-control'], breathing: resetBreathing }),
  node({ id: 'exp-quadruped-single-limb-lift', kind: 'variant', mapping: mapping.variant('bird-dog', 'exp-quadruped-single-limb-lift'), primaryPathway: 'support', secondaryPathways: ['core'], progressionLevel: 'P2', role: 'bridge', capabilities: ['shoulder-support', 'anti-rotation', 'weight-shift', 'rib-pelvis-control'] }),
  node({ id: 'exp-incline-plank', kind: 'variant', mapping: mapping.variant('plank', 'exp-incline-plank'), primaryPathway: 'support', secondaryPathways: ['core'], progressionLevel: 'P1', role: 'foundation', capabilities: ['shoulder-support', 'anti-extension', 'rib-pelvis-control'] }),
  node({ id: 'exp-incline-support-weight-shift', kind: 'variant', mapping: mapping.variant('plank', 'exp-incline-support-weight-shift'), primaryPathway: 'support', progressionLevel: 'P1', role: 'bridge', capabilities: ['shoulder-support', 'weight-shift', 'anti-rotation'] }),
  node({ id: 'exp-plank-march', kind: 'variant', mapping: mapping.variant('plank', 'exp-plank-march'), primaryPathway: 'support', secondaryPathways: ['locomotion'], progressionLevel: 'P2', role: 'bridge', capabilities: ['shoulder-support', 'anti-rotation', 'weight-shift', 'locomotion'] }),
  node({ id: 'exp-short-forward-step-high-plank', kind: 'variant', mapping: mapping.variant('high-plank-step-through', 'exp-short-forward-step-high-plank'), primaryPathway: 'support', secondaryPathways: ['locomotion'], progressionLevel: 'P2', role: 'bridge', capabilities: ['shoulder-support', 'anti-extension', 'weight-shift', 'locomotion'] }),
  node({ id: 'exp-knee-side-plank', kind: 'variant', mapping: mapping.variant('side-plank', 'exp-knee-side-plank'), primaryPathway: 'lateral-support', progressionLevel: 'P1', role: 'foundation', capabilities: ['anti-lateral-flexion', 'shoulder-support', 'pelvic-control'] }),
  node({ id: 'exp-standard-side-plank', kind: 'exercise', mapping: mapping.mapped('side-plank'), primaryPathway: 'lateral-support', progressionLevel: 'P2', role: 'base', capabilities: ['anti-lateral-flexion', 'shoulder-support', 'pelvic-control'] }),
  node({ id: 'exp-side-plank-reach', kind: 'variant', mapping: mapping.variant('side-plank', 'exp-side-plank-reach'), primaryPathway: 'lateral-support', secondaryPathways: ['thoracic-rotation'], progressionLevel: 'P3', role: 'bridge', capabilities: ['anti-lateral-flexion', 'shoulder-support', 'rotation', 'force-transfer'] }),
  node({ id: 'exp-partial-side-plank-rotation', kind: 'variant', mapping: mapping.variant('side-plank', 'exp-partial-side-plank-rotation'), primaryPathway: 'lateral-support', secondaryPathways: ['thoracic-rotation'], progressionLevel: 'P3', role: 'bridge', capabilities: ['anti-lateral-flexion', 'shoulder-support', 'rotation'] }),
  node({ id: 'exp-glute-bridge-march', kind: 'variant', mapping: mapping.variant('glute-bridge', 'exp-glute-bridge-march'), primaryPathway: 'hip-extension', secondaryPathways: ['core'], progressionLevel: 'P2', role: 'bridge', capabilities: ['hip-extension', 'pelvic-control', 'anti-rotation', 'weight-shift'] }),
  node({ id: 'exp-single-leg-glute-bridge', kind: 'exercise', mapping: mapping.mapped('single-leg-glute-bridge'), primaryPathway: 'hip-extension', secondaryPathways: ['core'], progressionLevel: 'P3', role: 'integration', capabilities: ['hip-extension', 'pelvic-control', 'anti-rotation'] }),
  node({ id: 'exp-wall-touch-hinge', kind: 'variant', mapping: mapping.variant('hinge-drill', 'exp-wall-touch-hinge'), primaryPathway: 'hinge', progressionLevel: 'P0', role: 'drill', capabilities: ['hip-hinge', 'hip-extension', 'pelvic-control'] }),
  node({ id: 'exp-dowel-three-point-hinge', kind: 'variant', mapping: mapping.variant('hinge-drill', 'exp-dowel-three-point-hinge'), primaryPathway: 'hinge', progressionLevel: 'P1', role: 'drill', capabilities: ['hip-hinge', 'rib-pelvis-control', 'pelvic-control'] }),
  node({ id: 'exp-assisted-sit-to-stand', kind: 'variant', mapping: mapping.variant('box-squat', 'exp-assisted-sit-to-stand'), primaryPathway: 'squat', progressionLevel: 'P0', role: 'foundation', capabilities: ['weight-shift', 'pelvic-control', 'hip-extension'] }),
  node({ id: 'exp-box-squat', kind: 'exercise', mapping: mapping.mapped('box-squat'), primaryPathway: 'squat', progressionLevel: 'P1', role: 'base', capabilities: ['pelvic-control', 'hip-extension', 'weight-shift'] }),
  node({ id: 'exp-supported-90-90', kind: 'variant', mapping: mapping.variant('90-90-hip-rotation', 'exp-supported-90-90'), primaryPathway: 'hip-rotation', progressionLevel: 'P0', role: 'foundation', capabilities: ['hip-rotation', 'pelvic-control'] }),
  node({ id: 'exp-static-90-90', kind: 'variant', mapping: mapping.variant('90-90-hip-rotation', 'exp-static-90-90'), primaryPathway: 'hip-rotation', progressionLevel: 'P1', role: 'base', capabilities: ['hip-rotation', 'pelvic-control', 'breathing-control'] }),
  node({ id: 'exp-long-lever-side-lying-adduction', kind: 'variant', mapping: mapping.variant('side-lying-hip-adduction', 'exp-long-lever-side-lying-adduction'), primaryPathway: 'frontal-plane', secondaryPathways: ['lateral-support'], progressionLevel: 'P2', role: 'bridge', capabilities: ['hip-adduction', 'pelvic-control', 'anti-lateral-flexion'] }),
  node({ id: 'exp-short-lever-copenhagen', kind: 'variant', mapping: mapping.variant('copenhagen-plank', 'exp-short-lever-copenhagen'), primaryPathway: 'lateral-support', progressionLevel: 'P2', role: 'bridge', capabilities: ['hip-adduction', 'anti-lateral-flexion', 'shoulder-support'] }),
  node({ id: 'exp-full-copenhagen', kind: 'exercise', mapping: mapping.mapped('copenhagen-plank'), primaryPathway: 'lateral-support', progressionLevel: 'P3', role: 'integration', capabilities: ['hip-adduction', 'anti-lateral-flexion', 'shoulder-support'] }),
  node({ id: 'exp-standing-lateral-weight-shift', kind: 'drill', mapping: mapping.methodOnly(), primaryPathway: 'frontal-plane', secondaryPathways: ['locomotion'], progressionLevel: 'P0', role: 'drill', capabilities: ['weight-shift', 'hip-abduction', 'pelvic-control'], breathing: resetBreathing }),
  node({ id: 'exp-basic-hip-abduction', kind: 'exercise', mapping: mapping.mapped('hip-abduction'), primaryPathway: 'frontal-plane', progressionLevel: 'P1', role: 'base', capabilities: ['hip-abduction', 'pelvic-control'] }),
  node({ id: 'exp-standing-march', kind: 'exercise', mapping: mapping.mapped('standing-march'), primaryPathway: 'locomotion', secondaryPathways: ['frontal-plane'], progressionLevel: 'P1', role: 'base', capabilities: ['weight-shift', 'contralateral-control', 'hip-abduction'] }),
  node({ id: 'exp-open-book', kind: 'exercise', mapping: mapping.mapped('side-lying-open-book'), primaryPathway: 'thoracic-rotation', secondaryPathways: ['breath'], progressionLevel: 'P0', role: 'foundation', capabilities: ['rotation', 'breathing-control'] }),
  node({ id: 'exp-half-squat-low-locomotion', kind: 'variant', mapping: mapping.variant('duck-walk', 'exp-half-squat-low-locomotion'), primaryPathway: 'locomotion', secondaryPathways: ['squat'], progressionLevel: 'P3', role: 'integration', capabilities: ['locomotion', 'weight-shift', 'hip-abduction'] }),
]

export const ppMethodNodeById: ReadonlyMap<PPMethodNodeId, PPMethodNode> = new Map(
  ppMethodNodes.map((methodNode) => [methodNode.id, methodNode]),
)

export const ppVerificationLedger: readonly PPVerificationLedgerEntry[] = []
