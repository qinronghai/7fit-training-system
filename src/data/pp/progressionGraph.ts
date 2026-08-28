import type { PPMethodNode, PPMethodNodeId, PPProgressionEdge } from './types'

export const ppProgressionEdges: readonly PPProgressionEdge[] = [
  {
    from: 'pp21',
    to: 'pp22',
    type: 'progression',
    capabilityDelta: ['force-transfer'],
    reason: '从站立呼吸控制过渡到呼吸与肢体联动。',
  },
  {
    from: 'pp20',
    to: 'exp-quadruped-single-limb-lift',
    type: 'progression',
    capabilityDelta: ['weight-shift', 'anti-rotation'],
    reason: '四足基础支撑中减少一个支撑点，增加抗旋转需求。',
  },
  {
    from: 'exp-quadruped-single-limb-lift',
    to: 'pp11',
    type: 'progression',
    capabilityDelta: ['contralateral-control'],
    reason: '由单肢离地进入对侧上、下肢协调。',
  },
  {
    from: 'pp16',
    to: 'pp17',
    type: 'optional',
    capabilityDelta: ['pelvic-control', 'breathing-control'],
    reason: '在平板基础上加入主动收腹与骨盆后倾控制 Drill。',
  },
  {
    from: 'pp10',
    to: 'exp-glute-bridge-march',
    type: 'progression',
    capabilityDelta: ['anti-rotation', 'weight-shift'],
    reason: '从双侧髋伸展进入交替抬腿，同时维持骨盆稳定。',
  },
  {
    from: 'exp-glute-bridge-march',
    to: 'exp-single-leg-glute-bridge',
    type: 'progression',
    capabilityDelta: ['hip-extension', 'anti-rotation'],
    reason: '由交替抬腿进入单腿髋伸展。',
  },
  {
    from: 'exp-assisted-sit-to-stand',
    to: 'exp-box-squat',
    type: 'progression',
    capabilityDelta: ['weight-shift', 'hip-extension'],
    reason: '减少辅助并建立可重复的箱式深蹲。',
  },
  {
    from: 'exp-box-squat',
    to: 'pp01',
    type: 'progression',
    capabilityDelta: ['pelvic-control', 'hip-hinge'],
    reason: '从目标高度控制过渡到髋主导蹲型。',
  },
  {
    from: 'exp-supported-90-90',
    to: 'exp-static-90-90',
    type: 'progression',
    capabilityDelta: ['hip-rotation', 'breathing-control'],
    reason: '减少外部支持并保持髋旋转位置。',
  },
  {
    from: 'exp-static-90-90',
    to: 'pp04',
    type: 'progression',
    capabilityDelta: ['weight-shift', 'hip-rotation'],
    reason: '从静态位置进入受控髋转换。',
  },
  {
    from: 'exp-knee-side-plank',
    to: 'exp-standard-side-plank',
    type: 'progression',
    capabilityDelta: ['anti-lateral-flexion'],
    reason: '由膝支撑进入完整侧平板支撑。',
  },
  {
    from: 'exp-standard-side-plank',
    to: 'pp19',
    type: 'branch',
    capabilityDelta: ['hip-abduction', 'pelvic-control'],
    reason: '从标准侧平板分支到侧支撑顶髋。',
  },
  {
    from: 'exp-standard-side-plank',
    to: 'pp18',
    type: 'branch',
    capabilityDelta: ['rotation'],
    reason: '从标准侧平板分支到侧支撑转体。',
  },
  {
    from: 'exp-short-forward-step-high-plank',
    to: 'pp13',
    type: 'progression',
    capabilityDelta: ['rotation', 'force-transfer'],
    reason: '从短范围前跨步进入带转体的高位支撑整合。',
  },
  {
    from: 'pp14',
    to: 'pp13',
    type: 'branch',
    capabilityDelta: ['rotation'],
    reason: '在高位平板前跨步基础上加入胸椎转体。',
  },
  {
    from: 'exp-standing-lateral-weight-shift',
    to: 'exp-standing-march',
    type: 'progression',
    capabilityDelta: ['contralateral-control', 'locomotion'],
    reason: '从站立重心转移进入单脚承重与交替抬腿。',
  },
  {
    from: 'pp23',
    to: 'pp24',
    type: 'progression',
    capabilityDelta: ['anti-extension', 'force-transfer'],
    reason: '从交替单腿伸展进入双腿同时伸展。',
  },
  {
    from: 'pp24',
    to: 'pp25',
    type: 'progression',
    capabilityDelta: ['rotation'],
    reason: '在双腿伸展控制基础上加入躯干旋转。',
  },
]

const edgeKey = (edge: PPProgressionEdge): string => `${edge.from}|${edge.to}|${edge.type}`

export const validatePPProgressionGraph = (
  nodes: readonly PPMethodNode[],
  edges: readonly PPProgressionEdge[],
): readonly string[] => {
  const errors: string[] = []
  const nodeIds = new Set(nodes.map((node) => node.id))
  const outgoing = new Map<PPMethodNodeId, PPMethodNodeId[]>()
  const edgeKeys = new Set<string>()

  edges.forEach((edge) => {
    if (!nodeIds.has(edge.from)) errors.push(`progression edge source does not exist: ${edge.from}`)
    if (!nodeIds.has(edge.to)) errors.push(`progression edge target does not exist: ${edge.to}`)
    if (edge.from === edge.to) errors.push(`progression edge is a self-loop: ${edge.from}`)
    if (edgeKeys.has(edgeKey(edge))) errors.push(`duplicate progression edge: ${edgeKey(edge)}`)
    edgeKeys.add(edgeKey(edge))
    const targets = outgoing.get(edge.from) ?? []
    targets.push(edge.to)
    outgoing.set(edge.from, targets)
  })

  const visiting = new Set<PPMethodNodeId>()
  const visited = new Set<PPMethodNodeId>()
  const visit = (id: PPMethodNodeId): void => {
    if (visiting.has(id)) {
      errors.push(`progression graph contains a cycle at: ${id}`)
      return
    }
    if (visited.has(id)) return
    visiting.add(id)
    for (const target of outgoing.get(id) ?? []) {
      if (nodeIds.has(target)) visit(target)
    }
    visiting.delete(id)
    visited.add(id)
  }

  for (const nodeId of nodeIds) visit(nodeId)
  return [...new Set(errors)]
}
