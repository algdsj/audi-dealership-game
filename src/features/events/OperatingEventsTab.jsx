import { OPERATING_EVENT_DIFFICULTY, OPERATING_EVENT_TYPES } from '../../game/config/operatingEvents.js';
import { getOperatingEventConfig, getOperatingEventResolutionOptions } from '../../game/engine/operatingEvents.js';

const toneClass = {
  opportunity: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  risk: 'border-red-200 bg-red-50 text-red-700',
};

const toneLabel = {
  opportunity: '机会',
  risk: '风险',
};

const formatSigned = (value, formatter) => `${value > 0 ? '+' : ''}${formatter ? formatter(value) : value.toLocaleString()}`;

const formatEffect = ({ effects = {}, formatMoney, multiplier = 1 }) => {
  const items = [];
  const scale = value => Math.round(value * multiplier);
  if (effects.cashDelta) items.push(`现金${formatSigned(scale(effects.cashDelta), formatMoney)}`);
  if (effects.creditLimitDelta) items.push(`授信${formatSigned(scale(effects.creditLimitDelta), formatMoney)}`);
  if (effects.financeCost) items.push(`财务费用+${formatMoney ? formatMoney(scale(effects.financeCost)) : scale(effects.financeCost).toLocaleString()}`);
  if (effects.csiDelta) items.push(`CSI${effects.csiDelta > 0 ? '+' : ''}${(effects.csiDelta * multiplier).toFixed(1)}`);
  if (effects.rebatePoolDelta) items.push(`返利池+${formatMoney ? formatMoney(scale(effects.rebatePoolDelta)) : scale(effects.rebatePoolDelta).toLocaleString()}`);
  if (effects.manufacturerPenalty) items.push(`厂家罚款+${formatMoney ? formatMoney(scale(effects.manufacturerPenalty)) : scale(effects.manufacturerPenalty).toLocaleString()}`);
  if (effects.leadChannels) {
    const leadText = Object.entries(effects.leadChannels)
      .map(([channel, value]) => `${channel}${value > 0 ? '+' : ''}${scale(value)}`)
      .join(' / ');
    items.push(`线索 ${leadText}`);
  }
  return items.length > 0 ? items.join(' · ') : '记录事件与提醒';
};

const buildRecentEvents = ({ operatingEvents, managerInbox, logs }) => {
  const resolvedEvents = (operatingEvents?.resolved || []).map(event => ({
    id: event.id,
    day: event.resolvedDay || event.day,
    title: event.title,
    body: `${event.optionTitle || '已处理'}${event.success === false ? '，结果未达预期。' : '，事件已结算。'}`,
    tone: event.tone || 'risk',
    source: event.from || '事件中心',
    kind: 'resolved',
  }));
  const inboxEvents = managerInbox
    .filter(message => message.type === 'operating_event')
    .map(message => ({
      id: message.id,
      day: message.day,
      title: message.title,
      body: message.body,
      tone: message.eventTone || 'risk',
      source: message.from,
      kind: 'inbox',
    }));
  const logEvents = logs
    .filter(log => String(log.message || '').includes('【经营事件】') || String(log.message || '').includes('【经营事件处理】'))
    .map((log, index) => ({
      id: `operating_log_${log.day}_${index}`,
      day: log.day,
      title: '经营事件记录',
      body: log.message,
      tone: log.type === 'success' ? 'opportunity' : 'risk',
      source: '经营日志',
      kind: 'log',
    }));
  return [...resolvedEvents, ...inboxEvents, ...logEvents]
    .sort((a, b) => (b.day - a.day) || a.kind.localeCompare(b.kind))
    .slice(0, 10);
};

function PendingEventCard({ activeDifficulty, currentDay, eventInstance, formatMoney, onResolveEvent }) {
  const event = getOperatingEventConfig(eventInstance.eventTypeId) || eventInstance;
  const tuning = OPERATING_EVENT_DIFFICULTY[activeDifficulty.id] || OPERATING_EVENT_DIFFICULTY.standard;
  const options = getOperatingEventResolutionOptions(event);
  const daysLeft = Math.max(0, (eventInstance.expiresOn || currentDay) - currentDay + 1);

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-black text-slate-900">{eventInstance.title}</h3>
            <span className={`rounded border px-2 py-0.5 text-[10px] font-black ${toneClass[eventInstance.tone] || toneClass.risk}`}>
              {toneLabel[eventInstance.tone] || '风险'}
            </span>
          </div>
          <p className="mt-1 text-[11px] font-bold text-slate-400">D{eventInstance.day} · {eventInstance.from} · 剩余 {daysLeft} 天</p>
        </div>
        <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black text-slate-600">
          到期 D{eventInstance.expiresOn}
        </p>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-slate-600">{eventInstance.body}</p>
      <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs text-slate-500">
        原始影响：{formatEffect({ effects: event.effects, formatMoney })}
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        {options.map(option => {
          const successChance = Math.round(Math.max(0.05, Math.min(0.95, option.successChance + (tuning.successModifier || 0))) * 100);
          const optionCost = formatEffect({ effects: option.effects, formatMoney });
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onResolveEvent({ eventId: eventInstance.id, optionId: option.id })}
              className="rounded-lg border border-slate-200 bg-white p-3 text-left transition hover:border-blue-300 hover:bg-blue-50"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-black text-slate-900">{option.title}</p>
                <span className="text-[10px] font-black text-blue-600">{successChance}%</span>
              </div>
              <p className="mt-2 min-h-10 text-xs leading-relaxed text-slate-500">{option.description}</p>
              <p className="mt-2 text-[10px] font-bold text-slate-400">{optionCost}</p>
            </button>
          );
        })}
      </div>
    </article>
  );
}

export function OperatingEventsTab({
  activeDifficulty,
  currentDay,
  formatMoney,
  logs,
  managerInbox,
  onOpenInbox,
  onResolveEvent,
  operatingEvents,
}) {
  const tuning = OPERATING_EVENT_DIFFICULTY[activeDifficulty.id] || OPERATING_EVENT_DIFFICULTY.standard;
  const pendingEvents = operatingEvents?.pending || [];
  const recentEvents = buildRecentEvents({ operatingEvents, managerInbox, logs });
  const riskEvents = OPERATING_EVENT_TYPES.filter(event => event.tone === 'risk');
  const opportunityEvents = OPERATING_EVENT_TYPES.filter(event => event.tone === 'opportunity');

  return (
    <div className="animate-fade-in">
      <div className="mb-6 border-b border-slate-100 pb-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">经营事件中心</h2>
            <p className="mt-1 text-sm text-slate-500">处理突发经营机会和风险事件，方案成本、成功率和逾期压力随难度变化。</p>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-slate-400">待处理</p>
              <p className="font-black text-slate-900">{pendingEvents.length}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-slate-400">触发</p>
              <p className="font-black text-slate-900">x{tuning.chanceMultiplier}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-slate-400">成本</p>
              <p className="font-black text-slate-900">x{tuning.responseCostMultiplier}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-slate-400">缓冲</p>
              <p className="font-black text-slate-900">{tuning.expiryGraceDays}天</p>
            </div>
          </div>
        </div>
      </div>

      <section className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="font-black text-slate-900">待处理事件</h3>
            <p className="text-xs text-slate-400">逾期后，风险事件会按原始影响结算，机会事件会自然消散。</p>
          </div>
          <button onClick={() => onOpenInbox(null)} className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-black text-blue-700 hover:bg-blue-100">
            查看收件箱
          </button>
        </div>
        <div className="space-y-4">
          {pendingEvents.length === 0 && (
            <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm font-bold text-slate-400">
              暂无待处理经营事件。
            </p>
          )}
          {pendingEvents.map(event => (
            <PendingEventCard
              key={event.id}
              activeDifficulty={activeDifficulty}
              currentDay={currentDay}
              eventInstance={event}
              formatMoney={formatMoney}
              onResolveEvent={onResolveEvent}
            />
          ))}
        </div>
      </section>

      <div className="mb-6 grid gap-4 lg:grid-cols-[1fr_1.1fr]">
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="font-black text-slate-900">近期记录</h3>
          <p className="text-xs text-slate-400">来自处理结果、收件箱和经营日志</p>
          <div className="mt-3 space-y-3">
            {recentEvents.length === 0 && (
              <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm font-bold text-slate-400">
                暂无经营事件记录。
              </p>
            )}
            {recentEvents.map(event => (
              <div key={event.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p className="font-black text-slate-800">{event.title}</p>
                  <span className={`rounded border px-2 py-0.5 text-[10px] font-black ${toneClass[event.tone] || toneClass.risk}`}>
                    {toneLabel[event.tone] || '风险'}
                  </span>
                </div>
                <p className="text-[10px] font-bold text-slate-400">D{event.day} · {event.source}</p>
                <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-slate-600">{event.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-slate-900 p-4 text-white">
          <h3 className="font-black">事件池配置</h3>
          <p className="mt-1 text-xs text-slate-400">触发条件、基础概率和原始影响由配置文件驱动。</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-black text-red-200">风险事件 {riskEvents.length}</p>
              <div className="space-y-2">
                {riskEvents.map(event => (
                  <div key={event.id} className="rounded-lg border border-red-900/60 bg-red-950/30 p-3">
                    <p className="text-sm font-black text-red-100">{event.title}</p>
                    <p className="mt-1 text-[10px] text-red-200/80">基础概率 {Math.round(event.baseChance * 1000) / 10}% · {formatEffect({ effects: event.effects, formatMoney })}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-black text-emerald-200">机会事件 {opportunityEvents.length}</p>
              <div className="space-y-2">
                {opportunityEvents.map(event => (
                  <div key={event.id} className="rounded-lg border border-emerald-900/60 bg-emerald-950/30 p-3">
                    <p className="text-sm font-black text-emerald-100">{event.title}</p>
                    <p className="mt-1 text-[10px] text-emerald-200/80">基础概率 {Math.round(event.baseChance * 1000) / 10}% · {formatEffect({ effects: event.effects, formatMoney })}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
