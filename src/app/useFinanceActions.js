import { CAR_MODELS } from '../game/config/vehicles.js';
import { prepareCompetitorCountermeasure, settleCompetitorCountermeasure } from '../game/engine/competitorCountermeasures.js';
import {
  adjustGmSalary,
  prepareOverdueDraftRepayment,
  preparePersonalBailout,
  settleOverdueDraftRepayment,
  settlePersonalBailout,
} from '../game/engine/gmFinanceActions.js';
import {
  prepareDerivativeStrategyChange,
  prepareManualLoanRepayment,
  settleDerivativeStrategyChange,
  settleManualLoanRepayment,
} from '../game/engine/playerFinanceActions.js';
import { prepareVirtualSalesSprint, settleVirtualSalesSprint } from '../game/engine/virtualSalesSprint.js';

export function useFinanceActions({
  addLog,
  appendLedger,
  competitors,
  currentDay,
  dayOfMonth,
  drafts,
  finance,
  formatMoney,
  getDynamicMsrp,
  getDynamicRebate,
  gmWealth,
  inventory,
  month,
  monthlyStats,
  setCompetitors,
  setDrafts,
  setFinance,
  setGmWealth,
  setInventory,
  setMonthlyStats,
  setStrategy,
  setVirtualPlan,
  setVirtualSales,
  showAlert,
  showConfirm,
  strategy,
  virtualPlan,
  virtualSales,
}) {
  const handleManualRepayLoan = () => {
    const repaymentPlan = prepareManualLoanRepayment({ finance, formatMoney });
    if (repaymentPlan.alert) return showAlert(repaymentPlan.alert.title, repaymentPlan.alert.message);
    showConfirm(repaymentPlan.confirm.title, repaymentPlan.confirm.message, () => {
      const result = settleManualLoanRepayment({ repaymentPlan, finance, formatMoney });
      setFinance(result.finance);
      appendLedger(result.ledgerItem);
      addLog(result.log.type, result.log.message);
    });
  };

  const handleStrategyChange = (key, val) => {
    const strategyPlan = prepareDerivativeStrategyChange({ key, value: val });
    showConfirm(strategyPlan.confirm.title, strategyPlan.confirm.message, () => {
      const result = settleDerivativeStrategyChange({ strategyPlan, strategy });
      setStrategy(result.strategy);
      addLog(result.log.type, result.log.message);
    });
  };

  const handlePersonalBailout = (amount) => {
    const bailoutPlan = preparePersonalBailout({ amount, gmWealth, formatMoney });
    if (bailoutPlan.alert) return showAlert(bailoutPlan.alert.title, bailoutPlan.alert.message);
    showConfirm(bailoutPlan.confirm.title, bailoutPlan.confirm.message, () => {
      const result = settlePersonalBailout({ bailoutPlan, gmWealth, finance, month, formatMoney });
      setGmWealth(result.gmWealth);
      setFinance(result.finance);
      appendLedger(result.ledgerItem);
      addLog(result.log.type, result.log.message);
    });
  };

  const handleRepayOverdueDraft = (draftId) => {
    const repaymentPlan = prepareOverdueDraftRepayment({ draftId, drafts, finance, formatMoney });
    if (repaymentPlan.alert) return showAlert(repaymentPlan.alert.title, repaymentPlan.alert.message);
    showConfirm(repaymentPlan.confirm.title, repaymentPlan.confirm.message, () => {
      const result = settleOverdueDraftRepayment({ repaymentPlan, drafts, finance, month, dayOfMonth, formatMoney });
      setFinance(result.finance);
      setDrafts(result.drafts);
      appendLedger(result.ledgerItem);
      addLog(result.log.type, result.log.message);
    });
  };

  const handleAdjustGmSalary = (delta) => {
    const result = adjustGmSalary({ delta, gmWealth, monthlyStats, month, formatMoney });
    if (result.status === 'unchanged') return;
    if (result.alert) return showAlert(result.alert.title, result.alert.message);
    setGmWealth(result.gmWealth);
    addLog(result.log.type, result.log.message);
  };

  const handleVirtualSprint = () => {
    const sprintPlan = prepareVirtualSalesSprint({
      dayOfMonth,
      virtualPlan,
      inventory,
      carModels: CAR_MODELS,
      getDynamicRebate,
      formatMoney,
    });
    if (sprintPlan.alert) return showAlert(sprintPlan.alert.title, sprintPlan.alert.message);
    showConfirm(sprintPlan.confirm.title, sprintPlan.confirm.message, () => {
      const result = settleVirtualSalesSprint({
        sprintPlan,
        inventory,
        virtualSales,
        monthlyStats,
        gmWealth,
        carModels: CAR_MODELS,
        currentDay,
        month,
        getDynamicMsrp,
        formatMoney,
      });
      setInventory(result.inventory);
      setVirtualSales(result.virtualSales);
      setMonthlyStats(result.monthlyStats);
      setGmWealth(result.gmWealth);
      appendLedger(result.ledgerItem);
      addLog(result.log.type, result.log.message);
      setVirtualPlan({});
    });
  };

  const handleCompetitorCountermeasure = (type, targetSelection = null) => {
    const countermeasurePlan = prepareCompetitorCountermeasure({ type, competitors, finance, formatMoney, targetSelection });
    if (countermeasurePlan.status === 'invalid') return;
    if (countermeasurePlan.alert) return showAlert(countermeasurePlan.alert.title, countermeasurePlan.alert.message);
    showConfirm(countermeasurePlan.confirm.title, countermeasurePlan.confirm.message, () => {
      const result = settleCompetitorCountermeasure({ countermeasurePlan, competitors, finance, monthlyStats, month, dayOfMonth, formatMoney });
      setFinance(result.finance);
      setCompetitors(result.competitors);
      setMonthlyStats(result.monthlyStats);
      appendLedger(result.ledgerItem);
      addLog(result.log.type, result.log.message);
    });
  };

  return {
    handleAdjustGmSalary,
    handleCompetitorCountermeasure,
    handleManualRepayLoan,
    handlePersonalBailout,
    handleRepayOverdueDraft,
    handleStrategyChange,
    handleVirtualSprint,
  };
}
