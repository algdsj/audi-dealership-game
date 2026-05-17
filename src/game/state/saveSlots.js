export const SAVE_SLOTS_KEY = 'audi_game_save_slots';
export const LEGACY_SAVE_KEY = 'audi_game_save';
export const MAX_SAVE_SLOTS = 5;

export const isSaveLike = (value) => value && typeof value === 'object' && (
  value.savedAt || Number.isFinite(value.day) || value.finance || value.inventory || value.monthlyStats || value.gameState
);

export const readSaveSlots = (storage = localStorage) => {
  try {
    const raw = storage.getItem(SAVE_SLOTS_KEY);
    const parsed = raw ? JSON.parse(raw) : { slots: {} };
    if (parsed?.slots && typeof parsed.slots === 'object') return { slots: parsed.slots };
    if (isSaveLike(parsed)) return { slots: { slot1: { ...parsed, slotName: parsed.slotName || '旧版存档' } } };
    return { slots: {} };
  } catch {
    return { slots: {} };
  }
};

export const writeSaveSlots = (allSlots, storage = localStorage) => {
  storage.setItem(SAVE_SLOTS_KEY, JSON.stringify(allSlots));
};

export const getReadableSaveEntries = (allSlots) => {
  const slots = allSlots.slots || {};
  const preferredKeys = ['auto', ...Array.from({ length: MAX_SAVE_SLOTS }, (_, i) => `slot${i + 1}`)];
  const extraKeys = Object.keys(slots).filter(key => !preferredKeys.includes(key)).sort();
  return [...preferredKeys, ...extraKeys]
    .filter(slotId => isSaveLike(slots[slotId]))
    .map(slotId => ({ slotId, slot: slots[slotId], isAuto: slotId === 'auto' }));
};

export const getLoadSlotEntries = (allSlots) => {
  const slots = allSlots.slots || {};
  const fixedKeys = ['auto', ...Array.from({ length: MAX_SAVE_SLOTS }, (_, i) => `slot${i + 1}`)];
  const extraKeys = Object.keys(slots).filter(key => !fixedKeys.includes(key)).sort();
  return [...fixedKeys, ...extraKeys].map(slotId => {
    const slot = isSaveLike(slots[slotId]) ? slots[slotId] : null;
    return { slotId, slot, isAuto: slotId === 'auto' };
  });
};

export const getSaveSlotLabel = (slotId, slot, isAuto = false) => {
  if (slot?.slotName) return slot.slotName;
  if (isAuto) return '自动存档';
  const manualIndex = /^slot\d+$/.test(slotId) ? slotId.replace('slot', '') : slotId;
  return `存档 ${manualIndex}`;
};

export const migrateLegacySingleSave = (storage = localStorage) => {
  try {
    const oldRaw = storage.getItem(LEGACY_SAVE_KEY);
    if (oldRaw && !storage.getItem(SAVE_SLOTS_KEY)) {
      const allSlots = { slots: { slot1: JSON.parse(oldRaw) } };
      allSlots.slots.slot1.slotName = '旧版存档';
      writeSaveSlots(allSlots, storage);
      storage.removeItem(LEGACY_SAVE_KEY);
      return true;
    }
  } catch {}
  return false;
};
