import { MAX_SAVE_SLOTS, getSaveSlotLabel, isSaveLike } from '../../game/state/saveSlots.js';

function RenameSlotInput({ slotId, renameValue, setRenameValue, onRename, onCancel }) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        value={renameValue}
        onChange={e => setRenameValue(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && onRename(slotId)}
        className="flex-1 border border-blue-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        autoFocus
      />
      <button onClick={() => onRename(slotId)} className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-500">✓</button>
      <button onClick={onCancel} className="text-xs px-2 py-1 bg-slate-300 text-slate-700 rounded hover:bg-slate-400">✕</button>
    </div>
  );
}

export function SaveSlotsModal({
  isOpen,
  getSaveSlots,
  renameSlot,
  renameValue,
  setRenameSlot,
  setRenameValue,
  onRenameSlot,
  onDeleteSlot,
  onSaveToSlot,
  onClose,
}) {
  if (!isOpen) return null;

  const allSlots = getSaveSlots();
  const autoSlot = isSaveLike(allSlots.slots.auto) ? allSlots.slots.auto : null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4">💾 选择存档槽位</h2>
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 opacity-60">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-sm">🔄 自动存档</p>
                <p className="text-xs text-slate-400">{autoSlot ? `${autoSlot.savedAt} · M${Math.floor((autoSlot.day - 1) / 30) + 1} D${((autoSlot.day - 1) % 30) + 1}` : '空'}</p>
              </div>
              <span className="text-xs text-slate-400">每天自动覆盖</span>
            </div>
          </div>
          {Array.from({ length: MAX_SAVE_SLOTS }, (_, i) => {
            const slotId = `slot${i + 1}`;
            const slot = isSaveLike(allSlots.slots[slotId]) ? allSlots.slots[slotId] : null;
            const isRenaming = renameSlot === slotId;
            return (
              <div key={slotId} className={'rounded-lg p-4 border-2 transition-colors ' + (slot ? 'bg-blue-50 border-blue-200' : 'bg-white border-dashed border-slate-300')}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {isRenaming ? (
                      <RenameSlotInput
                        slotId={slotId}
                        renameValue={renameValue}
                        setRenameValue={setRenameValue}
                        onRename={onRenameSlot}
                        onCancel={() => { setRenameSlot(null); setRenameValue(''); }}
                      />
                    ) : (
                      <>
                        <p className="font-bold text-sm truncate">{slot ? getSaveSlotLabel(slotId, slot) : `空槽位 ${i + 1}`}</p>
                        {slot && <p className="text-xs text-slate-400 truncate">{slot.savedAt} · M{Math.floor((slot.day - 1) / 30) + 1} D{((slot.day - 1) % 30) + 1}</p>}
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {slot && !isRenaming && (
                      <>
                        <button onClick={() => { setRenameSlot(slotId); setRenameValue(getSaveSlotLabel(slotId, slot)); }} className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded hover:bg-amber-200" title="重命名">✏️</button>
                        <button onClick={() => onDeleteSlot(slotId)} className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200" title="删除">🗑️</button>
                      </>
                    )}
                    <button onClick={() => onSaveToSlot(slotId, slot ? getSaveSlotLabel(slotId, slot) : `存档 ${i + 1}`)} className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-500 font-bold">
                      {slot ? '覆盖保存' : '保存'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <button onClick={onClose} className="mt-4 w-full py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-bold transition-colors">关闭</button>
      </div>
    </div>
  );
}

export function LoadSlotsModal({
  isOpen,
  loadEntries,
  renameSlot,
  renameValue,
  setRenameSlot,
  setRenameValue,
  onRenameSlot,
  onDeleteSlot,
  onLoadFromSlot,
  onClose,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4">📂 选择存档读取</h2>
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {loadEntries.map(({ slotId, slot, isAuto }) => {
            const isRenaming = renameSlot === slotId;
            const isManualSlot = /^slot\d+$/.test(slotId);
            return (
              <div key={slotId} className={(slot ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200 opacity-75') + ' rounded-lg p-4 border'}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {isRenaming && slot ? (
                      <RenameSlotInput
                        slotId={slotId}
                        renameValue={renameValue}
                        setRenameValue={setRenameValue}
                        onRename={onRenameSlot}
                        onCancel={() => { setRenameSlot(null); setRenameValue(''); }}
                      />
                    ) : (
                      <>
                        <p className="font-bold text-sm truncate">
                          {slot ? `${isAuto ? '🔄 ' : ''}${getSaveSlotLabel(slotId, slot, isAuto)}` : (isAuto ? '🔄 自动存档：空' : isManualSlot ? `空槽位 ${slotId.replace('slot', '')}` : `${slotId}：无效数据`)}
                        </p>
                        {slot ? (
                          <p className="text-xs text-slate-400 truncate">{slot.savedAt || '未知时间'} · M{Math.floor(((slot.day || 1) - 1) / 30) + 1} D{(((slot.day || 1) - 1) % 30) + 1}</p>
                        ) : (
                          <p className="text-xs text-slate-400 truncate">暂无可读取进度</p>
                        )}
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {slot && !isAuto && !isRenaming && (
                      <>
                        <button onClick={() => { setRenameSlot(slotId); setRenameValue(getSaveSlotLabel(slotId, slot, isAuto)); }} className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded hover:bg-amber-200" title="重命名">✏️</button>
                        <button onClick={() => onDeleteSlot(slotId)} className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200" title="删除">🗑️</button>
                      </>
                    )}
                    <button disabled={!slot} onClick={() => onLoadFromSlot(slotId)} className="text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-500 font-bold disabled:opacity-40 disabled:cursor-not-allowed">
                      读取
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <button onClick={onClose} className="mt-4 w-full py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-bold transition-colors">关闭</button>
      </div>
    </div>
  );
}
