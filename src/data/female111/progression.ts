import { getExercise } from '../exercises'
import { ppMethodNodeById, ppProgressionEdges } from '../pp'
import type { PPCapability, PPMethodNode } from '../pp/types'
import type { Female111Demand, Female111ProgressionFamily, Female111Slot } from './types'

export type Female111ProgressionDirection = 'PROGRESSION' | 'REGRESSION' | 'BRANCH'

export type Female111ProgressionNode = {
  id: string
  exerciseId: string
  methodNodeId?: string
  slot: Female111Slot
  family: Female111ProgressionFamily
  demand: Female111Demand
  requiredCapabilities: readonly PPCapability[]
  readinessRequirement: string
  rationale: string
  failureCondition: string
}

export type Female111ProgressionEdge = {
  from: string
  to: string
  direction: Female111ProgressionDirection
  requiredCapabilities: readonly PPCapability[]
  addedDemand: Female111Demand
  rationale: string
}

export type Female111ProgressionFamilyDefinition = {
  slot: Female111Slot
  family: Female111ProgressionFamily
  rationale: string
  nodes: readonly Female111ProgressionNode[]
  edges: readonly Female111ProgressionEdge[]
}

type NodeSeed = {
  id: string
  demand?: Female111Demand
  requiredCapabilities?: readonly PPCapability[]
  readinessRequirement?: string
  rationale?: string
  failureCondition?: string
}

type FamilySeed = {
  slot: Female111Slot
  family: Female111ProgressionFamily
  rationale: string
  nodes: readonly NodeSeed[]
  progressionPaths: readonly (readonly string[])[]
  branchPaths?: readonly (readonly string[])[]
}

const familyCapability: Readonly<Record<Female111ProgressionFamily, readonly PPCapability[]>> = {
  SQUAT: ['pelvic-control'],
  HINGE: ['hip-hinge', 'rib-pelvis-control'],
  HIP_EXTENSION: ['hip-extension', 'pelvic-control'],
  SINGLE_LEG: ['weight-shift', 'pelvic-control'],
  HORIZONTAL_PULL: ['shoulder-support'],
  VERTICAL_PULL: ['shoulder-support'],
  HORIZONTAL_PUSH: ['shoulder-support', 'rib-pelvis-control'],
  VERTICAL_PUSH: ['shoulder-support', 'force-transfer'],
  CARRY: ['force-transfer', 'weight-shift'],
  INTEGRATED_COMPOUND: ['force-transfer', 'rib-pelvis-control'],
  LOCOMOTION: ['locomotion', 'weight-shift'],
  HIP_ROTATION: ['hip-rotation', 'pelvic-control'],
  FRONTAL_PLANE: ['hip-abduction', 'weight-shift'],
  ANTERIOR_SUPPORT: ['shoulder-support', 'anti-extension'],
  QUADRUPED_SUPPORT: ['contralateral-control', 'shoulder-support'],
  DYNAMIC_SUPPORT: ['shoulder-support', 'weight-shift'],
  LATERAL_SUPPORT: ['anti-lateral-flexion', 'shoulder-support'],
  BREATHING_POSITION: ['breathing-control', 'rib-pelvis-control'],
  ANTI_EXTENSION: ['anti-extension', 'rib-pelvis-control'],
  ANTI_ROTATION: ['anti-rotation', 'rib-pelvis-control'],
  ANTI_LATERAL_FLEXION: ['anti-lateral-flexion', 'rib-pelvis-control'],
  ROTATION_CONTROL: ['rotation', 'rib-pelvis-control'],
  DYNAMIC_CORE: ['force-transfer', 'anti-rotation'],
}

const directNodeDefaults: Readonly<Record<Female111Slot, string>> = {
  PRIMARY: '当前动作可重复完成，且未出现影响安全与目标的代偿。',
  SUPPORT: '支撑质量下降、重心失控或无法维持目标位置时退阶。',
  CORE: '呼吸、肋骨—骨盆位置或躯干控制无法维持时退阶。',
}

const methodExerciseId = (node: PPMethodNode): string => {
  if (node.mapping.status === 'mapped' || node.mapping.status === 'variant') return node.mapping.exerciseId
  throw new Error(`Female111 progression node is not executable: ${node.id}`)
}

const toNode = (seed: NodeSeed, slot: Female111Slot, family: Female111ProgressionFamily): Female111ProgressionNode => {
  const methodNode = ppMethodNodeById.get(seed.id)
  const exerciseId = methodNode ? methodExerciseId(methodNode) : seed.id
  if (!getExercise(exerciseId)) throw new Error(`Female111 progression exercise does not exist: ${seed.id} -> ${exerciseId}`)
  return {
    id: seed.id,
    exerciseId,
    methodNodeId: methodNode?.id,
    slot,
    family,
    demand: seed.demand ?? 'MODERATE',
    requiredCapabilities: seed.requiredCapabilities ?? familyCapability[family],
    readinessRequirement: seed.readinessRequirement ?? '教练已确认当前动作的准备度与质量门槛。',
    rationale: seed.rationale ?? `${family} 路径中的当前训练版本。`,
    failureCondition: seed.failureCondition ?? directNodeDefaults[slot],
  }
}

const findSourceEdge = (from: string, to: string) => ppProgressionEdges.find((edge) => edge.from === from && edge.to === to)

const pathEdges = (
  path: readonly string[],
  family: Female111ProgressionFamily,
  direction: Female111ProgressionDirection,
  nodeById: ReadonlyMap<string, Female111ProgressionNode>,
): Female111ProgressionEdge[] => path.slice(0, -1).map((from, index) => {
  const to = path[index + 1]
  const source = findSourceEdge(from, to)
  const destination = nodeById.get(to)
  return {
    from,
    to,
    direction,
    requiredCapabilities: source?.capabilityDelta ?? destination?.requiredCapabilities ?? familyCapability[family],
    addedDemand: destination?.demand ?? 'MODERATE',
    rationale: source?.reason ?? (direction === 'REGRESSION'
      ? '当质量或准备度下降时，回到前一版本以恢复可重复控制。'
      : `沿 ${family} 路径增加一个主要训练要求，并保留教练确认。`),
  }
})

const makeFamily = (seed: FamilySeed): Female111ProgressionFamilyDefinition => {
  const nodes = seed.nodes.map((node) => toNode(node, seed.slot, seed.family))
  const nodeById = new Map(nodes.map((node) => [node.id, node]))
  const edges: Female111ProgressionEdge[] = []
  for (const path of seed.progressionPaths) {
    edges.push(...pathEdges(path, seed.family, 'PROGRESSION', nodeById))
    edges.push(...pathEdges([...path].reverse(), seed.family, 'REGRESSION', nodeById))
  }
  for (const path of seed.branchPaths ?? []) edges.push(...pathEdges(path, seed.family, 'BRANCH', nodeById))
  return { slot: seed.slot, family: seed.family, rationale: seed.rationale, nodes, edges }
}

const node = (id: string, rationale?: string, demand?: Female111Demand): NodeSeed => ({ id, rationale, demand })

const familySeeds: readonly FamilySeed[] = [
  { slot: 'PRIMARY', family: 'SQUAT', rationale: '从目标高度控制逐步进入负重或移动型蹲模式。', nodes: [node('exp-assisted-sit-to-stand'), node('exp-box-squat'), node('pp01'), node('goblet-box-squat'), node('goblet-squat'), node('double-dumbbell-front-squat'), node('hack-squat', undefined, 'HIGH'), node('exp-half-squat-low-locomotion')], progressionPaths: [['exp-assisted-sit-to-stand', 'exp-box-squat', 'pp01'], ['pp01', 'goblet-box-squat', 'goblet-squat', 'double-dumbbell-front-squat', 'hack-squat']], branchPaths: [['pp01', 'exp-half-squat-low-locomotion']] },
  { slot: 'PRIMARY', family: 'HINGE', rationale: '先建立髋铰链位置，再增加外部反馈与髋伸展需求。', nodes: [node('exp-wall-touch-hinge'), node('exp-dowel-three-point-hinge'), node('pp02'), node('kettlebell-deadlift'), node('dumbbell-rdl'), node('double-dumbbell-rdl', undefined, 'HIGH')], progressionPaths: [['exp-wall-touch-hinge', 'exp-dowel-three-point-hinge', 'pp02'], ['pp02', 'kettlebell-deadlift', 'dumbbell-rdl', 'double-dumbbell-rdl']] },
  { slot: 'PRIMARY', family: 'HIP_EXTENSION', rationale: '在骨盆可控的前提下，从双侧髋伸展进入单侧控制。', nodes: [node('pp10'), node('glute-bridge-abduction'), node('hip-thrust'), node('exp-glute-bridge-march'), node('exp-single-leg-glute-bridge', undefined, 'HIGH')], progressionPaths: [['pp10', 'exp-glute-bridge-march', 'exp-single-leg-glute-bridge'], ['pp10', 'glute-bridge-abduction', 'hip-thrust', 'exp-single-leg-glute-bridge']] },
  { slot: 'PRIMARY', family: 'SINGLE_LEG', rationale: '以稳定重心转移为基础，逐步增加单侧支撑与负荷。', nodes: [node('single-leg-stand', '先建立单脚站立的重心控制。', 'LOW'), node('low-box-step-up'), node('split-squat'), node('reverse-lunge'), node('front-foot-elevated-split-squat', undefined, 'HIGH')], progressionPaths: [['single-leg-stand', 'low-box-step-up', 'split-squat', 'reverse-lunge', 'front-foot-elevated-split-squat']] },
  { slot: 'PRIMARY', family: 'HORIZONTAL_PULL', rationale: '从有支撑的水平拉逐步进入单侧与自由躯干控制。', nodes: [node('chest-supported-row', undefined, 'LOW'), node('seated-row'), node('single-arm-cable-row', undefined, 'HIGH')], progressionPaths: [['chest-supported-row', 'seated-row', 'single-arm-cable-row']] },
  { slot: 'PRIMARY', family: 'VERTICAL_PULL', rationale: '先建立肩胛控制，再逐步增加垂直拉的负荷与复杂度。', nodes: [node('straight-arm-pulldown', undefined, 'LOW'), node('lat-pulldown'), node('assisted-pull-up', undefined, 'HIGH')], progressionPaths: [['straight-arm-pulldown', 'lat-pulldown', 'assisted-pull-up']] },
  { slot: 'PRIMARY', family: 'HORIZONTAL_PUSH', rationale: '从倾斜支撑建立推的路径，再增加水平推负荷。', nodes: [node('incline-push-up', undefined, 'LOW'), node('dumbbell-bench-press'), node('barbell-bench-press', undefined, 'HIGH')], progressionPaths: [['incline-push-up', 'dumbbell-bench-press', 'barbell-bench-press']] },
  { slot: 'PRIMARY', family: 'VERTICAL_PUSH', rationale: '保持胸廓—骨盆位置，逐步增加垂直推与全身整合。', nodes: [node('seated-dumbbell-shoulder-press'), node('deadlift-to-overhead-press', undefined, 'HIGH')], progressionPaths: [['seated-dumbbell-shoulder-press', 'deadlift-to-overhead-press']] },
  { slot: 'PRIMARY', family: 'CARRY', rationale: '从双侧负重移动过渡到位置与抗侧屈要求更高的携重。', nodes: [node('farmer-carry', undefined, 'LOW'), node('front-rack-carry'), node('suitcase-carry', undefined, 'HIGH')], progressionPaths: [['farmer-carry', 'front-rack-carry', 'suitcase-carry']] },
  { slot: 'PRIMARY', family: 'INTEGRATED_COMPOUND', rationale: '只有在多个基础能力已确认时才进入全身整合。', nodes: [node('kettlebell-deadlift', undefined, 'MODERATE'), node('dumbbell-rdl'), node('farmer-carry'), node('deadlift-to-overhead-press', undefined, 'HIGH')], progressionPaths: [['kettlebell-deadlift', 'dumbbell-rdl', 'deadlift-to-overhead-press'], ['kettlebell-deadlift', 'farmer-carry', 'deadlift-to-overhead-press']] },
  { slot: 'PRIMARY', family: 'LOCOMOTION', rationale: '将重心转移、蹲模式与空间移动组织为一个主要训练主题。', nodes: [node('exp-standing-march', undefined, 'LOW'), node('low-box-step-up'), node('lateral-lunge'), node('exp-half-squat-low-locomotion'), node('duck-walk', undefined, 'HIGH')], progressionPaths: [['exp-standing-march', 'low-box-step-up', 'lateral-lunge', 'duck-walk'], ['exp-standing-march', 'exp-half-squat-low-locomotion', 'duck-walk']] },
  { slot: 'SUPPORT', family: 'ANTERIOR_SUPPORT', rationale: '用低占用前侧支撑建立肩胛、呼吸与抗伸展基础。', nodes: [node('exp-incline-plank', undefined, 'LOW'), node('pp16'), node('plank', undefined, 'HIGH')], progressionPaths: [['exp-incline-plank', 'pp16', 'plank']] },
  { slot: 'SUPPORT', family: 'QUADRUPED_SUPPORT', rationale: '在四足基础上逐步减少支撑点并增加对侧控制。', nodes: [node('bird-dog', undefined, 'LOW'), node('exp-quadruped-single-limb-lift'), node('pp11', undefined, 'HIGH')], progressionPaths: [['bird-dog', 'exp-quadruped-single-limb-lift', 'pp11']] },
  { slot: 'SUPPORT', family: 'LATERAL_SUPPORT', rationale: '从膝支撑开始，沿多条路径发展侧向支撑与骨盆控制。', nodes: [node('exp-knee-side-plank', undefined, 'LOW'), node('exp-standard-side-plank'), node('pp19'), node('pp18', undefined, 'HIGH')], progressionPaths: [['exp-knee-side-plank', 'exp-standard-side-plank', 'pp19']], branchPaths: [['exp-standard-side-plank', 'pp18']] },
  { slot: 'SUPPORT', family: 'DYNAMIC_SUPPORT', rationale: '在静态支撑稳定后加入重心转移与动态协调。', nodes: [node('exp-incline-support-weight-shift', undefined, 'LOW'), node('exp-plank-march'), node('pp14'), node('pp15', undefined, 'HIGH')], progressionPaths: [['exp-incline-support-weight-shift', 'exp-plank-march', 'pp14']], branchPaths: [['exp-plank-march', 'pp15']] },
  { slot: 'SUPPORT', family: 'LOCOMOTION', rationale: '把站立重心转移与低复杂度移动作为支撑能力训练。', nodes: [node('exp-standing-march', undefined, 'LOW'), node('lateral-lunge'), node('multidirectional-lunge', undefined, 'HIGH')], progressionPaths: [['exp-standing-march', 'lateral-lunge', 'multidirectional-lunge']] },
  { slot: 'SUPPORT', family: 'FRONTAL_PLANE', rationale: '从局部髋控制逐步发展到侧向重心与内收支撑。', nodes: [node('exp-basic-hip-abduction', undefined, 'LOW'), node('pp08'), node('exp-long-lever-side-lying-adduction'), node('pp09', undefined, 'HIGH')], progressionPaths: [['exp-basic-hip-abduction', 'pp08', 'exp-long-lever-side-lying-adduction']], branchPaths: [['exp-basic-hip-abduction', 'pp09']] },
  { slot: 'CORE', family: 'BREATHING_POSITION', rationale: '先恢复呼吸与肋骨—骨盆位置，再进入带动作的核心任务。', nodes: [node('exp-supported-90-90', undefined, 'LOW'), node('exp-static-90-90'), node('dead-bug', undefined, 'MODERATE')], progressionPaths: [['exp-supported-90-90', 'exp-static-90-90', 'dead-bug']] },
  { slot: 'CORE', family: 'ANTI_EXTENSION', rationale: '在呼吸可持续的前提下逐步增加抗伸展杠杆。', nodes: [node('dead-bug', undefined, 'LOW'), node('pp26'), node('pp24', undefined, 'HIGH')], progressionPaths: [['dead-bug', 'pp26', 'pp24']] },
  { slot: 'CORE', family: 'ANTI_ROTATION', rationale: '保持躯干位置，逐步增加对侧负荷与抗旋转要求。', nodes: [node('pallof-press', undefined, 'LOW'), node('cross-body-plank-knee-drive'), node('pp25', undefined, 'HIGH')], progressionPaths: [['pallof-press', 'cross-body-plank-knee-drive', 'pp25']] },
  { slot: 'CORE', family: 'ANTI_LATERAL_FLEXION', rationale: '从可控制的侧向位置进入携重或长杠杆抗侧屈。', nodes: [node('side-plank', undefined, 'LOW'), node('suitcase-carry'), node('exp-standard-side-plank', undefined, 'HIGH')], progressionPaths: [['side-plank', 'suitcase-carry', 'exp-standard-side-plank']] },
  { slot: 'CORE', family: 'ROTATION_CONTROL', rationale: '先建立可呼吸的旋转控制，再增加支撑与整合。', nodes: [node('supine-open-book', undefined, 'LOW'), node('exp-open-book'), node('pp12', undefined, 'HIGH')], progressionPaths: [['supine-open-book', 'exp-open-book', 'pp12']] },
  { slot: 'CORE', family: 'DYNAMIC_CORE', rationale: '在位置控制稳定后进入动态躯干与四肢整合。', nodes: [node('dead-bug', undefined, 'LOW'), node('pp23'), node('bear-crawl', undefined, 'HIGH')], progressionPaths: [['dead-bug', 'pp23', 'bear-crawl']] },
]

export const female111ProgressionFamilies: readonly Female111ProgressionFamilyDefinition[] = familySeeds.map(makeFamily)

const familyKey = (slot: Female111Slot, family: Female111ProgressionFamily): string => `${slot}|${family}`
const familyByKey = new Map(female111ProgressionFamilies.map((definition) => [familyKey(definition.slot, definition.family), definition]))
const progressionNodeById = new Map(female111ProgressionFamilies.flatMap((definition) => definition.nodes.map((node) => [node.id, node] as const)))

export const getFemale111ProgressionFamily = (
  slot: Female111Slot,
  family: Female111ProgressionFamily,
): Female111ProgressionFamilyDefinition | undefined => familyByKey.get(familyKey(slot, family))

export const getFemale111ProgressionNode = (id: string): Female111ProgressionNode | undefined => progressionNodeById.get(id)
