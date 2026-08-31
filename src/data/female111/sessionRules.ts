import type {
  Female111ComposedSession,
  Female111Session,
  Female111SessionValidationIssue,
  Female111ValidationContext,
} from './types'
import { validateFemale111Block } from './blockRules'
import { female111RoleByMethodNodeId } from './exerciseRoles'
import { ppMethodNodeById } from '../pp/methodNodes'

const sessionIssue = (
  code: Female111SessionValidationIssue['code'],
  message: string,
  capability?: string,
): Female111SessionValidationIssue => ({ code, message, capability })

export const validateFemale111Session = (
  session: Female111Session | Female111ComposedSession,
  context: Female111ValidationContext = {},
): readonly Female111SessionValidationIssue[] => {
  const issues: Female111SessionValidationIssue[] = []
  const blockASelection = 'selection' in session.blockA ? session.blockA.selection : session.blockA.resolved.selection
  const blockBSelection = 'selection' in session.blockB ? session.blockB.selection : session.blockB.resolved.selection
  const composedSession = 'resolved' in session.blockA && 'resolved' in session.blockB
  const resolvedIds = composedSession
    ? [...Object.values(blockASelection), ...Object.values(blockBSelection)].map((selection) => selection.methodNodeId)
    : []
  const blockValidationContext: Female111ValidationContext = composedSession
    ? { ...context, readyConditionalMethodNodeIds: [...(context.readyConditionalMethodNodeIds ?? []), ...resolvedIds] }
    : context

  if (session.blockA.id === session.blockB.id) {
    issues.push(sessionIssue('DUPLICATE_BLOCK_ID', `Block A and Block B must remain separately identifiable: ${session.blockA.id}`))
  }

  if (validateFemale111Block(blockASelection, blockValidationContext).length > 0) {
    issues.push({ code: 'BLOCK_A_INVALID', message: `Block A is not a legal Female111 Block: ${session.blockA.id}` })
  }
  if (validateFemale111Block(blockBSelection, blockValidationContext).length > 0) {
    issues.push(sessionIssue('BLOCK_B_INVALID', `Block B is not a legal Female111 Block: ${session.blockB.id}`))
  }

  const primaryA = female111RoleByMethodNodeId.get(blockASelection.PRIMARY.methodNodeId)
  const primaryB = female111RoleByMethodNodeId.get(blockBSelection.PRIMARY.methodNodeId)
  if (primaryA && primaryB && primaryA.progressionFamily === primaryB.progressionFamily) {
    issues.push(sessionIssue('REPEATED_PRIMARY_FAMILY', `Block A and Block B repeat the primary family: ${primaryA.progressionFamily}`))
  }

  const primaryExerciseA = ppMethodNodeById.get(blockASelection.PRIMARY.methodNodeId)?.mapping
  const primaryExerciseB = ppMethodNodeById.get(blockBSelection.PRIMARY.methodNodeId)?.mapping
  const exerciseIdA = primaryExerciseA && ('exerciseId' in primaryExerciseA ? primaryExerciseA.exerciseId : undefined)
  const exerciseIdB = primaryExerciseB && ('exerciseId' in primaryExerciseB ? primaryExerciseB.exerciseId : undefined)
  if (exerciseIdA && exerciseIdA === exerciseIdB) {
    issues.push(sessionIssue('REPEATED_FATIGUE_SOURCE', `Block A and Block B repeat the same primary fatigue source: ${exerciseIdA}`))
  }

  const entries = [blockASelection, blockBSelection].flatMap((block) => Object.values(block))
    .map((selection) => female111RoleByMethodNodeId.get(selection.methodNodeId))
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
  const totalDemand = entries.reduce((total, entry) => {
    const scores = { NONE: 0, LOW: 1, MODERATE: 2, HIGH: 3 } as const
    return total + scores[entry.sessionDemand]
  }, 0)
  const sessionDemandBudget = context.sessionDemandBudget ?? 12
  if (totalDemand > sessionDemandBudget) {
    issues.push(sessionIssue('SESSION_DEMAND_EXCEEDED', `Session demand budget is ${sessionDemandBudget}, got ${totalDemand}`))
  }

  const capabilityCounts = new Map<string, number>()
  for (const entry of entries) {
    for (const capability of entry.capabilityRequirements) {
      capabilityCounts.set(capability, (capabilityCounts.get(capability) ?? 0) + 1)
    }
  }
  const maxSessionCapabilityCount = context.maxSharedCapabilityCount ?? 4
  for (const [capability, count] of capabilityCounts) {
    if (count > maxSessionCapabilityCount) {
      issues.push(sessionIssue('SESSION_CAPABILITY_OVERLOAD', `Session capability ${capability} is used by ${count} slots; maximum is ${maxSessionCapabilityCount}`, capability))
    }
  }

  if (session.timeBudgetMinutes !== undefined) {
    const estimatedMinutes = session.estimatedMinutes ?? 32
    if (estimatedMinutes > session.timeBudgetMinutes) {
      issues.push(sessionIssue('SESSION_TIME_BUDGET_EXCEEDED', `Session estimate ${estimatedMinutes} minutes exceeds budget ${session.timeBudgetMinutes}`))
    }
  }

  return issues
}
