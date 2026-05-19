export const APP_VERSION_INFO = {
  appName: '奥迪 4S 店经营模拟',
  version: '0.1.0-preflight',
  releaseStage: '发布前产品化与PWA准备包',
  saveSchemaVersion: 1,
  buildDate: '2026-05-18',
};

export const getRuntimeEnvironmentLabel = (mode = 'production') => {
  if (mode === 'development') return '开发环境';
  if (mode === 'test') return '测试环境';
  return '生产构建';
};
