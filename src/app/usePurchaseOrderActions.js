import { executeVehicleOrder } from '../game/engine/purchaseOrders.js';
import { recordPurchaseTargetOrder } from '../game/engine/manufacturerPurchaseTargets.js';

export function usePurchaseOrderActions({
  addLog,
  addMonthsToGameDate,
  appendLedger,
  currentDay,
  dayOfMonth,
  drafts,
  facility,
  finance,
  formatMoney,
  getDraftFeeRate,
  inventory,
  investorRelations,
  marketEnvironment,
  manufacturerPolicy,
  month,
  monthlyStats,
  orderForm,
  pendingOrders,
  setDrafts,
  setFinance,
  setMonthlyStats,
  setManufacturerPolicy,
  setOrderForm,
  setPendingOrders,
  showAlert,
}) {
  const executeOrder = () => {
    const result = executeVehicleOrder({
      orderForm,
      investorRelations,
      currentDay,
      facility,
      inventory,
      pendingOrders,
      finance,
      drafts,
      monthlyStats,
      month,
      dayOfMonth,
      marketEnvironment,
      manufacturerPolicy,
      getDraftFeeRate,
      addMonthsToGameDate,
      formatMoney,
    });
    if (result.status === 'invalid') return;
    if (result.alert) return showAlert(result.alert.title, result.alert.message);
    setFinance(result.finance);
    setDrafts(result.drafts);
    setMonthlyStats(result.monthlyStats);
    if (manufacturerPolicy && setManufacturerPolicy) {
      setManufacturerPolicy(recordPurchaseTargetOrder({ manufacturerPolicy, quantity: orderForm.quantity }));
    }
    appendLedger(result.ledgerItem);
    setPendingOrders(result.pendingOrders);
    addLog(result.log.type, result.log.message);
    setOrderForm(result.orderForm);
  };

  return {
    executeOrder,
  };
}
