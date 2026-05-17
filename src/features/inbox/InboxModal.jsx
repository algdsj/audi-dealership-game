import { INBOX_TYPE_LABELS, getInboxType } from '../../game/viewModels/messageFeed.js';
import { STORY_ACTIONS } from '../../game/engine/storyActions.js';
import { buildStoryPressureSummary, getStoryInboxDetails } from '../../game/viewModels/storyInbox.js';

function MessageBody({ body, className = '' }) {
  return (
    <div className={className}>
      {String(body || '').split('\n').map((line, index) => (
        <p key={`${index}_${line.slice(0, 12)}`} className={index > 0 ? 'mt-2' : ''}>{line}</p>
      ))}
    </div>
  );
}

function Pill({ children, className = '' }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-black ${className}`}>
      {children}
    </span>
  );
}

const storyActionToneClass = {
  slate: 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
  blue: 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100',
  amber: 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100',
};

function StoryDetails({ details, message, onResolveStoryAction }) {
  if (!details) return null;
  const resolved = Boolean(message.storyResolved || message.storyResolution);

  return (
    <div className="mt-3 space-y-3 rounded-xl border border-white/70 bg-white/70 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Pill className={details.severityMeta.badgeClass}>{details.chainTitle}</Pill>
        {details.stageLabel && <Pill className="border-slate-200 bg-slate-50 text-slate-600">{details.stageLabel}</Pill>}
        <Pill className="border-slate-200 bg-slate-50 text-slate-500">{details.source}</Pill>
        {details.expiresAt?.absoluteDay && (
          <Pill className="border-slate-200 bg-slate-50 text-slate-500">D{details.expiresAt.absoluteDay} 前关注</Pill>
        )}
      </div>

      {details.participants.length > 0 && (
        <div>
          <p className="mb-1 text-[10px] font-black text-slate-500">相关角色</p>
          <div className="flex flex-wrap gap-1.5">
            {details.participants.map(participant => (
              <Pill key={participant} className="border-indigo-100 bg-indigo-50 text-indigo-700">{participant}</Pill>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {details.suggestedActions.length > 0 && (
          <div>
            <p className="mb-1 text-[10px] font-black text-slate-500">建议动作</p>
            <ul className="space-y-1">
              {details.suggestedActions.map(action => (
                <li key={action} className="rounded-lg border border-emerald-100 bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-800">{action}</li>
              ))}
            </ul>
          </div>
        )}
        {details.effectsPreview.length > 0 && (
          <div>
            <p className="mb-1 text-[10px] font-black text-slate-500">可能影响</p>
            <ul className="space-y-1">
              {details.effectsPreview.map(effect => (
                <li key={effect} className="rounded-lg border border-amber-100 bg-amber-50 px-2 py-1 text-xs font-bold text-amber-800">{effect}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div className="border-t border-slate-100 pt-3">
        {resolved ? (
          <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
            已处理：{message.storyResolution?.actionLabel || '已登记'} · D{message.storyResolution?.day || message.day}
            {message.storyResolution?.effect?.summary ? ` · ${message.storyResolution.effect.summary}` : ''}
          </div>
        ) : (
          <div>
            <p className="mb-2 text-[10px] font-black text-slate-500">处理动作</p>
            <div className="flex flex-wrap gap-2">
              {STORY_ACTIONS.map(action => (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => onResolveStoryAction?.({ message, actionId: action.id })}
                  className={`rounded-lg border px-3 py-2 text-xs font-black transition-colors ${storyActionToneClass[action.tone] || storyActionToneClass.slate}`}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StoryPressureSummary({ storyState, currentDay, onShowStoryMessages }) {
  const activeStories = buildStoryPressureSummary(storyState, currentDay).slice(0, 4);
  if (activeStories.length === 0) return null;

  return (
    <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black text-slate-700">活跃剧情线</p>
          <p className="text-[10px] font-bold text-slate-400">当前正在施压的经营叙事</p>
        </div>
        <button
          type="button"
          onClick={onShowStoryMessages}
          className="rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-[10px] font-black text-blue-700 hover:bg-blue-50"
        >
          只看剧情
        </button>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {activeStories.map(story => (
          <div key={story.chainId} className="rounded-lg border border-white bg-white px-3 py-2 shadow-sm">
            <div className="mb-1 flex items-center justify-between gap-2">
              <p className="truncate text-xs font-black text-slate-800">{story.title}</p>
              <Pill className={story.severityMeta.badgeClass}>{story.severityLabel}</Pill>
            </div>
            <p className="truncate text-[10px] font-bold text-slate-500">
              {story.stageLabel || story.source}{story.lastScore !== null ? ` · 风险 ${story.lastScore}` : ''}
            </p>
            {story.mitigationLabel && (
              <p className="mt-1 truncate text-[10px] font-black text-emerald-600">{story.mitigationLabel}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function InboxModal({
  isOpen,
  selectedInboxDay,
  currentDay,
  inboxFilter,
  setInboxFilter,
  managerInbox,
  filteredInboxMessages,
  readInboxIds,
  expandedInboxIds,
  logs,
  storyState,
  onResolveStoryAction,
  onClose,
  onSelectInboxDay,
  onToggleRead,
  onToggleExpanded,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 border border-slate-100 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-2xl font-black text-slate-800">经理收件箱</h3>
            <p className="text-sm text-slate-500">{selectedInboxDay !== null ? `D${selectedInboxDay} 当日收件` : '厂家、银行、市场情报与系统提醒'}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg font-bold">✕</button>
        </div>
        <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
          {selectedInboxDay !== null ? (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <button onClick={() => onSelectInboxDay(Math.max(1, selectedInboxDay - 1))} disabled={selectedInboxDay <= 1} className="px-3 py-2 text-xs font-black rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40">◀ 前一天</button>
              <span className="text-sm font-black text-slate-700">D{selectedInboxDay}</span>
              <button onClick={() => onSelectInboxDay(Math.min(currentDay, selectedInboxDay + 1))} disabled={selectedInboxDay >= currentDay} className="px-3 py-2 text-xs font-black rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40">后一天 ▶</button>
              <button onClick={() => onSelectInboxDay(null)} className="px-3 py-2 text-xs font-black rounded-lg bg-slate-900 text-white hover:bg-slate-800">查看全部</button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {Object.entries(INBOX_TYPE_LABELS).map(([type, label]) => (
                  <button key={type} onClick={() => setInboxFilter(prev => ({ ...prev, type }))} className={'px-3 py-1.5 rounded-lg text-xs font-black border transition-colors ' + (inboxFilter.type === type ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100')}>
                    {label}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select value={inboxFilter.dayRange} onChange={e => setInboxFilter(prev => ({ ...prev, dayRange: e.target.value }))} className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-700">
                  <option value="all">全部日期</option>
                  <option value="today">今天</option>
                  <option value="7">最近7天</option>
                  <option value="30">最近30天</option>
                </select>
                <input
                  value={inboxFilter.specificDay}
                  onChange={e => setInboxFilter(prev => ({ ...prev, specificDay: e.target.value }))}
                  placeholder="输入D天数"
                  className="w-28 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-700"
                />
                <span className="ml-auto text-xs font-bold text-slate-500">显示 {filteredInboxMessages.length} 封（共 {managerInbox.length} 封）</span>
              </div>
            </div>
          )}
        </div>
        <StoryPressureSummary
          storyState={storyState}
          currentDay={currentDay}
          onShowStoryMessages={() => {
            onSelectInboxDay(null);
            setInboxFilter(prev => ({ ...prev, type: 'story' }));
          }}
        />
        <div className="space-y-3">
          {filteredInboxMessages.length === 0 && <p className="text-sm text-slate-400 text-center py-8">当前筛选下没有收件。</p>}
          {filteredInboxMessages.map(msg => {
            const isRead = readInboxIds.has(msg.id);
            const expanded = expandedInboxIds.has(msg.id);
            const msgType = getInboxType(msg);
            const storyDetails = getStoryInboxDetails(msg);
            const storyCardClass = storyDetails?.severityMeta?.cardClass || 'border-slate-200 bg-slate-50';
            return (
              <div key={msg.id} className={`overflow-hidden rounded-xl border ${storyCardClass}`}>
                <button
                  onClick={() => {
                    onToggleExpanded(msg.id);
                    if (!isRead) onToggleRead(msg.id);
                  }}
                  className="w-full text-left p-4 hover:bg-white/75 transition-colors"
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <span className={(isRead ? 'bg-slate-300' : 'bg-blue-500') + ' mt-1.5 h-2.5 w-2.5 rounded-full shrink-0'}></span>
                      <div className="min-w-0">
                        <div className="mb-1 flex flex-wrap items-center gap-1.5">
                          <p className="text-xs font-bold text-blue-600">{msg.from} · {INBOX_TYPE_LABELS[msgType]}</p>
                          {storyDetails && (
                            <Pill className={storyDetails.severityMeta.badgeClass}>{storyDetails.severityLabel}</Pill>
                          )}
                        </div>
                        <h4 className="font-bold text-slate-800 truncate">{msg.title}</h4>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-slate-400">D{msg.day}</span>
                      <span className="text-xs font-black text-slate-400">{expanded ? '收起' : '展开'}</span>
                    </div>
                  </div>
                </button>
                {expanded && (
                  <div className="px-4 pb-4 pl-9">
                    <MessageBody body={msg.body} className="text-sm leading-relaxed text-slate-600" />
                    <StoryDetails details={storyDetails} message={msg} onResolveStoryAction={onResolveStoryAction} />
                    <button onClick={() => onToggleRead(msg.id)} className="mt-3 text-xs font-black text-blue-600 hover:text-blue-700">
                      标记为{isRead ? '未读' : '已读'}
                    </button>
                  </div>
                )}
                {!expanded && (
                  <div className="px-4 pb-4 pl-9">
                    <MessageBody body={msg.body} className="max-h-8 overflow-hidden text-xs leading-relaxed text-slate-500" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {selectedInboxDay !== null && (
          <div className="mt-5 border-t border-slate-200 pt-4">
            <h4 className="font-black text-slate-800 mb-3">当日经营日志</h4>
            <div className="space-y-2">
              {logs.filter(log => log.day === selectedInboxDay).length === 0 && <p className="text-sm text-slate-400">当天暂无系统日志。</p>}
              {logs.filter(log => log.day === selectedInboxDay).map((log, idx) => (
                <div key={`${log.day}_${idx}`} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                  <span className="font-black text-slate-700 mr-2">{log.type === 'success' ? '完成' : log.type === 'warning' ? '预警' : log.type === 'expense' ? '财务' : '事件'}</span>
                  <span className="text-slate-600">{log.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
