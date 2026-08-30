import { exercises } from '../exercises/exercises'
import {
  ppFemaleProgrammingPolicy,
} from './femaleProgrammingPolicy'
import type {
  PPFemaleChallengeRole,
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
  PPCanonicalMapping,
  PPMethodNode,
  PPMethodNodeId,
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

export type PPFemaleRuntimeCanonicalBinding =
  | {
      mapping: Extract<PPCanonicalMapping, { status: 'mapped' }>
      exercise: Exercise
    }
  | {
      mapping: Extract<PPCanonicalMapping, { status: 'variant' }>
      exercise: Exercise
    }

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
  canonical: PPFemaleRuntimeCanonicalBinding
  requiresConditionalReadiness: boolean
}

export type ResolvedFemaleProgrammingTemplate = {
  template: PPFemaleTemplate
  slots: Readonly<Record<PPFemaleSlot, PPFemaleRuntimeSlot>>
}

const policyByNodeId = new Map(ppFemaleProgrammingPolicy.map((entry) => [entry.nodeId, entry]))
const exerciseById = new Map(exercises.map((exercise) => [exercise.id, exercise]))

const fail = (
  code: PPFemaleRuntimeResolutionErrorCode,
  message: string,
  details: { templateId?: string; nodeId?: PPMethodNodeId } = {},
): never => {
  throw new PPFemaleRuntimeResolutionError(code, message, {
    ...details,
  })
}

export const resolveFemaleRuntimeCanonicalBinding = (
  mapping: PPCanonicalMapping,
  details: { templateId?: string; nodeId?: PPMethodNodeId } = {},
): PPFemaleRuntimeCanonicalBinding => {
  if (mapping.status === 'method-only') {
    return fail('METHOD_ONLY_NOT_EXECUTABLE', 'method-only mapping cannot be resolved into an executable runtime slot', details)
  }
  if (mapping.status === 'add-candidate') {
    return fail('ADD_CANDIDATE_NOT_EXECUTABLE', 'add-candidate mapping cannot be resolved into an executable runtime slot', details)
  }
  if (mapping.status === 'verify') {
    return fail('VERIFY_NOT_EXECUTABLE', 'verify mapping cannot be resolved into an executable runtime slot', details)
  }

  const exercise = exerciseById.get(mapping.exerciseId)
  if (!exercise) {
    return fail('CANONICAL_EXERCISE_NOT_FOUND', `canonical Exercise does not exist: ${mapping.exerciseId}`, details)
  }

  if (mapping.status === 'mapped') return { mapping, exercise }
  return { mapping, exercise }
}

const resolveSlot = (
  template: PPFemaleTemplate,
  slot: PPFemaleSlot,
): PPFemaleRuntimeSlot => {
  const selection = template.selection[slot]
  const methodNode = ppMethodNodeById.get(selection.nodeId)
  if (!methodNode) {
    return fail('METHOD_NODE_NOT_FOUND', `Method node does not exist: ${selection.nodeId}`, {
      templateId: template.id,
      nodeId: selection.nodeId,
    })
  }

  const policy = policyByNodeId.get(selection.nodeId)
  if (!policy) {
    return fail('POLICY_ENTRY_NOT_FOUND', `PP-F1 policy entry does not exist: ${selection.nodeId}`, {
      templateId: template.id,
      nodeId: selection.nodeId,
    })
  }

  const canonical = resolveFemaleRuntimeCanonicalBinding(methodNode.mapping, {
    templateId: template.id,
    nodeId: methodNode.id,
  })
  return {
    slot,
    challengeRole: selection.challengeRole,
    methodNode,
    policy,
    canonical,
    requiresConditionalReadiness: template.requiredConditionalNodeIds.includes(methodNode.id),
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

  const issues = validateFemaleProgrammingTemplate(template)
  if (issues.length > 0) {
    return fail(
      'TEMPLATE_CONTRACT_INVALID',
      `PP-F2A template contract is invalid: ${issues.map((item) => item.message).join('; ')}`,
      { templateId: template.id },
    )
  }

  const slots = {
    HIP: resolveSlot(template, 'HIP'),
    SUPPORT: resolveSlot(template, 'SUPPORT'),
    CORE: resolveSlot(template, 'CORE'),
  } satisfies Record<PPFemaleSlot, PPFemaleRuntimeSlot>

  return {
    template,
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
      { templateId: template.id },
    )
  }
  return templates.map(resolveFemaleProgrammingTemplate)
}
