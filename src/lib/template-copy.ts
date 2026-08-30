import type { Template, TemplateLevel } from '../data/content'

const systemLabel: Record<Template['system'], string> = {
  '3c': '3C 代谢力量',
  body: 'BODY 塑形',
  conditioning: 'CONDITIONING 体能',
}

export const buildTemplateCopyText = (template: Template, current: TemplateLevel) => {
  const lines = [
    '7Fit Training System V6',
    `${systemLabel[template.system]} · ${template.code}`,
    `模板：${template.name}`,
    `方案等级：${current.label} · ${current.focus}`,
    '',
    `热身与动作准备（${current.warmup.length} 个动作）`,
    ...current.warmup.map((item, index) => `${index + 1}. ${item.name}｜${item.tag}｜${item.prescription}`),
    '',
    `${current.sectionTitle || '主训练'}（${current.sectionCount || `${current.exercises.length} 个动作`}）`,
    ...current.exercises.map((exercise, index) => `${index + 1}. ${exercise.name}｜${exercise.displayCategory ?? exercise.pattern}｜${exercise.prescription || '按模板完成'}`),
    '',
    '训练参数',
    ...current.metrics.map((metric) => `${metric.label}：${metric.value}`),
    '',
    current.coachNote ? `教练提示：${current.coachNote}` : '',
    '训练原则：动作质量、连续呼吸和控制稳定优先；技术下降或出现不适时，回到更低方案等级。',
  ]
  return lines.filter(Boolean).join('\n')
}
