export const getGameMonth = (absoluteDay) => Math.floor((absoluteDay - 1) / 30) + 1;

export const getGameDayOfMonth = (absoluteDay) => ((absoluteDay - 1) % 30) + 1;

export const getGameDate = (absoluteDay) => ({
  month: getGameMonth(absoluteDay),
  day: getGameDayOfMonth(absoluteDay),
});

export const addMonthsToGameDate = (baseMonth, baseDay, addMonths) => ({
  month: baseMonth + addMonths,
  day: baseDay,
});

export const toAbsoluteDay = (gameDate) => ((gameDate?.month || 1) - 1) * 30 + (gameDate?.day || 1);

export const getDraftRemainingDays = (draft, currentDay) => toAbsoluteDay(draft.dueDate) - currentDay;
