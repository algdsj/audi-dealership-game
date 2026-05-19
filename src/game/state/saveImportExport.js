import { APP_VERSION_INFO } from '../config/appVersion.js';
import { isSaveLike } from './saveSlots.js';
import { normalizeLoadedSaveData } from './saveData.js';

export const SAVE_EXPORT_FORMAT = 'audi-dealership-save-json';
export const SAVE_EXPORT_FORMAT_VERSION = 1;

export const buildSaveExportPayload = ({
  saveData,
  exportedAt = new Date().toISOString(),
} = {}) => {
  if (!isSaveLike(saveData)) {
    throw new Error('无法导出无效存档。');
  }

  return {
    format: SAVE_EXPORT_FORMAT,
    exportVersion: SAVE_EXPORT_FORMAT_VERSION,
    appName: APP_VERSION_INFO.appName,
    appVersion: APP_VERSION_INFO.version,
    saveSchemaVersion: APP_VERSION_INFO.saveSchemaVersion,
    exportedAt,
    saveData,
  };
};

export const extractSaveDataFromImportPayload = (payload) => {
  if (payload?.format === SAVE_EXPORT_FORMAT && isSaveLike(payload.saveData)) return payload.saveData;
  if (isSaveLike(payload)) return payload;
  throw new Error('导入文件不是有效的存档 JSON。');
};

export const normalizeImportedSavePayload = (payload) => (
  normalizeLoadedSaveData(extractSaveDataFromImportPayload(payload))
);
