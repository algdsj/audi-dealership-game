import { Component } from 'react';
import { APP_VERSION_INFO } from '../game/config/appVersion.js';
import { LEGACY_SAVE_KEY, SAVE_SLOTS_KEY } from '../game/state/saveSlots.js';

const downloadLocalStorageSnapshot = () => {
  const snapshot = {
    appName: APP_VERSION_INFO.appName,
    appVersion: APP_VERSION_INFO.version,
    exportedAt: new Date().toISOString(),
    localStorage: {},
  };

  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (key) snapshot.localStorage[key] = localStorage.getItem(key);
  }

  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'audi-4s-localstorage-backup.json';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Application render failed', error, errorInfo);
  }

  clearLocalData = () => {
    if (!window.confirm('确认清除本地缓存并回到开局？该操作会删除自动存档、自动备份和手动槽位。')) return;
    localStorage.removeItem(SAVE_SLOTS_KEY);
    localStorage.removeItem(LEGACY_SAVE_KEY);
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
        <div className="mx-auto flex max-w-2xl flex-col gap-5 rounded-xl border border-white/10 bg-white/10 p-6 shadow-2xl">
          <div>
            <p className="text-xs font-black text-blue-200">RECOVERY</p>
            <h1 className="mt-2 text-2xl font-black">应用遇到渲染异常</h1>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              当前页面没有正常打开。可以先刷新重试；如果仍然失败，先导出本地缓存备份，再清除缓存回到开局。
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-lg bg-blue-500 px-4 py-3 text-sm font-black text-white transition-colors hover:bg-blue-400"
            >
              刷新重试
            </button>
            <button
              type="button"
              onClick={downloadLocalStorageSnapshot}
              className="rounded-lg border border-slate-500 px-4 py-3 text-sm font-black text-slate-100 transition-colors hover:bg-white/10"
            >
              导出缓存备份
            </button>
            <button
              type="button"
              onClick={this.clearLocalData}
              className="rounded-lg bg-red-600 px-4 py-3 text-sm font-black text-white transition-colors hover:bg-red-500"
            >
              清除缓存
            </button>
          </div>

          <p className="text-xs font-bold text-slate-400">
            {APP_VERSION_INFO.appName} {APP_VERSION_INFO.version} · 存档版本 v{APP_VERSION_INFO.saveSchemaVersion}
          </p>
        </div>
      </main>
    );
  }
}
