import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { App } from '../src/App'
import appSource from '../src/App.tsx?raw'
import { getLibraryAction, librarySections } from '../src/data/content'
import { getRoute } from '../src/lib/router'

afterEach(() => {
  cleanup()
  window.location.hash = '#/home'
})

describe('PP-F111-C7 Chinese coach product integration', () => {
  it('exposes PPF111 as a training template from the templates page', () => {
    expect(getRoute('#/templates/female111')).toEqual({ name: 'female111-template' })

    window.location.hash = '#/templates'
    render(<App />)

    const femaleHeading = screen.getByRole('heading', { level: 2, name: '女性 1+1+1' })
    const femaleSection = femaleHeading.closest('.section-block')
    expect(femaleSection).not.toBeNull()
    expect(screen.getByRole('link', { name: /PPF111.*女性 1\+1\+1/ })).toHaveAttribute('href', '#/templates/female111')
  })

  it('shows the eight PPF111 recipe templates in the Female 1+1+1 section', () => {
    window.location.hash = '#/templates'
    render(<App />)

    const femaleHeading = screen.getByRole('heading', { level: 2, name: '女性 1+1+1' })
    const femaleSection = femaleHeading.closest('.section-block')
    if (!(femaleSection instanceof HTMLElement)) throw new Error('Missing female runtime section')

    expect(screen.getByText('PPF111 编排模板')).toBeInTheDocument()
    expect(screen.getAllByText('8 个编排模板')).toHaveLength(2)
    expect(femaleSection.querySelectorAll('.female111-recipe-card')).toHaveLength(8)
    expect(screen.getByText('深蹲 + 前侧支撑 + 抗伸展')).toBeInTheDocument()
    expect(screen.getByText('全身综合 + 支撑整合 + 动态核心')).toBeInTheDocument()
    expect(screen.getByText('兼容入口：旧版 Female FIT-F01–F08')).toBeInTheDocument()
  })

  it('defaults a recipe detail page to a complete L1 course', () => {
    expect(getRoute('#/templates/female111/F111-03')).toEqual({
      name: 'female111-template-detail', recipeId: 'F111-03', level: 'l1',
    })

    window.location.hash = '#/templates'
    render(<App />)

    expect(screen.getAllByRole('link', { name: /F111-0[1-8]/ })).toHaveLength(8)
    expect(screen.getAllByRole('link', { name: /F111-0[1-8]/ })[2]).toHaveAttribute('href', '#/templates/female111/F111-03')

    window.location.hash = '#/templates/female111/F111-03'
    cleanup()
    render(<App />)

    expect(screen.getByRole('heading', { level: 1, name: /F111-03/ })).toBeInTheDocument()
    expect(screen.getByText('L1')).toBeInTheDocument()
    expect(screen.getByText('R · 提升')).toBeInTheDocument()
    expect(screen.getByText('专项渐进热身')).toBeInTheDocument()
    expect(screen.getByText('主训练序列')).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /查看动作详情/ }).length).toBeGreaterThanOrEqual(9)
    expect(screen.queryByText('训练块 A')).not.toBeInTheDocument()
    expect(screen.queryByText('训练块 B')).not.toBeInTheDocument()
  })

  it('switches from L1 to L4 without leaving the recipe detail route', () => {
    window.location.hash = '#/templates/female111/F111-03/l1'
    render(<App />)
    const l4 = screen.getByRole('tab', { name: /L4/ })
    expect(l4).toHaveAttribute('href', '#/templates/female111/F111-03/l4')
    fireEvent.click(l4)
    expect(getRoute()).toEqual({ name: 'female111-template-detail', recipeId: 'F111-03', level: 'l4' })
  })

  it('resolves every rendered PPF111 action link to an existing route target', () => {
    const recipeIds = Array.from({ length: 8 }, (_, index) => `F111-0${index + 1}`)
    const levels = ['l1', 'l2', 'l3', 'l4'] as const
    const validLibrarySectionIds = new Set(librarySections.map((section) => section.id))

    for (const recipeId of recipeIds) {
      for (const level of levels) {
        window.location.hash = `#/templates/female111/${recipeId}/${level}`
        const view = render(<App />)
        const actionLinks = screen.getAllByRole('link', { name: /查看动作详情/ })
        expect(actionLinks.length).toBeGreaterThanOrEqual(9)

        for (const link of actionLinks) {
          const href = link.getAttribute('href')
          expect(href).toMatch(/^#\/library/)
          const route = getRoute(href ?? '')
          if (route.name === 'action-detail') {
            expect(getLibraryAction(route.id)).toBeDefined()
          } else if (route.name === 'library-detail') {
            expect(validLibrarySectionIds.has(route.id)).toBe(true)
          } else {
            throw new Error(`Unexpected PPF111 action route: ${href}`)
          }
        }

        view.unmount()
      }
    }
  })

  it('does not parse a level-only Female111 template hash as a recipe detail', () => {
    expect(getRoute('#/templates/female111/l4')).toEqual({ name: 'female111-template' })
  })

  it('renders the PPF111 template before entering the daily coaching workbench', () => {
    window.location.hash = '#/templates/female111'
    render(<App />)

    expect(screen.getByRole('heading', { level: 1, name: 'PPF111 · 女性 1+1+1 训练模板' })).toBeInTheDocument()
    expect(screen.getByText('PREP')).toBeInTheDocument()
    expect(screen.getByText('训练块 A')).toBeInTheDocument()
    expect(screen.getByText('训练块 B')).toBeInTheDocument()
    expect(screen.getAllByText('主训练').length).toBeGreaterThanOrEqual(2)
    expect(screen.getAllByText('支持').length).toBeGreaterThanOrEqual(2)
    expect(screen.getAllByText('核心控制').length).toBeGreaterThanOrEqual(2)
    expect(screen.getByRole('link', { name: '进入今日编课' })).toHaveAttribute('href', '#/female111')
  })

  it('parses the independent Female111 route without changing legacy route semantics', () => {
    expect(getRoute('#/female111')).toEqual({ name: 'female111' })
    expect(getRoute('#/female/fit-f01')).toEqual({ name: 'female-template-detail', id: 'fit-f01' })
    expect(getRoute('#/postpartum/pp01')).toEqual({ name: 'postpartum-detail', id: 'pp01' })
  })

  it('uses coach-facing Chinese labels instead of raw internal enums', async () => {
    window.location.hash = '#/female111'
    render(<App />)

    await screen.getByRole('button', { name: '生成今日训练' }).click()
    expect(screen.getAllByText('主训练').length).toBe(2)
    expect(screen.getAllByText(/需要复核/).length).toBeGreaterThan(0)
    expect(screen.queryByText('PRIMARY')).not.toBeInTheDocument()
    expect(screen.queryByText('CLEAR')).not.toBeInTheDocument()
    expect(screen.queryByText('Squat + Anterior Support + Anti-extension')).not.toBeInTheDocument()
    expect(screen.getByText(/深蹲 \+ 前侧支撑 \+ 抗伸展/)).toBeInTheDocument()
    expect(screen.getByText('斜板支撑')).toBeInTheDocument()
  })

  it('keeps the App integration narrow and does not import legacy PP Method data directly', () => {
    expect(appSource).toContain("./components/Female111CoachProduct")
    expect(appSource).not.toMatch(/from ['"]\.\/data\/pp\/methodNodes['"]\s*$/m)
    expect(appSource).not.toMatch(/\bppMethodNodeById\b/)
  })

  it('opens the real Chinese coach workflow instead of a technical acceptance page', () => {
    window.location.hash = '#/female111'
    render(<App />)

    expect(screen.getByRole('heading', { level: 1, name: 'Female111 · 今日训练工作台' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: '会员与训练目标' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '生成今日训练' })).toBeInTheDocument()
    expect(screen.queryByText('方法验收页')).not.toBeInTheDocument()
  })

  it('generates a plan, confirms it, records execution, and exposes next-step decisions', async () => {
    window.location.hash = '#/female111'
    render(<App />)

    await screen.getByRole('button', { name: '生成今日训练' }).click()
    expect(screen.getByRole('heading', { level: 2, name: '今日训练方案' })).toBeInTheDocument()
    expect(screen.getByText('深蹲 + 前侧支撑 + 抗伸展')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '确认方案并开始记录' })).toBeDisabled()

    await screen.getByRole('checkbox', { name: '我已检查动作质量、场地与人群适配' }).click()
    expect(screen.getByRole('button', { name: '确认方案并开始记录' })).toBeEnabled()
    await screen.getByRole('button', { name: '确认方案并开始记录' }).click()

    expect(screen.getByRole('heading', { level: 2, name: '记录本次训练' })).toBeInTheDocument()
    expect(screen.getAllByText(/下一步：.*进阶/).length).toBeGreaterThan(0)
    await screen.getByRole('button', { name: '保存训练记录' }).click()
    expect(screen.getByText('训练已记录')).toBeInTheDocument()
  })

  it('lets the coach switch to another rule-validated Block pairing before confirmation', async () => {
    window.location.hash = '#/female111'
    render(<App />)

    await screen.getByRole('button', { name: '生成今日训练' }).click()
    fireEvent.change(screen.getByRole('combobox', { name: '教练选择训练组合' }), { target: { value: 'HIP_EXTENSION_AND_LOCOMOTION' } })

    expect(screen.getByText('髋伸展 + 侧向支撑 + 抗伸展')).toBeInTheDocument()
    expect(screen.getByText('臀桥')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '确认方案并开始记录' })).toBeDisabled()
  })
})
