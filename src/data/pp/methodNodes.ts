import type {
  PPBreathingStrategy,
  PPCanonicalMapping,
  PPCapability,
  PPMethodNode,
  PPMethodNodeId,
  PPMethodNodeKind,
  PPMethodNodeRole,
  PPMethodReadinessProfile,
  PPMethodReadinessProfileId,
  PPPathway,
  PPProgressionLevel,
  PPQualityCriterion,
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

const criteria = (...items: PPQualityCriterion[]): PPQualityGate => ({
  passRule: 'all',
  criteria: items,
})

const readiness = (
  qualityGate: PPQualityGate,
  commonCompensations: readonly string[],
): PPMethodReadinessProfile => ({ qualityGate, commonCompensations })

export const ppMethodReadinessProfiles:
  Readonly<Record<PPMethodReadinessProfileId, PPMethodReadinessProfile>> = {
    'breath-rib-pelvis-foundation': readiness(
      criteria(
        { code: 'BREATH', domain: 'breathing', requirement: '保持连续呼吸并避免屏气。' },
        { code: 'RIB_PELVIS', domain: 'position', requirement: '保持肋骨与骨盆堆叠。' },
        { code: 'CONTROL', domain: 'control', requirement: '以可重复的躯干控制完成动作。' },
      ),
      ['屏气或呼吸变浅。', '肋骨外翻或骨盆失去堆叠。'],
    ),
    'hinge-control': readiness(
      criteria(
        { code: 'POSITION', domain: 'position', requirement: '保持髋铰链与脊柱位置。' },
        { code: 'CONTROL', domain: 'control', requirement: '以髋主导而非腰椎代偿完成动作。' },
        { code: 'COORDINATION', domain: 'coordination', requirement: '协调髋、躯干与支撑关系。' },
        { code: 'REPETITION', domain: 'repetition', requirement: '在重复中保持一致的动作质量。' },
      ),
      ['腰椎过伸或腰椎主导。', '髋铰链丢失并用惯性完成动作。'],
    ),
    'squat-control': readiness(
      criteria(
        { code: 'POSITION', domain: 'position', requirement: '保持足部、膝部与骨盆的可控位置。' },
        { code: 'CONTROL', domain: 'control', requirement: '以可控范围完成蹲起。' },
        { code: 'COORDINATION', domain: 'coordination', requirement: '协调髋、膝与躯干的负荷转移。' },
        { code: 'REPETITION', domain: 'repetition', requirement: '连续重复时保持轨迹一致。' },
      ),
      ['骨盆卷曲或侧移。', '膝部或躯干失去控制。'],
    ),
    'hip-rotation-control': readiness(
      criteria(
        { code: 'POSITION', domain: 'position', requirement: '保持髋关节与骨盆的起始位置。' },
        { code: 'CONTROL', domain: 'control', requirement: '在髋主导范围内控制旋转。' },
        { code: 'COORDINATION', domain: 'coordination', requirement: '协调双侧髋与躯干。' },
        { code: 'TOLERANCE', domain: 'tolerance', requirement: '在可耐受范围内保持动作质量。' },
      ),
      ['骨盆跟随旋转或侧向偏移。', '失去受控的髋旋转。'],
    ),
    'hip-extension-control': readiness(
      criteria(
        { code: 'POSITION', domain: 'position', requirement: '保持骨盆与躯干位置。' },
        { code: 'CONTROL', domain: 'control', requirement: '以臀髋伸展而非腰椎过伸完成动作。' },
        { code: 'COORDINATION', domain: 'coordination', requirement: '协调髋伸展与支撑。' },
        { code: 'REPETITION', domain: 'repetition', requirement: '重复时保持骨盆控制。' },
      ),
      ['腰椎过伸。', '骨盆旋转或腘绳肌接管。'],
    ),
    'frontal-plane-weight-shift': readiness(
      criteria(
        { code: 'POSITION', domain: 'position', requirement: '保持骨盆与下肢对齐。' },
        { code: 'CONTROL', domain: 'control', requirement: '控制侧向负荷而不塌陷。' },
        { code: 'COORDINATION', domain: 'coordination', requirement: '协调髋外展与重心转移。' },
        { code: 'TOLERANCE', domain: 'tolerance', requirement: '在可耐受范围内完成侧向转移。' },
      ),
      ['躯干摆动。', '骨盆下坠或重心转移失控。'],
    ),
    'anterior-support': readiness(
      criteria(
        { code: 'BREATH', domain: 'breathing', requirement: '在支撑中保持连续呼吸。' },
        { code: 'POSITION', domain: 'position', requirement: '保持肩带、肋骨与骨盆位置。' },
        { code: 'CONTROL', domain: 'control', requirement: '维持前侧支撑而不塌陷。' },
        { code: 'DURATION', domain: 'duration', requirement: '在规定停留时间内保持动作质量。' },
      ),
      ['肩胛塌陷。', '肋骨外翻或腰椎过伸。'],
    ),
    'dynamic-support': readiness(
      criteria(
        { code: 'BREATH', domain: 'breathing', requirement: '在支撑变化中保持呼吸。' },
        { code: 'POSITION', domain: 'position', requirement: '保持肩带与躯干位置。' },
        { code: 'CONTROL', domain: 'control', requirement: '在负荷变化时保持支撑。' },
        { code: 'COORDINATION', domain: 'coordination', requirement: '协调对侧肢体与重心转移。' },
      ),
      ['支撑塌陷。', '重心转移或对侧时序失控。'],
    ),
    'lateral-support': readiness(
      criteria(
        { code: 'BREATH', domain: 'breathing', requirement: '在侧向支撑中保持呼吸。' },
        { code: 'POSITION', domain: 'position', requirement: '保持肩、躯干与骨盆侧向位置。' },
        { code: 'CONTROL', domain: 'control', requirement: '维持侧向支撑与骨盆控制。' },
        { code: 'COORDINATION', domain: 'coordination', requirement: '协调侧向支撑与旋转或外展。' },
        { code: 'DURATION', domain: 'duration', requirement: '在规定停留时间内保持支撑。' },
      ),
      ['躯干下塌。', '耸肩或骨盆下坠。'],
    ),
    'anti-extension-core': readiness(
      criteria(
        { code: 'BREATH', domain: 'breathing', requirement: '在核心负荷下保持呼吸。' },
        { code: 'POSITION', domain: 'position', requirement: '保持肋骨与骨盆堆叠。' },
        { code: 'CONTROL', domain: 'control', requirement: '抵抗伸展并保持躯干位置。' },
        { code: 'COORDINATION', domain: 'coordination', requirement: '协调四肢动作与躯干稳定。' },
        { code: 'DURATION', domain: 'duration', requirement: '在规定重复或停留内保持稳定。' },
      ),
      ['肋骨外翻。', '腰椎过伸或呼吸丢失。'],
    ),
    'rotation-integration': readiness(
      criteria(
        { code: 'BREATH', domain: 'breathing', requirement: '在整合动作中保持呼吸。' },
        { code: 'POSITION', domain: 'position', requirement: '保持躯干与骨盆位置。' },
        { code: 'CONTROL', domain: 'control', requirement: '在旋转范围内保持控制。' },
        { code: 'COORDINATION', domain: 'coordination', requirement: '协调支撑、旋转与负荷转移。' },
        { code: 'TOLERANCE', domain: 'tolerance', requirement: '在可耐受范围内保持整合质量。' },
      ),
      ['腰椎主导旋转。', '骨盆与躯干分离控制丢失。'],
    ),
    locomotion: readiness(
      criteria(
        { code: 'BREATH', domain: 'breathing', requirement: '在移动与转移中保持呼吸。' },
        { code: 'POSITION', domain: 'position', requirement: '保持躯干与骨盆位置。' },
        { code: 'CONTROL', domain: 'control', requirement: '控制步伐与落脚。' },
        { code: 'COORDINATION', domain: 'coordination', requirement: '协调步态、重心与对侧动作。' },
        { code: 'TOLERANCE', domain: 'tolerance', requirement: '在可耐受范围内保持移动质量。' },
      ),
      ['重心转移失控。', '屏气或躯干摆动。'],
    ),
  }

type TargetedReadinessOverride = Pick<PPMethodNode, 'qualityGate' | 'commonCompensations'>

const targetedReadinessOverrides: Readonly<Partial<Record<PPMethodNodeId, TargetedReadinessOverride>>> = {
  pp03: {
    qualityGate: criteria(
      { code: 'BREATH', domain: 'breathing', requirement: '在负重整合动作中保持连续呼吸。' },
      { code: 'RIB_PELVIS', domain: 'position', requirement: '保持肋骨—骨盆堆叠与躯干位置。' },
      { code: 'CONTROL', domain: 'control', requirement: '以负重髋铰链控制完成动作。' },
      { code: 'COORDINATION', domain: 'coordination', requirement: '协调髋铰链、支撑、力量传递与头顶推举整合。' },
      { code: 'TOLERANCE', domain: 'tolerance', requirement: '在可耐受范围内完成负重整合。' },
    ),
    commonCompensations: ['推举时以腰椎代偿。', '失去髋铰链或肋骨—骨盆堆叠。'],
  },
  pp05: {
    qualityGate: criteria(
      { code: 'POSITION', domain: 'position', requirement: '保持 90/90 髋位与骨盆位置。' },
      { code: 'CONTROL', domain: 'control', requirement: '控制髋旋转桥接而不借惯性。' },
      { code: 'COORDINATION', domain: 'coordination', requirement: '协调髋旋转、骨盆控制与顶髋。' },
      { code: 'HIP_EXTENSION', domain: 'control', requirement: '从受控髋旋转过渡到明确的髋伸展。' },
      { code: 'TOLERANCE', domain: 'tolerance', requirement: '在可耐受范围内保持桥接质量。' },
    ),
    commonCompensations: ['腰椎代偿髋伸展。', '骨盆旋转并失去髋控制。'],
  },
  pp11: {
    qualityGate: criteria(
      { code: 'BREATH', domain: 'breathing', requirement: '在对侧肢体分离时保持呼吸。' },
      { code: 'POSITION', domain: 'position', requirement: '保持四足支撑中的肋骨—骨盆位置。' },
      { code: 'CONTROL', domain: 'control', requirement: '在对侧负荷变化时保持支撑。' },
      { code: 'CONTRALATERAL', domain: 'coordination', requirement: '控制对侧肢体分离与回收。' },
    ),
    commonCompensations: ['对侧肢体分离时支撑塌陷。', '屏气或骨盆旋转。'],
  },
  pp13: {
    qualityGate: criteria(
      { code: 'BREATH', domain: 'breathing', requirement: '在高位支撑转体中保持呼吸。' },
      { code: 'POSITION', domain: 'position', requirement: '保持高位支撑与骨盆位置。' },
      { code: 'CONTROL', domain: 'control', requirement: '在跨步转体中保持抗旋控制。' },
      { code: 'COORDINATION', domain: 'coordination', requirement: '协调高位平板、动态转体与力量传递。' },
      { code: 'TOLERANCE', domain: 'tolerance', requirement: '在可耐受范围内完成动态整合。' },
    ),
    commonCompensations: ['力量传递中肩带或骨盆失控。', '以腰椎主导旋转。'],
  },
  pp15: {
    qualityGate: criteria(
      { code: 'BREATH', domain: 'breathing', requirement: '在交叉膝撞中保持呼吸。' },
      { code: 'POSITION', domain: 'position', requirement: '保持支撑中的肋骨—骨盆位置。' },
      { code: 'CONTROL', domain: 'control', requirement: '维持抗伸展与重心转移控制。' },
      { code: 'COORDINATION', domain: 'coordination', requirement: '协调交叉膝撞与支撑侧稳定。' },
      { code: 'HIP_FLEXION', domain: 'control', requirement: '在支撑下完成受控髋屈曲，不牺牲躯干位置。' },
    ),
    commonCompensations: ['髋屈曲时腰椎过伸。', '交叉膝撞时支撑塌陷或重心失控。'],
  },
  pp16: {
    qualityGate: criteria(
      { code: 'BREATH', domain: 'breathing', requirement: '在前侧支撑停留中保持呼吸。' },
      { code: 'POSITION', domain: 'position', requirement: '在前侧支撑中保持肋骨—骨盆堆叠。' },
      { code: 'CONTROL', domain: 'control', requirement: '保持肩带与躯干控制。' },
      { code: 'DURATION', domain: 'duration', requirement: '在规定支撑持续时间内保持动作质量。' },
    ),
    commonCompensations: ['持续支撑时肋骨外翻。', '腰椎过伸或肩胛塌陷。'],
  },
  pp18: {
    qualityGate: criteria(
      { code: 'BREATH', domain: 'breathing', requirement: '在侧向支撑转体中保持呼吸。' },
      { code: 'POSITION', domain: 'position', requirement: '保持肩带、躯干与骨盆侧向位置。' },
      { code: 'CONTROL', domain: 'control', requirement: '在侧向支撑中抵抗塌陷。' },
      { code: 'COORDINATION', domain: 'coordination', requirement: '协调旋转与力量传递而不牺牲侧向支撑。' },
      { code: 'TOLERANCE', domain: 'tolerance', requirement: '在可耐受范围内完成侧向整合。' },
    ),
    commonCompensations: ['旋转时躯干下塌。', '力量传递中耸肩或骨盆下坠。'],
  },
  pp19: {
    qualityGate: criteria(
      { code: 'BREATH', domain: 'breathing', requirement: '在侧支撑顶髋中保持呼吸。' },
      { code: 'POSITION', domain: 'position', requirement: '保持骨盆与肩带的侧向位置。' },
      { code: 'CONTROL', domain: 'control', requirement: '控制髋外展与骨盆抬升。' },
      { code: 'COORDINATION', domain: 'coordination', requirement: '协调侧向支撑、髋外展与骨盆控制。' },
      { code: 'DURATION', domain: 'duration', requirement: '在规定重复或停留内保持侧向控制。' },
    ),
    commonCompensations: ['髋外展时骨盆下坠。', '侧向支撑中躯干下塌。'],
  },
  pp23: {
    qualityGate: criteria(
      { code: 'BREATH', domain: 'breathing', requirement: '在单腿交替伸展中保持呼吸。' },
      { code: 'POSITION', domain: 'position', requirement: '保持肋骨—骨盆位置。' },
      { code: 'CONTROL', domain: 'control', requirement: '抵抗腰椎伸展并保持核心控制。' },
      { code: 'COORDINATION', domain: 'coordination', requirement: '协调单侧交替与对侧肢体整合。' },
      { code: 'TOLERANCE', domain: 'tolerance', requirement: '在可耐受范围内保持交替动作质量。' },
    ),
    commonCompensations: ['对侧肢体伸展时肋骨外翻。', '呼吸丢失或腰椎过伸。'],
  },
  pp24: {
    qualityGate: criteria(
      { code: 'BREATH', domain: 'breathing', requirement: '在双腿伸展的高负荷阶段保持呼吸。' },
      { code: 'POSITION', domain: 'position', requirement: '保持肋骨—骨盆堆叠。' },
      { code: 'CONTROL', domain: 'control', requirement: '在最高双侧伸展需求下保持抗伸展控制。' },
      { code: 'COORDINATION', domain: 'coordination', requirement: '协调双侧肢体同时伸展与躯干稳定。' },
      { code: 'DURATION', domain: 'duration', requirement: '在规定重复内保持双侧伸展质量。' },
    ),
    commonCompensations: ['双侧伸展时腰椎过伸。', '高负荷阶段屏气或肋骨外翻。'],
  },
  pp25: {
    qualityGate: criteria(
      { code: 'BREATH', domain: 'breathing', requirement: '在交叉旋转中保持呼吸。' },
      { code: 'POSITION', domain: 'position', requirement: '保持肋骨—骨盆位置并区分躯干与骨盆。' },
      { code: 'CONTROL', domain: 'control', requirement: '在旋转范围内保持抗伸展控制。' },
      { code: 'COORDINATION', domain: 'coordination', requirement: '协调对侧旋转与核心力量传递。' },
      { code: 'TOLERANCE', domain: 'tolerance', requirement: '在可耐受范围内完成旋转整合。' },
    ),
    commonCompensations: ['腰椎主导旋转。', '失去骨盆与躯干分离控制。'],
  },
  pp26: {
    qualityGate: criteria(
      { code: 'BREATH', domain: 'breathing', requirement: '在死虫式重复中保持呼吸。' },
      { code: 'POSITION', domain: 'position', requirement: '重复动作时保持肋骨—骨盆堆叠。' },
      { code: 'CONTROL', domain: 'control', requirement: '抵抗伸展并保持核心基础控制。' },
      { code: 'COORDINATION', domain: 'coordination', requirement: '协调四肢动作而不改变躯干位置。' },
      { code: 'REPETITION', domain: 'repetition', requirement: '在重复中保持可再现的肋骨—骨盆位置。' },
    ),
    commonCompensations: ['重复时肋骨外翻。', '骨盆位置丢失或呼吸变浅。'],
  },
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
  readinessProfile: PPMethodReadinessProfileId
  source?: PPMethodNode['source']
  secondaryPathways?: readonly PPPathway[]
  hostExerciseId?: string
  breathing?: PPBreathingStrategy
  qualityGate?: PPQualityGate
  commonCompensations?: readonly string[]
  coachNotes?: readonly string[]
}

const node = (options: NodeOptions): PPMethodNode => {
  const profile = ppMethodReadinessProfiles[options.readinessProfile]
  const targetedOverride = targetedReadinessOverrides[options.id]
  return {
    ...options,
    readinessProfile: options.readinessProfile,
    breathing: options.breathing ?? continuousBreathing,
    qualityGate: options.qualityGate ?? targetedOverride?.qualityGate ?? profile.qualityGate,
    commonCompensations: options.commonCompensations ?? targetedOverride?.commonCompensations ?? profile.commonCompensations,
  }
}

const source = (sourceId: string, sourceName: string): PPMethodNode['source'] => ({
  sourceId: sourceId as `PP${string}`,
  sourceName,
  origin: 'postpartum-course',
})

export const ppMethodNodes: readonly PPMethodNode[] = [
  node({ readinessProfile: 'squat-control', id: 'pp01', source: source('PP01', '髋主导蹲'), kind: 'variant', mapping: mapping.variant('squat', 'pp01-hip-dominant-squat'), primaryPathway: 'squat', progressionLevel: 'P1', role: 'foundation', capabilities: ['hip-hinge', 'pelvic-control', 'rib-pelvis-control'] }),
  node({ readinessProfile: 'hinge-control', id: 'pp02', source: source('PP02', '髋铰链拉'), kind: 'variant', mapping: mapping.variant('hinge-drill', 'pp02-hip-hinge-pull'), primaryPathway: 'hinge', progressionLevel: 'P1', role: 'foundation', capabilities: ['hip-hinge', 'hip-extension', 'rib-pelvis-control'] }),
  node({ readinessProfile: 'hinge-control', id: 'pp03', source: source('PP03', '硬拉推肩'), kind: 'exercise', mapping: mapping.mapped('deadlift-to-overhead-press'), primaryPathway: 'integration', secondaryPathways: ['hinge', 'support'], progressionLevel: 'P4', role: 'integration', capabilities: ['hip-hinge', 'hip-extension', 'force-transfer', 'shoulder-support'], breathing: phaseCuedBreathing, coachNotes: ['一般负重推举能力是外部训练前置条件，不由 PP Method Graph 表达。'] }),
  node({ readinessProfile: 'hip-rotation-control', id: 'pp04', source: source('PP04', '90/90 髋转换'), kind: 'variant', mapping: mapping.variant('90-90-hip-rotation', 'pp04-90-90-hip-switch'), primaryPathway: 'hip-rotation', progressionLevel: 'P1', role: 'foundation', capabilities: ['hip-rotation', 'pelvic-control'] }),
  node({ readinessProfile: 'hip-rotation-control', id: 'pp05', source: source('PP05', '90/90 胫骨箱顶髋'), kind: 'exercise', mapping: mapping.mapped('shin-box-hip-lift'), primaryPathway: 'hip-rotation', progressionLevel: 'P2', role: 'bridge', capabilities: ['hip-rotation', 'hip-extension', 'pelvic-control'] }),
  node({ readinessProfile: 'locomotion', id: 'pp06', source: source('PP06', '坐姿骨盆髋走'), kind: 'drill', mapping: mapping.methodOnly(), primaryPathway: 'locomotion', secondaryPathways: ['hip-rotation'], progressionLevel: 'P1', role: 'drill', capabilities: ['pelvic-control', 'weight-shift', 'breathing-control'], breathing: resetBreathing }),
  node({ readinessProfile: 'locomotion', id: 'pp07', source: source('PP07', '低位鸭步'), kind: 'exercise', mapping: mapping.mapped('duck-walk'), primaryPathway: 'locomotion', secondaryPathways: ['squat', 'frontal-plane'], progressionLevel: 'P3', role: 'optional', capabilities: ['locomotion', 'weight-shift', 'hip-abduction'] }),
  node({ readinessProfile: 'frontal-plane-weight-shift', id: 'pp08', source: source('PP08', '侧卧髋内收'), kind: 'exercise', mapping: mapping.mapped('side-lying-hip-adduction'), primaryPathway: 'frontal-plane', secondaryPathways: ['lateral-support'], progressionLevel: 'P1', role: 'foundation', capabilities: ['hip-adduction', 'pelvic-control'] }),
  node({ readinessProfile: 'frontal-plane-weight-shift', id: 'pp09', source: source('PP09', '弹力带半蹲侧向走'), kind: 'variant', mapping: mapping.variant('band-lateral-walk', 'pp09-band-lateral-walk-half-squat'), primaryPathway: 'frontal-plane', secondaryPathways: ['locomotion', 'squat'], progressionLevel: 'P2', role: 'bridge', capabilities: ['hip-abduction', 'weight-shift', 'pelvic-control', 'locomotion'] }),
  node({ readinessProfile: 'hip-extension-control', id: 'pp10', source: source('PP10', '臀桥'), kind: 'exercise', mapping: mapping.mapped('glute-bridge'), primaryPathway: 'hip-extension', progressionLevel: 'P1', role: 'base', capabilities: ['hip-extension', 'pelvic-control'], breathing: phaseCuedBreathing }),
  node({ readinessProfile: 'dynamic-support', id: 'pp11', source: source('PP11', '四足游泳'), kind: 'variant', mapping: mapping.variant('bird-dog', 'pp11-contralateral-bird-dog'), primaryPathway: 'support', secondaryPathways: ['core'], progressionLevel: 'P3', role: 'integration', capabilities: ['contralateral-control', 'anti-rotation', 'rib-pelvis-control', 'breathing-control'] }),
  node({ readinessProfile: 'rotation-integration', id: 'pp12', source: source('PP12', '四足跪姿单臂胸椎旋转'), kind: 'variant', mapping: mapping.variant('thoracic-rotation', 'pp12-quadruped-thoracic-rotation'), primaryPathway: 'thoracic-rotation', secondaryPathways: ['support'], progressionLevel: 'P2', role: 'bridge', capabilities: ['rotation', 'shoulder-support', 'pelvic-control'] }),
  node({ readinessProfile: 'rotation-integration', id: 'pp13', source: source('PP13', '高位支撑前跨步转体'), kind: 'variant', mapping: mapping.variant('high-plank-step-through', 'pp13-high-plank-step-through-rotation'), primaryPathway: 'integration', secondaryPathways: ['support', 'locomotion', 'thoracic-rotation'], progressionLevel: 'P3', role: 'integration', capabilities: ['shoulder-support', 'anti-rotation', 'rotation', 'locomotion', 'force-transfer'] }),
  node({ readinessProfile: 'dynamic-support', id: 'pp14', source: source('PP14', '高位平板前跨步'), kind: 'exercise', mapping: mapping.mapped('high-plank-step-through'), primaryPathway: 'support', secondaryPathways: ['locomotion'], progressionLevel: 'P3', role: 'bridge', capabilities: ['shoulder-support', 'anti-extension', 'weight-shift', 'locomotion'] }),
  node({ readinessProfile: 'dynamic-support', id: 'pp15', source: source('PP15', '支撑膝撞'), kind: 'exercise', mapping: mapping.mapped('cross-body-plank-knee-drive'), primaryPathway: 'support', progressionLevel: 'P3', role: 'bridge', capabilities: ['shoulder-support', 'anti-extension', 'weight-shift'] }),
  node({ readinessProfile: 'anterior-support', id: 'pp16', breathing: phaseCuedBreathing, source: source('PP16', '平板支撑'), kind: 'exercise', mapping: mapping.mapped('plank'), primaryPathway: 'support', secondaryPathways: ['core'], progressionLevel: 'P2', role: 'base', capabilities: ['shoulder-support', 'anti-extension', 'rib-pelvis-control'] }),
  node({ readinessProfile: 'breath-rib-pelvis-foundation', id: 'pp17', source: source('PP17', '平板位主动收腹 / 骨盆后倾'), kind: 'drill', mapping: mapping.methodOnly(), hostExerciseId: 'plank', primaryPathway: 'support', progressionLevel: 'P1', role: 'drill', capabilities: ['rib-pelvis-control', 'pelvic-control', 'breathing-control'], breathing: resetBreathing, coachNotes: ['该节点是依附于 plank 执行的控制 Drill，不是独立 exercise variant。'] }),
  node({ readinessProfile: 'lateral-support', id: 'pp18', breathing: phaseCuedBreathing, source: source('PP18', '侧支撑转体'), kind: 'variant', mapping: mapping.variant('side-plank', 'pp18-side-plank-rotation'), primaryPathway: 'lateral-support', secondaryPathways: ['thoracic-rotation'], progressionLevel: 'P4', role: 'integration', capabilities: ['anti-lateral-flexion', 'shoulder-support', 'rotation', 'force-transfer'] }),
  node({ readinessProfile: 'lateral-support', id: 'pp19', breathing: phaseCuedBreathing, source: source('PP19', '侧支撑顶髋'), kind: 'variant', mapping: mapping.variant('side-plank', 'pp19-side-plank-hip-lift'), primaryPathway: 'lateral-support', secondaryPathways: ['frontal-plane'], progressionLevel: 'P3', role: 'bridge', capabilities: ['anti-lateral-flexion', 'shoulder-support', 'hip-abduction', 'pelvic-control'] }),
  node({ readinessProfile: 'breath-rib-pelvis-foundation', id: 'pp20', source: source('PP20', '四足支撑'), kind: 'drill', mapping: mapping.methodOnly(), primaryPathway: 'support', progressionLevel: 'P0', role: 'foundation', capabilities: ['shoulder-support', 'rib-pelvis-control', 'breathing-control'], breathing: resetBreathing }),
  node({ readinessProfile: 'breath-rib-pelvis-foundation', id: 'pp21', source: source('PP21', '站立 360° 呼吸控制'), kind: 'breathing', mapping: mapping.methodOnly(), primaryPathway: 'breath', secondaryPathways: ['core'], progressionLevel: 'P0', role: 'foundation', capabilities: ['breathing-control', 'rib-pelvis-control'], breathing: resetBreathing }),
  node({ readinessProfile: 'breath-rib-pelvis-foundation', id: 'pp22', source: source('PP22', '腹横肌呼吸—肢体联动串联'), kind: 'breathing', mapping: mapping.methodOnly(), primaryPathway: 'breath', secondaryPathways: ['core', 'integration'], progressionLevel: 'P1', role: 'bridge', capabilities: ['breathing-control', 'rib-pelvis-control', 'force-transfer'], breathing: phaseCuedBreathing }),
  node({ readinessProfile: 'anti-extension-core', id: 'pp23', breathing: phaseCuedBreathing, source: source('PP23', '普拉提单腿伸展'), kind: 'exercise', mapping: mapping.mapped('pilates-single-leg-stretch'), primaryPathway: 'core', progressionLevel: 'P3', role: 'integration', capabilities: ['anti-extension', 'breathing-control', 'contralateral-control'] }),
  node({ readinessProfile: 'anti-extension-core', id: 'pp24', breathing: phaseCuedBreathing, source: source('PP24', '普拉提双腿伸展'), kind: 'exercise', mapping: mapping.mapped('pilates-double-leg-stretch'), primaryPathway: 'core', progressionLevel: 'P4', role: 'integration', capabilities: ['anti-extension', 'breathing-control', 'force-transfer'] }),
  node({ readinessProfile: 'rotation-integration', id: 'pp25', breathing: phaseCuedBreathing, source: source('PP25', '普拉提十字交叉'), kind: 'exercise', mapping: mapping.mapped('pilates-criss-cross'), primaryPathway: 'core', secondaryPathways: ['thoracic-rotation'], progressionLevel: 'P4', role: 'integration', capabilities: ['anti-extension', 'rotation', 'breathing-control'] }),
  node({ readinessProfile: 'anti-extension-core', id: 'pp26', breathing: phaseCuedBreathing, source: source('PP26', '死虫式'), kind: 'exercise', mapping: mapping.mapped('dead-bug'), primaryPathway: 'core', progressionLevel: 'P2', role: 'base', capabilities: ['anti-extension', 'rib-pelvis-control', 'contralateral-control', 'breathing-control'] }),

  node({ readinessProfile: 'breath-rib-pelvis-foundation', id: 'exp-supine-90-90-breathing', kind: 'breathing', mapping: mapping.methodOnly(), primaryPathway: 'breath', secondaryPathways: ['hip-rotation'], progressionLevel: 'P0', role: 'foundation', capabilities: ['breathing-control', 'rib-pelvis-control'], breathing: resetBreathing }),
  node({ readinessProfile: 'breath-rib-pelvis-foundation', id: 'exp-side-lying-breathing', kind: 'breathing', mapping: mapping.methodOnly(), primaryPathway: 'breath', secondaryPathways: ['lateral-support'], progressionLevel: 'P0', role: 'foundation', capabilities: ['breathing-control', 'rib-pelvis-control'], breathing: resetBreathing }),
  node({ readinessProfile: 'dynamic-support', id: 'exp-quadruped-single-limb-lift', kind: 'variant', mapping: mapping.variant('bird-dog', 'exp-quadruped-single-limb-lift'), primaryPathway: 'support', secondaryPathways: ['core'], progressionLevel: 'P2', role: 'bridge', capabilities: ['shoulder-support', 'anti-rotation', 'weight-shift', 'rib-pelvis-control'] }),
  node({ readinessProfile: 'anterior-support', id: 'exp-incline-plank', kind: 'variant', mapping: mapping.variant('plank', 'exp-incline-plank'), primaryPathway: 'support', secondaryPathways: ['core'], progressionLevel: 'P1', role: 'foundation', capabilities: ['shoulder-support', 'anti-extension', 'rib-pelvis-control'] }),
  node({ readinessProfile: 'dynamic-support', id: 'exp-incline-support-weight-shift', kind: 'variant', mapping: mapping.variant('plank', 'exp-incline-support-weight-shift'), primaryPathway: 'support', progressionLevel: 'P1', role: 'bridge', capabilities: ['shoulder-support', 'weight-shift', 'anti-rotation'] }),
  node({ readinessProfile: 'dynamic-support', id: 'exp-plank-march', kind: 'variant', mapping: mapping.variant('plank', 'exp-plank-march'), primaryPathway: 'support', secondaryPathways: ['locomotion'], progressionLevel: 'P2', role: 'bridge', capabilities: ['shoulder-support', 'anti-rotation', 'weight-shift', 'locomotion'] }),
  node({ readinessProfile: 'dynamic-support', id: 'exp-short-forward-step-high-plank', kind: 'variant', mapping: mapping.variant('high-plank-step-through', 'exp-short-forward-step-high-plank'), primaryPathway: 'support', secondaryPathways: ['locomotion'], progressionLevel: 'P2', role: 'bridge', capabilities: ['shoulder-support', 'anti-extension', 'weight-shift', 'locomotion'] }),
  node({ readinessProfile: 'lateral-support', id: 'exp-knee-side-plank', kind: 'variant', mapping: mapping.variant('side-plank', 'exp-knee-side-plank'), primaryPathway: 'lateral-support', progressionLevel: 'P1', role: 'foundation', capabilities: ['anti-lateral-flexion', 'shoulder-support', 'pelvic-control'] }),
  node({ readinessProfile: 'lateral-support', id: 'exp-standard-side-plank', kind: 'exercise', mapping: mapping.mapped('side-plank'), primaryPathway: 'lateral-support', progressionLevel: 'P2', role: 'base', capabilities: ['anti-lateral-flexion', 'shoulder-support', 'pelvic-control'] }),
  node({ readinessProfile: 'lateral-support', id: 'exp-side-plank-reach', kind: 'variant', mapping: mapping.variant('side-plank', 'exp-side-plank-reach'), primaryPathway: 'lateral-support', secondaryPathways: ['thoracic-rotation'], progressionLevel: 'P3', role: 'bridge', capabilities: ['anti-lateral-flexion', 'shoulder-support', 'rotation', 'force-transfer'] }),
  node({ readinessProfile: 'lateral-support', id: 'exp-partial-side-plank-rotation', kind: 'variant', mapping: mapping.variant('side-plank', 'exp-partial-side-plank-rotation'), primaryPathway: 'lateral-support', secondaryPathways: ['thoracic-rotation'], progressionLevel: 'P3', role: 'bridge', capabilities: ['anti-lateral-flexion', 'shoulder-support', 'rotation'] }),
  node({ readinessProfile: 'hip-extension-control', id: 'exp-glute-bridge-march', kind: 'variant', mapping: mapping.variant('glute-bridge', 'exp-glute-bridge-march'), primaryPathway: 'hip-extension', secondaryPathways: ['core'], progressionLevel: 'P2', role: 'bridge', capabilities: ['hip-extension', 'pelvic-control', 'anti-rotation', 'weight-shift'] }),
  node({ readinessProfile: 'hip-extension-control', id: 'exp-single-leg-glute-bridge', kind: 'exercise', mapping: mapping.mapped('single-leg-glute-bridge'), primaryPathway: 'hip-extension', secondaryPathways: ['core'], progressionLevel: 'P3', role: 'integration', capabilities: ['hip-extension', 'pelvic-control', 'anti-rotation'] }),
  node({ readinessProfile: 'hinge-control', id: 'exp-wall-touch-hinge', kind: 'variant', mapping: mapping.variant('hinge-drill', 'exp-wall-touch-hinge'), primaryPathway: 'hinge', progressionLevel: 'P0', role: 'drill', capabilities: ['hip-hinge', 'hip-extension', 'pelvic-control'] }),
  node({ readinessProfile: 'hinge-control', id: 'exp-dowel-three-point-hinge', kind: 'variant', mapping: mapping.variant('hinge-drill', 'exp-dowel-three-point-hinge'), primaryPathway: 'hinge', progressionLevel: 'P1', role: 'drill', capabilities: ['hip-hinge', 'rib-pelvis-control', 'pelvic-control'] }),
  node({ readinessProfile: 'squat-control', id: 'exp-assisted-sit-to-stand', kind: 'variant', mapping: mapping.variant('box-squat', 'exp-assisted-sit-to-stand'), primaryPathway: 'squat', progressionLevel: 'P0', role: 'foundation', capabilities: ['weight-shift', 'pelvic-control', 'hip-extension'] }),
  node({ readinessProfile: 'squat-control', id: 'exp-box-squat', kind: 'exercise', mapping: mapping.mapped('box-squat'), primaryPathway: 'squat', progressionLevel: 'P1', role: 'base', capabilities: ['pelvic-control', 'hip-extension', 'weight-shift'] }),
  node({ readinessProfile: 'hip-rotation-control', id: 'exp-supported-90-90', kind: 'variant', mapping: mapping.variant('90-90-hip-rotation', 'exp-supported-90-90'), primaryPathway: 'hip-rotation', progressionLevel: 'P0', role: 'foundation', capabilities: ['hip-rotation', 'pelvic-control'] }),
  node({ readinessProfile: 'hip-rotation-control', id: 'exp-static-90-90', kind: 'variant', mapping: mapping.variant('90-90-hip-rotation', 'exp-static-90-90'), primaryPathway: 'hip-rotation', progressionLevel: 'P1', role: 'base', capabilities: ['hip-rotation', 'pelvic-control', 'breathing-control'] }),
  node({ readinessProfile: 'frontal-plane-weight-shift', id: 'exp-long-lever-side-lying-adduction', kind: 'variant', mapping: mapping.variant('side-lying-hip-adduction', 'exp-long-lever-side-lying-adduction'), primaryPathway: 'frontal-plane', secondaryPathways: ['lateral-support'], progressionLevel: 'P2', role: 'bridge', capabilities: ['hip-adduction', 'pelvic-control', 'anti-lateral-flexion'] }),
  node({ readinessProfile: 'lateral-support', id: 'exp-short-lever-copenhagen', kind: 'variant', mapping: mapping.variant('copenhagen-plank', 'exp-short-lever-copenhagen'), primaryPathway: 'lateral-support', progressionLevel: 'P2', role: 'bridge', capabilities: ['hip-adduction', 'anti-lateral-flexion', 'shoulder-support'] }),
  node({ readinessProfile: 'lateral-support', id: 'exp-full-copenhagen', kind: 'exercise', mapping: mapping.mapped('copenhagen-plank'), primaryPathway: 'lateral-support', progressionLevel: 'P3', role: 'integration', capabilities: ['hip-adduction', 'anti-lateral-flexion', 'shoulder-support'] }),
  node({ readinessProfile: 'frontal-plane-weight-shift', id: 'exp-standing-lateral-weight-shift', kind: 'drill', mapping: mapping.methodOnly(), primaryPathway: 'frontal-plane', secondaryPathways: ['locomotion'], progressionLevel: 'P0', role: 'drill', capabilities: ['weight-shift', 'hip-abduction', 'pelvic-control'], breathing: resetBreathing }),
  node({ readinessProfile: 'frontal-plane-weight-shift', id: 'exp-basic-hip-abduction', kind: 'exercise', mapping: mapping.mapped('hip-abduction'), primaryPathway: 'frontal-plane', progressionLevel: 'P1', role: 'base', capabilities: ['hip-abduction', 'pelvic-control'] }),
  node({ readinessProfile: 'locomotion', id: 'exp-standing-march', kind: 'exercise', mapping: mapping.mapped('standing-march'), primaryPathway: 'locomotion', secondaryPathways: ['frontal-plane'], progressionLevel: 'P1', role: 'base', capabilities: ['weight-shift', 'contralateral-control', 'hip-abduction'] }),
  node({ readinessProfile: 'rotation-integration', id: 'exp-open-book', kind: 'exercise', mapping: mapping.mapped('side-lying-open-book'), primaryPathway: 'thoracic-rotation', secondaryPathways: ['breath'], progressionLevel: 'P0', role: 'foundation', capabilities: ['rotation', 'breathing-control'] }),
  node({ readinessProfile: 'locomotion', id: 'exp-half-squat-low-locomotion', kind: 'variant', mapping: mapping.variant('duck-walk', 'exp-half-squat-low-locomotion'), primaryPathway: 'locomotion', secondaryPathways: ['squat'], progressionLevel: 'P3', role: 'integration', capabilities: ['locomotion', 'weight-shift', 'hip-abduction'] }),
]

export const ppMethodNodeById: ReadonlyMap<PPMethodNodeId, PPMethodNode> = new Map(
  ppMethodNodes.map((methodNode) => [methodNode.id, methodNode]),
)

export const ppVerificationLedger: readonly PPVerificationLedgerEntry[] = []
