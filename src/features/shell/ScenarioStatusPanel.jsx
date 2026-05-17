export function ScenarioStatusPanel({
  activeScenario,
  scenarioProgress,
  isFreeScenario,
  scenarioDurationDays,
  day,
  ownerEquity,
  activeTutorialStep,
  formatMoney,
  onDismissTutorial,
  onSelectTab,
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
      <div className="lg:col-span-2 rounded-xl border border-blue-100 bg-blue-50 p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black text-blue-600">本局目标</p>
            <h3 className="font-black text-slate-900 mt-1">{activeScenario.name}</h3>
            <p className="text-xs text-slate-600 mt-1">{activeScenario.goal}</p>
          </div>
          <div className="min-w-40">
            <div className="flex justify-between text-[10px] font-bold text-blue-700 mb-1">
              <span>进度</span>
              <span>{scenarioProgress}%</span>
            </div>
            <div className="h-2 rounded-full bg-white border border-blue-100 overflow-hidden">
              <div className="h-full bg-blue-600" style={{ width: `${scenarioProgress}%` }}></div>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">{isFreeScenario ? '长期经营' : `剩余 ${Math.max(0, scenarioDurationDays - day)} 天`} · 净资产 {formatMoney(ownerEquity)}</p>
          </div>
        </div>
      </div>
      {activeTutorialStep ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-black text-amber-700">新手引导</p>
              <h3 className="font-black text-slate-900 mt-1">{activeTutorialStep.title}</h3>
              <p className="text-xs text-slate-600 mt-1">{activeTutorialStep.detail}</p>
            </div>
            <button onClick={onDismissTutorial} className="text-xs font-black text-slate-400 hover:text-slate-600">关闭</button>
          </div>
          <button onClick={() => onSelectTab(activeTutorialStep.tab)} className="mt-3 px-3 py-2 rounded-lg bg-amber-600 text-white text-xs font-black hover:bg-amber-700">前往处理</button>
        </div>
      ) : (
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
          <p className="text-xs font-black text-emerald-700">新手引导</p>
          <h3 className="font-black text-slate-900 mt-1">基础循环已打通</h3>
          <p className="text-xs text-slate-600 mt-1">继续盯住月结、返利和现金安全。</p>
        </div>
      )}
    </div>
  );
}
