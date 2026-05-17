export const SAVE_SCHEMA_VERSION = 3;

export const createSaveEnvelope = ({
  saveId,
  slotName,
  appVersion = '0.0.0',
  platform = 'browser',
  user = null,
  run = null,
  gameState = {},
  reports = [],
  achievements = [],
}) => {
  const now = new Date().toISOString();
  return {
    version: SAVE_SCHEMA_VERSION,
    meta: {
      saveId,
      slotName,
      createdAt: now,
      updatedAt: now,
      appVersion,
      platform,
    },
    user,
    run,
    gameState,
    reports,
    achievements,
  };
};
