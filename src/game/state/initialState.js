import { EMPTY_LEAD_CHANNELS } from '../config/marketing.js';
import { createInitialManufacturerInteraction } from '../engine/manufacturerNegotiation.js';
import { createMonthlyPurchaseTarget } from '../engine/manufacturerPurchaseTargets.js';
import { normalizeManufacturerRoles } from '../engine/manufacturerRoles.js';
import { createInitialStoryState } from '../engine/storyEventEngine.js';

export const createInitialInvestorRelations = () => ({
  trust: 72,
  badReviews: 0,
  lastScore: null,
  lastGrade: '未评价',
  lastComment: '尚未进入月度经营评价。',
  budgetStatus: '正常授权',
  orderRestrictionUntil: 0,
  cashInjected: 0,
});

export const createInitialFinance = () => ({
  cash: 3000000,
  loan: 0,
  creditLimit: 10000000,
  interestRate: 0.0002,
});

export const createInitialDrafts = () => ({
  activeDrafts: [],
  totalDraftAmount: 0,
  totalBankFeePaid: 0,
  totalDraftsPaid: 0,
  totalDraftsDefaulted: 0,
  creditLimit: 5000000,
  creditUsed: 0,
  bankReputation: 70,
  consecutivePaid: 0,
});

export const createInitialGmWealth = () => ({
  personalAccount: 50000,
  monthlySalary: 25000,
  totalEarned: 50000,
  totalDividend: 0,
  totalBailout: 0,
  outstandingBailout: 0,
  yearlyNetProfit: 0,
  investorScoreHistory: [],
  dividendRate: 0.08,
  personalAssets: [],
  salaryHistory: [],
  bailoutHistory: [],
  morale: 80,
});

export const createInitialVirtualSales = () => ({
  virtualCars: [],
  totalVirtualCount: 0,
  caughtCount: 0,
  suspicionLevel: 0,
  rebateEarnedFromVirtual: 0,
  penaltyPaid: 0,
  monthlyTarget: 15,
  monthlyActual: 0,
  monthlyVirtual: 0,
});

export const createInitialStrategy = () => ({ accessories: 'OEM', warranty: 'OEM' });

export const createInitialOrderForm = () => ({ isOpen: false, model: null, quantity: 1, color: '黑', paymentMethod: 'draft3' });

export const createInitialModalConfig = () => ({ isOpen: false, title: '', message: '', onConfirm: null });

export const createInitialMarketEnvironment = () => ({
  seasonName: '平季',
  seasonIndex: 1.0,
  seasonDesc: '市场需求平稳，客流和价格无明显扰动。',
  competitorEvent: { name: '暂无重大竞品动作', desc: '竞品维持常规销售节奏。', affectedSegments: [], priceDrift: 0, demandImpact: 0 },
  supplyChain: { name: '供应稳定', desc: '物流与厂家排产正常。', priceDrift: 0, delayDays: 0 },
  history: [{ month: 1, desc: '市场平稳开局' }],
});

export const createInitialManufacturerPolicy = () => ({
  rebateMultiplier: 1.0,
  msrpTrend: 0,
  policyMonth: 1,
  lastChange: '初始标准政策',
  history: [{ month: 1, desc: '标准商务政策生效', rebate: 1.0, msrpTrend: 0 }],
  purchaseTarget: createMonthlyPurchaseTarget({ month: 1, salesTarget: 15, activeDifficulty: 'standard' }),
  commitments: { active: [], history: [] },
  roles: normalizeManufacturerRoles(),
  interaction: createInitialManufacturerInteraction(),
});

export const createInitialMarketing = () => ({
  budget: 2000,
  leadPurchaseBudget: 2000,
  livestreamBudget: 0,
  leads: 0,
  leadChannels: { ...EMPTY_LEAD_CHANNELS },
  activeActivities: [],
});

export const createInitialUsedCarShowroom = () => ({ built: false, level: 0, capacity: 0 });

export const createInitialCsi = () => ({ score: 90, complaints: 0, monthScore: 0 });

export const createInitialInsuranceRenewals = () => ({ pending: 0, renewed: 0, revenue: 0 });

export const createInitialCustomerLifecycle = () => ({ records: [], followUps: [] });

export const createInitialSalesOpportunities = () => ({ active: [], history: [] });

export const createInitialOperatingEvents = () => ({ pending: [], resolved: [] });

export { createInitialStoryState };

export const createInitialStaffStoryMemory = () => ({});

export const createInitialMonthlyStats = () => ({
  target: 15,
  sales: 0,
  purchaseUnits: 0,
  leads: 0,
  walkIns: 0,
  dccWalkIns: 0,
  naturalWalkIns: 0,
  baseRebatesPool: 0,
  lastMonthPayout: 0,
  lastMonthAchieve: 0,
  lastMonthRevenue: 0,
  revenue: 0,
  cogs: 0,
  derivativeRevenue: 0,
  derivativeCost: 0,
  rent: 0,
  depreciation: 0,
  labor: 0,
  financeCost: 0,
  marketingCost: 0,
  storageCost: 0,
  manufacturerSupportIncome: 0,
  realRevenue: 0,
  realCogs: 0,
  realRebate: 0,
  virtualRevenue: 0,
  virtualCogs: 0,
  virtualRebate: 0,
  draftBankFee: 0,
  draftPenalty: 0,
  floatingCost: 0,
  manufacturerPenalty: 0,
  lastMonthProcessPassed: false,
  activitySpend: 0,
  recoveredLeads: 0,
  afterSalesRevenue: 0,
  afterSalesCost: 0,
  afterSalesReturnVisits: 0,
  financeCommission: 0,
  tradeInCount: 0,
  tradeInSubsidy: 0,
  insuranceRenewalRevenue: 0,
  referralLeads: 0,
  csiScore: 90,
  usedCarRevenue: 0,
  usedCarCost: 0,
  usedCarPrepCost: 0,
  lastInvestorScore: null,
  lastInvestorGrade: '未评价',
  lastInvestorComment: '尚未进入投资人月度评价。',
});

export const createInitialFacility = () => ({ showroomSpots: 5, warehouseCapacity: 25, level: 1 });

export const createInitialDailyStats = () => ({ newLeads: 0, walkIns: 0, sales: 0 });

export const createOpeningLogs = () => [
  { day: 1, type: 'info', message: '欢迎接手这家奥迪4S店！请注意：前端卖车经常是亏钱的，必须配合"衍生业务"赚取毛利，并靠融资熬到月底拿返利！' },
];

export const createOpeningInbox = () => [
  { id: 'inbox_opening_policy', day: 1, from: '厂家商务部', title: '首月商务政策已生效', body: '首月执行标准商务政策：返利系数×1.00，指导价无调整。月底将根据销量达成率、过程指标和CSI重新核算返利。' },
  { id: 'inbox_bank_credit', day: 1, from: '合作银行', title: '库存融资授信已开通', body: '当前库存融资授信额度为¥10,000,000。卖车回款将优先归还库存融资，月底根据经营数据重新评估额度。' },
  { id: 'inbox_market_report', day: 1, from: '市场情报组', title: '市场环境简报', body: '当前市场处于平季，需求平稳，供应链正常。请关注同城均价、库存库龄和展厅车型多样性。' },
];
