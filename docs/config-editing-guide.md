# 配置修改操作指南

这份文档用于后续调整游戏数值、文案和内容配置。当前配置已经从 `src/App.jsx` 中拆到 `src/game/config/`，多数平衡性修改不再需要翻大文件。

## 修改前流程

1. 先确认要改的是“配置”还是“逻辑”。
   - 只改数值、文案、列表项、权重，优先改 `src/game/config/`。
   - 改计算公式、成交判定、日结/月结、存档迁移，属于逻辑修改，通常在 `src/App.jsx` 或 `src/game/engine/`。
2. 每次只改一类配置，方便回滚和验证。
3. 改完至少运行：

```bash
npm run lint
npm run build
```

4. 如果改了会影响开局、订车、成交、月结或读档，建议本地新开一局快速烟测。

## 配置文件索引

### `src/game/config/vehicles.js`

管理车型和初始市场价。

常改字段：

- `name`：车型名称
- `segment`：车型客群分段
- `msrp`：厂家指导价
- `baseCost`：提车成本
- `rebate`：基础返利
- `INITIAL_MARKET_PRICES`：开局同城市场价

注意：

- `id` 不建议改，旧存档、库存、成交记录会引用车型 `id`。
- 新增车型时，需要同步补 `INITIAL_MARKET_PRICES[车型id]`。
- `baseCost`、`msrp`、`rebate` 会直接影响 GP1、GP2、GP3、返利和成交价格空间。

### `src/game/config/market.js`

管理市场环境、区域、市场规模、竞品事件和竞品策略。

常改字段：

- `DEALER_REGIONS`：开局区域
- `MARKET_SIZE_OPTIONS`：市场规模和竞品数量
- `SEASON_MARKET_FACTORS`：季节需求
- `COMPETITOR_EVENTS`：竞品事件
- `SUPPLY_CHAIN_EVENTS`：供应链事件
- `COMPETITOR_BRANDS`：竞品品牌池
- `COMPETITOR_STRATEGIES`：竞品策略标签

注意：

- `DEALER_REGIONS.marketSizeId` 必须能匹配 `MARKET_SIZE_OPTIONS.id`。
- `MARKET_SIZE_OPTIONS.counts` 的 key 要保持为 `audiLocal`、`bmw`、`benz`、`ev`。
- `pricePressure`、`demand`、`leadCost` 会显著影响难度。

### `src/game/config/investors.js`

管理投资人类型和月底评分权重。

常改字段：

- `name`：投资人名称
- `desc`：说明文案
- `weights`：月底评分权重
- `riskTolerance`：风险容忍度
- `budgetStyle`：预算风格

注意：

- `weights` 建议合计为 `1.00`。界面会显示为 100%。
- 权重 key 保持为 `profit`、`cash`、`sales`、`csi`、`inventory`、`staff`。
- 改评分体验时，先改权重；如果还不够，再改评分逻辑。

### `src/game/config/scenarios.js`

管理难度模式、剧本目标和新手引导。

常改字段：

- `DIFFICULTY_MODES`：新手、标准、硬核等难度
- `GAME_SCENARIOS`：自由模式、6个月、12个月等剧本
- `TUTORIAL_STEPS`：新手引导步骤

注意：

- 自由模式 `months` 应保持为 `0`。
- 剧本 `id` 不建议改，存档和结局系统会引用。
- `TUTORIAL_STEPS.done` 是函数，改这里需要懂一点代码，不是纯文案配置。

### `src/game/config/staff.js` / `src/game/config/staffTraits.js`

管理员工昵称、岗位、头像配色、成长等级和员工画像标签。

常改字段：

- `NICKNAME_POOL`：员工昵称池
- `STAFF_ROLE_META`：岗位名称、图标、日薪
- `CAREER_LEVELS`：等级、经验门槛、能力加成
- `STAFF_TRAITS`：员工画像标签及其效果，定义在 `staffTraits.js`

注意：

- `STAFF_ROLE_META` 的 key 保持为 `dcc`、`sales`、`service`、`streamer`、`tech`。
- 标签至少包含 `id`、`label`、`tone`、`desc`；`id` 不建议改，员工存档会保存 `traits`，旧档也可能保存 `traitId`。
- 日薪会影响每日固定成本和利润体检。

### `src/game/config/marketing.js`

管理线索渠道、客户画像和营销活动。

常改字段：

- `LEAD_CHANNELS`：展厅、采买、直播、车展等渠道
- `CUSTOMER_ARCHETYPES`：客户类型
- `CUSTOMER_NAMES`：客户姓名池
- `MARKETING_ACTIVITIES`：营销活动

注意：

- `LEAD_CHANNELS.id` 不建议改，营销状态会按渠道 id 记录线索。
- `MARKETING_ACTIVITIES.effect` 会被日结逻辑识别，新增效果类型需要同步写逻辑。
- `CUSTOMER_ARCHETYPES.priceFocus` 会影响议价强度，调太低会让高价成交变容易。

### `src/game/config/events.js`

管理客诉和外部谈判。

常改字段：

- `SALES_COMPLAINTS`：销售客诉
- `AFTERSALES_COMPLAINTS`：售后客诉
- `NEGOTIATION_TEMPLATES`：厂家、银行、投资人等谈判模板

注意：

- 谈判模板 key 如 `bank_credit`、`investor_cash` 不建议改。
- 谈判 `options.id` 会被处理逻辑识别，新增选项要确认逻辑是否覆盖。
- `successRate` 建议控制在 `0.08` 到 `0.92` 之间，避免体验过于极端。

### `src/game/config/achievements.js`

管理成就和反馈默认值。

常改字段：

- `ACHIEVEMENTS`：成就定义
- `DEFAULT_FEEDBACK`：反馈系统默认结构

注意：

- 成就 `id` 不建议改，已解锁成就会用 id 存档。
- `check` 是函数，新增复杂成就需要确认传入上下文里是否有对应字段。
- `DEFAULT_FEEDBACK` 属于存档兼容结构，非必要不要删字段。

### `src/game/config/glossary.js`

管理专有名词提示。

常改字段：

- `TERM_HELP`：术语解释文本

注意：

- key 要和页面里的 `<Term term="...">` 一致。
- 可以只改解释文案，不影响存档。

## 逻辑文件索引

这些文件不是纯配置，修改时要更谨慎。

### `src/game/engine/`

当前用于放纯计算逻辑。

- `marketMetrics.js`：市场份额标准化
- `leads.js`：线索渠道汇总和旧存档兼容
- `feedback.js`：评分展示、反馈归一化、亏损归因

适合放入这里的逻辑：

- 输入明确、输出明确
- 不直接调用 React state setter
- 不直接读写浏览器存储
- 不依赖 JSX

### `src/game/state/initialState.js`

集中管理初始状态。

适合修改：

- 开局现金
- 默认授信
- 默认 CSI
- 初始月度统计结构
- 开局日志和收件箱

注意：

- 改字段名可能影响旧存档。
- 新增状态字段后，要检查读档迁移逻辑是否需要默认值。

### `src/services/`

预留给未来 Steam/后端/AI/排行榜能力。

当前主要是接口骨架，不直接影响游戏玩法。

- `auth/`：登录与身份
- `save/`：存档服务
- `telemetry/`：日志和埋点
- `ai/`：AI 顾问
- `leaderboard/`：排行榜
- `platform/`：平台能力适配

## 常见修改案例

### 调整投资人评分权重

1. 打开 `src/game/config/investors.js`。
2. 修改目标投资人的 `weights`。
3. 确保权重合计为 `1.00`。
4. 运行 `npm run lint && npm run build`。
5. 新开局检查投资人卡片是否显示“合计 100%”。

### 新增一个剧本

1. 打开 `src/game/config/scenarios.js`。
2. 在 `GAME_SCENARIOS` 里新增一项。
3. 给唯一 `id`，不要和已有剧本重复。
4. 设置 `months`、`goal`、目标字段。
5. 如果需要特殊胜利条件，可能还要改结局判定逻辑。

### 调整某车型利润空间

1. 打开 `src/game/config/vehicles.js`。
2. 调整 `msrp`、`baseCost`、`rebate`。
3. 同步检查 `INITIAL_MARKET_PRICES`。
4. 本地新开局，订车并成交一台，检查利润表 GP1/GP2/GP3 是否合理。

### 增加专有名词提示

1. 打开 `src/game/config/glossary.js`。
2. 在 `TERM_HELP` 添加解释。
3. 页面中使用 `<Term term="术语">显示文本</Term>`。
4. 浏览器悬停或点击查看提示是否显示。

## 存档兼容原则

尽量不要改这些内容：

- 已存在配置项的 `id`
- 状态对象的字段名
- 存档里已经保存的数组结构

如果必须改：

1. 给旧字段做回退。
2. 在读档逻辑里补默认值。
3. 用旧存档测试一次读取。
4. 记录变更原因。

## 验证清单

配置修改后按影响范围选择验证：

- 通用：`npm run lint`
- 通用：`npm run build`
- 开局配置：新开局能进入游戏
- 车型/价格：能订车、到货、成交
- 投资人/评分：能跑到月底并出现月评
- 存档字段：能存档、读档、继续推进一天
- 财务字段：利润表、现金流量表、资产负债表能切换
- 术语：页面对应名词有提示

## 后续升级方向

如果希望以后完全不用改代码，可以继续做三步：

1. 把配置从 JS 迁到 JSON/YAML。
2. 增加配置版本号和校验脚本。
3. 做一个内部配置编辑器，支持导入、导出、校验和热加载。

商业化版本建议采用“默认本地配置 + 远端热更新配置 + 存档记录配置版本”的方式，方便后续平衡性更新，同时保护旧存档。
