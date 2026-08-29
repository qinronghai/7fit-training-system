import { exercises } from '../exercises/exercises'
import { ppMethodNodes } from './methodNodes'
import { ppProgressionEdges, validatePPProgressionGraph } from './progressionGraph'
import type {
  PPCanonicalMapping,
  PPMethodNode,
  PPProgressionEdge,
  PPVerificationLedgerEntry,
} from './types'

export * from './types'
export {
  ppMethodNodes,
  ppMethodNodeById,
  ppVerificationLedger,
} from './methodNodes'
export {
  ppProgressionEdges,
  validatePPProgressionGraph,
} from './progressionGraph'
export {
  ppFemaleChallengeRoles,
  ppFemaleDemandScores,
  ppFemaleDemands,
  ppFemaleEligibilities,
  ppFemaleEligibilityCounts,
  ppFemaleProgrammingPolicy,
  ppFemaleSlots,
} from './femaleProgrammingPolicy'
export type {
  PPFemaleBlockSelection,
  PPFemaleChallengeRole,
  PPFemaleDemand,
  PPFemaleEligibility,
  PPFemalePolicyEntry,
  PPFemaleProgrammingContext,
  PPFemaleSlot,
  PPFemaleValidationIssue,
  PPFemaleValidationIssueCode,
} from './femaleProgrammingPolicy'
export {
  getFemaleProgrammingCandidates,
  validateFemaleProgrammingBlock,
  validateFemaleProgrammingPolicy,
} from './femaleProgrammingRules'
export {
  ppFemaleProgrammingTemplates,
} from './femaleProgrammingTemplates'
export type {
  PPFemaleTemplate,
  PPFemaleTemplateIntent,
} from './femaleProgrammingTemplates'
export {
  getFemaleProgrammingTemplate,
  getFemaleTemplateRequiredConditionalNodes,
  validateFemaleProgrammingTemplate,
  validateFemaleProgrammingTemplates,
} from './femaleProgrammingTemplateRules'
export type {
  PPFemaleTemplateValidationIssue,
  PPFemaleTemplateValidationIssueCode,
} from './femaleProgrammingTemplateRules'
export {
  PPFemaleRuntimeResolutionError,
  resolveFemaleProgrammingTemplate,
  resolveFemaleProgrammingTemplates,
} from './femaleProgrammingRuntime'
export type {
  PPFemaleRuntimeResolutionErrorCode,
  PPFemaleRuntimeSlot,
  ResolvedFemaleProgrammingTemplate,
} from './femaleProgrammingRuntime'

export const canonicalExerciseIds: ReadonlySet<string> = new Set(
  exercises.map((exercise) => exercise.id),
)

const isActionIdentity = (value: string): boolean => /^action-\d+$/.test(value)

export const validatePPMethodContract = (
  nodes: readonly PPMethodNode[],
  edges: readonly PPProgressionEdge[],
  canonicalIds: ReadonlySet<string> = canonicalExerciseIds,
): readonly string[] => {
  const errors: string[] = []
  const nodeIds = new Set<string>()
  const addCandidateIds = new Set<string>()
  const sourceIds = new Set<string>()

  for (const node of nodes) {
    if (nodeIds.has(node.id)) errors.push(`duplicate method node id: ${node.id}`)
    nodeIds.add(node.id)
    if (isActionIdentity(node.id)) errors.push(`action identity is not allowed for method node: ${node.id}`)

    if (node.source) {
      if (sourceIds.has(node.source.sourceId)) errors.push(`duplicate PP source id: ${node.source.sourceId}`)
      sourceIds.add(node.source.sourceId)
      if (!node.source.sourceName.trim()) errors.push(`PP source name is empty: ${node.id}`)
    }

    if (!node.primaryPathway) errors.push(`method node has no primary pathway: ${node.id}`)
    if (!node.breathing.pressureIntent.trim()) errors.push(`method node has no breathing pressure intent: ${node.id}`)
    if (node.breathing.failureSigns.length === 0) errors.push(`method node has no breathing failure signs: ${node.id}`)
    if (node.qualityGate.passRule !== 'all' || node.qualityGate.criteria.length === 0) errors.push(`method node has no complete quality gate: ${node.id}`)
    if (node.mapping.status === 'add-candidate') {
      if (addCandidateIds.has(node.mapping.proposedExerciseId)) errors.push(`duplicate add candidate: ${node.mapping.proposedExerciseId}`)
      addCandidateIds.add(node.mapping.proposedExerciseId)
      if (isActionIdentity(node.mapping.proposedExerciseId)) errors.push(`action identity is not allowed for add candidate: ${node.mapping.proposedExerciseId}`)
    }
  }

  const expectedSourceIds = new Set(Array.from({ length: 26 }, (_, index) => `PP${String(index + 1).padStart(2, '0')}`))
  if (sourceIds.size !== expectedSourceIds.size) errors.push(`expected 26 PP source nodes, got ${sourceIds.size}`)
  for (const sourceId of expectedSourceIds) {
    if (!sourceIds.has(sourceId)) errors.push(`missing PP source node: ${sourceId}`)
  }

  for (const node of nodes) {
    const mapping = node.mapping
    if (mapping.status === 'mapped' && !canonicalIds.has(mapping.exerciseId)) {
      errors.push(`mapped exercise does not exist: ${node.id} -> ${mapping.exerciseId}`)
    }
    if (mapping.status === 'variant') {
      if (!canonicalIds.has(mapping.exerciseId) && !addCandidateIds.has(mapping.exerciseId)) {
        errors.push(`variant host exercise is neither canonical nor add-candidate: ${node.id} -> ${mapping.exerciseId}`)
      }
      if (!mapping.variantId.trim()) errors.push(`variant id is empty: ${node.id}`)
    }
    if (mapping.status === 'verify' && !mapping.reason.trim()) errors.push(`verify node has no reason: ${node.id}`)
    if (node.hostExerciseId && !canonicalIds.has(node.hostExerciseId)) {
      errors.push(`host exercise does not exist: ${node.id} -> ${node.hostExerciseId}`)
    }
  }

  errors.push(...validatePPProgressionGraph(nodes, edges))
  return [...new Set(errors)]
}

export const validatePPVerificationLedger = (
  entries: readonly PPVerificationLedgerEntry[],
  nodes: readonly PPMethodNode[] = ppMethodNodes,
): readonly string[] => {
  const errors: string[] = []
  const nodeById = new Map(nodes.map((node) => [node.id, node]))
  const seen = new Set<string>()

  for (const entry of entries) {
    const key = `${entry.nodeId}|${entry.subject}`
    if (seen.has(key)) errors.push(`duplicate verification ledger entry: ${key}`)
    seen.add(key)
    const node = nodeById.get(entry.nodeId)
    if (!node) {
      errors.push(`verification ledger node does not exist: ${entry.nodeId}`)
      continue
    }
    if (node.source?.sourceId !== entry.sourceId) errors.push(`verification ledger source mismatch: ${entry.nodeId}`)
    if (!entry.reason.trim()) errors.push(`verification ledger reason is empty: ${entry.nodeId}`)
    if (entry.subject === 'identity' && node.mapping.status !== 'verify') errors.push(`identity ledger entry is not verify: ${entry.nodeId}`)
    if (entry.subject === 'display-category' && node.mapping.status !== 'add-candidate') errors.push(`display-category ledger entry is not add-candidate: ${entry.nodeId}`)
  }

  return [...new Set(errors)]
}

export const validateDefaultPPMethodContract = (): readonly string[] => validatePPMethodContract(
  ppMethodNodes,
  ppProgressionEdges,
)
