export function OperationReminder({ urgentOperationCount, unreadInboxCount, onOpenDashboard, onOpenInbox }) {
  return (
    <div className="mb-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="min-w-0">
        <p className="text-xs font-black text-slate-700">运营提醒</p>
        <p className="text-xs text-slate-500 truncate">
          {urgentOperationCount > 0 ? `${urgentOperationCount} 项紧急事项待处理` : '暂无紧急事项'} · 未读收件 {unreadInboxCount} 封
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {urgentOperationCount > 0 && (
          <button onClick={onOpenDashboard} className="px-3 py-2 rounded-lg bg-amber-500 text-white text-xs font-black hover:bg-amber-600">
            处理紧急事项
          </button>
        )}
        <button onClick={onOpenInbox} className="px-3 py-2 rounded-lg bg-slate-900 text-white text-xs font-black hover:bg-slate-800">
          收件箱 {unreadInboxCount > 0 ? `(${unreadInboxCount})` : ''}
        </button>
      </div>
    </div>
  );
}
