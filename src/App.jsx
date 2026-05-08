import React, { useState, useEffect, useRef } from 'react';

// --- 后端 API 调用（替代直连 Gemini） ---
const callAI = async (prompt) => {
  const delays = [1000, 2000, 4000];
  for (let i = 0; i < 3; i++) {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      return data.text || "AI 思考中出错了...";
    } catch (error) {
      if (i === 2) {
        console.error("AI API Error:", error);
        return "抱歉，AI 助手当前网络拥堵，请稍后再试。";
      }
      await new Promise(res => setTimeout(res, delays[i]));
    }
  }
};

// --- 基础数据配置 (品牌授权车型) ---
const CAR_MODELS = [
  { id: 'A5_L', series: 'A5', trim: '低配', segment: '年轻', name: 'Audi A5 低配', baseCost: 330000, msrp: 380000, rebate: 30000, color: 'bg-red-100' },
  { id: 'A5_M', series: 'A5', trim: '中配', segment: '年轻', name: 'Audi A5 中配', baseCost: 370000, msrp: 420000, rebate: 35000, color: 'bg-red-200' },
  { id: 'A5_H', series: 'A5', trim: '高配', segment: '年轻', name: 'Audi A5 高配', baseCost: 420000, msrp: 480000, rebate: 40000, color: 'bg-red-300' },
  { id: 'A6_L', series: 'A6', trim: '低配', segment: '商务', name: 'Audi A6L 低配', baseCost: 350000, msrp: 427000, rebate: 45000, color: 'bg-slate-200' },
  { id: 'A6_M', series: 'A6', trim: '中配', segment: '商务', name: 'Audi A6L 中配', baseCost: 400000, msrp: 480000, rebate: 55000, color: 'bg-slate-300' },
  { id: 'A6_H', series: 'A6', trim: '高配', segment: '商务', name: 'Audi A6L 高配', baseCost: 550000, msrp: 650000, rebate: 70000, color: 'bg-slate-400' },
  { id: 'Q5_L', series: 'Q5', trim: '低配', segment: '家庭', name: 'Audi Q5L 低配', baseCost: 330000, msrp: 400000, rebate: 40000, color: 'bg-blue-100' },
  { id: 'Q5_M', series: 'Q5', trim: '中配', segment: '家庭', name: 'Audi Q5L 中配', baseCost: 370000, msrp: 450000, rebate: 50000, color: 'bg-blue-200' },
  { id: 'Q5_H', series: 'Q5', trim: '高配', segment: '家庭', name: 'Audi Q5L 高配', baseCost: 410000, msrp: 500000, rebate: 60000, color: 'bg-blue-300' },
];

// --- 员工昵称池 ---
const NICKNAME_POOL = {
  dcc: ['嘉琪', '思远', '晓婷', '宇轩', '子涵', '浩然', '梦瑶', '诗涵', '雨萱', '梓萱', '一诺', '欣怡', '可馨', '语桐', '若曦'],
  sales: ['大伟', '阿强', '志远', '明辉', '文博', '凯旋', '嘉铭', '国栋', '俊杰', '天翔', '浩宇', '泽远', '鹏飞', '振宇', '海涛'],
  tech: ['老张', '刘师傅', '赵工', '孙师', '周工', '吴技', '郑师', '王工', '李师', '陈师'],
};
let _nicknameUsed = { dcc: new Set(), sales: new Set(), tech: new Set() };
const pickNickname = (type) => {
  const pool = NICKNAME_POOL[type];
  const used = _nicknameUsed[type];
  const available = pool.filter(n => !used.has(n));
  if (available.length === 0) { _nicknameUsed[type] = new Set(); return pickNickname(type); }
  const name = available[Math.floor(Math.random() * available.length)];
  used.add(name);
  return name;
};

// --- 营销活动配置 ---
const MARKETING_ACTIVITIES = [
  {
    id: 'digital_ad',
    name: '线上投流',
    icon: '📱',
    cost: 2000,
    costType: 'daily',       // 每日持续支出
    duration: 0,             // 0=持续型
    effect: 'leads',         // 效果类型：增加线索
    description: '持续投放信息流广告获取线索，约¥50/个',
    color: 'from-blue-50 to-indigo-50 border-blue-200',
    btnColor: 'bg-blue-600 hover:bg-blue-500',
  },
  {
    id: 'gift_event',
    name: '到店礼活动',
    icon: '🎁',
    cost: 8000,
    costType: 'oneTime',
    duration: 3,             // 持续3天
    effect: 'dcc_walkin',    // 效果类型：DCC邀约到店率提升
    effectValue: 0.08,       // 额外+8%到店率
    description: '到店送精美伴手礼，DCC邀约到店率+8%，持续3天',
    color: 'from-amber-50 to-orange-50 border-amber-200',
    btnColor: 'bg-amber-600 hover:bg-amber-500',
  },
  {
    id: 'auto_show',
    name: '周末车展',
    icon: '🎪',
    cost: 25000,
    costType: 'oneTime',
    duration: 1,
    effect: 'natural_walkin', // 效果类型：自然客流爆发
    effectValue: 8,           // 额外+8批自然客流
    description: '举办品牌车展活动，当日自然客流+8批，转化率+5%',
    effect2: 'conversion',
    effect2Value: 0.05,
    color: 'from-red-50 to-pink-50 border-red-200',
    btnColor: 'bg-red-600 hover:bg-red-500',
  },
  {
    id: 'flash_sale',
    name: '限时促销',
    icon: '⚡',
    cost: 12000,
    costType: 'oneTime',
    duration: 2,
    effect: 'conversion',     // 效果类型：转化率提升
    effectValue: 0.10,        // 额外+10%转化率
    description: '限时特价+赠精品套餐，销售转化率+10%，持续2天',
    color: 'from-purple-50 to-fuchsia-50 border-purple-200',
    btnColor: 'bg-purple-600 hover:bg-purple-500',
  },
  {
    id: 'customer_care',
    name: '老客维系',
    icon: '🤝',
    cost: 5000,
    costType: 'oneTime',
    duration: 0,
    effect: 'recover',        // 效果类型：挽回战败线索
    effectValue: 15,          // 回收15条线索
    description: 'DCC回访战败客户，一次性回收15条线索进入跟进池',
    color: 'from-emerald-50 to-teal-50 border-emerald-200',
    btnColor: 'bg-emerald-600 hover:bg-emerald-500',
  },
];

const INITIAL_MARKET_PRICES = {};
CAR_MODELS.forEach(car => {
  INITIAL_MARKET_PRICES[car.id] = car.baseCost - (car.rebate * 0.5);
});

// --- 图标组件 ---
const Icons = {
  Bank: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
  Wallet: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
  Funnel: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>,
  Users: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  Store: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
  Sparkles: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>,
  Shield: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
};

export default function App() {
  const [gameState, setGameState] = useState('playing'); 
  const [day, setDay] = useState(1);
  const month = Math.floor((day - 1) / 30) + 1;
  const dayOfMonth = ((day - 1) % 30) + 1;

  const [finance, setFinance] = useState({
    cash: 3000000,          
    loan: 0,                
    creditLimit: 10000000,
    interestRate: 0.0002, 
  });

  const [strategy, setStrategy] = useState({ accessories: 'OEM', warranty: 'OEM' });
  const [orderForm, setOrderForm] = useState({ isOpen: false, model: null, quantity: 1, color: '黑', useLoan: false });

  const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const showAlert = (title, message) => setModalConfig({ isOpen: true, title, message, onConfirm: null });
  const showConfirm = (title, message, action) => {
    setModalConfig({ 
      isOpen: true, title, message, 
      onConfirm: () => { action(); setModalConfig(prev => ({ ...prev, isOpen: false })); } 
    });
  };
  const closeModal = () => setModalConfig(prev => ({ ...prev, isOpen: false }));

  const [marketPrices, setMarketPrices] = useState(INITIAL_MARKET_PRICES);

  // === 厂家商务政策动态系统 ===
  const [manufacturerPolicy, setManufacturerPolicy] = useState({
    rebateMultiplier: 1.0,       // 返利系数（1.0=标准）
    msrpTrend: 0,                // 指导价调整幅度（百分比，如2表示上浮2%）
    policyMonth: 1,              // 当前政策月份
    lastChange: '初始标准政策',    // 最近一次政策调整说明
    history: [{ month: 1, desc: '标准商务政策生效', rebate: 1.0, msrpTrend: 0 }],
  });
  // 动态指导价（基于CAR_MODELS + msrpTrend偏移）
  const getDynamicMsrp = (modelId) => {
    const model = CAR_MODELS.find(m => m.id === modelId);
    if (!model) return 0;
    return Math.round(model.msrp * (1 + manufacturerPolicy.msrpTrend / 100));
  };
  // 动态返利（基于CAR_MODELS + rebateMultiplier）
  const getDynamicRebate = (modelId) => {
    const model = CAR_MODELS.find(m => m.id === modelId);
    if (!model) return 0;
    return Math.round(model.rebate * manufacturerPolicy.rebateMultiplier);
  };
  const [marketing, setMarketing] = useState({
    budget: 2000,       // 线上投流日预算
    leads: 0,           // 待处理线索池
    activeActivities: [], // 进行中的活动 [{ id, activityId, name, icon, startDay, endDay, effect, effectValue, effect2, effect2Value }]
  });
  const [staff, setStaff] = useState(() => {
    const dccMembers = [
      { id: 'dcc_1', skill: 30, retained: false, nickname: pickNickname('dcc') },
      { id: 'dcc_2', skill: 30, retained: false, nickname: pickNickname('dcc') },
    ];
    const salesMembers = [
      { id: 'sales_1', skill: 30, retained: false, nickname: pickNickname('sales') },
      { id: 'sales_2', skill: 30, retained: false, nickname: pickNickname('sales') },
      { id: 'sales_3', skill: 30, retained: false, nickname: pickNickname('sales') },
    ];
    return {
      dcc: { members: dccMembers, salary: 150 },
      sales: { members: salesMembers, salary: 250 },
    };
  });

  // === 售后服务状态 ===
  const [afterSales, setAfterSales] = useState({
    technicians: [
      { id: 'tech_1', skill: 30, retained: false, nickname: pickNickname('tech') },
      { id: 'tech_2', skill: 30, retained: false, nickname: pickNickname('tech') },
    ],
    salary: 200,
  });
  const techCount = afterSales.technicians.length;
  const techAvgSkill = techCount > 0 ? Math.round(afterSales.technicians.reduce((s, m) => s + m.skill, 0) / techCount) : 0;

  // === 二手车展厅 ===
  const [usedCarShowroom, setUsedCarShowroom] = useState({ built: false, level: 0, capacity: 0 });

  // === 二手车库存 ===
  const [usedCars, setUsedCars] = useState([]);

  // === 试驾车 ===
  const [testDriveCars, setTestDriveCars] = useState([]);

  // === CSI满意度 ===
  const [csi, setCsi] = useState({ score: 90, complaints: 0, monthScore: 0 });

  // === 续保业务 ===
  const [insuranceRenewals, setInsuranceRenewals] = useState({ pending: 0, renewed: 0, revenue: 0 });

  // === 已售车辆跟踪(用于售后/续保) ===
  const [soldVehicles, setSoldVehicles] = useState([]);

  // 派生值：人数和平均能力
  const dccCount = staff.dcc.members.length;
  const salesCount = staff.sales.members.length;
  const dccAvgSkill = dccCount > 0 ? Math.round(staff.dcc.members.reduce((s, m) => s + m.skill, 0) / dccCount) : 0;
  const salesAvgSkill = salesCount > 0 ? Math.round(staff.sales.members.reduce((s, m) => s + m.skill, 0) / salesCount) : 0;

  const [monthlyStats, setMonthlyStats] = useState({
    target: 15, sales: 0, leads: 0, walkIns: 0, dccWalkIns: 0, naturalWalkIns: 0, baseRebatesPool: 0, lastMonthPayout: 0, lastMonthAchieve: 0, 
    lastMonthRevenue: 0, revenue: 0, cogs: 0, derivativeRevenue: 0, derivativeCost: 0,
    rent: 0, depreciation: 0, labor: 0, financeCost: 0, marketingCost: 0, storageCost: 0,
    lastMonthProcessPassed: false,   // 上月过程指标是否达标
    activitySpend: 0,               // 本月活动支出
    recoveredLeads: 0,              // 本月老客维系回收线索数
    afterSalesRevenue: 0, afterSalesCost: 0,    // 售后收入/成本
    financeCommission: 0,            // 金融按揭佣金
    tradeInCount: 0, tradeInSubsidy: 0,  // 置换台数/厂家置换补贴
    insuranceRenewalRevenue: 0,      // 续保佣金收入
    referralLeads: 0,               // 转介绍线索数
    csiScore: 90,                    // 当月CSI分数
  });

  const [facility, setFacility] = useState({ showroomSpots: 5, warehouseCapacity: 25, level: 1 });
  const [inventory, setInventory] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]); // 在途车辆 { id, modelId, color, quantity, arriveDay, modelName }
  const [dailyStats, setDailyStats] = useState({ newLeads: 0, walkIns: 0, sales: 0 });
  const [dailyLedger, setDailyLedger] = useState([]); // 每日财务流水 [{ day, items: [{ label, amount, type }] }]
  
  const [logs, setLogs] = useState([{ day: 1, type: 'info', message: '欢迎接手这家奥迪4S店！请注意：前端卖车经常是亏钱的，必须配合"衍生业务"赚取毛利，并靠融资熬到月底拿返利！' }]);
  
  const [isGeneratingAd, setIsGeneratingAd] = useState(false);
  const [aiAdCopy, setAiAdCopy] = useState('');
  const [isGeneratingAdvice, setIsGeneratingAdvice] = useState(false);
  const [aiAdvice, setAiAdvice] = useState('店总，您好！当您需要经营策略时，随时召唤我。');
  const [selectedLogDay, setSelectedLogDay] = useState(null);  // 点击日志查看详情

  const endOfLogsRef = useRef(null);
  useEffect(() => { 
    if (endOfLogsRef.current) {
      endOfLogsRef.current.scrollIntoView({ behavior: 'smooth' }); 
    }
  }, [logs]);

  const addLog = (type, message) => setLogs(prev => [...prev, { day, type, message }]);
  
  // 防崩溃金额格式化
  const formatMoney = (amount) => {
    if (isNaN(amount) || amount === null || amount === undefined) return '¥0';
    return `¥${Math.round(amount).toLocaleString()}`;
  };

  const handleNextDay = () => {
    if (gameState === 'bankrupt') return;

    let f = { ...finance };
    let m = { ...marketing };
    let currentLogs = [];
    let stats = { newLeads: 0, walkIns: 0, sales: 0 };
    let mStats = { ...monthlyStats }; 

    const rent = (facility.showroomSpots + facility.warehouseCapacity) * 100;
    const depreciation = facility.level * 800;
    // 留任津贴：被标记 retained 的员工工资翻倍
    const dccRetainedCount = staff.dcc.members.filter(m => m.retained).length;
    const salesRetainedCount = staff.sales.members.filter(m => m.retained).length;
    const retentionBonus = (dccRetainedCount * staff.dcc.salary) + (salesRetainedCount * staff.sales.salary);
    const techRetainedCount = afterSales.technicians.filter(m => m.retained).length;
    const salaries = (dccCount * staff.dcc.salary) + (salesCount * staff.sales.salary) + retentionBonus + (techCount * afterSales.salary) + (techRetainedCount * afterSales.salary);
    const interest = f.loan * f.interestRate;
    const warehouseCarCount = inventory.filter(c => c.location === 'warehouse').length;
    const storageCost = warehouseCarCount * 50;
    const dailyExpenses = rent + depreciation + salaries + m.budget + interest + storageCost;

    f.cash -= dailyExpenses;
    mStats.rent += rent;
    mStats.depreciation += depreciation;
    mStats.labor += salaries;
    mStats.financeCost += interest;
    mStats.marketingCost += m.budget;
    mStats.storageCost += storageCost;

    // === 记录当日财务流水 ===
    let todayLedger = [];
    todayLedger.push({ label: '土地租金', amount: -rent, type: 'expense' });
    todayLedger.push({ label: '折旧摊销', amount: -depreciation, type: 'expense' });
    todayLedger.push({ label: `人工薪酬(${dccCount + salesCount + techCount}人)`, amount: -salaries, type: 'expense' });
    if (m.budget > 0) todayLedger.push({ label: '营销投流', amount: -m.budget, type: 'expense' });
    if (interest > 0) todayLedger.push({ label: '金融利息', amount: -interest, type: 'expense' });
    if (storageCost > 0) todayLedger.push({ label: `仓储成本(${warehouseCarCount}台)`, amount: -storageCost, type: 'expense' });

    // === 人员流失风险判定 ===
    // 能力值越高，被竞店挖角概率越大；留任津贴可将风险大幅降低
    const calcTurnoverRisk = (skill, retained) => {
      let baseRisk = 0;
      if (skill >= 95) baseRisk = 0.06;       // 6%/天
      else if (skill >= 80) baseRisk = 0.04;   // 4%/天
      else if (skill >= 60) baseRisk = 0.02;   // 2%/天
      else baseRisk = 0.005;                    // 0.5%/天（低能力几乎不流失）
      if (retained) baseRisk *= 0.15;           // 留任津贴降低85%风险
      return baseRisk;
    };

    let lostMembers = [];
    const checkTurnover = (type) => {
      staff[type].members.forEach(member => {
        const risk = calcTurnoverRisk(member.skill, member.retained);
        if (Math.random() < risk) {
          lostMembers.push({ type, member });
        }
      });
    };
    checkTurnover('dcc');
    checkTurnover('sales');

    // 处理离职
    let updatedDccMembers = [...staff.dcc.members];
    let updatedSalesMembers = [...staff.sales.members];
    if (lostMembers.length > 0) {
      for (const { type, member } of lostMembers) {
        const roleName = type === 'dcc' ? 'DCC专员' : '销售顾问';
        currentLogs.push({ day: day + 1, type: 'warning', message: `🚪【人员流失】${roleName}【${member.nickname}】（能力值 ${member.skill}）被竞店高薪挖走！${member.skill >= 80 ? '核心骨干流失，团队实力受损。' : ''}${member.retained ? '尽管有留任津贴仍未能挽留。' : '如需留住高能力员工，请开启留任津贴。'}` });
        if (type === 'dcc') updatedDccMembers = updatedDccMembers.filter(m => m.id !== member.id);
        else updatedSalesMembers = updatedSalesMembers.filter(m => m.id !== member.id);
      }
    }

    if (f.cash < 0) { f.loan += Math.abs(f.cash); f.cash = 0; }
    if (f.loan > f.creditLimit) {
      setGameState('bankrupt');
      currentLogs.push({ day: day + 1, type: 'expense', message: `【破产警告】贷款超额 (超 ${formatMoney(f.creditLimit)})，资金链彻底断裂！` });
      setFinance(f); setLogs(prev => [...prev, ...currentLogs]);
      return;
    }

    const newLeads = Math.floor((m.budget / 50) * (0.7 + Math.random() * 0.6));
    m.leads += newLeads;
    stats.newLeads = newLeads;
    mStats.leads += newLeads; 

    // === 活动效果：结算进行中的活动 ===
    let activeDccWalkinBonus = 0;    // 到店礼额外到店率
    let activeNaturalBonus = 0;      // 车展额外自然客流
    let activeConvBonus = 0;         // 限时促销/车展额外转化率
    let activityLogMessages = [];

    const stillActive = m.activeActivities.filter(act => act.endDay > day + 1);
    const expired = m.activeActivities.filter(act => act.endDay <= day + 1 && act.endDay > day);

    for (const act of m.activeActivities) {
      if (act.endDay > day + 1) {
        // 活动仍在进行
        if (act.effect === 'dcc_walkin') activeDccWalkinBonus += act.effectValue;
        if (act.effect === 'natural_walkin') activeNaturalBonus += act.effectValue;
        if (act.effect === 'conversion') activeConvBonus += act.effectValue;
        if (act.effect2 === 'conversion') activeConvBonus += act.effect2Value;
      }
    }
    // 过期活动日志
    for (const act of expired) {
      activityLogMessages.push({ day: day + 1, type: 'info', message: `${act.icon}【${act.name}】活动已结束。` });
    }
    currentLogs.push(...activityLogMessages);
    m.activeActivities = stillActive;

    // === DCC 线索处理 ===
    const dccCapacity = dccCount * 100;
    const processedLeads = Math.min(m.leads, dccCapacity);
    const baseWalkInRate = 0.05 + (dccAvgSkill / 100) * 0.15;
    const walkInRate = baseWalkInRate + activeDccWalkinBonus;  // 到店礼加成
    const dccWalkIns = Math.floor(processedLeads * walkInRate);
    
    const showroomModelCount = new Set(inventory.filter(c => c.location === 'showroom').map(c => c.modelId)).size;
    const baseNaturalWalkIns = Math.floor(showroomModelCount * 0.8 + facility.level * 1.0 + Math.random() * 2);
    const naturalWalkIns = baseNaturalWalkIns + activeNaturalBonus;  // 车展加成
    
    const totalWalkIns = dccWalkIns + naturalWalkIns;

    m.leads -= processedLeads; 
    m.leads = Math.floor(m.leads * 0.85); 
    stats.walkIns = totalWalkIns;
    mStats.walkIns += totalWalkIns; 
    mStats.dccWalkIns += dccWalkIns;
    mStats.naturalWalkIns += naturalWalkIns;

    const customerSegments = ['年轻', '商务', '家庭'];
    let todayWalkInSegments = [];
    for(let i = 0; i < totalWalkIns; i++) {
      todayWalkInSegments.push(customerSegments[Math.floor(Math.random() * customerSegments.length)]);
    }

    const salesCapacity = salesCount * 5;
    const handledCustomers = todayWalkInSegments.sort(() => Math.random() - 0.5).slice(0, salesCapacity);
    
    let updatedInventory = [...inventory].map(car => ({ ...car, stockDays: (car.stockDays || 0) + 1 }));

    // === 在途车辆到货检查 ===
    const arrivingOrders = pendingOrders.filter(o => o.arriveDay <= day + 1);
    const remainingOrders = pendingOrders.filter(o => o.arriveDay > day + 1);
    if (arrivingOrders.length > 0) {
      for (const order of arrivingOrders) {
        const totalSlots = facility.showroomSpots + facility.warehouseCapacity;
        const availableSlots = totalSlots - updatedInventory.length;
        const canArrive = Math.min(order.quantity, availableSlots);
        if (canArrive > 0) {
          const newCars = Array.from({ length: canArrive }).map(() => ({
            id: Math.random().toString(36).slice(2, 11),
            modelId: order.modelId,
            price: CAR_MODELS.find(m => m.id === order.modelId)?.msrp || 0,
            color: order.color,
            subsidized: false,
            stockDays: 0,
            location: 'warehouse',
          }));
          updatedInventory = [...updatedInventory, ...newCars];
          currentLogs.push({ day: day + 1, type: 'success', message: `🚛【车辆到货】${order.modelName} ${canArrive} 台已运抵仓储区！${canArrive < order.quantity ? `因库位不足，${order.quantity - canArrive} 台无法入库，厂家暂缓发运。` : ''}` });
        } else {
          currentLogs.push({ day: day + 1, type: 'warning', message: `🚛【到货延迟】${order.modelName} ${order.quantity} 台已运抵，但库位已满无法入库！厂家暂缓发运，需腾出空位后联系厂家重新安排。` });
          remainingOrders.push({ ...order, arriveDay: day + 2 }); // 推迟一天再试
        }
      }
    }
    let revenue = 0, cogs = 0, rebates = 0, dailyDerivRev = 0, dailyDerivCost = 0;
    let soldCarsSummary = {};
    let dailyFinanceComm = 0;       // 今日金融佣金
    let dailyTradeInCount = 0;       // 今日置换台数
    let dailyTradeInSubsidy = 0;     // 今日置换补贴
    let newSoldVehicles = [];        // 今日售出车辆记录

    // 试驾车车型集合
    const testDriveModelIds = new Set(testDriveCars.map(t => t.modelId));

    for (const segment of handledCustomers) {
      if (updatedInventory.length === 0) break;
      const matchingCars = updatedInventory.filter(car => CAR_MODELS.find(cm => cm.id === car.modelId)?.segment === segment);
      if (matchingCars.length === 0) continue;

      const car = matchingCars[Math.floor(Math.random() * matchingCars.length)];
      const randomIdx = updatedInventory.findIndex(c => c.id === car.id);
      const modelDef = CAR_MODELS.find(cm => cm.id === car.modelId);
      const currentMarketPrice = marketPrices[modelDef.id];

      const baseConv = facility.level * 0.02;
      const skillConv = (salesAvgSkill / 100) * 0.20;
      const priceDiffRatio = (currentMarketPrice - car.price) / currentMarketPrice;
      const priceConv = priceDiffRatio * 5; 
      // CSI口碑影响转化率：高CSI→客户信任→易成交；低CSI→差评多→客户犹豫
      const csiConv = csi.score >= 95 ? 0.08 : csi.score >= 90 ? 0.04 : csi.score >= 85 ? -0.03 : -0.08;
      let finalConv = Math.max(0.01, Math.min(0.95, baseConv + skillConv + priceConv + csiConv + activeConvBonus));

      // 展厅展示加成
      if (car.location === 'showroom') {
        finalConv = Math.min(0.95, finalConv + 0.12);
      }
      // 试驾车加成：有试驾车的车型转化率+5%
      if (testDriveModelIds.has(modelDef.id)) {
        finalConv = Math.min(0.95, finalConv + 0.05);
      }
      // 置换客户加成：20%概率是置换客户，转化率额外+8%
      const isTradeIn = Math.random() < 0.20;
      if (isTradeIn) {
        finalConv = Math.min(0.95, finalConv + 0.08);
      }

      if (Math.random() < finalConv) {
        updatedInventory.splice(randomIdx, 1);
        const dynamicRebate = getDynamicRebate(modelDef.id);
        const dynamicMsrp = getDynamicMsrp(modelDef.id);
        revenue += car.price; cogs += modelDef.baseCost; rebates += dynamicRebate;
        stats.sales++; mStats.sales++;
        soldCarsSummary[`${modelDef.name}(${car.color || '黑'})`] = (soldCarsSummary[`${modelDef.name}(${car.color || '黑'})`] || 0) + 1;

        // === 金融按揭佣金 ===
        if (Math.random() < 0.70) {
          const isOemFinance = Math.random() < 0.60;
          const loanAmount = dynamicMsrp * 0.7;
          const commRate = isOemFinance ? 0.03 : 0.04;
          const financeComm = Math.round(loanAmount * commRate);
          const gpsFee = 2000;
          const serviceFee = Math.round(loanAmount * 0.01);
          dailyFinanceComm += financeComm + gpsFee + serviceFee;
        }

        // === 二手车置换 ===
        if (isTradeIn) {
          dailyTradeInCount++;
          const tradeInValue = 30000 + Math.floor(Math.random() * 120000);
          const purchasePrice = Math.round(tradeInValue * 0.85);
          const tradeInSubsidy = 5000;
          dailyTradeInSubsidy += tradeInSubsidy;
          rebates += tradeInSubsidy;
          const usedCarBrands = ['大众帕萨特', '本田雅阁', '丰田凯美瑞', '别克君威', '日产天籁', '福特蒙迪欧'];
          const brand = usedCarBrands[Math.floor(Math.random() * usedCarBrands.length)];
          newSoldVehicles.push({ type: 'usedCar', brand, purchasePrice, retailPrice: Math.round(purchasePrice * 1.2) });
        }

        // === 衍生业务 ===
        let carDerivRev = 0, carDerivCost = 0; const msrp = dynamicMsrp;
        if (Math.random() < 0.80) { carDerivRev += msrp * 0.02; carDerivCost += msrp * 0.02 * 0.75; }
        if (strategy.accessories === 'OEM') {
          if (Math.random() < 0.60) { carDerivRev += msrp * 0.015; carDerivCost += msrp * 0.010; }
        } else {
          if (Math.random() < 0.35) { carDerivRev += msrp * 0.012; carDerivCost += msrp * 0.003; }
        }
        if (strategy.warranty === 'OEM') {
          if (Math.random() < 0.25) { carDerivRev += msrp * 0.02; carDerivCost += msrp * 0.012; }
        } else {
          if (Math.random() < 0.10) { carDerivRev += msrp * 0.015; carDerivCost += msrp * 0.005; }
        }
        dailyDerivRev += carDerivRev; dailyDerivCost += carDerivCost;

        // 记录售出车辆（用于售后/续保追踪）
        newSoldVehicles.push({ type: 'newCar', modelId: modelDef.id, modelName: modelDef.name, soldDay: day + 1 });
      }
    }

    mStats.revenue += revenue; mStats.cogs += cogs;
    mStats.derivativeRevenue += dailyDerivRev; mStats.derivativeCost += dailyDerivCost;
    mStats.baseRebatesPool += rebates;
    mStats.financeCommission += dailyFinanceComm;
    mStats.tradeInCount += dailyTradeInCount;
    mStats.tradeInSubsidy += dailyTradeInSubsidy;

    // 更新二手车库存
    const newUsedCars = newSoldVehicles.filter(v => v.type === 'usedCar').map(v => ({
      id: `uc_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
      brand: v.brand, purchasePrice: v.purchasePrice, retailPrice: v.retailPrice, customRetailPrice: v.retailPrice, stockDays: 0, status: 'stock', prepped: false
    }));
    // 库龄贬值：超30天零售价自动降5%/30天；超90天强制批售
    const updatedUsedCars = [...usedCars.map(c => {
      let newDays = c.stockDays + 1;
      let newRetailPrice = c.customRetailPrice || c.retailPrice;
      // 库龄贬值：每满30天降5%
      if (newDays > 30) {
        const depPeriods = Math.floor(newDays / 30) - Math.floor(c.stockDays / 30);
        if (depPeriods > 0) {
          for (let i = 0; i < depPeriods; i++) newRetailPrice = Math.round(newRetailPrice * 0.95);
        }
      }
      return { ...c, stockDays: newDays, customRetailPrice: newRetailPrice };
    }), ...newUsedCars];
    // 超90天强制批售
    let forcedWholesaleRevenue = 0;
    const finalUsedCars = updatedUsedCars.map(c => {
      if (c.status === 'stock' && c.stockDays >= 90) {
        const wsPrice = Math.round(c.purchasePrice * 0.85);
        forcedWholesaleRevenue += wsPrice;
        f.cash += wsPrice;
        currentLogs.push({ day: day + 1, type: 'warning', message: `⚠️【强制批售】${c.brand} 库龄${c.stockDays}天超标，强制批售 ¥${wsPrice.toLocaleString()}（收车价¥${c.purchasePrice.toLocaleString()}，亏损¥${(c.purchasePrice - wsPrice).toLocaleString()}）` });
        return { ...c, status: 'forcedWholesale', forcedPrice: wsPrice };
      }
      return c;
    });
    if (forcedWholesaleRevenue > 0) {
      currentLogs.push({ day: day + 1, type: 'info', message: `♻️【库龄清仓】${finalUsedCars.filter(c => c.status === 'forcedWholesale' && c.stockDays >= 90).length}台二手车因库龄超标强制批售，回收 ¥${forcedWholesaleRevenue.toLocaleString()}。` });
    }

    // 更新已售车辆追踪
    const newSoldCarRecords = newSoldVehicles.filter(v => v.type === 'newCar').map(v => ({
      id: `sv_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
      modelId: v.modelId, modelName: v.modelName, soldDay: v.soldDay,
    }));
    const updatedSoldVehicles = [...soldVehicles, ...newSoldCarRecords];

    // === 售后维修保养 ===
    let dailyAsRevenue = 0, dailyAsCost = 0;
    const techCapacity = techCount * 3;
    let asOrdersHandled = 0;
    const asBaseCustomers = updatedSoldVehicles.length; // 已售车辆基数
    // 日常保养：约每台车每月1次 → 每天1/30概率
    for (const sv of updatedSoldVehicles) {
      if (asOrdersHandled >= techCapacity) break;
      if (Math.random() < 1/30) {
        const basePrice = 800 + Math.floor(Math.random() * 1200);
        const skillBonus = 1 + techAvgSkill / 100;
        const orderRevenue = Math.round(basePrice * skillBonus);
        const orderCost = Math.round(orderRevenue * 0.4);
        dailyAsRevenue += orderRevenue; dailyAsCost += orderCost;
        asOrdersHandled++;
      }
    }
    // 事故维修：2%/天概率
    if (asOrdersHandled < techCapacity && Math.random() < 0.02 * Math.min(asBaseCustomers, 50)) {
      const basePrice = 5000 + Math.floor(Math.random() * 25000);
      const skillBonus = 1 + techAvgSkill / 100;
      const orderRevenue = Math.round(basePrice * skillBonus);
      const orderCost = Math.round(orderRevenue * 0.5);
      dailyAsRevenue += orderRevenue; dailyAsCost += orderCost;
      asOrdersHandled++;
    }
    // 零件零售
    if (asOrdersHandled < techCapacity && Math.random() < 0.10) {
      const orderRevenue = 200 + Math.floor(Math.random() * 600);
      const orderCost = Math.round(orderRevenue * 0.3);
      dailyAsRevenue += orderRevenue; dailyAsCost += orderCost;
      asOrdersHandled++;
    }
    mStats.afterSalesRevenue += dailyAsRevenue; mStats.afterSalesCost += dailyAsCost;
    if (dailyAsRevenue > 0) {
      f.cash += dailyAsRevenue - dailyAsCost;
      todayLedger.push({ label: `售后维修收入(${asOrdersHandled}单)`, amount: dailyAsRevenue, type: 'income' });
      todayLedger.push({ label: '售后零件/工时成本', amount: -dailyAsCost, type: 'expense' });
    }

    // === 续保业务 ===
    let dailyInsRevenue = 0;
    const renewalEligible = updatedSoldVehicles.filter(v => (day + 1 - v.soldDay) >= 30);
    for (const sv of renewalEligible) {
      if (Math.random() < 0.30 / 30) { // 每天约1%概率触发
        const commission = 3000 + Math.floor(Math.random() * 2000);
        dailyInsRevenue += commission;
      }
    }
    if (dailyInsRevenue > 0) {
      f.cash += dailyInsRevenue;
      mStats.insuranceRenewalRevenue += dailyInsRevenue;
      todayLedger.push({ label: '续保佣金收入', amount: dailyInsRevenue, type: 'income' });
    }

    // === CSI满意度 ===
    let csiDelta = 0;
    let complaintMsg = '';
    if (Math.random() < 0.05) {
      const complaints = ['交车延迟', '精品安装问题', '服务态度差', '承诺未兑现', '价格不透明'];
      const complaint = complaints[Math.floor(Math.random() * complaints.length)];
      csiDelta = -(3 + Math.floor(Math.random() * 6));
      // 技师能力降低投诉率
      if (techAvgSkill >= 60) csiDelta = Math.round(csiDelta * 0.5);
      // 销售能力降低投诉率
      if (salesAvgSkill >= 60) csiDelta = Math.round(csiDelta * 0.7);
      complaintMsg = complaint;
    }
    // 无投诉时CSI缓慢回升
    if (csiDelta === 0 && csi.score < 95) csiDelta = 0.3;
    const newCsiScore = Math.max(50, Math.min(100, csi.score + csiDelta));
    if (csiDelta < -2) {
      currentLogs.push({ day: day + 1, type: 'warning', message: `😤【客户投诉】${complaintMsg}！CSI满意度下降 ${Math.abs(Math.round(csiDelta))} 分至 ${Math.round(newCsiScore)} 分。` });
    }
    // CSI高→转介绍线索
    let referralCount = 0;
    if (newCsiScore >= 95) {
      referralCount = 1 + Math.floor(Math.random() * 3);
      m.leads += referralCount;
      mStats.referralLeads += referralCount;
      currentLogs.push({ day: day + 1, type: 'success', message: `🌟【转介绍】CSI优秀(${Math.round(newCsiScore)}分)，老客户转介绍 ${referralCount} 条新线索！` });
    }

    // === 库龄分级仓储费 ===
    let tieredStorageCost = 0;
    updatedInventory.forEach(car => {
      const sd = car.stockDays || 0;
      if (sd >= 120) tieredStorageCost += 150;
      else if (sd >= 90) tieredStorageCost += 100;
      else if (sd >= 60) tieredStorageCost += 100;
      else tieredStorageCost += 50;
    });
    // 用tiered替换原来的storageCost差额
    const storageDiff = tieredStorageCost - storageCost;
    if (storageDiff !== 0) {
      f.cash -= storageDiff;
      mStats.storageCost += storageDiff;
    }

    // === 库龄≥120天强制批售 ===
    const forcedWholesale = updatedInventory.filter(c => (c.stockDays || 0) >= 120);
    if (forcedWholesale.length > 0) {
      let forcedRevenue = 0;
      for (const car of forcedWholesale) {
        const modelDef = CAR_MODELS.find(m => m.id === car.modelId);
        const forcedPrice = Math.round(modelDef.baseCost * 0.80);
        forcedRevenue += forcedPrice;
        const idx = updatedInventory.findIndex(c => c.id === car.id);
        if (idx !== -1) updatedInventory.splice(idx, 1);
      }
      f.cash += forcedRevenue;
      todayLedger.push({ label: `强制处置(库龄≥120天,${forcedWholesale.length}台)`, amount: forcedRevenue, type: 'income' });
      currentLogs.push({ day: day + 1, type: 'warning', message: `⚠️【强制处置】${forcedWholesale.length} 台库龄超120天的车辆按提车成本80%强制批售，回笼 ${formatMoney(forcedRevenue)}。` });
    }

    // 记录销售流水
    if (revenue > 0) todayLedger.push({ label: `卖车收入(${stats.sales}台)`, amount: revenue, type: 'income' });
    if (cogs > 0) todayLedger.push({ label: `卖车成本(${stats.sales}台)`, amount: -cogs, type: 'expense' });
    if (rebates > 0) todayLedger.push({ label: `返利入池(${stats.sales}台)`, amount: rebates, type: 'pending' });
    if (dailyDerivRev - dailyDerivCost > 0) todayLedger.push({ label: '衍生业务毛利', amount: dailyDerivRev - dailyDerivCost, type: 'income' });
    if (dailyFinanceComm > 0) todayLedger.push({ label: '金融按揭佣金', amount: dailyFinanceComm, type: 'income' });
    if (dailyTradeInCount > 0) currentLogs.push({ day: day + 1, type: 'info', message: `🔄【二手车置换】${dailyTradeInCount} 位客户置换旧车，厂家置换补贴 ¥${(dailyTradeInSubsidy).toLocaleString()} 入池。` });

    const netDailyIncome = revenue + dailyDerivRev - dailyDerivCost + dailyFinanceComm; // 售后和续保已在上面单独入账
    if (netDailyIncome > 0) {
      f.cash += netDailyIncome;
      if (f.loan > 0) { if (f.cash >= f.loan) { f.cash -= f.loan; f.loan = 0; } else { f.loan -= f.cash; f.cash = 0; } }
      let summaryStr = Object.entries(soldCarsSummary).map(([name, count]) => `${name} x${count}`).join(', ');
      currentLogs.push({ day: day + 1, type: 'success', message: `售出 ${stats.sales} 台车(${summaryStr})。收车款 ${formatMoney(revenue)}，赚取衍生毛利 ${formatMoney(dailyDerivRev - dailyDerivCost)}，入池返利 ${formatMoney(rebates)}。` });
    } else if (handledCustomers.length > 0) {
      currentLogs.push({ day: day + 1, type: 'warning', message: `销售顾问接待了 ${handledCustomers.length} 批客户，但因价格博弈或销售能力不足，未能促成任何交易。` });
    }

    if (totalWalkIns > salesCapacity) {
      currentLogs.push({ day: day + 1, type: 'expense', message: `⚠️ 进店总客流达 ${totalWalkIns} 批，但销售顾问仅有 ${salesCount} 人，最多只能接待 ${salesCapacity} 批。其余客户因无人接待而流失！请考虑招聘销售。` });
    }

    if (storageCost > 0) {
      currentLogs.push({ day: day + 1, type: 'expense', message: `📦 仓储费用: ${warehouseCarCount} 台车 × ¥50/天 = ${formatMoney(storageCost)}（含仓储保险/折旧/维护）` });
    }

    let newMarketPrices = { ...marketPrices };
    const currentMsrpTrend = manufacturerPolicy.msrpTrend;
    CAR_MODELS.forEach(model => {
      const dynamicMsrp = getDynamicMsrp(model.id);
      const myCars = updatedInventory.filter(c => c.modelId === model.id);
      // 每日微调：市场供需随机波动 ±0.3%
      const dailyFlux = (Math.random() - 0.48) * 0.006; // 轻微向上偏移
      newMarketPrices[model.id] *= (1 + dailyFlux);
      if (myCars.length > 0) {
        const myAvgPrice = myCars.reduce((sum, c) => sum + c.price, 0) / myCars.length;
        if (myAvgPrice < newMarketPrices[model.id]) newMarketPrices[model.id] -= (newMarketPrices[model.id] - myAvgPrice) * 0.1;
        else newMarketPrices[model.id] += (dynamicMsrp - newMarketPrices[model.id]) * 0.02;
      }
      // 指导价调整会带动市场价同步偏移
      newMarketPrices[model.id] += (dynamicMsrp - model.msrp) * 0.05;
      // 限制市场价在合理范围（提车成本的80%~指导价的110%）
      const floor = model.baseCost * 0.8;
      const ceil = dynamicMsrp * 1.1;
      newMarketPrices[model.id] = Math.max(floor, Math.min(ceil, newMarketPrices[model.id]));
    });

    if (dayOfMonth === 30) {
      const achieveRate = mStats.target > 0 ? mStats.sales / mStats.target : 0;
      let stepMultiplier = 0.5; 
      if (achieveRate >= 1.2) stepMultiplier = 1.2; else if (achieveRate >= 1.0) stepMultiplier = 1.0; else if (achieveRate >= 0.8) stepMultiplier = 0.8; 
      
      const inviteRate = mStats.leads > 0 ? mStats.walkIns / mStats.leads : 0;
      const convertRate = mStats.walkIns > 0 ? mStats.sales / mStats.walkIns : 0;
      
      let processScore = 0;
      if (inviteRate >= 0.1) processScore += 0.5; 
      if (convertRate >= 0.2) processScore += 0.5; 
      const processPassed = inviteRate >= 0.1 && convertRate >= 0.2;

      // === CSI返利系数 ===
      let csiMultiplier = 1.0;
      if (newCsiScore >= 95) csiMultiplier = 1.03;
      else if (newCsiScore >= 90) csiMultiplier = 1.0;
      else if (newCsiScore >= 85) csiMultiplier = 0.95;
      else csiMultiplier = 0.85;
      const csiWarning = csiMultiplier < 1.0 ? ` ⚠️ CSI仅${Math.round(newCsiScore)}分，返利打${csiMultiplier}折！` : csiMultiplier > 1.0 ? ` 🎉 CSI优秀${Math.round(newCsiScore)}分，返利+3%!` : '';

      const volumeRebatePool = mStats.baseRebatesPool * 0.8;
      const processRebatePool = mStats.baseRebatesPool * 0.2;

      const volumePayout = Math.floor(volumeRebatePool * stepMultiplier * csiMultiplier);
      const processPayout = Math.floor(processRebatePool * processScore * csiMultiplier);
      const finalPayout = volumePayout + processPayout;

      f.cash += finalPayout;
      todayLedger.push({ label: `月底返利兑付(达成${(achieveRate*100).toFixed(0)}%·CSI×${csiMultiplier})`, amount: finalPayout, type: 'income' });

      const newCreditLimit = Math.floor(8000000 + (facility.level * 2000000) + (mStats.revenue * 0.4) + (f.cash * 0.3));
      f.creditLimit = newCreditLimit;
      todayLedger.push({ label: `授信额度更新`, amount: newCreditLimit, type: 'pending' });
      const creditWarning = f.loan > newCreditLimit
        ? ` ⚠️ 银行抽贷预警：下月授信降至 ${formatMoney(newCreditLimit)}，负债已超额！`
        : ` 银行下月授信: ${formatMoney(newCreditLimit)}。`;
      currentLogs.push({ day: day + 1, type: f.loan > newCreditLimit ? 'warning' : 'success', message: `【月底结算】达成率 ${(achieveRate*100).toFixed(1)}%。返利兑付 ${formatMoney(finalPayout)}（销量${formatMoney(volumePayout)}+过程${formatMoney(processPayout)}·CSI×${csiMultiplier}）。${creditWarning}${csiWarning}` });

      mStats = {
        target: Math.max(10, Math.floor(mStats.sales * 1.1) + 2),
        sales: 0, leads: 0, walkIns: 0, dccWalkIns: 0, naturalWalkIns: 0, baseRebatesPool: 0, revenue: 0, cogs: 0, derivativeRevenue: 0, derivativeCost: 0, rent: 0, depreciation: 0, labor: 0, financeCost: 0, marketingCost: 0, storageCost: 0,
        lastMonthPayout: finalPayout, lastMonthAchieve: achieveRate, lastMonthRevenue: mStats.revenue, lastMonthProcessPassed: processPassed,
        activitySpend: 0, recoveredLeads: 0,
        afterSalesRevenue: 0, afterSalesCost: 0, financeCommission: 0, tradeInCount: 0, tradeInSubsidy: 0,
        insuranceRenewalRevenue: 0, referralLeads: 0, csiScore: Math.round(newCsiScore),
      };

      // === 厂家商务政策月度更新 ===
      const newPolicyMonth = manufacturerPolicy.policyMonth + 1;
      let newRebateMult = manufacturerPolicy.rebateMultiplier;
      let newMsrpTrend = manufacturerPolicy.msrpTrend;
      let policyDesc = '';

      // 基于上月达成率的政策调整
      if (achieveRate >= 1.2) {
        // 超额完成 → 厂家加大支持（返利+10~20%），指导价微升
        const rebateUp = 0.1 + Math.random() * 0.1;
        newRebateMult = Math.min(1.5, newRebateMult + rebateUp);
        newMsrpTrend = Math.min(5, newMsrpTrend + (Math.random() * 1.5));
        policyDesc = `超额达成${(achieveRate*100).toFixed(0)}%，厂家加大返利支持+${(rebateUp*100).toFixed(0)}%`;
      } else if (achieveRate >= 0.8) {
        // 基本达成 → 政策微调
        const rebateShift = (Math.random() - 0.5) * 0.1;
        newRebateMult = Math.max(0.7, Math.min(1.3, newRebateMult + rebateShift));
        newMsrpTrend += (Math.random() - 0.5) * 1.0;
        newMsrpTrend = Math.max(-3, Math.min(5, newMsrpTrend));
        policyDesc = `达成率${(achieveRate*100).toFixed(0)}%，厂家维持标准政策，微调返利${rebateShift >= 0 ? '+' : ''}${(rebateShift*100).toFixed(1)}%`;
      } else {
        // 未达标 → 厂家也可能加大返利（促销救市），但指导价承压
        const rescueRebate = 0.05 + Math.random() * 0.15;
        newRebateMult = Math.min(1.6, newRebateMult + rescueRebate);
        newMsrpTrend = Math.max(-5, newMsrpTrend - Math.random() * 2);
        policyDesc = `达成率仅${(achieveRate*100).toFixed(0)}%，厂家加大促销返利+${(rescueRebate*100).toFixed(0)}%，但指导价承压下调`;
      }

      // 随机政策事件（20%概率）
      if (Math.random() < 0.2) {
        const events = [
          { desc: '厂家年度冲量，全线返利临时+15%', rebate: 0.15, msrp: 0 },
          { desc: '竞品降价压力，厂家下调指导价2%', rebate: 0, msrp: -2 },
          { desc: '新车上市旧款清库，返利+20%', rebate: 0.2, msrp: -1 },
          { desc: '原材料涨价，厂家上调指导价1.5%', rebate: -0.05, msrp: 1.5 },
        ];
        const event = events[Math.floor(Math.random() * events.length)];
        newRebateMult = Math.max(0.5, Math.min(1.8, newRebateMult + event.rebate));
        newMsrpTrend = Math.max(-5, Math.min(8, newMsrpTrend + event.msrp));
        policyDesc += ` | 📢 ${event.desc}`;
      }

      // 更新库存中车辆的标价（根据新指导价调整，仅对未改过价格的车生效）
      updatedInventory = updatedInventory.map(car => {
        const modelDef = CAR_MODELS.find(m => m.id === car.modelId);
        if (modelDef && car.price === modelDef.msrp) {
          return { ...car, price: getDynamicMsrp(car.modelId) };
        }
        return car;
      });

      const newPolicy = {
        rebateMultiplier: newRebateMult,
        msrpTrend: newMsrpTrend,
        policyMonth: newPolicyMonth,
        lastChange: policyDesc,
        history: [...manufacturerPolicy.history, { month: newPolicyMonth, desc: policyDesc, rebate: newRebateMult, msrpTrend: newMsrpTrend }],
      };
      setManufacturerPolicy(newPolicy);
      currentLogs.push({ day: day + 1, type: 'info', message: `📋【商务政策更新】M${newPolicyMonth}月政策：返利系数 ×${newRebateMult.toFixed(2)}，指导价${newMsrpTrend >= 0 ? '上浮' : '下调'} ${Math.abs(newMsrpTrend).toFixed(1)}%。${policyDesc}` });
    }

    // === 胜利判定：经营满6个月(180天) ===
    if (day + 1 >= 180 && gameState !== 'bankrupt') {
      const totalAssets = f.cash + updatedInventory.reduce((sum, car) => {
        const modelDef = CAR_MODELS.find(m => m.id === car.modelId);
        return sum + (modelDef ? modelDef.baseCost * 0.9 : 0); // 库存按成本90%估值
      }, 0) + usedCars.filter(c => c.status === 'stock').reduce((sum, c) => sum + c.purchasePrice * (usedCarShowroom.built ? 0.9 : 0.8), 0); // 二手车按收车价估值(有展厅90%，无展厅80%)
      const netAssets = totalAssets - f.loan;
      const startAssets = 3000000; // 初始资金
      if (netAssets >= startAssets * 2) {
        // 净资产翻倍 → 完胜
        setGameState('won');
        currentLogs.push({ day: day + 1, type: 'success', message: `🏆【经营完胜】半年经营结束！总资产 ${formatMoney(totalAssets)} - 负债 ${formatMoney(f.loan)} = 净资产 ${formatMoney(netAssets)}，较初始资金翻倍！您是卓越的4S店总经理！` });
      } else if (netAssets >= startAssets) {
        // 净资产正增长 → 合格
        setGameState('won');
        currentLogs.push({ day: day + 1, type: 'success', message: `🎓【经营合格】半年经营结束！净资产 ${formatMoney(netAssets)}，守住了基本盘。经营稳健，但还有进步空间！` });
      }
    }

    setFinance(f); setMarketing(m); setMonthlyStats(mStats); setInventory(updatedInventory);
    setMarketPrices(newMarketPrices); setDailyStats(stats); setLogs(prev => [...prev, ...currentLogs]); setDay(day + 1);
    setPendingOrders(remainingOrders);
    setDailyLedger(prev => [...prev, { day: day + 1, items: todayLedger }]);
    // 更新员工状态（处理离职）
    setStaff(s => ({
      dcc: { ...s.dcc, members: updatedDccMembers },
      sales: { ...s.sales, members: updatedSalesMembers },
    }));
    // 更新新状态
    setUsedCars(finalUsedCars);
    setSoldVehicles(updatedSoldVehicles);
    setCsi(prev => ({ ...prev, score: newCsiScore, complaints: prev.complaints + (csiDelta < -2 ? 1 : 0) }));
    setInsuranceRenewals(prev => ({
      pending: renewalEligible.length,
      renewed: prev.renewed + (dailyInsRevenue > 0 ? 1 : 0),
      revenue: prev.revenue + dailyInsRevenue,
    }));

    // 自动存档（每天结束时，存到自动存档槽——直接用本轮计算的新值）
    try {
      const newGameState = (day + 1 >= 180 && gameState !== 'bankrupt') ?
        ((f.cash + updatedInventory.reduce((sum, car) => sum + (CAR_MODELS.find(cm => cm.id === car.modelId)?.baseCost || 0) * 0.9, 0) + finalUsedCars.filter(c => c.status === 'stock').reduce((sum, c) => sum + c.purchasePrice * (usedCarShowroom.built ? 0.9 : 0.8), 0) - f.loan) >= 3000000 * 2 ? 'won' :
        ((f.cash + updatedInventory.reduce((sum, car) => sum + (CAR_MODELS.find(cm => cm.id === car.modelId)?.baseCost || 0) * 0.9, 0) + finalUsedCars.filter(c => c.status === 'stock').reduce((sum, c) => sum + c.purchasePrice * (usedCarShowroom.built ? 0.9 : 0.8), 0) - f.loan) >= 3000000 ? 'won' : gameState)) : (f.loan > f.creditLimit ? 'bankrupt' : gameState);
      const newCsiObj = { ...csi, score: newCsiScore, complaints: csi.complaints + (csiDelta < -2 ? 1 : 0) };
      const newInsRenewals = { pending: renewalEligible.length, renewed: insuranceRenewals.renewed + (dailyInsRevenue > 0 ? 1 : 0), revenue: insuranceRenewals.revenue + dailyInsRevenue };
      const newStaffObj = { ...staff, dcc: { ...staff.dcc, members: updatedDccMembers }, sales: { ...staff.sales, members: updatedSalesMembers } };
      const autoSaveData = {
        version: 1,
        savedAt: new Date().toLocaleString('zh-CN') + ' (自动)',
        slotName: '自动存档',
        gameState: newGameState,
        day: day + 1,
        finance: f, strategy, marketPrices: newMarketPrices, manufacturerPolicy,
        marketing: m, staff: newStaffObj, afterSales, usedCarShowroom, usedCars: finalUsedCars, testDriveCars, csi: newCsiObj,
        insuranceRenewals: newInsRenewals, soldVehicles: updatedSoldVehicles, monthlyStats: mStats, facility,
        inventory: updatedInventory, pendingOrders: remainingOrders,
        dailyStats: stats, dailyLedger: [...dailyLedger, { day: day + 1, items: todayLedger }],
        logs: [...logs, ...currentLogs],
      };
      const allSlots = getSaveSlots();
      allSlots.slots['auto'] = autoSaveData;
      localStorage.setItem(SAVE_SLOTS_KEY, JSON.stringify(allSlots));
    } catch (e) { /* 自动存档失败静默处理 */ }
  };

  const handleGenerateAIAd = async () => {
    const cost = 5000;
    if (finance.cash < cost) return showAlert("预算不足", "现金不足，AI营销需要支付 ¥5,000 的预算支持！");
    showConfirm("确认启动 AI 营销", `是否支付 ¥${cost.toLocaleString()} 预算，由 AI 店总生成一次专属营销活动？`, async () => {
      setFinance(f => ({ ...f, cash: f.cash - cost }));
      setIsGeneratingAd(true);
      const stockDetails = CAR_MODELS.map(m => { const count = inventory.filter(c => c.modelId === m.id).length; return count > 0 ? `${m.name}(${count}台)` : null; }).filter(Boolean).join(', ');
      const prompt = `你是一位顶尖奥迪营销专家。目前库存有：${stockDetails || '暂无现车'}。请写一条发朋友圈的促销广告文案。要求控制60字以内，包含Emoji，不要多余解释。`;
      const generatedCopy = await callAI(prompt);
      const bonusLeads = Math.floor(Math.random() * 30) + 30; 
      setMarketing(m => ({ ...m, leads: m.leads + bonusLeads }));
      setAiAdCopy(generatedCopy);
      addLog('success', `✨ AI营销成功！立刻获取了 ${bonusLeads} 个高质量意向线索！`);
      setIsGeneratingAd(false);
    });
  };

  const handleAskAIConsultant = async () => {
    setIsGeneratingAdvice(true);
    const targetProgress = monthlyStats.target > 0 ? ((monthlyStats.sales / monthlyStats.target) * 100).toFixed(1) : 0;
    const prompt = `你是汽车4S店总经理顾问。根据数据给一句毒舌但一针见血的建议(最多40字)：现金${finance.cash}，负债${finance.loan}，授信${finance.creditLimit}，库存${inventory.length}，距月底${30 - dayOfMonth}天，目标完成率${targetProgress}%`;
    const advice = await callAI(prompt);
    setAiAdvice(advice);
    addLog('info', `✨ AI 店总顾问给出了新的经营建议。`);
    setIsGeneratingAdvice(false);
  };

  const executeOrder = () => {
    const { model, quantity, color, useLoan } = orderForm;
    const totalSlots = facility.showroomSpots + facility.warehouseCapacity;
    const currentTotal = inventory.length + pendingOrders.reduce((sum, o) => sum + o.quantity, 0);
    if (currentTotal + quantity > totalSlots) return showAlert("库存预警", `展厅及库房余位不足！当前空余位（含在途）: ${totalSlots - currentTotal} 台。`);

    let f = { ...finance };
    const totalCost = model.baseCost * quantity;
    if (!useLoan) {
      if (f.cash < totalCost) return showAlert("资金不足", "自有现金不足，请减少数量或选择使用库存融资！");
      f.cash -= totalCost;
    } else {
      if (f.loan + totalCost > f.creditLimit) return showAlert("授信预警", "授信额度不足，银行拒绝贷款！");
      f.loan += totalCost;
    }

    setFinance(f);

    // 物流周期：3-7天随机到货
    const leadTime = 3 + Math.floor(Math.random() * 5); // 3~7天
    const arriveDay = day + leadTime;
    const newOrder = {
      id: Math.random().toString(36).slice(2, 11),
      modelId: model.id,
      modelName: model.name,
      color,
      quantity,
      arriveDay,
    };
    setPendingOrders(prev => [...prev, newOrder]);
    addLog('info', `📋 订购了 ${quantity} 台 ${model.name} (${color}色)，总成本 ${formatMoney(totalCost)}，${useLoan ? '使用银行融资' : '全款支付'}。预计 ${leadTime} 天后到货(D${((arriveDay - 1) % 30) + 1})。`);
    setOrderForm({ isOpen: false, model: null, quantity: 1, color: '黑', useLoan: false });
  };

  const handleUpdatePrice = (modelId, newPrice) => {
    // 输入中允许任意值（不clamp），由onBlur触发验证
    let val = parseInt(newPrice, 10) || 0;
    setInventory(inv => inv.map(car => car.modelId === modelId ? { ...car, price: val } : car));
  };
  const handlePriceBlur = (modelId) => {
    // 失焦时clamp到合法范围
    const sampleCar = inventory.find(c => c.modelId === modelId);
    if (!sampleCar) return;
    const modelDef = CAR_MODELS.find(m => m.id === modelId);
    const minPrice = modelDef ? Math.round(modelDef.baseCost * 0.8) : 100000;
    const maxPrice = modelDef ? Math.round(getDynamicMsrp(modelId) * 1.3) : 9999999;
    let val = Math.max(minPrice, Math.min(maxPrice, sampleCar.price));
    setInventory(inv => inv.map(car => car.modelId === modelId ? { ...car, price: val } : car));
  };

  // === 二网甩车批售：以同城均价90%强制回笼资金 ===
  const handleWholesale = (modelId) => {
    const modelDef = CAR_MODELS.find(m => m.id === modelId);
    if (!modelDef) return;
    const cars = inventory.filter(c => c.modelId === modelId);
    if (cars.length === 0) return showAlert("无车可批", "该车型当前库存为空！");
    const avgCityPrice = marketPrices[modelId] || modelDef.msrp;
    const wholesalePrice = Math.round(avgCityPrice * 0.9);
    const lossPerCar = wholesalePrice - modelDef.baseCost;
    const totalRevenue = wholesalePrice * cars.length;
    const totalLoss = lossPerCar * cars.length;
    showConfirm(
      "确认二网批售甩车",
      `将 ${cars.length} 台 ${modelDef.name} 以批售价 ¥${wholesalePrice.toLocaleString()}/台（同城均价90%）全部甩给二网经销商？\n\n` +
      `批售单价: ¥${wholesalePrice.toLocaleString()}（同城均价 ¥${Math.round(avgCityPrice).toLocaleString()} × 90%）\n` +
      `单车盈亏: ${lossPerCar >= 0 ? '+' : ''}¥${lossPerCar.toLocaleString()}（相对提车成本 ¥${modelDef.baseCost.toLocaleString()}）\n` +
      `回笼资金: ¥${totalRevenue.toLocaleString()}\n` +
      `总盈亏: ${totalLoss >= 0 ? '+' : ''}¥${totalLoss.toLocaleString()}\n\n` +
      `⚠️ 批售不享受厂家返利，资金立即到账。`,
      () => {
        setInventory(inv => inv.filter(c => c.modelId !== modelId));
        setFinance(f => ({ ...f, cash: f.cash + totalRevenue }));
        // 批售也扣除对应的返利池（因为不享受返利）
        setDailyLedger(prev => [...prev, {
          day: day,
          items: [
            { label: `二网批售(${modelDef.name} ×${cars.length})`, amount: totalRevenue, type: 'income' },
            { label: `批售成本(${modelDef.name} ×${cars.length})`, amount: -modelDef.baseCost * cars.length, type: 'expense' },
          ]
        }]);
        addLog('warning', `🚚【二网批售】${cars.length} 台 ${modelDef.name} 以 ¥${wholesalePrice.toLocaleString()}/台甩给二网，回笼资金 ¥${totalRevenue.toLocaleString()}。${lossPerCar < 0 ? `单车亏损 ¥${Math.abs(lossPerCar).toLocaleString()}，不享受返利。` : `单车微赚 ¥${lossPerCar.toLocaleString()}，但不享受返利。`}`);
      }
    );
  };

  // === 试驾车管理 ===
  const handleSetTestDrive = (modelId) => {
    if (testDriveCars.find(t => t.modelId === modelId)) return showAlert("设置失败", "该车型已有试驾车！");
    const car = inventory.find(c => c.modelId === modelId);
    if (!car) return showAlert("设置失败", "该车型当前无库存！");
    showConfirm("设置试驾车", `将一台 ${CAR_MODELS.find(m => m.id === modelId).name} 设为试驾车？该车不可销售，但该车型转化率+5%。`, () => {
      setInventory(inv => inv.filter(c => c.id !== car.id));
      setTestDriveCars(prev => [...prev, { modelId, day: day, carId: car.id }]);
      addLog('info', `🚗【试驾车】${CAR_MODELS.find(m => m.id === modelId).name} 已设为试驾车，该车型转化率+5%。`);
    });
  };
  const handleRetireTestDrive = (modelId) => {
    const td = testDriveCars.find(t => t.modelId === modelId);
    if (!td) return;
    showConfirm("退役试驾车", `将 ${CAR_MODELS.find(m => m.id === modelId).name} 试驾车退役回库存？`, () => {
      setTestDriveCars(prev => prev.filter(t => t.modelId !== modelId));
      setInventory(inv => [...inv, { id: td.carId, modelId, price: getDynamicMsrp(modelId), location: 'warehouse', stockDays: 0, color: '黑' }]);
      addLog('info', `🚗【试驾退役】${CAR_MODELS.find(m => m.id === modelId).name} 试驾车退役回库存。`);
    });
  };

  // === 二手车展厅建设 ===
  const handleBuildShowroom = () => {
    const cost = 150000;
    if (usedCarShowroom.built) return showAlert("已建设", "二手车展厅已建设，可升级扩容。");
    showConfirm("建设二手车展厅", `投资 ¥${cost.toLocaleString()} 建设二手车展厅？\n展厅容量：6台\n建成后可整备和零售二手车，零售成功率大幅提升。`, () => {
      if (finance.cash < cost) return showAlert("资金不足", `现金不足，需要 ¥${cost.toLocaleString()}`);
      setFinance(f => ({ ...f, cash: f.cash - cost }));
      setUsedCarShowroom({ built: true, level: 1, capacity: 6 });
      addLog('success', `🏗️【展厅建设】二手车展厅建设完成！容量6台，可整备零售。`);
    });
  };

  const handleUpgradeShowroom = () => {
    if (!usedCarShowroom.built) return showAlert("未建设", "请先建设二手车展厅。");
    if (usedCarShowroom.level >= 3) return showAlert("已满级", "二手车展厅已达最高等级。");
    const cost = 80000;
    const newLevel = usedCarShowroom.level + 1;
    const newCapacity = 6 + (newLevel - 1) * 3;
    showConfirm("升级二手车展厅", `投资 ¥${cost.toLocaleString()} 升级展厅至Lv.${newLevel}？\n新容量：${newCapacity}台`, () => {
      if (finance.cash < cost) return showAlert("资金不足", `现金不足，需要 ¥${cost.toLocaleString()}`);
      setFinance(f => ({ ...f, cash: f.cash - cost }));
      setUsedCarShowroom(prev => ({ ...prev, level: newLevel, capacity: newCapacity }));
      addLog('success', `🏗️【展厅升级】二手车展厅升级至Lv.${newLevel}，容量${newCapacity}台。`);
    });
  };

  // === 二手车整备 ===
  const handlePrepUsedCar = (ucId) => {
    const uc = usedCars.find(c => c.id === ucId);
    if (!uc || uc.status !== 'stock') return;
    if (uc.prepped) return showAlert("已整备", "该车已完成整备。");
    const cost = 3000;
    showConfirm("整备二手车", `支付 ¥${cost.toLocaleString()} 对 ${uc.brand} 进行整备？\n整备后零售成功率从30%提升至55%，次日完成。`, () => {
      if (finance.cash < cost) return showAlert("资金不足", `现金不足，整备费 ¥${cost.toLocaleString()}`);
      setFinance(f => ({ ...f, cash: f.cash - cost }));
      setUsedCars(prev => prev.map(c => c.id === ucId ? { ...c, prepped: true } : c));
      addLog('info', `🔧【二手车整备】${uc.brand} 整备完成，可上架零售。`);
    });
  };

  // === 二手车定价 ===
  const handleUsedCarPriceChange = (ucId, newPrice) => {
    const uc = usedCars.find(c => c.id === ucId);
    if (!uc) return;
    let val = parseInt(newPrice, 10) || 0;
    const minPrice = Math.round(uc.purchasePrice * 1.0);
    const maxPrice = Math.round(uc.purchasePrice * 1.5);
    val = Math.max(minPrice, Math.min(maxPrice, val));
    setUsedCars(prev => prev.map(c => c.id === ucId ? { ...c, customRetailPrice: val } : c));
  };

  // === 二手车管理 ===
  const handleUsedCarRetail = (ucId) => {
    const uc = usedCars.find(c => c.id === ucId);
    if (!uc || uc.status !== 'stock') return;
    if (!usedCarShowroom.built) return showAlert("无法零售", "未建设二手车展厅，无法零售。只能批售或先建设展厅。");
    if (!uc.prepped) return showAlert("未整备", "二手车需先整备才能零售。请先支付整备费用。");
    // 展厅容量检查
    const currentStockCount = usedCars.filter(c => c.status === 'stock').length;
    if (currentStockCount > usedCarShowroom.capacity) return showAlert("展厅超限", "二手车展厅已超出容量，请先处置部分车辆。");
    const sellPrice = uc.customRetailPrice || uc.retailPrice;
    // 成功率计算：基础55%(有展厅+整备)，价格溢价每超收车价20%扣5%概率
    const priceRatio = sellPrice / uc.purchasePrice;
    let successRate = 0.55;
    if (priceRatio > 1.2) successRate -= Math.floor((priceRatio - 1.2) / 0.1) * 0.05;
    successRate = Math.max(0.15, Math.min(0.65, successRate));
    const successPercent = Math.round(successRate * 100);
    showConfirm("零售二手车", `尝试零售 ${uc.brand}？\n零售价: ¥${sellPrice.toLocaleString()}（收车价 ¥${uc.purchasePrice.toLocaleString()}）\n${successPercent}%概率成交，未成交则继续持有。`, () => {
      if (Math.random() < successRate) {
        setUsedCars(prev => prev.map(c => c.id === ucId ? { ...c, status: 'retailed', soldPrice: sellPrice } : c));
        setFinance(f => ({ ...f, cash: f.cash + sellPrice }));
        const profit = sellPrice - uc.purchasePrice;
        addLog('success', `♻️【二手车零售】${uc.brand} 以 ¥${sellPrice.toLocaleString()} 成交！利润 ¥${profit.toLocaleString()}。`);
      } else {
        addLog('info', `♻️【二手车零售】${uc.brand} 未能成交，继续持有。`);
      }
    });
  };
  const handleUsedCarWholesale = (ucId) => {
    const uc = usedCars.find(c => c.id === ucId);
    if (!uc || uc.status !== 'stock') return;
    const wsPrice = Math.round(uc.purchasePrice * 0.95);
    showConfirm("批售二手车", `将 ${uc.brand} 批售给二手车商？\n批售价: ¥${wsPrice.toLocaleString()}（收车价 ¥${uc.purchasePrice.toLocaleString()}，亏损5%）\n立即成交。`, () => {
      setUsedCars(prev => prev.map(c => c.id === ucId ? { ...c, status: 'wholesaled' } : c));
      setFinance(f => ({ ...f, cash: f.cash + wsPrice }));
      addLog('info', `♻️【二手车批售】${uc.brand} 以 ¥${wsPrice.toLocaleString()} 批售给车商。`);
    });
  };

  // === 售后技师管理 ===
  const handleHireTech = () => {
    const cost = 3000;
    if (finance.cash < cost) return showAlert("招聘失败", `现金不足，技师招聘费 ¥${cost.toLocaleString()}`);
    if (afterSales.technicians.length >= 6) return showAlert("招聘失败", "技师团队已满（最多6人）");
    showConfirm("招聘技师", `支付 ¥${cost.toLocaleString()} 招聘一名技师？`, () => {
      setFinance(f => ({ ...f, cash: f.cash - cost }));
      const newMember = { id: `tech_${Date.now()}`, skill: 30, retained: false, nickname: pickNickname('tech') };
      setAfterSales(prev => ({ ...prev, technicians: [...prev.technicians, newMember] }));
      addLog('info', `🔧【技师招聘】${newMember.nickname} 加入售后团队（能力30）。`);
    });
  };
  const handleTrainTech = (techId) => {
    const cost = 2000;
    if (finance.cash < cost) return showAlert("培训失败", `现金不足，培训费 ¥${cost.toLocaleString()}`);
    const member = afterSales.technicians.find(m => m.id === techId);
    if (!member || member.skill >= 100) return;
    showConfirm("培训技师", `支付 ¥${cost.toLocaleString()} 培训 ${member.nickname}？`, () => {
      setFinance(f => ({ ...f, cash: f.cash - cost }));
      setAfterSales(prev => ({
        ...prev,
        technicians: prev.technicians.map(m => m.id === techId ? { ...m, skill: Math.min(100, m.skill + 5 + Math.floor(Math.random() * 6)) } : m)
      }));
      addLog('info', `🔧【技师培训】${member.nickname} 培训完成。`);
    });
  };
  const toggleTechRetention = (techId) => {
    setAfterSales(prev => ({
      ...prev,
      technicians: prev.technicians.map(m => m.id === techId ? { ...m, retained: !m.retained } : m)
    }));
  };

  const handleApplySubsidy = (modelId) => {
    const modelDef = CAR_MODELS.find(m => m.id === modelId);
    // 库龄分级补贴
    const cars30 = inventory.filter(c => c.modelId === modelId && !c.subsidized && (c.stockDays || 0) >= 30 && (c.stockDays || 0) < 60);
    const cars60 = inventory.filter(c => c.modelId === modelId && !c.subsidized && (c.stockDays || 0) >= 60 && (c.stockDays || 0) < 90);
    const cars90 = inventory.filter(c => c.modelId === modelId && !c.subsidized && (c.stockDays || 0) >= 90 && (c.stockDays || 0) < 120);
    const eligibleCars = [...cars30, ...cars60, ...cars90];
    if (eligibleCars.length === 0) {
      const oldCars = inventory.filter(c => c.modelId === modelId && !c.subsidized);
      if (oldCars.length === 0) return showAlert("申请失败", "该车型当前库存为空或已全部申请过补贴。");
      return showAlert("申请失败", `该车型暂无库龄超过30天的车辆，当前最长库龄: ${Math.max(...oldCars.map(c => c.stockDays || 0))} 天。`);
    }
    if (!monthlyStats.lastMonthProcessPassed && day > 30) return showAlert("申请失败", "上月过程考核未达标（邀约到店率≥10%且销售转化率≥20%），无法申请长库龄补贴。");
    const subsidy30 = cars30.length * 5000;
    const subsidy60 = cars60.length * 12000;
    const subsidy90 = cars90.length * 20000;
    const totalSubsidy = subsidy30 + subsidy60 + subsidy90;
    const breakdown = [];
    if (cars30.length > 0) breakdown.push(`30-59天: ${cars30.length}台 × ¥5,000 = ¥${subsidy30.toLocaleString()}`);
    if (cars60.length > 0) breakdown.push(`60-89天: ${cars60.length}台 × ¥12,000 = ¥${subsidy60.toLocaleString()}`);
    if (cars90.length > 0) breakdown.push(`90-119天: ${cars90.length}台 × ¥20,000 = ¥${subsidy90.toLocaleString()}`);
    showConfirm("申请库存补贴", `是否向厂家申请 ${modelDef.name} 的滞销特批补贴？\n\n${breakdown.join('\n')}\n\n合计: ¥${totalSubsidy.toLocaleString()}`, () => {
      setInventory(inv => inv.map(car => car.modelId === modelId && !car.subsidized && (car.stockDays || 0) >= 30 ? { ...car, subsidized: true } : car));
      setMonthlyStats(prev => ({ ...prev, baseRebatesPool: prev.baseRebatesPool + totalSubsidy }));
      addLog('success', `💰 厂家特批！${eligibleCars.length} 台 ${modelDef.name} 获得分级补贴共 ¥${totalSubsidy.toLocaleString()} 注入待结返利池。`);
    });
  };

  const handleMoveCar = (modelId, targetLocation) => {
    const showroomUsed = inventory.filter(c => c.location === 'showroom').length;
    const modelInShowroom = inventory.filter(c => c.modelId === modelId && c.location === 'showroom').length;
    const modelInWarehouse = inventory.filter(c => c.modelId === modelId && c.location === 'warehouse').length;

    if (targetLocation === 'showroom') {
      if (modelInWarehouse === 0) return showAlert("操作失败", "该车型仓储区无车可上展。");
      if (showroomUsed >= facility.showroomSpots) return showAlert("展厅已满", `展厅展位已满 (${showroomUsed}/${facility.showroomSpots})，请先移出其他展车。`);
      setInventory(inv => {
        const idx = inv.findIndex(c => c.modelId === modelId && c.location === 'warehouse');
        if (idx === -1) return inv;
        const updated = [...inv];
        updated[idx] = { ...updated[idx], location: 'showroom' };
        return updated;
      });
      const modelDef = CAR_MODELS.find(m => m.id === modelId);
      addLog('info', `🏪 ${modelDef.name} 移入展厅展示，可提升该车型转化率 +12%。`);
    } else {
      if (modelInShowroom === 0) return showAlert("操作失败", "该车型无展厅展车可移出。");
      setInventory(inv => {
        const idx = inv.findIndex(c => c.modelId === modelId && c.location === 'showroom');
        if (idx === -1) return inv;
        const updated = [...inv];
        updated[idx] = { ...updated[idx], location: 'warehouse' };
        return updated;
      });
      const modelDef = CAR_MODELS.find(m => m.id === modelId);
      addLog('info', `📦 ${modelDef.name} 移回仓储区，将产生 ¥50/天仓储费用。`);
    }
  };

  const handleAutoShowroom = () => {
    const showroomUsed = inventory.filter(c => c.location === 'showroom').length;
    const availableSpots = facility.showroomSpots - showroomUsed;
    if (availableSpots <= 0) return showAlert("展厅已满", "展厅展位已满，无法布展。");

    // 获取已在展厅的车型ID
    const displayedModelIds = new Set(inventory.filter(c => c.location === 'showroom').map(c => c.modelId));
    // 获取仓储中有但未上展的车型，按多样性优先
    const candidates = [];
    const modelIds = [...new Set(inventory.filter(c => c.location === 'warehouse').map(c => c.modelId))];
    for (const modelId of modelIds) {
      if (!displayedModelIds.has(modelId)) {
        candidates.push(modelId);
      }
    }

    if (candidates.length === 0) {
      // 所有车型都已上展，从仓储中选更多同车型上展
      const warehouseModels = [...new Set(inventory.filter(c => c.location === 'warehouse').map(c => c.modelId))];
      if (warehouseModels.length === 0) return showAlert("无可布展车辆", "仓储区无车辆可上展。");
      const toDisplay = warehouseModels.slice(0, availableSpots);
      setInventory(inv => {
        const updated = [...inv];
        for (const modelId of toDisplay) {
          const idx = updated.findIndex(c => c.modelId === modelId && c.location === 'warehouse');
          if (idx !== -1) updated[idx] = { ...updated[idx], location: 'showroom' };
        }
        return updated;
      });
      addLog('info', `🏪 快速布展：将 ${toDisplay.length} 台车移入展厅（补充同车型展位）。`);
    } else {
      const toDisplay = candidates.slice(0, availableSpots);
      setInventory(inv => {
        const updated = [...inv];
        for (const modelId of toDisplay) {
          const idx = updated.findIndex(c => c.modelId === modelId && c.location === 'warehouse');
          if (idx !== -1) updated[idx] = { ...updated[idx], location: 'showroom' };
        }
        return updated;
      });
      addLog('success', `🏪 快速布展：将 ${toDisplay.length} 款新车型移入展厅，展车多样性提升自然客流！`);
    }
  };

  const trainMember = (type, memberId) => {
    const cost = 20000;
    if (finance.cash < cost) return showAlert("资金不足", "现金不足以支付培训费！");
    const member = staff[type].members.find(m => m.id === memberId);
    if (!member) return showAlert("提示", "找不到该员工！");
    if (member.skill >= 100) return showAlert("提示", `${member.nickname} 的能力已达满级！`);
    const roleName = type === 'dcc' ? 'DCC专员' : '销售顾问';
    showConfirm("确认培训", `确定花费 ¥${cost.toLocaleString()} 为 ${roleName}【${member.nickname}】组织专项培训吗？\n能力值将从 ${member.skill} 提升至 ${Math.min(100, member.skill + 10)}。`, () => {
      setFinance(f => ({ ...f, cash: f.cash - cost }));
      const newSkill = Math.min(100, member.skill + 10);
      setStaff(s => ({
        ...s,
        [type]: {
          ...s[type],
          members: s[type].members.map(m => m.id === memberId ? { ...m, skill: newSkill } : m)
        }
      }));
      addLog('success', `花费 ${formatMoney(cost)} 为${roleName}【${member.nickname}】组织专项培训，能力值 ${member.skill} → ${newSkill}！`);
    });
  };

  let staffIdCounter = 100;
  const hireStaff = (type) => {
    const roleName = type === 'dcc' ? 'DCC专员' : '销售顾问';
    showConfirm("确认招聘", `确定招聘一名新的 ${roleName} 吗？将增加每日固定的工资支出。`, () => {
      const newMember = { id: `${type}_${++staffIdCounter}_${Date.now()}`, skill: 20 + Math.floor(Math.random() * 20), retained: false, nickname: pickNickname(type) };
      setStaff(s => ({ ...s, [type]: { ...s[type], members: [...s[type].members, newMember] } }));
      addLog('info', `新${roleName}【${newMember.nickname}】入职，初始能力值 ${newMember.skill}。`);
    });
  };

  // === 发起营销活动 ===
  const launchActivity = (activityId) => {
    const act = MARKETING_ACTIVITIES.find(a => a.id === activityId);
    if (!act) return;
    // 持续型活动（线上投流）不走这里
    if (act.costType === 'daily') return;
    if (finance.cash < act.cost) return showAlert("资金不足", `现金不足以支付 ${act.name} 的费用！`);
    // 检查是否已有同类活动在进行
    const sameActive = marketing.activeActivities.find(a => a.activityId === activityId);
    if (sameActive) return showAlert("活动冲突", `${act.name} 已在进行中，请等待结束后再发起。`);

    showConfirm(`确认发起${act.name}`, `是否花费 ¥${act.cost.toLocaleString()} 发起【${act.name}】？\n${act.description}`, () => {
      setFinance(f => ({ ...f, cash: f.cash - act.cost }));
      setMonthlyStats(prev => ({ ...prev, marketingCost: prev.marketingCost + act.cost, activitySpend: (prev.activitySpend || 0) + act.cost }));
      const newActivity = {
        id: `act_${Date.now()}`,
        activityId: act.id,
        name: act.name,
        icon: act.icon,
        startDay: day,
        endDay: day + act.duration,
        effect: act.effect,
        effectValue: act.effectValue,
        effect2: act.effect2 || null,
        effect2Value: act.effect2Value || 0,
      };
      setMarketing(m => ({ ...m, activeActivities: [...m.activeActivities, newActivity] }));

      // 老客维系：立即回收线索
      if (act.effect === 'recover') {
        const recovered = act.effectValue;
        setMarketing(m => ({ ...m, leads: m.leads + recovered }));
        setMonthlyStats(prev => ({ ...prev, recoveredLeads: (prev.recoveredLeads || 0) + recovered, leads: prev.leads + recovered }));
        addLog('success', `🤝【老客维系】DCC回访战败客户，成功回收 ${recovered} 条线索进入跟进池！`);
      } else {
        addLog('success', `${act.icon}【${act.name}】活动已启动！${act.description}，持续${act.duration}天。`);
      }
    });
  };

  const toggleRetention = (type, memberId) => {
    const member = staff[type].members.find(m => m.id === memberId);
    if (!member) return;
    const roleName = type === 'dcc' ? 'DCC专员' : '销售顾问';
    if (!member.retained) {
      // 开启留任：每月额外支付该员工日薪×30的留任津贴
      showConfirm("确认留任", `为${roleName}【${member.nickname}】（能力值 ${member.skill}）发放留任津贴？\n每日额外支出 ¥${staff[type].salary}（即月薪翻倍），可有效降低其离职风险。`, () => {
        setStaff(s => ({
          ...s,
          [type]: { ...s[type], members: s[type].members.map(m => m.id === memberId ? { ...m, retained: true } : m) }
        }));
      });
    } else {
      setStaff(s => ({
        ...s,
        [type]: { ...s[type], members: s[type].members.map(m => m.id === memberId ? { ...m, retained: false } : m) }
      }));
    }
  };

  const upgradeFacility = () => {
    const cost = facility.level * 100000;
    if (facility.level >= 5) return showAlert("提示", "展厅已是最高级别的旗舰店！");
    if (finance.cash < cost) return showAlert("资金不足", "现金不足！");
    showConfirm("确认升级展厅", `确定花费 ¥${cost.toLocaleString()} 将展厅升级至 Lv.${facility.level + 1} 吗？\n这将提升客户转化率，但同时会增加每月的房租和折旧成本。`, () => {
      setFinance(f => ({ ...f, cash: f.cash - cost }));
      setFacility(fac => ({ ...fac, level: fac.level + 1, showroomSpots: fac.showroomSpots + 1, warehouseCapacity: fac.warehouseCapacity + 8 }));
      addLog('success', `展厅升级完毕，目前为 ${facility.level + 1} 级标准店。展厅展位 +1，仓储容量 +8。`);
    });
  };

  const handleStrategyChange = (key, val) => {
    showConfirm("策略调整", `确定将此衍生业务切换至【${val === 'OEM' ? '原厂' : '三方'}】采购吗？\n原厂件客单价和客户接受度高，但毛利低；三方件利润空间大，但客户容易拒绝。`, () => {
      setStrategy(prev => ({ ...prev, [key]: val }));
      addLog('info', `衍生策略已调整为 ${val === 'OEM' ? '原厂采购' : '第三方采购'}。`);
    });
  };

  const handleRestart = () => {
    showConfirm("重新开始", "确定要重新开始游戏吗？所有进度将丢失！", () => {
      // 清除localStorage存档
      localStorage.removeItem('audi_game_save');
      localStorage.removeItem('audi_game_save_slots');
      // 刷新页面重置所有状态
      window.location.reload();
    });
  };

  // === 存档/读档系统（多存档槽） ===
  const SAVE_SLOTS_KEY = 'audi_game_save_slots'; // { slots: { slot1: {...}, slot2: {...}, ... } }
  const MAX_SLOTS = 5;
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [renameSlot, setRenameSlot] = useState(null); // 正在重命名的槽位id
  const [renameValue, setRenameValue] = useState('');

  const getSaveSlots = () => {
    try {
      const raw = localStorage.getItem(SAVE_SLOTS_KEY);
      return raw ? JSON.parse(raw) : { slots: {} };
    } catch { return { slots: {} }; }
  };

  const buildSaveData = () => ({
    version: 1,
    savedAt: new Date().toLocaleString('zh-CN'),
    gameState, day, finance, strategy, marketPrices, manufacturerPolicy,
    marketing, staff, afterSales, usedCarShowroom, usedCars, testDriveCars, csi,
    insuranceRenewals, soldVehicles, monthlyStats, facility,
    inventory, pendingOrders, dailyStats, dailyLedger, logs,
  });

  const applySaveData = (saveData) => {
    if (saveData.gameState) setGameState(saveData.gameState);
    if (saveData.day) setDay(saveData.day);
    if (saveData.finance) setFinance(saveData.finance);
    if (saveData.strategy) setStrategy(saveData.strategy);
    if (saveData.marketPrices) setMarketPrices(saveData.marketPrices);
    if (saveData.manufacturerPolicy) setManufacturerPolicy(saveData.manufacturerPolicy);
    if (saveData.marketing) setMarketing(saveData.marketing);
    if (saveData.staff) setStaff(saveData.staff);
    if (saveData.afterSales) setAfterSales(saveData.afterSales);
    if (saveData.usedCarShowroom) setUsedCarShowroom(saveData.usedCarShowroom);
    if (saveData.usedCars) setUsedCars(saveData.usedCars);
    if (saveData.testDriveCars) setTestDriveCars(saveData.testDriveCars);
    if (saveData.csi) setCsi(saveData.csi);
    if (saveData.insuranceRenewals) setInsuranceRenewals(saveData.insuranceRenewals);
    if (saveData.soldVehicles) setSoldVehicles(saveData.soldVehicles);
    if (saveData.monthlyStats) setMonthlyStats(saveData.monthlyStats);
    if (saveData.facility) setFacility(saveData.facility);
    if (saveData.inventory) setInventory(saveData.inventory);
    if (saveData.pendingOrders) setPendingOrders(saveData.pendingOrders);
    if (saveData.dailyStats) setDailyStats(saveData.dailyStats);
    if (saveData.dailyLedger) setDailyLedger(saveData.dailyLedger);
    if (saveData.logs) setLogs(saveData.logs);
  };

  const handleSaveToSlot = (slotId, customName) => {
    const allSlots = getSaveSlots();
    const saveData = buildSaveData();
    saveData.slotName = customName || `存档 ${slotId}`;
    allSlots.slots[slotId] = saveData;
    try {
      localStorage.setItem(SAVE_SLOTS_KEY, JSON.stringify(allSlots));
      showAlert('存档成功', `已保存至「${saveData.slotName}」！\n存档时间：${saveData.savedAt}\n经营日：M${Math.floor((day - 1) / 30) + 1} D${((day - 1) % 30) + 1}`);
    } catch (e) {
      showAlert('存档失败', '存储空间不足，无法保存游戏进度。');
    }
    setShowSaveModal(false);
  };

  const handleLoadFromSlot = (slotId) => {
    const allSlots = getSaveSlots();
    const saveData = allSlots.slots[slotId];
    if (!saveData) return showAlert('读档失败', '该槽位无存档数据。');
    const slotName = saveData.slotName || `存档 ${slotId}`;
    showConfirm('确认读档', `是否加载存档「${slotName}」？\n存档时间：${saveData.savedAt}\n经营日：M${Math.floor((saveData.day - 1) / 30) + 1} D${((saveData.day - 1) % 30) + 1}\n\n⚠️ 当前进度将被覆盖！`, () => {
      applySaveData(saveData);
      setShowLoadModal(false);
    });
  };

  const handleDeleteSlot = (slotId) => {
    const allSlots = getSaveSlots();
    const saveData = allSlots.slots[slotId];
    if (!saveData) return;
    const slotName = saveData.slotName || `存档 ${slotId}`;
    showConfirm('确认删除', `是否删除存档「${slotName}」？\n\n⚠️ 删除后无法恢复！`, () => {
      delete allSlots.slots[slotId];
      try { localStorage.setItem(SAVE_SLOTS_KEY, JSON.stringify(allSlots)); } catch {}
    });
  };

  const handleRenameSlot = (slotId) => {
    const allSlots = getSaveSlots();
    const saveData = allSlots.slots[slotId];
    if (!saveData) return;
    saveData.slotName = renameValue.trim() || `存档 ${slotId}`;
    try { localStorage.setItem(SAVE_SLOTS_KEY, JSON.stringify(allSlots)); } catch {}
    setRenameSlot(null);
    setRenameValue('');
  };

  const hasAnySaveData = () => {
    const allSlots = getSaveSlots();
    return Object.keys(allSlots.slots).length > 0;
  };

  // 兼容旧版单存档迁移
  const migrateOldSave = () => {
    try {
      const oldRaw = localStorage.getItem('audi_game_save');
      if (oldRaw && !localStorage.getItem(SAVE_SLOTS_KEY)) {
        const allSlots = { slots: { slot1: JSON.parse(oldRaw) } };
        allSlots.slots.slot1.slotName = '旧版存档';
        localStorage.setItem(SAVE_SLOTS_KEY, JSON.stringify(allSlots));
        localStorage.removeItem('audi_game_save');
      }
    } catch {}
  };
  migrateOldSave();

  // 安全提取财务变量
  const gp1 = (monthlyStats.revenue || 0) - (monthlyStats.cogs || 0);
  const gp2 = gp1 + (monthlyStats.baseRebatesPool || 0);
  const derivProfit = (monthlyStats.derivativeRevenue || 0) - (monthlyStats.derivativeCost || 0);
  const gp3 = gp2 + derivProfit;
  const opex = (monthlyStats.rent || 0) + (monthlyStats.depreciation || 0) + (monthlyStats.labor || 0) + (monthlyStats.marketingCost || 0) + (monthlyStats.financeCost || 0) + (monthlyStats.storageCost || 0);
  const netProfit = gp3 - opex;

  const targetProgress = monthlyStats.target > 0 ? Math.min(100, (monthlyStats.sales / monthlyStats.target) * 100) : 0;
  const inviteRateVal = monthlyStats.leads > 0 ? monthlyStats.walkIns / monthlyStats.leads : 0;
  const convertRateVal = monthlyStats.walkIns > 0 ? monthlyStats.sales / monthlyStats.walkIns : 0;

  const [activeTab, setActiveTab] = useState('showroom');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans p-4 md:p-8 flex justify-center relative">
      <div className="w-full max-w-6xl flex flex-col gap-6">
        
        {/* --- 顶部全局仪表盘 --- */}
        <div className="bg-slate-900 text-white rounded-2xl shadow-xl p-6 flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 h-1 bg-blue-500/30 w-full">
            <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${(dayOfMonth / 30) * 100}%` }}></div>
          </div>
          <div className="flex gap-8 items-center flex-wrap z-10">
            <div>
              <p className="text-slate-400 text-xs font-bold tracking-widest uppercase">经营日历</p>
              <p className="text-3xl font-black">M{month} <span className="text-xl text-slate-400 font-normal">D{dayOfMonth}</span></p>
            </div>
            <div className="h-12 w-px bg-slate-700 hidden md:block"></div>
            <div>
              <p className="text-slate-400 text-xs font-bold tracking-widest flex items-center gap-1"><Icons.Wallet /> 自有现金</p>
              <p className={'text-2xl font-bold  ' + (finance.cash > 0 ? 'text-green-400' : 'text-red-400')}>{formatMoney(finance.cash)}</p>
            </div>
            <div className="h-12 w-px bg-slate-700 hidden md:block"></div>
            <div>
              <p className="text-slate-400 text-xs font-bold tracking-widest flex items-center gap-1"><Icons.Bank /> 银行负债 / 动态授信</p>
              <div className="flex items-end gap-2">
                <p className={'text-2xl font-bold  ' + (finance.loan > finance.creditLimit * 0.8 ? 'text-red-400' : 'text-orange-400')}>
                  {formatMoney(finance.loan)}
                </p>
                <p className="text-sm font-bold text-slate-400 mb-1 ml-2"> / {formatMoney(finance.creditLimit)}</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={handleNextDay} disabled={gameState !== 'playing'}
              className={`px-8 py-4 rounded-xl font-bold text-lg shadow-lg transition-all ${
                gameState === 'bankrupt' ? 'bg-red-600 text-white cursor-not-allowed' :
                gameState === 'won' ? 'bg-green-600 text-white cursor-not-allowed' :
                'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
            >
              {gameState === 'bankrupt' ? '经营破产' : gameState === 'won' ? '🏆 经营成功' : '进入下一天 ➔'}
            </button>
            <div className="flex gap-2">
              <button onClick={() => setShowSaveModal(true)} className="text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors">
                💾 存档
              </button>
              <button onClick={() => setShowLoadModal(true)} disabled={!hasAnySaveData()} className="text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                📂 读档
              </button>
              <button onClick={handleRestart} className="text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors">
                🔄 重开
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 flex flex-col gap-4 overflow-hidden">
            {/* 导航栏 */}
            <div className="flex p-1 bg-white rounded-xl shadow-sm border border-slate-100 overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {[
                { id: 'showroom', label: '展厅定价' },
                { id: 'order', label: '厂家订货' },
                { id: 'marketing', label: '漏斗营销' },
                { id: 'derivative', label: '衍生与财务' },
                { id: 'usedcar', label: '二手车' },
                { id: 'aftersales', label: '售后服务' },
                { id: 'csi', label: 'CSI满意度' },
                { id: 'staff', label: '人事招聘' },
                { id: 'assessment', label: '返利考核' }
              ].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={'flex-none min-w-[100px] flex-1 py-3 px-2 text-sm md:text-base font-bold rounded-lg transition-colors whitespace-nowrap  ' + (activeTab === tab.id ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50')}>
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 min-h-[550px]">
              
              {/* --- 展厅定价 --- */}
              {activeTab === 'showroom' && (
                <div>
                  <div className="flex justify-between items-end mb-4 border-b border-slate-100 pb-4">
                    <div>
                      <h2 className="text-2xl font-bold flex items-center gap-2"><Icons.Store /> 展厅布局与定价</h2>
                      <p className="text-slate-500 text-sm mt-1">展车提升转化率+12%，展厅车型多样性增加自然客流。仓储车辆每日产生¥50/台成本。</p>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-sm font-bold text-slate-700">
                        展厅展位: <span className="text-blue-600">{inventory.filter(c => c.location === 'showroom').length}</span> / {facility.showroomSpots}
                        <span className="mx-2 text-slate-300">|</span>
                        仓储区: <span className="text-amber-600">{inventory.filter(c => c.location === 'warehouse').length}</span> / {facility.warehouseCapacity}
                      </p>
                      <button onClick={handleAutoShowroom} className="text-xs px-3 py-1.5 rounded bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 font-bold transition-colors">
                        🏪 一键布展
                      </button>
                    </div>
                  </div>

                  {/* 展厅展位可视化 */}
                  <div className="mb-6 bg-gradient-to-r from-slate-50 to-blue-50/30 border border-slate-200 rounded-xl p-4">
                    <h3 className="text-sm font-bold text-slate-600 mb-3 uppercase tracking-wider">🏪 展厅展位实况</h3>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {Array.from({ length: facility.showroomSpots }).map((_, i) => {
                        const showroomCars = inventory.filter(c => c.location === 'showroom');
                        const car = showroomCars[i];
                        if (car) {
                          const modelDef = CAR_MODELS.find(m => m.id === car.modelId);
                          return (
                            <div key={i} className={'w-20 h-16 rounded-lg border-2 border-blue-300 ' + (modelDef?.color || 'bg-slate-100') + ' flex flex-col items-center justify-center shadow-sm'}>
                              <span className="text-[10px] font-black text-slate-700 leading-none">{modelDef?.series || '?'}</span>
                              <span className="text-[9px] text-slate-500 leading-none">{modelDef?.trim || ''}</span>
                            </div>
                          );
                        }
                        return (
                          <div key={i} className="w-20 h-16 rounded-lg border-2 border-dashed border-slate-200 bg-white flex items-center justify-center">
                            <span className="text-slate-300 text-xs">空位</span>
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-xs text-slate-400">每款展车为对应车型带来 +12% 转化加成；展示车型种类越多，自然进店客流越多 (每款+0.8人/天)</p>
                  </div>

                  <div className="space-y-6">
                    {['A5', 'A6', 'Q5'].map(series => {
                      const seriesModels = CAR_MODELS.filter(m => m.series === series);
                      const hasAnyInventory = seriesModels.some(model => inventory.filter(c => c.modelId === model.id).length > 0);
                      if (!hasAnyInventory) return null;
                      return (
                        <div key={series} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                          <div className="bg-slate-100 px-5 py-3 border-b border-slate-200 flex items-center gap-2">
                            <span className="font-black text-xl text-slate-800">{series} 车系</span>
                            <span className="text-xs px-2 py-1 bg-slate-200 rounded-full text-slate-600">目标客群: {seriesModels[0].segment}</span>
                          </div>
                          <div className="divide-y divide-slate-100">
                            {seriesModels.map(model => {
                              const count = inventory.filter(c => c.modelId === model.id).length;
                              if (count === 0) return null;
                              const showroomCount = inventory.filter(c => c.modelId === model.id && c.location === 'showroom').length;
                              const warehouseCount = inventory.filter(c => c.modelId === model.id && c.location === 'warehouse').length;
                              const sampleCar = inventory.find(c => c.modelId === model.id);
                              const currentMarket = marketPrices[model.id];
                              const singleProfit = sampleCar.price - model.baseCost + getDynamicRebate(model.id);
                              const isPriceInverted = sampleCar.price < model.baseCost;
                              const unsubsidizedCount = inventory.filter(c => c.modelId === model.id && !c.subsidized && (c.stockDays || 0) >= 30).length;
                              const maxStockDays = count > 0 ? Math.max(...inventory.filter(c => c.modelId === model.id).map(c => c.stockDays || 0)) : 0;

                              const colorCounts = {};
                              inventory.filter(c => c.modelId === model.id).forEach(c => { colorCounts[c.color || '黑'] = (colorCounts[c.color || '黑'] || 0) + 1; });
                              const colorStr = Object.entries(colorCounts).map(([col, num]) => `${col}:${num}`).join(' / ');

                              const showroomUsed = inventory.filter(c => c.location === 'showroom').length;

                              return (
                                <div key={model.id} className="p-5 flex flex-col md:flex-row gap-6 items-center hover:bg-slate-50 transition-colors">
                                  <div className={'w-14 h-14 rounded-full flex items-center justify-center font-bold text-slate-700 shadow-inner  ' + model.color}>{model.trim}</div>
                                  <div className="flex-1 w-full">
                                    <h3 className="font-bold text-lg">{model.name}
                                      <span className="text-sm font-normal text-slate-500 ml-2">
                                        库存 {count} 台
                                        <span className="text-xs ml-1">[
                                          <span className="text-blue-600">展厅:{showroomCount}</span>
                                          <span className="mx-1">|</span>
                                          <span className="text-amber-600">仓储:{warehouseCount}</span>
                                        ]</span>
                                      </span>
                                    </h3>
                                    <div className="grid grid-cols-2 text-sm mt-2 gap-y-1 text-slate-600">
                                      <p>提车成本: ¥{model.baseCost.toLocaleString()}</p>
                                      <p>厂家返利: <span className="text-green-600 font-medium">+¥{getDynamicRebate(model.id).toLocaleString()}</span>{manufacturerPolicy.rebateMultiplier !== 1.0 && <span className="text-[10px] text-blue-500 ml-1">×{manufacturerPolicy.rebateMultiplier.toFixed(2)}</span>}</p>
                                      <p>指导价: <span className={manufacturerPolicy.msrpTrend !== 0 ? 'text-orange-600 font-bold' : ''}>¥{getDynamicMsrp(model.id).toLocaleString()}</span>{manufacturerPolicy.msrpTrend !== 0 && <span className="text-[10px] text-orange-400 ml-1">({manufacturerPolicy.msrpTrend > 0 ? '+' : ''}{manufacturerPolicy.msrpTrend.toFixed(1)}%)</span>}</p>
                                      <p>同城均价: <span className="font-bold text-orange-500">¥{Math.round(currentMarket).toLocaleString()}</span></p>
                                      <p className="col-span-2 text-xs text-slate-400">二网批售价: ¥{Math.round(currentMarket * 0.9).toLocaleString()}（同城均价×90%）</p>
                                    </div>
                                    <div className="mt-3 flex flex-wrap items-center gap-2">
                                      <p className="text-xs text-slate-400 mr-1">最长库龄: {
                                        maxStockDays >= 110 ? <span className="text-red-600 font-bold animate-pulse">🔴 {maxStockDays}天 (距强制批售仅{120-maxStockDays}天！)</span> :
                                        maxStockDays >= 90 ? <span className="text-red-600 font-bold">🔴 {maxStockDays}天 (距强制批售{120-maxStockDays}天)</span> :
                                        maxStockDays >= 60 ? <span className="text-red-600 font-bold">🔶 {maxStockDays}天</span> :
                                        maxStockDays >= 30 ? <span className="text-amber-600">🔶 {maxStockDays}天</span> :
                                        `${maxStockDays} 天 (${30 - maxStockDays}天后可申请)`
                                      }</p>
                                      <button onClick={() => handleApplySubsidy(model.id)} disabled={unsubsidizedCount === 0} className="text-xs font-bold px-3 py-1.5 rounded bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                                        🎁 补贴 ({unsubsidizedCount}台)
                                      </button>
                                      <button onClick={() => handleMoveCar(model.id, 'showroom')} disabled={warehouseCount === 0 || showroomUsed >= facility.showroomSpots} className="text-xs font-bold px-3 py-1.5 rounded bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                                        🏪 上展
                                      </button>
                                      <button onClick={() => handleMoveCar(model.id, 'warehouse')} disabled={showroomCount === 0} className="text-xs font-bold px-3 py-1.5 rounded bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                                        📦 入库
                                      </button>
                                      <button onClick={() => handleWholesale(model.id)} disabled={count === 0} className="text-xs font-bold px-3 py-1.5 rounded bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                                        🚚 二网批售
                                      </button>
                                      {testDriveCars.find(t => t.modelId === model.id) ? (
                                        <button onClick={() => handleRetireTestDrive(model.id)} className="text-xs font-bold px-3 py-1.5 rounded bg-green-50 text-green-600 border border-green-200 hover:bg-green-100 transition-colors">
                                          🚗 试驾车 ON
                                        </button>
                                      ) : (
                                        <button onClick={() => handleSetTestDrive(model.id)} disabled={warehouseCount === 0 && showroomCount === 0} className="text-xs font-bold px-3 py-1.5 rounded bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                                          🚗 设试驾
                                        </button>
                                      )}
                                      {showroomCount > 0 && <span className="text-xs text-green-600 font-bold">✅ +12%转化</span>}
                                    </div>
                                  </div>
                                  <div className="w-full md:w-auto bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">统一标价调整</label>
                                    <div className="flex items-center gap-2">
                                      <span className="text-slate-400">¥</span>
                                      <input type="number" value={sampleCar.price} onChange={(e) => handleUpdatePrice(model.id, e.target.value)} onBlur={() => handlePriceBlur(model.id)} className="w-32 border border-slate-300 rounded-md p-2 text-lg font-bold text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                    <div className="mt-3 text-sm">
                                      {isPriceInverted && <span className="block text-xs text-red-500 mb-1">⚠️ 前端价格倒挂 (售价低成本)</span>}
                                      <span className="text-slate-500 text-xs">卖车即得: {formatMoney(sampleCar.price - model.baseCost)}</span><br/>
                                      理论单车新车利润: <span className={'ml-1 font-bold  ' + (singleProfit >= 0 ? 'text-green-600' : 'text-red-600')}>{singleProfit >= 0 ? '+' : ''}{formatMoney(singleProfit)}</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                    {inventory.length === 0 && <div className="text-center py-16 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">展厅空无一车，请前往"厂家订货"进货。</div>}
                    
                    {/* 二手车库存简览 */}
                    <div className="mt-6 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-5">
                      <h3 className="font-bold text-lg text-amber-900 mb-3 flex items-center gap-2">♻️ 二手车库存简览</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                        <div className="bg-white p-3 rounded-lg border border-amber-100 text-center">
                          <p className="text-[10px] text-slate-400">库存数量</p>
                          <p className="text-xl font-black text-amber-600">{usedCars.filter(c => c.status === 'stock').length} 台</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-amber-100 text-center">
                          <p className="text-[10px] text-slate-400">展厅状态</p>
                          <p className={'text-xl font-black ' + (usedCarShowroom.built ? 'text-green-600' : 'text-red-600')}>{usedCarShowroom.built ? `Lv.${usedCarShowroom.level}` : '未建设'}</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-amber-100 text-center">
                          <p className="text-[10px] text-slate-400">库存总值</p>
                          <p className="text-xl font-black text-green-600">
                            {formatMoney(usedCars.filter(c => c.status === 'stock').reduce((sum, c) => sum + c.purchasePrice, 0))}
                          </p>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-amber-100 text-center">
                          <p className="text-[10px] text-slate-400">未整备</p>
                          <p className="text-xl font-black text-orange-600">{usedCars.filter(c => c.status === 'stock' && !c.prepped).length} 台</p>
                        </div>
                      </div>
                      <p className="text-xs text-amber-700">💡 详细管理请前往"二手车"Tab 操作整备、定价、零售/批售。</p>
                    </div>
                  </div>
                </div>
              )}

              {/* --- 厂家订货 --- */}
              {activeTab === 'order' && (
                <div>
                  <div className="mb-6 border-b border-slate-100 pb-4">
                    <h2 className="text-2xl font-bold">向厂家订货采购</h2>
                    <p className="text-slate-500 text-sm mt-1">下单后车辆需经厂家排产发运，物流周期3~7天。资金不足时可使用银行库存融资。</p>
                  </div>

                  {/* 在途订单面板 */}
                  {pendingOrders.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">
                      <h3 className="font-bold text-amber-800 mb-3 flex items-center gap-2">🚛 在途车辆 ({pendingOrders.reduce((s,o) => s + o.quantity, 0)} 台)</h3>
                      <div className="space-y-2">
                        {pendingOrders.map(order => (
                          <div key={order.id} className="flex justify-between items-center bg-white p-3 rounded-lg border border-amber-100">
                            <div>
                              <p className="font-bold text-sm text-slate-700">{order.modelName} × {order.quantity} ({order.color}色)</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-amber-600 font-bold">
                                {order.arriveDay - day > 0 ? `${order.arriveDay - day}天后到货` : '明日到货'}
                              </p>
                              <p className="text-[10px] text-slate-400">预计D{((order.arriveDay - 1) % 30) + 1}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="space-y-6">
                    {['A5', 'A6', 'Q5'].map(series => {
                      const seriesModels = CAR_MODELS.filter(m => m.series === series);
                      return (
                        <div key={series} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                          <div className="bg-slate-100 px-5 py-3 border-b border-slate-200 flex items-center gap-2">
                            <span className="font-black text-xl text-slate-800">{series} 车系</span>
                            <span className="text-xs px-2 py-1 bg-slate-200 rounded-full text-slate-600">主打: {seriesModels[0].segment}群体</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                            {seriesModels.map(model => (
                              <div key={model.id} className="p-5 hover:bg-slate-50 transition-colors relative overflow-hidden flex flex-col">
                                <div className={'absolute top-0 right-0 w-16 h-16 -mr-8 -mt-8 rounded-full  ' + model.color + ' opacity-30'}></div>
                                <h3 className="font-bold text-lg mb-3 relative z-10">{model.trim}</h3>
                                <div className="space-y-1 text-sm text-slate-600 mb-5 relative z-10">
                                  <p className="flex justify-between"><span>提车成本:</span> <span className="font-bold text-slate-800">¥{model.baseCost.toLocaleString()}</span></p>
                                  <p className="flex justify-between"><span>厂家返利:</span> <span className="font-bold text-green-600">¥{model.rebate.toLocaleString()}</span></p>
                                  <p className="flex justify-between"><span>官方指导价:</span> <span className="text-slate-500 line-through">¥{model.msrp.toLocaleString()}</span></p>
                                </div>
                                <div className="flex flex-col gap-2 relative z-10 mt-auto">
                                  <button onClick={() => setOrderForm({ isOpen: true, model: model, quantity: 1, color: '黑', useLoan: false })} className="w-full py-2.5 bg-slate-800 text-white rounded hover:bg-slate-700 text-sm font-bold shadow-sm transition-colors">
                                    配置并采购车辆
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* --- 漏斗营销 --- */}
              {activeTab === 'marketing' && (
                <div>
                  <div className="mb-6 border-b border-slate-100 pb-4">
                    <h2 className="text-2xl font-bold flex items-center gap-2"><Icons.Funnel /> 营销活动中心</h2>
                    <p className="text-slate-500 text-sm mt-1">发起不同类型的营销活动，分层运营客户。线上投流持续获客，到店礼促到店，车展拉客流，限时促销提转化。</p>
                  </div>

                  {/* 活动卡片 */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                    {MARKETING_ACTIVITIES.map(act => {
                      const isActive = act.costType === 'daily' || marketing.activeActivities.some(a => a.activityId === act.id);
                      const activeInstance = marketing.activeActivities.find(a => a.activityId === act.id);
                      return (
                        <div key={act.id} className={'bg-gradient-to-br  ' + act.color + ' border rounded-xl p-5 relative overflow-hidden'}>
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                {act.icon} {act.name}
                                {isActive && <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-300 animate-pulse">进行中</span>}
                              </h3>
                              <p className="text-xs text-slate-600 mt-1 leading-relaxed">{act.description}</p>
                            </div>
                            <div className="text-right shrink-0 ml-3">
                              <p className="text-lg font-black text-slate-800">¥{act.cost.toLocaleString()}</p>
                              <p className="text-[10px] text-slate-500">{act.costType === 'daily' ? '/ 天' : '一次性'}</p>
                            </div>
                          </div>

                          {act.costType === 'daily' ? (
                            /* 线上投流：预算滑块 */
                            <div className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-sm border">
                              <span className="text-slate-500 font-bold text-sm">¥</span>
                              <input type="number" min="0" max="50000" value={marketing.budget} onChange={(e) => { const v = parseInt(e.target.value, 10) || 0; setMarketing(m => ({...m, budget: Math.max(0, Math.min(50000, v))})); }} className="w-full text-xl font-bold text-slate-800 focus:outline-none" />
                              <span className="text-slate-400 text-sm pr-2 whitespace-nowrap">/ 天</span>
                            </div>
                          ) : (
                            /* 一次性活动：发起按钮 */
                            <button
                              onClick={() => launchActivity(act.id)}
                              disabled={isActive || finance.cash < act.cost}
                              className={'w-full py-2.5 text-white font-bold rounded-lg shadow disabled:opacity-40 disabled:cursor-not-allowed transition-all  ' + act.btnColor}
                            >
                              {isActive ? `${act.icon} 进行中 (剩${activeInstance?.endDay - day}天)` : finance.cash < act.cost ? '资金不足' : `发起${act.name}`}
                            </button>
                          )}

                          {act.duration > 0 && !isActive && (
                            <p className="text-[10px] text-slate-500 mt-2 text-center">活动持续 {act.duration} 天</p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* AI 营销专家 */}
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl p-5 mb-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-20 text-indigo-500"><Icons.Sparkles /></div>
                    <div className="relative z-10">
                      <h3 className="font-bold text-indigo-900 mb-1 flex items-center gap-2">✨ AI 营销专家写爆款文案</h3>
                      <p className="text-sm text-indigo-700 mb-3">AI 根据实时库存撰写广告，立即获取大批意向客户。</p>
                      {aiAdCopy && <div className="bg-white p-3 rounded-lg border border-indigo-200 shadow-sm mb-3 text-sm text-slate-700 whitespace-pre-wrap">{aiAdCopy}</div>}
                      <button onClick={handleGenerateAIAd} disabled={isGeneratingAd || inventory.length === 0} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                        {isGeneratingAd ? '🤖 AI 创作中...' : (inventory.length === 0 ? '库存为空' : '✨ ¥5,000 让 AI 策划活动')}
                      </button>
                    </div>
                  </div>

                  {/* 进行中活动 */}
                  {marketing.activeActivities.length > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                      <h3 className="font-bold text-green-800 mb-2 flex items-center gap-2">🎯 进行中的活动</h3>
                      <div className="space-y-2">
                        {marketing.activeActivities.map(act => (
                          <div key={act.id} className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-green-100">
                            <span className="text-sm font-bold text-slate-700">{act.icon} {act.name}</span>
                            <span className="text-xs font-bold text-green-600">剩余 {act.endDay - day} 天</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 客户分层漏斗 */}
                  <h3 className="font-bold text-slate-700 mb-4">客户分层漏斗</h3>
                  <div className="relative pt-4 pb-8 max-w-md mx-auto">
                    <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-full flex flex-col items-center opacity-10 pointer-events-none justify-center gap-1">
                      <div className="w-full h-1/5 bg-blue-500 rounded-t-xl"></div>
                      <div className="w-11/12 h-1/5 bg-indigo-500 rounded-xl"></div>
                      <div className="w-4/5 h-1/5 bg-violet-500 rounded-xl"></div>
                      <div className="w-3/5 h-1/5 bg-green-500 rounded-b-xl"></div>
                    </div>
                    
                    <div className="relative z-10 space-y-5">
                      {/* 线索池 */}
                      <div className="bg-white border-2 border-slate-200 rounded-lg p-4 text-center shadow-sm relative">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">📞 线索池 (Leads)</p>
                        <p className="text-3xl font-black text-blue-600">{marketing.leads} <span className="text-sm font-normal text-slate-500">待跟进</span></p>
                        <p className="text-xs text-slate-400 mt-1">本月累计获取: {monthlyStats.leads} {monthlyStats.recoveredLeads > 0 && <span className="text-emerald-500">(含老客回收 {monthlyStats.recoveredLeads})</span>}</p>
                        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-slate-300 text-lg">↓</div>
                      </div>
                      {/* DCC邀约到店 */}
                      <div className="bg-white border-2 border-slate-200 rounded-lg p-4 text-center shadow-sm w-11/12 mx-auto relative">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">📞 DCC邀约到店</p>
                        <p className="text-2xl font-black text-indigo-600">{monthlyStats.dccWalkIns || 0} <span className="text-sm font-normal text-slate-500">批</span></p>
                        <p className="text-xs text-slate-400 mt-1">邀约率: {monthlyStats.leads > 0 ? ((monthlyStats.dccWalkIns / monthlyStats.leads) * 100).toFixed(1) : 0}% | DCC专员: {dccCount}人</p>
                        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-slate-300 text-lg">↓</div>
                      </div>
                      {/* 自然进店 */}
                      <div className="bg-white border-2 border-slate-200 rounded-lg p-4 text-center shadow-sm w-4/5 mx-auto relative">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">🚶 自然进店客流</p>
                        <p className="text-2xl font-black text-violet-600">{monthlyStats.naturalWalkIns || 0} <span className="text-sm font-normal text-slate-500">批</span></p>
                        <p className="text-xs text-slate-400 mt-1">展厅车型多样性 + 店级加成</p>
                        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-slate-300 text-lg">↓</div>
                      </div>
                      {/* 成交 */}
                      <div className="bg-white border-2 border-green-200 rounded-lg p-4 text-center shadow-sm w-3/5 mx-auto">
                        <p className="text-xs font-bold text-green-600 uppercase tracking-widest mb-1">✅ 销售成交</p>
                        <p className="text-3xl font-black text-green-600">{monthlyStats.sales} <span className="text-sm font-normal text-slate-500">台</span></p>
                        <p className="text-xs text-slate-400 mt-1">转化率: {monthlyStats.walkIns > 0 ? ((monthlyStats.sales / monthlyStats.walkIns) * 100).toFixed(1) : 0}% | 接待上限: {salesCount * 5}批/天</p>
                      </div>
                    </div>
                  </div>

                  {/* 本月营销支出汇总 */}
                  <div className="mt-6 bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <h3 className="font-bold text-slate-700 mb-3">本月营销支出汇总</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                      <div className="bg-white p-2 rounded border"><p className="text-[10px] text-slate-400">投流支出</p><p className="font-bold text-sm text-blue-600">{formatMoney(monthlyStats.marketingCost - (monthlyStats.activitySpend || 0))}</p></div>
                      <div className="bg-white p-2 rounded border"><p className="text-[10px] text-slate-400">活动支出</p><p className="font-bold text-sm text-amber-600">{formatMoney(monthlyStats.activitySpend || 0)}</p></div>
                      <div className="bg-white p-2 rounded border"><p className="text-[10px] text-slate-400">营销总支出</p><p className="font-bold text-sm text-red-600">{formatMoney(monthlyStats.marketingCost)}</p></div>
                      <div className="bg-white p-2 rounded border"><p className="text-[10px] text-slate-400">老客回收线索</p><p className="font-bold text-sm text-emerald-600">{monthlyStats.recoveredLeads || 0} 条</p></div>
                    </div>
                  </div>
                </div>
              )}

              {/* --- 衍生与财务 --- */}
              {activeTab === 'derivative' && (
                <div className="animate-fade-in">
                  <div className="mb-6 border-b border-slate-100 pb-4 flex justify-between items-end">
                    <div>
                      <h2 className="text-2xl font-bold flex items-center gap-2"><Icons.Shield /> 衍生业务与财务管理</h2>
                      <p className="text-slate-500 text-sm mt-1">制定衍生业务采购策略，核算本月财务盈亏损益 (GP1/GP2/GP3)。</p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 mb-6 shadow-sm">
                    <h3 className="font-bold text-lg text-blue-900 mb-1 flex items-center gap-2"><Icons.Shield /> 衍生业务采购策略 (高毛利板块)</h3>
                    <p className="text-xs text-blue-700 mb-4">前端卖车往往倒挂亏本，必须配合销售衍生业务来弥补毛利。根据厂家政策合理分配原厂件比例。</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                      <div className="bg-white rounded-lg p-4 border border-blue-100 shadow-sm">
                        <h4 className="font-bold text-slate-800 mb-2">保险代理业务</h4>
                        <p className="text-xs text-slate-500 leading-relaxed mb-3 h-10">强制合作主流保险公司。渗透率稳定在 80%，保司固定返佣 25%。</p>
                        <div className="w-full py-2 bg-slate-100 text-slate-500 text-sm font-bold text-center rounded">策略固定 (无法更改)</div>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-blue-100 shadow-sm">
                        <h4 className="font-bold text-slate-800 mb-2">精品装潢采购</h4>
                        <p className="text-xs text-slate-500 leading-relaxed mb-3 h-10">原厂精品信任度高但毛利低；三方副厂件难推销但利润极高。</p>
                        <div className="flex bg-slate-100 p-1 rounded-lg">
                          <button onClick={() => handleStrategyChange('accessories', 'OEM')} className={'flex-1 text-sm py-1.5 rounded-md font-bold transition-all  ' + (strategy.accessories === 'OEM' ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:bg-slate-200')}>原厂采购</button>
                          <button onClick={() => handleStrategyChange('accessories', '3RD')} className={'flex-1 text-sm py-1.5 rounded-md font-bold transition-all  ' + (strategy.accessories === '3RD' ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:bg-slate-200')}>第三方采购</button>
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-blue-100 shadow-sm">
                        <h4 className="font-bold text-slate-800 mb-2">延长保修采购</h4>
                        <p className="text-xs text-slate-500 leading-relaxed mb-3 h-10">原厂延保客单价高客户易接受；三方延保难推销但利润率夸张。</p>
                        <div className="flex bg-slate-100 p-1 rounded-lg">
                          <button onClick={() => handleStrategyChange('warranty', 'OEM')} className={'flex-1 text-sm py-1.5 rounded-md font-bold transition-all  ' + (strategy.warranty === 'OEM' ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:bg-slate-200')}>原厂延保</button>
                          <button onClick={() => handleStrategyChange('warranty', '3RD')} className={'flex-1 text-sm py-1.5 rounded-md font-bold transition-all  ' + (strategy.warranty === '3RD' ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:bg-slate-200')}>第三方延保</button>
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4 border border-blue-100 shadow-sm md:col-span-3 mt-2">
                        <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2"><Icons.Bank /> 银企关系与动态授信</h4>
                        <p className="text-sm text-slate-500 mb-3">银行是"晴天送伞、雨天收伞"。您的库存融资授信额度将在每月最后一天重新评估，取决于您的【展厅硬件级别】、【上月营业收入】与【账上自有资金】。</p>
                        <div className="flex flex-col md:flex-row justify-between items-center bg-slate-50 p-4 rounded-lg border border-slate-200 gap-4">
                          <div className="flex-1">
                            <p className="text-xs text-slate-500 mb-1">当前评估公式</p>
                            <p className="text-sm font-bold text-slate-700">基础800万 + (展厅Lv × 200万) + (上月营收 × 40%) + (账上现金 × 30%)</p>
                          </div>
                          <div className="flex-1 text-center md:text-right">
                            <p className="text-xs text-slate-500 mb-1">本月生效可用额度</p>
                            <p className="text-2xl font-black text-blue-600">{formatMoney(finance.creditLimit)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6 shadow-sm">
                    <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
                      <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><Icons.Wallet /> 本月财务损益表 (GP1/GP2/GP3)</h3>
                      <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-bold border border-blue-100">随日常经营实时更新</span>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                        <div className="flex justify-between items-center text-sm mb-2"><span className="text-slate-500">新车营业收入</span><span className="font-bold text-slate-800">{formatMoney(monthlyStats.revenue)}</span></div>
                        <div className="flex justify-between items-center text-sm mb-2"><span className="text-slate-500">新车营业成本</span><span className="font-bold text-red-500">-{formatMoney(monthlyStats.cogs)}</span></div>
                        <div className="pt-2 border-t border-slate-200 flex justify-between items-center mb-3"><span className="font-bold text-slate-700">GP1 (新车进销差)</span><span className={'text-lg font-bold  ' + (gp1 >= 0 ? 'text-green-600' : 'text-red-600')}>{formatMoney(gp1)}</span></div>
                        <div className="flex justify-between items-center text-sm mb-3"><span className="text-slate-500">预期最高返利池 (基准值)</span><span className="font-bold text-green-500">+{formatMoney(monthlyStats.baseRebatesPool)}</span></div>
                        <div className="pt-2 border-t border-slate-200 flex justify-between items-center"><span className="font-bold text-slate-800">GP2 (进销差+返利)</span><span className={'text-xl font-black  ' + (gp2 >= 0 ? 'text-green-600' : 'text-red-600')}>{formatMoney(gp2)}</span></div>
                      </div>
                      <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                        <div className="flex justify-between items-center text-sm mb-2"><span className="text-blue-800 font-medium">衍生业务总收入 (保/延/精)</span><span className="font-bold text-blue-800">+{formatMoney(monthlyStats.derivativeRevenue)}</span></div>
                        <div className="flex justify-between items-center text-sm mb-3"><span className="text-blue-800 font-medium">衍生业务总成本</span><span className="font-bold text-red-400">-{formatMoney(monthlyStats.derivativeCost)}</span></div>
                        <div className="pt-3 border-t border-blue-200 flex justify-between items-center"><span className="font-bold text-blue-900">GP3 (全业务综合毛利)</span><span className={'text-xl font-black  ' + (gp3 >= 0 ? 'text-green-600' : 'text-red-600')}>{formatMoney(gp3)}</span></div>
                        <div className="mt-3 pt-3 border-t border-blue-100 flex justify-between items-center text-sm"><span className="text-blue-800 font-medium">金融按揭佣金</span><span className="font-bold text-green-600">+{formatMoney(monthlyStats.financeCommission)}</span></div>
                      </div>
                      <div className="bg-orange-50/30 p-4 rounded-lg border border-orange-100">
                        <div className="grid grid-cols-2 gap-x-8 gap-y-2 mb-3">
                          <div className="flex justify-between items-center text-sm"><span className="text-slate-500">土地租金</span><span className="font-bold text-orange-500">-{formatMoney(monthlyStats.rent)}</span></div>
                          <div className="flex justify-between items-center text-sm"><span className="text-slate-500">折旧摊销</span><span className="font-bold text-orange-500">-{formatMoney(monthlyStats.depreciation)}</span></div>
                          <div className="flex justify-between items-center text-sm"><span className="text-slate-500">人工薪酬</span><span className="font-bold text-orange-500">-{formatMoney(monthlyStats.labor)}</span></div>
                          <div className="flex justify-between items-center text-sm"><span className="text-slate-500">营销投流</span><span className="font-bold text-orange-500">-{formatMoney(monthlyStats.marketingCost)}</span></div>
                          <div className="flex justify-between items-center text-sm"><span className="text-slate-500">金融利息</span><span className="font-bold text-orange-500">-{formatMoney(monthlyStats.financeCost)}</span></div>
                          <div className="flex justify-between items-center text-sm"><span className="text-slate-500">仓储成本</span><span className="font-bold text-orange-500">-{formatMoney(monthlyStats.storageCost || 0)}</span></div>
                          <div className="flex justify-between items-center text-sm"><span className="text-slate-500">售后毛利</span><span className={'font-bold  ' + (monthlyStats.afterSalesRevenue - monthlyStats.afterSalesCost >= 0 ? 'text-green-600' : 'text-red-600')}>{monthlyStats.afterSalesRevenue - monthlyStats.afterSalesCost >= 0 ? '+' : ''}{formatMoney(monthlyStats.afterSalesRevenue - monthlyStats.afterSalesCost)}</span></div>
                          <div className="flex justify-between items-center text-sm col-span-2 border-t border-orange-100 pt-1"><span className="text-slate-500 font-bold">OPEX 总计</span><span className="font-bold text-red-600">-{formatMoney(opex)}</span></div>
                        </div>
                        <div className="pt-3 border-t-2 border-orange-200 flex justify-between items-center">
                          <span className="font-bold text-lg text-slate-800">预期经营净利润 (Net Profit)</span>
                          <span className={'text-2xl font-black  ' + (netProfit >= 0 ? 'text-green-600' : 'text-red-600')}>{formatMoney(netProfit)}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 mt-3 text-center">注：此净利润仅为理论预期，月底返利池的实际下发金额会受当月销量任务达成率的影响产生大幅波动。</p>
                  </div>

                  {/* 财务流水明细 */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                    <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
                      <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">📖 每日财务流水明细</h3>
                      <span className="text-xs text-slate-400">本月共 {dailyLedger.filter(l => l.day > (month - 1) * 30).length} 天记录</span>
                    </div>
                    <div className="max-h-80 overflow-y-auto space-y-3" style={{ scrollbarWidth: 'thin' }}>
                      {dailyLedger.length === 0 && <p className="text-sm text-slate-400 text-center py-8">暂无流水记录，开始经营后将自动记录每日收支。</p>}
                      {[...dailyLedger].reverse().filter(l => l.day > (month - 1) * 30).map(entry => {
                        const dayNet = entry.items.reduce((sum, i) => sum + (i.type === 'pending' ? 0 : i.amount), 0);
                        return (
                          <div key={entry.day} className="border border-slate-100 rounded-lg p-3 hover:bg-slate-50 transition-colors">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-xs font-bold text-slate-500">D{((entry.day - 1) % 30) + 1}</span>
                              <span className={'text-xs font-bold  ' + (dayNet >= 0 ? 'text-green-600' : 'text-red-600')}>
                                当日净额: {dayNet >= 0 ? '+' : ''}{formatMoney(dayNet)}
                              </span>
                            </div>
                            <div className="space-y-1">
                              {entry.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center text-xs">
                                  <span className={' ' + (item.type === 'income' ? 'text-green-700' : item.type === 'pending' ? 'text-blue-600' : 'text-slate-500')}>
                                    {item.type === 'income' ? '📈' : item.type === 'pending' ? '⏳' : '📉'} {item.label}
                                  </span>
                                  <span className={'font-bold  ' + (item.type === 'income' ? 'text-green-600' : item.type === 'pending' ? 'text-blue-500' : 'text-red-500')}>
                                    {item.type === 'pending' ? '+' : ''}{item.amount >= 0 ? '+' : ''}{formatMoney(item.amount)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* --- 人事招聘 --- */}
              {activeTab === 'staff' && (
                <div className="animate-fade-in">
                  <div className="mb-6 border-b border-slate-100 pb-4 flex justify-between items-end">
                    <div>
                      <h2 className="text-2xl font-bold flex items-center gap-2"><Icons.Users /> 人事与设施管理</h2>
                      <p className="text-slate-500 text-sm mt-1">能力越高越可能被竞店挖走，留任津贴可大幅降低流失风险。</p>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700 max-w-xs">
                      <p className="font-bold mb-1">⚠️ 流失风险规则</p>
                      <p>能力≥60: 2%/天 | ≥80: 4%/天 | ≥95: 6%/天</p>
                      <p>留任津贴(工资翻倍)可将风险降至1/7</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="border border-slate-200 rounded-xl p-5 bg-gradient-to-br from-slate-50 to-white">
                      <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Icons.Store /> 展厅与仓储设施</h3>
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <p className="text-sm text-slate-500">当前级别: <span className="font-bold text-slate-800">Lv.{facility.level} 标准店</span></p>
                          <p className="text-sm text-slate-500">展厅展位: <span className="font-bold text-blue-600">{facility.showroomSpots} 个</span></p>
                          <p className="text-sm text-slate-500">仓储容量: <span className="font-bold text-amber-600">{facility.warehouseCapacity} 台</span></p>
                        </div>
                        <div className="text-right text-xs text-slate-400">
                          <p>升级效果: 展位+1, 仓储+8</p>
                          <p>展车提升转化率; 仓储车¥50/天</p>
                        </div>
                      </div>
                      <button onClick={upgradeFacility} className="w-full py-3 bg-slate-800 text-white font-medium rounded-lg hover:bg-slate-700 transition-colors">升级 ({formatMoney(facility.level * 100000)})</button>
                    </div>

                    {/* DCC 团队 */}
                    <div className="border border-slate-200 rounded-xl p-5">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-bold text-lg">📞 DCC 邀约团队</h3>
                        <button onClick={() => hireStaff('dcc')} className="px-3 py-1.5 border border-slate-300 rounded text-xs font-bold hover:bg-slate-50">+招聘</button>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="bg-slate-50 p-2 rounded text-center"><p className="text-[10px] text-slate-400">人数/日薪</p><p className="font-bold text-sm">{dccCount} / ¥{staff.dcc.salary}</p></div>
                        <div className="bg-slate-50 p-2 rounded text-center"><p className="text-[10px] text-slate-400">平均能力</p><p className="font-bold text-sm text-indigo-600">{dccAvgSkill}</p></div>
                      </div>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {staff.dcc.members.length === 0 && <p className="text-xs text-slate-400 text-center py-4">团队已空，请招聘新人</p>}
                        {staff.dcc.members.map(member => {
                          const risk = member.skill >= 95 ? 6 : member.skill >= 80 ? 4 : member.skill >= 60 ? 2 : 0.5;
                          const effectiveRisk = member.retained ? (risk * 0.15).toFixed(1) : risk;
                          const riskLevel = risk >= 4 ? 'high' : risk >= 2 ? 'mid' : 'low';
                          const riskColor = riskLevel === 'high' ? 'text-red-600 bg-red-50 border-red-200' : riskLevel === 'mid' ? 'text-amber-600 bg-amber-50 border-amber-200' : 'text-green-600 bg-green-50 border-green-200';
                          return (
                            <div key={member.id} className={'p-3 rounded-lg border ' + (member.retained ? 'border-blue-200 bg-blue-50/50' : 'border-slate-100 bg-white')}>
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <div className={'w-10 h-10 rounded-full flex items-center justify-center text-sm font-black text-white shadow-sm ' + (member.skill >= 80 ? 'bg-indigo-500' : member.skill >= 60 ? 'bg-blue-400' : 'bg-slate-400')}>
                                    {member.nickname.slice(0, 1)}
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-slate-800">{member.nickname}</p>
                                    <p className="text-[10px] text-slate-400">DCC专员 · 日薪 ¥{staff.dcc.salary}{member.retained ? ' +留任¥' + staff.dcc.salary : ''}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className={'text-[10px] font-bold px-1.5 py-0.5 rounded border  ' + riskColor}>
                                    流失{effectiveRisk}%
                                  </span>
                                  <button
                                    onClick={() => toggleRetention('dcc', member.id)}
                                    className={`text-[10px] font-bold px-2 py-1 rounded transition-colors ${
                                      member.retained
                                        ? 'bg-blue-100 text-blue-700 border border-blue-300'
                                        : risk >= 2 ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100' : 'bg-slate-50 text-slate-400 border border-slate-200'
                                    }`}
                                  >
                                    {member.retained ? '🔒留任' : '留任'}
                                  </button>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                                  <div className={'h-full rounded-full transition-all ' + (member.skill >= 80 ? 'bg-indigo-500' : member.skill >= 60 ? 'bg-blue-400' : 'bg-slate-300')} style={{ width: member.skill + '%' }}></div>
                                </div>
                                <span className="text-[10px] font-bold text-slate-500 w-7 text-right">{member.skill}</span>
                                <button
                                  onClick={() => trainMember('dcc', member.id)}
                                  disabled={member.skill >= 100}
                                  className="text-[10px] font-bold px-2 py-1 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                                >
                                  培训¥2万
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* 销售顾问团队 */}
                    <div className="border border-slate-200 rounded-xl p-5 lg:col-span-2">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-bold text-lg">🤝 展厅销售顾问</h3>
                        <button onClick={() => hireStaff('sales')} className="px-3 py-1.5 border border-slate-300 rounded text-xs font-bold hover:bg-slate-50">+招聘</button>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                        <div className="bg-slate-50 p-2 rounded text-center"><p className="text-[10px] text-slate-400">人数/日薪</p><p className="font-bold text-sm">{salesCount} / ¥{staff.sales.salary}</p></div>
                        <div className="bg-slate-50 p-2 rounded text-center"><p className="text-[10px] text-slate-400">平均能力</p><p className="font-bold text-sm text-indigo-600">{salesAvgSkill}</p></div>
                        <div className="bg-slate-50 p-2 rounded text-center"><p className="text-[10px] text-slate-400">留任人数</p><p className="font-bold text-sm text-blue-600">{staff.sales.members.filter(m => m.retained).length + staff.dcc.members.filter(m => m.retained).length} 人</p></div>
                        <div className="bg-slate-50 p-2 rounded text-center"><p className="text-[10px] text-slate-400">留任日支出</p><p className="font-bold text-sm text-orange-600">{formatMoney((staff.sales.members.filter(m => m.retained).length * staff.sales.salary) + (staff.dcc.members.filter(m => m.retained).length * staff.dcc.salary))}</p></div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {staff.sales.members.length === 0 && <p className="text-xs text-slate-400 text-center py-4 col-span-3">团队已空，请招聘新人</p>}
                        {staff.sales.members.map(member => {
                          const risk = member.skill >= 95 ? 6 : member.skill >= 80 ? 4 : member.skill >= 60 ? 2 : 0.5;
                          const effectiveRisk = member.retained ? (risk * 0.15).toFixed(1) : risk;
                          const riskLevel = risk >= 4 ? 'high' : risk >= 2 ? 'mid' : 'low';
                          const riskColor = riskLevel === 'high' ? 'text-red-600 bg-red-50 border-red-200' : riskLevel === 'mid' ? 'text-amber-600 bg-amber-50 border-amber-200' : 'text-green-600 bg-green-50 border-green-200';
                          return (
                            <div key={member.id} className={'p-3 rounded-lg border ' + (member.retained ? 'border-blue-200 bg-blue-50/50' : 'border-slate-100 bg-white')}>
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <div className={'w-10 h-10 rounded-full flex items-center justify-center text-sm font-black text-white shadow-sm ' + (member.skill >= 80 ? 'bg-indigo-500' : member.skill >= 60 ? 'bg-blue-400' : 'bg-slate-400')}>
                                    {member.nickname.slice(0, 1)}
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-slate-800">{member.nickname}</p>
                                    <p className="text-[10px] text-slate-400">销售顾问 · 日薪 ¥{staff.sales.salary}{member.retained ? ' +留任¥' + staff.sales.salary : ''}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className={'text-[10px] font-bold px-1.5 py-0.5 rounded border  ' + riskColor}>
                                    {effectiveRisk}%
                                  </span>
                                  <button
                                    onClick={() => toggleRetention('sales', member.id)}
                                    className={`text-[10px] font-bold px-2 py-1 rounded transition-colors ${
                                      member.retained
                                        ? 'bg-blue-100 text-blue-700 border border-blue-300'
                                        : risk >= 2 ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100' : 'bg-slate-50 text-slate-400 border border-slate-200'
                                    }`}
                                  >
                                    {member.retained ? '🔒' : '留任'}
                                  </button>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                                  <div className={'h-full rounded-full transition-all ' + (member.skill >= 80 ? 'bg-indigo-500' : member.skill >= 60 ? 'bg-blue-400' : 'bg-slate-300')} style={{ width: member.skill + '%' }}></div>
                                </div>
                                <span className="text-[10px] font-bold text-slate-500 w-7 text-right">{member.skill}</span>
                                <button
                                  onClick={() => trainMember('sales', member.id)}
                                  disabled={member.skill >= 100}
                                  className="text-[10px] font-bold px-2 py-1 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                                >
                                  培训¥2万
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* --- 二手车业务 --- */}
              {activeTab === 'usedcar' && (
                <div className="animate-fade-in">
                  <div className="mb-6 border-b border-slate-100 pb-4 flex justify-between items-end">
                    <div>
                      <h2 className="text-2xl font-bold flex items-center gap-2"><span className="text-2xl">♻️</span> 二手车业务管理</h2>
                      <p className="text-slate-500 text-sm mt-1">展厅建设 → 收车整备 → 定价零售，打造二手车利润中心。</p>
                    </div>
                  </div>

                  {/* 展厅建设/升级 */}
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-5 mb-6 shadow-sm">
                    <h3 className="font-bold text-lg text-indigo-900 mb-3 flex items-center gap-2">🏗️ 二手车展厅</h3>
                    {!usedCarShowroom.built ? (
                      <div className="text-center py-4">
                        <p className="text-sm text-slate-600 mb-3">未建设二手车展厅。建设后方可整备零售二手车，否则只能批售。</p>
                        <button onClick={handleBuildShowroom} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold transition-colors">
                          建设展厅（¥150,000）
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div className="bg-white p-3 rounded-lg border border-indigo-100 text-center">
                            <p className="text-[10px] text-slate-400">展厅等级</p>
                            <p className="text-xl font-black text-indigo-600">Lv.{usedCarShowroom.level}</p>
                          </div>
                          <div className="bg-white p-3 rounded-lg border border-indigo-100 text-center">
                            <p className="text-[10px] text-slate-400">展厅容量</p>
                            <p className="text-xl font-black text-indigo-600">{usedCarShowroom.capacity} 台</p>
                          </div>
                          <div className="bg-white p-3 rounded-lg border border-indigo-100 text-center">
                            <p className="text-[10px] text-slate-400">在库车辆</p>
                            <p className={'text-xl font-black ' + (usedCars.filter(c => c.status === 'stock').length > usedCarShowroom.capacity ? 'text-red-600' : 'text-green-600')}>{usedCars.filter(c => c.status === 'stock').length} 台</p>
                          </div>
                        </div>
                        {usedCarShowroom.level < 3 && (
                          <div className="text-center">
                            <button onClick={handleUpgradeShowroom} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-sm transition-colors">
                              升级至Lv.{usedCarShowroom.level + 1}（¥80,000，容量+3）
                            </button>
                          </div>
                        )}
                        {usedCarShowroom.level >= 3 && <p className="text-center text-xs text-slate-400">展厅已达最高等级</p>}
                      </div>
                    )}
                  </div>

                  {/* 经营数据 */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-center">
                      <p className="text-[10px] text-slate-400">本月置换台数</p>
                      <p className="text-xl font-black text-blue-600">{monthlyStats.tradeInCount || 0} 台</p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-center">
                      <p className="text-[10px] text-slate-400">置换补贴</p>
                      <p className="text-xl font-black text-amber-600">{formatMoney(monthlyStats.tradeInSubsidy)}</p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-center">
                      <p className="text-[10px] text-slate-400">零售利润</p>
                      <p className={'text-xl font-black ' + (usedCars.filter(c => c.status === 'retailed').reduce((s, c) => s + ((c.soldPrice || c.retailPrice) - c.purchasePrice), 0) >= 0 ? 'text-green-600' : 'text-red-600')}>{formatMoney(usedCars.filter(c => c.status === 'retailed').reduce((s, c) => s + ((c.soldPrice || c.retailPrice) - c.purchasePrice), 0))}</p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-center">
                      <p className="text-[10px] text-slate-400">批售亏损</p>
                      <p className="text-xl font-black text-red-600">{formatMoney(usedCars.filter(c => c.status === 'wholesaled' || c.status === 'forcedWholesale').reduce((s, c) => s + (c.purchasePrice - (c.forcedPrice || Math.round(c.purchasePrice * 0.95))), 0))}</p>
                    </div>
                  </div>

                  {/* 二手车库存 */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm mb-6">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">📦 二手车库存 ({usedCars.filter(c => c.status === 'stock').length}台在库{usedCarShowroom.built ? ` / 展厅${usedCarShowroom.capacity}台` : ''})</h3>
                    {usedCars.filter(c => c.status === 'stock').length === 0 && <p className="text-sm text-slate-400 text-center py-4">暂无二手车库存。销售置换客户即可获得二手车！</p>}
                    <div className="space-y-2">
                      {usedCars.filter(c => c.status === 'stock').map(uc => {
                        const ageColor = uc.stockDays >= 60 ? 'text-red-600' : uc.stockDays >= 30 ? 'text-amber-600' : 'text-slate-700';
                        const ageIcon = uc.stockDays >= 60 ? '🔴' : uc.stockDays >= 30 ? '🟠' : '';
                        const ageWarning = uc.stockDays >= 90 ? '⚠️超90天即将强制批售！' : uc.stockDays >= 60 ? '⚠️库龄过高' : '';
                        const sellPrice = uc.customRetailPrice || uc.retailPrice;
                        const priceRatio = sellPrice / uc.purchasePrice;
                        let successRate = usedCarShowroom.built && uc.prepped ? 0.55 : usedCarShowroom.built ? 0.30 : 0.20;
                        if (priceRatio > 1.2) successRate -= Math.floor((priceRatio - 1.2) / 0.1) * 0.05;
                        successRate = Math.max(0.15, Math.min(0.65, successRate));
                        return (
                          <div key={uc.id} className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <p className="font-bold text-sm text-slate-800">
                                  {uc.brand}
                                  <span className={'text-xs ml-1 ' + ageColor}>{ageIcon}库龄{uc.stockDays}天</span>
                                  {ageWarning && <span className="text-xs text-red-500 ml-1">{ageWarning}</span>}
                                  {!uc.prepped && <span className="text-xs text-orange-500 ml-1">🔧未整备</span>}
                                  {uc.prepped && <span className="text-xs text-green-600 ml-1">✅已整备</span>}
                                </p>
                                <p className="text-xs text-slate-400">收车¥{uc.purchasePrice.toLocaleString()} / 批售价¥{Math.round(uc.purchasePrice * 0.95).toLocaleString()}</p>
                              </div>
                              <div className="flex gap-2">
                                {!uc.prepped && usedCarShowroom.built && (
                                  <button onClick={() => handlePrepUsedCar(uc.id)} className="text-xs font-bold px-3 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors">整备¥3千</button>
                                )}
                                {usedCarShowroom.built && (
                                  <button onClick={() => handleUsedCarRetail(uc.id)} className="text-xs font-bold px-3 py-1 rounded bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors" title="零售成功率{Math.round(successRate*100)}%">零售({Math.round(successRate*100)}%)</button>
                                )}
                                <button onClick={() => handleUsedCarWholesale(uc.id)} className="text-xs font-bold px-3 py-1 rounded bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors">批售</button>
                              </div>
                            </div>
                            {usedCarShowroom.built && uc.prepped && (
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-slate-500">零售价:</span>
                                <input
                                  type="number"
                                  value={sellPrice}
                                  onChange={(e) => handleUsedCarPriceChange(uc.id, e.target.value)}
                                  min={Math.round(uc.purchasePrice * 1.0)}
                                  max={Math.round(uc.purchasePrice * 1.5)}
                                  step={1000}
                                  className="w-28 text-xs px-2 py-1 border border-slate-200 rounded bg-white"
                                />
                                <span className="text-xs text-slate-400">
                                  (范围: ¥{Math.round(uc.purchasePrice * 1.0).toLocaleString()} ~ ¥{Math.round(uc.purchasePrice * 1.5).toLocaleString()})
                                </span>
                                <span className={'text-xs font-bold ' + (sellPrice > uc.purchasePrice ? 'text-green-600' : 'text-red-600')}>
                                  预估利润: ¥{(sellPrice - uc.purchasePrice).toLocaleString()}
                                </span>
                              </div>
                            )}
                            {!usedCarShowroom.built && (
                              <p className="text-xs text-slate-400 mt-1">💡 建设展厅后可整备、定价零售</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 已处置的二手车 */}
                  {usedCars.filter(c => c.status !== 'stock').length > 0 && (
                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                      <h3 className="font-bold text-lg mb-3 flex items-center gap-2">📋 处置记录</h3>
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {usedCars.filter(c => c.status !== 'stock').map(uc => (
                          <div key={uc.id} className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 p-2 rounded">
                            <span>{uc.brand}</span>
                            <span>
                              {uc.status === 'retailed' ? `✅ 已零售 ¥${((uc.soldPrice || uc.retailPrice) || 0).toLocaleString()}` :
                               uc.status === 'forcedWholesale' ? `⚠️ 强制批售 ¥${(uc.forcedPrice || 0).toLocaleString()}` :
                               `🚚 已批售 ¥${Math.round(uc.purchasePrice * 0.95).toLocaleString()}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* --- 售后服务与续保 --- */}
              {activeTab === 'aftersales' && (
                <div className="animate-fade-in">
                  <div className="mb-6 border-b border-slate-100 pb-4 flex justify-between items-end">
                    <div>
                      <h2 className="text-2xl font-bold flex items-center gap-2"><span className="text-2xl">🔧</span> 售后服务与续保管理</h2>
                      <p className="text-slate-500 text-sm mt-1">技师维修保养 + 续保佣金，占4S店利润60%+。二手车业务请前往"二手车"Tab。</p>
                    </div>
                  </div>

                  {/* 技师团队 */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-lg">🔧 售后技师团队</h3>
                      <button onClick={handleHireTech} disabled={afterSales.technicians.length >= 6} className="px-3 py-1.5 border border-slate-300 rounded text-xs font-bold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                        +招聘(¥3,000)
                      </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                      <div className="bg-slate-50 p-2 rounded text-center"><p className="text-[10px] text-slate-400">人数/日薪</p><p className="font-bold text-sm">{techCount} / ¥{afterSales.salary}</p></div>
                      <div className="bg-slate-50 p-2 rounded text-center"><p className="text-[10px] text-slate-400">平均能力</p><p className="font-bold text-sm text-indigo-600">{techAvgSkill}</p></div>
                      <div className="bg-slate-50 p-2 rounded text-center"><p className="text-[10px] text-slate-400">今日售后单</p><p className="font-bold text-sm text-green-600">{(monthlyStats.afterSalesRevenue - monthlyStats.afterSalesCost) > 0 ? '盈利' : '暂无'}</p></div>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {afterSales.technicians.length === 0 && <p className="text-xs text-slate-400 text-center py-4">团队已空，请招聘技师</p>}
                      {afterSales.technicians.map(member => {
                        const risk = member.skill >= 95 ? 6 : member.skill >= 80 ? 4 : member.skill >= 60 ? 2 : 0.5;
                        const effectiveRisk = member.retained ? (risk * 0.15).toFixed(1) : risk;
                        const riskColor = risk >= 4 ? 'text-red-600 bg-red-50 border-red-200' : risk >= 2 ? 'text-amber-600 bg-amber-50 border-amber-200' : 'text-green-600 bg-green-50 border-green-200';
                        return (
                          <div key={member.id} className={'p-3 rounded-lg border ' + (member.retained ? 'border-blue-200 bg-blue-50/50' : 'border-slate-100 bg-white')}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className={'w-10 h-10 rounded-full flex items-center justify-center text-sm font-black text-white shadow-sm ' + (member.skill >= 80 ? 'bg-indigo-500' : member.skill >= 60 ? 'bg-blue-400' : 'bg-slate-400')}>
                                  {member.nickname.slice(0,1)}
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-slate-800">{member.nickname}</p>
                                  <p className="text-[10px] text-slate-400">售后技师 · 日薪 ¥{afterSales.salary}{member.retained ? ' +留任¥' + afterSales.salary : ''}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className={'text-[10px] font-bold px-1.5 py-0.5 rounded border ' + riskColor}>{effectiveRisk}%</span>
                                <button onClick={() => toggleTechRetention(member.id)} className={'text-[10px] font-bold px-2 py-1 rounded transition-colors ' + (member.retained ? 'bg-blue-100 text-blue-700 border border-blue-300' : risk >= 2 ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100' : 'bg-slate-50 text-slate-400 border border-slate-200')}>
                                  {member.retained ? '🔒留任' : '留任'}
                                </button>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                                <div className={'h-full rounded-full transition-all ' + (member.skill >= 80 ? 'bg-indigo-500' : member.skill >= 60 ? 'bg-blue-400' : 'bg-slate-300')} style={{ width: member.skill + '%' }}></div>
                              </div>
                              <span className="text-[10px] font-bold text-slate-500 w-7 text-right">{member.skill}</span>
                              <button onClick={() => handleTrainTech(member.id)} disabled={member.skill >= 100} className="text-[10px] font-bold px-2 py-1 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap">
                                培训¥2千
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 本月售后统计 + 续保统计 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                      <h3 className="font-bold text-lg mb-4">📊 本月售后统计</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-slate-500">售后收入</span><span className="font-bold text-green-600">{formatMoney(monthlyStats.afterSalesRevenue)}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">售后成本</span><span className="font-bold text-red-500">-{formatMoney(monthlyStats.afterSalesCost)}</span></div>
                        <div className="flex justify-between border-t pt-2"><span className="font-bold">售后毛利</span><span className={'font-bold ' + ((monthlyStats.afterSalesRevenue - monthlyStats.afterSalesCost) >= 0 ? 'text-green-600' : 'text-red-600')}>{formatMoney(monthlyStats.afterSalesRevenue - monthlyStats.afterSalesCost)}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">金融佣金</span><span className="font-bold text-green-600">+{formatMoney(monthlyStats.financeCommission)}</span></div>
                      </div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                      <h3 className="font-bold text-lg mb-4">♻️ 续保管理</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-slate-500">待续保车辆</span><span className="font-bold">{insuranceRenewals.pending}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">已续保</span><span className="font-bold text-green-600">{insuranceRenewals.renewed}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">续保佣金收入</span><span className="font-bold text-green-600">+{formatMoney(monthlyStats.insuranceRenewalRevenue)}</span></div>
                      </div>
                    </div>
                  </div>

                  {/* 二手车业务已移至独立Tab */}

                </div>
              )}

              {/* --- 返利考核 --- */}
              {activeTab === 'csi' && (
                <div className="animate-fade-in">
                  <div className="mb-6 border-b border-slate-100 pb-4">
                    <h2 className="text-2xl font-bold flex items-center gap-2">📊 CSI客户满意度管理</h2>
                    <p className="text-slate-500 text-sm mt-1">CSI直接影响销售转化率、转介绍线索和月底返利系数，是经营健康度的核心指标。</p>
                  </div>

                  {/* CSI 仪表盘 */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className={'rounded-xl p-5 text-center shadow-md border-2 ' + (csi.score >= 95 ? 'bg-green-50 border-green-300' : csi.score >= 90 ? 'bg-blue-50 border-blue-300' : csi.score >= 85 ? 'bg-amber-50 border-amber-300' : 'bg-red-50 border-red-300')}>
                      <p className="text-sm text-slate-500 mb-2">当前CSI分数</p>
                      <p className={'text-5xl font-black ' + (csi.score < 85 ? 'text-red-600' : csi.score >= 95 ? 'text-green-600' : csi.score >= 90 ? 'text-blue-600' : 'text-amber-600')}>{Math.round(csi.score)}</p>
                      <p className="text-xs text-slate-400 mt-2">满分100 · 厂家考核线90分</p>
                    </div>
                    <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between">
                      <div>
                        <p className="text-sm text-slate-500 mb-3">CSI等级与业务影响</p>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="text-green-700 font-bold">≥95 优秀</span>
                            <span>转化率+8% · 返利×1.03 · 转介绍</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-blue-700 font-bold">90-94 达标</span>
                            <span>转化率+4% · 返利×1.0</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-amber-700 font-bold">85-89 预警</span>
                            <span>转化率-3% · 返利×0.95</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-red-700 font-bold">&lt;85 危险</span>
                            <span>转化率-8% · 返利×0.85</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
                      <p className="text-sm text-slate-500 mb-3">当月投诉统计</p>
                      <div className="flex items-center gap-4 mb-3">
                        <div className="text-center">
                          <p className="text-3xl font-black text-red-600">{csi.complaints}</p>
                          <p className="text-xs text-slate-400">投诉次数</p>
                        </div>
                        <div className="text-center">
                          <p className="text-3xl font-black text-amber-600">{Math.round(csi.score) < 90 ? '⚠️' : '✅'}</p>
                          <p className="text-xs text-slate-400">考核状态</p>
                        </div>
                      </div>
                      <p className="text-xs text-slate-400">每次投诉使CSI下降3-8分，技师水平≥60可减半影响，销售水平≥60可减轻30%影响。</p>
                    </div>
                  </div>

                  {/* CSI 影响因素分析 */}
                  <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-5 mb-6 border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-lg mb-4">🔍 CSI影响因素分析</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white rounded-lg p-4 border border-slate-100">
                        <h4 className="font-bold text-sm text-slate-700 mb-2">📉 负面因素（拉低CSI）</h4>
                        <ul className="space-y-1.5 text-xs text-slate-600">
                          <li>• <span className="text-red-600 font-bold">客户投诉</span>：每天约5%概率发生，CSI下降3-8分/次</li>
                          <li>• <span className="text-red-600 font-bold">技师水平低</span>：技能&lt;60时投诉影响无法减半</li>
                          <li>• <span className="text-red-600 font-bold">销售水平低</span>：技能&lt;60时投诉影响无法减轻</li>
                        </ul>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-slate-100">
                        <h4 className="font-bold text-sm text-slate-700 mb-2">📈 正面因素（提升CSI）</h4>
                        <ul className="space-y-1.5 text-xs text-slate-600">
                          <li>• <span className="text-green-600 font-bold">自然回升</span>：无投诉时CSI每天+0.3分</li>
                          <li>• <span className="text-green-600 font-bold">高CSI转介绍</span>：CSI≥93时每天产生1-3条新线索</li>
                          <li>• <span className="text-green-600 font-bold">客户关怀</span>：花费¥2,000/次，立即+2分</li>
                          <li>• <span className="text-green-600 font-bold">售后回访</span>：花费¥1,000/次，立即+1分</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* CSI 运营操作 */}
                  <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-5 mb-6 border border-indigo-200 shadow-sm">
                    <h3 className="font-bold text-lg mb-4">🛠️ CSI改善运营</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white rounded-lg p-4 border border-indigo-100 flex flex-col justify-between">
                        <div>
                          <h4 className="font-bold text-sm text-indigo-800 mb-1">🎁 客户关怀行动</h4>
                          <p className="text-xs text-slate-500 mb-1">组织客户关怀活动（节日问候、小礼品等），提升客户好感度。</p>
                          <p className="text-xs text-indigo-600">效果：CSI +2分 · 费用：¥2,000</p>
                        </div>
                        <button
                          onClick={() => {
                            if (finance.cash < 2000) return showAlert('预算不足', '现金不足，客户关怀需要 ¥2,000！');
                            setCsi(prev => ({ ...prev, score: Math.min(100, prev.score + 2) }));
                            setFinance(prev => ({ ...prev, cash: prev.cash - 2000 }));
                            addLog('success', `🎁【客户关怀】投入¥2,000，CSI满意度+2分，当前${Math.min(100, Math.round(csi.score + 2))}分。`);
                          }}
                          className="mt-3 w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold transition-colors"
                        >投入 ¥2,000 开展关怀</button>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-indigo-100 flex flex-col justify-between">
                        <div>
                          <h4 className="font-bold text-sm text-indigo-800 mb-1">📞 售后回访计划</h4>
                          <p className="text-xs text-slate-500 mb-1">安排专人回访近期维修/购车客户，及时发现问题并补救。</p>
                          <p className="text-xs text-indigo-600">效果：CSI +1分 · 费用：¥1,000</p>
                        </div>
                        <button
                          onClick={() => {
                            if (finance.cash < 1000) return showAlert('预算不足', '现金不足，售后回访需要 ¥1,000！');
                            setCsi(prev => ({ ...prev, score: Math.min(100, prev.score + 1) }));
                            setFinance(prev => ({ ...prev, cash: prev.cash - 1000 }));
                            addLog('success', `📞【售后回访】投入¥1,000，CSI满意度+1分，当前${Math.min(100, Math.round(csi.score + 1))}分。`);
                          }}
                          className="mt-3 w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold transition-colors"
                        >投入 ¥1,000 安排回访</button>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-3 text-center">💡 提示：提升技师和销售顾问能力可从根本上减少投诉概率，是CSI的长期保障。</p>
                  </div>

                  {/* CSI 与销售转化率联动说明 */}
                  <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
                    <h3 className="font-bold text-lg mb-3">🔗 CSI如何影响销售</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50">
                            <th className="border border-slate-200 px-3 py-2 text-left">CSI区间</th>
                            <th className="border border-slate-200 px-3 py-2 text-center">转化率加成</th>
                            <th className="border border-slate-200 px-3 py-2 text-center">返利系数</th>
                            <th className="border border-slate-200 px-3 py-2 text-center">转介绍</th>
                            <th className="border border-slate-200 px-3 py-2 text-left">经营建议</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className={csi.score >= 95 ? 'bg-green-50 font-bold' : ''}>
                            <td className="border border-slate-200 px-3 py-2">≥95分 优秀</td>
                            <td className="border border-slate-200 px-3 py-2 text-center text-green-600">+8%</td>
                            <td className="border border-slate-200 px-3 py-2 text-center text-green-600">×1.03</td>
                            <td className="border border-slate-200 px-3 py-2 text-center text-green-600">每天1-3条</td>
                            <td className="border border-slate-200 px-3 py-2">保持即可，享受口碑红利</td>
                          </tr>
                          <tr className={csi.score >= 90 && csi.score < 95 ? 'bg-blue-50 font-bold' : ''}>
                            <td className="border border-slate-200 px-3 py-2">90-94 达标</td>
                            <td className="border border-slate-200 px-3 py-2 text-center text-blue-600">+4%</td>
                            <td className="border border-slate-200 px-3 py-2 text-center">×1.0</td>
                            <td className="border border-slate-200 px-3 py-2 text-center text-slate-400">—</td>
                            <td className="border border-slate-200 px-3 py-2">争取冲95，获得转介绍和返利加成</td>
                          </tr>
                          <tr className={csi.score >= 85 && csi.score < 90 ? 'bg-amber-50 font-bold' : ''}>
                            <td className="border border-slate-200 px-3 py-2">85-89 预警</td>
                            <td className="border border-slate-200 px-3 py-2 text-center text-amber-600">-3%</td>
                            <td className="border border-slate-200 px-3 py-2 text-center text-amber-600">×0.95</td>
                            <td className="border border-slate-200 px-3 py-2 text-center text-slate-400">—</td>
                            <td className="border border-slate-200 px-3 py-2">立即投入关怀/回访，提升技师能力</td>
                          </tr>
                          <tr className={csi.score < 85 ? 'bg-red-50 font-bold' : ''}>
                            <td className="border border-slate-200 px-3 py-2">&lt;85 危险</td>
                            <td className="border border-slate-200 px-3 py-2 text-center text-red-600">-8%</td>
                            <td className="border border-slate-200 px-3 py-2 text-center text-red-600">×0.85</td>
                            <td className="border border-slate-200 px-3 py-2 text-center text-slate-400">—</td>
                            <td className="border border-slate-200 px-3 py-2">紧急！卖不动+返利大缩水，必须大力改善</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'assessment' && (
                <div className="animate-fade-in">
                  <div className="mb-6 border-b border-slate-100 pb-4 flex justify-between items-end">
                    <div>
                      <h2 className="text-2xl font-bold flex items-center gap-2"><Icons.Sparkles /> 返利考核与经营诊断</h2>
                      <p className="text-slate-500 text-sm mt-1">实时监控厂家任务进度，获取 AI 经营专家的毒舌建议。</p>
                    </div>
                  </div>

                  {/* AI 顾问 */}
                  <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-5 mb-6 shadow-md border border-slate-700 flex flex-col md:flex-row items-center gap-6">
                    <div className="w-16 h-16 rounded-full bg-indigo-500 flex items-center justify-center text-white shrink-0 shadow-lg"><Icons.Sparkles /></div>
                    <div className="flex-1 text-slate-300">
                      <h3 className="text-white font-bold text-lg mb-1">✨ AI 店总经营顾问</h3>
                      <p className="text-sm italic mb-2">"{aiAdvice}"</p>
                    </div>
                    <button onClick={handleAskAIConsultant} disabled={isGeneratingAdvice} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 shrink-0">
                      {isGeneratingAdvice ? '分析中...' : '免费咨询建议'}
                    </button>
                  </div>

                  {/* 厂家商务政策 */}
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-5 mb-6 shadow-sm">
                    <h3 className="font-bold text-lg text-emerald-900 mb-3 flex items-center gap-2">📋 厂家商务政策 (M{manufacturerPolicy.policyMonth}月生效)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="bg-white p-3 rounded-lg border border-emerald-100 text-center">
                        <p className="text-[10px] text-slate-400 mb-1">返利系数</p>
                        <p className={'text-2xl font-black  ' + (manufacturerPolicy.rebateMultiplier >= 1 ? 'text-green-600' : 'text-red-600')}>×{manufacturerPolicy.rebateMultiplier.toFixed(2)}</p>
                        <p className="text-[10px] text-slate-400">{manufacturerPolicy.rebateMultiplier >= 1 ? '返利加成' : '返利缩减'}</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-emerald-100 text-center">
                        <p className="text-[10px] text-slate-400 mb-1">指导价调整</p>
                        <p className={'text-2xl font-black  ' + (manufacturerPolicy.msrpTrend >= 0 ? 'text-orange-600' : 'text-blue-600')}>{manufacturerPolicy.msrpTrend >= 0 ? '+' : ''}{manufacturerPolicy.msrpTrend.toFixed(1)}%</p>
                        <p className="text-[10px] text-slate-400">{manufacturerPolicy.msrpTrend >= 0 ? '指导价上浮' : '指导价下调'}</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-emerald-100 text-center">
                        <p className="text-[10px] text-slate-400 mb-1">最近调整</p>
                        <p className="text-xs font-bold text-slate-700 leading-tight">{manufacturerPolicy.lastChange}</p>
                      </div>
                    </div>
                    {/* 政策影响说明 */}
                    <div className="bg-white/60 p-3 rounded-lg border border-emerald-100">
                      <p className="text-xs text-slate-600 leading-relaxed">
                        💡 <b>政策关联规则：</b>达成率越高，返利系数越大（厂家奖励优秀经销商）；未达标时厂家可能加大返利促销救市，但指导价承压下调。
                        随机政策事件（新车上市/原材料涨价等）会叠加影响。二网批售价 = 动态指导价 × 90%。
                      </p>
                    </div>
                    {/* 历史政策 */}
                    {manufacturerPolicy.history.length > 1 && (
                      <div className="mt-3 max-h-32 overflow-y-auto">
                        <p className="text-[10px] font-bold text-slate-500 mb-1">政策历史</p>
                        <div className="space-y-1">
                          {[...manufacturerPolicy.history].reverse().slice(0, 6).map((h, i) => (
                            <div key={i} className="flex items-center gap-2 text-[10px] text-slate-500">
                              <span className="font-bold text-slate-400 shrink-0">M{h.month}</span>
                              <span className="truncate">{h.desc}</span>
                              <span className="shrink-0 ml-auto">返利×{h.rebate.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6 shadow-sm relative overflow-hidden">
                    <div className="flex justify-between items-center mb-4 relative z-10">
                      <h3 className="font-bold text-lg text-slate-800">本月厂家考核指标</h3>
                      <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold border border-slate-200">进度: D{dayOfMonth}/30</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                      <div>
                        <p className="text-sm font-bold text-slate-700 mb-1">月度销量任务 <span className="text-blue-600 font-normal">(占返利80%)</span></p>
                        <div className="flex items-end gap-2 mb-2"><span className="text-3xl font-black text-slate-800">{monthlyStats.sales}</span><span className="text-slate-500">/ {monthlyStats.target} 台</span></div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div className={'h-full  ' + (monthlyStats.sales >= monthlyStats.target ? 'bg-green-500' : 'bg-blue-500')} style={{width: `${targetProgress}%`}}></div>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">阶梯折算：&lt;80%折半，&gt;120%拿1.2倍。</p>
                      </div>
                      <div className="space-y-3 border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-6">
                        <p className="text-sm font-bold text-slate-700 mb-1">过程漏斗考核 <span className="text-blue-600 font-normal">(占返利20%)</span></p>
                        <div>
                          <p className="text-xs text-slate-500 flex justify-between">
                            <span>邀约到店率 (目标 10%)</span>
                            <span className={inviteRateVal >= 0.1 ? 'text-green-600 font-bold' : 'text-red-500 font-bold'}>{(inviteRateVal * 100).toFixed(1)}%</span>
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 flex justify-between">
                            <span>销售转化率 (目标 20%)</span>
                            <span className={convertRateVal >= 0.2 ? 'text-green-600 font-bold' : 'text-red-500 font-bold'}>{(convertRateVal * 100).toFixed(1)}%</span>
                          </p>
                        </div>
                        <p className="text-xs text-slate-400 leading-tight mt-2">单项达标拿一半，两项均达标拿满，不达标扣除当项份额。</p>
                      </div>
                      <div className="bg-red-50 rounded-lg p-3 border border-red-200 flex flex-col justify-center text-center shadow-inner">
                        <p className="text-xs text-slate-500 mb-1">CSI满意度</p>
                        <p className={'text-2xl font-black  ' + (csi.score < 85 ? 'text-red-600' : csi.score >= 95 ? 'text-green-600' : 'text-blue-600')}>{csi.score}分</p>
                        <p className="text-[10px] text-slate-400">本月投诉: {csi.complaints}次</p>
                        {csi.score < 85 && <p className="text-[10px] text-red-600 font-bold mt-1">⚠️ CSI过低，返利将打折！</p>}
                      </div>
                    </div>
                    {/* 转介绍与置换数据 */}
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                        <p className="text-[10px] text-green-600 font-bold">转介绍线索数</p>
                        <p className="text-xl font-black text-green-700">{monthlyStats.referralLeads || 0} 条</p>
                      </div>
                      <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <p className="text-[10px] text-blue-600 font-bold">置换台数</p>
                        <p className="text-xl font-black text-blue-700">{monthlyStats.tradeInCount || 0} 台</p>
                      </div>
                      <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                        <p className="text-[10px] text-amber-600 font-bold">置换补贴</p>
                        <p className="text-xl font-black text-amber-700">{formatMoney(monthlyStats.tradeInSubsidy)}</p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 flex flex-col justify-center text-center shadow-inner">
                        <p className="text-xs text-slate-500 mb-1">当前预期最高总返利池</p>
                        <p className="text-2xl font-bold text-green-600">{formatMoney(monthlyStats.baseRebatesPool)}</p>
                        <p className="text-[10px] text-slate-400 mt-1">上月实发: {formatMoney(monthlyStats.lastMonthPayout)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 右侧：日志 */}
          <div className="w-full lg:w-80 bg-slate-800 text-slate-300 rounded-xl shadow-lg flex flex-col overflow-hidden h-80 lg:h-[700px] shrink-0">
            <div className="bg-slate-900 p-4 border-b border-slate-700 flex justify-between items-center shrink-0">
              <h2 className="font-bold text-white tracking-wider text-sm uppercase">经营日报日志</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm font-mono" style={{ scrollbarWidth: 'thin', scrollbarColor: '#475569 transparent' }}>
              {logs.map((log, index) => (
                <div key={index} className="pb-2 border-b border-slate-700/50 last:border-0 cursor-pointer hover:bg-slate-700/30 rounded-lg p-1 -m-1 transition-colors" onClick={() => setSelectedLogDay(log.day)}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-1.5 py-0.5 rounded bg-slate-700 text-slate-400">D-{log.day}</span>
                    <span className="text-xs font-bold uppercase tracking-wider" style={{
                      color: log.type === 'success' ? '#4ade80' : log.type === 'warning' ? '#fbbf24' : log.type === 'expense' ? '#f87171' : '#60a5fa'
                    }}>{log.type === 'expense' ? '财务' : log.type === 'success' ? '喜报' : log.type === 'warning' ? '警示' : '通知'}</span>
                  </div>
                  <p className="pl-1 opacity-90 leading-relaxed text-slate-200">{log.message}</p>
                </div>
              ))}
              <div ref={endOfLogsRef} />
            </div>
          </div>

        </div>
      </div>

      {/* --- 自定义弹窗组件 --- */}
      {modalConfig.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-3 text-slate-800">{modalConfig.title}</h3>
            <p className="text-slate-600 mb-8 whitespace-pre-line leading-relaxed">{modalConfig.message}</p>
            <div className="flex gap-3 justify-end">
              {modalConfig.onConfirm ? (
                <>
                  <button onClick={closeModal} className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors">取消</button>
                  <button onClick={modalConfig.onConfirm} className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-md">确认执行</button>
                </>
              ) : (
                <button onClick={closeModal} className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-md">我知道了</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- 订车专属配置弹窗 --- */}
      {orderForm.isOpen && orderForm.model && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100 max-h-[90vh] overflow-y-auto">
            {(() => {
              const _totalSlots = facility.showroomSpots + facility.warehouseCapacity;
              const _currentTotal = inventory.length + pendingOrders.reduce((sum, o) => sum + o.quantity, 0);
              const _available = Math.max(1, _totalSlots - _currentTotal);
              return (<>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-slate-800">配置采购单</h3>
              <span className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">{orderForm.model.name}</span>
            </div>
            <div className="space-y-5 mb-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">采购批量 (台)</label>
                <div className="flex items-center gap-3">
                  <input type="range" min="1" max={_available} value={Math.min(orderForm.quantity, _available)} onChange={e => setOrderForm(prev => ({...prev, quantity: parseInt(e.target.value, 10)}))} className="flex-1 accent-slate-800" />
                  <input type="number" min="1" max={_available} value={orderForm.quantity} onChange={e => setOrderForm(prev => ({...prev, quantity: Math.max(1, parseInt(e.target.value, 10) || 1)}))} className="w-16 border border-slate-300 rounded-md p-1.5 text-center font-bold outline-none focus:border-blue-500" />
                </div>
                <p className="text-xs text-slate-500 mt-1">剩余空位(含在途): <span className="font-bold">{_totalSlots - _currentTotal}</span> 台 (展厅 {facility.showroomSpots - inventory.filter(c => c.location === 'showroom').length} + 仓储 {facility.warehouseCapacity - inventory.filter(c => c.location === 'warehouse').length} - 在途 {pendingOrders.reduce((s,o) => s + o.quantity, 0)})</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">车辆外观颜色</label>
                <div className="grid grid-cols-4 gap-2">
                  {['黑', '白', '灰', '红'].map(c => (
                    <button key={c} onClick={() => setOrderForm(prev => ({...prev, color: c}))} className={'py-2 rounded-md border text-sm font-bold transition-all flex items-center justify-center gap-1  ' + (orderForm.color === c ? 'bg-slate-800 text-white border-slate-800 shadow-md' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50')}>
                      <div className={'w-3 h-3 rounded-full border border-slate-300  ' + (c === '黑' ? 'bg-black' : c === '白' ? 'bg-white' : c === '灰' ? 'bg-gray-400' : 'bg-red-500')}></div> {c}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">付款方式 (提车款)</label>
                <div className="flex gap-2">
                  <button onClick={() => setOrderForm(prev => ({...prev, useLoan: false}))} className={'flex-1 py-2.5 rounded-md border text-sm font-bold transition-all  ' + (!orderForm.useLoan ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50')}>现金全款</button>
                  <button onClick={() => setOrderForm(prev => ({...prev, useLoan: true}))} className={'flex-1 py-2.5 rounded-md border text-sm font-bold transition-all  ' + (orderForm.useLoan ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50')}>银行融资</button>
                </div>
              </div>
              <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-sm text-amber-800">
                <p className="font-bold">🚛 物流周期: 3~7天到货</p>
                <p className="text-xs mt-1">下单后车辆需经厂家排产发运，预计3-7个经营日后抵达仓储区。</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <p className="flex justify-between text-slate-600 text-sm mb-1"><span>单车成本:</span> <span>¥{orderForm.model.baseCost.toLocaleString()}</span></p>
                <p className="flex justify-between text-lg font-bold text-slate-800 border-t border-slate-200 pt-2 mt-2"><span>总计采购支出:</span> <span className="text-blue-700">¥{(orderForm.model.baseCost * orderForm.quantity).toLocaleString()}</span></p>
                {orderForm.useLoan && (
                  <p className="text-right text-xs font-medium text-orange-500 mt-1">
                    使用融资预计产生利息: ¥{Math.round(orderForm.model.baseCost * orderForm.quantity * finance.interestRate)} / 天
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setOrderForm({ isOpen: false, model: null, quantity: 1, color: '黑', useLoan: false })} className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors">取消配置</button>
              <button onClick={executeOrder} className="px-5 py-2.5 bg-slate-800 text-white font-medium rounded-lg hover:bg-slate-900 transition-colors shadow-md">确认下单</button>
            </div>
            </>);
            })()}
          </div>
        </div>
      )}

      {/* --- 日志详情弹窗 --- */}
      {selectedLogDay !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4" onClick={() => setSelectedLogDay(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-100 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {(() => {
              const logDay = selectedLogDay;
              const dayLogs = logs.filter(l => l.day === logDay);
              const dayLedgerEntry = dailyLedger.find(l => l.day === logDay);
              const dayMonth = Math.floor((logDay - 1) / 30) + 1;
              const dayOfMonth = ((logDay - 1) % 30) + 1;
              const dayNet = dayLedgerEntry ? dayLedgerEntry.items.reduce((sum, i) => sum + (i.type === 'pending' ? 0 : i.amount), 0) : 0;

              return (
                <>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-slate-800">📅 M{dayMonth} D{dayOfMonth} 经营日报详情</h3>
                    <button onClick={() => setSelectedLogDay(null)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">✕</button>
                  </div>

                  {/* 当日日志 */}
                  <div className="mb-5">
                    <h4 className="font-bold text-slate-700 mb-2 text-sm">📝 经营事件</h4>
                    <div className="space-y-2">
                      {dayLogs.length > 0 ? dayLogs.map((log, i) => (
                        <div key={i} className={`p-3 rounded-lg border text-sm ${
                          log.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
                          log.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800' :
                          log.type === 'expense' ? 'bg-red-50 border-red-200 text-red-800' :
                          'bg-blue-50 border-blue-200 text-blue-800'
                        }`}>
                          <span className="font-bold mr-2">[{log.type === 'success' ? '喜报' : log.type === 'warning' ? '警示' : log.type === 'expense' ? '财务' : '通知'}]</span>
                          {log.message}
                        </div>
                      )) : <p className="text-sm text-slate-400">暂无经营事件记录</p>}
                    </div>
                  </div>

                  {/* 当日财务流水 */}
                  <div className="mb-5">
                    <h4 className="font-bold text-slate-700 mb-2 text-sm">💰 财务流水明细</h4>
                    {dayLedgerEntry ? (
                      <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
                        <div className="space-y-2">
                          {dayLedgerEntry.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center text-sm">
                              <span className={' ' + (item.type === 'income' ? 'text-green-700' : item.type === 'pending' ? 'text-blue-600' : 'text-slate-500')}>
                                {item.type === 'income' ? '📈' : item.type === 'pending' ? '⏳' : '📉'} {item.label}
                              </span>
                              <span className={'font-bold  ' + (item.type === 'income' ? 'text-green-600' : item.type === 'pending' ? 'text-blue-500' : 'text-red-500')}>
                                {item.type === 'pending' ? '+' : ''}{item.amount >= 0 ? '+' : ''}{formatMoney(item.amount)}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 pt-3 border-t-2 border-slate-300 flex justify-between items-center">
                          <span className="font-bold text-slate-800">当日净额</span>
                          <span className={'text-lg font-black  ' + (dayNet >= 0 ? 'text-green-600' : 'text-red-600')}>
                            {dayNet >= 0 ? '+' : ''}{formatMoney(dayNet)}
                          </span>
                        </div>
                      </div>
                    ) : <p className="text-sm text-slate-400">暂无财务流水记录</p>}
                  </div>

                  {/* 快速导航 */}
                  <div className="flex justify-between items-center border-t border-slate-200 pt-4">
                    <button onClick={() => setSelectedLogDay(logDay - 1)} disabled={logDay <= 1} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                      ← 前一天
                    </button>
                    <span className="text-xs text-slate-400">D{dayOfMonth}</span>
                    <button onClick={() => setSelectedLogDay(logDay + 1)} disabled={logDay >= day} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                      后一天 →
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* 存档弹窗 */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowSaveModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">💾 选择存档槽位</h2>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {/* 自动存档槽 */}
              {(() => {
                const allSlots = getSaveSlots();
                const autoSlot = allSlots.slots['auto'];
                return (
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 opacity-60">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-sm">🔄 自动存档</p>
                        <p className="text-xs text-slate-400">{autoSlot ? `${autoSlot.savedAt} · M${Math.floor((autoSlot.day - 1) / 30) + 1} D${((autoSlot.day - 1) % 30) + 1}` : '空'}</p>
                      </div>
                      <span className="text-xs text-slate-400">每天自动覆盖</span>
                    </div>
                  </div>
                );
              })()}
              {/* 手动存档槽 1-5 */}
              {Array.from({ length: MAX_SLOTS }, (_, i) => {
                const slotId = `slot${i + 1}`;
                const allSlots = getSaveSlots();
                const slot = allSlots.slots[slotId];
                const isRenaming = renameSlot === slotId;
                return (
                  <div key={slotId} className={'rounded-lg p-4 border-2 transition-colors ' + (slot ? 'bg-blue-50 border-blue-200' : 'bg-white border-dashed border-slate-300')}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        {isRenaming ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={renameValue}
                              onChange={e => setRenameValue(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && handleRenameSlot(slotId)}
                              className="flex-1 border border-blue-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              autoFocus
                            />
                            <button onClick={() => handleRenameSlot(slotId)} className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-500">✓</button>
                            <button onClick={() => { setRenameSlot(null); setRenameValue(''); }} className="text-xs px-2 py-1 bg-slate-300 text-slate-700 rounded hover:bg-slate-400">✕</button>
                          </div>
                        ) : (
                          <>
                            <p className="font-bold text-sm truncate">{slot ? slot.slotName || `存档 ${i + 1}` : `空槽位 ${i + 1}`}</p>
                            {slot && <p className="text-xs text-slate-400 truncate">{slot.savedAt} · M{Math.floor((slot.day - 1) / 30) + 1} D{((slot.day - 1) % 30) + 1}</p>}
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {slot && !isRenaming && (
                          <>
                            <button onClick={() => { setRenameSlot(slotId); setRenameValue(slot.slotName || `存档 ${i + 1}`); }} className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded hover:bg-amber-200" title="重命名">✏️</button>
                            <button onClick={() => handleDeleteSlot(slotId)} className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200" title="删除">🗑️</button>
                          </>
                        )}
                        <button onClick={() => handleSaveToSlot(slotId, slot?.slotName || `存档 ${i + 1}`)} className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-500 font-bold">
                          {slot ? '覆盖保存' : '保存'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <button onClick={() => setShowSaveModal(false)} className="mt-4 w-full py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-bold transition-colors">关闭</button>
          </div>
        </div>
      )}

      {/* 读档弹窗 */}
      {showLoadModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowLoadModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">📂 选择存档读取</h2>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {(() => {
                const allSlots = getSaveSlots();
                const allKeys = ['auto', ...Array.from({ length: MAX_SLOTS }, (_, i) => `slot${i + 1}`)];
                const filledSlots = allKeys.filter(k => allSlots.slots[k]);
                if (filledSlots.length === 0) return <p className="text-sm text-slate-400 text-center py-8">暂无存档</p>;
                return filledSlots.map(slotId => {
                  const slot = allSlots.slots[slotId];
                  const isAuto = slotId === 'auto';
                  const isRenaming = renameSlot === slotId;
                  return (
                    <div key={slotId} className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          {isRenaming ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={renameValue}
                                onChange={e => setRenameValue(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleRenameSlot(slotId)}
                                className="flex-1 border border-blue-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                autoFocus
                              />
                              <button onClick={() => handleRenameSlot(slotId)} className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-500">✓</button>
                              <button onClick={() => { setRenameSlot(null); setRenameValue(''); }} className="text-xs px-2 py-1 bg-slate-300 text-slate-700 rounded hover:bg-slate-400">✕</button>
                            </div>
                          ) : (
                            <>
                              <p className="font-bold text-sm truncate">
                                {isAuto ? '🔄 ' : ''}{slot.slotName || (isAuto ? '自动存档' : `存档 ${slotId.replace('slot', '')}`)}
                              </p>
                              <p className="text-xs text-slate-400 truncate">{slot.savedAt} · M{Math.floor((slot.day - 1) / 30) + 1} D{((slot.day - 1) % 30) + 1}</p>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {!isAuto && !isRenaming && (
                            <>
                              <button onClick={() => { setRenameSlot(slotId); setRenameValue(slot.slotName || `存档 ${slotId.replace('slot', '')}`); }} className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded hover:bg-amber-200" title="重命名">✏️</button>
                              <button onClick={() => handleDeleteSlot(slotId)} className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200" title="删除">🗑️</button>
                            </>
                          )}
                          <button onClick={() => handleLoadFromSlot(slotId)} className="text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-500 font-bold">
                            读取
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                });
              })}
            </div>
            <button onClick={() => setShowLoadModal(false)} className="mt-4 w-full py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-bold transition-colors">关闭</button>
          </div>
        </div>
      )}
    </div>
  );
}
