import { CAR_MODELS } from '../game/config/vehicles.js';
import { applySalesOpportunityStaffFeedback, resolveSalesOpportunityAction } from '../game/engine/salesOpportunities.js';

const normalizeFinanceAfterCost = finance => {
  if (finance.cash >= 0) return finance;
  return { ...finance, loan: finance.loan + Math.abs(finance.cash), cash: 0 };
};

export function useSalesOpportunityActions({
  activeDifficulty,
  activeRegion,
  appendLedger,
  csi,
  currentDay,
  createCustomerDealCase,
  estimateDealAddons,
  formatMoney,
  getPriceReality,
  getRetailQualityScore,
  inventory,
  marketPrices,
  salesAvgSkill,
  salesOpportunities,
  staff,
  setCustomerDeals,
  setFinance,
  setLogs,
  setManagerInbox,
  setMonthlyStats,
  setSalesOpportunities,
  setStaff,
  showAlert,
}) {
  const handleSalesOpportunityAction = (opportunityId, actionId) => {
    const opportunity = (salesOpportunities?.active || []).find(item => item.id === opportunityId);
    const expectedGrossProfit = opportunity?.metadata?.expectedGrossProfit || opportunity?.metadata?.grossProfit || 0;
    const result = resolveSalesOpportunityAction({
      actionId,
      activeDifficulty,
      currentDay,
      expectedGrossProfit,
      formatMoney,
      salesOpportunities,
      staff,
      opportunityId,
    });

    if (!result.ok) {
      showAlert('机会处理失败', '这个销售机会已不存在，或当前状态不能执行该动作。');
      return;
    }

    setSalesOpportunities(result.salesOpportunities);
    setLogs(prev => [...prev, ...result.logs]);
    if (result.inboxItems.length > 0) setManagerInbox(prev => [...prev, ...result.inboxItems]);
    const staffFeedback = applySalesOpportunityStaffFeedback({
      actionId,
      result,
      staff,
    });
    if (staffFeedback.staff !== staff) setStaff(staffFeedback.staff);
    if (staffFeedback.logs.length > 0) setLogs(prev => [...prev, ...staffFeedback.logs]);
    if (result.ledgerItems.length > 0) appendLedger(result.ledgerItems, currentDay);
    if (result.metadata.cost > 0) {
      setFinance(prev => normalizeFinanceAfterCost({ ...prev, cash: prev.cash - result.metadata.cost }));
      setMonthlyStats(prev => ({ ...prev, marketingCost: (prev.marketingCost || 0) + result.metadata.cost }));
    }

    if (actionId === 'close' && result.success && opportunity) {
      const modelDef = CAR_MODELS.find(model => model.id === opportunity.modelId);
      const deal = createCustomerDealCase({
        channelId: 'showroom',
        segment: modelDef?.segment || null,
        sourceDay: currentDay,
        stockList: inventory,
        carModels: CAR_MODELS,
        marketPrices,
        activeRegion,
        salesAvgSkill,
        csiScore: csi.score,
        getRetailQualityScore,
        getPriceReality,
        estimateDealAddons,
      });
      if (deal) {
        setCustomerDeals(prev => [{
          ...deal,
          customerName: opportunity.customerName || deal.customerName,
          channelName: '销售机会池',
          dueDay: currentDay + 1,
        }, ...prev]);
        setLogs(prev => [...prev, {
          day: currentDay,
          type: 'success',
          message: `【销售机会池】${opportunity.customerName} 已转入重点客户谈判，请在客户谈判页完成报价。`,
        }]);
      }
    }

    showAlert(
      result.success ? '机会推进成功' : '机会处理完成',
      `${opportunity?.customerName || '客户'} 的销售机会已结算，当前成功率约 ${Math.round(result.successChance * 100)}%。`,
    );
  };

  return { handleSalesOpportunityAction };
}
