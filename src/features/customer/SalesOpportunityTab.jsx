const statusTone = {
  pending: 'border-blue-200 bg-blue-50 text-blue-700',
  new: 'border-blue-200 bg-blue-50 text-blue-700',
  active: 'border-blue-200 bg-blue-50 text-blue-700',
  qualified: 'border-cyan-200 bg-cyan-50 text-cyan-700',
  test_drive: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  quoted: 'border-violet-200 bg-violet-50 text-violet-700',
  risk: 'border-amber-200 bg-amber-50 text-amber-700',
  atRisk: 'border-amber-200 bg-amber-50 text-amber-700',
  at_risk: 'border-amber-200 bg-amber-50 text-amber-700',
  won: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  sold: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  lost: 'border-red-200 bg-red-50 text-red-700',
  expired: 'border-slate-200 bg-slate-50 text-slate-600',
  closed: 'border-slate-200 bg-slate-50 text-slate-600',
};

const statusLabel = {
  pending: '待办',
  new: '新线索',
  active: '推进中',
  qualified: '已筛选',
  test_drive: '试驾',
  quoted: '已报价',
  risk: '风险',
  atRisk: '风险',
  at_risk: '风险',
  won: '已成交',
  sold: '已成交',
  lost: '已战败',
  expired: '已过期',
  closed: '已关闭',
};

const fallbackActions = [
  { id: 'follow_up', title: '跟进', description: '安排销售触达，确认下一步意向。' },
  { id: 'quote', title: '报价', description: '给出匹配预算的方案。' },
  { id: 'close', title: '收单', description: '推进定金或锁客动作。' },
];

const getOpportunityStatus = (item) => item.statusGroup || item.status || 'pending';

const isClosedOpportunity = (item) => {
  const status = getOpportunityStatus(item);
  return ['closed', 'won', 'sold', 'lost', 'expired', 'rejected'].includes(status);
};

const isRiskOpportunity = (item) => {
  const status = getOpportunityStatus(item);
  return !isClosedOpportunity(item) && (
    status === 'risk'
    || status === 'atRisk'
    || status === 'at_risk'
    || item.isRisk
    || item.riskLevel === 'high'
    || item.riskLevel === 'critical'
  );
};

const splitOpportunities = (salesOpportunities = []) => {
  const openItems = salesOpportunities.filter(item => !isClosedOpportunity(item));

  return {
    pending: openItems.filter(item => !isRiskOpportunity(item)),
    risk: openItems.filter(isRiskOpportunity),
    closed: salesOpportunities.filter(isClosedOpportunity),
  };
};

const formatPercent = (value) => {
  if (value == null || Number.isNaN(Number(value))) return '--';
  const numberValue = Number(value);
  return `${Math.round(numberValue > 1 ? numberValue : numberValue * 100)}%`;
};

const formatDay = (day) => {
  if (day == null) return '未定';
  return `D${day}`;
};

const getBudgetText = (item, formatMoney) => {
  const budget = item.budget ?? item.budgetCeiling ?? item.targetPrice ?? item.expectedPrice;
  if (budget == null) return '预算未定';
  return formatMoney(budget);
};

const getActions = (item) => {
  const actions = item.actions || item.suggestedActions || item.availableActions;
  if (Array.isArray(actions) && actions.length > 0) return actions;
  if (item.recommendedAction) return [item.recommendedAction];
  return fallbackActions;
};

function OpportunityCard({
  opportunity,
  currentDay,
  formatMoney,
  onOpportunityAction,
  compact = false,
}) {
  const status = getOpportunityStatus(opportunity);
  const dueDay = opportunity.dueDay ?? opportunity.expiresDay ?? opportunity.expireDay;
  const daysLeft = dueDay == null ? null : dueDay - currentDay;
  const actions = compact ? [] : getActions(opportunity);
  const heat = opportunity.heat ?? opportunity.hotScore ?? opportunity.intentScore;
  const trust = opportunity.trust ?? opportunity.trustScore;
  const modelName = opportunity.modelName || opportunity.model || opportunity.vehicleName || '意向车型未定';
  const sourceName = opportunity.channelName || opportunity.sourceName || opportunity.source;
  const owner = opportunity.owner || opportunity.metadata?.owner;
  const preferredSeries = opportunity.preferredSeries || opportunity.metadata?.preferredSeries || [];

  return (
    <article className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="p-4 bg-gradient-to-r from-slate-50 to-blue-50/40 border-b border-slate-100">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className={`rounded border px-2 py-1 text-[10px] font-black ${statusTone[status] || statusTone.pending}`}>
                {statusLabel[status] || '机会'}
              </span>
              {sourceName && (
                <span className="rounded border border-slate-200 bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600">
                  {sourceName}
                </span>
              )}
              {owner?.name && (
                <span className="rounded border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">
                  负责人 {owner.name}
                </span>
              )}
              {preferredSeries[0] && (
                <span className="rounded border border-cyan-200 bg-cyan-50 px-2 py-1 text-[10px] font-bold text-cyan-700">
                  偏好 {preferredSeries.join(' / ')}
                </span>
              )}
              <span className="rounded border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-700">
                {formatDay(dueDay)}到期
              </span>
            </div>
            <h3 className="text-base font-black text-slate-900">
              {opportunity.customerName || '未命名客户'} · {modelName}
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              预算 {getBudgetText(opportunity, formatMoney)}
              {opportunity.archetypeName ? ` · ${opportunity.archetypeName}` : ''}
              {daysLeft != null ? ` · 剩余${Math.max(daysLeft, 0)}天` : ''}
              {owner?.role ? ` · ${owner.role.toUpperCase()}负责` : ''}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center sm:min-w-[210px]">
            <div className="rounded-lg border border-slate-100 bg-white p-2">
              <p className="text-[10px] text-slate-400">热度</p>
              <p className="text-sm font-black text-orange-600">{formatPercent(heat)}</p>
            </div>
            <div className="rounded-lg border border-slate-100 bg-white p-2">
              <p className="text-[10px] text-slate-400">信任</p>
              <p className="text-sm font-black text-emerald-600">{formatPercent(trust)}</p>
            </div>
            {owner?.skill != null && (
              <div className="col-span-2 rounded-lg border border-slate-100 bg-white p-2">
                <p className="text-[10px] text-slate-400">负责人能力 / 压力</p>
                <p className="text-sm font-black text-slate-700">{owner.skill} / {owner.stress ?? '--'}</p>
              </div>
            )}
          </div>
        </div>
        {(opportunity.suggestedAction || opportunity.recommendation || opportunity.reason) && (
          <div className="mt-4 rounded-lg border border-slate-100 bg-white/80 p-3">
            <p className="text-[10px] font-black text-slate-400">建议动作</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">
              {opportunity.suggestedAction || opportunity.recommendation || opportunity.reason}
            </p>
          </div>
        )}
      </div>

      {!compact && (
        <div className="grid gap-3 p-4 md:grid-cols-3">
          {actions.map(action => (
            <button
              key={action.id}
              type="button"
              onClick={() => onOpportunityAction(opportunity.id, action.id)}
              className="rounded-lg border border-slate-200 bg-white p-3 text-left transition-colors hover:border-blue-300 hover:bg-blue-50"
            >
              <p className="text-xs font-black text-slate-900">{action.title || action.label || action.id}</p>
              <p className="mt-1 min-h-10 text-[11px] leading-relaxed text-slate-500">
                {action.description || action.hint || '执行该销售动作，结果由经营规则结算。'}
              </p>
              {action.cost != null && (
                <p className="mt-2 text-[10px] font-bold text-slate-400">成本 {formatMoney(action.cost)}</p>
              )}
            </button>
          ))}
        </div>
      )}
    </article>
  );
}

export function SalesOpportunityTab({
  salesOpportunities = [],
  currentDay,
  formatMoney,
  onOpportunityAction,
}) {
  const groups = splitOpportunities(salesOpportunities);
  const closedWon = groups.closed.filter(item => ['won', 'sold'].includes(getOpportunityStatus(item))).length;
  const closedLost = groups.closed.length - closedWon;

  return (
    <div className="animate-fade-in">
      <div className="mb-6 border-b border-slate-100 pb-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">销售机会池</h2>
            <p className="mt-1 text-sm text-slate-500">汇总销售团队正在推进、临近流失和已经关闭的客户机会。</p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
              <p className="text-blue-500">待办</p>
              <p className="font-black text-blue-700">{groups.pending.length}</p>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
              <p className="text-amber-500">风险</p>
              <p className="font-black text-amber-700">{groups.risk.length}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-slate-400">关闭</p>
              <p className="font-black text-slate-900">{groups.closed.length}</p>
            </div>
          </div>
        </div>
      </div>

      <section className="mb-6">
        <div className="mb-3">
          <h3 className="font-black text-slate-900">待办机会</h3>
          <p className="text-xs text-slate-400">用于承接日结或销售线索模块产出的下一步动作。</p>
        </div>
        <div className="grid gap-3 xl:grid-cols-2">
          {groups.pending.length === 0 && (
            <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm font-bold text-slate-400 xl:col-span-2">
              暂无待办机会。
            </p>
          )}
          {groups.pending.map(item => (
            <OpportunityCard
              key={item.id}
              opportunity={item}
              currentDay={currentDay}
              formatMoney={formatMoney}
              onOpportunityAction={onOpportunityAction}
            />
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="font-black text-slate-900">风险机会</h3>
          <p className="text-xs text-slate-400">展示即将过期、信任不足或已被标记为高风险的机会。</p>
          <div className="mt-3 space-y-3">
            {groups.risk.length === 0 && (
              <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm font-bold text-slate-400">
                暂无风险机会。
              </p>
            )}
            {groups.risk.map(item => (
              <OpportunityCard
                key={item.id}
                opportunity={item}
                currentDay={currentDay}
                formatMoney={formatMoney}
                onOpportunityAction={onOpportunityAction}
              />
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-900 p-4 text-white">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-black">已关闭机会</h3>
              <p className="mt-1 text-xs text-slate-400">最近关闭的机会摘要，用于回看线索质量。</p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center text-[10px]">
              <div className="rounded border border-white/10 bg-white/5 px-2 py-1">
                <p className="text-slate-400">赢单</p>
                <p className="font-black text-emerald-300">{closedWon}</p>
              </div>
              <div className="rounded border border-white/10 bg-white/5 px-2 py-1">
                <p className="text-slate-400">流失</p>
                <p className="font-black text-red-300">{closedLost}</p>
              </div>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {groups.closed.slice(0, 10).map(item => {
              const status = getOpportunityStatus(item);
              const modelName = item.modelName || item.model || item.vehicleName || '意向车型未定';

              return (
                <div key={item.id} className="rounded-lg border border-white/10 bg-white/5 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-black text-white">{item.customerName || '未命名客户'} · {modelName}</p>
                    <span className={`rounded border px-2 py-0.5 text-[10px] font-black ${statusTone[status] || statusTone.closed}`}>
                      {statusLabel[status] || '已关闭'}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">
                    预算 {getBudgetText(item, formatMoney)} · 到期{formatDay(item.dueDay ?? item.expiresDay ?? item.expireDay)}
                  </p>
                  <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-300">
                    {item.closeReason || item.outcomeReason || item.summary || '暂无关闭备注'}
                  </p>
                </div>
              );
            })}
            {groups.closed.length === 0 && (
              <p className="rounded-lg border border-dashed border-white/10 bg-white/5 p-6 text-center text-sm font-bold text-slate-500">
                暂无已关闭机会。
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
