import { useState } from 'react';
import { getGameDayOfMonth, getGameMonth } from '../game/engine/gameDate.js';
import {
  getLoadSlotEntries as buildLoadSlotEntries,
  getReadableSaveEntries as buildReadableSaveEntries,
  getSaveSlotLabel,
  getSaveFromSlotId,
  isSaveLike,
  migrateLegacySingleSave,
  readSaveSlots,
  deleteSaveFromSlotId,
  writeSaveSlots,
} from '../game/state/saveSlots.js';

export function useSaveSlotController({
  buildSaveData,
  applySaveData,
  resetAfterLoadUi,
  showAlert,
  showConfirm,
  currentDay,
  onReturnToSetup,
}) {
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [loadStartedFromSetup, setLoadStartedFromSetup] = useState(false);
  const [renameSlot, setRenameSlot] = useState(null);
  const [renameValue, setRenameValue] = useState('');

  const getSaveSlots = () => readSaveSlots();
  const getReadableSaveEntries = () => buildReadableSaveEntries(getSaveSlots());
  const getLoadSlotEntries = () => buildLoadSlotEntries(getSaveSlots());
  const hasAnySaveData = () => getReadableSaveEntries().length > 0;

  const handleSaveToSlot = (slotId, customName) => {
    const allSlots = getSaveSlots();
    const saveData = buildSaveData();
    saveData.slotName = customName || `存档 ${slotId}`;
    allSlots.slots[slotId] = saveData;
    try {
      writeSaveSlots(allSlots);
      showAlert('存档成功', `已保存至「${saveData.slotName}」！\n存档时间：${saveData.savedAt}\n经营日：M${getGameMonth(currentDay)} D${getGameDayOfMonth(currentDay)}`);
    } catch (_e) {
      showAlert('存档失败', '存储空间不足，无法保存游戏进度。');
    }
    setShowSaveModal(false);
  };

  const closeLoadModal = () => {
    setShowLoadModal(false);
    setRenameSlot(null);
    setRenameValue('');
    if (loadStartedFromSetup) {
      onReturnToSetup();
      setLoadStartedFromSetup(false);
    }
  };

  const handleLoadFromSlot = (slotId) => {
    const allSlots = getSaveSlots();
    const saveData = getSaveFromSlotId(allSlots, slotId);
    if (!isSaveLike(saveData)) return showAlert('读档失败', '该槽位无有效存档数据。');
    const slotName = getSaveSlotLabel(slotId, saveData, slotId === 'auto');
    showConfirm('确认读档', `是否加载存档「${slotName}」？\n存档时间：${saveData.savedAt}\n经营日：M${Math.floor((saveData.day - 1) / 30) + 1} D${((saveData.day - 1) % 30) + 1}\n\n⚠️ 当前进度将被覆盖！`, () => {
      applySaveData(saveData);
      setLoadStartedFromSetup(false);
      setShowSaveModal(false);
      setShowLoadModal(false);
      setRenameSlot(null);
      setRenameValue('');
      resetAfterLoadUi();
      showAlert('读档成功', `已读取「${slotName}」。\n当前经营日：M${Math.floor(((saveData.day || 1) - 1) / 30) + 1} D${(((saveData.day || 1) - 1) % 30) + 1}`);
    });
  };

  const handleDeleteSlot = (slotId) => {
    const allSlots = getSaveSlots();
    const saveData = getSaveFromSlotId(allSlots, slotId);
    if (!saveData) return;
    const slotName = getSaveSlotLabel(slotId, saveData, slotId === 'auto');
    showConfirm('确认删除', `是否删除存档「${slotName}」？\n\n⚠️ 删除后无法恢复！`, () => {
      try { writeSaveSlots(deleteSaveFromSlotId(allSlots, slotId)); } catch {}
    });
  };

  const handleRenameSlot = (slotId) => {
    const allSlots = getSaveSlots();
    const saveData = allSlots.slots[slotId];
    if (!saveData) return;
    saveData.slotName = renameValue.trim() || getSaveSlotLabel(slotId, saveData, slotId === 'auto');
    try { writeSaveSlots(allSlots); } catch {}
    setRenameSlot(null);
    setRenameValue('');
  };

  migrateLegacySingleSave();

  return {
    showSaveModal,
    setShowSaveModal,
    showLoadModal,
    setShowLoadModal,
    loadStartedFromSetup,
    setLoadStartedFromSetup,
    renameSlot,
    setRenameSlot,
    renameValue,
    setRenameValue,
    getSaveSlots,
    getLoadSlotEntries,
    handleSaveToSlot,
    closeLoadModal,
    handleLoadFromSlot,
    handleDeleteSlot,
    handleRenameSlot,
    hasAnySaveData,
  };
}
