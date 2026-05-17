import { CAR_MODELS } from '../game/config/vehicles.js';
import { createNegotiationCase as createNegotiationCaseCore } from '../game/engine/caseFactories.js';
import { resolveComplaintResolution } from '../game/engine/complaintResolution.js';
import { resolveCustomerDeal } from '../game/engine/customerDealResolution.js';
import { addCustomerRecord, createCustomerRecordFromDeal } from '../game/engine/customerLifecycle.js';
import { applyCustomerLossCompetitorIntel } from '../game/engine/competitorIntel.js';
import { evaluateNegotiationOpening, resolveNegotiationOutcome } from '../game/engine/negotiationResolution.js';
import { resolvePriceApproval } from '../game/engine/priceApprovalResolution.js';

export function useCaseActions({
  activeInvestor,
  activeRegion,
  addLog,
  approvalCases,
  appendLedger,
  csi,
  competitors,
  customerDeals,
  dailyStats,
  estimateDealAddons,
  finance,
  formatMoney,
  getPriceReality,
  inventory,
  investorRelations,
  marketing,
  monthlyStats,
  netProfit,
  dayOfMonth,
  month,
  setApprovalCases,
  setCompetitors,
  setCsi,
  setCustomerLifecycle,
  setCustomerDeals,
  setDailyStats,
  setFinance,
  setInventory,
  setInvestorRelations,
  setMarketing,
  setMonthlyStats,
  setSoldVehicles,
  setUsedCars,
  showAlert,
  soldVehicles,
  usedCars,
  currentDay,
}) {
  const openNegotiation = (kind) => {
    const opening = evaluateNegotiationOpening({ kind, approvalCases, inventory, netProfit });
    if (!opening.ok) return showAlert(opening.title, opening.message);
    const item = createNegotiationCaseCore({ kind, day: currentDay });
    if (!item) return;
    setApprovalCases(prev => [...prev, item]);
    addLog('info', `📨【外部谈判】${item.title} 已进入总经理审批中心，请选择谈判口径。`);
  };

  const resolveNegotiation = (caseId, optionId) => {
    const item = approvalCases.find(c => c.id === caseId);
    if (!item || item.type !== 'negotiation') return;
    const option = item.options.find(o => o.id === optionId);
    if (!option) return;

    const result = resolveNegotiationOutcome({
      item,
      option,
      investorRelations,
      csiScore: csi.score,
      activeInvestor,
      activeRegion,
      inventory,
      monthlyStats,
      finance,
      marketing,
      currentDay,
      formatMoney,
    });
    if (result.inventory) setInventory(result.inventory);
    if (result.monthlyStats) setMonthlyStats(result.monthlyStats);
    if (result.finance) setFinance(result.finance);
    if (result.investorRelations) setInvestorRelations(result.investorRelations);
    if (result.marketing) setMarketing(result.marketing);
    if (result.ledgerItem) appendLedger(result.ledgerItem);
    addLog(result.log.type, result.log.message);
    setApprovalCases(prev => prev.filter(c => c.id !== caseId));
  };

  const handleCustomerDeal = (caseId, mode) => {
    const item = customerDeals.find(c => c.id === caseId);
    if (!item || item.status !== 'pending') return;
    const result = resolveCustomerDeal({
      item,
      mode,
      inventory,
      carModels: CAR_MODELS,
      finance,
      monthlyStats,
      dailyStats,
      soldVehicles,
      usedCars,
      csi,
      currentDay,
      getPriceReality,
      estimateDealAddons,
      formatMoney,
    });
    if (result.status === 'invalid') {
      setCustomerDeals(prev => prev.filter(c => c.id !== caseId));
      return showAlert('客户失效', '该客户意向车辆已不在库存中，客户卡牌已关闭。');
    }
    if (result.inventory) setInventory(result.inventory);
    if (result.finance) setFinance(result.finance);
    if (result.usedCars) setUsedCars(result.usedCars);
    if (result.monthlyStats) setMonthlyStats(result.monthlyStats);
    if (result.dailyStats) setDailyStats(result.dailyStats);
    if (result.soldVehicles) setSoldVehicles(result.soldVehicles);
    if (result.csi) setCsi(result.csi);
    if (result.ledgerItems) appendLedger(result.ledgerItems);
    if (result.log) addLog(result.log.type, result.log.message);
    if (['rejected', 'lost', 'sold'].includes(result.status)) {
      if (result.crmOutcome) {
        const record = createCustomerRecordFromDeal({ currentDay, item, outcome: result.crmOutcome });
        setCustomerLifecycle(prev => addCustomerRecord(prev, record));
        const intelResult = applyCustomerLossCompetitorIntel({
          competitors,
          record,
          month,
          dayOfMonth,
        });
        if (intelResult.changed) {
          setCompetitors(intelResult.competitors);
          addLog('info', `🌐【客户战败复盘】${record.customerName} 的流失样本更新了${intelResult.signal.brandLabel}情报。`);
        }
      }
      setCustomerDeals(prev => prev.filter(c => c.id !== caseId));
    }
    if (result.alert) showAlert(result.alert.title, result.alert.message);
  };

  const handlePriceApproval = (caseId, mode) => {
    const item = approvalCases.find(c => c.id === caseId);
    if (!item || item.type !== 'price') return;
    const result = resolvePriceApproval({
      item,
      mode,
      inventory,
      carModels: CAR_MODELS,
      finance,
      monthlyStats,
      dailyStats,
      soldVehicles,
      currentDay,
      getPriceReality,
      estimateDealAddons,
      formatMoney,
    });
    if (result.status === 'invalid') {
      setApprovalCases(prev => prev.filter(c => c.id !== caseId));
      return showAlert('审批失效', '该车辆已不在库存中，审批单已自动关闭。');
    }
    if (result.inventory) setInventory(result.inventory);
    if (result.finance) setFinance(result.finance);
    if (result.monthlyStats) setMonthlyStats(result.monthlyStats);
    if (result.dailyStats) setDailyStats(result.dailyStats);
    if (result.soldVehicles) setSoldVehicles(result.soldVehicles);
    if (result.ledgerItems) appendLedger(result.ledgerItems);
    if (result.log) addLog(result.log.type, result.log.message);
    if (['rejected', 'lost', 'sold'].includes(result.status)) {
      setApprovalCases(prev => prev.filter(c => c.id !== caseId));
    }
  };

  const handleComplaintResolution = (caseId, mode) => {
    const item = approvalCases.find(c => c.id === caseId);
    if (!item || item.type !== 'complaint') return;
    const result = resolveComplaintResolution({ item, mode, finance, csi, formatMoney });
    if (result.status === 'invalid') return;
    if (result.alert) return showAlert(result.alert.title, result.alert.message);
    if (result.finance) setFinance(result.finance);
    if (result.ledgerItem) appendLedger(result.ledgerItem);
    if (result.csi) setCsi(result.csi);
    setApprovalCases(prev => prev.filter(c => c.id !== caseId));
    if (result.log) addLog(result.log.type, result.log.message);
  };

  return {
    handleComplaintResolution,
    handleCustomerDeal,
    handlePriceApproval,
    openNegotiation,
    resolveNegotiation,
  };
}
