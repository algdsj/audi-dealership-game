import { Term } from '../../shared/ui/tooltip.jsx';

export function MonthlySummaryModal({ summary, formatMoney, onClose, onViewReports, onViewRebate, onOpenInbox }) {
  if (!summary) return null;
  const review = summary.operatingReview;
  const challenge = summary.quarterlyChallenge || review?.challenge;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-6 border border-slate-100 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <p className="text-xs font-black text-blue-600">M{summary.month} 月结完成</p>
            <h3 className="text-xl font-black text-slate-900 mt-1">月度经营摘要</h3>
            <p className="text-sm text-slate-500 mt-1">{summary.headline}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg font-bold">✕</button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
            <p className="text-[10px] text-slate-400">经营评分</p>
            <p className="text-xl font-black text-slate-900">{summary.score}</p>
          </div>
          <div className="rounded-xl bg-violet-50 border border-violet-100 p-3">
            <p className="text-[10px] text-violet-500">投资人评分</p>
            <p className="text-xl font-black text-violet-700">{summary.investorScore}</p>
          </div>
          <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3">
            <p className="text-[10px] text-emerald-600">返利到账</p>
            <p className="text-lg font-black text-emerald-700">{formatMoney(summary.payout)}</p>
          </div>
          <div className="rounded-xl bg-blue-50 border border-blue-100 p-3">
            <p className="text-[10px] text-blue-600">库存融资授信</p>
            <p className="text-lg font-black text-blue-700">{formatMoney(summary.creditLimit)}</p>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 mb-5">
          <p className="text-xs font-black text-slate-700 mb-1">下月政策</p>
          <p className="text-sm text-slate-600 leading-relaxed">{summary.policy}</p>
          <p className="text-xs text-slate-500 mt-2"><Term term="承兑汇票专项授信">汇票授信</Term>：{formatMoney(summary.draftCreditLimit)}</p>
        </div>
        {challenge && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 mb-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black text-blue-600">季度挑战</p>
                <h4 className="mt-1 font-black text-blue-950">{challenge.label} · {challenge.theme}</h4>
                <p className="mt-1 text-xs font-bold leading-5 text-blue-700">{challenge.desc}</p>
              </div>
              <span className="rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-black text-blue-700">{challenge.progress}%</span>
            </div>
            {challenge.checks?.length > 0 && (
              <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-3">
                {challenge.checks.slice(0, 3).map(item => (
                  <div key={item.label} className="rounded-lg border border-white bg-white p-2 text-xs">
                    <p className="font-black text-slate-700">{item.label}</p>
                    <p className={item.passed ? 'font-bold text-emerald-700' : 'font-bold text-amber-700'}>
                      {item.format ? item.format(item.actual) : `${item.actual}${item.suffix || ''}`} / {item.format ? item.format(item.target) : `${item.target}${item.suffix || ''}`}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {review?.findings?.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-4 mb-5">
            <p className="text-xs font-black text-slate-500 mb-3">经营复盘</p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {review.findings.slice(0, 4).map(item => (
                <div key={item.id} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-black text-slate-800">{item.label}</p>
                    <span className={(item.tone === 'red' ? 'text-red-700' : item.tone === 'amber' ? 'text-amber-700' : item.tone === 'emerald' ? 'text-emerald-700' : 'text-blue-700') + ' text-xs font-black'}>{item.value}</span>
                  </div>
                  <p className="mt-1 text-xs font-bold leading-5 text-slate-500">{item.detail}</p>
                </div>
              ))}
            </div>
            {review.nextActions?.length > 0 && (
              <div className="mt-3 rounded-lg border border-amber-100 bg-amber-50 p-3">
                <p className="text-xs font-black text-amber-800">下月优先动作</p>
                <ul className="mt-2 space-y-1 text-xs font-bold leading-5 text-amber-700">
                  {review.nextActions.slice(0, 3).map((action, index) => <li key={index}>{action}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
        <div className="flex flex-wrap justify-end gap-2">
          <button onClick={onViewReports} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700">查看报表</button>
          <button onClick={onViewRebate} className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 text-sm font-bold hover:bg-slate-50">返利详情</button>
          <button onClick={() => onOpenInbox(summary.day)} className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 text-sm font-bold hover:bg-slate-50">当日收件</button>
        </div>
      </div>
    </div>
  );
}
