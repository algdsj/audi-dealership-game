import { resolveCustomerFollowUp } from '../game/engine/customerLifecycle.js';

export function useCustomerLifecycleActions({
  activeDifficulty,
  appendLedger,
  csi,
  customerLifecycle,
  currentDay,
  finance,
  formatMoney,
  insuranceRenewals,
  marketing,
  monthlyStats,
  setCsi,
  setCustomerLifecycle,
  setFinance,
  setInsuranceRenewals,
  setLogs,
  setMarketing,
  setMonthlyStats,
  showAlert,
}) {
  const handleCustomerFollowUp = ({ followUpId, actionId }) => {
    const result = resolveCustomerFollowUp({
      actionId,
      activeDifficulty,
      csi,
      customerLifecycle,
      currentDay,
      finance,
      followUpId,
      formatMoney,
      insuranceRenewals,
      marketing,
      monthlyStats,
    });

    if (!result.ok) {
      showAlert('跟进失败', '这个客户跟进机会已不存在或已处理。');
      return;
    }

    setCustomerLifecycle(result.customerLifecycle);
    setFinance(result.finance);
    setMarketing(result.marketing);
    setMonthlyStats(result.monthlyStats);
    setCsi(result.csi);
    setInsuranceRenewals(result.insuranceRenewals);
    setLogs(prev => [...prev, ...result.logs]);
    if (result.ledgerItems.length > 0) appendLedger(result.ledgerItems, currentDay);
    showAlert(result.success ? '跟进成功' : '跟进完成', result.logs[0]?.message || '客户跟进已完成。');
  };

  return { handleCustomerFollowUp };
}
