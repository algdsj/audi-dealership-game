import { STAFF_ROLE_META } from '../config/staff.js';

const countMembers = (role) => (role?.members || []).length;
const countRetained = (role) => (role?.members || []).filter(member => member.retained).length;

export const calculateDailyOperatingCosts = ({
  facility,
  staff,
  afterSales,
  marketing,
  finance,
  inventory = [],
  includeRetentionBonus = false,
}) => {
  const rent = ((facility?.showroomSpots || 0) + (facility?.warehouseCapacity || 0)) * 100;
  const depreciation = (facility?.level || 0) * 800;
  const dccCount = countMembers(staff?.dcc);
  const salesCount = countMembers(staff?.sales);
  const serviceCount = countMembers(staff?.service);
  const streamerCount = countMembers(staff?.streamer);
  const techCount = (afterSales?.technicians || []).length;
  const dccSalary = staff?.dcc?.salary || STAFF_ROLE_META.dcc.salary;
  const salesSalary = staff?.sales?.salary || STAFF_ROLE_META.sales.salary;
  const serviceSalary = staff?.service?.salary || STAFF_ROLE_META.service.salary;
  const streamerSalary = staff?.streamer?.salary || STAFF_ROLE_META.streamer.salary;
  const techSalary = afterSales?.salary || STAFF_ROLE_META.tech.salary;
  const retentionBonus = includeRetentionBonus ? (
    countRetained(staff?.dcc) * dccSalary +
    countRetained(staff?.sales) * salesSalary +
    countRetained(staff?.service) * serviceSalary +
    countRetained(staff?.streamer) * streamerSalary +
    (afterSales?.technicians || []).filter(member => member.retained).length * techSalary
  ) : 0;
  const salaries = (
    dccCount * dccSalary +
    salesCount * salesSalary +
    serviceCount * serviceSalary +
    streamerCount * streamerSalary +
    techCount * techSalary +
    retentionBonus
  );
  const interest = (finance?.loan || 0) * (finance?.interestRate || 0);
  const warehouseCarCount = inventory.filter(car => car.location === 'warehouse').length;
  const storageCost = warehouseCarCount * 50;
  const leadPurchaseBudget = Math.max(0, marketing?.leadPurchaseBudget || marketing?.budget || 0);
  const livestreamBudget = Math.max(0, marketing?.livestreamBudget || 0);
  const dailyMarketingBudget = leadPurchaseBudget + livestreamBudget;
  const dailyExpenses = rent + depreciation + salaries + dailyMarketingBudget + interest + storageCost;

  return {
    rent,
    depreciation,
    salaries,
    interest,
    warehouseCarCount,
    storageCost,
    leadPurchaseBudget,
    livestreamBudget,
    dailyMarketingBudget,
    dailyExpenses,
  };
};

export const calculateCompanyDailyBurn = (context) => calculateDailyOperatingCosts({
  ...context,
  includeRetentionBonus: false,
}).dailyExpenses;

export const applyDailyOperatingCosts = ({
  finance,
  monthlyStats,
  costs,
  employeeCount,
}) => {
  const nextFinance = { ...finance, cash: finance.cash - costs.dailyExpenses };
  const nextMonthlyStats = {
    ...monthlyStats,
    rent: (monthlyStats.rent || 0) + costs.rent,
    depreciation: (monthlyStats.depreciation || 0) + costs.depreciation,
    labor: (monthlyStats.labor || 0) + costs.salaries,
    financeCost: (monthlyStats.financeCost || 0) + costs.interest,
    marketingCost: (monthlyStats.marketingCost || 0) + costs.dailyMarketingBudget,
    storageCost: (monthlyStats.storageCost || 0) + costs.storageCost,
  };
  const ledgerItems = [
    { label: '土地租金', amount: -costs.rent, type: 'expense' },
    { label: '折旧摊销', amount: -costs.depreciation, type: 'expense' },
    { label: `人工薪酬(${employeeCount}人)`, amount: -costs.salaries, type: 'expense' },
  ];
  if (costs.leadPurchaseBudget > 0) ledgerItems.push({ label: '线索采买', amount: -costs.leadPurchaseBudget, type: 'expense' });
  if (costs.livestreamBudget > 0) ledgerItems.push({ label: '直播投流', amount: -costs.livestreamBudget, type: 'expense' });
  if (costs.interest > 0) ledgerItems.push({ label: '金融利息', amount: -costs.interest, type: 'expense' });
  if (costs.storageCost > 0) ledgerItems.push({ label: `仓储成本(${costs.warehouseCarCount}台)`, amount: -costs.storageCost, type: 'expense' });

  return {
    finance: nextFinance,
    monthlyStats: nextMonthlyStats,
    ledgerItems,
  };
};
