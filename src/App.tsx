import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { ArrowLeft, ArrowRight, Bookmark, Check, ChevronRight, Copy, ExternalLink, Heart, Moon, Search, ShieldAlert, Sun } from 'lucide-react'
import { getLibraryAction, getLibraryActionId, getPattern, getPostpartumMovement, getTemplate, librarySections, movementPatterns, templates, type ActionEntity, type Level, type Template } from './data/content'
import { resolveFemaleProgrammingTemplates } from './data/pp'
import { getPostpartumPresentationBridgeRecord, postpartumPresentationBridgeCatalog } from './data/postpartumPresentationBridge'
import { getRoute, navigate, type Route } from './lib/router'
import { addRecent, getFavorites, getRecent, toggleFavorite } from './lib/storage'
import { ThemeProvider, useTheme } from './lib/theme'
import { buildTemplateCopyText } from './lib/template-copy'

const systemLabel: Record<Template['system'], string> = { '3c': '3C 代谢力量', body: 'BODY 塑形', conditioning: 'CONDITIONING 体能' }
const levelLabel: Record<Level, string> = { l0: 'L0', l1: 'L1', l2: 'L2', l3: 'L3', l4: 'L4' }
const femaleRuntimeTemplates = resolveFemaleProgrammingTemplates()
const femaleTemplateSlots = ['HIP', 'SUPPORT', 'CORE'] as const
type FemaleRuntimeTemplate = (typeof femaleRuntimeTemplates)[number]
type FemaleRuntimeSlot = FemaleRuntimeTemplate['slots'][keyof FemaleRuntimeTemplate['slots']]

export const App = () => <ThemeProvider><AppContent /></ThemeProvider>

const AppContent = () => {
  const [route, setRoute] = useState<Route>(() => getRoute())
  useEffect(() => {
    const onHashChange = () => setRoute(getRoute())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])
  useEffect(() => { document.documentElement.scrollTop = 0; document.body.scrollTop = 0 }, [route])
  return <div className="app-shell">
    <Header route={route} />
    <main className="main-content">
      <RouteView route={route} />
    </main>
    <BottomNav route={route} />
  </div>
}

const Header = ({ route }: { route: Route }) => {
  const { theme, toggleTheme } = useTheme()
  return <header className="topbar">
    <a className="brand" href="#/home" aria-label="7Fit 教练工作台首页">
      <img src="./assets/7Fit_logo_crop.png" alt="7Fit" />
      <span><b>7FIT</b><small>TRAINING SYSTEM · V6</small></span>
    </a>
    <div className="topbar-actions">
      {route.name !== 'home' && <button className="icon-button" onClick={() => window.history.back()} aria-label="返回上一页"><ArrowLeft size={18} /></button>}
      <button className="icon-button" onClick={toggleTheme} aria-label={theme === 'dark' ? '切换浅色模式' : '切换夜间模式'} title="主题模式">
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>
    </div>
  </header>
}

const BottomNav = ({ route }: { route: Route }) => {
  const items = [
    ['home', '首页', '#/home'], ['templates', '模板', '#/templates'], ['patterns', '模式', '#/patterns'], ['library', '动作库', '#/library'],
  ] as const
  return <nav className="bottom-nav" aria-label="主导航">
    {items.map(([name, label, href]) => {
      const active = route.name.startsWith(name) || (name === 'templates' && route.name === 'female-template-detail')
      return <a className={active ? 'active' : ''} href={href} key={name}>{label}</a>
    })}
  </nav>
}

const RouteView = ({ route }: { route: Route }) => {
  switch (route.name) {
    case 'home': return <HomePage />
    case 'templates': return <TemplatesPage />
    case 'template-detail': return <TemplateDetailPage id={route.system} level={route.level} />
    case 'female-template-detail': return <FemaleTemplateDetailPage id={route.id} />
    case 'patterns': return <PatternsPage />
    case 'pattern-detail': return <PatternDetailPage id={route.id} />
    case 'library': return <LibraryPage />
    case 'library-detail': return <LibraryDetailPage id={route.id} />
    case 'action-detail': return <ActionDetailPage id={route.id} />
    case 'postpartum-detail': return <PostpartumDetailPage id={route.id} />
  }
}

const Eyebrow = ({ children }: { children: ReactNode }) => <span className="eyebrow">{children}</span>
const PageTitle = ({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) => <div className="page-title"><Eyebrow>{eyebrow}</Eyebrow><h1>{title}</h1>{description && <p>{description}</p>}</div>
const SearchBox = ({ value, onChange, placeholder = '搜索动作、模板或模式' }: { value: string; onChange: (value: string) => void; placeholder?: string }) => <label className="search-box"><Search size={18} /><input aria-label="搜索" role="searchbox" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} /><kbd>⌘ K</kbd></label>
const Pill = ({ children, active = false, onClick }: { children: ReactNode; active?: boolean; onClick?: () => void }) => onClick ? <button className={`pill ${active ? 'active' : ''}`} onClick={onClick}>{children}</button> : <span className="pill">{children}</span>

const HomePage = () => {
  const [query, setQuery] = useState('')
  const [recent, setRecent] = useState(getRecent())
  const [favorites, setFavorites] = useState(getFavorites())
  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return [
      ...postpartumPresentationBridgeCatalog.filter(({ presentation }) => `${presentation.id} ${presentation.name} ${presentation.category}`.toLowerCase().includes(q)).map(({ presentation }) => ({ id: presentation.id, title: `${presentation.id.toUpperCase()} · ${presentation.name}`, meta: `产后专项 · ${presentation.category}`, href: `#/postpartum/${presentation.id}` })),
      ...templates.filter((item) => `${item.code} ${item.name} ${item.description}`.toLowerCase().includes(q)).map((item) => ({ id: item.id, title: item.name, meta: `${item.code} · ${systemLabel[item.system]}`, href: `#/templates/${item.id}/l1` })),
      ...movementPatterns.filter((item) => `${item.id} ${item.name}`.toLowerCase().includes(q)).map((item) => ({ id: item.id, title: item.name, meta: 'Movement Pattern', href: `#/patterns/${item.id}` })),
    ].slice(0, 8)
  }, [query])
  const recentItems = recent.map((id) => getPostpartumMovement(id) ?? getTemplate(id)).filter((item): item is ActionEntity | Template => Boolean(item))
  const favItems = favorites.map((id) => getPostpartumMovement(id)).filter((item): item is ActionEntity => Boolean(item))
  return <div className="page home-page">
    <section className="hero-panel">
      <div><Eyebrow>COACH WORKSPACE · V6</Eyebrow><h1>教练工作台</h1><p>从目标到动作，一次找到今天要带的训练。</p></div>
      <div className="hero-orb" aria-hidden="true">7</div>
    </section>
    <section className="search-section" aria-label="动作与训练搜索"><SearchBox value={query} onChange={setQuery} />{query && <div className="search-results" role="listbox">{results.length ? results.map((result) => <a href={result.href} key={result.id} role="option" onClick={() => addRecent(result.id)}><span>{result.title}</span><small>{result.meta}</small><ChevronRight size={16} /></a>) : <p className="empty-state">没有找到匹配内容，试试“臀桥”“3C”或“核心”。</p>}</div>}</section>
    <section className="section-block"><SectionHeading title="快速进入" action={<a href="#/templates">查看全部 <ArrowRight size={15} /></a>} /><div className="quick-grid"><a className="quick-card purple" href="#/templates"><span>01</span><b>训练模板</b><small>3C · BODY · 体能</small></a><a className="quick-card peach" href="#/library/postpartum"><span>02</span><b>产后专项</b><small>PP01–PP26 · L0–L4</small></a><a className="quick-card mint" href="#/library/cardio"><span>03</span><b>课后有氧</b><small>恢复与心肺</small></a></div></section>
    <section className="section-block"><SectionHeading title="最近使用" action={recent.length ? <button className="text-button" onClick={() => { localStorage.removeItem('7fit-v6-recent'); setRecent([]) }}>清除</button> : undefined} />{recentItems.length ? <div className="compact-list">{recentItems.map((item) => <a href={item.id.startsWith('pp') ? `#/postpartum/${item.id}` : `#/templates/${item.id}/l1`} key={item.id}><span className="list-icon"><Bookmark size={16} /></span><span><b>{item.name}</b><small>{'category' in item ? item.category : systemLabel[item.system]}</small></span><ChevronRight size={16} /></a>)}</div> : <div className="empty-card"><span className="empty-icon"><Bookmark size={20} /></span><div><b>还没有最近使用</b><p>打开一个模板或动作，之后会自动出现在这里。</p></div></div>}</section>
    <section className="section-block"><SectionHeading title="常用动作" action={<a href="#/library">打开动作库 <ArrowRight size={15} /></a>} /><div className="action-grid">{postpartumPresentationBridgeCatalog.slice(0, 4).map(({ presentation }) => <ActionCard key={presentation.id} item={presentation} favorites={favorites} onFavorite={(id) => setFavorites(toggleFavorite(id))} />)}</div></section>
    {favItems.length > 0 && <section className="section-block"><SectionHeading title="我的收藏" /><div className="action-grid">{favItems.slice(0, 4).map((item) => <ActionCard key={item.id} item={item} favorites={favorites} onFavorite={(id) => setFavorites(toggleFavorite(id))} />)}</div></section>}
    <section className="rule-note"><div className="rule-mark">i</div><div><b>L1–L4 是方案等级，不是动作技术等级</b><p>高等级会员仍可选用技术 L1–L3 的稳定动作，始终以当前目标、控制质量和安全信号为先。</p></div></section>
  </div>
}

const SectionHeading = ({ title, action }: { title: string; action?: ReactNode }) => <div className="section-heading"><h2>{title}</h2>{action}</div>

const TemplatesPage = () => {
  const [query, setQuery] = useState('')
  const [system, setSystem] = useState<'all' | Template['system']>('all')
  const filtered = templates.filter((template) => (system === 'all' || template.system === system) && `${template.code} ${template.name} ${template.description}`.toLowerCase().includes(query.toLowerCase()))
  return <div className="page"><PageTitle eyebrow="TRAINING TEMPLATES" title="训练模板" description="先选训练体系，再选模板与 L1–L4 方案等级。三大体系同级，不互相附加。" /><SearchBox value={query} onChange={setQuery} placeholder="搜索模板名称或目标" /><div className="filter-row"><Pill active={system === 'all'} onClick={() => setSystem('all')}>全部 · 16</Pill><Pill active={system === '3c'} onClick={() => setSystem('3c')}>3C · 6</Pill><Pill active={system === 'body'} onClick={() => setSystem('body')}>BODY · 5</Pill><Pill active={system === 'conditioning'} onClick={() => setSystem('conditioning')}>体能 · 5</Pill></div><div className="template-grid">{filtered.map((template) => <TemplateCard key={template.id} template={template} />)}</div><section className="section-block"><SectionHeading title="女性 1+1+1" action={<span className="muted">8 个模板</span>} /><div className="template-grid">{femaleRuntimeTemplates.map((template) => <FemaleTemplateCard key={template.template.id} template={template} />)}</div></section></div>
}

const TemplateCard = ({ template }: { template: Template }) => <a className="template-card" href={`#/templates/${template.id}/l1`}><div className={`template-badge ${template.system}`}>{template.code}</div><h3>{template.name}</h3><p>{template.description}</p><div className="card-footer"><span>4 个方案等级</span><ChevronRight size={17} /></div></a>
const FemaleTemplateCard = ({ template }: { template: FemaleRuntimeTemplate }) => <a className="template-card" href={`#/female/${template.template.id}`}><div className="template-badge body">{template.template.code}</div><h3>{template.template.name}</h3><p>{template.template.intent}</p><div className="card-footer"><span>HIP · SUPPORT · CORE</span><ChevronRight size={17} /></div></a>

const TemplateDetailPage = ({ id, level }: { id: string; level: 'l1' | 'l2' | 'l3' | 'l4' }) => {
  const template = getTemplate(id)
  const [copied, setCopied] = useState(false)
  if (!template) return <EmptyRoute title="模板不存在" href="#/templates" />
  const current = template.levels[level]
  const copy = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) await navigator.clipboard.writeText(buildTemplateCopyText(template, current))
    } catch {
      // Clipboard permissions can be unavailable on file:// and embedded previews; keep the UI usable.
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1400)
  }
  const firstActionId = current.exercises[0] ? getLibraryActionId(current.exercises[0].name, current.exercises[0].pattern, 'main') : undefined
  return <div className="page detail-page">
    <div className="sticky-context"><a href="#/templates"><ArrowLeft size={16} /> 模板</a><span>{template.code} / {current.label}</span><a href={`#/templates/${template.id}/${level === 'l4' ? 'l1' : `l${Number(level.slice(1)) + 1}`}`} aria-label="下一个方案等级"><ArrowRight size={16} /></a></div>
    <div className="detail-title"><Eyebrow>{systemLabel[template.system]} · {template.code}</Eyebrow><h1>{template.name}</h1><p>{template.description}</p></div>
    <div className="level-tabs" role="tablist" aria-label="方案等级">{(['l1', 'l2', 'l3', 'l4'] as const).map((item) => <a role="tab" aria-selected={level === item} className={level === item ? 'active' : ''} href={`#/templates/${template.id}/${item}`} key={item}><b>{item.toUpperCase()}</b><small>{template.levels[item].focus}</small></a>)}</div>
    <div className="quick-actions"><button onClick={() => addRecent(template.id)}><Bookmark size={17} />最近使用</button><button onClick={copy}>{copied ? <Check size={17} /> : <Copy size={17} />}{copied ? '已复制' : '复制训练'}</button><button onClick={() => navigate(firstActionId ? `library/action/${firstActionId}` : 'library')}><ExternalLink size={17} />动作详情</button></div>
    <section className="coach-callout"><ShieldAlert size={19} /><div><b>训练原则</b><p>动作质量、连续呼吸和控制稳定优先；技术下降或出现不适时，回到更低方案等级。</p></div></section>
    <section className="workout-section"><SectionHeading title="热身与动作准备" action={<span className="muted">{current.warmup.length} 个动作</span>} /><div className="warmup-grid">{current.warmup.map((item, index) => { const actionId = getLibraryActionId(item.name, item.tag, 'warmup'); return <a className="warmup-action" href={actionId ? `#/library/action/${actionId}` : '#/library'} aria-label={`查看动作详情：${item.name}`} key={`${item.name}-${index}`}><span>0{index + 1}</span><div><b>{item.name}</b><small>{item.tag} · {item.prescription}</small></div><ChevronRight size={15} aria-hidden="true" /></a> })}</div></section>
    <section className="workout-section"><SectionHeading title={current.sectionTitle || '主训练'} action={<span className="muted">{current.sectionCount || `${current.exercises.length} 个动作`}</span>} /><div className="exercise-stack">{current.exercises.map((exercise, index) => { const actionId = getLibraryActionId(exercise.name, exercise.pattern, 'main'); return <a className="exercise-card" href={actionId ? `#/library/action/${actionId}` : '#/library'} aria-label={`查看动作详情：${exercise.name}`} key={`${exercise.name}-${index}`}><span className="exercise-number">{String(index + 1).padStart(2, '0')}</span><div><h3>{exercise.name}</h3><p>{exercise.displayCategory ?? exercise.pattern}</p></div><strong>{exercise.prescription || '按模板完成'}</strong><ChevronRight size={16} aria-hidden="true" /></a> })}</div></section>
    <section className="metrics-row">{current.metrics.slice(0, 3).map((metric) => <div key={metric.label}><small>{metric.label}</small><b>{metric.value}</b></div>)}</section>{current.coachNote && <details className="template-coach-note"><summary>教练提示</summary><p>{current.coachNote}</p></details>}
  </div>
}

const FemaleTemplateDetailPage = ({ id }: { id: string }) => {
  const template = femaleRuntimeTemplates.find((item) => item.template.id === id)
  if (!template) return <EmptyRoute title="模板不存在" href="#/templates" />

  return <div className="page detail-page">
    <div className="sticky-context"><a href="#/templates"><ArrowLeft size={16} /> 模板</a><span>{template.template.code}</span><span /></div>
    <div className="detail-title">
      <Eyebrow>FEMALE 1+1+1 · {template.template.code}</Eyebrow>
      <h1>{template.template.name}</h1>
      <p>{template.template.intent}</p>
      <div className="tag-row">
        <Pill>HIP</Pill>
        <Pill>SUPPORT</Pill>
        <Pill>CORE</Pill>
      </div>
    </div>
    {template.template.coachNote && <details className="template-coach-note"><summary>教练提示</summary><p>{template.template.coachNote}</p></details>}
    <section className="workout-section">
      <SectionHeading title="1+1+1 Slots" action={<span className="muted">3 个槽位</span>} />
      <div className="detail-columns">
        {femaleTemplateSlots.map((slotName) => <FemaleSlotCard key={slotName} slot={template.slots[slotName]} />)}
      </div>
    </section>
  </div>
}

const FemaleSlotCard = ({ slot }: { slot: FemaleRuntimeSlot }) => <section className="info-card">
  <h2>{slot.slot}</h2>
  <div className="tag-row">
    <Pill>{slot.challengeRole}</Pill>
    <Pill>{slot.policy.eligibility}</Pill>
    <Pill>{slot.policy.demand}</Pill>
    <Pill>{slot.methodNode.id}</Pill>
  </div>
  <p>{slot.canonical.exercise.id}</p>
  <p>{slot.canonical.exercise.name}</p>
  <p>{slot.canonical.mapping.status}</p>
  {'variantId' in slot.canonical.mapping && <p>{slot.canonical.mapping.variantId}</p>}
  <p>{slot.requiresConditionalReadiness ? '需要条件就绪' : '无需额外条件就绪'}</p>
  <p>{slot.methodNode.breathing.mode}</p>
  <p>{slot.methodNode.breathing.pressureIntent}</p>
  {slot.methodNode.breathing.inhale && <p>{slot.methodNode.breathing.inhale}</p>}
  {slot.methodNode.breathing.exhale && <p>{slot.methodNode.breathing.exhale}</p>}
  <div>
    {slot.methodNode.qualityGate.criteria.map((criterion) => <p key={`${slot.slot}-${criterion.code}`}>{criterion.requirement}</p>)}
  </div>
  <div>
    {slot.methodNode.commonCompensations.map((item) => <p key={`${slot.slot}-${item}`}>{item}</p>)}
  </div>
</section>

const PatternsPage = () => <div className="page"><PageTitle eyebrow="MOVEMENT PATTERNS" title="动作模式" description="12 大 Movement Pattern 连接普通训练与产后专项动作。" /><div className="pattern-grid">{movementPatterns.map((pattern, index) => <a className="pattern-card" href={`#/patterns/${pattern.id}`} key={pattern.id}><span className="pattern-index">{String(index + 1).padStart(2, '0')}</span><h3>{pattern.name}</h3><p>{pattern.englishName}</p><span className="cross-count">{pattern.postpartumIds.length} 个 PP 交叉 <ChevronRight size={15} /></span></a>)}</div></div>

const PatternDetailPage = ({ id }: { id: string }) => {
  const pattern = getPattern(id)
  if (!pattern) return <EmptyRoute title="动作模式不存在" href="#/patterns" />
  const linked = pattern.postpartumIds.map(getPostpartumMovement).filter(Boolean) as ActionEntity[]
  return <div className="page detail-page"><div className="sticky-context"><a href="#/patterns"><ArrowLeft size={16} /> 动作模式</a><span>{pattern.name}</span><span /></div><div className="detail-title"><Eyebrow>MOVEMENT PATTERN · {pattern.englishName}</Eyebrow><h1>{pattern.name}</h1><p>从动作技术到训练场景的桥梁；先看控制质量，再决定是否进入更高复杂度。</p></div><section className="pattern-hero"><div className="pattern-hero-number">{pattern.postpartumIds.length}</div><div><b>产后专项交叉</b><p>这些动作保留产后语境，可作为准备、退阶或正式训练使用。</p></div></section><section className="workout-section"><SectionHeading title="关联 PP 动作" action={<span className="muted">双向映射</span>} /><div className="action-grid">{linked.map((item) => <ActionCard item={item} key={item.id} />)}</div></section>{!linked.length && <div className="empty-card"><div><b>当前没有产后交叉动作</b><p>普通训练动作仍可从动作库继续查看。</p></div></div>}</div>
}

const LibraryPage = () => <div className="page"><PageTitle eyebrow="EXERCISE LIBRARY" title="动作库" description="按训练用途进入动作集合；产后专项保持独立，不并入普通模板。" /><div className="library-grid">{librarySections.map((section) => <a className={section.id === 'postpartum' ? 'library-card special' : 'library-card'} href={`#/library/${section.id}`} key={section.id}><Eyebrow>{section.id === 'postpartum' ? 'SPECIAL' : 'LIBRARY'}</Eyebrow><h3>{section.name}</h3><p>{section.description}</p><ChevronRight size={18} /></a>)}</div></div>

const LibraryDetailPage = ({ id }: { id: string }) => {
  const section = librarySections.find((item) => item.id === id)
  if (!section) return <EmptyRoute title="动作库分类不存在" href="#/library" />
  if (id === 'postpartum') return <PostpartumLibrary />
  const examples = id === 'cardio' ? ['划船机', '滑雪机', '坡度走'] : id === 'core' ? ['死虫式', '鸟狗式', '平板支撑', '侧平板支撑', '帕洛夫抗旋转推'] : ['哑铃深蹲', '臀桥', '单臂划船', '农夫行走', '半跪姿推举']
  return <div className="page"><PageTitle eyebrow="EXERCISE LIBRARY" title={section.name} description={section.description} /><div className="library-detail-list">{examples.map((name, index) => <div className="library-item" key={name}><span>{String(index + 1).padStart(2, '0')}</span><div><b>{name}</b><small>{section.name} · 可从训练模板调用</small></div><ChevronRight size={17} /></div>)}</div><div className="coach-callout"><ShieldAlert size={19} /><div><b>动作调用提示</b><p>动作技术等级与方案等级分开判断。先确认控制质量，再决定负荷、节奏和复杂度。</p></div></div></div>
}

const ActionDetailPage = ({ id }: { id: string }) => {
  const action = getLibraryAction(id)
  if (!action) return <EmptyRoute title="动作不存在" href="#/library" />
  return <div className="page detail-page action-detail-page">
    <div className="sticky-context"><a href="#/library"><ArrowLeft size={16} /> 动作库</a><span>动作详情</span><span /></div>
    <div className="detail-title"><Eyebrow>EXERCISE LIBRARY · {action.category}</Eyebrow><h1>{action.name}</h1><p>来自训练模板的动作实体，可从下方场景返回对应的完整训练方案。</p><div className="tag-row"><Pill>{action.context}</Pill><Pill>{action.sources.some((source) => source.role === 'warmup') ? '热身 / 准备' : '主训练'}</Pill></div></div>
    <section className="coach-callout"><ShieldAlert size={19} /><div><b>动作调用提示</b><p>先确认动作质量、连续呼吸与控制稳定，再决定负荷、节奏和复杂度。</p></div></section>
    <section className="workout-section"><SectionHeading title="训练目标" /><div className="detail-columns"><div className="info-card"><h2>目标</h2>{action.goals.map((goal) => <p key={goal}>· {goal}</p>)}</div><div className="info-card"><h2>教练提示</h2>{action.coachCues.map((cue) => <p key={cue}>· {cue}</p>)}</div></div></section>
    <section className="workout-section"><SectionHeading title="在模板中的使用" action={<span className="muted">{action.sources.length} 个场景</span>} /><div className="library-detail-list source-list">{action.sources.map((source) => <a className="library-item" href={`#/templates/${source.templateId}/${source.level}`} key={`${source.templateId}-${source.level}-${source.role}`}><span>{source.level.toUpperCase()}</span><div><b>{source.templateName}</b><small>{source.role === 'warmup' ? '热身与动作准备' : '主训练'} · {source.prescription}</small></div><ChevronRight size={17} /></a>)}</div></section>
    <section className="detail-columns"><div className="info-card"><h2>退阶建议</h2>{action.regressions.map((item) => <p key={item}>· {item}</p>)}</div><div className="info-card"><h2>进阶建议</h2>{action.progressions.map((item) => <p key={item}>· {item}</p>)}</div></section>
  </div>
}

const PostpartumLibrary = () => {
  const [query, setQuery] = useState('')
  const [level, setLevel] = useState<'all' | Level>('all')
  const [category, setCategory] = useState('all')
  const filtered = postpartumPresentationBridgeCatalog.filter(({ presentation }) => (level === 'all' || presentation.level.includes(level)) && (category === 'all' || presentation.category === category) && `${presentation.id} ${presentation.name}`.toLowerCase().includes(query.toLowerCase()))
  return <div className="page"><PageTitle eyebrow="POSTPARTUM RECOVERY" title="产后恢复 · PP01–PP26" description="双向连接 Movement Pattern 的专项动作库；教练卡内容已转为网页文字，视频可直接在页面内查看。" /><section className="safety-banner"><ShieldAlert size={23} /><div><b>首屏安全提示</b><p>疼痛、漏尿、坠胀、明显 Doming、屏气或症状加重时，立即退阶或停止，并视情况建议专业评估。</p></div></section><SearchBox value={query} onChange={setQuery} placeholder="搜索 PP 编号或动作名称" /><div className="filter-row scroll-row">{(['all', 'l0', 'l1', 'l2', 'l3', 'l4'] as const).map((item) => <Pill key={item} active={level === item} onClick={() => setLevel(item)}>{item === 'all' ? '全部等级' : item.toUpperCase()}</Pill>)}</div><div className="filter-row scroll-row">{['all', '髋模式', '支撑模式', '呼吸 / 核心控制'].map((item) => <Pill key={item} active={category === item} onClick={() => setCategory(item)}>{item === 'all' ? '全部区域' : item}</Pill>)}</div><p className="result-count">显示 {filtered.length} / 26 个专项动作</p><div className="pp-grid">{filtered.map(({ presentation }) => <PostpartumCard item={presentation} key={presentation.id} />)}</div><section className="stop-signals"><b>固定退阶 / 停止信号</b><span>疼痛 · 漏尿 · 阴道坠胀 / 膨出感 · Doming · 屏气</span></section></div>
}

const youtubeEmbed = (url: string) => {
  try {
    const parsed = new URL(url)
    if (!parsed.hostname.includes('youtube.com') && !parsed.hostname.includes('youtu.be')) return null
    const id = parsed.hostname.includes('youtu.be') ? parsed.pathname.slice(1) : parsed.searchParams.get('v')
    return id ? `https://www.youtube-nocookie.com/embed/${id}?rel=0` : null
  } catch { return null }
}

const InlineVideo = ({ url, title, label }: { url: string; title: string; label: string }) => {
  const embed = youtubeEmbed(url)
  return <div className="video-panel"><div className="video-panel-head"><b>{label}</b><a href={url} target="_blank" rel="noreferrer"><ExternalLink size={14} /> 新窗口打开</a></div>{embed ? <iframe title={title} src={embed} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /> : <div className="video-fallback"><ExternalLink size={18} /><p>该视频站点不支持内嵌播放</p><a href={url} target="_blank" rel="noreferrer">点击打开视频</a></div>}</div>
}

const MethodField = ({ label, value }: { label: string; value: string }) => <div><small>{label}</small><p>{value}</p></div>

const PostpartumMethodSurface = ({ methodNode }: { methodNode: NonNullable<ReturnType<typeof getPostpartumPresentationBridgeRecord>>['methodNode'] }) => {
  const { mapping } = methodNode
  const secondaryPathways = methodNode.secondaryPathways?.join(' · ')
  return <section className="info-card postpartum-method-panel">
    <div className="card-content-heading"><ShieldAlert size={18} /><div><h2>方法层（只读）</h2><p>来自 PP Method 与 presentation bridge；不改变原教练卡内容。</p></div></div>
    <div className="card-content-grid">
      <MethodField label="Method ID" value={methodNode.id} />
      <MethodField label="Method P-level" value={methodNode.progressionLevel} />
      <MethodField label="Kind" value={methodNode.kind} />
      <MethodField label="Role" value={methodNode.role} />
      <MethodField label="Primary pathway" value={methodNode.primaryPathway} />
      {secondaryPathways && <MethodField label="Secondary pathways" value={secondaryPathways} />}
      <MethodField label="Mapping" value={mapping.status} />
      {'exerciseId' in mapping && <MethodField label="Canonical exercise" value={mapping.exerciseId} />}
      {'variantId' in mapping && <MethodField label="Variant" value={mapping.variantId} />}
      {'proposedExerciseId' in mapping && <MethodField label="Proposed exercise" value={mapping.proposedExerciseId} />}
      {'reason' in mapping && <MethodField label="Mapping reason" value={mapping.reason} />}
      {methodNode.hostExerciseId && <MethodField label="Host exercise" value={methodNode.hostExerciseId} />}
      <MethodField label="Breathing" value={methodNode.breathing.mode} />
      <MethodField label="Pressure intent" value={methodNode.breathing.pressureIntent} />
      {methodNode.breathing.inhale && <MethodField label="Inhale" value={methodNode.breathing.inhale} />}
      {methodNode.breathing.exhale && <MethodField label="Exhale" value={methodNode.breathing.exhale} />}
    </div>
    <div className="coach-points"><b>Quality gate · {methodNode.qualityGate.passRule}</b>{methodNode.qualityGate.criteria.map((criterion) => <span key={criterion.code}>· {criterion.requirement}</span>)}</div>
    <div className="coach-points"><b>Common compensations</b>{methodNode.commonCompensations.map((compensation) => <span key={compensation}>· {compensation}</span>)}</div>
    {methodNode.coachNotes && <div className="coach-points"><b>Method coach notes</b>{methodNode.coachNotes.map((note) => <span key={note}>· {note}</span>)}</div>}
  </section>
}

const PostpartumDetailPage = ({ id }: { id: string }) => {
  const bridgeRecord = getPostpartumPresentationBridgeRecord(id)
  const item = bridgeRecord?.presentation
  const [favorites, setFavorites] = useState(getFavorites())
  useEffect(() => { if (item) addRecent(item.id) }, [item])
  if (!item || !bridgeRecord) return <EmptyRoute title="专项动作不存在" href="#/library/postpartum" />
  return <div className="page detail-page pp-detail-page"><div className="sticky-context"><a href="#/library/postpartum"><ArrowLeft size={16} /> PP 动作库</a><span>{item.id.toUpperCase()} · {item.category}</span><button className="context-favorite" onClick={() => setFavorites(toggleFavorite(item.id))} aria-label={favorites.includes(item.id) ? '取消收藏' : '收藏动作'}><Heart size={17} fill={favorites.includes(item.id) ? 'currentColor' : 'none'} /></button></div><div className="detail-title"><Eyebrow>POSTPARTUM MOVEMENT · {item.id.toUpperCase()}</Eyebrow><h1>{item.name}</h1><p>原教练卡内容已转为文字版，保持呼吸、控制和症状反馈优先。</p><div className="tag-row"><Pill>{item.level.map((levelItem) => levelLabel[levelItem]).join(' → ')}</Pill><Pill>{item.category}</Pill>{item.movementPatterns.map((pattern) => <a className="pill link-pill" href={`#/patterns/${pattern}`} key={pattern}>#{getPattern(pattern)?.name}</a>)}</div></div><section className="safety-banner prominent"><ShieldAlert size={23} /><div><b>先看安全信号</b><p>{item.riskNotes[0]}</p></div></section><section className="card-content-panel"><div className="card-content-heading"><Bookmark size={18} /><div><h2>教练卡内容（文字版）</h2><p>已提取为可搜索、可复制的网页内容，不依赖图片查看。</p></div></div><div className="card-content-grid"><div><small>动作概述</small><p>{item.cardContent.overview}</p></div><div><small>训练目标</small><p>{item.cardContent.trainingTarget}</p></div><div><small>建位与呼吸</small><p>{item.cardContent.setup}</p></div><div><small>退阶 / 进阶</small><p>{item.cardContent.progression}</p></div></div><div className="coach-points"><b>教练提示</b>{item.cardContent.coachingPoints.map((point) => <span key={point}>· {point}</span>)}</div></section><PostpartumMethodSurface methodNode={bridgeRecord.methodNode} /><section className="video-section"><SectionHeading title="视频指导" action={<span className="muted">可直接播放</span>} /><div className="video-grid"><InlineVideo url={item.primaryVideo} title={`${item.id.toUpperCase()} 主视频`} label="主视频" /><InlineVideo url={item.secondaryVideo} title={`${item.id.toUpperCase()} 备用视频`} label="备用视频" /></div></section><div className="detail-columns"><section className="info-card"><h2>动作执行</h2>{item.goals.map((goal) => <p key={goal}>· {goal}</p>)}{item.coachCues.map((cue) => <p key={cue}>· {cue}</p>)}</section><section className="info-card"><h2>安全与错误</h2>{item.commonErrors.map((error) => <p key={error}>· {error}</p>)}<p><b>停止信号：</b>{item.cardContent.stopSignals.join(' · ')}</p></section></div></div>
}

const PostpartumCard = ({ item }: { item: ActionEntity }) => <a className="pp-card" href={`#/postpartum/${item.id}`}><div className="pp-card-text"><div className="card-meta"><span>{item.id.toUpperCase()}</span><span>{item.level.map((level) => levelLabel[level]).join(' → ')}</span></div><h3>{item.name}</h3><p>{item.category}</p><span className="text-card-badge">文字教练卡 · 视频</span></div></a>
const ActionCard = ({ item, favorites = [], onFavorite }: { item: ActionEntity; favorites?: string[]; onFavorite?: (id: string) => void }) => <a className="action-card" href={`#/postpartum/${item.id}`} onClick={() => addRecent(item.id)}><div className="action-card-top"><span>{item.id.toUpperCase()}</span>{onFavorite && <button onClick={(event) => { event.preventDefault(); event.stopPropagation(); onFavorite(item.id) }} aria-label={favorites.includes(item.id) ? '取消收藏' : '收藏动作'}><Heart size={16} fill={favorites.includes(item.id) ? 'currentColor' : 'none'} /></button>}</div><h3>{item.name}</h3><p>{item.category}</p><span className="action-level">{item.level.map((level) => levelLabel[level]).join(' → ')}</span></a>

const EmptyRoute = ({ title, href }: { title: string; href: string }) => <div className="page empty-route"><h1>{title}</h1><a className="primary-button" href={href}>返回</a></div>
