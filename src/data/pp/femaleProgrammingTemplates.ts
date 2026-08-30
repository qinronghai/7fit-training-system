import type { PPFemaleBlockSelection } from './femaleProgrammingPolicy'
import type { PPMethodNodeId } from './types'

export type PPFemaleTemplateIntent =
  | 'foundation-control'
  | 'hip-dominant-control'
  | 'support-stability'
  | 'anti-extension-core'
  | 'advanced-integrated-control'

export type PPFemaleTemplate = {
  id: string
  code: string
  name: string
  intent: PPFemaleTemplateIntent
  selection: PPFemaleBlockSelection
  requiredConditionalNodeIds: readonly PPMethodNodeId[]
  coachNote?: string
}

const template = (
  id: string,
  code: string,
  name: string,
  intent: PPFemaleTemplateIntent,
  selection: PPFemaleBlockSelection,
  requiredConditionalNodeIds: readonly PPMethodNodeId[] = [],
  coachNote?: string,
): PPFemaleTemplate => ({
  id,
  code,
  name,
  intent,
  selection,
  requiredConditionalNodeIds,
  coachNote,
})

/**
 * Small PP-F2A reference catalog. Template identity stays separate from
 * Method-node identity; demand, breathing, and canonical identity resolve
 * through the existing PP Method and PP-F1 layers.
 */
export const ppFemaleProgrammingTemplates: readonly PPFemaleTemplate[] = [
  template(
    'fit-f01',
    'FIT-F01',
    'Foundation hip control',
    'foundation-control',
    {
      HIP: { nodeId: 'exp-assisted-sit-to-stand', challengeRole: 'PRIMARY_CHALLENGE' },
      SUPPORT: { nodeId: 'exp-incline-plank', challengeRole: 'SUPPORTING' },
      CORE: { nodeId: 'exp-open-book', challengeRole: 'SUPPORTING' },
    },
    [],
    'A-only foundation: low-demand hip challenge with incline support and thoracic control.',
  ),
  template(
    'fit-f02',
    'FIT-F02',
    'Foundation support stability',
    'support-stability',
    {
      HIP: { nodeId: 'exp-supported-90-90', challengeRole: 'SUPPORTING' },
      SUPPORT: { nodeId: 'exp-knee-side-plank', challengeRole: 'PRIMARY_CHALLENGE' },
      CORE: { nodeId: 'exp-open-book', challengeRole: 'SUPPORTING' },
    },
    [],
    'A-only foundation: moderate lateral support challenge balanced by low-demand hip and core work.',
  ),
  template(
    'fit-f03',
    'FIT-F03',
    'Foundation anti-extension core',
    'anti-extension-core',
    {
      HIP: { nodeId: 'exp-supported-90-90', challengeRole: 'SUPPORTING' },
      SUPPORT: { nodeId: 'exp-incline-plank', challengeRole: 'SUPPORTING' },
      CORE: { nodeId: 'pp26', challengeRole: 'PRIMARY_CHALLENGE' },
    },
    [],
    'A-only foundation: moderate anti-extension core challenge with low-demand hip and support choices.',
  ),
  template(
    'fit-f04',
    'FIT-F04',
    'Moderate hip-dominant control',
    'hip-dominant-control',
    {
      HIP: { nodeId: 'pp10', challengeRole: 'PRIMARY_CHALLENGE' },
      SUPPORT: { nodeId: 'pp16', challengeRole: 'SUPPORTING' },
      CORE: { nodeId: 'exp-open-book', challengeRole: 'SUPPORTING' },
    },
    [],
    'Moderate hip-extension challenge supported by plank stability and low-demand thoracic control.',
  ),
  template(
    'fit-f05',
    'FIT-F05',
    'Moderate support stability',
    'support-stability',
    {
      HIP: { nodeId: 'pp01', challengeRole: 'SUPPORTING' },
      SUPPORT: { nodeId: 'pp16', challengeRole: 'PRIMARY_CHALLENGE' },
      CORE: { nodeId: 'pp26', challengeRole: 'SUPPORTING' },
    },
    [],
    'Moderate support-primary combination with one clear challenge and two moderate stabilizers.',
  ),
  template(
    'fit-f06',
    'FIT-F06',
    'Moderate anti-extension core',
    'anti-extension-core',
    {
      HIP: { nodeId: 'pp02', challengeRole: 'SUPPORTING' },
      SUPPORT: { nodeId: 'exp-knee-side-plank', challengeRole: 'SUPPORTING' },
      CORE: { nodeId: 'pp26', challengeRole: 'PRIMARY_CHALLENGE' },
    },
    [],
    'Moderate core-primary combination with hinge and lateral-support prerequisites represented by the Method nodes.',
  ),
  template(
    'fit-f07',
    'FIT-F07',
    'Advanced integrated hip control',
    'advanced-integrated-control',
    {
      HIP: { nodeId: 'exp-single-leg-glute-bridge', challengeRole: 'PRIMARY_CHALLENGE' },
      SUPPORT: { nodeId: 'exp-quadruped-single-limb-lift', challengeRole: 'SUPPORTING' },
      CORE: { nodeId: 'pp26', challengeRole: 'SUPPORTING' },
    },
    ['exp-single-leg-glute-bridge', 'exp-quadruped-single-limb-lift'],
    'Conditional advanced hip-primary template: one HIGH challenge is balanced by low and moderate support.',
  ),
  template(
    'fit-f08',
    'FIT-F08',
    'Advanced support stability',
    'advanced-integrated-control',
    {
      HIP: { nodeId: 'exp-assisted-sit-to-stand', challengeRole: 'SUPPORTING' },
      SUPPORT: { nodeId: 'pp18', challengeRole: 'PRIMARY_CHALLENGE' },
      CORE: { nodeId: 'exp-open-book', challengeRole: 'SUPPORTING' },
    },
    ['pp18'],
    'Conditional advanced support-primary template: the HIGH lateral-support challenge remains the only primary demand.',
  ),
]
