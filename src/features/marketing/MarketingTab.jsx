import React from 'react';
import { LEAD_CHANNELS, MARKETING_ACTIVITIES } from '../../game/config/marketing.js';
import { Icons } from '../../shared/ui/icons.jsx';
import { Term } from '../../shared/ui/tooltip.jsx';

export function MarketingTab({
  marketing,
  leadChannels,
  totalLeadPool,
  monthlyStats,
  dccCount,
  salesCount,
  finance,
  currentDay,
  aiAdCopy,
  isGeneratingAd,
  inventory,
  formatMoney,
  onMarketingBudgetChange,
  onLaunchActivity,
  onGenerateAIAd,
}) {
  return (
    <div>
      <div className="mb-6 border-b border-slate-100 pb-4">
        <h2 className="text-2xl font-bold flex items-center gap-2"><Icons.Funnel /> 营销活动中心</h2>
        <p className="text-slate-500 text-sm mt-1">发起不同类型的营销活动，分渠道运营客户。投流获取采买线索，主播放大直播线索，车展集中爆发，展厅渠道承接口碑和老客。</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {LEAD_CHANNELS.map(channel => (
          <div key={channel.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-black text-slate-800">{channel.icon} {channel.name}</p>
              <span className="text-xs font-bold text-blue-600">{leadChannels[channel.id] || 0} 条</span>
            </div>
            <p className="text-[10px] leading-relaxed text-slate-500">{channel.desc}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {MARKETING_ACTIVITIES.map(activity => {
          const isActive = activity.costType === 'daily' || marketing.activeActivities.some(item => item.activityId === activity.id);
          const activeInstance = marketing.activeActivities.find(item => item.activityId === activity.id);
          const dailyBudget = activity.costType === 'daily'
            ? (marketing[activity.budgetKey] ?? (activity.budgetKey === 'leadPurchaseBudget' ? marketing.budget : 0) ?? 0)
            : activity.cost;

          return (
            <div key={activity.id} className={'bg-gradient-to-br  ' + activity.color + ' border rounded-xl p-5 relative overflow-hidden'}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                    {activity.icon} {activity.name}
                    {isActive && <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-300 animate-pulse">进行中</span>}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{activity.description}</p>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className="text-lg font-black text-slate-800">¥{dailyBudget.toLocaleString()}</p>
                  <p className="text-[10px] text-slate-500">{activity.costType === 'daily' ? '/ 天' : '一次性'}</p>
                </div>
              </div>

              {activity.costType === 'daily' ? (
                <div className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-sm border">
                  <span className="text-slate-500 font-bold text-sm">¥</span>
                  <input
                    type="number"
                    min="0"
                    max="50000"
                    value={dailyBudget}
                    onChange={event => onMarketingBudgetChange(activity.budgetKey, Math.max(0, Math.min(50000, parseInt(event.target.value, 10) || 0)))}
                    className="w-full text-xl font-bold text-slate-800 focus:outline-none"
                  />
                  <span className="text-slate-400 text-sm pr-2 whitespace-nowrap">/ 天</span>
                </div>
              ) : (
                <button
                  onClick={() => onLaunchActivity(activity.id)}
                  disabled={isActive || finance.cash < activity.cost}
                  className={'w-full py-2.5 text-white font-bold rounded-lg shadow disabled:opacity-40 disabled:cursor-not-allowed transition-all  ' + activity.btnColor}
                >
                  {isActive ? `${activity.icon} 进行中 (剩${activeInstance?.endDay - currentDay}天)` : finance.cash < activity.cost ? '资金不足' : `发起${activity.name}`}
                </button>
              )}

              {activity.duration > 0 && !isActive && (
                <p className="text-[10px] text-slate-500 mt-2 text-center">活动持续 {activity.duration} 天</p>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl p-5 mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-20 text-indigo-500"><Icons.Sparkles /></div>
        <div className="relative z-10">
          <h3 className="font-bold text-indigo-900 mb-1 flex items-center gap-2">✨ AI 营销专家写爆款文案</h3>
          <p className="text-sm text-indigo-700 mb-3">AI 根据实时库存撰写广告，立即获取大批意向客户。</p>
          {aiAdCopy && <div className="bg-white p-3 rounded-lg border border-indigo-200 shadow-sm mb-3 text-sm text-slate-700 whitespace-pre-wrap">{aiAdCopy}</div>}
          <button onClick={onGenerateAIAd} disabled={isGeneratingAd || inventory.length === 0} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow disabled:opacity-50 disabled:cursor-not-allowed transition-all">
            {isGeneratingAd ? '🤖 AI 创作中...' : (inventory.length === 0 ? '库存为空' : '✨ ¥5,000 让 AI 策划活动')}
          </button>
        </div>
      </div>

      {marketing.activeActivities.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
          <h3 className="font-bold text-green-800 mb-2 flex items-center gap-2">🎯 进行中的活动</h3>
          <div className="space-y-2">
            {marketing.activeActivities.map(activity => (
              <div key={activity.id} className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-green-100">
                <span className="text-sm font-bold text-slate-700">{activity.icon} {activity.name}</span>
                <span className="text-xs font-bold text-green-600">剩余 {activity.endDay - currentDay} 天</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <h3 className="font-bold text-slate-700 mb-4">客户分层漏斗</h3>
      <div className="relative pt-4 pb-8 max-w-md mx-auto">
        <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-full flex flex-col items-center opacity-10 pointer-events-none justify-center gap-1">
          <div className="w-full h-1/5 bg-blue-500 rounded-t-xl"></div>
          <div className="w-11/12 h-1/5 bg-indigo-500 rounded-xl"></div>
          <div className="w-4/5 h-1/5 bg-violet-500 rounded-xl"></div>
          <div className="w-3/5 h-1/5 bg-green-500 rounded-b-xl"></div>
        </div>

        <div className="relative z-10 space-y-5">
          <div className="bg-white border-2 border-slate-200 rounded-lg p-4 text-center shadow-sm relative">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">📞 <Term term="线索">线索池</Term> (Leads)</p>
            <p className="text-3xl font-black text-blue-600">{totalLeadPool} <span className="text-sm font-normal text-slate-500">待跟进</span></p>
            <p className="text-xs text-slate-400 mt-1">本月累计获取: {monthlyStats.leads} {monthlyStats.recoveredLeads > 0 && <span className="text-emerald-500">(含老客回收 {monthlyStats.recoveredLeads})</span>}</p>
            <div className="grid grid-cols-4 gap-1 mt-3">
              {LEAD_CHANNELS.map(channel => (
                <div key={channel.id} className="rounded bg-slate-50 border border-slate-100 py-1">
                  <p className="text-[10px] text-slate-400">{channel.shortName}</p>
                  <p className="text-xs font-bold text-slate-700">{leadChannels[channel.id] || 0}</p>
                </div>
              ))}
            </div>
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-slate-300 text-lg">↓</div>
          </div>
          <div className="bg-white border-2 border-slate-200 rounded-lg p-4 text-center shadow-sm w-11/12 mx-auto relative">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">📞 <Term term="DCC">DCC</Term><Term term="邀约到店率">邀约到店</Term></p>
            <p className="text-2xl font-black text-indigo-600">{monthlyStats.dccWalkIns || 0} <span className="text-sm font-normal text-slate-500">批</span></p>
            <p className="text-xs text-slate-400 mt-1"><Term term="邀约到店率">邀约率</Term>: {monthlyStats.leads > 0 ? ((monthlyStats.dccWalkIns / monthlyStats.leads) * 100).toFixed(1) : 0}% | <Term term="DCC">DCC专员</Term>: {dccCount}人</p>
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-slate-300 text-lg">↓</div>
          </div>
          <div className="bg-white border-2 border-slate-200 rounded-lg p-4 text-center shadow-sm w-4/5 mx-auto relative">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">🚶 自然进店客流</p>
            <p className="text-2xl font-black text-violet-600">{monthlyStats.naturalWalkIns || 0} <span className="text-sm font-normal text-slate-500">批</span></p>
            <p className="text-xs text-slate-400 mt-1">展厅车型多样性 + 店级加成</p>
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-slate-300 text-lg">↓</div>
          </div>
          <div className="bg-white border-2 border-green-200 rounded-lg p-4 text-center shadow-sm w-3/5 mx-auto">
            <p className="text-xs font-bold text-green-600 uppercase tracking-widest mb-1">✅ 销售成交</p>
            <p className="text-3xl font-black text-green-600">{monthlyStats.sales} <span className="text-sm font-normal text-slate-500">台</span></p>
            <p className="text-xs text-slate-400 mt-1"><Term term="销售转化率">转化率</Term>: {monthlyStats.walkIns > 0 ? ((monthlyStats.sales / monthlyStats.walkIns) * 100).toFixed(1) : 0}% | 接待上限: {salesCount * 5}批/天</p>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-slate-50 border border-slate-200 rounded-xl p-4">
        <h3 className="font-bold text-slate-700 mb-3">本月营销支出汇总</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
          <div className="bg-white p-2 rounded border"><p className="text-[10px] text-slate-400">日预算支出</p><p className="font-bold text-sm text-blue-600">{formatMoney(monthlyStats.marketingCost - (monthlyStats.activitySpend || 0))}</p></div>
          <div className="bg-white p-2 rounded border"><p className="text-[10px] text-slate-400">活动支出</p><p className="font-bold text-sm text-amber-600">{formatMoney(monthlyStats.activitySpend || 0)}</p></div>
          <div className="bg-white p-2 rounded border"><p className="text-[10px] text-slate-400">营销总支出</p><p className="font-bold text-sm text-red-600">{formatMoney(monthlyStats.marketingCost)}</p></div>
          <div className="bg-white p-2 rounded border"><p className="text-[10px] text-slate-400">老客回收线索</p><p className="font-bold text-sm text-emerald-600">{monthlyStats.recoveredLeads || 0} 条</p></div>
        </div>
      </div>
    </div>
  );
}
