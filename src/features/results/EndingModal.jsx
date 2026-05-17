export function EndingModal({
  currentEnding,
  endingMeta,
  balanceAssets,
  finance,
  ownerEquity,
  formatMoney,
  onViewReport,
  onRestart,
}) {
  if (!currentEnding || !endingMeta) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-100">
        <div className={`${endingMeta.tone} text-white p-6`}>
          <p className="text-xs font-black uppercase tracking-widest opacity-80">Game Ending</p>
          <h2 className="text-3xl font-black mt-2">{endingMeta.title}</h2>
          <p className="text-sm opacity-90 mt-2">{endingMeta.desc}</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
              <p className="text-[10px] text-slate-400">剧本</p>
              <p className="font-black text-slate-900">{currentEnding.scenarioName}</p>
            </div>
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
              <p className="text-[10px] text-slate-400">难度</p>
              <p className="font-black text-slate-900">{currentEnding.difficultyName}</p>
            </div>
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
              <p className="text-[10px] text-slate-400">经营天数</p>
              <p className="font-black text-slate-900">{currentEnding.day}天</p>
            </div>
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
              <p className="text-[10px] text-slate-400">A/S月评</p>
              <p className="font-black text-slate-900">{currentEnding.excellentMonths || 0}次</p>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 mb-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div><p className="text-slate-400 text-xs font-bold">总资产</p><p className="font-black text-slate-900">{formatMoney(currentEnding.totalAssets || balanceAssets)}</p></div>
              <div><p className="text-slate-400 text-xs font-bold">总负债</p><p className="font-black text-red-600">{formatMoney(currentEnding.liabilities || currentEnding.loan || finance.loan)}</p></div>
              <div><p className="text-slate-400 text-xs font-bold">净资产</p><p className={(currentEnding.netAssets || 0) >= 0 ? 'font-black text-emerald-600' : 'font-black text-red-600'}>{formatMoney(currentEnding.netAssets || ownerEquity)}</p></div>
            </div>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <button onClick={onViewReport} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700">查看战报</button>
            <button onClick={onRestart} className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-bold hover:bg-slate-800">重新开局</button>
          </div>
        </div>
      </div>
    </div>
  );
}
