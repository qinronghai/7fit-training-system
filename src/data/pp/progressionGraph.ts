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
    from: 'pp21',
    to: 'exp-supine-90-90-breathing',
    type: 'branch',
    capabilityDelta: ['breathing-control', 'rib-pelvis-control'],
    reason: '从站立呼吸控制分支到仰卧 90/90 的低负荷呼吸重建。',
  },
  {
    from: 'exp-supine-90-90-breathing',
    to: 'pp22',
    type: 'progression',
    capabilityDelta: ['force-transfer'],
    reason: '在低负荷呼吸位置建立控制后，进入呼吸与肢体联动。',
  },
  {
    from: 'pp22',
    to: 'pp26',
    type: 'progression',
    capabilityDelta: ['anti-extension', 'contralateral-control'],
    reason: '把呼吸控制从联动串联带入死虫式的抗伸展任务。',
  },
  {
    from: 'pp26',
    to: 'pp23',
    type: 'progression',
    capabilityDelta: ['force-transfer'],
    reason: '从死虫式的对侧控制进入普拉提单腿伸展。',
  },
  {
    from: 'pp20',
    to: 'exp-quadruped-single-limb-lift',
    type: 'progression',
    capabilityDelta: ['weight-shift', 'anti-rotation'],
    reason: '四足基础支撑中减少一个支撑点，增加抗旋转需求。',
  },
  {
    from: 'pp20',
    to: 'exp-incline-plank',
    type: 'branch',
    capabilityDelta: ['shoulder-support', 'anti-extension'],
    reason: '从四足基础支撑分支到降低负荷的前侧支撑。',
  },
  {
    from: 'exp-quadruped-single-limb-lift',
    to: 'pp11',
    type: 'progression',
    capabilityDelta: ['contralateral-control'],
    reason: '由单肢离地进入对侧上、下肢协调。',
  },
  {
    from: 'exp-incline-plank',
    to: 'pp16',
    type: 'progression',
    capabilityDelta: ['anti-extension', 'shoulder-support'],
    reason: '由斜面支撑逐步进入标准平板支撑。',
  },
  {
    from: 'pp16',
    to: 'exp-plank-march',
    type: 'progression',
    capabilityDelta: ['weight-shift', 'anti-rotation'],
    reason: '在平板基础上加入交替抬手或抬脚的重心转移。',
  },
  {
    from: 'exp-plank-march',
    to: 'pp15',
    type: 'branch',
    capabilityDelta: ['hip-flexion', 'force-transfer'],
    reason: '从平板行进分支到支撑膝撞；身份仍由 PP15 视频确认。',
  },
  {
    from: 'exp-incline-plank',
    to: 'exp-incline-support-weight-shift',
    type: 'progression',
    capabilityDelta: ['weight-shift', 'anti-rotation'],
    reason: '在斜面支撑中加入受控重心转移。',
  },
  {
    from: 'exp-incline-support-weight-shift',
    to: 'exp-short-forward-step-high-plank',
    type: 'progression',
    capabilityDelta: ['locomotion', 'hip-flexion'],
    reason: '从斜面重心转移进入短范围前跨步。',
  },
  {
    from: 'exp-short-forward-step-high-plank',
    to: 'pp14',
    type: 'progression',
    capabilityDelta: ['shoulder-support', 'locomotion'],
    reason: '逐步增加前跨步范围与高位支撑要求。',
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
    from: 'pp04',
    to: 'pp05',
    type: 'progression',
    capabilityDelta: ['hip-extension'],
    reason: '在受控 90/90 髋转换后进入胫骨箱顶髋，增加髋伸展要求并保持骨盆控制。',
  },
  {
    from: 'exp-knee-side-plank',
    to: 'exp-standard-side-plank',
    type: 'progression',
    capabilityDelta: ['anti-lateral-flexion'],
    reason: '由膝支撑进入完整侧平板支撑。',
  },
  {
    from: 'exp-side-lying-breathing',
    to: 'exp-knee-side-plank',
    type: 'progression',
    capabilityDelta: ['anti-lateral-flexion', 'shoulder-support'],
    reason: '从侧卧呼吸与胸廓控制进入膝支撑侧平板。',
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
    from: 'exp-standard-side-plank',
    to: 'exp-side-plank-reach',
    type: 'progression',
    capabilityDelta: ['rotation', 'force-transfer'],
    reason: '从标准侧平板进入上肢到达与躯干控制。',
  },
  {
    from: 'exp-side-plank-reach',
    to: 'exp-partial-side-plank-rotation',
    type: 'progression',
    capabilityDelta: ['rotation'],
    reason: '在侧向支撑中增加部分旋转范围。',
  },
  {
    from: 'exp-partial-side-plank-rotation',
    to: 'pp18',
    type: 'progression',
    capabilityDelta: ['rotation', 'force-transfer'],
    reason: '从部分旋转进入完整侧支撑转体。',
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
    from: 'exp-wall-touch-hinge',
    to: 'exp-dowel-three-point-hinge',
    type: 'progression',
    capabilityDelta: ['hip-hinge', 'rib-pelvis-control'],
    reason: '从墙触髋铰链进入带外部反馈的三点髋铰链。',
  },
  {
    from: 'exp-dowel-three-point-hinge',
    to: 'pp02',
    type: 'progression',
    capabilityDelta: ['hip-extension'],
    reason: '从教学 Drill 进入髋铰链拉。',
  },
  {
    from: 'pp08',
    to: 'exp-long-lever-side-lying-adduction',
    type: 'progression',
    capabilityDelta: ['hip-adduction', 'anti-lateral-flexion'],
    reason: '从基础侧卧髋内收增加杠杆长度。',
  },
  {
    from: 'exp-long-lever-side-lying-adduction',
    to: 'exp-short-lever-copenhagen',
    type: 'progression',
    capabilityDelta: ['shoulder-support', 'anti-lateral-flexion'],
    reason: '从侧卧内收转入短杠杆 Copenhagen 支撑。',
  },
  {
    from: 'exp-short-lever-copenhagen',
    to: 'exp-full-copenhagen',
    type: 'progression',
    capabilityDelta: ['hip-adduction', 'shoulder-support'],
    reason: '增加支撑杠杆长度，进入完整 Copenhagen。',
  },
  {
    from: 'exp-standing-lateral-weight-shift',
    to: 'exp-basic-hip-abduction',
    type: 'progression',
    capabilityDelta: ['hip-abduction', 'pelvic-control'],
    reason: '从站立重心转移进入基础髋外展控制。',
  },
  {
    from: 'exp-basic-hip-abduction',
    to: 'pp09',
    type: 'progression',
    capabilityDelta: ['locomotion', 'weight-shift'],
    reason: '从单点髋外展控制进入弹力带侧向走。',
  },
  {
    from: 'exp-open-book',
    to: 'pp12',
    type: 'progression',
    capabilityDelta: ['shoulder-support', 'rotation'],
    reason: '从侧卧胸椎旋转进入四足位单臂胸椎旋转。',
  },
  {
    from: 'pp06',
    to: 'exp-standing-lateral-weight-shift',
    type: 'branch',
    capabilityDelta: ['weight-shift', 'locomotion'],
    reason: '从坐姿骨盆髋走分支到站立重心转移基础，而非声明 P-Level 严格进阶。',
  },
  {
    from: 'exp-standing-lateral-weight-shift',
    to: 'exp-standing-march',
    type: 'progression',
    capabilityDelta: ['contralateral-control', 'locomotion'],
    reason: '从站立重心转移进入单脚承重与交替抬腿。',
  },
  {
    from: 'pp01',
    to: 'exp-half-squat-low-locomotion',
    type: 'branch',
    capabilityDelta: ['locomotion', 'weight-shift'],
    reason: '从髋主导蹲基础分支到低位半蹲移动。',
  },
  {
    from: 'exp-half-squat-low-locomotion',
    to: 'pp07',
    type: 'optional',
    capabilityDelta: ['locomotion', 'hip-abduction'],
    reason: '从低位移动基础进入可选的鸭步容量训练。',
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
