export function useCsiActions({
  addLog,
  appendLedger,
  finance,
  setCsi,
  setFinance,
  showAlert,
}) {
  const handleCsiCareAction = () => {
    if (finance.cash < 2000) return showAlert('预算不足', '现金不足，客户关怀需要 ¥2,000！');
    setCsi(prev => ({ ...prev, score: Math.min(100, prev.score + 2) }));
    setFinance(prev => ({ ...prev, cash: prev.cash - 2000 }));
    appendLedger({ label: 'CSI客户关怀', amount: -2000, type: 'expense' });
    addLog('success', '🎁【客户关怀】投入¥2,000，CSI满意度+2分。');
  };

  const handleCsiFollowUpAction = () => {
    if (finance.cash < 1000) return showAlert('预算不足', '现金不足，售后回访需要 ¥1,000！');
    setCsi(prev => ({ ...prev, score: Math.min(100, prev.score + 1) }));
    setFinance(prev => ({ ...prev, cash: prev.cash - 1000 }));
    appendLedger({ label: 'CSI售后回访', amount: -1000, type: 'expense' });
    addLog('success', '📞【售后回访】投入¥1,000，CSI满意度+1分。');
  };

  return {
    handleCsiCareAction,
    handleCsiFollowUpAction,
  };
}
