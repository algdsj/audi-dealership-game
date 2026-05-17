import { prepareCompetitorIntelAction, settleCompetitorIntelAction } from '../game/engine/competitorIntel.js';

export function useCompetitorIntelActions({
  activeDifficulty,
  addLog,
  appendLedger,
  competitors,
  dayOfMonth,
  finance,
  formatMoney,
  month,
  setCompetitors,
  setFinance,
  showAlert,
  showConfirm,
}) {
  const handleCompetitorIntelAction = (actionId, options = {}) => {
    const intelPlan = prepareCompetitorIntelAction({
      actionId,
      activeDifficulty,
      competitors,
      finance,
      formatMoney,
      storeId: options.storeId || null,
    });
    if (intelPlan.status === 'invalid') return;
    if (intelPlan.alert) return showAlert(intelPlan.alert.title, intelPlan.alert.message);
    showConfirm(intelPlan.confirm.title, intelPlan.confirm.message, () => {
      const result = settleCompetitorIntelAction({
        intelPlan,
        competitors,
        finance,
        month,
        dayOfMonth,
        formatMoney,
      });
      if (result.status !== 'settled') return;
      setFinance(result.finance);
      setCompetitors(result.competitors);
      appendLedger(result.ledgerItem);
      addLog(result.log.type, result.log.message);
    });
  };

  return {
    handleCompetitorIntelAction,
  };
}
