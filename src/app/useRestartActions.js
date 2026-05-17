import { LEGACY_SAVE_KEY, SAVE_SLOTS_KEY } from '../game/state/saveSlots.js';

export function useRestartActions({ showConfirm }) {
  const handleRestart = () => {
    showConfirm('重新开始', '确定要重新开始游戏吗？所有进度将丢失！', () => {
      localStorage.removeItem(LEGACY_SAVE_KEY);
      localStorage.removeItem(SAVE_SLOTS_KEY);
      window.location.reload();
    });
  };

  return {
    handleRestart,
  };
}
