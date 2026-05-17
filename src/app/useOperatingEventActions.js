import { resolveOperatingEvent } from '../game/engine/operatingEvents.js';

export function useOperatingEventActions({
  activeDifficulty,
  appendLedger,
  csi,
  currentDay,
  finance,
  formatMoney,
  marketing,
  monthlyStats,
  operatingEvents,
  setCsi,
  setFinance,
  setLogs,
  setManagerInbox,
  setMarketing,
  setMonthlyStats,
  setOperatingEvents,
  showAlert,
}) {
  const handleResolveOperatingEvent = ({ eventId, optionId }) => {
    const eventInstance = (operatingEvents?.pending || []).find(event => event.id === eventId);
    const result = resolveOperatingEvent({
      activeDifficulty,
      csi,
      eventInstance,
      finance,
      formatMoney,
      marketing,
      monthlyStats,
      operatingEvents,
      optionId,
      resolvedDay: currentDay,
    });

    if (!result.ok) {
      showAlert('事件处理失败', '这个事件已不存在或方案不可用，请刷新当前页面后再试。');
      return;
    }

    setFinance(result.finance);
    setMarketing(result.marketing);
    setMonthlyStats(result.monthlyStats);
    setCsi(result.csi);
    setOperatingEvents(result.operatingEvents);
    setLogs(prev => [...prev, ...result.logs]);
    setManagerInbox(prev => [...prev, ...result.inboxItems]);
    if (result.ledgerItems.length > 0) appendLedger(result.ledgerItems, currentDay);
    showAlert(
      result.resolvedEvent.success ? '事件处理成功' : '事件处理完成',
      `${result.resolvedEvent.title} 已按“${result.resolvedEvent.optionTitle}”结算。`,
    );
  };

  return { handleResolveOperatingEvent };
}
