import { postpartumMovements } from './content'
import { ppMethodNodeById, ppMethodNodes } from './pp/methodNodes'
import type { ActionEntity } from './content'
import type { PPMethodNode } from './pp/types'

export type PPPostpartumPresentationRecord = {
  presentation: ActionEntity
  methodNode: PPMethodNode
}

export type PPPostpartumPresentationBridgeSources = {
  presentations: readonly ActionEntity[]
  methodNodes: readonly PPMethodNode[]
}

export type PPPostpartumPresentationBridgeIssueCode =
  | 'RECORD_COUNT_DRIFT'
  | 'DUPLICATE_PRESENTATION_ID'
  | 'DUPLICATE_METHOD_NODE_ID'
  | 'DUPLICATE_METHOD_SOURCE_ID'
  | 'MISSING_PRESENTATION_COUNTERPART'
  | 'MISSING_METHOD_COUNTERPART'
  | 'SOURCE_ID_MISMATCH'
  | 'SOURCE_NAME_MISMATCH'
  | 'SOURCE_ORIGIN_MISMATCH'
  | 'INVALID_SOURCE_NODE_IDENTITY'
  | 'EXPANSION_NODE_PRESENT'
  | 'INVALID_ROOT_SHAPE'

export type PPPostpartumPresentationBridgeIssue = {
  code: PPPostpartumPresentationBridgeIssueCode
  message: string
  presentationId?: string
  methodNodeId?: string
}

const EXPECTED_PRESENTATION_COUNT = 26
const expectedPresentationIds = new Set(
  Array.from({ length: EXPECTED_PRESENTATION_COUNT }, (_, index) => `pp${String(index + 1).padStart(2, '0')}`),
)

const defaultBridgeSources: PPPostpartumPresentationBridgeSources = {
  presentations: postpartumMovements,
  methodNodes: ppMethodNodes,
}

const createIssue = (
  code: PPPostpartumPresentationBridgeIssueCode,
  message: string,
  details: Pick<PPPostpartumPresentationBridgeIssue, 'presentationId' | 'methodNodeId'> = {},
): PPPostpartumPresentationBridgeIssue => ({
  code,
  message,
  ...details,
})

const isObject = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null
)

const isPresentationRecordShape = (value: unknown): value is Partial<PPPostpartumPresentationRecord> => {
  if (!isObject(value)) return false
  return 'presentation' in value || 'methodNode' in value
}

const validateSourceCatalog = (sources: PPPostpartumPresentationBridgeSources): PPPostpartumPresentationBridgeIssue[] => {
  const issues: PPPostpartumPresentationBridgeIssue[] = []
  const presentationIds = new Set<string>()
  const methodNodeIds = new Set<string>()
  const methodSourceIds = new Set<string>()
  const presentationById = new Map<string, ActionEntity>()
  const methodNodeById = new Map<string, PPMethodNode>()
  const sourceMethodNodes = sources.methodNodes.filter((methodNode) => methodNode.source?.origin === 'postpartum-course')

  if (sources.presentations.length !== EXPECTED_PRESENTATION_COUNT) {
    issues.push(createIssue(
      'RECORD_COUNT_DRIFT',
      `expected ${EXPECTED_PRESENTATION_COUNT} presentation records, got ${sources.presentations.length}`,
    ))
  }
  if (sourceMethodNodes.length !== EXPECTED_PRESENTATION_COUNT) {
    issues.push(createIssue(
      'RECORD_COUNT_DRIFT',
      `expected ${EXPECTED_PRESENTATION_COUNT} method nodes, got ${sourceMethodNodes.length}`,
    ))
  }

  for (const presentation of sources.presentations) {
    if (presentationIds.has(presentation.id)) {
      issues.push(createIssue(
        'DUPLICATE_PRESENTATION_ID',
        `duplicate presentation id: ${presentation.id}`,
        { presentationId: presentation.id },
      ))
    }
    presentationIds.add(presentation.id)
    presentationById.set(presentation.id, presentation)
    if (presentation.id.startsWith('exp-')) {
      issues.push(createIssue(
        'EXPANSION_NODE_PRESENT',
        `expansion presentation is not allowed in the bridge catalog: ${presentation.id}`,
        { presentationId: presentation.id },
      ))
    }
  }

  for (const methodNode of sourceMethodNodes) {
    if (methodNodeIds.has(methodNode.id)) {
      issues.push(createIssue(
        'DUPLICATE_METHOD_NODE_ID',
        `duplicate method node id: ${methodNode.id}`,
        { methodNodeId: methodNode.id },
      ))
    }
    methodNodeIds.add(methodNode.id)
    methodNodeById.set(methodNode.id, methodNode)
    if (methodNode.id.startsWith('exp-')) {
      issues.push(createIssue(
        'EXPANSION_NODE_PRESENT',
        `expansion method node is not allowed in the bridge catalog: ${methodNode.id}`,
        { methodNodeId: methodNode.id },
      ))
    }

    if (methodNode.source) {
      if (methodSourceIds.has(methodNode.source.sourceId)) {
        issues.push(createIssue(
          'DUPLICATE_METHOD_SOURCE_ID',
          `duplicate method source id: ${methodNode.source.sourceId}`,
          { methodNodeId: methodNode.id },
        ))
      }
      methodSourceIds.add(methodNode.source.sourceId)

      const presentation = presentationById.get(methodNode.id)
      if (presentation && methodNode.source.sourceId !== presentation.id.toUpperCase()) {
        issues.push(createIssue(
          'SOURCE_ID_MISMATCH',
          `method node source id mismatch: ${methodNode.id}`,
          { presentationId: presentation.id, methodNodeId: methodNode.id },
        ))
      }
      if (presentation && methodNode.source.sourceName !== presentation.name) {
        issues.push(createIssue(
          'SOURCE_NAME_MISMATCH',
          `method node source name mismatch: ${methodNode.id}`,
          { presentationId: presentation.id, methodNodeId: methodNode.id },
        ))
      }
    }
  }

  for (const presentationId of expectedPresentationIds) {
    if (!presentationById.has(presentationId)) {
      issues.push(createIssue(
        'MISSING_PRESENTATION_COUNTERPART',
        `missing presentation counterpart: ${presentationId}`,
        { presentationId },
      ))
    }
    if (!methodNodeById.has(presentationId)) {
      issues.push(createIssue(
        'MISSING_METHOD_COUNTERPART',
        `missing method counterpart: ${presentationId}`,
        { methodNodeId: presentationId },
      ))
    }
  }

  return issues
}

const validateBridgeCatalog = (records: readonly Partial<PPPostpartumPresentationRecord>[]): PPPostpartumPresentationBridgeIssue[] => {
  const issues: PPPostpartumPresentationBridgeIssue[] = []
  const presentationIds = new Set<string>()
  const methodNodeIds = new Set<string>()
  const methodSourceIds = new Set<string>()

  if (records.length !== EXPECTED_PRESENTATION_COUNT) {
    issues.push(createIssue(
      'RECORD_COUNT_DRIFT',
      `expected ${EXPECTED_PRESENTATION_COUNT} bridge records, got ${records.length}`,
    ))
  }

  for (const record of records) {
    if (!isPresentationRecordShape(record)) {
      issues.push(createIssue('INVALID_ROOT_SHAPE', 'bridge record must expose presentation and methodNode'))
      continue
    }

    const { presentation, methodNode } = record

    if (!presentation) {
      issues.push(createIssue('MISSING_PRESENTATION_COUNTERPART', 'bridge record is missing presentation'))
      continue
    }
    if (!methodNode) {
      issues.push(createIssue('MISSING_METHOD_COUNTERPART', 'bridge record is missing methodNode', { presentationId: presentation.id }))
      continue
    }

    if (Object.keys(record).length !== 2 || !('presentation' in record) || !('methodNode' in record)) {
      issues.push(createIssue(
        'INVALID_ROOT_SHAPE',
        `bridge record root must contain only presentation and methodNode: ${presentation.id}`,
        { presentationId: presentation.id, methodNodeId: methodNode.id },
      ))
    }

    if (presentation.id.startsWith('exp-') || methodNode.id.startsWith('exp-')) {
      issues.push(createIssue(
        'EXPANSION_NODE_PRESENT',
        `expansion node is not allowed in the bridge catalog: ${presentation.id} / ${methodNode.id}`,
        { presentationId: presentation.id, methodNodeId: methodNode.id },
      ))
    }

    if (presentationIds.has(presentation.id)) {
      issues.push(createIssue(
        'DUPLICATE_PRESENTATION_ID',
        `duplicate presentation id: ${presentation.id}`,
        { presentationId: presentation.id },
      ))
    }
    presentationIds.add(presentation.id)

    if (methodNodeIds.has(methodNode.id)) {
      issues.push(createIssue(
        'DUPLICATE_METHOD_NODE_ID',
        `duplicate method node id: ${methodNode.id}`,
        { methodNodeId: methodNode.id },
      ))
    }
    methodNodeIds.add(methodNode.id)

    if (methodNode.source?.sourceId) {
      if (methodSourceIds.has(methodNode.source.sourceId)) {
        issues.push(createIssue(
          'DUPLICATE_METHOD_SOURCE_ID',
          `duplicate method source id: ${methodNode.source.sourceId}`,
          { methodNodeId: methodNode.id },
        ))
      }
      methodSourceIds.add(methodNode.source.sourceId)
    }

    if (presentation !== postpartumMovements.find((item) => item.id === presentation.id) || methodNode !== ppMethodNodeById.get(methodNode.id)) {
      issues.push(createIssue(
        'INVALID_SOURCE_NODE_IDENTITY',
        `bridge record does not preserve the original presentation and methodNode references: ${presentation.id}`,
        { presentationId: presentation.id, methodNodeId: methodNode.id },
      ))
    }

    if (methodNode.source?.origin !== 'postpartum-course') {
      issues.push(createIssue(
        'SOURCE_ORIGIN_MISMATCH',
        `method node source origin mismatch: ${methodNode.id}`,
        { presentationId: presentation.id, methodNodeId: methodNode.id },
      ))
    }

    if (methodNode.source?.sourceId !== presentation.id.toUpperCase()) {
      issues.push(createIssue(
        'SOURCE_ID_MISMATCH',
        `method node source id mismatch: ${methodNode.id}`,
        { presentationId: presentation.id, methodNodeId: methodNode.id },
      ))
    }

    if (methodNode.source?.sourceName !== presentation.name) {
      issues.push(createIssue(
        'SOURCE_NAME_MISMATCH',
        `method node source name mismatch: ${methodNode.id}`,
        { presentationId: presentation.id, methodNodeId: methodNode.id },
      ))
    }
  }

  for (const presentationId of expectedPresentationIds) {
    if (!presentationIds.has(presentationId)) {
      issues.push(createIssue(
        'MISSING_PRESENTATION_COUNTERPART',
        `missing presentation counterpart: ${presentationId}`,
        { presentationId },
      ))
    }
    if (!methodNodeIds.has(presentationId)) {
      issues.push(createIssue(
        'MISSING_METHOD_COUNTERPART',
        `missing method counterpart: ${presentationId}`,
        { methodNodeId: presentationId },
      ))
    }
  }

  return issues
}

export const validatePostpartumPresentationBridge = (
  records: readonly Partial<PPPostpartumPresentationRecord>[],
): readonly PPPostpartumPresentationBridgeIssue[] => validateBridgeCatalog(records)

export const buildPostpartumPresentationBridgeCatalog = (
  sources: PPPostpartumPresentationBridgeSources = defaultBridgeSources,
): readonly PPPostpartumPresentationRecord[] => {
  const issues = validateSourceCatalog(sources)
  if (issues.length > 0) {
    const summary = issues.map((issue) => issue.message).join('; ')
    throw new Error(`Invalid postpartum presentation bridge sources: ${summary}`)
  }

  const sourceMethodNodes = sources.methodNodes.filter((methodNode) => methodNode.source?.origin === 'postpartum-course')
  const methodNodeById = new Map(sourceMethodNodes.map((methodNode) => [methodNode.id, methodNode] as const))

  return sources.presentations.map((presentation) => {
    const methodNode = methodNodeById.get(presentation.id)
    if (!methodNode) {
      throw new Error(`Missing method node for postpartum presentation: ${presentation.id}`)
    }
    return {
      presentation,
      methodNode,
    }
  })
}

export const postpartumPresentationBridgeCatalog = buildPostpartumPresentationBridgeCatalog()

export const postpartumPresentationBridgeById = new Map(
  postpartumPresentationBridgeCatalog.map((record) => [record.presentation.id, record] as const),
)

export const getPostpartumPresentationBridgeRecord = (
  id: string,
): PPPostpartumPresentationRecord | undefined => postpartumPresentationBridgeById.get(id)
