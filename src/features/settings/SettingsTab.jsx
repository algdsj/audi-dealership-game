import { useRef } from 'react';

function InfoTile({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-black uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-2 text-lg font-black text-slate-800">{value}</p>
    </div>
  );
}

export function SettingsTab({
  appInfo,
  pwaStatus = { online: true, serviceWorker: 'unsupported', displayMode: 'browser', installable: false },
  runtimeMode,
  runtimeEnvironment,
  saveSlotSummary,
  onExportSave,
  onImportSaveFile,
  onInstallApp,
  onResetLocalData,
}) {
  const fileInputRef = useRef(null);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-black text-blue-600">SYSTEM</p>
        <h2 className="mt-1 text-2xl font-black text-slate-900">系统设置</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">查看版本信息，导入导出存档，或在发布前测试时重置本地数据。</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <InfoTile label="应用名称" value={appInfo.appName} />
        <InfoTile label="应用版本" value={appInfo.version} />
        <InfoTile label="存档版本" value={`v${appInfo.saveSchemaVersion}`} />
        <InfoTile label="运行环境" value={`${runtimeEnvironment} / ${runtimeMode}`} />
      </div>

      <section className="rounded-lg border border-blue-200 bg-blue-50 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-base font-black text-blue-950">安装与离线</h3>
            <p className="mt-1 text-sm leading-6 text-blue-700">
              构建版会注册离线缓存。安装到桌面或主屏幕后，静态游戏界面可在无网时打开；存档仍保存在本机浏览器。
            </p>
          </div>
          <button
            type="button"
            onClick={onInstallApp}
            className="w-fit rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-black text-white transition-colors hover:bg-blue-500"
          >
            安装应用
          </button>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <InfoTile label="联网状态" value={pwaStatus.online ? '在线' : '离线'} />
          <InfoTile label="离线缓存" value={pwaStatus.serviceWorker === 'unsupported' ? '不支持' : pwaStatus.serviceWorker === 'registered' || pwaStatus.serviceWorker === 'active' ? '已启用' : '待启用'} />
          <InfoTile label="窗口模式" value={pwaStatus.displayMode === 'standalone' ? '独立窗口' : '浏览器'} />
          <InfoTile label="安装状态" value={pwaStatus.installable ? '可安装' : '按浏览器入口'} />
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-base font-black text-slate-900">存档 JSON</h3>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                当前本地共有 {saveSlotSummary.total} 个可读存档，其中自动备份 {saveSlotSummary.autoBackupCount} 个。
              </p>
              <p className="mt-1 text-xs font-bold text-slate-400">最近自动存档：{saveSlotSummary.lastAutoSavedAt}</p>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onExportSave}
              className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-black text-white transition-colors hover:bg-blue-500"
            >
              导出存档 JSON
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-black text-slate-700 transition-colors hover:bg-slate-50"
            >
              导入存档 JSON
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(event) => {
                onImportSaveFile(event.target.files?.[0]);
                event.target.value = '';
              }}
            />
          </div>
        </section>

        <section className="rounded-lg border border-red-200 bg-red-50 p-5">
          <h3 className="text-base font-black text-red-900">本地数据</h3>
          <p className="mt-2 text-sm leading-6 text-red-700">
            清除浏览器本地存档并回到开局。操作前会再次确认，适合发布前验收或重新开始。
          </p>
          <button
            type="button"
            onClick={onResetLocalData}
            className="mt-5 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-black text-white transition-colors hover:bg-red-500"
          >
            重置本地数据
          </button>
        </section>
      </div>
    </div>
  );
}
