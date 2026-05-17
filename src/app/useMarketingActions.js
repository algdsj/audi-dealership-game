import { LEAD_CHANNELS, MARKETING_ACTIVITIES } from '../game/config/marketing.js';
import {
  prepareMarketingActivityLaunch,
  settleMarketingActivityLaunch,
} from '../game/engine/marketingLaunch.js';

export function useMarketingActions({
  addLog,
  appendLedger,
  currentDay,
  finance,
  marketing,
  monthlyStats,
  setFinance,
  setMarketing,
  setMonthlyStats,
  showAlert,
  showConfirm,
}) {
  const launchActivity = (activityId) => {
    const launchPlan = prepareMarketingActivityLaunch({ activityId, activities: MARKETING_ACTIVITIES, finance, marketing });
    if (launchPlan.status === 'invalid') return;
    if (launchPlan.alert) return showAlert(launchPlan.alert.title, launchPlan.alert.message);
    showConfirm(launchPlan.confirm.title, launchPlan.confirm.message, () => {
      const result = settleMarketingActivityLaunch({
        launchPlan,
        finance,
        marketing,
        monthlyStats,
        leadChannels: LEAD_CHANNELS,
        currentDay,
      });
      setFinance(result.finance);
      appendLedger(result.ledgerItem);
      setMonthlyStats(result.monthlyStats);
      setMarketing(result.marketing);
      addLog(result.log.type, result.log.message);
    });
  };

  return {
    launchActivity,
  };
}
