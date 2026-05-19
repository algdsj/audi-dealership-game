import { useEffect, useState } from 'react';
import { APP_VERSION_INFO, getRuntimeEnvironmentLabel } from '../game/config/appVersion.js';
import { normalizeImportedSavePayload, buildSaveExportPayload } from '../game/state/saveImportExport.js';
import { LEGACY_SAVE_KEY, SAVE_SLOTS_KEY, getLoadSlotEntries } from '../game/state/saveSlots.js';

const downloadJson = (filename, payload) => {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export function useSettingsController({
  applySaveData,
  buildSaveData,
  getSaveSlots,
  resetAfterLoadUi,
  showAlert,
  showConfirm,
}) {
  const runtimeMode = import.meta.env.MODE || 'production';
  const runtimeEnvironment = getRuntimeEnvironmentLabel(runtimeMode);
  const [installPromptEvent, setInstallPromptEvent] = useState(null);
  const [pwaStatus, setPwaStatus] = useState(() => ({
    online: typeof navigator === 'undefined' ? true : navigator.onLine,
    serviceWorker: typeof navigator !== 'undefined' && navigator.serviceWorker?.controller
      ? 'active'
      : typeof navigator !== 'undefined' && 'serviceWorker' in navigator
      ? 'supported'
      : 'unsupported',
    displayMode: typeof window !== 'undefined' && window.matchMedia?.('(display-mode: standalone)').matches ? 'standalone' : 'browser',
    installable: false,
  }));

  useEffect(() => {
    const updateOnline = () => setPwaStatus(prev => ({ ...prev, online: navigator.onLine }));
    const updateDisplayMode = () => setPwaStatus(prev => ({
      ...prev,
      displayMode: window.matchMedia?.('(display-mode: standalone)').matches ? 'standalone' : 'browser',
    }));
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setInstallPromptEvent(event);
      setPwaStatus(prev => ({ ...prev, installable: true }));
    };
    const handlePwaStatus = event => setPwaStatus(prev => ({
      ...prev,
      serviceWorker: event.detail?.serviceWorker || prev.serviceWorker,
    }));
    const handleInstalled = () => {
      setInstallPromptEvent(null);
      setPwaStatus(prev => ({ ...prev, installable: false, displayMode: 'standalone' }));
    };

    window.addEventListener('online', updateOnline);
    window.addEventListener('offline', updateOnline);
    window.addEventListener('resize', updateDisplayMode);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);
    window.addEventListener('audi:pwa-status', handlePwaStatus);
    return () => {
      window.removeEventListener('online', updateOnline);
      window.removeEventListener('offline', updateOnline);
      window.removeEventListener('resize', updateDisplayMode);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
      window.removeEventListener('audi:pwa-status', handlePwaStatus);
    };
  }, []);

  const getSaveSlotSummary = () => {
    const allSlots = getSaveSlots();
    const readableEntries = getLoadSlotEntries(allSlots).filter(entry => entry.slot);
    return {
      total: readableEntries.length,
      autoBackupCount: readableEntries.filter(entry => entry.isAutoBackup).length,
      lastAutoSavedAt: allSlots.slots?.auto?.savedAt || '暂无自动存档',
    };
  };

  const exportCurrentSave = () => {
    try {
      const payload = buildSaveExportPayload({ saveData: buildSaveData() });
      downloadJson(`audi-4s-save-day-${payload.saveData.day || 1}.json`, payload);
      showAlert('导出完成', '当前进度已导出为 JSON 文件。');
    } catch (_error) {
      showAlert('导出失败', '当前进度不是有效存档，无法导出。');
    }
  };

  const importSaveFile = async (file) => {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      const normalizedSave = normalizeImportedSavePayload(parsed);
      showConfirm('导入存档', `是否导入该存档？\n经营日：M${Math.floor(((normalizedSave.day || 1) - 1) / 30) + 1} D${(((normalizedSave.day || 1) - 1) % 30) + 1}\n\n当前进度会被覆盖，但本地存档槽不会被删除。`, () => {
        applySaveData(normalizedSave);
        resetAfterLoadUi();
        showAlert('导入成功', '存档已导入，并已按当前版本补齐兼容字段。');
      });
    } catch (error) {
      showAlert('导入失败', error?.message || '无法读取该 JSON 文件。');
    }
  };

  const resetLocalData = () => {
    showConfirm('重置本地数据', '是否清除本地所有存档并回到开局？该操作会删除自动存档、自动备份和手动槽位。', () => {
      localStorage.removeItem(SAVE_SLOTS_KEY);
      localStorage.removeItem(LEGACY_SAVE_KEY);
      window.location.reload();
    });
  };

  const installApp = async () => {
    if (!installPromptEvent) {
      showAlert('暂不可安装', '当前浏览器暂未提供安装入口。可以使用浏览器菜单中的“添加到主屏幕/安装应用”。');
      return;
    }
    installPromptEvent.prompt();
    const choice = await installPromptEvent.userChoice;
    if (choice?.outcome === 'accepted') {
      setInstallPromptEvent(null);
      setPwaStatus(prev => ({ ...prev, installable: false }));
    }
  };

  return {
    appInfo: APP_VERSION_INFO,
    runtimeMode,
    runtimeEnvironment,
    pwaStatus,
    getSaveSlotSummary,
    exportCurrentSave,
    importSaveFile,
    resetLocalData,
    installApp,
  };
}
