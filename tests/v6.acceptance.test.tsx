import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import {
  allRoutes,
  getLibraryAction,
  getLibraryActionId,
  getLibraryActionsByExerciseId,
  libraryActions,
  movementPatterns,
  postpartumMovements,
  templates,
} from '../src/data/content'
import { getRoute } from '../src/lib/router'
import { buildTemplateCopyText } from '../src/lib/template-copy'
import { App } from '../src/App'
import appSource from '../src/App.tsx?raw'
import { resolveFemaleProgrammingTemplates } from '../src/data/pp'
import { getPostpartumPresentationBridgeRecord } from '../src/data/postpartumPresentationBridge'
import { bodyTemplates } from '../src/data/programming/bodyTemplates'
import { conditioningTemplates } from '../src/data/programming/conditioningTemplates'
import { threeCTemplates } from '../src/data/programming/threeCTemplates'
import { exerciseDisplayCategoryLabels, getExercise, resolveProgrammingExerciseId } from '../src/data/exercises'
import { resolveProgrammingLevel } from '../src/data/programming/rules'

const femaleRuntimeTemplates = resolveFemaleProgrammingTemplates()

const getSlotCard = (slot: 'HIP' | 'SUPPORT' | 'CORE') => {
  const heading = screen.getByRole('heading', { level: 2, name: slot })
  const card = heading.closest('.info-card')
  if (!(card instanceof HTMLElement)) throw new Error(`Missing slot card for ${slot}`)
  return within(card)
}

describe('7Fit V6 content contract', () => {
  it('keeps the 66 migrated route pages addressable', () => {
    expect(allRoutes).toHaveLength(66)
    expect(allRoutes).toContain('#/home')
    expect(allRoutes).toContain('#/templates/3c1/l1')
    expect(allRoutes).toContain('#/patterns/squat')
    expect(allRoutes).toContain('#/library/postpartum')
    expect(allRoutes).toContain('#/postpartum/pp01')
  })

  it('keeps all 16 templates at four levels and all 12 patterns', () => {
    expect(templates).toHaveLength(16)
    expect(templates.every((template) => Object.keys(template.levels).length === 4)).toBe(true)
    expect(movementPatterns).toHaveLength(12)
  })

  it('uses resolved conditioning source data instead of historical CON content', () => {
    const con1L1 = templates.find((template) => template.id === 'con1')!.levels.l1
    const con3L3 = templates.find((template) => template.id === 'con3')!.levels.l3
    const con3L4 = templates.find((template) => template.id === 'con3')!.levels.l4

    expect(con1L1.warmup[0]).toMatchObject({ name: 'RowErg 轻划', tag: 'Raise' })
    expect(con1L1.warmup.some((item) => item.tag === 'Specific Build-up')).toBe(true)
    expect(con1L1.exercises.map((exercise) => exercise.name)).toEqual(['RowErg'])
    expect(con3L3.exercises.map((exercise) => exercise.name)).toContain('药球下砸')
    expect(con3L3.exercises.map((exercise) => exercise.name)).not.toContain('划船机')
    expect(con3L4.exercises.map((exercise) => exercise.name)).toContain('药球下砸')
  })

  it('keeps CON05 L3 App-facing runtime at the standard three rounds', () => {
    const con5L3 = templates.find((template) => template.id === 'con5')!.levels.l3
    expect(con5L3.metrics).toContainEqual({ label: '轮数', value: '3 轮' })
    expect(con5L3.exercises).toHaveLength(4)
  })

  it('keeps every template level App-compatible after the Programming adapter', () => {
    expect(templates.filter((template) => template.system === '3c')).toHaveLength(6)
    expect(templates.filter((template) => template.system === 'body')).toHaveLength(5)
    for (const template of templates) {
      for (const level of ['l1', 'l2', 'l3', 'l4'] as const) {
        expect(template.levels[level].warmup.length).toBeGreaterThan(0)
        expect(template.levels[level].exercises.length).toBeGreaterThan(0)
      }
    }
  })

  it('propagates canonical exercise identity through all 64 Programming levels', () => {
    const formalTemplates = templates.filter((template) => ['3c', 'body', 'conditioning'].includes(template.system))
    expect(formalTemplates).toHaveLength(16)

    for (const template of formalTemplates) {
      for (const level of ['l1', 'l2', 'l3', 'l4'] as const) {
        const current = template.levels[level]
        expect(current.warmup.every((item) => typeof item.exerciseId === 'string' && item.exerciseId.length > 0)).toBe(true)
        expect(current.exercises.every((item) => typeof item.exerciseId === 'string' && item.exerciseId.length > 0)).toBe(true)
      }
    }
  })

  it('derives every adapter identity from its Programming exerciseKey', () => {
    for (const sourceTemplate of [...threeCTemplates, ...bodyTemplates, ...conditioningTemplates]) {
      const runtimeTemplate = templates.find((template) => template.id === sourceTemplate.id)!
      for (const level of ['l1', 'l2', 'l3', 'l4'] as const) {
        const resolved = resolveProgrammingLevel(sourceTemplate.levels[level])
        const expectedWarmupIds = [
          ...resolved.prep,
          ...(resolved.specificBuildUp ?? []),
          ...resolved.rampUp,
        ].map((item) => resolveProgrammingExerciseId(item.exerciseKey))
        const expectedExerciseIds = resolved.blocks.flatMap((block) => (
          block.exercises.map((item) => resolveProgrammingExerciseId(item.exerciseKey))
        ))

        expect(runtimeTemplate.levels[level].warmup.map((item) => item.exerciseId)).toEqual(expectedWarmupIds)
        expect(runtimeTemplate.levels[level].exercises.map((item) => item.exerciseId)).toEqual(expectedExerciseIds)
      }
    }
  })

  it('keeps display fields unchanged while adding canonical identity metadata', () => {
    const hackSquat = templates.find((template) => template.id === 'body1')!.levels.l3
    const skiErg = templates.find((template) => template.id === 'con1')!.levels.l1

    expect(hackSquat.exercises[0]).toMatchObject({
      name: '哈克深蹲',
      pattern: '下肢 · 蹲',
      prescription: expect.stringContaining('RIR 2'),
    })
    expect(skiErg.warmup[0]).toMatchObject({ name: 'RowErg 轻划', tag: 'Raise' })
    expect(skiErg.exercises[0]).toMatchObject({ name: 'RowErg', pattern: '背部 · 水平拉' })
  })

  it('derives formal Programming display categories from canonical Exercise metadata', () => {
    for (const template of templates.filter((template) => ['3c', 'body', 'conditioning'].includes(template.system))) {
      for (const level of ['l1', 'l2', 'l3', 'l4'] as const) {
        for (const exercise of template.levels[level].exercises) {
          expect(exercise.displayCategory).toBe(
            exerciseDisplayCategoryLabels[getExercise(exercise.exerciseId!)!.displayCategoryId],
          )
        }
      }
    }
  })

  it('keeps sled-push canonical display separate from contextual Programming pattern', () => {
    const c3cSled = templates.find((template) => template.id === '3c4')!.levels.l3.exercises
      .find((exercise) => exercise.exerciseId === 'sled-push')!
    const conSled = templates.find((template) => template.id === 'con2')!.levels.l1.exercises
      .find((exercise) => exercise.exerciseId === 'sled-push')!

    expect(c3cSled).toMatchObject({ exerciseId: 'sled-push', displayCategory: '体能', pattern: '后链 · 髋铰链' })
    expect(conSled).toMatchObject({ exerciseId: 'sled-push', displayCategory: '体能', pattern: '胸部 · 水平推' })
    expect(getExercise('sled-push')?.id).toBe('sled-push')
  })

  it('uses the resolved BODY default rather than the historical compound BODY content', () => {
    const body05L4 = templates.find((template) => template.id === 'body5')!.levels.l4
    expect(body05L4.exercises).toHaveLength(5)
    expect(body05L4.exercises.map((exercise) => exercise.name)).toContain('哑铃弯举')
    expect(body05L4.exercises.map((exercise) => exercise.name)).not.toContain('侧平举 + 后束飞鸟 + 三头')
  })

  it('keeps PP01–PP26 extracted coach-card text and the 34 bidirectional pattern edges', () => {
    expect(postpartumMovements).toHaveLength(26)
    expect(postpartumMovements.every((movement) => movement.cardContent.overview && movement.cardContent.coachingPoints.length > 0)).toBe(true)
    expect(postpartumMovements.some((movement) => 'frontCard' in movement || 'backCard' in movement)).toBe(false)
    expect(postpartumMovements.flatMap((movement) => movement.movementPatterns).length).toBe(34)
  })

  it('indexes migrated warmup and main-training actions for direct library lookup', () => {
    const warmupId = getLibraryActionId('SkiErg', '背部 · 垂直拉')
    const mainId = getLibraryActionId('哈克深蹲', '下肢 · 蹲')
    expect(warmupId).toBeTruthy()
    expect(mainId).toBeTruthy()
    expect(libraryActions.length).toBeGreaterThan(40)
    expect(getLibraryAction(warmupId!)).toMatchObject({ name: 'SkiErg' })
    expect(getLibraryAction(mainId!)).toMatchObject({ name: '哈克深蹲' })
  })

  it('indexes library actions by canonical exercise identity without replacing action routes', () => {
    const sledActions = getLibraryActionsByExerciseId('sled-push')
    const sledSources = sledActions.flatMap((action) => action.sources)

    expect(sledActions.length).toBeGreaterThan(0)
    expect(sledActions.every((action) => action.exerciseId === 'sled-push')).toBe(true)
    expect(sledSources.some((source) => source.templateId === '3c4' && source.exerciseId === 'sled-push')).toBe(true)
    expect(sledSources.some((source) => source.templateId === 'con2' && source.exerciseId === 'sled-push')).toBe(true)
    expect(sledActions.every((action) => /^action-\d+$/.test(action.id))).toBe(true)
    expect(sledActions.every((action) => action.id !== action.exerciseId)).toBe(true)
  })

  it('builds a complete copyable training brief', () => {
    const template = templates.find((item) => item.id === '3c1')!
    const text = buildTemplateCopyText(template, template.levels.l3)
    expect(text).toContain('3C 代谢力量')
    expect(text).toContain('热身与动作准备')
    expect(text).toContain('滑雪机轻拉')
    expect(text).toContain('Strength Block + 3C Circuit')
    expect(text).toContain('哈克深蹲')
    expect(text).toContain('RIR 2')
  })

  it('uses canonical display category in formal Programming library actions', () => {
    const sledActions = getLibraryActionsByExerciseId('sled-push')

    expect(sledActions.length).toBeGreaterThan(0)
    expect(sledActions.every((action) => action.category === '体能')).toBe(true)
    expect(sledActions.some((action) => action.context === '后链 · 髋铰链')).toBe(true)
    expect(sledActions.some((action) => action.context === '胸部 · 水平推')).toBe(true)
  })

  it('uses canonical display category in App-facing template and copy views', () => {
    const con2 = templates.find((template) => template.id === 'con2')!
    const text = buildTemplateCopyText(con2, con2.levels.l1)

    expect(text).toContain('Sled Push｜体能｜')
    expect(text).not.toContain('Sled Push｜后链 · 髋铰链｜')
    expect(text).not.toContain('Sled Push｜胸部 · 水平推｜')

    window.location.hash = '#/templates/con2/l1'
    render(<App />)
    expect(screen.getByText('体能')).toBeInTheDocument()
    expect(screen.queryByText('后链 · 髋铰链')).toBeNull()
    expect(screen.queryByText('胸部 · 水平推')).toBeNull()
  })
})

describe('7Fit V6 routing and shell', () => {
  beforeEach(() => {
    window.location.hash = '#/home'
    localStorage.clear()
  })
  afterEach(() => cleanup())

  it('parses hash deep links and unknown paths safely', () => {
    expect(getRoute('#/templates/3c1/l1')).toEqual({ name: 'template-detail', system: '3c1', level: 'l1' })
    expect(getRoute('#/female/fit-f01')).toEqual({ name: 'female-template-detail', id: 'fit-f01' })
    expect(getRoute('#/female/fit-f01/l1')).toEqual({ name: 'female-template-detail', id: 'fit-f01' })
    expect(getRoute('#/postpartum/pp01')).toEqual({ name: 'postpartum-detail', id: 'pp01' })
    expect(getRoute('#/library/action/action-001')).toEqual({ name: 'action-detail', id: 'action-001' })
    expect(getRoute('#/unknown')).toEqual({ name: 'home' })
    const femaleRoute = getRoute('#/female/fit-f01')
    expect('level' in femaleRoute).toBe(false)
  })

  it('renders a migrated template action as a library detail link', () => {
    window.location.hash = '#/templates/3c1/l3'
    render(<App />)
    expect(screen.getByRole('link', { name: /滑雪机轻拉/ })).toHaveAttribute('href', expect.stringMatching(/#\/library\/action\/action-/))
    expect(screen.getByRole('link', { name: '查看动作详情：哈克深蹲' })).toHaveAttribute('href', expect.stringMatching(/#\/library\/action\/action-/))
  })

  it('renders semantic navigation, search and the theme control', () => {
    render(<App />)
    expect(screen.getByRole('navigation')).toBeInTheDocument()
    expect(screen.getByRole('searchbox')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /夜间|浅色|主题/ })).toBeInTheDocument()
    expect(screen.getByText('教练工作台')).toBeInTheDocument()
  })

  it('renders PP details as text content with an inline video and no coach-card image', () => {
    window.location.hash = '#/postpartum/pp01'
    render(<App />)
    expect(screen.getByText('教练卡内容（文字版）')).toBeInTheDocument()
    expect(screen.getByText('L1 → L2')).toBeInTheDocument()
    expect(screen.getByTitle('PP01 主视频')).toBeInTheDocument()
    expect(document.querySelector('.pp-detail-page img')).toBeNull()
  })

  it('renders frozen Method metadata as a separate read-only surface beside legacy PP01 presentation', () => {
    const record = getPostpartumPresentationBridgeRecord('pp01')!
    if (record.methodNode.mapping.status !== 'variant') throw new Error('Expected PP01 to be a variant mapping')

    window.location.hash = '#/postpartum/pp01'
    render(<App />)

    expect(screen.getByText('教练卡内容（文字版）')).toBeInTheDocument()
    const methodHeading = screen.getByRole('heading', { level: 2, name: '方法层（只读）' })
    const methodSection = methodHeading.closest('section')
    if (!(methodSection instanceof HTMLElement)) throw new Error('Missing postpartum Method section')
    const method = within(methodSection)

    expect(method.getByText(record.methodNode.id)).toBeInTheDocument()
    expect(method.getByText(record.methodNode.progressionLevel)).toBeInTheDocument()
    expect(method.getAllByText(record.methodNode.kind)).toHaveLength(2)
    expect(method.getByText(record.methodNode.role)).toBeInTheDocument()
    expect(method.getAllByText(record.methodNode.primaryPathway)).toHaveLength(2)
    expect(method.getAllByText(record.methodNode.mapping.status)).toHaveLength(2)
    expect(method.getByText(record.methodNode.mapping.variantId)).toBeInTheDocument()
    expect(method.getByText(record.methodNode.breathing.mode)).toBeInTheDocument()
    expect(method.getByText(record.methodNode.breathing.pressureIntent)).toBeInTheDocument()
    for (const criterion of record.methodNode.qualityGate.criteria) {
      expect(method.getByText(new RegExp(criterion.requirement))).toBeInTheDocument()
    }
    for (const compensation of record.methodNode.commonCompensations) {
      expect(method.getByText(new RegExp(compensation))).toBeInTheDocument()
    }
  })

  it('keeps method-only PP17 distinct from canonical exercise identity while exposing its host', () => {
    const record = getPostpartumPresentationBridgeRecord('pp17')!
    if (record.methodNode.mapping.status !== 'method-only' || !record.methodNode.hostExerciseId) {
      throw new Error('Expected PP17 to be a method-only node with a host exercise')
    }

    window.location.hash = '#/postpartum/pp17'
    render(<App />)

    const methodHeading = screen.getByRole('heading', { level: 2, name: '方法层（只读）' })
    const methodSection = methodHeading.closest('section')
    if (!(methodSection instanceof HTMLElement)) throw new Error('Missing postpartum Method section')
    const method = within(methodSection)

    expect(method.getByText('method-only')).toBeInTheDocument()
    expect(method.getAllByText('drill')).toHaveLength(2)
    const hostLabel = method.getByText('Host exercise')
    expect(hostLabel.nextElementSibling).toHaveTextContent(record.methodNode.hostExerciseId)
    expect(method.queryByText('canonical exercise')).toBeNull()
  })

  it('keeps the existing safe empty route for an unknown postpartum id', () => {
    window.location.hash = '#/postpartum/does-not-exist'
    render(<App />)

    expect(screen.getByRole('heading', { level: 1, name: '专项动作不存在' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '返回' })).toHaveAttribute('href', '#/library/postpartum')
  })

  it('keeps App dependent on the frozen bridge instead of rebuilding the Method join', () => {
    expect(appSource).toContain("getPostpartumPresentationBridgeRecord")
    expect(appSource).not.toMatch(/from ['"]\.\/data\/pp\/methodNodes['"]/
    )
    expect(appSource).not.toMatch(/\b(?:ppMethodNodeById|ppMethodNodes)\b/)
    expect(appSource.match(/getPostpartumPresentationBridgeRecord/g)).toHaveLength(3)
  })

  it('renders a separate female runtime section on the templates page with eight dedicated links', () => {
    window.location.hash = '#/templates'
    render(<App />)

    const femaleHeading = screen.getByRole('heading', { level: 2, name: '女性 1+1+1' })
    const femaleSection = femaleHeading.closest('.section-block')
    if (!(femaleSection instanceof HTMLElement)) throw new Error('Missing female runtime section')

    expect(within(femaleSection).getByText('8 个模板')).toBeInTheDocument()
    expect(within(femaleSection).queryByText('4 个方案等级')).toBeNull()

    const expectedLinks = femaleRuntimeTemplates.map(({ template }) => `#/female/${template.id}`)
    const actualLinks = Array.from(femaleSection.querySelectorAll<HTMLAnchorElement>('a.template-card'))
      .map((link) => link.getAttribute('href'))

    expect(actualLinks).toEqual(expectedLinks)
    expect(actualLinks.every((href) => typeof href === 'string' && !/\/l[1-4]$/.test(href))).toBe(true)

    for (const { template } of femaleRuntimeTemplates) {
      expect(within(femaleSection).getByText(template.code)).toBeInTheDocument()
    }
  })

  it('renders female detail with exactly HIP SUPPORT CORE and keeps Templates nav active', () => {
    window.location.hash = '#/female/fit-f01'
    render(<App />)

    expect(screen.getByRole('heading', { level: 2, name: 'HIP' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'SUPPORT' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'CORE' })).toBeInTheDocument()
    expect(screen.queryByText('BREATH')).toBeNull()
    expect(screen.queryByRole('tablist', { name: '方案等级' })).toBeNull()
    expect(screen.getAllByText('PRIMARY_CHALLENGE')).toHaveLength(1)
    expect(screen.getAllByText('SUPPORTING')).toHaveLength(2)

    const nav = screen.getByRole('navigation', { name: '主导航' })
    expect(within(nav).getByRole('link', { name: '模板' })).toHaveClass('active')
  })

  it('shows mapped canonical semantics without a variant id for FIT-F04 HIP', () => {
    const mappedHip = femaleRuntimeTemplates.find((item) => item.template.id === 'fit-f04')!.slots.HIP

    window.location.hash = '#/female/fit-f04'
    render(<App />)

    const hipCard = getSlotCard('HIP')
    expect(hipCard.getByText(mappedHip.methodNode.id)).toBeInTheDocument()
    expect(hipCard.getByText(mappedHip.canonical.exercise.id)).toBeInTheDocument()
    expect(hipCard.getByText(mappedHip.canonical.exercise.name)).toBeInTheDocument()
    expect(hipCard.getByText(mappedHip.canonical.mapping.status)).toBeInTheDocument()
    expect(hipCard.queryByText('pp01-hip-dominant-squat')).toBeNull()
  })

  it('shows variant canonical semantics for FIT-F05 HIP', () => {
    const variantHip = femaleRuntimeTemplates.find((item) => item.template.id === 'fit-f05')!.slots.HIP
    if (variantHip.canonical.mapping.status !== 'variant') throw new Error('Expected FIT-F05 HIP to resolve as a variant mapping')

    window.location.hash = '#/female/fit-f05'
    render(<App />)

    const hipCard = getSlotCard('HIP')
    expect(hipCard.getByText(variantHip.canonical.exercise.id)).toBeInTheDocument()
    expect(hipCard.getByText(variantHip.canonical.exercise.name)).toBeInTheDocument()
    expect(hipCard.getByText(variantHip.canonical.mapping.status)).toBeInTheDocument()
    expect(hipCard.getByText(variantHip.canonical.mapping.variantId)).toBeInTheDocument()
  })

  it('shows conditional readiness as read-only runtime state for FIT-F07', () => {
    const fitF07 = femaleRuntimeTemplates.find((item) => item.template.id === 'fit-f07')!

    window.location.hash = '#/female/fit-f07'
    render(<App />)

    const hipCard = getSlotCard('HIP')
    const supportCard = getSlotCard('SUPPORT')
    const coreCard = getSlotCard('CORE')

    expect(fitF07.slots.HIP.requiresConditionalReadiness).toBe(true)
    expect(fitF07.slots.SUPPORT.requiresConditionalReadiness).toBe(true)
    expect(fitF07.slots.CORE.requiresConditionalReadiness).toBe(false)

    expect(hipCard.getByText('需要条件就绪')).toBeInTheDocument()
    expect(supportCard.getByText('需要条件就绪')).toBeInTheDocument()
    expect(coreCard.getByText('无需额外条件就绪')).toBeInTheDocument()
    expect(screen.queryByText('已就绪')).toBeNull()
    expect(screen.queryByText('未就绪')).toBeNull()
  })

  it('shows method and policy metadata from the resolved runtime for FIT-F04 HIP', () => {
    const fitF04Hip = femaleRuntimeTemplates.find((item) => item.template.id === 'fit-f04')!.slots.HIP

    window.location.hash = '#/female/fit-f04'
    render(<App />)

    const hipCard = getSlotCard('HIP')
    expect(hipCard.getByText(fitF04Hip.methodNode.breathing.mode)).toBeInTheDocument()
    expect(hipCard.getByText(fitF04Hip.methodNode.breathing.pressureIntent)).toBeInTheDocument()
    expect(hipCard.getByText(fitF04Hip.methodNode.breathing.inhale!)).toBeInTheDocument()
    expect(hipCard.getByText(fitF04Hip.methodNode.breathing.exhale!)).toBeInTheDocument()
    for (const criterion of fitF04Hip.methodNode.qualityGate.criteria) {
      expect(hipCard.getByText(criterion.requirement)).toBeInTheDocument()
    }
    for (const compensation of fitF04Hip.methodNode.commonCompensations) {
      expect(hipCard.getByText(compensation)).toBeInTheDocument()
    }
    expect(hipCard.getByText(fitF04Hip.policy.eligibility)).toBeInTheDocument()
    expect(hipCard.getByText(fitF04Hip.policy.demand)).toBeInTheDocument()
  })

  it('uses the existing safe empty route for unknown female template ids', () => {
    window.location.hash = '#/female/does-not-exist'
    render(<App />)

    expect(screen.getByRole('heading', { level: 1, name: '模板不存在' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '返回' })).toHaveAttribute('href', '#/templates')
  })
})
