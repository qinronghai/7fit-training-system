import {
  ppFemaleProgrammingPolicy,
} from './femaleProgrammingPolicy'
import type {
  PPMethodNodeId,
} from './types'
import type {
  PPFemaleTemplate,
} from './femaleProgrammingTemplates'
import {
  ppFemaleProgrammingTemplates,
} from './femaleProgrammingTemplates'
import {
  validateFemaleProgrammingBlock,
} from './femaleProgrammingRules'

export type PPFemaleTemplateValidationIssueCode =
  | 'EMPTY_TEMPLATE_INTENT'
  | 'BLOCK_POLICY_INVALID'
  | 'DUPLICATE_CONDITIONAL_REQUIREMENT'
  | 'CONDITIONAL_REQUIREMENT_MISSING'
  | 'UNUSED_CONDITIONAL_REQUIREMENT'
  | 'UNKNOWN_CONDITIONAL_REQUIREMENT'
  | 'DUPLICATE_TEMPLATE_ID'
  | 'DUPLICATE_TEMPLATE_CODE'

export type PPFemaleTemplateValidationIssue = {
  code: PPFemaleTemplateValidationIssueCode
  message: string
  templateId?: string
  nodeId?: PPMethodNodeId
}

const policyByNodeId = new Map(ppFemaleProgrammingPolicy.map((entry) => [entry.nodeId, entry]))

const issue = (
  code: PPFemaleTemplateValidationIssueCode,
  message: string,
  templateId?: string,
  nodeId?: PPMethodNodeId,
): PPFemaleTemplateValidationIssue => ({ code, message, templateId, nodeId })

const selectedNodeIds = (template: PPFemaleTemplate): readonly PPMethodNodeId[] =>
  Object.values(template.selection).map((selection) => selection.nodeId)

export const getFemaleTemplateRequiredConditionalNodes = (
  template: PPFemaleTemplate,
): readonly PPMethodNodeId[] => selectedNodeIds(template).filter((nodeId) =>
  policyByNodeId.get(nodeId)?.eligibility === 'B_CONDITIONAL')

export const validateFemaleProgrammingTemplate = (
  template: PPFemaleTemplate,
): readonly PPFemaleTemplateValidationIssue[] => {
  const issues: PPFemaleTemplateValidationIssue[] = []
  const selectedIds = new Set(selectedNodeIds(template))
  const declaredIds = new Set(template.requiredConditionalNodeIds)

  if (!template.intent.trim()) issues.push(issue('EMPTY_TEMPLATE_INTENT', `template intent is empty: ${template.id}`, template.id))
  if (declaredIds.size !== template.requiredConditionalNodeIds.length) {
    issues.push(issue('DUPLICATE_CONDITIONAL_REQUIREMENT', `duplicate conditional requirement: ${template.id}`, template.id))
  }

  for (const nodeId of template.requiredConditionalNodeIds) {
    const policy = policyByNodeId.get(nodeId)
    if (!policy || policy.eligibility !== 'B_CONDITIONAL') {
      issues.push(issue('UNKNOWN_CONDITIONAL_REQUIREMENT', `requirement is not a conditional PP-F1 node: ${nodeId}`, template.id, nodeId))
    } else if (!selectedIds.has(nodeId)) {
      issues.push(issue('UNUSED_CONDITIONAL_REQUIREMENT', `conditional requirement is not selected: ${nodeId}`, template.id, nodeId))
    }
  }

  for (const nodeId of getFemaleTemplateRequiredConditionalNodes(template)) {
    if (!declaredIds.has(nodeId)) {
      issues.push(issue('CONDITIONAL_REQUIREMENT_MISSING', `selected conditional node is not declared: ${nodeId}`, template.id, nodeId))
    }
  }

  for (const blockIssue of validateFemaleProgrammingBlock(template.selection, {
    readyConditionalNodeIds: template.requiredConditionalNodeIds,
  })) {
    issues.push(issue('BLOCK_POLICY_INVALID', blockIssue.message, template.id, blockIssue.nodeId))
  }

  return issues
}

export const validateFemaleProgrammingTemplates = (
  templates: readonly PPFemaleTemplate[] = ppFemaleProgrammingTemplates,
): readonly PPFemaleTemplateValidationIssue[] => {
  const issues: PPFemaleTemplateValidationIssue[] = []
  const ids = new Set<string>()
  const codes = new Set<string>()

  for (const template of templates) {
    if (ids.has(template.id)) issues.push(issue('DUPLICATE_TEMPLATE_ID', `duplicate template id: ${template.id}`, template.id))
    ids.add(template.id)
    if (codes.has(template.code)) issues.push(issue('DUPLICATE_TEMPLATE_CODE', `duplicate template code: ${template.code}`, template.id))
    codes.add(template.code)
    issues.push(...validateFemaleProgrammingTemplate(template))
  }

  return issues
}

export const getFemaleProgrammingTemplate = (id: string): PPFemaleTemplate | undefined =>
  ppFemaleProgrammingTemplates.find((template) => template.id === id)
