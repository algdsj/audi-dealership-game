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
  const checklist = activeTutorialStep?.checklist || [];

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
              <p className="text-xs font-black text-amber-700">
                {activeTutorialStep.dayLabel || '新手引导'}
                {typeof activeTutorialStep.progressPercent === 'number' ? ` · ${activeTutorialStep.progressPercent}%` : ''}
              </p>
              <h3 className="font-black text-slate-900 mt-1">{activeTutorialStep.title}</h3>
              <p className="text-xs text-slate-600 mt-1">{activeTutorialStep.detail}</p>
            </div>
            <button onClick={onDismissTutorial} className="text-xs font-black text-slate-400 hover:text-slate-600">关闭</button>
          </div>
          {checklist.length > 0 && (
            <div className="mt-3 space-y-1">
              {checklist.slice(0, 3).map(item => (
                <div key={item.id || item.label} className="flex items-start gap-2 text-[11px] font-bold text-slate-600">
                  <span className={`mt-0.5 h-3 w-3 rounded-full border ${item.done ? 'border-emerald-400 bg-emerald-300' : 'border-amber-300 bg-white'}`}></span>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          )}
          <button onClick={() => onSelectTab(activeTutorialStep.tab)} className="mt-3 px-3 py-2 rounded-lg bg-amber-600 text-white text-xs font-black hover:bg-amber-700">
            {activeTutorialStep.actionLabel || '前往处理'}
          </button>
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
