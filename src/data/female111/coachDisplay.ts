import type {
  Female111ChallengeRole,
  Female111CoachRecipeViewModel,
  Female111Demand,
  Female111EvidenceCheckStatus,
  Female111EvidenceReadinessStatus,
  Female111ProgressionFamily,
  Female111RecipeFamily,
  Female111Slot,
} from './types'

const slotLabels: Readonly<Record<Female111Slot, string>> = {
  PRIMARY: '主训练',
  SUPPORT: '支持',
  CORE: '核心控制',
}

const challengeRoleLabels: Readonly<Record<Female111ChallengeRole, string>> = {
  PRIMARY_CHALLENGE: '主挑战',
  SUPPORTING: '支持动作',
}

const demandLabels: Readonly<Record<Female111Demand, string>> = {
  NONE: '无额外负荷',
  LOW: '低',
  MODERATE: '中等',
  HIGH: '高',
}

const familyLabels: Readonly<Record<Female111ProgressionFamily, string>> = {
  SQUAT: '深蹲模式',
  HINGE: '髋铰链',
  HIP_EXTENSION: '髋伸展',
  SINGLE_LEG: '单侧控制',
  HORIZONTAL_PULL: '水平拉',
  VERTICAL_PULL: '垂直拉',
  HORIZONTAL_PUSH: '水平推',
  VERTICAL_PUSH: '垂直推',
  CARRY: '携重移动',
  INTEGRATED_COMPOUND: '综合复合',
  LOCOMOTION: '移动与重心转移',
  HIP_ROTATION: '髋旋转',
  FRONTAL_PLANE: '额状面控制',
  ANTERIOR_SUPPORT: '前侧支撑',
  QUADRUPED_SUPPORT: '四点支撑',
  DYNAMIC_SUPPORT: '动态支撑',
  LATERAL_SUPPORT: '侧向支撑',
  BREATHING_POSITION: '呼吸与位置',
  ANTI_EXTENSION: '抗伸展核心',
  ANTI_ROTATION: '抗旋转核心',
  ANTI_LATERAL_FLEXION: '抗侧屈核心',
  ROTATION_CONTROL: '旋转控制',
  DYNAMIC_CORE: '动态核心',
}

const statusLabels: Readonly<Record<Female111EvidenceCheckStatus, string>> = {
  CLEAR: '通过',
  REVIEW_REQUIRED: '需要复核',
  VETOED: '不允许执行',
}

const readinessLabels: Readonly<Record<Female111EvidenceReadinessStatus, string>> = {
  NOT_REQUIRED: '无需额外确认',
  CONFIRMED: '已确认',
  NOT_CONFIRMED: '尚未确认',
}

const recipeDisplay: Readonly<Record<string, Pick<Female111CoachRecipeViewModel, 'name' | 'rationale'>>> = {
  'F111-01': { name: '深蹲 + 前侧支撑 + 抗伸展', rationale: '建立可重复的深蹲刺激，同时保持支撑与躯干控制的低负担边界。' },
  'F111-02': { name: '髋铰链 + 四点支撑 + 侧向核心', rationale: '将髋铰链模式与对侧支撑、侧向躯干能力结合起来。' },
  'F111-03': { name: '单侧控制 + 动态支撑 + 抗旋转', rationale: '推进单侧控制，同时保留清晰的支撑与躯干挑战边界。' },
  'F111-04': { name: '髋伸展 + 侧向支撑 + 抗伸展', rationale: '组织髋伸展、侧向能力与可控的抗伸展需求。' },
  'F111-05': { name: '深蹲综合 + 四点支撑 + 侧向核心', rationale: '把深蹲输出连接到对侧支撑，不要求每个选择都进入复杂整合。' },
  'F111-06': { name: '髋铰链/拉力综合 + 动态支撑 + 抗旋转', rationale: '仅在会员具备必要协调与力量传递能力时使用综合髋铰链/拉力训练。' },
  'F111-07': { name: '移动/单侧控制 + 重心转移支撑 + 核心控制', rationale: '以移动和重心转移为主线，同时保持旋转控制的边界清晰。' },
  'F111-08': { name: '全身综合 + 支撑整合 + 动态核心', rationale: '仅在前置条件已由教练确认，并且挑战边界清晰时使用全身整合。' },
}

const exerciseNames: Readonly<Record<string, string>> = {
  pp01: '髋主导蹲',
  pp02: '髋铰链拉',
  pp03: '硬拉推肩',
  pp04: '90/90 髋转换',
  pp08: '站立侧向重心转移',
  pp10: '臀桥',
  pp16: '前侧支撑',
  pp26: '死虫式',
  'exp-quadruped-single-limb-lift': '四点支撑单侧抬举',
  'exp-incline-plank': '斜板支撑',
  'exp-incline-support-weight-shift': '斜板支撑重心转移',
  'exp-plank-march': '平板支撑交替抬腿',
  'exp-knee-side-plank': '屈膝侧桥',
  'exp-standard-side-plank': '标准侧桥',
  'exp-side-plank-reach': '侧桥伸展',
  'exp-partial-side-plank-rotation': '半程侧桥旋转',
  'exp-glute-bridge-march': '臀桥交替抬腿',
  'exp-single-leg-glute-bridge': '单腿臀桥',
  'exp-wall-touch-hinge': '靠墙触碰髋铰链',
  'exp-dowel-three-point-hinge': '木棍三点髋铰链',
  'exp-assisted-sit-to-stand': '辅助坐站',
  'exp-box-squat': '箱式深蹲',
  'exp-supported-90-90': '辅助 90/90 髋转换',
  'exp-static-90-90': '静态 90/90 髋位',
  'exp-basic-hip-abduction': '基础髋外展',
  'exp-standing-march': '站立交替抬腿',
  'exp-open-book': '侧卧开书',
  'exp-half-squat-low-locomotion': '低位半蹲行走',
}

const rationaleByMethodNodeId: Readonly<Record<string, string>> = {
  pp01: '当会员能够控制辅助变式时，作为主要深蹲模式刺激。',
  'exp-incline-plank': '作为低负担的前侧支撑基础。',
  pp26: '作为可重复的抗伸展核心控制。',
  'exp-half-squat-low-locomotion': '在准备度确认后，作为移动与深蹲模式的综合主训练。',
  'exp-basic-hip-abduction': '作为低负担的额状面支撑资源。',
  'exp-open-book': '作为低负担的胸椎旋转与呼吸支持核心动作。',
}

const equipmentLabels: Readonly<Record<string, string>> = {
  barbell: '杠铃',
  box: '箱子',
  'mini-band': '迷你弹力带',
}

export const getFemale111CoachSlotLabel = (slot: Female111Slot): string => slotLabels[slot]
export const getFemale111CoachChallengeRoleLabel = (role: Female111ChallengeRole): string => challengeRoleLabels[role]
export const getFemale111CoachDemandLabel = (demand: Female111Demand): string => demandLabels[demand]
export const getFemale111CoachFamilyLabel = (family: Female111ProgressionFamily): string => familyLabels[family]
export const getFemale111CoachStatusLabel = (status: Female111EvidenceCheckStatus): string => statusLabels[status]
export const getFemale111CoachReadinessLabel = (status: Female111EvidenceReadinessStatus): string => readinessLabels[status]

export const getFemale111CoachRecipeDisplay = (
  recipe: Female111CoachRecipeViewModel | Female111RecipeFamily,
): Female111CoachRecipeViewModel => ({
  id: recipe.id,
  name: recipeDisplay[recipe.id]?.name ?? '训练组合名称待补充',
  rationale: recipeDisplay[recipe.id]?.rationale ?? '该训练组合的教练选择依据已记录。',
})

export const getFemale111CoachExerciseName = (methodNodeId: string, displayName: string): string => {
  if (exerciseNames[methodNodeId]) return exerciseNames[methodNodeId]
  if (/[^\x00-\x7F]/.test(displayName)) return displayName
  return '动作名称待补充'
}

export const getFemale111CoachRationale = (methodNodeId: string, fallback: string): string => {
  if (rationaleByMethodNodeId[methodNodeId]) return rationaleByMethodNodeId[methodNodeId]
  if (/[^\x00-\x7F]/.test(fallback)) return fallback
  return '该动作的教练选择依据已记录。'
}

export const getFemale111CoachReason = (reason: string): string => {
  if (reason === 'Coach confirmation is required before evaluation') return '需要教练确认后才能进行评估。'
  const equipmentMatch = reason.match(/^(.+) requires unavailable equipment: (.+)$/)
  if (equipmentMatch) {
    const equipment = equipmentLabels[equipmentMatch[2]] ?? '所需器材'
    return `场地缺少器材：${equipment}（节点 ${equipmentMatch[1]}）。`
  }
  if (reason.includes('readiness')) return '该动作尚未完成准备度确认。'
  if (reason.includes('venue')) return '场地条件需要复核。'
  return '规则原因已记录，请查看证据详情。'
}
