import { traitSum } from './staffing.js';

export const settleAfterSalesDailyService = ({
  soldVehicles,
  finance,
  monthlyStats,
  ledgerItems,
  afterSales,
  staff,
  techCount,
  techAvgSkill,
  serviceCount,
  serviceAvgSkill,
  absoluteDay,
  random = Math.random,
}) => {
  const nextFinance = { ...finance };
  const nextMonthlyStats = { ...monthlyStats };
  const nextLedgerItems = [...ledgerItems];

  let dailyAsRevenue = 0;
  let dailyAsCost = 0;
  const techCapacity = techCount * 3 + traitSum('tech', afterSales.technicians, 'capacityBonus');
  let asOrdersHandled = 0;
  const asBaseCustomers = soldVehicles.length;
  const serviceReturnBoost = serviceCount > 0
    ? Math.min(0.55, serviceCount * 0.08 + serviceAvgSkill / 500 + traitSum('service', staff.service?.members || [], 'returnVisitBonus'))
    : 0;

  for (let i = 0; i < soldVehicles.length; i++) {
    if (asOrdersHandled >= techCapacity) break;
    if (random() < (1 / 30) * (1 + serviceReturnBoost)) {
      const basePrice = 800 + Math.floor(random() * 1200);
      const skillBonus = 1 + techAvgSkill / 100;
      const orderRevenue = Math.round(basePrice * skillBonus);
      const orderCost = Math.round(orderRevenue * 0.4);
      dailyAsRevenue += orderRevenue;
      dailyAsCost += orderCost;
      asOrdersHandled++;
    }
  }

  if (asOrdersHandled < techCapacity && random() < 0.02 * Math.min(asBaseCustomers, 50)) {
    const basePrice = 5000 + Math.floor(random() * 25000);
    const skillBonus = 1 + techAvgSkill / 100;
    const orderRevenue = Math.round(basePrice * skillBonus);
    const orderCost = Math.round(orderRevenue * 0.5);
    dailyAsRevenue += orderRevenue;
    dailyAsCost += orderCost;
    asOrdersHandled++;
  }

  if (asOrdersHandled < techCapacity && random() < 0.10) {
    const orderRevenue = 200 + Math.floor(random() * 600);
    const orderCost = Math.round(orderRevenue * 0.3);
    dailyAsRevenue += orderRevenue;
    dailyAsCost += orderCost;
    asOrdersHandled++;
  }

  nextMonthlyStats.afterSalesRevenue += dailyAsRevenue;
  nextMonthlyStats.afterSalesCost += dailyAsCost;
  nextMonthlyStats.afterSalesReturnVisits = (nextMonthlyStats.afterSalesReturnVisits || 0) + asOrdersHandled;
  if (dailyAsRevenue > 0) {
    nextFinance.cash += dailyAsRevenue - dailyAsCost;
    nextLedgerItems.push({ label: `售后维修收入(${asOrdersHandled}单)`, amount: dailyAsRevenue, type: 'income' });
    nextLedgerItems.push({ label: '售后零件/工时成本', amount: -dailyAsCost, type: 'expense' });
    if (serviceReturnBoost > 0) nextLedgerItems.push({ label: `客服回厂加成(${Math.round(serviceReturnBoost * 100)}%)`, amount: 0, type: 'pending' });
  }

  let dailyInsRevenue = 0;
  const renewalEligible = soldVehicles.filter(vehicle => (absoluteDay - vehicle.soldDay) >= 30);
  for (let i = 0; i < renewalEligible.length; i++) {
    if (random() < 0.30 / 30) {
      const commission = 3000 + Math.floor(random() * 2000);
      dailyInsRevenue += commission;
    }
  }
  if (dailyInsRevenue > 0) {
    nextFinance.cash += dailyInsRevenue;
    nextMonthlyStats.insuranceRenewalRevenue += dailyInsRevenue;
    nextLedgerItems.push({ label: '续保佣金收入', amount: dailyInsRevenue, type: 'income' });
  }

  return {
    finance: nextFinance,
    monthlyStats: nextMonthlyStats,
    ledgerItems: nextLedgerItems,
    dailyAsRevenue,
    dailyAsCost,
    asOrdersHandled,
    renewalEligible,
    dailyInsRevenue,
  };
};
