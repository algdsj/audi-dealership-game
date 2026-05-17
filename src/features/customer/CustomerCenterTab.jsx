import { CUSTOMER_FOLLOWUP_ACTIONS } from '../../game/config/customerLifecycle.js';

const statusClass = {
  sold: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  lost: 'border-amber-200 bg-amber-50 text-amber-700',
  rejected: 'border-slate-200 bg-slate-50 text-slate-600',
};

const statusLabel = {
  sold: '成交',
  lost: '战败',
  rejected: '放弃',
};

const summarizeRecords = (records) => ({
  sold: records.filter(item => item.status === 'sold').length,
  lost: records.filter(item => item.status === 'lost').length,
  rejected: records.filter(item => item.status === 'rejected').length,
  highValue: records.filter(item => item.valueScore >= 58).length,
});

export function CustomerCenterTab({
  customerLifecycle,
  currentDay,
  formatMoney,
  onCustomerFollowUp,
}) {
  const records = customerLifecycle?.records || [];
  const pendingFollowUps = (customerLifecycle?.followUps || []).filter(item => item.status === 'pending');
  const recentRecords = records.slice(0, 12);
  const summary = summarizeRecords(records);

  return (
    <div className="animate-fade-in">
      <div className="mb-6 border-b border-slate-100 pb-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">客户中心</h2>
            <p className="mt-1 text-sm text-slate-500">沉淀成交、战败和放弃客户，把一次谈判变成长期经营资产。</p>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-slate-400">档案</p>
              <p className="font-black text-slate-900">{records.length}</p>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
              <p className="text-emerald-500">成交</p>
              <p className="font-black text-emerald-700">{summary.sold}</p>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
              <p className="text-amber-500">战败</p>
              <p className="font-black text-amber-700">{summary.lost}</p>
            </div>
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
              <p className="text-blue-500">待跟进</p>
              <p className="font-black text-blue-700">{pendingFollowUps.length}</p>
            </div>
          </div>
        </div>
      </div>

      <section className="mb-6">
        <div className="mb-3">
          <h3 className="font-black text-slate-900">待跟进机会</h3>
          <p className="text-xs text-slate-400">由日结根据客户画像、CSI 和难度生成。</p>
        </div>
        <div className="grid gap-3 xl:grid-cols-2">
          {pendingFollowUps.length === 0 && (
            <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm font-bold text-slate-400 xl:col-span-2">
              暂无客户跟进机会。成交或战败客户沉淀后，客户中心会逐步生成可跟进事项。
            </p>
          )}
          {pendingFollowUps.map(item => (
            <article key={item.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-slate-900">{item.title}</p>
                  <p className="mt-1 text-xs font-bold text-slate-400">{item.customerName} · {item.modelName} · D{item.dueDay}前</p>
                </div>
                <span className="rounded border border-blue-200 bg-blue-50 px-2 py-1 text-[10px] font-black text-blue-700">
                  价值 {item.valueScore}
                </span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{item.body}</p>
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                {CUSTOMER_FOLLOWUP_ACTIONS.map(action => (
                  <button
                    key={action.id}
                    type="button"
                    onClick={() => onCustomerFollowUp({ followUpId: item.id, actionId: action.id })}
                    className="rounded-lg border border-slate-200 bg-white p-3 text-left transition hover:border-blue-300 hover:bg-blue-50"
                  >
                    <p className="text-xs font-black text-slate-900">{action.title}</p>
                    <p className="mt-1 min-h-10 text-[11px] leading-relaxed text-slate-500">{action.description}</p>
                    <p className="mt-2 text-[10px] font-bold text-slate-400">
                      成本 {formatMoney(Math.round(action.cost || 0))}
                    </p>
                  </button>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="font-black text-slate-900">高价值客户</h3>
          <p className="text-xs text-slate-400">用于观察复购、转介绍和战败复活潜力。</p>
          <div className="mt-3 space-y-2">
            {records.filter(item => item.valueScore >= 58).slice(0, 8).map(item => (
              <div key={item.id} className="rounded-lg border border-blue-100 bg-blue-50/50 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-black text-slate-800">{item.customerName}</p>
                  <span className={`rounded border px-2 py-0.5 text-[10px] font-black ${statusClass[item.status] || statusClass.rejected}`}>
                    {statusLabel[item.status] || '客户'}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">{item.modelName} · {item.archetypeName} · 价值 {item.valueScore}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {(item.tags || []).slice(0, 4).map(tag => (
                    <span key={tag} className="rounded bg-white px-2 py-1 text-[10px] font-bold text-slate-500 border border-blue-100">{tag}</span>
                  ))}
                </div>
              </div>
            ))}
            {summary.highValue === 0 && (
              <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm font-bold text-slate-400">
                暂无高价值客户。
              </p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-900 p-4 text-white">
          <h3 className="font-black">客户档案</h3>
          <p className="mt-1 text-xs text-slate-400">最近沉淀的成交、战败和放弃客户。</p>
          <div className="mt-4 space-y-2">
            {recentRecords.map(item => (
              <div key={item.id} className="rounded-lg border border-white/10 bg-white/5 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-black text-white">{item.customerName} · {item.modelName}</p>
                  <span className={`rounded border px-2 py-0.5 text-[10px] font-black ${statusClass[item.status] || statusClass.rejected}`}>
                    {statusLabel[item.status] || '客户'}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  D{item.createdDay}建档 · 最近D{item.lastInteractionDay} · 下次D{item.nextFollowUpDay || currentDay}
                </p>
                <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-300">
                  {item.profile?.purpose || '购车意向'} · {item.outcomeReason || item.lastFollowUpResult || '暂无备注'}
                </p>
              </div>
            ))}
            {recentRecords.length === 0 && (
              <p className="rounded-lg border border-dashed border-white/10 bg-white/5 p-6 text-center text-sm font-bold text-slate-500">
                暂无客户档案。
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
