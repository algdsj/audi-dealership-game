import { Term, Tooltip } from '../../shared/ui/tooltip.jsx';

export function DraftManagementTab({
  unpaidDraftAmount,
  drafts,
  draftCreditUsage,
  nearestDraft,
  warningDrafts,
  defaultedDrafts,
  activeDraftList,
  formatMoney,
  getDraftRemainingDays,
  onRepayOverdueDraft,
}) {
  return (
    <div className="animate-fade-in space-y-6">
      <div className="mb-2 border-b border-slate-100 pb-4">
        <h2 className="text-2xl font-bold">汇票管理</h2>
        <p className="text-slate-500 text-sm mt-1">集中查看银行承兑汇票、授信占用、到期预警和逾期风险。</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl bg-slate-900 text-white p-5">
          <p className="text-xs text-slate-400 font-bold"><Tooltip text="未结清银行承兑汇票的风险敞口，包含未到期尾款和已逾期本金。">汇票风险总额</Tooltip></p>
          <p className="text-3xl font-black mt-1">{formatMoney(unpaidDraftAmount)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs text-slate-400 font-bold"><Term term="银行信用">银行信用</Term></p>
          <p className={(drafts.bankReputation < 40 ? 'text-red-600' : drafts.bankReputation < 65 ? 'text-amber-600' : 'text-emerald-600') + ' text-3xl font-black mt-1'}>{drafts.bankReputation || 70}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs text-slate-400 font-bold"><Tooltip text="已占用承兑汇票专项授信除以银行给你的汇票专项额度。超过80%会显著压缩汇票订车空间。">汇票授信使用率</Tooltip></p>
          <p className={(draftCreditUsage > 80 ? 'text-red-600' : draftCreditUsage > 60 ? 'text-amber-600' : 'text-blue-600') + ' text-3xl font-black mt-1'}>{draftCreditUsage.toFixed(0)}%</p>
          <p className="text-xs text-slate-400 mt-1">{formatMoney(drafts.creditUsed || 0)} / {formatMoney(drafts.creditLimit || 0)}</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-xs text-amber-700 font-bold">最近到期</p>
          <p className="text-xl font-black text-amber-900 mt-1">{nearestDraft ? `${nearestDraft.remainingDays}天后` : '暂无'}</p>
          {nearestDraft && <p className="text-xs text-amber-700 mt-1">{nearestDraft.carModel} · {formatMoney(nearestDraft.amount * 0.8)}</p>}
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="font-black text-slate-900 mb-4"><Term term="承兑汇票">汇票</Term>列表</h3>
        {(warningDrafts.length > 0 || defaultedDrafts.length > 0) && (
          <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            {warningDrafts.slice(0, 4).map(draft => (
              <div key={`warn_${draft.id}`} className={(draft.remainingDays <= 3 ? 'bg-orange-50 border-orange-200 text-orange-800' : 'bg-amber-50 border-amber-200 text-amber-800') + ' rounded-lg border p-3 text-sm'}>
                <p className="font-black">{draft.remainingDays <= 3 ? '即将到期' : '7天内到期'} · {draft.carModel}</p>
                <p className="text-xs mt-1">D{draft.dueDate?.day} 需准备 {formatMoney((draft.amount || 0) * 0.8)}</p>
              </div>
            ))}
            {defaultedDrafts.slice(0, 4).map(draft => (
              <div key={`default_${draft.id}`} className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                <p className="font-black">逾期未清 · {draft.carModel}</p>
                <p className="text-xs mt-1">本金 {formatMoney(draft.overduePrincipal || 0)}，罚息 {formatMoney(draft.overduePenalty || 0)}</p>
              </div>
            ))}
          </div>
        )}
        {activeDraftList.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">暂无未结清汇票。订车时选择3个月或6个月汇票后会出现在这里。</p>
        ) : (
          <div className="space-y-3">
            {activeDraftList.map(draft => {
              const remaining = draft.status === 'active' ? getDraftRemainingDays(draft) : 0;
              const statusTone = draft.status === 'defaulted' ? 'bg-red-50 text-red-700 border-red-200' : remaining <= 3 ? 'bg-orange-50 text-orange-700 border-orange-200' : remaining <= 7 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200';
              return (
                <div key={draft.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                    <div>
                      <p className="font-black text-slate-900">{draft.carModel} ×{draft.carCount}</p>
                      <p className="text-xs text-slate-500 mt-1">票号 {draft.id} · 开票 M{draft.issueDate?.month} D{draft.issueDate?.day} · 到期 M{draft.dueDate?.month} D{draft.dueDate?.day}</p>
                      <p className="text-xs text-slate-500 mt-1">保证金 {formatMoney(draft.deposit || 0)} · 手续费 {formatMoney(draft.bankFee || 0)} · 尾款 {formatMoney((draft.amount || 0) * 0.8)}</p>
                    </div>
                    <div className="text-left md:text-right">
                      <span className={'inline-flex px-2 py-1 rounded-full border text-xs font-black ' + statusTone}>
                        {draft.status === 'defaulted' ? '已逾期' : remaining <= 3 ? '即将到期' : remaining <= 7 ? '7天内到期' : '正常'}
                      </span>
                      <p className="text-lg font-black text-slate-900 mt-2">{formatMoney(draft.status === 'defaulted' ? (draft.overduePrincipal || 0) + (draft.overduePenalty || 0) : draft.amount || 0)}</p>
                      {draft.status === 'defaulted' && (
                        <button onClick={() => onRepayOverdueDraft(draft.id)} className="mt-2 px-3 py-2 rounded-lg bg-red-600 text-white text-xs font-black hover:bg-red-700">还款逾期汇票</button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
