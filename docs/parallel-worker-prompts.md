# 并行 Worker 提示词

使用方式：每开一个新 chat，就复制对应 worker 的完整提示词。建议先同时发给 Worker A、Worker B、Worker C；等三者完成后，再发给 Worker D；最后发给 Worker E。

## Worker A：2D 门店总览 UI

```text
你现在接手一个 React/Vite 经营模拟游戏项目，工作目录是：
/Users/zhoutong/Desktop/奥迪4S店经营模拟_备份_20260507

你的任务是 Worker A：2D 门店总览 UI。

请先阅读：
- docs/parallel-feature-development-plan.md
- docs/config-editing-guide.md

背景：
这个游戏是“奥迪 4S 店经营模拟”。目前架构已经做过大量拆分，App.jsx 已经明显瘦身，游戏逻辑集中在 src/game/engine/，配置集中在 src/game/config/，页面集中在 src/features/。现在需要补强 Steam 化体验，其中最缺的是一个玩家可见的 2D 门店总览。

目标：
新增一个可复用的 2D 门店总览组件，让玩家一眼看到展厅、库房、售后、二手车区、办公室和员工动线的经营状态。它先作为独立 feature 组件存在，不要接入导航和全局状态，后续由 Worker D 统一集成。

你可以新增/修改：
- src/features/store/StoreOverviewTab.jsx
- src/features/store/storeOverviewViewModel.js
- src/features/store/storeOverview.css，仅当现有样式方式不够用时使用
- src/features/store/ 下其他必要的小组件

你禁止修改：
- src/App.jsx
- src/app/PlayingGameShell.jsx
- src/app/navigation.js
- src/app/runDailyAdvance.js
- src/app/useSaveDataBridge.js
- src/game/state/*
- src/game/domain/saveSchema.js
- scripts/smoke-test.mjs
- package.json

硬约束：
- 开工前先备份当前工程到 backups/worker-a-store-overview-start-YYYYMMDD-HHMM。
- 不新增 npm 依赖。
- 不访问 localStorage，不接入存档，不改全局状态。
- 组件通过 props 接收数据，并在缺字段时有安全默认值。
- 不做营销落地页，不做巨大 hero，不做装饰性大卡片堆叠。
- 视觉要像经营模拟工具：信息密度高、扫描效率高、状态反馈明确。
- 文本不能在桌面或移动宽度下溢出、遮挡。
- 遵守现有 UI 风格，优先复用项目里已有的 className 风格、按钮风格、卡片风格。

建议组件 props：
- inventory
- pendingOrders
- usedCars
- facility
- afterSales
- staff
- finance
- monthlyStats
- csi
- competitors
- alerts 或 logs

门店总览至少包含：
- 展厅：展车/库存/热销/缺货或积压提示。
- 库房：库存水位、库位压力、在途车辆。
- 售后：工位负荷、CSI、投诉压力。
- 二手车区：二手车库存、整备/待售状态。
- 办公室：现金、银行、投资人、厂家压力。
- 员工动线：销售/售后/市场/财务团队的压力或士气。

实现建议：
- 把数据整理逻辑放到 storeOverviewViewModel.js。
- StoreOverviewTab.jsx 只负责展示。
- 可以内置一份 demo fallback 数据，方便组件在没有 props 时也能渲染，但不要影响真实数据接入。

完成前请运行：
- npm run lint

最终回复必须包含：
- 修改/新增了哪些文件。
- 确认没有触碰哪些禁止文件。
- StoreOverviewTab 的 props 说明。
- 给 Worker D 的集成建议：需要从哪里传哪些真实数据、建议放在哪个导航入口。
- npm run lint 的结果。
```

## Worker B：事件剧情线配置与纯逻辑

```text
你现在接手一个 React/Vite 经营模拟游戏项目，工作目录是：
/Users/zhoutong/Desktop/奥迪4S店经营模拟_备份_20260507

你的任务是 Worker B：事件剧情线配置与纯逻辑。

请先阅读：
- docs/parallel-feature-development-plan.md
- docs/config-editing-guide.md
- src/game/config/events.js
- src/game/engine/monthEndSettlement.js
- src/game/engine/monthlyInvestorSettlement.js
- src/game/engine/manufacturerPolicy.js
- src/game/engine/marketEnvironment.js
- src/game/engine/competitorMonthlyReport.js
- src/game/engine/staffTurnover.js

背景：
游戏里已经有厂家政策、投资人压力、银行授信风险、竞品动作、客户投诉、员工离职等事件雏形，但现在多数是日志或消息，缺少统一的“剧情链”结构。你的任务是先做配置和纯 engine，不接入 App、不改存档、不改变玩法结果。

目标：
新增 story event 配置和纯逻辑引擎，把以下事件包装成可持续追踪的剧情链：
- 投资人施压
- 厂家压库
- 银行抽贷
- 竞品挖人
- 客户舆情
- 员工离职

你可以新增/修改：
- src/game/config/storyEvents.js
- src/game/engine/storyEventEngine.js
- src/game/engine/storyEventEngine.test-data.js，如需要本地假数据

你禁止修改：
- src/App.jsx
- src/app/*
- src/game/state/*
- src/game/domain/saveSchema.js
- scripts/smoke-test.mjs
- package.json

硬约束：
- 开工前先备份当前工程到 backups/worker-b-story-events-start-YYYYMMDD-HHMM。
- 不新增 npm 依赖。
- engine 不能 import React。
- engine 不能访问 DOM、localStorage、window、document。
- 不改变任何现有玩法结算结果。
- 新逻辑只返回 story events、logs、inboxMessages、storyState patch。
- 随机逻辑必须通过传入 rng 或兼容随机函数，不要在 engine 深处散落 Math.random()。
- 如果认为需要新增存档字段，只返回 createInitialStoryState 和 migration 建议，不要直接改 state/save 文件。

建议接口：

export function createInitialStoryState()

export function evaluateStoryEvents({
  gameState,
  storyState,
  day,
  month,
  rng,
})

返回值建议：

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

剧情链最低要求：
- 每条 chain 有稳定 id。
- 每个 event 有 severity、title、summary、participants、tags。
- 同一 chain 可以根据经营状态推进 stage。
- 生成结果要适合进入消息中心或日志弹窗。
- 文案要有叙事感，但不能虚构已经改变玩法的结果。

完成前请运行：
- npm run lint

最终回复必须包含：
- 修改/新增了哪些文件。
- 确认没有触碰哪些禁止文件。
- 新增的事件链列表。
- 函数接口和返回结构。
- 给 Worker D 的集成建议：建议在日结还是月结调用、storyState 如何存档、UI 如何展示。
- npm run lint 的结果。
```

## Worker C：员工故事与个人记忆

```text
你现在接手一个 React/Vite 经营模拟游戏项目，工作目录是：
/Users/zhoutong/Desktop/奥迪4S店经营模拟_备份_20260507

你的任务是 Worker C：员工故事与个人记忆。

请先阅读：
- docs/parallel-feature-development-plan.md
- docs/config-editing-guide.md
- src/game/config/staff.js
- src/game/engine/staffing.js
- src/game/engine/staffProgression.js
- src/game/engine/staffTurnover.js
- src/features/staff/StaffManagementTab.jsx
- src/shared/ui/StaffAvatar.jsx
- src/shared/ui/StaffCareerLine.jsx

背景：
游戏已有员工姓名、头像、标签、等级、成长、忠诚、压力、离职/挽留风险。现在希望员工不只是数值，而是有故事记忆，例如“我的销冠被奔驰挖走了”“售后主管连续救场”“新人被老员工带起来了”。你的任务是先做配置和纯 engine，尽量不碰 UI，不接入 App 和存档。

目标：
新增员工故事配置和纯逻辑，让员工在成长、压力、挖角、挽留、带教、高光时刻中产生可展示的 story moment。

你可以新增/修改：
- src/game/config/staffStories.js
- src/game/engine/staffStoryEngine.js
- src/shared/ui/StaffStoryBadge.jsx，如需要一个纯展示小组件

谨慎修改：
- src/features/staff/StaffManagementTab.jsx
只有在非常小范围展示 badge，且不会引起集成冲突时才改。更推荐只提供组件和集成建议。

你禁止修改：
- src/App.jsx
- src/app/*
- src/game/state/*
- src/game/domain/saveSchema.js
- scripts/smoke-test.mjs
- package.json

硬约束：
- 开工前先备份当前工程到 backups/worker-c-staff-stories-start-YYYYMMDD-HHMM。
- 不新增 npm 依赖。
- engine 不能 import React。
- engine 不能访问 DOM、localStorage、window、document。
- 不改变现有员工成长、离职、挽留的结算结果。
- 优先复用已有员工字段：姓名、头像、标签、等级、忠诚、压力、retained、risk、role、skill。
- 如果需要长期记忆，只返回 staffStoryMemoryPatch 和存档建议，不要直接改 state/save 文件。
- 随机逻辑必须通过传入 rng 或兼容随机函数。

建议接口：

export function evaluateStaffStoryMoments({
  staff,
  previousStaff,
  monthlyStats,
  logs,
  rng,
  day,
  month,
})

返回值建议：

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

故事类型最低要求：
- 销冠成长：连续成交、技能提升、升阶。
- 压力警报：连续高压、忠诚下降、事故风险。
- 竞品邀约：高能力低忠诚员工被挖。
- 挽留成功/失败：和现有 retained/turnover 逻辑对齐。
- 师徒/带教：资深员工影响新人。
- 高光时刻：关键订单、客户好评、救场。

完成前请运行：
- npm run lint

最终回复必须包含：
- 修改/新增了哪些文件。
- 确认没有触碰哪些禁止文件。
- 新增的故事类型列表。
- 函数接口和返回结构。
- 给 Worker D 的集成建议：建议在哪个日结/月结节点调用、员工故事如何进消息中心或员工页。
- npm run lint 的结果。
```

## Worker D：总集成

```text
你现在接手一个 React/Vite 经营模拟游戏项目，工作目录是：
/Users/zhoutong/Desktop/奥迪4S店经营模拟_备份_20260507

你的任务是 Worker D：总集成。

请先阅读：
- docs/parallel-feature-development-plan.md
- docs/parallel-worker-prompts.md
- Worker A 的最终回复
- Worker B 的最终回复
- Worker C 的最终回复

背景：
Worker A/B/C 应该已经分别完成：
- 2D 门店总览 UI
- 事件剧情线配置与纯逻辑
- 员工故事与个人记忆纯逻辑

你是唯一允许修改 App、src/app、state、save schema 和主流程的人。你的目标是把它们统一接入，避免多个 chat 同时改核心文件造成冲突。

目标：
把 2D 门店总览、事件剧情线、员工故事 moment 接入现有游戏，让玩家能看到、能推进日结/月结、能保存读取，同时保持 App.jsx 继续瘦身。

你可以修改：
- src/App.jsx
- src/app/PlayingGameShell.jsx
- src/app/navigation.js
- src/app/runDailyAdvance.js
- src/app/useSaveDataBridge.js
- src/game/state/initialState.js
- src/game/state/saveData.js
- src/game/domain/saveSchema.js
- Worker A/B/C 新增模块的必要集成点

你需要谨慎修改：
- scripts/smoke-test.mjs
只有在接入后需要覆盖新字段或新流程时才改。

硬约束：
- 开工前先备份当前工程到 backups/worker-d-integration-start-YYYYMMDD-HHMM。
- 不新增 npm 依赖。
- 不把新逻辑塞回 App.jsx；App.jsx 只能做壳层和组合。
- 能放 src/app hook 的放 hook，能放 src/game/engine 的放纯 engine。
- 新增存档字段必须有默认值和迁移逻辑。
- 旧存档不能丢字段，不能因为缺少新字段崩溃。
- story/staff engine 必须保持纯逻辑，不依赖 React/localStorage。
- 事件和员工故事第一版优先进入日志、消息中心、员工页或门店总览，不要第一版就做复杂选择分支。
- 2D 门店总览入口可以做成新 tab，也可以放到 dashboard；优先选择玩家最容易发现且改动最小的方式。

集成建议：
- 2D 门店总览：从现有 state/view model 传 props，不让组件自己读全局。
- story events：优先在日结或月结统一节点调用，根据事件类型决定频率。
- staff moments：优先在员工成长/离职/日结收尾附近调用。
- 新增 storyState/staffStoryMemory 时，在 initialState 和 saveData migration 中补默认值。
- UI 展示可以先做轻量面板，不要一口气做复杂剧情选择系统。

完成前必须运行：
- npm run lint
- npm run build
- npm test

最终回复必须包含：
- 修改/新增了哪些文件。
- 接入了哪些玩家可见入口。
- 新增了哪些状态字段和迁移逻辑。
- App.jsx 是否继续保持瘦身，简述新增逻辑放在哪里。
- npm run lint、npm run build、npm test 的结果。
- 剩余风险和建议交给 Worker E 的测试重点。
```

## Worker E：Full Test 与验收

```text
你现在接手一个 React/Vite 经营模拟游戏项目，工作目录是：
/Users/zhoutong/Desktop/奥迪4S店经营模拟_备份_20260507

你的任务是 Worker E：Full Test 与验收。

请先阅读：
- docs/parallel-feature-development-plan.md
- docs/parallel-worker-prompts.md
- Worker D 的最终回复
- scripts/smoke-test.mjs

背景：
Worker D 应该已经把 2D 门店总览、事件剧情线、员工故事 moment 接入游戏。你负责最终验收，不做大规模架构改动。

目标：
验证游戏在架构优化后仍然可以 lint/build/test，通过浏览器基础流程；新门店总览、事件剧情、员工故事不会破坏存档、日结、月结。

你可以修改：
- scripts/smoke-test.mjs
- docs/manual-qa-checklist.md，如需要

你谨慎修改：
- 源码小 bug 可以修，例如空值保护、字段名漏传。
- 涉及状态结构、主流程、存档迁移的大 bug 先汇报，不要擅自大改。

硬约束：
- 开工前先备份当前工程到 backups/worker-e-full-test-start-YYYYMMDD-HHMM。
- 不新增 npm 依赖。
- 不做大范围重构。
- 重点找回归、空值、存档、日结/月结、新 UI 渲染问题。

必须运行：
- npm run lint
- npm run build
- npm test

建议浏览器手测：
- 打开本地 dev server。
- 创建新游戏。
- 进入门店总览，确认展厅、库房、售后、二手车区、办公室有数据且无重叠。
- 连续推进 3-5 天，确认日结不报错。
- 推进到月底，确认月结不报错。
- 观察 story event 或 staff moment 是否进入对应 UI。
- 保存、刷新、读档，确认新字段不丢，旧字段正常。
- 检查控制台无红色报错。
- 检查移动宽度下门店总览不溢出、不遮挡。

如果需要增强 smoke test：
- 可以在 scripts/smoke-test.mjs 中增加对新默认状态、迁移、纯函数、关键组件数据模型的测试。
- 不要把浏览器交互测试写得过重，优先保持脚本稳定。

最终回复必须包含：
- lint/build/test 结果。
- 浏览器手测结果。
- 发现的问题列表，按严重程度排序。
- 修复了哪些小问题。
- 未修复的风险和建议下一步。
```

