# 奥迪 4S 店经营模拟 Full Test 测试报告

测试日期：2026-05-16  
测试用例：[`docs/full-game-test-cases-2026-05-16.md`](full-game-test-cases-2026-05-16.md)  
测试结论：通过。测试中发现 1 个阻断级 UI 接线问题，已修复并完成回归；当前无开放 P0/P1 问题。

## 测试范围

- 开局配置：区域、投资人、剧本、难度、新局进入。
- 主经营循环：订货、在途、日结、月结、存档/读档。
- 全模块导航：首页、销售运营、利润中心、组织人事、市场诊断、衍生中心。
- 经营系统：库存、营销、客户、机会池、CRM、审批、事件、人事、设施、财务、返利、汇票、市场、CSI、二手车、售后、衍生策略。
- 存档协议：旧档 normalize、自动/手动存档入口。
- 构建与前端边界：生产构建、懒加载 chunk、入口 chunk 大小、本地页面服务。
- 浏览器体验：桌面视口、移动视口、控制台异常、关键弹窗。

## 执行结果

| 验证项 | 命令或方式 | 结果 |
| --- | --- | --- |
| ESLint | `npm run lint` | 通过 |
| 经营逻辑 smoke | `npm test` | 通过，16 项 smoke 全绿 |
| 生产构建 | `npm run build` | 通过，入口 chunk 362.93KB，小于 500KB 阈值 |
| UI smoke | `npm run test:ui` | 通过，页面资源和懒加载 chunk 检查通过 |
| 浏览器 full UI playtest | `node scripts/full-ui-playtest.mjs` | 通过，覆盖开局、全 tab、订货、存档、读档、日结/月结、移动端 |

说明：`npm run test:ui` 和浏览器 full UI playtest 需要访问本机端口，首次在沙箱内被本机网络权限拦截后，已按权限流程在沙箱外重跑并通过。

## 测试中发现并修复的问题

| 编号 | 严重级别 | 问题 | 复现步骤 | 修复结果 |
| --- | --- | --- | --- | --- |
| BUG-20260516-01 | P1 | 点击“漏斗营销”后页面白屏，控制台报 `Cannot read properties of undefined (reading 'activeActivities')` | 新开局后进入“销售运营” -> “漏斗营销” | 已在 `src/App.jsx` 的 `PlayingGameShell` state context 中补传 `marketing`，回归通过 |

## 用例覆盖状态

| 用例 | 覆盖方式 | 结果 |
| --- | --- | --- |
| FT-01 开局设置 | 浏览器 full UI playtest | 通过 |
| FT-02 导航与懒加载 | 浏览器 full UI playtest、`npm run test:ui` | 通过 |
| FT-03 厂家订货 | 浏览器 full UI playtest、`npm test` | 通过 |
| FT-04 到货与库存 | 浏览器日结推进、库存 smoke | 通过 |
| FT-05 展厅经营 | 库存操作 smoke、tab 走查 | 通过 |
| FT-06 营销漏斗 | 浏览器回归、营销页白屏修复 | 通过 |
| FT-07 客户谈判 | 客户成交 smoke、tab 走查 | 通过 |
| FT-08 机会池与 CRM | 机会池/客户生命周期 smoke、tab 走查 | 通过 |
| FT-09 审批中心 | 看板入口走查、相关处理 smoke | 通过 |
| FT-10 经营事件 | 事件生成/处理/逾期 smoke、tab 走查 | 通过 |
| FT-11 员工管理 | 人事操作 smoke、tab 走查 | 通过 |
| FT-12 设施与门店 | 门店视图 smoke、tab 走查 | 通过 |
| FT-13 财务与 GM 办公室 | 财务快照 smoke、tab 走查 | 通过 |
| FT-14 返利与月结 | 浏览器推进到 M2、月结/返利入口走查 | 通过 |
| FT-15 汇票与融资 | 订货三种支付路径 smoke、tab 走查 | 通过 |
| FT-16 市场与竞品 | 竞品反制 smoke、市场页走查 | 通过 |
| FT-17 CSI 与售后 | CSI/售后入口走查、相关 smoke | 通过 |
| FT-18 衍生业务与二手车 | 二手车操作 smoke、衍生页走查 | 通过 |
| FT-19 存档系统 | 旧档 normalize smoke、手动保存/读档弹窗走查 | 通过 |
| FT-20 结局与重开 | 结局判定 smoke、重开入口存在性走查 | 通过 |
| FT-21 响应式与首包 | build、UI smoke、移动端截图 | 通过 |

## 浏览器证据

测试产物目录：`docs/test-artifacts/full-test-2026-05-16/`

- `01-setup.png`：开局配置页。
- `02-dashboard.png`：新局经营看板。
- `03-after-tab-sweep.png`：全模块 tab 走查后状态。
- `04-order-created.png`：订货完成后在途订单状态。
- `05-load-modal.png`：手动存档后读档弹窗。
- `06-month-end.png`：日结推进至 M2/月结后状态。
- `07-mobile-dashboard.png`：移动端视口布局。
- `full-ui-playtest-result.json`：浏览器走查结果，`findings: []`、`events: []`。

## 风险与建议

- 当前没有开放的阻断玩法问题。
- 建议把 `scripts/full-ui-playtest.mjs` 作为后续大版本发布前的人工触发回归脚本；它能覆盖 `test:ui` 没覆盖到的真实点击和懒加载运行时异常。
- 后续新增 tab 或懒加载页面时，应同步更新 `docs/full-game-test-cases-2026-05-16.md` 或创建新版本测试用例，避免新增入口只通过构建、不通过真实浏览器点击。
