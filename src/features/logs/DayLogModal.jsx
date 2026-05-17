export function DayLogModal({ selectedLogDay, logs, dailyLedger, currentDay, formatMoney, onClose, onSelectDay }) {
  if (selectedLogDay === null) return null;

  const logDay = selectedLogDay;
  const dayLogs = logs.filter(l => l.day === logDay);
  const dayLedgerEntry = dailyLedger.find(l => l.day === logDay);
  const dayMonth = Math.floor((logDay - 1) / 30) + 1;
  const dayOfMonth = ((logDay - 1) % 30) + 1;
  const dayNet = dayLedgerEntry ? dayLedgerEntry.items.reduce((sum, i) => sum + (i.type === 'pending' ? 0 : i.amount), 0) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-100 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-slate-800">📅 M{dayMonth} D{dayOfMonth} 经营日报详情</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg font-bold">✕</button>
        </div>

        <div className="mb-5">
          <h4 className="font-bold text-slate-700 mb-2 text-sm">📝 经营事件</h4>
          <div className="space-y-2">
            {dayLogs.length > 0 ? dayLogs.map((log, i) => (
              <div key={i} className={`p-3 rounded-lg border text-sm ${
                log.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
                log.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800' :
                log.type === 'expense' ? 'bg-red-50 border-red-200 text-red-800' :
                'bg-blue-50 border-blue-200 text-blue-800'
              }`}>
                <span className="font-bold mr-2">[{log.type === 'success' ? '完成' : log.type === 'warning' ? '预警' : log.type === 'expense' ? '财务' : '事件'}]</span>
                {log.message}
              </div>
            )) : <p className="text-sm text-slate-400">暂无经营事件记录</p>}
          </div>
        </div>

        <div className="mb-5">
          <h4 className="font-bold text-slate-700 mb-2 text-sm">💰 财务流水明细</h4>
          {dayLedgerEntry ? (
            <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
              <div className="space-y-2">
                {dayLedgerEntry.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm">
                    <span className={' ' + (item.type === 'income' ? 'text-green-700' : item.type === 'pending' ? 'text-blue-600' : 'text-slate-500')}>
                      {item.type === 'income' ? '📈' : item.type === 'pending' ? '⏳' : '📉'} {item.label}
                    </span>
                    <span className={'font-bold  ' + (item.type === 'income' ? 'text-green-600' : item.type === 'pending' ? 'text-blue-500' : 'text-red-500')}>
                      {item.type === 'pending' ? '+' : ''}{item.amount >= 0 ? '+' : ''}{formatMoney(item.amount)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t-2 border-slate-300 flex justify-between items-center">
                <span className="font-bold text-slate-800">当日净额</span>
                <span className={'text-lg font-black  ' + (dayNet >= 0 ? 'text-green-600' : 'text-red-600')}>
                  {dayNet >= 0 ? '+' : ''}{formatMoney(dayNet)}
                </span>
              </div>
            </div>
          ) : <p className="text-sm text-slate-400">暂无财务流水记录</p>}
        </div>

        <div className="flex justify-between items-center border-t border-slate-200 pt-4">
          <button onClick={() => onSelectDay(logDay - 1)} disabled={logDay <= 1} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            ← 前一天
          </button>
          <span className="text-xs text-slate-400">D{dayOfMonth}</span>
          <button onClick={() => onSelectDay(logDay + 1)} disabled={logDay >= currentDay} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            后一天 →
          </button>
        </div>
      </div>
    </div>
  );
}
