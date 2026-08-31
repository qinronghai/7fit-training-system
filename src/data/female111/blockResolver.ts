import { ppMethodNodeById } from '../pp/methodNodes'
import { female111RoleByMethodNodeId } from './exerciseRoles'
import { getFemale111ProgressionNode } from './progression'
import { female111RecipeFamilies } from './blockRecipes'
import { validateFemale111Block } from './blockRules'
import {
  female111Slots,
  type Female111BlockResolutionInput,
  type Female111BlockResolutionIssue,
  type Female111BlockResolutionResult,
  type Female111ProgressionFamily,
  type Female111ValidationContext,
  type Female111ResolvedBlock,
  type Female111ResolvedSlot,
  type Female111Slot,
} from './types'

const recipeFor = (recipeId: string) => female111RecipeFamilies.find((recipe) => recipe.id === recipeId)

const expectedFamily = (
  recipe: { primaryFamily: Female111ProgressionFamily; supportFamily: Female111ProgressionFamily; coreFamily: Female111ProgressionFamily },
  slot: Female111Slot,
): Female111ProgressionFamily => {
  if (slot === 'PRIMARY') return recipe.primaryFamily
  if (slot === 'SUPPORT') return recipe.supportFamily
  return recipe.coreFamily
}

export const resolveFemale111Block = (
  input: Female111BlockResolutionInput,
  context: Female111ValidationContext = {},
): Female111BlockResolutionResult => {
  const recipe = recipeFor(input.recipeId)
  if (!recipe) {
    return {
      issues: [{ code: 'RECIPE_NOT_FOUND', message: `unknown Female111 Recipe: ${input.recipeId}` }],
    }
  }

  const blockIssues = validateFemale111Block(input.selection, context)
  const issues: Female111BlockResolutionIssue[] = []
  if (blockIssues.length > 0) {
    issues.push({
      code: 'BLOCK_INVALID',
      message: `Female111 Block selection is invalid for Recipe ${recipe.id}`,
      blockIssues,
    })
  }

  const resolvedSlots = {} as Record<Female111Slot, Female111ResolvedSlot>
  for (const slot of female111Slots) {
    const selection = input.selection[slot]
    const role = female111RoleByMethodNodeId.get(selection.methodNodeId)
    const methodNode = ppMethodNodeById.get(selection.methodNodeId)
    if (!role || !methodNode) continue

    const requiredFamily = expectedFamily(recipe, slot)
    if (role.progressionFamily !== requiredFamily) {
      issues.push({
        code: 'RECIPE_FAMILY_MISMATCH',
        message: `${selection.methodNodeId} in ${slot} is ${role.progressionFamily}; Recipe ${recipe.id} requires ${requiredFamily}`,
        slot,
        methodNodeId: selection.methodNodeId,
      })
      continue
    }

    resolvedSlots[slot] = { slot, selection, role, methodNode, progression: getFemale111ProgressionNode(selection.methodNodeId) }
  }

  if (issues.length > 0) return { issues }

  const resolved: Female111ResolvedBlock = {
    recipe,
    selection: input.selection,
    slots: resolvedSlots,
  }
  return { resolved, issues: [] }
}
