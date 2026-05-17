export const buildFinanceSnapshot = ({
  monthlyStats = {},
  drafts = {},
  currentDay = 1,
  currentMonth = 1,
  dailyBurnEstimate = 1,
  dailyLedger = [],
  inventory = [],
  carModels = [],
  virtualSales = {},
  usedCars = [],
  finance = {},
  gmWealth = {},
  feedback = {},
} = {}) => {
  const gp1 = (monthlyStats.revenue || 0) - (monthlyStats.cogs || 0);
  const gp2 = gp1 + (monthlyStats.baseRebatesPool || 0);
  const derivProfit = (monthlyStats.derivativeRevenue || 0) - (monthlyStats.derivativeCost || 0);
  const afterSalesProfit = (monthlyStats.afterSalesRevenue || 0) - (monthlyStats.afterSalesCost || 0);
  const financeIncome = monthlyStats.financeCommission || 0;
  const renewalIncome = monthlyStats.insuranceRenewalRevenue || 0;
  const usedCarProfit = (monthlyStats.usedCarRevenue || 0) - (monthlyStats.usedCarCost || 0);
  const gp3 = gp2 + derivProfit + financeIncome + afterSalesProfit + renewalIncome + usedCarProfit;
  const opex = (monthlyStats.rent || 0) + (monthlyStats.depreciation || 0) + (monthlyStats.labor || 0) + (monthlyStats.marketingCost || 0) + (monthlyStats.financeCost || 0) + (monthlyStats.storageCost || 0);
  const netProfit = gp3 - opex;

  const activeDraftList = (drafts.activeDrafts || []).filter(d => d.status === 'active' || d.status === 'defaulted');
  const unpaidDraftAmount = activeDraftList.reduce((sum, d) => sum + (d.status === 'active' ? d.amount : (d.overduePrincipal || 0)), 0);
  const upcomingDrafts = activeDraftList
    .filter(d => d.status === 'active')
    .map(d => {
      const dueAbsoluteDay = ((d.dueDate?.month || 1) - 1) * 30 + (d.dueDate?.day || 1);
      return { ...d, remainingDays: dueAbsoluteDay - currentDay };
    })
    .sort((a, b) => a.remainingDays - b.remainingDays);
  const nearestDraft = upcomingDrafts[0];
  const warningDrafts = upcomingDrafts.filter(d => d.remainingDays <= 7);
  const defaultedDrafts = activeDraftList.filter(d => d.status === 'defaulted');
  const draftCreditUsage = drafts.creditLimit > 0 ? Math.min(100, ((drafts.creditUsed || 0) / drafts.creditLimit) * 100) : 0;

  const safeDailyBurn = Math.max(1, Number(dailyBurnEstimate) || 1);
  const cashCoverageDays = Math.floor((finance.cash || 0) / safeDailyBurn);
  const currentMonthLedger = dailyLedger.filter(l => l.day > (currentMonth - 1) * 30);
  const ledgerItems = currentMonthLedger.flatMap(entry => entry.items || []);
  const ledgerIncome = ledgerItems.filter(item => item.type === 'income').reduce((sum, item) => sum + Math.max(0, item.amount || 0), 0);
  const ledgerExpense = ledgerItems.filter(item => item.type === 'expense').reduce((sum, item) => sum + Math.abs(Math.min(0, item.amount || 0)), 0);
  const draftDepositPaid = ledgerItems.filter(item => item.label?.includes('银行承兑汇票采购')).reduce((sum, item) => sum + Math.abs(item.amount || 0), 0);
  const draftDuePaid = ledgerItems.filter(item => item.label?.includes('汇票到期兑付') || item.label?.includes('汇票兑付不足')).reduce((sum, item) => sum + Math.abs(item.amount || 0), 0);
  const bailoutIn = ledgerItems.filter(item => item.label?.includes('GM个人垫资入账')).reduce((sum, item) => sum + Math.max(0, item.amount || 0), 0);
  const bailoutRepay = ledgerItems.filter(item => item.label?.includes('归还GM垫资')).reduce((sum, item) => sum + Math.abs(item.amount || 0), 0);

  const inventoryAssetValue = inventory.reduce((sum, car) => sum + (carModels.find(m => m.id === car.modelId)?.baseCost || 0), 0);
  const virtualInventoryValue = (virtualSales.virtualCars || []).reduce((sum, car) => sum + (car.costPrice || 0), 0);
  const usedCarAssetValue = usedCars.filter(c => c.status === 'stock').reduce((sum, c) => sum + (c.purchasePrice || 0), 0);
  const balanceAssets = (finance.cash || 0) + inventoryAssetValue + virtualInventoryValue + usedCarAssetValue;
  const balanceLiabilities = (finance.loan || 0) + unpaidDraftAmount + (gmWealth.outstandingBailout || 0);
  const ownerEquity = balanceAssets - balanceLiabilities;
  const debtRatio = balanceAssets > 0 ? balanceLiabilities / balanceAssets : 0;

  const realRevenueView = monthlyStats.realRevenue || monthlyStats.revenue || 0;
  const realCogsView = monthlyStats.realCogs || monthlyStats.cogs || 0;
  const realRebateView = monthlyStats.realRebate || Math.max(0, (monthlyStats.baseRebatesPool || 0) - (monthlyStats.virtualRebate || 0));
  const virtualRevenueView = monthlyStats.virtualRevenue || 0;
  const virtualCogsView = monthlyStats.virtualCogs || 0;
  const virtualRebateView = monthlyStats.virtualRebate || 0;
  const recentRatingTrend = [...(feedback.ratingHistory || [])].slice(-12);

  return {
    gp1,
    gp2,
    derivProfit,
    afterSalesProfit,
    financeIncome,
    renewalIncome,
    usedCarProfit,
    gp3,
    opex,
    netProfit,
    activeDraftList,
    unpaidDraftAmount,
    upcomingDrafts,
    nearestDraft,
    warningDrafts,
    defaultedDrafts,
    draftCreditUsage,
    dailyBurnEstimate: safeDailyBurn,
    cashCoverageDays,
    currentMonthLedger,
    ledgerItems,
    ledgerIncome,
    ledgerExpense,
    draftDepositPaid,
    draftDuePaid,
    bailoutIn,
    bailoutRepay,
    inventoryAssetValue,
    virtualInventoryValue,
    usedCarAssetValue,
    balanceAssets,
    balanceLiabilities,
    ownerEquity,
    debtRatio,
    realRevenueView,
    realCogsView,
    realRebateView,
    virtualRevenueView,
    virtualCogsView,
    virtualRebateView,
    recentRatingTrend,
  };
};
