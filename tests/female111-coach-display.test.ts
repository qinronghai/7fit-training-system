import { describe, expect, it } from 'vitest'
import {
  getFemale111CoachChallengeRoleLabel,
  getFemale111CoachDemandLabel,
  getFemale111CoachExerciseName,
  getFemale111CoachFamilyLabel,
  getFemale111CoachReadinessLabel,
  getFemale111CoachRecipeDisplay,
  getFemale111CoachReason,
  getFemale111CoachSlotLabel,
  getFemale111CoachStatusLabel,
} from '../src/data/female111/coachDisplay'

describe('PP-F111 coach-facing display mapping', () => {
  it('maps internal enums to Chinese coach labels', () => {
    expect(getFemale111CoachSlotLabel('PRIMARY')).toBe('主训练')
    expect(getFemale111CoachChallengeRoleLabel('PRIMARY_CHALLENGE')).toBe('主挑战')
    expect(getFemale111CoachDemandLabel('MODERATE')).toBe('中等')
    expect(getFemale111CoachReadinessLabel('NOT_REQUIRED')).toBe('无需额外确认')
    expect(getFemale111CoachStatusLabel('CLEAR')).toBe('通过')
    expect(getFemale111CoachFamilyLabel('ANTI_EXTENSION')).toBe('抗伸展核心')
    expect(getFemale111CoachFamilyLabel('HORIZONTAL_PULL')).toBe('水平拉')
    expect(getFemale111CoachFamilyLabel('BREATHING_POSITION')).toBe('呼吸与位置')
  })

  it('maps the current preview recipe and exercise names without changing their IDs', () => {
    expect(getFemale111CoachRecipeDisplay({
      id: 'F111-01',
      name: 'Squat + Anterior Support + Anti-extension',
      rationale: 'Build a repeatable squat stimulus while support and trunk control remain low-footprint.',
    })).toEqual({
      id: 'F111-01',
      name: '深蹲 + 前侧支撑 + 抗伸展',
      rationale: '建立可重复的深蹲刺激，同时保持支撑与躯干控制的低负担边界。',
    })
    expect(getFemale111CoachExerciseName('exp-incline-plank', 'exp-incline-plank')).toBe('斜板支撑')
    expect(getFemale111CoachExerciseName('unknown-node', 'unknown-node')).toBe('动作名称待补充')
  })

  it('keeps veto/review reasons readable in Chinese', () => {
    expect(getFemale111CoachReason('Coach confirmation is required before evaluation'))
      .toBe('需要教练确认后才能进行评估。')
    expect(getFemale111CoachReason('pp01 requires unavailable equipment: barbell'))
      .toBe('场地缺少器材：杠铃（节点 pp01）。')
  })
})
