import type {
  Female111SessionBlockInput,
  Female111SessionCompositionInput,
  Female111SessionCompositionIssue,
  Female111SessionCompositionResult,
  Female111ComposedSession,
  Female111ComposedSessionBlock,
} from './types'

const invalidResolutionIssue = (
  blockLabel: 'A' | 'B',
  block: Female111SessionBlockInput,
): Female111SessionCompositionIssue => {
  if (block.resolution.issues.length > 0) {
    return {
      code: blockLabel === 'A' ? 'BLOCK_A_INVALID' : 'BLOCK_B_INVALID',
      message: `Block ${blockLabel} carries unresolved Female111 C1 issues: ${block.id}`,
      resolutionIssues: block.resolution.issues,
    }
  }

  return {
    code: blockLabel === 'A' ? 'BLOCK_A_NOT_RESOLVED' : 'BLOCK_B_NOT_RESOLVED',
    message: `Block ${blockLabel} has no resolved Female111 Block: ${block.id}`,
  }
}

const composedBlock = (block: Female111SessionBlockInput): Female111ComposedSessionBlock => ({
  id: block.id,
  resolved: block.resolution.resolved!,
})

export const composeFemale111Session = (
  input: Female111SessionCompositionInput,
): Female111SessionCompositionResult => {
  const issues: Female111SessionCompositionIssue[] = []

  if (input.blockA.id === input.blockB.id) {
    issues.push({
      code: 'DUPLICATE_BLOCK_ID',
      message: `Block A and Block B must remain separately identifiable: ${input.blockA.id}`,
    })
  }

  if (input.blockA.resolution.issues.length > 0 || !input.blockA.resolution.resolved) {
    issues.push(invalidResolutionIssue('A', input.blockA))
  }
  if (input.blockB.resolution.issues.length > 0 || !input.blockB.resolution.resolved) {
    issues.push(invalidResolutionIssue('B', input.blockB))
  }

  if (issues.length > 0) return { issues }

  const session: Female111ComposedSession = {
    id: input.id,
    prep: input.prep,
    blockA: composedBlock(input.blockA),
    blockB: composedBlock(input.blockB),
    accessory: input.accessory,
    stage: input.stage,
    target: input.target,
    timeBudgetMinutes: input.timeBudgetMinutes,
    estimatedMinutes: input.estimatedMinutes,
    recovery: input.recovery,
  }
  return { session, issues: [] }
}
