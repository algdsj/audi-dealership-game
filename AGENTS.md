# 项目开发准则

这份准则是后续功能开发的第一入口。开始写代码前，先用它判断边界；需要细节时再读 `docs/architecture-development-playbook.md`。

## 开工门禁

每个新功能开工前先写清楚：

1. 用户价值：玩家会在哪个经营决策里用到它？
2. 状态归属：是否进入存档？默认值、旧档兼容和自动存档 payload 在哪里处理？
3. 配置归属：数值、阈值、文案、权重是否可调？可调内容必须先落到 `src/game/config/`。
4. 逻辑归属：是否影响日结、月结、成交、评分、事件或结局？经营规则必须先落到 `src/game/engine/` 纯函数。
5. UI 归属：页面或面板放到哪个 `src/features/` 模块？新增入口是否需要懒加载？
6. 验证方式：需要哪些 smoke、unit、build、UI smoke 断言证明它没破坏主循环和存档？

没有回答完这些问题，不开始写业务代码。

## 架构落点

- `src/game/config/`：可配置内容。难度、概率、权重、文案、池子、阈值优先放这里。
- `src/game/state/`：初始状态、存档构建、旧档迁移、自动存档字段。
- `src/game/engine/`：纯经营规则。只能接收参数并返回结果，不碰 React、DOM、localStorage、HTTP。
- `src/app/`：状态 hook、controller、日结编排、页面壳上下文。
- `src/features/`：页面和组件。只展示数据、触发回调，不承载复杂经营算法。
- `src/services/`：外部能力接口。
- `src/infrastructure/`：localStorage、Steam、HTTP、AI 等具体实现。
- `src/shared/`：通用 UI、hooks、工具。

## 膨胀红线

- `src/App.jsx` 只允许做顶层组装、hook 接线、setup 分支和 shell context 传入。不得新增玩法算法、弹窗流程、localStorage 细节、日结/月结分支或页面 UI。
- `src/app/PlayingGameShell.jsx` 只允许做页面路由、懒加载和 props 转发。新增 tab 必须优先放到独立 `src/features/` 文件。
- `src/app/runDailyAdvance.js` 只做日结编排。新机制要先写 engine 纯函数，再接一层很薄的调用。
- `src/game/state/*` 和 `src/game/domain/saveSchema.js` 是存档 API，修改前必须明确兼容策略。
- 不为了消除构建警告而调大 chunk 阈值；新增页面入口优先懒加载，公共依赖优先拆出稳定边界。

## 可配置优先

经营事件、客户画像、难度影响、概率权重、奖励惩罚、文案池、触发条件默认都做成配置驱动。实现顺序固定为：

1. `config` 定义可调数据和难度映射。
2. `engine` 用纯函数消费配置。
3. `app` 负责把 state、setter 和 engine 接起来。
4. `features` 展示结果和玩家操作。
5. `scripts/smoke-test.mjs` 或相关测试覆盖关键路径。

## 存档协议

新增持久化字段必须同步处理：

- 初始默认值。
- 手动存档写入。
- 自动存档 payload。
- 旧档 normalize 兼容。
- smoke test 断言旧档或关键字段不丢失。

字段 `id` 一旦进入存档，默认视为稳定 API。确需改名时必须写迁移。

## 验证协议

默认验证顺序：

```bash
npm run lint
npm test
npm run build
npm run test:ui
```

只改文档时可以不跑运行时测试，但最终说明必须写清楚。涉及页面入口、懒加载、导航或首屏体验时必须跑 UI smoke。

## 小块开发与 worker 协作

- 每次只切一个边界清晰的小块，先备份、再修改、再验证。
- 可以把独立配置、纯 engine、独立 UI、只读 QA 分给 worker。
- 多个 worker 不要同时写同一个共享编排文件、存档文件、`package.json` 或测试入口。
- worker 任务必须写清楚拥有的文件范围，返回改动文件和验证结果。
- 共享文件由当前负责人最后接线，不能让多个分支各自扩大 `App.jsx`。

## 完成定义

一个功能只有同时满足这些条件才算完成：

- 配置、状态、engine、app、features 的落点清楚。
- 旧存档兼容。
- 新字段有默认值。
- 相关测试或 smoke 覆盖主路径。
- 涉及 UI 的入口已懒加载或确认不会扩大首包。
- README 或 docs 已更新。
- 已创建阶段备份。
