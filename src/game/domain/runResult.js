export const ENDING_RANKS = {
  BANKRUPT: 'bankrupt',
  DISMISSED: 'dismissed',
  FAILED: 'failed',
  RENEWED: 'renewed',
  EXCELLENT: 'excellent',
  REGIONAL_STAR: 'regional_star',
};

export const createRunSummary = ({
  runId,
  scenarioId,
  difficultyMode,
  seed = null,
  startedAt = null,
  endedAt = null,
  ending = null,
  score = 0,
  stats = {},
}) => ({
  runId,
  scenarioId,
  difficultyMode,
  seed,
  startedAt,
  endedAt,
  ending,
  score,
  stats,
});
