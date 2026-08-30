# PP-F111 完整训练模板 V1 设计规范

## 目标

把 PPF111 从“1+1+1 动作编排示例”升级为与 3C 同等级的完整训练模板系统：8 个 Recipe Family 各自提供 L1–L4 四套可执行课程，共 32 套模板。每套模板都能在详情页读懂并执行一节完整的 60 分钟训练课。

## 根因与边界

当前 `Female111RecipeFamily` 只表达 PRIMARY、SUPPORT、CORE 三个槽位，`Female111Session` 只表达 PREP、Block A、Block B 的组合，详情页又额外维护一份只有一个 PREP 和三个动作的字符串目录。这使 Recipe、Resolved Block、完整 Session 三个层级互相冒充。新版本明确：

- Recipe Family 是模板主题，不是课程内容；
- F111-L1–L4 是对外的完整课程模板；
- Block A/B 只保留在既有教练编课域作为内部组合能力，不再出现在 F111 模板详情页的主体结构中；
- 旧 PP、旧 Female FIT、3C、BODY、CON 的数据和路由保持不变；
- PPF111 的准备度、孕产状态、场地和教练确认仍然是运行时 gate，不被模板静态内容绕过。

## 课程模板结构

每个 `Female111TemplateLevel` 必须包含以下顺序：

1. `prep`：四段 R/M/A/P（Raise、Mobilize、Activate、Pattern），每段为一个真实动作，带结构化处方和目的；
2. `rampUp`：围绕 PRIMARY 的专项渐进热身，包含顺序、次数、负荷指导和组间休息；
3. `mainSequence`：完整主训练序列，不少于 5 个动作，至少包含一个 PRIMARY、一个 SUPPORT、一个 CORE，并允许同一角色在不同训练段中服务不同目的；
4. `optionalAccessory`：明确可选条件、动作、处方和加入后的时间上限；
5. `recoveryRecord`：恢复、呼吸、主观状态和训练事实记录提示；
6. `estimatedMinutes`：由计算器产生并由模板审计验证，计算最大值不得超过 60 分钟。

每个训练动作使用结构化 `ExercisePrescription`，至少明确 sets/reps、duration 或 distance 之一，并按需要声明 RIR/RPE、rest、laterality、tempo、ROM 和动作质量边界。页面展示中文动作名，但底层保留稳定 canonical Exercise ID。

## 等级与进阶

- L1：动作学习、低复杂度、较高保留次数；
- L2：基础负重或更完整活动范围；
- L3：单侧、动态或整合要求提高；
- L4：高阶整合，但必须保留退阶路径和前置条件。

相邻等级优先沿 load、volume、RIR、rest、range、control、density 等变量渐进；一次处方进阶最多改变两项主要变量。动作替换属于 Exercise Progression，不能伪装成处方进阶。

## 数据与运行时设计

新增的 PPF111 模板目录作为唯一模板事实源，提供 `getFemale111Template(recipeId, level)`、`validateFemale111TemplateLevel(level)` 和 `estimateFemale111TemplateMinutes(level)`。目录使用现有 canonical Exercise registry 和 PPF111 progression/readiness/venue 元数据，不再让 UI 维护独立的动作字符串副本。现有 Block Resolver、Selection Evidence、Coach ViewModel 和执行记录继续负责运行时解析与审计；它们消费所选等级，而不是反向生成模板定义。

时间估算必须拆出 prep、ramp-up、main work、set/round rest、动作转换、单侧调整、器械/教练缓冲、optional 和 recovery 等组件，并同时返回组件值与总范围。模板审计拒绝缺处方、缺 R/M/A/P、动作不足、缺 PRIMARY/CORE、时间超限和相邻等级无进阶证据的条目。

## UI 与路由

模板列表中的 8 个 PPF111 卡片进入 `#/templates/female111/:recipeId/:level`，默认 L1。详情页沿用 3C 的等级页结构：等级 tabs、快捷动作入口、训练原则、热身动作列表、专项渐进列表、主训练动作序列、处方/休息/指标、教练提示和动作库详情入口。页面不显示 Block A/B，不把单个动作卡再次包装成“完整课程”。

教练工作台继续通过独立入口生成会员当天课程；它读取模板等级作为候选内容，再叠加准备度、孕产状态、场地和教练确认 gate。模板页面的“进入今日编课”只负责跳转，不在静态模板页直接确认或保存会员训练。

## 验证合同

- 数据测试：8 个 Recipe Family、每个 4 个等级、每级四段 Prep、专项 ramp-up、至少 5 个主序列动作、结构化处方、canonical Exercise 身份、相邻等级进阶证据；
- 规则测试：时间组件相加、最大 60 分钟、Optional 时间 gate、缺字段拒绝、重复主疲劳来源和无退阶路径拒绝；
- UI 测试：默认 L1、L1–L4 切换、完整动作列表、次数/组数/休息、动作库链接、旧路由不变；
- 回归测试：既有 3C/BODY/CON、旧 PP/Female 页面和现有 Female111 运行时测试继续通过；
- 最终验证：`npm test -- --run`、`npm run build`、`git diff --check`，并用当前本地预览逐级截图检查至少 L1 和 L4。

## 不在本次范围

不部署、不上传、不发布、不合并到主分支；不把 PPF111 静态模板改写成会员数据库处方；不修改旧 PP Method 节点、Exercise registry、3C/BODY/CON 模板和正式发布流程。
