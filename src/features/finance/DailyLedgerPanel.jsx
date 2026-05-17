import React from 'react';

export function DailyLedgerPanel({ dailyLedger, month, formatMoney }) {
  const currentMonthEntries = dailyLedger.filter(entry => entry.day > (month - 1) * 30);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
      <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
        <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">📖 每日财务流水明细</h3>
        <span className="text-xs text-slate-400">本月共 {currentMonthEntries.length} 天记录</span>
      </div>
      <div className="max-h-80 overflow-y-auto space-y-3" style={{ scrollbarWidth: 'thin' }}>
        {dailyLedger.length === 0 && <p className="text-sm text-slate-400 text-center py-8">暂无流水记录，开始经营后将自动记录每日收支。</p>}
        {[...currentMonthEntries].reverse().map(entry => {
          const dayNet = entry.items.reduce((sum, item) => sum + (item.type === 'pending' ? 0 : item.amount), 0);

          return (
            <div key={entry.day} className="border border-slate-100 rounded-lg p-3 hover:bg-slate-50 transition-colors">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-500">D{((entry.day - 1) % 30) + 1}</span>
                <span className={'text-xs font-bold  ' + (dayNet >= 0 ? 'text-green-600' : 'text-red-600')}>
                  当日净额: {dayNet >= 0 ? '+' : ''}{formatMoney(dayNet)}
                </span>
              </div>
              <div className="space-y-1">
                {entry.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center text-xs">
                    <span className={' ' + (item.type === 'income' ? 'text-green-700' : item.type === 'pending' ? 'text-blue-600' : 'text-slate-500')}>
                      {item.type === 'income' ? '📈' : item.type === 'pending' ? '⏳' : '📉'} {item.label}
                    </span>
                    <span className={'font-bold  ' + (item.type === 'income' ? 'text-green-600' : item.type === 'pending' ? 'text-blue-500' : 'text-red-500')}>
                      {item.type === 'pending' ? '+' : ''}{item.amount >= 0 ? '+' : ''}{formatMoney(item.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
