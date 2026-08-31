import { composeFemale111Session } from './sessionComposer'
import { validateFemale111Session } from './sessionRules'
import type {
  Female111SessionBlockCandidate,
  Female111SessionBuildIssue,
  Female111SessionBuildResult,
  Female111SessionCandidate,
  Female111SessionDraft,
} from './types'

const legalCandidates = (candidates: readonly Female111SessionBlockCandidate[]): readonly Female111SessionBlockCandidate[] =>
  candidates.filter((candidate) => candidate.resolution.issues.length === 0 && Boolean(candidate.resolution.resolved))

const pairCandidate = (
  blockA: Female111SessionBlockCandidate,
  blockB: Female111SessionBlockCandidate,
): Female111SessionCandidate => ({
  blockAId: blockA.id,
  blockBId: blockB.id,
  score: blockA.targetFit + blockB.targetFit - blockA.venueCost - blockB.venueCost,
  rationale: `目标匹配 ${blockA.targetFit + blockB.targetFit}，场地成本 ${blockA.venueCost + blockB.venueCost}；保留教练对最终组合的确认权。`,
})

const noCandidateIssue = (side: 'A' | 'B'): Female111SessionBuildIssue => ({
  code: 'NO_LEGAL_CANDIDATE',
  message: `Block ${side} 没有通过规则验证的候选。`,
})

export const buildFemale111Session = (draft: Female111SessionDraft): Female111SessionBuildResult => {
  const blockACandidates = legalCandidates(draft.blockA)
  const blockBCandidates = legalCandidates(draft.blockB)
  const issues: Female111SessionBuildIssue[] = []
  if (blockACandidates.length === 0) issues.push(noCandidateIssue('A'))
  if (blockBCandidates.length === 0) issues.push(noCandidateIssue('B'))
  if (issues.length > 0) return { candidates: [], issues, requiresCoachReview: true }

  const candidates = blockACandidates.flatMap((blockA) => blockBCandidates.map((blockB) => pairCandidate(blockA, blockB)))
    .sort((left, right) => right.score - left.score)
  const top = candidates[0]
  const tied = candidates.filter((candidate) => candidate.score === top.score)
  if (tied.length > 1) {
    return {
      candidates,
      issues: [{
        code: 'CANDIDATES_REQUIRE_REVIEW',
        message: '存在多个同等合法的训练课组合，需要教练选择后才能继续。',
      }],
      requiresCoachReview: true,
    }
  }

  const blockA = blockACandidates.find((candidate) => candidate.id === top.blockAId)!
  const blockB = blockBCandidates.find((candidate) => candidate.id === top.blockBId)!
  const composed = composeFemale111Session({
    id: draft.id,
    prep: draft.prep,
    blockA: { id: blockA.id, resolution: blockA.resolution },
    blockB: { id: blockB.id, resolution: blockB.resolution },
    accessory: draft.accessory,
    stage: draft.stage,
    target: draft.target,
    timeBudgetMinutes: draft.timeBudgetMinutes,
    estimatedMinutes: draft.estimatedMinutes ?? 32,
    recovery: draft.recovery,
  })
  if (!composed.session) {
    return {
      candidates,
      issues: composed.issues.map((issue) => ({ code: 'NO_LEGAL_CANDIDATE', message: issue.message })),
      requiresCoachReview: true,
    }
  }

  const readyConditionalMethodNodeIds = [
    ...Object.values(blockA.resolution.resolved!.selection),
    ...Object.values(blockB.resolution.resolved!.selection),
  ].map((selection) => selection.methodNodeId)
  const validationIssues = validateFemale111Session(composed.session, { readyConditionalMethodNodeIds })
  if (validationIssues.length > 0) {
    return { candidates, issues: validationIssues, requiresCoachReview: true }
  }
  return { session: composed.session, candidates, issues: [], requiresCoachReview: false }
}
