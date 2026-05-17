# 并行功能开发计划与约束

本文档用于把后续工作拆给多个 chat 并行推进。目标是在不破坏现有存档、不重新膨胀 `App.jsx` 的前提下，补强三个 Steam 化体验点：

- 事件剧情线：投资人施压、厂家压库、银行抽贷、竞品挖人、客户舆情、员工离职。
- 员工成长与故事：员工有姓名、标签、成长、压力、挽留、被挖走等记忆点。
- 可视化门店：至少提供 2D 门店总览，展示展厅、库房、售后、二手车区、办公室与经营压力。

## 当前判断

### 已经基本具备

- 架构骨架已经拆出 `src/app/`、`src/game/config/`、`src/game/state/`、`src/game/engine/`、`src/features/`、`src/services/`。
- 事件雏形已经存在：厂家政策、投资人月评、银行授信风险、竞品月度动作、客户投诉、员工流失等都有 engine 或配置入口。
- 员工系统已经较完整：姓名、头像、标签、等级、成长、忠诚、压力、离职/挽留风险都已存在。
- 基础验证脚本已经存在：`npm run lint`、`npm run build`、`npm test`。

### 还没完全到位

- 事件目前偏“日志/消息”，还不是连续的“剧情链”。缺少统一的事件 id、阶段、参与者、后续追踪、玩家可记忆的叙事包装。
- 员工有成长数值和风险，但“个人故事记忆”还弱。比如“销冠被奔驰挖走”可以触发，但缺少更强的个人履历、故事回放、关系链。
- 门店可视化是当前最薄弱项。现有展厅格子、设施面板、市场图表是分散 UI，还没有一个统一的 2D 门店总览。

## 并行策略

可以并行的工作只做“新模块 + 小范围 UI”。所有涉及全局状态、存档迁移、日结/月结主流程、导航整合的改动，必须最后由一个集成 chat 统一处理。

### 可以并行

1. Worker A：2D 门店总览 UI
2. Worker B：事件剧情线配置与纯逻辑
3. Worker C：员工故事配置与纯逻辑

### 必须串行

4. Worker D：总集成
5. Worker E：Full Test 与验收

## 全局硬约束

所有 worker 必须遵守：

- 开工前先做备份，命名建议：`backups/<worker-name>-start-YYYYMMDD-HHMM`。
- 不要新增 npm 依赖，除非用户明确批准。
- 不要改玩法数值平衡，除非任务明确要求。
- 不要直接读写 `localStorage`，存档必须走现有 state/save 层。
- `src/game/engine/` 只能放纯逻辑，不能 import React，不能访问 DOM，不能访问浏览器 API。
- 新增随机逻辑必须支持注入随机源或使用调用方传入的 `rng`，不要在 engine 深处直接散落 `Math.random()`。
- 任何新增状态字段都必须有默认值和迁移方案，但默认由 Worker D 统一接入。
- 新 UI 要复用现有视觉语言，避免做营销页、巨大 hero、嵌套卡片或单色调装饰。
- 页面文案要直接服务经营判断，不写“功能介绍式”的说明文本。
- 文本必须在桌面和移动宽度下不溢出、不遮挡。
- 每个 worker 结束前至少运行自己能覆盖的验证命令；最终以 Worker E 的 full test 为准。

## 禁止多人同时修改的文件

以下文件只允许 Worker D 或 Worker E 修改，其他 worker 不要碰：

- `src/App.jsx`
- `src/app/PlayingGameShell.jsx`
- `src/app/navigation.js`
- `src/app/runDailyAdvance.js`
- `src/app/useSaveDataBridge.js`
- `src/game/state/initialState.js`
- `src/game/state/saveData.js`
- `src/game/domain/saveSchema.js`
- `scripts/smoke-test.mjs`
- `package.json`

如果某个 worker 认为必须改这些文件，应在自己的结果里写“集成建议”，不要直接改。

## Worker A：2D 门店总览 UI

### 目标

做一个可复用的 2D 门店总览组件，让玩家一眼看到门店状态，而不是只看表格。优先满足“Steam 用户需要视觉反馈”。

### 建议拥有文件

可以新增：

- `src/features/store/StoreOverviewTab.jsx`
- `src/features/store/storeOverviewViewModel.js`
- `src/features/store/storeOverview.css`，仅当现有样式方式不够用时使用

不要修改：

- `src/App.jsx`
- `src/app/PlayingGameShell.jsx`
- `src/app/navigation.js`
- 存档/state/engine 主流程文件

### 输入数据设计

组件先通过 props 接受数据，不直接依赖全局状态：

- `inventory`
- `pendingOrders`
- `usedCars`
- `facility`
- `afterSales`
- `staff`
- `finance`
- `monthlyStats`
- `csi`
- `competitors`
- `alerts` 或 `logs`

如果当前字段名称不确定，可以让 view model 做容错默认值。

### 视觉内容

至少包含这些区域：

- 展厅：展示新车展位占用、热销车型、缺货/积压提示。
- 库房：展示库存水位、库位压力、在途车辆。
- 售后：展示工位负荷、CSI、投诉压力。
- 二手车区：展示二手车库存、整备/待售状态。
- 办公室：展示现金、银行、投资人、厂家压力。
- 员工动线：展示销售/售后/市场/财务团队的压力或士气。

### 验收标准

- 组件可以在 Story-like 的假数据下独立渲染。
- 没有新增存档字段。
- 没有触碰禁止文件。
- `npm run lint` 通过。

### 给 Worker A 的 prompt

```text
你负责“2D 门店总览 UI”这个并行任务。请先阅读 docs/parallel-feature-development-plan.md，只处理 Worker A 范围。

目标：新增一个可复用的 2D 门店总览组件，展示展厅、库房、售后、二手车区、办公室和员工动线，让玩家从视觉上理解门店状态。

约束：
- 只新增/修改 src/features/store/ 下的文件，必要时可读取现有 features 作为风格参考。
- 不要修改 App.jsx、src/app/*、src/game/state/*、scripts/smoke-test.mjs、package.json。
- 组件通过 props 接收数据，不直接访问 localStorage，不接入全局状态。
- 不新增依赖。
- UI 要适合经营模拟游戏，信息密度高、可扫描，不做营销页或巨大 hero。

建议文件：
- src/features/store/StoreOverviewTab.jsx
- src/features/store/storeOverviewViewModel.js

完成后运行 npm run lint。最后汇报新增文件、组件 props、集成建议和验证结果。
```

## Worker B：事件剧情线配置与纯逻辑

### 目标

把现有零散事件升级成“剧情链”能力，但第一步只做配置和纯 engine，不直接接入主流程。

### 建议拥有文件

可以新增：

- `src/game/config/storyEvents.js`
- `src/game/engine/storyEventEngine.js`
- `src/game/engine/storyEventEngine.test-data.js`，如需本地烟测假数据

不要修改：

- `src/App.jsx`
- `src/app/runDailyAdvance.js`
- `src/game/state/initialState.js`
- `src/game/state/saveData.js`
- `scripts/smoke-test.mjs`

### 剧情链建议

至少设计这些链：

- 投资人施压：亏损、现金低、CSI 低、销量不达标时触发。
- 厂家压库：库存低或厂家目标压力高时触发，可能带来压库、返利、授权风险。
- 银行抽贷：现金风险、票据逾期、坏账或连续亏损时触发。
- 竞品挖人：销售明星、高压力、低忠诚时触发。
- 客户舆情：投诉、CSI 低、交付延期时触发。
- 员工离职：压力高、忠诚低、薪酬低、竞品动作强时触发。

### 纯函数接口建议

```js
export function createInitialStoryState()

export function evaluateStoryEvents({
  gameState,
  storyState,
  day,
  month,
  rng,
})
```

返回值建议：

```js
{
  storyState,
  events: [
    {
      id,
      chainId,
      stage,
      severity,
      title,
      summary,
      participants,
      tags,
      createdAt,
      expiresAt,
      suggestedActions,
      effectsPreview,
    },
  ],
  logs,
  inboxMessages,
}
```

### 验收标准

- 纯函数不依赖 React/DOM/localStorage。
- 同样输入和 rng 下输出稳定。
- 不改变现有玩法。
- `npm run lint` 通过。

### 给 Worker B 的 prompt

```text
你负责“事件剧情线配置与纯逻辑”这个并行任务。请先阅读 docs/parallel-feature-development-plan.md，只处理 Worker B 范围。

目标：新增 story event 配置和纯 engine，把投资人施压、厂家压库、银行抽贷、竞品挖人、客户舆情、员工离职包装成可持续追踪的剧情链。第一步只提供配置和纯函数，不接入 App 或存档。

约束：
- 只新增/修改 src/game/config/storyEvents.js 和 src/game/engine/storyEventEngine.js 等独立文件。
- 不要修改 App.jsx、src/app/*、src/game/state/*、scripts/smoke-test.mjs、package.json。
- engine 不能 import React，不能访问 localStorage/DOM。
- 新随机逻辑必须通过传入 rng 或兼容的随机函数。
- 不改变现有玩法结果，只返回建议事件、日志和 inbox message payload。

完成后运行 npm run lint。最后汇报函数接口、事件链列表、集成建议和验证结果。
```

## Worker C：员工故事与个人记忆

### 目标

让员工从“数值卡片”进一步变成“有故事的人”。第一步做配置和纯逻辑，尽量复用现有 staff 字段。

### 建议拥有文件

可以新增：

- `src/game/config/staffStories.js`
- `src/game/engine/staffStoryEngine.js`
- `src/shared/ui/StaffStoryBadge.jsx`，如果需要一个纯展示小组件

谨慎修改：

- `src/features/staff/StaffManagementTab.jsx`，只有在非常小范围展示 badge 时可以改。

不要修改：

- `src/App.jsx`
- `src/app/runDailyAdvance.js`
- `src/game/state/initialState.js`
- `src/game/state/saveData.js`
- `scripts/smoke-test.mjs`

### 故事类型建议

至少设计：

- 销冠成长：连续成交、技能提升、升阶。
- 压力警报：连续高压、忠诚下降、服务/销售事故。
- 竞品邀约：高能力低忠诚员工被挖。
- 挽留成功/失败：和现有 retained/turnover 逻辑对齐。
- 师徒/带教：资深员工影响新人。
- 高光时刻：关键订单、救场、客户好评。

### 纯函数接口建议

```js
export function evaluateStaffStoryMoments({
  staff,
  previousStaff,
  monthlyStats,
  logs,
  rng,
  day,
  month,
})
```

返回值建议：

```js
{
  moments: [
    {
      id,
      staffId,
      staffName,
      type,
      severity,
      title,
      summary,
      tags,
      createdAt,
    },
  ],
  staffStoryMemoryPatch,
  logs,
}
```

### 验收标准

- 优先使用已有员工姓名、头像、标签、等级、忠诚、压力、retained、risk 字段。
- 不引入复杂新状态；如果需要长期记忆，先返回 patch，由 Worker D 统一接入存档。
- `npm run lint` 通过。

### 给 Worker C 的 prompt

```text
你负责“员工故事与个人记忆”这个并行任务。请先阅读 docs/parallel-feature-development-plan.md，只处理 Worker C 范围。

目标：新增员工故事配置和纯 engine，让员工在成长、压力、挖角、挽留、带教、高光时刻中产生可展示的故事 moment。第一步不接入主流程，只返回 moments/logs/patch。

约束：
- 优先新增 src/game/config/staffStories.js 和 src/game/engine/staffStoryEngine.js。
- 可新增 src/shared/ui/StaffStoryBadge.jsx；除非必要，不要改 StaffManagementTab.jsx。
- 不要修改 App.jsx、src/app/*、src/game/state/*、scripts/smoke-test.mjs、package.json。
- engine 不能 import React，不能访问 localStorage/DOM。
- 不改变现有员工成长和离职结果，只在结果之上生成叙事 moment。

完成后运行 npm run lint。最后汇报函数接口、故事类型、集成建议和验证结果。
```

## Worker D：总集成

### 目标

在 Worker A/B/C 都完成后，统一接入 UI、导航、状态默认值、存档迁移、日结/月结调用点。

### 拥有文件

Worker D 可以修改：

- `src/App.jsx`
- `src/app/PlayingGameShell.jsx`
- `src/app/navigation.js`
- `src/app/runDailyAdvance.js`
- `src/app/useSaveDataBridge.js`
- `src/game/state/initialState.js`
- `src/game/state/saveData.js`
- `src/game/domain/saveSchema.js`
- Worker A/B/C 新增模块的必要集成点

### 集成原则

- `App.jsx` 不允许重新变成大状态机；能放 hook 就放 `src/app/`，能放纯逻辑就放 `src/game/engine/`。
- 新增存档字段必须可迁移旧存档。字段默认值应集中在 state 层。
- 事件剧情和员工故事优先以“日志/inbox/面板”形式展示，不要第一版就强行做复杂选择分支。
- 2D 门店总览可以作为新 tab，也可以成为 dashboard 的一个主面板；选择时优先减少导航复杂度。
- 接入后必须完整跑 lint/build/test。

### 给 Worker D 的 prompt

```text
你负责“总集成”任务。请先阅读 docs/parallel-feature-development-plan.md，并检查 Worker A/B/C 的结果。

目标：把 2D 门店总览、事件剧情线、员工故事 moment 统一接入现有应用。你是唯一允许修改 App.jsx、src/app/*、src/game/state/*、save schema 和 scripts/smoke-test.mjs 的 worker。

约束：
- 保持 App.jsx 继续瘦身，不把新逻辑塞回 App.jsx。
- 新增状态必须有默认值和存档迁移。
- story/staff engine 仍保持纯逻辑，不依赖 React/localStorage。
- UI 接入要复用现有 features/app 结构。
- 不新增依赖。

完成后运行 npm run lint、npm run build、npm test。最后汇报集成文件、存档迁移点、玩家可见入口和验证结果。
```

## Worker E：Full Test 与验收

### 目标

做最终全量验证，确保老功能没坏，新功能能看、能保存、能继续日结/月结。

### 拥有文件

Worker E 可以修改：

- `scripts/smoke-test.mjs`
- `docs/manual-qa-checklist.md`，如需要

只在发现 bug 且范围很小时修改源码；较大 bug 应先汇报。

### 测试清单

必须运行：

- `npm run lint`
- `npm run build`
- `npm test`

建议浏览器手测：

- 创建新游戏。
- 进入门店总览，看展厅、库房、售后、二手车区、办公室是否有数据。
- 连续推进 3-5 天，确认日结不报错。
- 推进到月底，确认月结不报错。
- 触发或观察 story event / staff moment 是否进入对应 UI。
- 保存、刷新、读档，确认新字段不丢且旧字段正常。
- 检查控制台无红色报错。

### 给 Worker E 的 prompt

```text
你负责“Full Test 与验收”任务。请先阅读 docs/parallel-feature-development-plan.md，并在 Worker D 集成完成后执行。

目标：验证架构优化后的游戏可以 lint/build/test，通过浏览器基本流程，且新门店总览、事件剧情、员工故事不会破坏存档和日结/月结。

约束：
- 先运行 npm run lint、npm run build、npm test。
- 如需增强脚本，只修改 scripts/smoke-test.mjs 或新增 docs/manual-qa-checklist.md。
- 小 bug 可以修；涉及状态结构、主流程的大 bug 先汇报，不要擅自大改。
- 最后输出通过项、失败项、风险项和建议下一步。
```

## 推荐执行顺序

1. 同时启动 Worker A、Worker B、Worker C。
2. 三个 worker 都完成后，启动 Worker D 做总集成。
3. Worker D 验证通过后，启动 Worker E 做 full test。
4. 如果 Worker E 发现问题，只把对应问题派回具体 worker；不要让所有 worker 同时改集成文件。

## 合并规则

- 如果多个 chat 在同一个工作目录操作，严格按“拥有文件”执行。
- 更稳的方式是每个 chat 复制一份工作目录，完成后由 Worker D 手动合并新增模块。
- 每个 worker 的最终回复必须包含：
  - 修改了哪些文件。
  - 没有触碰哪些禁止文件。
  - 新增函数/组件接口。
  - 验证命令结果。
  - 给 Worker D 的集成建议。

## 最小可交付版本

如果想先快速看到收益，优先级如下：

1. 先做 Worker A 的 2D 门店总览。它玩家可见、风险最低、和存档耦合最弱。
2. 再做 Worker B 的事件剧情线纯逻辑。它是后续叙事包装的核心。
3. 再做 Worker C 的员工故事。它可以复用 Worker B 的 story surface。
4. 最后统一集成。不要让三个并行 worker 各自接 App。

