export const SAVE_SLOTS_KEY = 'audi_game_save_slots';
export const LEGACY_SAVE_KEY = 'audi_game_save';
export const MAX_SAVE_SLOTS = 5;
export const MAX_AUTO_BACKUPS = 3;

export const createEmptySaveSlots = () => ({ slots: {}, autoBackups: [] });

export const isSaveLike = (value) => value && typeof value === 'object' && (
  value.savedAt || Number.isFinite(value.day) || value.finance || value.inventory || value.monthlyStats || value.gameState
);

export const isAutoBackupSlotId = (slotId) => /^auto_backup_\d+$/.test(slotId);

const getAutoBackupIndex = (slotId) => Number(slotId.replace('auto_backup_', '')) - 1;

export const getAutoBackupSlotId = (index) => `auto_backup_${index + 1}`;

export const normalizeAutoBackups = (autoBackups) => (
  Array.isArray(autoBackups) ? autoBackups.filter(isSaveLike).slice(0, MAX_AUTO_BACKUPS) : []
);

export const readSaveSlots = (storage = localStorage) => {
  try {
    const raw = storage.getItem(SAVE_SLOTS_KEY);
    const parsed = raw ? JSON.parse(raw) : createEmptySaveSlots();
    if (parsed?.slots && typeof parsed.slots === 'object') {
      return {
        slots: parsed.slots,
        autoBackups: normalizeAutoBackups(parsed.autoBackups),
      };
    }
    if (isSaveLike(parsed)) {
      return { slots: { slot1: { ...parsed, slotName: parsed.slotName || '旧版存档' } }, autoBackups: [] };
    }
    return createEmptySaveSlots();
  } catch {
    return createEmptySaveSlots();
  }
};

export const writeSaveSlots = (allSlots, storage = localStorage) => {
  storage.setItem(SAVE_SLOTS_KEY, JSON.stringify({
    slots: allSlots?.slots || {},
    autoBackups: normalizeAutoBackups(allSlots?.autoBackups),
  }));
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
  const autoBackups = normalizeAutoBackups(allSlots.autoBackups);
  const fixedKeys = ['auto', ...Array.from({ length: MAX_SAVE_SLOTS }, (_, i) => `slot${i + 1}`)];
  const extraKeys = Object.keys(slots).filter(key => !fixedKeys.includes(key)).sort();
  const fixedEntries = fixedKeys.map(slotId => {
    const slot = isSaveLike(slots[slotId]) ? slots[slotId] : null;
    return { slotId, slot, isAuto: slotId === 'auto', isAutoBackup: false };
  });
  const backupEntries = Array.from({ length: MAX_AUTO_BACKUPS }, (_, index) => {
    const slot = autoBackups[index] || null;
    return { slotId: getAutoBackupSlotId(index), slot, isAuto: false, isAutoBackup: true };
  });
  const extraEntries = extraKeys.map(slotId => {
    const slot = isSaveLike(slots[slotId]) ? slots[slotId] : null;
    return { slotId, slot, isAuto: false, isAutoBackup: false };
  });
  return [...fixedEntries.slice(0, 1), ...backupEntries, ...fixedEntries.slice(1), ...extraEntries];
};

export const getSaveSlotLabel = (slotId, slot, isAuto = false) => {
  if (isAuto) return '自动存档';
  if (isAutoBackupSlotId(slotId)) return `自动备份 ${getAutoBackupIndex(slotId) + 1}`;
  if (slot?.slotName) return slot.slotName;
  const manualIndex = /^slot\d+$/.test(slotId) ? slotId.replace('slot', '') : slotId;
  return `存档 ${manualIndex}`;
};

export const getSaveFromSlotId = (allSlots, slotId) => {
  if (isAutoBackupSlotId(slotId)) {
    const slot = normalizeAutoBackups(allSlots.autoBackups)[getAutoBackupIndex(slotId)];
    return isSaveLike(slot) ? slot : null;
  }
  const slot = allSlots.slots?.[slotId];
  return isSaveLike(slot) ? slot : null;
};

export const deleteSaveFromSlotId = (allSlots, slotId) => {
  if (isAutoBackupSlotId(slotId)) {
    const index = getAutoBackupIndex(slotId);
    const autoBackups = normalizeAutoBackups(allSlots.autoBackups);
    if (index >= 0) autoBackups.splice(index, 1);
    return { ...(allSlots || {}), slots: allSlots?.slots || {}, autoBackups };
  }
  const nextSlots = { ...(allSlots?.slots || {}) };
  delete nextSlots[slotId];
  return { ...(allSlots || {}), slots: nextSlots, autoBackups: normalizeAutoBackups(allSlots?.autoBackups) };
};

export const rotateAutoSaveBackups = (allSlots, previousAutoSave = allSlots?.slots?.auto) => {
  const existingBackups = normalizeAutoBackups(allSlots?.autoBackups);
  if (!isSaveLike(previousAutoSave)) {
    return { ...(allSlots || {}), slots: allSlots?.slots || {}, autoBackups: existingBackups };
  }
  if (existingBackups[0]?.savedAt === previousAutoSave.savedAt && existingBackups[0]?.day === previousAutoSave.day) {
    return { ...(allSlots || {}), slots: allSlots?.slots || {}, autoBackups: existingBackups };
  }
  const backup = {
    ...previousAutoSave,
    slotName: previousAutoSave.slotName || '自动备份',
    backupType: 'auto',
  };
  return {
    ...(allSlots || {}),
    slots: allSlots?.slots || {},
    autoBackups: [backup, ...existingBackups].slice(0, MAX_AUTO_BACKUPS),
  };
};

export const migrateLegacySingleSave = (storage = localStorage) => {
  try {
    const oldRaw = storage.getItem(LEGACY_SAVE_KEY);
    if (oldRaw && !storage.getItem(SAVE_SLOTS_KEY)) {
      const allSlots = { slots: { slot1: JSON.parse(oldRaw) }, autoBackups: [] };
      allSlots.slots.slot1.slotName = '旧版存档';
      writeSaveSlots(allSlots, storage);
      storage.removeItem(LEGACY_SAVE_KEY);
      return true;
    }
  } catch {}
  return false;
};
