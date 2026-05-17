export function ModuleNavigation({ moduleGroups, activeGroup, activeTab, onSelectTab }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-2">
      <div className="grid grid-cols-3 xl:grid-cols-6 gap-2">
        {moduleGroups.map(group => (
          <button
            key={group.id}
            onClick={() => onSelectTab(group.tabs[0].id)}
            className={'text-left rounded-lg p-2.5 transition-colors border ' + (activeGroup.id === group.id ? 'bg-slate-900 text-white border-slate-900 shadow-sm' : 'bg-slate-50 text-slate-600 border-slate-100 hover:bg-blue-50 hover:border-blue-200')}
          >
            <p className="text-xs font-black">{group.label}</p>
            <p className={'text-[9px] mt-0.5 ' + (activeGroup.id === group.id ? 'text-slate-300' : 'text-slate-400')}>{group.desc}</p>
          </button>
        ))}
      </div>
      <div className="flex gap-2 mt-2 overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {activeGroup.tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            className={'flex-none px-4 py-2 text-sm font-bold rounded-lg transition-colors whitespace-nowrap ' + (activeTab === tab.id ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100')}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
