import type {
  Female111ReadinessAdjustment,
  Female111ReadinessEvaluation,
  Female111ReadinessInput,
} from './types'

const yellowAdjustments: readonly Female111ReadinessAdjustment[] = [
  'volume',
  'demand',
  'complexity',
  'load',
]

export const evaluateFemale111Readiness = (
  input: Female111ReadinessInput,
): Female111ReadinessEvaluation => {
  const safetySignals = input.safetySignals ?? []

  if (input.status === 'RED') {
    return {
      status: input.status,
      allowed: false,
      action: safetySignals.length > 0 ? 'REFER' : 'STOP',
      adjustments: [],
      reasons: safetySignals.length > 0
        ? [`发现需要进一步评估的安全信号：${safetySignals.join('、')}`]
        : ['当前状态不适合执行本次训练'],
    }
  }

  if (input.status === 'YELLOW') {
    return {
      status: input.status,
      allowed: true,
      action: 'REGRESS',
      adjustments: yellowAdjustments,
      reasons: ['今日状态需要降低训练负荷、总量或复杂度，并在执行中持续复核质量'],
    }
  }

  return {
    status: input.status,
    allowed: true,
    action: 'ALLOW',
    adjustments: [],
    reasons: ['今日状态支持按已确认方案执行，并按训练记录决定下一步'],
  }
}
