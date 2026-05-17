# 架构开发约束手册

这份文档用于新功能开工前的架构判断，目标是避免 `App.jsx` 再次膨胀，减少后期返工。根目录 `AGENTS.md` 是项目开发准则；本手册负责展开具体做法。

## 强制准入

任何新增玩法、页面、状态或外部能力接入，先在任务说明里补一张功能准入卡：

```text
功能：
用户价值：
配置落点：
状态/存档落点：
纯逻辑落点：
UI 落点：
是否影响日结/月结/成交/评分：
旧档兼容策略：
验证命令：
```

准入卡没写清楚时，不进入代码实现。可以先补配置或测试草案，但不要把逻辑直接塞进 `App.jsx` 或页面组件。

## 开工前先回答

每个新功能先写清楚 5 件事：

1. 这个功能新增的是配置、状态、纯逻辑、服务适配，还是 UI？
2. 它是否会进入存档？如果会，默认值和旧档迁移在哪里处理？
3. 它是否会影响日结/月结/成交/评分？如果会，纯逻辑函数放在哪里？
4. 它是否依赖浏览器、localStorage、AI、Steam、HTTP？如果会，必须经过 `services/` 或 `infrastructure/` 适配层。
5. 它需要哪些 smoke 测试或 UI smoke 检查才能证明没有破坏存档和主循环？

## 目录落点规则

```text
src/
  app/                    # React 应用壳、状态编排、controller/hook、页面懒加载
  game/
    config/               # 静态配置：车型、区域、剧本、投资人、事件、成就、员工标签
    state/                # 初始状态、存档构建、旧档迁移、自动存档 payload
    engine/               # 纯经营规则：日结、月结、财务、评分、剧情、员工成长
    domain/               # 存档结构、领域模型、跨层共享 schema
  features/               # 页面和组件，只负责展示和触发回调
  services/               # 登录、存档、AI、埋点、排行榜等抽象接口
  infrastructure/         # localStorage、Steam、HTTP 等具体实现
  shared/                 # 通用 UI、hooks、工具
```

## 分层约束

- `game/engine/` 不依赖 React、DOM、localStorage、Steam、HTTP、AI API。
- `game/config/` 不读取运行时状态，不写副作用。
- `game/state/` 负责默认值、存档构建、旧档兼容，不写 UI。
- `features/` 不直接读写 localStorage，不自己计算复杂经营规则。
- `app/` 可以编排状态和 hook，但不要承载大段玩法算法。
- `services/` 定义外部能力接口，真实实现放到 `infrastructure/`。

## 新功能推荐流程

1. **配置先行**：可调数值、文案、阈值先放 `game/config/`。
2. **状态明确**：需要持久化的字段在 `game/state/` 加默认值和迁移。
3. **纯逻辑落地**：玩法结算用纯函数，输入 state/config，输出 patch/log/event。
4. **app 层编排**：用 hook/controller 连接 state setter 和 engine。
5. **UI 最后接入**：页面只收 props，按钮只回调，不直接改全局存档。
6. **验证收口**：每一步至少跑 `npm run lint`、`npm test`、`npm run build`；涉及页面入口时加 `npm run test:ui`。

## 可配置系统规则

经营事件、客户画像、难度影响、概率权重、奖励惩罚、文案池、触发条件默认走配置驱动：

- 配置放 `src/game/config/`，包括默认池子、难度倍率、权重和文案。
- 结算放 `src/game/engine/`，只接收 state/config/date/random 等输入并返回结果。
- 接线放 `src/app/`，只负责把 engine 输出应用到 React state。
- 展示放 `src/features/`，只渲染数据和触发回调。
- smoke test 至少覆盖一条触发路径和一条“不触发/兼容”路径。

难度相关逻辑不写散在组件里。难度应该在 config 中形成可查表的倍率、阈值或权重，让后续平衡调整不需要翻 UI 文件。

## App.jsx 准入原则

`App.jsx` 只适合保留：

- 顶层 hook 组装。
- 关键派生对象的组装。
- 页面壳的 context 传入。
- 少量无法立即拆分的历史兼容代码。

不再新增：

- 具体玩法算法。
- 大段弹窗流程。
- localStorage 细节。
- 日结/月结分支。
- 新页面 UI。
- 可独立测试的财务、员工、剧情、市场计算。

## 共享编排文件红线

这些文件允许变更，但必须小步、明确、可验证：

- `src/app/PlayingGameShell.jsx`：只做 tab 路由、懒加载、props 转发。
- `src/app/runDailyAdvance.js`：只做日结编排；新增经营机制先落纯 engine。
- `src/app/buildPlayingShellContext.js`：只做 context 汇总，不新增业务计算。
- `src/game/state/*`：必须同步默认值、旧档兼容和自动存档。
- `src/game/domain/saveSchema.js`：视为存档 API，字段变更必须有迁移。

新增页面入口默认懒加载。构建出现首包 chunk warning 时，优先拆入口依赖或移动重逻辑，不通过调大阈值掩盖。

## 存档字段新增规则

新增持久化字段必须同步处理：

- `createInitial...` 默认值。
- `buildManualSaveData` 写入。
- `normalizeLoadedSaveData` 旧档兼容。
- 自动存档 payload。
- smoke test 断言旧档不丢字段。

字段 `id` 一旦进入存档，默认视为稳定 API。确需改名时必须写迁移。

## 并行 worker 规则

适合并行：

- 独立 UI 组件。
- 纯配置文件。
- 纯 engine 函数。
- 只读 QA / 平衡测试。

不适合并行：

- `src/App.jsx`
- `src/app/*` 共享编排层。
- `src/game/state/*`
- `src/game/domain/saveSchema.js`
- `package.json`
- `scripts/smoke-test.mjs`

如果必须碰这些文件，由当前负责人做最后接线，且每次只改一个小边界。

当前协作中尽量不拉一个“大集成聊天”承接所有上下文。做法是：每个 worker 只拿自己的文件范围和验收标准，返回改动摘要；共享编排文件由当前负责人短接线、短验证、短备份。

## 验收清单

每个阶段结束前确认：

- `npm run lint`
- `npm test`
- `npm run build`
- 涉及前端入口或懒加载时运行 `npm run test:ui`
- 旧存档字段兼容
- 新字段有默认值
- 备份目录已创建
- README 或相关 docs 已更新
