import React from 'react';

const feedToneColor = (item) => {
  if (item.sourceType === 'story') {
    if (item.tone === 'critical') return '#fca5a5';
    if (item.tone === 'high') return '#fdba74';
    if (item.tone === 'warning') return '#fcd34d';
    return '#93c5fd';
  }
  if (item.kind === 'inbox') return '#93c5fd';
  if (item.tone === 'success') return '#4ade80';
  if (item.tone === 'warning') return '#fbbf24';
  if (item.tone === 'expense') return '#f87171';
  return '#60a5fa';
};

const feedCardClass = (item) => {
  if (item.sourceType !== 'story') return 'hover:bg-slate-700/30';
  if (item.tone === 'critical') return 'bg-red-950/30 hover:bg-red-950/45 border-red-800/50';
  if (item.tone === 'high') return 'bg-orange-950/25 hover:bg-orange-950/40 border-orange-800/45';
  if (item.tone === 'warning') return 'bg-amber-950/20 hover:bg-amber-950/35 border-amber-800/40';
  return 'bg-blue-950/20 hover:bg-blue-950/35 border-blue-800/40';
};

export function MessageCenterPanel({
  messageFeed,
  visibleMessageFeed,
  expandedMessageIds,
  onOpenInbox,
  onToggleExpandedMessage,
}) {
  return (
    <div className="w-full lg:w-80 bg-slate-800 text-slate-300 rounded-xl shadow-lg flex flex-col overflow-hidden h-80 lg:h-[700px] shrink-0">
      <div className="bg-slate-900 p-4 border-b border-slate-700 flex justify-between items-center shrink-0">
        <div>
          <h2 className="font-bold text-white tracking-wider text-sm uppercase">消息中心</h2>
          <p className="text-[10px] text-slate-400 mt-1">经理收件箱 + 经营日志</p>
        </div>
        <button onClick={() => onOpenInbox(null)} className="text-xs font-bold px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors">
          收件箱
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm font-mono" style={{ scrollbarWidth: 'thin', scrollbarColor: '#475569 transparent' }}>
        {visibleMessageFeed.map((item, idx) => {
          const showDayDivider = idx === 0 || visibleMessageFeed[idx - 1].day !== item.day;
          const isExpanded = expandedMessageIds.has(item.id);
          return (
            <React.Fragment key={item.id}>
              {showDayDivider && (
                <button onClick={() => onOpenInbox(item.day)} className="w-full flex items-center gap-2 text-[10px] font-black text-slate-500 hover:text-slate-300 transition-colors">
                  <span className="h-px flex-1 bg-slate-700"></span>
                  <span>D{item.day}</span>
                  <span className="h-px flex-1 bg-slate-700"></span>
                </button>
              )}
              <div
                className={`cursor-pointer rounded-lg border-b border-slate-700/50 p-1 pb-2 -m-1 transition-colors last:border-0 ${feedCardClass(item)}`}
                onClick={() => item.kind === 'log' ? onToggleExpandedMessage(item.id) : onOpenInbox(item.day)}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: feedToneColor(item) }}>{item.label}</span>
                  {item.sourceType === 'story' && <span className="rounded border border-current/30 px-1 py-0.5 text-[9px] font-black" style={{ color: feedToneColor(item) }}>剧情线</span>}
                  {item.kind === 'log' && <span className="text-[10px] text-slate-500">{isExpanded ? '收起' : '展开'}</span>}
                </div>
                <p className="pl-1 font-bold text-slate-100 leading-relaxed">{item.title}</p>
                <p className={(isExpanded ? '' : 'max-h-8 overflow-hidden') + ' pl-1 leading-relaxed text-slate-300 text-xs mt-1'}>
                  {item.body}
                </p>
              </div>
            </React.Fragment>
          );
        })}
        {messageFeed.length > visibleMessageFeed.length && <p className="text-center text-[10px] text-slate-500">仅显示最近 {visibleMessageFeed.length} 条</p>}
      </div>
    </div>
  );
}
