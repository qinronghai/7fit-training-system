import { female111TemplateLevelIds, getFemale111Template } from './templateCatalog'
import { validateFemale111TemplateLevel } from './templateRules'
import type {
  Female111Template,
  Female111TemplateLevelId,
  Female111TemplateValidationIssue,
} from './templateTypes'

export type Female111TemplateSelectionInput = {
  recipeId: string
  level: Female111TemplateLevelId
}

export type Female111TemplateSelectionIssueCode =
  | 'TEMPLATE_SELECTION_NOT_FOUND'
  | 'TEMPLATE_SELECTION_INVALID'

export type Female111TemplateSelectionIssue = {
  code: Female111TemplateSelectionIssueCode
  message: string
  recipeId: string
  level: Female111TemplateLevelId
  validationIssues?: readonly Female111TemplateValidationIssue[]
}

export type Female111TemplateSelectionResult = {
  template?: Female111Template
  issues: readonly Female111TemplateSelectionIssue[]
}

const invalidSelection = (
  recipeId: string,
  level: Female111TemplateLevelId,
  validationIssues: readonly Female111TemplateValidationIssue[],
): Female111TemplateSelectionResult => ({
  issues: [{
    code: 'TEMPLATE_SELECTION_INVALID',
    message: `Invalid Female111 template selection: ${recipeId}/${level}`,
    recipeId,
    level,
    validationIssues,
  }],
})

export const resolveFemale111TemplateSelection = (
  input: Female111TemplateSelectionInput,
): Female111TemplateSelectionResult => {
  const template = getFemale111Template(input.recipeId, input.level)
  if (!template) {
    return {
      issues: [{
        code: 'TEMPLATE_SELECTION_NOT_FOUND',
        message: `Unknown Female111 template selection: ${input.recipeId}/${input.level}`,
        recipeId: input.recipeId,
        level: input.level,
      }],
    }
  }

  const previousLevelId = input.level === 'l1'
    ? undefined
    : female111TemplateLevelIds[female111TemplateLevelIds.indexOf(input.level) - 1]
  const previousLevel = previousLevelId ? getFemale111Template(input.recipeId, previousLevelId)?.level : undefined
  const validationIssues = validateFemale111TemplateLevel(template.level, previousLevel)
  if (validationIssues.length > 0) return invalidSelection(input.recipeId, input.level, validationIssues)

  return {
    template,
    issues: [],
  }
}
