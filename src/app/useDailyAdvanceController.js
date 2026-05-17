import { runDailyAdvance } from './runDailyAdvance.js';

export function useDailyAdvanceController(context) {
  const handleNextDay = () => runDailyAdvance(context);

  return { handleNextDay };
}
