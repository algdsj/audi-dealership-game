import { Term } from '../../shared/ui/tooltip.jsx';

export function DashboardOverview({
  month,
  dayOfMonth,
  briefingMetrics,
  todoQueue,
  dailyChecklist,
  operatingRating,
  operatingScore,
  feedbackState,
  latestBadges,
  hasProfitSample,
  netProfit,
  currentLossDrivers,
  unlockedAchievements,
  formatMoney,
  onOpenBriefing,
  onOpenTask,
}) {
  return (
    <>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="bg-slate-900 text-white rounded-xl shadow-sm border border-slate-800 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">今日晨会</p>
              <h3 className="font-black text-lg mt-1">M{month} D{dayOfMonth} 经营简报</h3>
              <p className="text-xs text-slate-300 mt-1">{briefingMetrics[0].value}</p>
            </div>
            <button onClick={onOpenBriefing} className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shrink-0 transition-colors">
              打开简报
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {briefingMetrics.slice(1, 5).map(item => (
              <div key={item.label} className="bg-white/10 rounded-lg p-2">
                <p className="text-[10px] text-slate-400">{item.label}</p>
                <p className="text-xs font-bold text-slate-100 truncate">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-800">待办队列</h3>
            <span className="text-xs font-bold text-slate-400">{todoQueue.length} 项</span>
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
            {todoQueue.length === 0 && <p className="text-sm text-slate-400 py-6 text-center">暂无紧急待办</p>}
            {todoQueue.map(item => (
              <button key={`${item.title}-${item.tab}`} onClick={() => onOpenTask(item)} className="w-full text-left border border-slate-100 rounded-lg p-2 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 transition-colors">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold text-slate-800 truncate">{item.title}</p>
                  <span className={'text-[10px] px-1.5 py-0.5 rounded-full font-bold shrink-0 ' + (item.level === 'high' ? 'bg-red-100 text-red-600' : item.level === 'mid' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-600')}>
                    {item.level === 'high' ? '紧急' : item.level === 'mid' ? '关注' : '提示'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">{item.detail}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">每日任务</p>
              <h3 className="font-black text-slate-800">短周期目标</h3>
            </div>
            <span className="text-xs font-black px-2 py-1 rounded-full bg-slate-100 text-slate-600">
              {dailyChecklist.filter(item => item.done).length}/{dailyChecklist.length}
            </span>
          </div>
          <div className="space-y-2">
            {dailyChecklist.map(item => (
              <button key={item.title} onClick={() => onOpenTask(item)} className={'w-full text-left rounded-lg border p-2 transition-colors ' + (item.done ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100 hover:bg-amber-100')}>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold text-slate-800">{item.title}</p>
                  <span className={'text-[10px] font-black ' + (item.done ? 'text-emerald-600' : 'text-amber-700')}>{item.done ? '完成' : '待处理'}</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">{item.detail}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="rounded-xl bg-slate-900 text-white p-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">实时经营评级</p>
            <div className="flex items-end gap-3 mt-2">
              <p className="text-5xl font-black">{operatingRating.grade}</p>
              <div className="pb-1">
                <p className="font-bold">{operatingRating.label} · {operatingScore}分</p>
                <p className="text-xs text-slate-400">按销量节奏、利润、现金、<Term term="CSI">CSI</Term>和待办计算</p>
              </div>
            </div>
            <div className="mt-3 h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500" style={{ width: `${operatingScore}%` }}></div>
            </div>
          </div>
          <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-black text-slate-800">月度徽章</p>
              <span className="text-xs text-slate-400">{feedbackState.monthlyBadges.length} 枚</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {latestBadges.length === 0 && <p className="text-xs text-slate-400 leading-relaxed">月底达成销量、利润、<Term term="CSI">CSI</Term>或漏斗指标后会发放徽章。</p>}
              {latestBadges.map(badge => (
                <span key={badge.id} title={badge.desc} className="text-xs font-bold px-2 py-1 rounded-full bg-white border border-slate-200 text-slate-700">
                  {badge.name}
                </span>
              ))}
            </div>
            {feedbackState.lastMonthReport && <p className="text-xs text-slate-500 mt-3">{feedbackState.lastMonthReport.headline}</p>}
          </div>
          <div className="rounded-xl bg-red-50 border border-red-100 p-4">
            <p className="text-sm font-black text-slate-800 mb-2">{!hasProfitSample ? '利润体检' : netProfit < 0 ? '亏损原因分析' : '利润体检'}</p>
            {!hasProfitSample ? (
              <p className="text-xs text-slate-600 leading-relaxed">经营样本不足，暂无可靠利润判断。先完成线索、到店、成交或售后业务后再看体检结论。</p>
            ) : currentLossDrivers.length === 0 ? (
              <p className="text-xs text-emerald-700 leading-relaxed">当前<Term term="GP3">GP3</Term>扣除经营费用后为正，继续盯住<Term term="库存周转">库存周转</Term>和月底返利兑现。</p>
            ) : (
              <div className="space-y-2">
                {currentLossDrivers.map(item => (
                  <div key={item.label} className="bg-white/80 rounded-lg border border-red-100 p-2">
                    <div className="flex justify-between gap-2 text-xs font-bold">
                      <span className="text-slate-800">{item.label}</span>
                      <span className="text-red-600">{formatMoney(item.amount)}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">{item.action}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {unlockedAchievements.length === 0 ? (
            <span className="text-xs text-slate-400">成就会在成交、月度达成、现金安全和口碑高光时解锁。</span>
          ) : unlockedAchievements.slice(-6).map(item => (
            <span key={item.id} title={item.desc} className="text-xs font-bold px-2 py-1 rounded-full bg-yellow-50 border border-yellow-200 text-yellow-700">
              {item.name}
            </span>
          ))}
        </div>
      </div>
    </>
  );
}
