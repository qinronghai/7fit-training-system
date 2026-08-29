import { exercises } from '../exercises/exercises'
import {
  ppFemaleProgrammingPolicy,
} from './femaleProgrammingPolicy'
import type {
  PPFemaleChallengeRole,
  PPFemaleDemand,
  PPFemaleEligibility,
  PPFemalePolicyEntry,
  PPFemaleSlot,
} from './femaleProgrammingPolicy'
import {
  ppFemaleProgrammingTemplates,
} from './femaleProgrammingTemplates'
import type { PPFemaleTemplate } from './femaleProgrammingTemplates'
import {
  validateFemaleProgrammingTemplate,
  validateFemaleProgrammingTemplates,
} from './femaleProgrammingTemplateRules'
import { ppMethodNodeById } from './methodNodes'
import type {
  PPCanonicalMappingStatus,
  PPMethodNode,
} from './types'
import type { Exercise } from '../exercises/types'

export type PPFemaleRuntimeResolutionErrorCode =
  | 'TEMPLATE_NOT_FOUND'
  | 'TEMPLATE_CONTRACT_INVALID'
  | 'METHOD_NODE_NOT_FOUND'
  | 'POLICY_ENTRY_NOT_FOUND'
  | 'METHOD_ONLY_NOT_EXECUTABLE'
  | 'ADD_CANDIDATE_NOT_EXECUTABLE'
  | 'VERIFY_NOT_EXECUTABLE'
  | 'CANONICAL_EXERCISE_NOT_FOUND'

export class PPFemaleRuntimeResolutionError extends Error {
  readonly code: PPFemaleRuntimeResolutionErrorCode
  readonly templateId?: string
  readonly nodeId?: string

  constructor(
    code: PPFemaleRuntimeResolutionErrorCode,
    message: string,
    details: { templateId?: string; nodeId?: string } = {},
  ) {
    super(message)
    this.name = 'PPFemaleRuntimeResolutionError'
    this.code = code
    this.templateId = details.templateId
    this.nodeId = details.nodeId
  }
}

export type PPFemaleRuntimeSlot = {
  slot: PPFemaleSlot
  challengeRole: PPFemaleChallengeRole
  methodNode: PPMethodNode
  policy: PPFemalePolicyEntry
  canonicalExerciseId: Exercise['id']
  canonicalExercise: Exercise
  mappingStatus: PPCanonicalMappingStatus
  variantId?: string
  eligibility: PPFemaleEligibility
  demand: PPFemaleDemand
  breathing: PPMethodNode['breathing']
  qualityGate: PPMethodNode['qualityGate']
  commonCompensations: PPMethodNode['commonCompensations']
}

export type ResolvedFemaleProgrammingTemplate = {
  id: PPFemaleTemplate['id']
  code: PPFemaleTemplate['code']
  name: PPFemaleTemplate['name']
  intent: PPFemaleTemplate['intent']
  coachNote?: PPFemaleTemplate['coachNote']
  requiredConditionalNodeIds: PPFemaleTemplate['requiredConditionalNodeIds']
  slots: Readonly<Record<PPFemaleSlot, PPFemaleRuntimeSlot>>
}

const policyByNodeId = new Map(ppFemaleProgrammingPolicy.map((entry) => [entry.nodeId, entry]))
const exerciseById = new Map(exercises.map((exercise) => [exercise.id, exercise]))

const fail = (
  code: PPFemaleRuntimeResolutionErrorCode,
  message: string,
  template: PPFemaleTemplate,
  nodeId?: string,
): never => {
  throw new PPFemaleRuntimeResolutionError(code, message, {
    templateId: template.id,
    nodeId,
  })
}

const resolveCanonicalExercise = (
  template: PPFemaleTemplate,
  node: PPMethodNode,
): { canonicalExerciseId: Exercise['id']; canonicalExercise: Exercise; mappingStatus: PPCanonicalMappingStatus; variantId?: string } => {
  const mapping = node.mapping

  if (mapping.status === 'method-only') {
    return fail('METHOD_ONLY_NOT_EXECUTABLE', `method-only node cannot be resolved into a runtime slot: ${node.id}`, template, node.id)
  }
  if (mapping.status === 'add-candidate') {
    return fail('ADD_CANDIDATE_NOT_EXECUTABLE', `add-candidate node cannot be resolved into a runtime slot: ${node.id}`, template, node.id)
  }
  if (mapping.status === 'verify') {
    return fail('VERIFY_NOT_EXECUTABLE', `verify node cannot be resolved into a runtime slot: ${node.id}`, template, node.id)
  }

  const canonicalExerciseId = mapping.exerciseId
  const canonicalExercise = exerciseById.get(canonicalExerciseId)
  if (!canonicalExercise) {
    return fail('CANONICAL_EXERCISE_NOT_FOUND', `canonical Exercise does not exist: ${node.id} -> ${canonicalExerciseId}`, template, node.id)
  }

  return {
    canonicalExerciseId,
    canonicalExercise,
    mappingStatus: mapping.status,
    variantId: mapping.status === 'variant' ? mapping.variantId : undefined,
  }
}

const resolveSlot = (
  template: PPFemaleTemplate,
  slot: PPFemaleSlot,
): PPFemaleRuntimeSlot => {
  const selection = template.selection[slot]
  const methodNode = ppMethodNodeById.get(selection.nodeId)
  if (!methodNode) {
    return fail('METHOD_NODE_NOT_FOUND', `Method node does not exist: ${selection.nodeId}`, template, selection.nodeId)
  }

  const policy = policyByNodeId.get(selection.nodeId)
  if (!policy) {
    return fail('POLICY_ENTRY_NOT_FOUND', `PP-F1 policy entry does not exist: ${selection.nodeId}`, template, selection.nodeId)
  }

  const canonical = resolveCanonicalExercise(template, methodNode)
  return {
    slot,
    challengeRole: selection.challengeRole,
    methodNode,
    policy,
    ...canonical,
    eligibility: policy.eligibility,
    demand: policy.demand,
    breathing: methodNode.breathing,
    qualityGate: methodNode.qualityGate,
    commonCompensations: methodNode.commonCompensations,
  }
}

export const resolveFemaleProgrammingTemplate = (
  templateOrId: PPFemaleTemplate | string,
): ResolvedFemaleProgrammingTemplate => {
  const template = typeof templateOrId === 'string'
    ? ppFemaleProgrammingTemplates.find((item) => item.id === templateOrId)
    : templateOrId

  if (!template) {
    throw new PPFemaleRuntimeResolutionError(
      'TEMPLATE_NOT_FOUND',
      `PP-F2A template does not exist: ${templateOrId}`,
    )
  }

  const slots = {
    HIP: resolveSlot(template, 'HIP'),
    SUPPORT: resolveSlot(template, 'SUPPORT'),
    CORE: resolveSlot(template, 'CORE'),
  } satisfies Record<PPFemaleSlot, PPFemaleRuntimeSlot>

  const issues = validateFemaleProgrammingTemplate(template)
  if (issues.length > 0) {
    return fail(
      'TEMPLATE_CONTRACT_INVALID',
      `PP-F2A template contract is invalid: ${issues.map((item) => item.message).join('; ')}`,
      template,
    )
  }

  return {
    id: template.id,
    code: template.code,
    name: template.name,
    intent: template.intent,
    ...(template.coachNote ? { coachNote: template.coachNote } : {}),
    requiredConditionalNodeIds: template.requiredConditionalNodeIds,
    slots,
  }
}

export const resolveFemaleProgrammingTemplates = (
  templates: readonly PPFemaleTemplate[] = ppFemaleProgrammingTemplates,
): readonly ResolvedFemaleProgrammingTemplate[] => {
  const issues = validateFemaleProgrammingTemplates(templates)
  if (issues.length > 0) {
    const template = templates.find((item) => item.id === issues[0].templateId) ?? templates[0]
    if (!template) throw new Error('Cannot resolve an empty PP-F2A template catalog')
    return fail(
      'TEMPLATE_CONTRACT_INVALID',
      `PP-F2A template catalog is invalid: ${issues.map((item) => item.message).join('; ')}`,
      template,
    )
  }
  return templates.map(resolveFemaleProgrammingTemplate)
}
