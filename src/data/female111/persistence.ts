import type { Female111SessionResult } from './types'

const resultsKey = '7fit-female111-v2-session-results'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const isSessionResult = (value: unknown): value is Female111SessionResult => {
  if (!isRecord(value)) return false
  return typeof value.id === 'string'
    && typeof value.sessionId === 'string'
    && typeof value.recordedAt === 'string'
    && typeof value.readiness === 'string'
    && isRecord(value.primary)
    && isRecord(value.support)
    && isRecord(value.core)
}

const getStorage = (): Storage | undefined => {
  try {
    return typeof globalThis.localStorage === 'undefined' ? undefined : globalThis.localStorage
  } catch {
    return undefined
  }
}

const readResults = (): Female111SessionResult[] => {
  const storage = getStorage()
  if (!storage) return []
  try {
    const parsed: unknown = JSON.parse(storage.getItem(resultsKey) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter(isSessionResult) : []
  } catch {
    return []
  }
}

const writeResults = (results: readonly Female111SessionResult[]): void => {
  const storage = getStorage()
  if (!storage) return
  try {
    storage.setItem(resultsKey, JSON.stringify(results))
  } catch {
    // Persistence is an enhancement; execution records remain available in memory.
  }
}

export const listFemale111SessionResults = (): readonly Female111SessionResult[] =>
  readResults().sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))

export const getFemale111SessionResult = (
  id: string,
): Female111SessionResult | undefined =>
  listFemale111SessionResults().find((result) => result.id === id)

export const saveFemale111SessionResult = (
  result: Female111SessionResult,
): Female111SessionResult => {
  const next = [result, ...readResults().filter((item) => item.id !== result.id)]
  writeResults(next)
  return result
}

let copySequence = 0

export const copyFemale111SessionResult = (
  sourceId: string,
  overrides: Partial<Pick<Female111SessionResult, 'id' | 'recordedAt'>> = {},
): Female111SessionResult | undefined => {
  const source = getFemale111SessionResult(sourceId)
  if (!source) return undefined
  const copy: Female111SessionResult = {
    ...source,
    id: overrides.id ?? `${source.id}-copy-${Date.now()}-${copySequence++}`,
    recordedAt: overrides.recordedAt ?? new Date().toISOString(),
    primary: { ...source.primary },
    support: { ...source.support },
    core: { ...source.core },
    blockResults: source.blockResults
      ? {
          A: {
            primary: { ...source.blockResults.A.primary },
            support: { ...source.blockResults.A.support },
            core: { ...source.blockResults.A.core },
          },
          B: {
            primary: { ...source.blockResults.B.primary },
            support: { ...source.blockResults.B.support },
            core: { ...source.blockResults.B.core },
          },
        }
      : undefined,
    coachDecisionOverrides: source.coachDecisionOverrides
      ? source.coachDecisionOverrides.map((override) => ({ ...override }))
      : undefined,
  }
  return saveFemale111SessionResult(copy)
}
