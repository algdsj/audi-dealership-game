export const BI_THRESHOLDS = {
  salesPaceWarning: 0.85,
  salesPaceDanger: 0.65,
  cashCoverageWarningDays: 18,
  cashCoverageDangerDays: 10,
  debtRatioWarning: 0.68,
  debtRatioDanger: 0.82,
  csiWarning: 82,
  csiDanger: 75,
  inventoryAgingWarningDays: 60,
  inventoryAgingDangerDays: 90,
  conversionWarning: 0.12,
  conversionDanger: 0.07,
  purchaseTargetWarning: 0.75,
};

export const BI_RISK_META = {
  healthy: { label: '健康', tone: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  watch: { label: '关注', tone: 'text-amber-700 bg-amber-50 border-amber-200' },
  danger: { label: '高危', tone: 'text-red-700 bg-red-50 border-red-200' },
};
