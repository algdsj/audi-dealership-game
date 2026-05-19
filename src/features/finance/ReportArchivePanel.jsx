import React from 'react';

export function ReportArchivePanel({
  feedbackState,
  getRatingMeta,
  formatMoney,
  excellentMonthCount,
  ownerEquity,
}) {
  const ratingHistory = feedbackState.ratingHistory;

  return (
    <div className="bg-slate-900 text-white rounded-xl p-5 mb-6 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-4">
        <div>
          <p className="text-xs font-black text-blue-300">正式战报</p>
          <h3 className="text-xl font-black mt-1">月报 / 年报中心</h3>
          <p className="text-sm text-slate-300 mt-1">月结后自动沉淀战报，记录销量、净利润、返利、投资人评分和年度累计。</p>
        </div>
        <div className="text-sm text-slate-300">
          已生成 <span className="font-black text-white">{ratingHistory.length}</span> 期月报
        </div>
      </div>
      {ratingHistory.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">暂无月报。完成首次月结后，这里会生成正式经营战报。</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[...ratingHistory].slice(-4).reverse().map(report => (
            <div key={report.month} className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black text-blue-200">M{report.month} 月报</p>
                  <h4 className="font-black text-white mt-1">{report.headline}</h4>
                </div>
                <span className="rounded-full bg-white text-slate-900 px-2 py-1 text-xs font-black">{report.rating?.grade || getRatingMeta(report.score || 0).grade}</span>
              </div>
              <div className="grid grid-cols-4 gap-2 mt-3 text-xs">
                <div><p className="text-slate-400">销量</p><p className="font-black">{report.sales}/{report.target}</p></div>
                <div><p className="text-slate-400">净利</p><p className={(report.netProfit || 0) >= 0 ? 'font-black text-emerald-300' : 'font-black text-red-300'}>{formatMoney(report.netProfit || 0)}</p></div>
                <div><p className="text-slate-400">返利</p><p className="font-black text-emerald-300">{formatMoney(report.payout || 0)}</p></div>
                <div><p className="text-slate-400">评分</p><p className="font-black">{Math.round(report.investorScore || 0)}</p></div>
              </div>
              {report.quarterlyChallenge && (
                <div className="mt-3 rounded-lg border border-blue-300/20 bg-blue-400/10 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-black text-blue-100">{report.quarterlyChallenge.label}</p>
                    <span className="text-xs font-black text-blue-100">{report.quarterlyChallenge.progress}%</span>
                  </div>
                  <p className="mt-1 text-[10px] font-bold text-blue-100/80">{report.quarterlyChallenge.theme}</p>
                </div>
              )}
              {report.operatingReview?.nextActions?.length > 0 && (
                <p className="text-xs text-amber-100 mt-3">复盘建议：{report.operatingReview.nextActions[0]}</p>
              )}
              {report.badges?.length > 0 && <p className="text-xs text-blue-100 mt-3">徽章：{report.badges.map(item => item.name).join('、')}</p>}
            </div>
          ))}
        </div>
      )}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-lg bg-white/10 p-3"><p className="text-[10px] text-slate-400">年度销量</p><p className="font-black">{ratingHistory.reduce((sum, item) => sum + (item.sales || 0), 0)}台</p></div>
        <div className="rounded-lg bg-white/10 p-3"><p className="text-[10px] text-slate-400">年度净利润</p><p className="font-black">{formatMoney(ratingHistory.reduce((sum, item) => sum + (item.netProfit || 0), 0))}</p></div>
        <div className="rounded-lg bg-white/10 p-3"><p className="text-[10px] text-slate-400">A/S月评</p><p className="font-black">{excellentMonthCount}次</p></div>
        <div className="rounded-lg bg-white/10 p-3"><p className="text-[10px] text-slate-400">当前净资产</p><p className="font-black">{formatMoney(ownerEquity)}</p></div>
      </div>
    </div>
  );
}
