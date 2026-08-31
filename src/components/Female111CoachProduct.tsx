import { useState, type ReactNode } from 'react'
import { Check, CheckCircle2, ChevronRight, ClipboardCheck, Clock3, History, Play, RotateCcw, Save, ShieldAlert } from 'lucide-react'
import {
  buildFemale111CoachProduct,
  copyFemale111SessionResult,
  decideFemale111NextStep,
  getFemale111CoachChallengeRoleLabel,
  getFemale111CoachDemandLabel,
  getFemale111CoachExerciseName,
  getFemale111CoachFamilyLabel,
  getFemale111CoachRationale,
  getFemale111CoachRecipeDisplay,
  getFemale111CoachSlotLabel,
  getFemale111CoachStatusLabel,
  female111CoachPlanOptions,
  listFemale111SessionResults,
  saveFemale111SessionResult,
} from '../data/female111'
import type {
  Female111CoachProductInput,
  Female111CoachProductResult,
  Female111BlockExecutionResult,
  Female111ExecutionQuality,
  Female111ProgressionDecision,
  Female111SessionResult,
  Female111Slot,
} from '../data/female111'

type ProductStep = 'setup' | 'plan' | 'record' | 'history'
type ProductForm = Omit<Female111CoachProductInput, 'id'>
type DraftSlot = {
  loadKg: string
  sets: string
  reps: string
  rir: string
  durationSeconds: string
  version: string
  quality: Female111ExecutionQuality
  symptoms: string
  decisionOverride: 'AUTO' | Female111ProgressionDecision
  overrideReason: string
}
type DraftBlock = Record<'PRIMARY' | 'SUPPORT' | 'CORE', DraftSlot>
type SessionRecordDraft = Record<'A' | 'B', DraftBlock>

const productSteps: readonly { id: ProductStep; label: string }[] = [
  { id: 'setup', label: '设置条件' },
  { id: 'plan', label: '确认方案' },
  { id: 'record', label: '记录执行' },
  { id: 'history', label: '训练历史' },
]

const targetOptions = [
  ['力量基础', '建立下肢力量与躯干控制'],
  ['体态与核心', '优先呼吸、位置与控制质量'],
  ['移动与稳定', '练习重心转移和单侧控制'],
] as const

const equipmentOptions = [
  ['barbell', '杠铃'],
  ['box', '训练箱'],
  ['mini-band', '迷你弹力带'],
] as const

const qualityLabels: Readonly<Record<Female111ExecutionQuality, string>> = {
  GOOD: '动作质量稳定',
  DEGRADED: '质量下降，需要退阶',
  FAILED: '无法保持，需要停止',
}

const decisionLabels: Readonly<Record<Female111ProgressionDecision, string>> = {
  KEEP: '保持当前版本',
  PROGRESS: '进入下一进阶',
  REGRESS: '回退一个版本',
  SWAP: '更换动作路径',
}

const populationLabels = {
  GENERAL: '一般女性',
  PREGNANCY: '孕期',
  POSTPARTUM: '产后',
} as const

const readinessLabels = {
  GREEN: '绿灯 · 可按方案执行',
  YELLOW: '黄灯 · 建议降低负荷或总量',
  RED: '红灯 · 停止并进一步评估',
} as const

const defaultForm: ProductForm = {
  planId: 'SQUAT_AND_LOCOMOTION',
  target: targetOptions[0][0],
  stage: 'L1',
  population: 'GENERAL',
  readiness: 'GREEN',
  safetySignal: false,
  coachConfirmed: false,
  venueConfirmed: false,
  availableEquipment: equipmentOptions.map(([id]) => id),
}

const emptyDraftSlot = (slot: Female111Slot): DraftSlot => ({
  loadKg: slot === 'PRIMARY' ? '40' : '',
  sets: slot === 'PRIMARY' ? '3' : '',
  reps: slot === 'PRIMARY' ? '8' : '10',
  rir: slot === 'PRIMARY' ? '2' : '',
  durationSeconds: slot === 'PRIMARY' ? '' : '30',
  version: slot === 'PRIMARY' ? '' : '当前版本',
  quality: 'GOOD',
  symptoms: '',
  decisionOverride: 'AUTO',
  overrideReason: '',
})

const createRecordDraft = (): SessionRecordDraft => ({
  A: {
    PRIMARY: emptyDraftSlot('PRIMARY'),
    SUPPORT: emptyDraftSlot('SUPPORT'),
    CORE: emptyDraftSlot('CORE'),
  },
  B: {
    PRIMARY: emptyDraftSlot('PRIMARY'),
    SUPPORT: emptyDraftSlot('SUPPORT'),
    CORE: emptyDraftSlot('CORE'),
  },
})

const splitSymptoms = (value: string): readonly string[] => value.split(/[，,]/).map((item) => item.trim()).filter(Boolean)

const displayReadiness = (status: keyof typeof readinessLabels): string => readinessLabels[status]

const translateProductReason = (reason: string): string => {
  if (reason.includes('Venue profile must be explicitly confirmed')) return '请确认今天的训练区域、地面和器械可用。'
  if (reason.includes('Coach confirmation is required')) return '请完成教练确认后再开始。'
  if (reason.includes('conditional readiness')) return '有动作需要完成准备度确认。'
  if (reason.includes('requires unavailable equipment')) return '场地缺少方案需要的器械。'
  return reason
}

const ProductEyebrow = ({ children }: { children: ReactNode }) => <span className="eyebrow">{children}</span>

export const Female111CoachProduct = () => {
  const [step, setStep] = useState<ProductStep>('setup')
  const [form, setForm] = useState<ProductForm>(defaultForm)
  const [product, setProduct] = useState<Female111CoachProductResult | null>(null)
  const [recordDraft, setRecordDraft] = useState<SessionRecordDraft>(createRecordDraft)
  const [savedResult, setSavedResult] = useState<Female111SessionResult | null>(null)
  const [history, setHistory] = useState<readonly Female111SessionResult[]>(() => listFemale111SessionResults())
  const [copyMessage, setCopyMessage] = useState('')
  const [memberName, setMemberName] = useState('')

  const currentSessionId = product?.session?.id
  const model = product?.model

  const rebuild = (nextForm: ProductForm, id = currentSessionId ?? `female111-session-${Date.now()}`) => {
    const next = buildFemale111CoachProduct({ ...nextForm, memberName: memberName.trim() || undefined, id })
    setForm(nextForm)
    setProduct(next)
  }

  const updateForm = <K extends keyof ProductForm>(key: K, value: ProductForm[K]) => {
    const nextForm = { ...form, [key]: value }
    if (product) rebuild(nextForm)
    else setForm(nextForm)
  }

  const confirmPlan = (confirmed: boolean) => {
    rebuild({ ...form, coachConfirmed: confirmed, venueConfirmed: confirmed })
  }

  const generatePlan = () => {
    setSavedResult(null)
    setCopyMessage('')
    setProduct(buildFemale111CoachProduct({ ...form, memberName: memberName.trim() || undefined, id: `female111-session-${Date.now()}` }))
    setStep('plan')
  }

  const toggleEquipment = (equipment: string) => {
    const next = form.availableEquipment.includes(equipment)
      ? form.availableEquipment.filter((item) => item !== equipment)
      : [...form.availableEquipment, equipment]
    updateForm('availableEquipment', next)
  }

  const updateDraft = (block: 'A' | 'B', slot: Female111Slot, patch: Partial<DraftSlot>) => {
    setRecordDraft((current) => ({
      ...current,
      [block]: {
        ...current[block],
        [slot]: { ...current[block][slot], ...patch },
      },
    }))
  }

  const buildExecutionResult = (): Female111SessionResult | undefined => {
    if (!product?.session || !model) return undefined
    const blockResults = {} as Record<'A' | 'B', Female111BlockExecutionResult>
    const overrides: NonNullable<Female111SessionResult['coachDecisionOverrides']>[number][] = []

    for (const block of ['A', 'B'] as const) {
      const blockModel = model.blocks[block]
      const draftBlock = recordDraft[block]
      const buildDecision = (slot: Female111Slot): Female111ProgressionDecision => {
        const draft = draftBlock[slot]
        const automatic = decideFemale111NextStep({
          quality: draft.quality,
          rir: slot === 'PRIMARY' ? Number(draft.rir) || 0 : undefined,
          symptoms: splitSymptoms(draft.symptoms),
        })
        if (draft.decisionOverride !== 'AUTO') {
          overrides.push({
            block,
            slot,
            from: automatic,
            to: draft.decisionOverride,
            reason: draft.overrideReason.trim(),
          })
          return draft.decisionOverride
        }
        return automatic
      }
      const primary = blockModel.slots.PRIMARY
      const support = blockModel.slots.SUPPORT
      const core = blockModel.slots.CORE
      const primaryDraft = draftBlock.PRIMARY
      const supportDraft = draftBlock.SUPPORT
      const coreDraft = draftBlock.CORE
      blockResults[block] = {
        primary: {
          methodNodeId: primary.methodNodeId,
          exerciseId: primary.progression?.exerciseId ?? primary.methodNodeId,
          loadKg: Number(primaryDraft.loadKg) || undefined,
          sets: Number(primaryDraft.sets) || undefined,
          reps: Number(primaryDraft.reps) || undefined,
          rir: Number(primaryDraft.rir) || undefined,
          quality: primaryDraft.quality,
          symptoms: splitSymptoms(primaryDraft.symptoms),
          nextStep: buildDecision('PRIMARY'),
        },
        support: {
          methodNodeId: support.methodNodeId,
          version: supportDraft.version.trim() || '当前版本',
          reps: Number(supportDraft.reps) || undefined,
          durationSeconds: Number(supportDraft.durationSeconds) || undefined,
          quality: supportDraft.quality,
          symptoms: splitSymptoms(supportDraft.symptoms),
          decision: buildDecision('SUPPORT'),
        },
        core: {
          methodNodeId: core.methodNodeId,
          version: coreDraft.version.trim() || '当前版本',
          reps: Number(coreDraft.reps) || undefined,
          durationSeconds: Number(coreDraft.durationSeconds) || undefined,
          quality: coreDraft.quality,
          symptoms: splitSymptoms(coreDraft.symptoms),
          decision: buildDecision('CORE'),
        },
      }
    }

    const blocks = blockResults as NonNullable<Female111SessionResult['blockResults']>
    return {
      id: `female111-result-${Date.now()}`,
      sessionId: product.session.id,
      recordedAt: new Date().toISOString(),
      memberName: memberName.trim() || undefined,
      readiness: form.readiness,
      primary: blocks.A.primary,
      support: blocks.A.support,
      core: blocks.A.core,
      blockResults: blocks,
      coachDecisionOverrides: overrides.length ? overrides : undefined,
    }
  }

  const hasInvalidOverride = (['A', 'B'] as const).some((block) => (['PRIMARY', 'SUPPORT', 'CORE'] as const).some((slot) => {
    const draft = recordDraft[block][slot]
    return draft.decisionOverride !== 'AUTO' && !draft.overrideReason.trim()
  }))

  const saveRecord = () => {
    if (hasInvalidOverride) return
    const result = buildExecutionResult()
    if (!result) return
    saveFemale111SessionResult(result)
    setSavedResult(result)
    setHistory(listFemale111SessionResults())
  }

  const openHistory = () => {
    setHistory(listFemale111SessionResults())
    setStep('history')
  }

  const copyRecord = (id: string) => {
    const copied = copyFemale111SessionResult(id)
    if (copied) {
      setHistory(listFemale111SessionResults())
      setCopyMessage('已复制为新的训练记录，可在下一次训练前继续调整。')
    }
  }

  return <div className="page detail-page female111-page female111-product-page">
    <div className="female111-product-header">
      <div className="page-title">
        <ProductEyebrow>FEMALE111 · 教练工作台</ProductEyebrow>
        <h1>Female111 · 今日训练工作台</h1>
        <p>从会员状态、目标和场地条件出发，生成一节可解释、可确认、可记录的 1+1+1 女性综合训练。</p>
      </div>
      <button className="female111-history-button" onClick={openHistory}><History size={17} />训练记录</button>
    </div>

    <nav className="female111-stepper" aria-label="Female111训练流程">
      {productSteps.map((item, index) => <button className={step === item.id ? 'active' : ''} key={item.id} onClick={() => (item.id === 'history' ? openHistory() : setStep(item.id))}>
        <span>{index + 1}</span>{item.label}
      </button>)}
    </nav>

    {step === 'setup' && <SetupStep form={form} memberName={memberName} onMemberNameChange={setMemberName} updateForm={updateForm} toggleEquipment={toggleEquipment} onGenerate={generatePlan} />}
    {step === 'plan' && <PlanStep form={form} product={product} model={model} updateForm={updateForm} onConfirm={confirmPlan} onBack={() => setStep('setup')} onStart={() => model?.allowed && setStep('record')} />}
    {step === 'record' && <RecordStep form={form} model={model} draft={recordDraft} savedResult={savedResult} hasInvalidOverride={hasInvalidOverride} updateDraft={updateDraft} onSave={saveRecord} onHistory={openHistory} />}
    {step === 'history' && <HistoryStep history={history} copyMessage={copyMessage} onCopy={copyRecord} onNew={() => { setSavedResult(null); setStep('setup') }} />}
  </div>
}

const SetupStep = ({
  form,
  memberName,
  onMemberNameChange,
  updateForm,
  toggleEquipment,
  onGenerate,
}: {
  form: ProductForm
  memberName: string
  onMemberNameChange: (value: string) => void
  updateForm: <K extends keyof ProductForm>(key: K, value: ProductForm[K]) => void
  toggleEquipment: (equipment: string) => void
  onGenerate: () => void
}) => <>
  <section className="female111-form-card">
    <div className="female111-section-title"><div><ProductEyebrow>01 · 会员背景</ProductEyebrow><h2>会员与训练目标</h2></div><span>先定义今天要解决的问题</span></div>
    <div className="female111-form-grid">
      <label>会员称呼<input aria-label="会员称呼" value={memberName} onChange={(event) => onMemberNameChange(event.target.value)} placeholder="例如：小林" /></label>
      <label>今日目标<select value={form.target} onChange={(event) => updateForm('target', event.target.value)}>{targetOptions.map(([value, label]) => <option key={value} value={value}>{value} · {label}</option>)}</select></label>
      <label>方案等级<select value={form.stage} onChange={(event) => updateForm('stage', event.target.value as ProductForm['stage'])}><option value="L1">L1 · 建立基础</option><option value="L2">L2 · 稳定发展</option><option value="L3">L3 · 增加整合</option><option value="L4">L4 · 高阶挑战</option></select></label>
      <label>人群场景<select value={form.population} onChange={(event) => updateForm('population', event.target.value as ProductForm['population'])}>{Object.entries(populationLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
    </div>
  </section>

  <section className="female111-form-card">
    <div className="female111-section-title"><div><ProductEyebrow>02 · 今日状态</ProductEyebrow><h2>今日状态</h2></div><span>状态优先于计划等级</span></div>
    <div className="female111-choice-grid">
      {(['GREEN', 'YELLOW', 'RED'] as const).map((status) => <label className={`female111-choice ${form.readiness === status ? 'selected' : ''} ${status.toLowerCase()}`} key={status}>
        <input type="radio" name="readiness" value={status} checked={form.readiness === status} onChange={() => updateForm('readiness', status)} />
        <span><b>{status === 'GREEN' ? '绿灯' : status === 'YELLOW' ? '黄灯' : '红灯'}</b><small>{displayReadiness(status)}</small></span>
      </label>)}
    </div>
    <label className="female111-check-row"><input type="checkbox" checked={form.safetySignal} onChange={(event) => updateForm('safetySignal', event.target.checked)} /> 当前存在疼痛、症状加重或其他需要进一步评估的安全信号</label>
    <div className="female111-safety-note"><ShieldAlert size={18} /><span>不在这里做医学诊断；出现安全信号时，系统只负责停止训练并提示进一步评估。</span></div>
  </section>

  <section className="female111-form-card">
    <div className="female111-section-title"><div><ProductEyebrow>03 · 场地确认</ProductEyebrow><h2>场地与器械</h2></div><span>缺少器械会阻断方案</span></div>
    <div className="female111-equipment-grid">{equipmentOptions.map(([id, label]) => <label className="female111-equipment" key={id}><input type="checkbox" checked={form.availableEquipment.includes(id)} onChange={() => toggleEquipment(id)} /><span>{label}</span></label>)}</div>
    <label className="female111-check-row"><input type="checkbox" checked={form.venueConfirmed} onChange={(event) => updateForm('venueConfirmed', event.target.checked)} /> 我已确认今天的训练区域、地面和器械可用</label>
  </section>

  <div className="female111-form-actions"><button className="primary-button" onClick={onGenerate}><Play size={17} />生成今日训练</button><span>生成后仍需教练确认，系统不会自动开始执行。</span></div>
</>

const PlanStep = ({
  form,
  product,
  model,
  updateForm,
  onConfirm,
  onBack,
  onStart,
}: {
  form: ProductForm
  product: Female111CoachProductResult | null
  model: Female111CoachProductResult['model']
  updateForm: <K extends keyof ProductForm>(key: K, value: ProductForm[K]) => void
  onConfirm: (confirmed: boolean) => void
  onBack: () => void
  onStart: () => void
}) => {
  const readiness = product?.evidence?.populationOverlay.readiness
  const status = readiness?.status === 'RED' ? 'red' : model?.allowed ? readiness?.status === 'YELLOW' ? 'yellow' : 'green' : 'blocked'
  const statusTitle = readiness?.status === 'RED'
    ? readiness.action === 'REFER' ? '红灯 · 停止并建议进一步评估' : '红灯 · 今天不执行训练'
    : model?.allowed ? readiness?.status === 'YELLOW' ? '黄灯 · 方案可执行，但需要退阶' : '绿灯 · 方案可执行' : '方案暂不能开始'
  const statusCopy = readiness?.status === 'RED'
    ? readiness.reasons.join(' ')
    : model?.allowed ? readiness?.status === 'YELLOW' ? '系统会优先降低总量、需求、复杂度和负荷；执行中以质量为准。' : '条件已满足，确认后进入训练记录。' : '先处理下方的教练确认、场地或人群适配条件。'
  const issueReasons = model?.sessionReasons ?? product?.buildIssues.map((issue) => issue.message) ?? []

  return <>
    <section className={`female111-status-panel ${status}`} aria-label="今日方案状态">
      <div className="female111-status-icon">{status === 'green' ? <CheckCircle2 size={22} /> : <ShieldAlert size={22} />}</div>
      <div><ProductEyebrow>今日方案状态</ProductEyebrow><h2>{statusTitle}</h2><p>{statusCopy}</p></div>
      <span className="female111-status-chip">{populationLabels[form.population]} · {form.stage}</span>
    </section>

    {issueReasons.length > 0 && <section className="female111-issue-card"><b>开始前需要处理</b><ul>{issueReasons.map((reason, index) => <li key={`${reason}-${index}`}>{translateProductReason(reason)}</li>)}</ul></section>}
    {readiness?.status === 'YELLOW' && <section className="female111-yellow-callout"><RotateCcw size={18} /><div><b>今日建议退阶</b><p>{readiness.reasons.join(' ')}</p></div></section>}

    <section className="female111-plan-choice-card">
      <div><b>教练选择训练组合</b><p>系统先给出一组合法推荐；教练可以在确认前切换另一组经过同样规则校验的 Block A / B 组合。</p></div>
      <label>今天的组合逻辑<select aria-label="教练选择训练组合" value={form.planId ?? 'SQUAT_AND_LOCOMOTION'} onChange={(event) => updateForm('planId', event.target.value as ProductForm['planId'])}>{female111CoachPlanOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select></label>
      <p className="female111-plan-choice-rationale">{female111CoachPlanOptions.find((option) => option.id === (form.planId ?? 'SQUAT_AND_LOCOMOTION'))?.rationale}</p>
    </section>

    <section className="female111-confirm-card">
      <label className="female111-check-row"><input type="checkbox" checked={form.coachConfirmed && form.venueConfirmed} onChange={(event) => onConfirm(event.target.checked)} /> 我已检查动作质量、场地与人群适配</label>
      <p>确认后，教练对本次选择负责；如果执行中出现问题，可在记录阶段覆盖系统建议，但必须填写原因。</p>
    </section>

    {model && <>
      <div className="female111-section-title female111-plan-title"><div><ProductEyebrow>04 · 今日训练</ProductEyebrow><h2>今日训练方案</h2></div><span><Clock3 size={14} />约 32 分钟 · 准备 + 两个训练块</span></div>
      <section className="female111-session-meta"><div><small>训练目标</small><b>{product?.session?.target}</b></div><div><small>训练结构</small><b>准备 · 训练块 A · 训练块 B · 记录</b></div><div><small>执行边界</small><b>{form.readiness === 'YELLOW' ? '先退阶，再看质量' : '质量优先，出现信号即调整'}</b></div></section>
      {(['A', 'B'] as const).map((block) => <ProductBlock key={block} label={block} block={model.blocks[block]} />)}
      <section className="female111-boundary-card"><div><b>为什么这样组合</b><p>每个训练块只承担一个主要挑战，支持动作和核心控制负责补足执行条件；两个块不重复主要疲劳来源。</p></div><div><b>执行动线</b><p>先在地面训练区完成准备，再按训练块 A → 训练块 B 执行；每个动作都保留退阶路径。</p></div></section>
    </>}

    <div className="female111-form-actions"><button className="text-action" onClick={onBack}><ChevronRight size={16} style={{ transform: 'rotate(180deg)' }} />返回修改条件</button><button className="primary-button" disabled={!model?.allowed} onClick={onStart}><ClipboardCheck size={17} />确认方案并开始记录</button></div>
  </>
}

export const ProductBlock = ({ label, block }: { label: 'A' | 'B'; block: NonNullable<Female111CoachProductResult['model']>['blocks']['A'] }) => {
  const recipe = getFemale111CoachRecipeDisplay(block.recipe)
  return <section className="female111-product-block">
  <div className="female111-product-block-head"><div><ProductEyebrow>训练块 {label}</ProductEyebrow><h3>{recipe.name}</h3></div><span>一个主要挑战</span></div>
  <p className="female111-product-rationale">{recipe.rationale}</p>
  <div className="female111-product-slot-grid">{(['PRIMARY', 'SUPPORT', 'CORE'] as const).map((slotName) => {
    const slot = block.slots[slotName]
    return <article className="female111-product-slot" key={slotName}>
      <div className="female111-product-slot-top"><span>{getFemale111CoachSlotLabel(slot.slot)}</span><b>{getFemale111CoachDemandLabel(slot.demand)}</b></div>
      <h4>{getFemale111CoachExerciseName(slot.methodNodeId, slot.displayName)}</h4>
      <p className="female111-product-slot-meta">{getFemale111CoachChallengeRoleLabel(slot.challengeRole)} · {getFemale111CoachFamilyLabel(slot.progressionFamily)}</p>
      <p>{getFemale111CoachRationale(slot.methodNodeId, slot.coachRationale)}</p>
      <details><summary>执行边界与下一路径</summary><p>{slot.progression?.failureCondition ?? '质量下降时回到更易控制的版本。'}</p><p>{slot.progression?.rationale ?? '保持可重复控制，再决定是否进阶。'}</p></details>
      <div className="female111-proof-row"><span>人群：{getFemale111CoachStatusLabel(slot.population)}</span><span>场地：{getFemale111CoachStatusLabel(slot.venue)}</span></div>
    </article>
  })}</div>
  </section>
}

const templatePreview = buildFemale111CoachProduct({
  id: 'female111-template-preview',
  target: '力量基础',
  stage: 'L1',
  population: 'GENERAL',
  readiness: 'GREEN',
  coachConfirmed: true,
  venueConfirmed: true,
  availableEquipment: ['barbell', 'box', 'mini-band'],
})

export const Female111TemplatePage = () => {
  const model = templatePreview.model
  return <div className="page detail-page female111-page female111-template-page">
    <div className="sticky-context"><a href="#/templates"><ChevronRight size={16} style={{ transform: 'rotate(180deg)' }} />训练模板</a><span>PPF111 / 女性 1+1+1</span><span aria-hidden="true" /></div>
    <section className="female111-template-hero">
      <div>
        <ProductEyebrow>PPF111 · 训练模板</ProductEyebrow>
        <h1>PPF111 · 女性 1+1+1 训练模板</h1>
        <p>一套由规则驱动的女性综合训练模板：先准备，再用两个互不重复的训练块完成主训练、支持与核心控制，最后留下恢复和执行记录。</p>
      </div>
      <div className="female111-template-mark"><strong>1+1+1</strong><span>主训练 · 支持 · 核心控制</span></div>
    </section>

    <section className="female111-template-note"><CheckCircle2 size={19} /><div><b>这是训练模板，不是固定动作清单</b><p>今天的具体动作会根据目标、阶段、准备度、孕产状态、场地与教练确认，从同一套 PPF111 规则中解析出来。</p></div></section>

    <section className="female111-template-section">
      <div className="female111-section-title"><div><ProductEyebrow>模板骨架</ProductEyebrow><h2>一节 PPF111 训练课怎么组成</h2></div><span>固定结构 · 可变动作</span></div>
      <div className="female111-template-structure">
        <article><span>PREP</span><b>训练准备</b><p>把呼吸、位置和当天的可控范围先建立起来。</p></article>
        <article><span>BLOCK A</span><b>第一个训练块</b><p>一个主训练挑战，配一个支持动作和一个核心控制。</p></article>
        <article><span>BLOCK B</span><b>第二个训练块</b><p>转移能力但不重复主要疲劳来源。</p></article>
        <article><span>OPTIONAL ACCESSORY</span><b>可选辅助</b><p>只有在时间、场地和质量都允许时加入。</p></article>
        <article><span>RECOVERY / RECORD</span><b>恢复与记录</b><p>记录事实，让下一次训练有可追踪的依据。</p></article>
      </div>
    </section>

    <section className="female111-template-section">
      <div className="female111-section-title"><div><ProductEyebrow>模板示例</ProductEyebrow><h2>两个训练块，每块都是 1+1+1</h2></div><span>示例解析 · 非固定处方</span></div>
      {model ? <>{(['A', 'B'] as const).map((block) => <ProductBlock key={block} label={block} block={model.blocks[block]} />)}</> : <div className="female111-empty-state"><b>模板示例暂时无法解析</b><p>请进入编课工作台重新生成。</p></div>}
    </section>

    <section className="female111-template-boundaries"><div><b>适用边界</b><p>目标和阶段决定挑战方向；准备度与孕产状态决定是否退阶、限制或停止；场地和教练确认决定能否开始。</p></div><div><b>下一步</b><p>模板页负责理解结构，今日编课负责为具体会员解析动作并完成确认。</p></div></section>
    <div className="female111-form-actions"><a className="text-action" href="#/templates"><ChevronRight size={16} style={{ transform: 'rotate(180deg)' }} />返回模板</a><a className="primary-button" href="#/female111">进入今日编课 <ChevronRight size={17} /></a></div>
  </div>
}

const RecordStep = ({
  form,
  model,
  draft,
  savedResult,
  hasInvalidOverride,
  updateDraft,
  onSave,
  onHistory,
}: {
  form: ProductForm
  model: Female111CoachProductResult['model']
  draft: SessionRecordDraft
  savedResult: Female111SessionResult | null
  hasInvalidOverride: boolean
  updateDraft: (block: 'A' | 'B', slot: Female111Slot, patch: Partial<DraftSlot>) => void
  onSave: () => void
  onHistory: () => void
}) => {
  if (!model) return <div className="female111-empty-state"><b>还没有可记录的训练方案</b><p>请先生成并确认一节训练。</p></div>
  return <>
    <section className="female111-record-header"><div><ProductEyebrow>05 · 训练后记录</ProductEyebrow><h2>记录本次训练</h2><p>记录事实，不替会员猜测感受；系统只根据质量、症状和保留次数给出下一步建议。</p></div><span>{displayReadiness(form.readiness)}</span></section>
    {savedResult && <section className="female111-saved-banner"><CheckCircle2 size={19} /><div><b>训练已记录</b><p>本次结果已保存在当前设备，可在训练历史中复制为下一节的起点。</p></div><button onClick={onHistory}>查看训练历史</button></section>}
    {(['A', 'B'] as const).map((block) => <section className="female111-record-block" key={block}><div className="female111-record-block-head"><span>训练块 {block}</span><b>{getFemale111CoachRecipeDisplay(model.blocks[block].recipe).name}</b></div><div className="female111-record-grid">{(['PRIMARY', 'SUPPORT', 'CORE'] as const).map((slotName) => <RecordSlot key={slotName} block={block} slot={slotName} modelSlot={model.blocks[block].slots[slotName]} draft={draft[block][slotName]} onChange={(patch) => updateDraft(block, slotName, patch)} />)}</div></section>)}
    <div className="female111-record-actions"><button className="primary-button" disabled={hasInvalidOverride || Boolean(savedResult)} onClick={onSave}><Save size={17} />{savedResult ? '已保存本次记录' : '保存训练记录'}</button>{hasInvalidOverride && <span className="female111-validation-hint">教练覆盖系统建议时，必须填写覆盖原因。</span>}</div>
  </>
}

const RecordSlot = ({
  block,
  slot,
  modelSlot,
  draft,
  onChange,
}: {
  block: 'A' | 'B'
  slot: Female111Slot
  modelSlot: NonNullable<Female111CoachProductResult['model']>['blocks']['A']['slots'][Female111Slot]
  draft: DraftSlot
  onChange: (patch: Partial<DraftSlot>) => void
}) => {
  const automaticDecision = decideFemale111NextStep({ quality: draft.quality, rir: slot === 'PRIMARY' ? Number(draft.rir) || 0 : undefined, symptoms: splitSymptoms(draft.symptoms) })
  const selectedDecision = draft.decisionOverride === 'AUTO' ? automaticDecision : draft.decisionOverride
  return <article className="female111-record-slot">
    <div className="female111-record-slot-head"><div><span>{getFemale111CoachSlotLabel(slot)}</span><h3>{getFemale111CoachExerciseName(modelSlot.methodNodeId, modelSlot.displayName)}</h3></div><span className={`female111-decision-pill ${selectedDecision.toLowerCase()}`}>下一步：{decisionLabels[selectedDecision]}</span></div>
    {slot === 'PRIMARY' ? <div className="female111-record-input-grid"><label>负重（kg）<input type="number" min="0" value={draft.loadKg} onChange={(event) => onChange({ loadKg: event.target.value })} /></label><label>完成组数<input type="number" min="0" value={draft.sets} onChange={(event) => onChange({ sets: event.target.value })} /></label><label>每组次数<input type="number" min="0" value={draft.reps} onChange={(event) => onChange({ reps: event.target.value })} /></label><label>保留次数 RIR<input type="number" min="0" value={draft.rir} onChange={(event) => onChange({ rir: event.target.value })} /></label></div> : <div className="female111-record-input-grid"><label>动作版本<input value={draft.version} onChange={(event) => onChange({ version: event.target.value })} /></label><label>完成次数<input type="number" min="0" value={draft.reps} onChange={(event) => onChange({ reps: event.target.value })} /></label><label>持续时间（秒）<input type="number" min="0" value={draft.durationSeconds} onChange={(event) => onChange({ durationSeconds: event.target.value })} /></label></div>}
    <div className="female111-record-input-grid secondary"><label>完成质量<select aria-label={`${block}${getFemale111CoachSlotLabel(slot)}完成质量`} value={draft.quality} onChange={(event) => onChange({ quality: event.target.value as Female111ExecutionQuality })}><option value="GOOD">{qualityLabels.GOOD}</option><option value="DEGRADED">{qualityLabels.DEGRADED}</option><option value="FAILED">{qualityLabels.FAILED}</option></select></label><label>症状或备注<input placeholder="无则留空；多个用逗号分隔" value={draft.symptoms} onChange={(event) => onChange({ symptoms: event.target.value })} /></label></div>
    <div className="female111-decision-row"><label>教练决定<select aria-label={`${block}${getFemale111CoachSlotLabel(slot)}教练决定`} value={draft.decisionOverride} onChange={(event) => onChange({ decisionOverride: event.target.value as DraftSlot['decisionOverride'] })}><option value="AUTO">采用系统建议：{decisionLabels[automaticDecision]}</option>{(Object.keys(decisionLabels) as Female111ProgressionDecision[]).map((decision) => <option key={decision} value={decision}>{decisionLabels[decision]}</option>)}</select></label>{draft.decisionOverride !== 'AUTO' && <label>覆盖原因<input required placeholder="为什么覆盖系统建议？" value={draft.overrideReason} onChange={(event) => onChange({ overrideReason: event.target.value })} /></label>}</div>
  </article>
}

const HistoryStep = ({ history, copyMessage, onCopy, onNew }: { history: readonly Female111SessionResult[]; copyMessage: string; onCopy: (id: string) => void; onNew: () => void }) => <>
  <section className="female111-record-header"><div><ProductEyebrow>06 · 训练闭环</ProductEyebrow><h2>训练历史</h2><p>从真实执行结果继续下一节训练；历史记录只保存在当前设备。</p></div><button className="primary-button" onClick={onNew}><Play size={16} />新建今日训练</button></section>
  {copyMessage && <div className="female111-saved-banner compact"><Check size={17} /><span>{copyMessage}</span></div>}
  {history.length === 0 ? <div className="female111-empty-state"><History size={24} /><b>还没有训练记录</b><p>完成第一节 Female111 训练后，结果会出现在这里。</p></div> : <div className="female111-history-list">{history.map((result) => <article className="female111-history-item" key={result.id}><div><span>{new Date(result.recordedAt).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })} · {readinessLabels[result.readiness]}</span><h3>本次训练 · {decisionLabels[result.primary.nextStep]}</h3><p>主训练完成 {result.primary.sets ?? 0} 组 × {result.primary.reps ?? 0} 次；质量：{qualityLabels[result.primary.quality]}</p></div><button onClick={() => onCopy(result.id)}><RotateCcw size={16} />复制记录</button></article>)}</div>}
</>
