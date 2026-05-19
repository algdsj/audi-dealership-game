import React from 'react';
import { Term } from '../../shared/ui/tooltip.jsx';

export function CustomerNegotiationTab({
  customerDeals,
  estimateDealAddons,
  formatMoney,
  onCustomerDeal,
}) {
  const pendingDeals = customerDeals.filter(item => item.status === 'pending');

  return (
    <div className="animate-fade-in">
      <div className="mb-6 border-b border-slate-100 pb-4 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">👤 重点客户谈判</h2>
          <p className="text-slate-500 text-sm mt-1">销售团队每天从到店客流中筛出重点客户。你来决定守价、让利、金融锁客还是放弃。</p>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-xs text-blue-700">
          待谈判 {pendingDeals.length} 位 · 过期自动流失
        </div>
      </div>

      {pendingDeals.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-xl text-slate-400">
          暂无重点客户。继续经营下一天，DCC和销售会从各渠道客流中筛出可谈判客户。
        </div>
      ) : (
        <div className="space-y-4">
          {pendingDeals.map(item => {
            const profile = item.profile || {};
            const preferredSeries = item.preferredSeries || profile.preferredSeries || [];
            const avoidedSeries = item.avoidedSeries || profile.avoidedSeries || [];
            const sensitivityLabel = item.sensitivity?.label || profile.sensitivity?.label;
            const marginProfit = estimateDealAddons(item.modelId, item.currentPrice).grossProfit;
            const balancedPrice = Math.max(item.targetPrice, Math.round((item.currentPrice + item.targetPrice) / 2 / 1000) * 1000);
            const balancedProfit = estimateDealAddons(item.modelId, balancedPrice).grossProfit;
            const closeProfit = estimateDealAddons(item.modelId, item.floorPrice).grossProfit;
            const targetDealAddons = estimateDealAddons(item.modelId, item.targetPrice);
            const financeProfit = targetDealAddons.grossProfit + Math.round(targetDealAddons.financeCommission * 0.45);

            return (
              <div key={item.id} className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="p-5 bg-gradient-to-r from-slate-50 to-blue-50/40 border-b border-slate-100">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="text-xs font-bold px-2 py-1 rounded bg-blue-100 text-blue-700 border border-blue-200">{item.channelIcon} {item.channelName}</span>
                        <span className="text-xs font-bold px-2 py-1 rounded bg-slate-100 text-slate-600 border border-slate-200">{item.archetypeName}</span>
                        {preferredSeries[0] && (
                          <span className="text-xs font-bold px-2 py-1 rounded bg-emerald-100 text-emerald-700 border border-emerald-200">偏好 {preferredSeries.join(' / ')}</span>
                        )}
                        <span className="text-xs font-bold px-2 py-1 rounded bg-amber-100 text-amber-700 border border-amber-200">D{((item.dueDay - 1) % 30) + 1}前有效</span>
                      </div>
                      <h3 className="text-lg font-black text-slate-900">{item.customerName} · 意向 {item.modelName}</h3>
                      <p className="text-xs text-slate-500 mt-1">{item.archetypeDesc}</p>
                      {profile.purpose && (
                        <p className="text-xs text-slate-600 mt-2 font-bold">
                          用车场景：{profile.purpose} · {profile.decisionRole}
                        </p>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center min-w-[300px]">
                      <div className="bg-white rounded-lg border border-slate-100 p-2">
                        <p className="text-[10px] text-slate-400"><Term term="金融佣金">金融意向</Term></p>
                        <p className="text-sm font-black text-indigo-600">{Math.round(item.financeIntent * 100)}%</p>
                      </div>
                      <div className="bg-white rounded-lg border border-slate-100 p-2">
                        <p className="text-[10px] text-slate-400"><Term term="置换">置换可能</Term></p>
                        <p className="text-sm font-black text-emerald-600">{Math.round(item.tradeInIntent * 100)}%</p>
                      </div>
                      <div className="bg-white rounded-lg border border-slate-100 p-2">
                        <p className="text-[10px] text-slate-400">急迫度</p>
                        <p className="text-sm font-black text-orange-600">{Math.round(item.urgency * 100)}%</p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4 text-xs">
                    <div className="bg-white rounded-lg p-2 border border-slate-100"><p className="text-slate-400">当前标价</p><p className="font-bold">{formatMoney(item.currentPrice)}</p></div>
                    <div className="bg-white rounded-lg p-2 border border-slate-100"><p className="text-slate-400">客户心理价</p><p className="font-bold text-blue-600">{formatMoney(item.targetPrice)}</p></div>
                    <div className="bg-white rounded-lg p-2 border border-slate-100"><p className="text-slate-400">竞品报价</p><p className="font-bold text-red-600">{formatMoney(item.competitorPrice)}</p></div>
                    <div className="bg-white rounded-lg p-2 border border-slate-100"><p className="text-slate-400">底线价</p><p className="font-bold">{formatMoney(item.floorPrice)}</p></div>
                  </div>
                  {profile.focus && (
                    <div className="mt-4 grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-3">
                      <div className="bg-white/80 rounded-lg p-3 border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 mb-2">客户画像</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <p className="text-slate-400">明示预算</p>
                            <p className="font-black text-slate-800">{formatMoney(profile.statedBudget || item.targetPrice)}</p>
                          </div>
                          <div>
                            <p className="text-slate-400">预算上限</p>
                            <p className="font-black text-slate-800">{formatMoney(profile.budgetCeiling || item.targetPrice)}</p>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {sensitivityLabel && (
                            <span className="rounded bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-700 border border-blue-100">{sensitivityLabel}</span>
                          )}
                          {preferredSeries.map(series => (
                            <span key={`preferred-${series}`} className="rounded bg-cyan-50 px-2 py-1 text-[10px] font-bold text-cyan-700 border border-cyan-100">偏好{series}</span>
                          ))}
                          {avoidedSeries.map(series => (
                            <span key={`avoided-${series}`} className="rounded bg-slate-50 px-2 py-1 text-[10px] font-bold text-slate-500 border border-slate-100">不优先{series}</span>
                          ))}
                          {(profile.focus || []).map(label => (
                            <span key={label} className="rounded bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700 border border-emerald-100">{label}</span>
                          ))}
                          {(profile.objections || []).map(label => (
                            <span key={label} className="rounded bg-red-50 px-2 py-1 text-[10px] font-bold text-red-700 border border-red-100">{label}</span>
                          ))}
                        </div>
                      </div>
                      <div className="bg-slate-900 rounded-lg p-3 text-xs text-slate-200">
                        <p className="text-[10px] font-black text-slate-400 mb-2">销售建议</p>
                        <p className="leading-relaxed">{profile.communicationTips?.[0]}</p>
                        <p className="leading-relaxed mt-1 text-slate-300">{profile.communicationTips?.[1]}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                  <button onClick={() => onCustomerDeal(item.id, 'margin')} className="text-left rounded-lg border border-slate-200 hover:border-slate-400 hover:bg-slate-50 p-3 transition-colors">
                    <p className="font-black text-slate-800">守价成交</p>
                    <p className="text-xs text-slate-500 mt-1">坚持现标价，利润更稳但成交率偏低。</p>
                    <p className="text-xs mt-2">成交价 <span className="font-bold">{formatMoney(item.currentPrice)}</span></p>
                    <p className={(marginProfit >= 0 ? 'text-green-600' : 'text-red-600') + ' text-sm font-black mt-1'}>{formatMoney(marginProfit)}</p>
                  </button>
                  <button onClick={() => onCustomerDeal(item.id, 'balanced')} className="text-left rounded-lg border border-blue-200 hover:border-blue-400 bg-blue-50/40 hover:bg-blue-50 p-3 transition-colors">
                    <p className="font-black text-blue-800">适度让利</p>
                    <p className="text-xs text-slate-500 mt-1">给客户台阶，兼顾成交和毛利。</p>
                    <p className="text-xs mt-2">成交价 <span className="font-bold">{formatMoney(balancedPrice)}</span></p>
                    <p className={(balancedProfit >= 0 ? 'text-green-600' : 'text-red-600') + ' text-sm font-black mt-1'}>{formatMoney(balancedProfit)}</p>
                  </button>
                  <button onClick={() => onCustomerDeal(item.id, 'finance')} className="text-left rounded-lg border border-indigo-200 hover:border-indigo-400 bg-indigo-50/40 hover:bg-indigo-50 p-3 transition-colors">
                    <p className="font-black text-indigo-800">金融方案锁客</p>
                    <p className="text-xs text-slate-500 mt-1">用低首付/月供方案提升成交和<Term term="金融佣金">金融佣金</Term>。</p>
                    <p className="text-xs mt-2">成交价 <span className="font-bold">{formatMoney(item.targetPrice)}</span></p>
                    <p className={(financeProfit >= 0 ? 'text-green-600' : 'text-red-600') + ' text-sm font-black mt-1'}>{formatMoney(financeProfit)}</p>
                  </button>
                  <button onClick={() => onCustomerDeal(item.id, 'close')} className="text-left rounded-lg border border-red-200 hover:border-red-400 bg-red-50/40 hover:bg-red-50 p-3 transition-colors">
                    <p className="font-black text-red-800">强力收单</p>
                    <p className="text-xs text-slate-500 mt-1">贴近底线价，快速拿下订单但牺牲毛利。</p>
                    <p className="text-xs mt-2">成交价 <span className="font-bold">{formatMoney(item.floorPrice)}</span></p>
                    <p className={(closeProfit >= 0 ? 'text-green-600' : 'text-red-600') + ' text-sm font-black mt-1'}>{formatMoney(closeProfit)}</p>
                  </button>
                </div>
                <div className="px-5 pb-5">
                  <button onClick={() => onCustomerDeal(item.id, 'reject')} className="text-xs font-bold text-slate-500 hover:text-red-600 transition-colors">
                    放弃该客户
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
