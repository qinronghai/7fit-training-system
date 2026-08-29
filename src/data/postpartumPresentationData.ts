export type Level = 'l0' | 'l1' | 'l2' | 'l3' | 'l4'

export type ActionEntity = {
  id: string
  name: string
  englishName: string
  category: string
  movementPatterns: string[]
  level: Level[]
  goals: string[]
  scenarios: string[]
  coachCues: string[]
  commonErrors: string[]
  regressions: string[]
  progressions: string[]
  primaryVideo: string
  secondaryVideo: string
  riskNotes: string[]
  cardContent: {
    overview: string
    trainingTarget: string
    setup: string
    coachingPoints: string[]
    progression: string
    stopSignals: string[]
  }
}

const ppSeeds: Array<[string, string, string, string, string[], string[], string[], [string, string]]> = [
  ['PP01', '髋主导蹲', 'L1 → L2', '髋模式', ['squat'], ['髋屈髋伸与核心协同'], ['建立髋主导下肢基础蹲型。'], ['https://www.youtube.com/watch?v=1dpapTXF4Qs', 'https://www.youtube.com/watch?v=Z50B4zzadvw']],
  ['PP02', '髋铰链拉', 'L1 → L3', '髋模式', ['hinge'], ['髋折叠与后链发力'], ['建立髋铰链，减少腰部代偿。'], ['https://www.youtube.com/watch?v=2W_gXhut5S8', 'https://www.youtube.com/watch?v=wMU12lpPKiA']],
  ['PP03', '硬拉推肩', 'L4', '髋模式', ['hinge', 'vpush'], ['全身力量传递与上下肢联动'], ['高阶复合动作，连接髋铰链与垂直推。'], ['https://www.drfitology.com/exercises/glutes/deadlift-to-overhead-press', 'https://www.vitalmovementkg.com/blank-5']],
  ['PP04', '90/90 髋转换', 'L1 → L2', '髋模式', ['rotation'], ['髋旋转灵活性与骨盆感知'], ['改善髋内外旋与骨盆—躯干分离控制。'], ['https://www.youtube.com/watch?v=0aeJoPigJJ4', 'https://www.youtube.com/watch?v=plbH81ZlnZs']],
  ['PP05', '90/90 胫骨箱顶髋', 'L2', '髋模式', ['hip', 'rotation'], ['髋伸展与臀部稳定'], ['在 90/90 基础上强化前侧髋伸展。'], ['https://www.youtube.com/watch?v=lpD7TQQkETQ', 'https://www.starnewskorea.com/en/business-life/2026/04/06/2026040610171590926']],
  ['PP06', '坐姿骨盆髋走', 'L1 → L2', '髋模式', ['core'], ['骨盆控制与节律感'], ['重建骨盆前后、左右移动和本体感觉。'], ['https://www.youtube.com/watch?v=eixkcrX_Qh8&t=374s', 'https://vimeo.com/581888799']],
  ['PP07', '低位鸭步', 'L3 → L4', '髋模式', ['single', 'squat'], ['下肢稳定与步态控制'], ['强化髋膝踝对线与下肢耐力。'], ['https://www.youtube.com/watch?v=tXJr-RhR0lo', 'https://www.youtube.com/watch?v=HgX0LfCeEx4']],
  ['PP08', '侧卧髋内收', 'L1', '髋模式', ['adduction'], ['骨盆稳定与髋内收控制'], ['补足常被忽视的髋内收基础能力。'], ['https://www.youtube.com/watch?v=lhwT35sshrI', 'https://www.youtube.com/watch?v=rh0T5yfo1vU']],
  ['PP09', '弹力带半蹲侧向走', 'L2', '髋模式', ['single', 'rotation'], ['臀中肌与骨盆稳定'], ['半蹲位侧向抗阻，提升动态稳定。'], ['https://www.youtube.com/watch?v=wJfKBk1twuc', 'https://www.youtube.com/watch?v=CJ6lwx3Layk']],
  ['PP10', '臀桥', 'L1', '髋模式', ['hip'], ['基础髋伸展'], ['产后恢复常用的基础髋伸展动作。'], ['https://www.youtube.com/watch?v=GccUEieondE', 'https://www.youtube.com/watch?v=dodjximVxVk']],
  ['PP11', '四足游泳', 'L2', '支撑模式', ['core'], ['躯干稳定与四肢分离'], ['四足位对侧伸展，建立支撑控制。'], ['https://www.youtube.com/watch?v=LaLKNS7mxrk', 'https://blueskypt.com/videos/bird-dog/']],
  ['PP12', '四足跪姿单臂胸椎旋转', 'L2', '支撑模式', ['rotation'], ['胸椎活动与肩带稳定'], ['在四足位中进行受控胸椎旋转。'], ['https://www.youtube.com/watch?v=cLEI3hm98PA', 'https://www.youtube.com/watch?v=snzLuyYgbVI']],
  ['PP13', '高位支撑前跨步转体', 'L3', '支撑模式', ['core', 'rotation'], ['动态支撑与髋屈控制'], ['从静态稳定走向动态整合。'], ['https://www.youtube.com/watch?v=qCDFp8cPrqw', 'https://www.youtube.com/watch?v=wQOJDsdb_-Y']],
  ['PP14', '高位平板前跨步', 'L3', '支撑模式', ['core', 'single'], ['核心稳定与髋屈控制'], ['高位平板中加入前跨步挑战。'], ['https://www.menshealth.com/fitness/a39739172/spider-man-lunge-partner-workout/', 'https://www.youtube.com/watch?v=rLxleaS1h-c']],
  ['PP15', '支撑膝撞', 'L3', '支撑模式', ['core'], ['腹壁控制与髋屈结合'], ['支撑位膝撞，提升动态抗伸展。'], ['https://www.youtube.com/watch?v=kXUHAYe215c', 'https://www.youtube.com/watch?v=rte-AzwLcUw']],
  ['PP16', '平板支撑', 'L3', '支撑模式', ['core'], ['前侧支撑与张力传递'], ['基础而关键的前侧支撑动作。'], ['https://www.nasm.org/resource-center/exercise-library/plank', 'https://www.patterson-pt.com/videos']],
  ['PP17', '平板位主动收腹 / 骨盆后倾', 'L3', '支撑模式', ['core'], ['腹壁参与与骨盆位置控制'], ['在平板基础上强化主动收腹。'], ['https://www.youtube.com/watch?v=S53wIIZNBf0', 'https://www.youtube.com/watch?v=O5Ml9Z50dTs']],
  ['PP18', '侧支撑转体', 'L4', '支撑模式', ['core', 'rotation'], ['侧链稳定与旋转控制'], ['高阶侧向支撑结合转体。'], ['https://www.youtube.com/watch?v=Qo0j8L8sXJk', 'https://www.youtube.com/watch?v=c0Znb49CERM']],
  ['PP19', '侧支撑顶髋', 'L3', '支撑模式', ['core'], ['侧链稳定与臀中肌激活'], ['兼顾侧向支撑和髋外展能力。'], ['https://www.bodi.com/blog/side-plank-hip-lifts', 'https://vimeo.com/649281250']],
  ['PP20', '四足支撑', 'L1', '支撑模式', ['core'], ['基础支撑建位'], ['后续四足与爬行训练的起点。'], ['https://library.theprehabguys.com/vimeo-video/quadruped-position-isometric-hold/', 'https://zaccupples.com/quadruped-hold/']],
  ['PP21', '站立 360° 呼吸控制', 'L0', '呼吸 / 核心控制', ['core'], ['呼吸与腹压感知'], ['从站立位建立 360° 呼吸控制。'], ['https://www.youtube.com/watch?v=4KhtReabG2o', 'https://www.youtube.com/watch?v=kLIc56f1gk0']],
  ['PP22', '腹横肌呼吸—肢体联动串联', 'L0 → L2', '呼吸 / 核心控制', ['core'], ['呼吸控制与肢体联动'], ['将呼吸进一步串联到肢体动作。'], ['https://www.youtube.com/watch?v=J82VHm0IRwA', 'https://www.youtube.com/watch?v=ReljeItc27Y']],
  ['PP23', '普拉提单腿伸展', 'L3', '呼吸 / 核心控制', ['core'], ['腹部控制与四肢分离'], ['在腹压稳定下进行单腿交替伸展。'], ['https://www.youtube.com/watch?v=-5-NRRq6q1M', 'https://www.youtube.com/watch?v=dWTA33G8SZ0']],
  ['PP24', '普拉提双腿伸展', 'L4', '呼吸 / 核心控制', ['core'], ['高阶前侧核心控制'], ['要求更强腹压维持的双腿伸展。'], ['https://www.youtube.com/watch?v=qD58bbjzcm0', 'https://www.youtube.com/watch?v=N-jZas9tMSU']],
  ['PP25', '普拉提十字交叉', 'L4', '呼吸 / 核心控制', ['core', 'rotation'], ['旋转型腹部控制'], ['进入高阶核心旋转整合阶段。'], ['https://www.youtube.com/watch?v=0K_NerG1-jw', 'https://www.youtube.com/watch?v=5gC-k_jIFOo']],
  ['PP26', '死虫式', 'L2', '呼吸 / 核心控制', ['core'], ['抗伸展与呼吸协同'], ['在产后恢复与普通训练中都可作为核心基础。'], ['https://www.youtube.com/watch?v=deadbug', 'https://www.youtube.com/watch?v=deadbug-secondary']],
]

const parseLevels = (label: string): Level[] => label.split('→').map((level) => level.trim().toLowerCase() as Level)

export const postpartumMovements: ActionEntity[] = ppSeeds.map(([id, name, levelLabel, category, movementPatterns, goals, scenarios, videoPair]) => {
  const [primaryVideo, secondaryVideo] = videoPair
  return {
    id: id.toLowerCase(),
    name,
    englishName: id,
    category,
    movementPatterns,
    level: parseLevels(levelLabel),
    goals,
    scenarios,
    coachCues: ['保持呼吸连续，骨盆与肋骨稳定。', '动作质量优先，不用疲劳掩盖控制问题。'],
    commonErrors: ['屏气、腰部抢力、腹壁外鼓或借惯性完成。'],
    regressions: ['缩小动作范围', '增加支撑或降低负荷'],
    progressions: ['增加停留与节奏控制', '逐步进入更复杂的整合动作'],
    primaryVideo,
    secondaryVideo,
    riskNotes: ['如出现疼痛、漏尿、坠胀、明显 Doming、屏气或症状加重，应立即退阶或停止。'],
    cardContent: {
      overview: scenarios[0],
      trainingTarget: goals.join('；'),
      setup: '先找到稳定支撑和舒适活动范围，确认呼吸可以连续，再开始动作。',
      coachingPoints: ['保持呼吸连续，骨盆与肋骨稳定。', '动作质量优先，不用疲劳掩盖控制问题。'],
      progression: `退阶：${['缩小动作范围', '增加支撑或降低负荷'].join('、')}；进阶：${['增加停留与节奏控制', '逐步进入更复杂的整合动作'].join('、')}`,
      stopSignals: ['疼痛', '漏尿', '坠胀或膨出感', '明显 Doming', '屏气或症状加重'],
    },
  }
})

export const getPostpartumMovement = (id: string) => postpartumMovements.find((movement) => movement.id === id)
