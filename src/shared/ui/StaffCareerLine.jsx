import { getCareerLevel, getNextCareerLevel, normalizeStaffMember } from '../../game/engine/staffing.js';

export function StaffCareerLine({ type, member }) {
  const normalized = normalizeStaffMember(type, member);
  const level = getCareerLevel(normalized);
  const nextLevel = getNextCareerLevel(normalized);
  const xpProgress = nextLevel ? Math.min(100, ((normalized.xp - level.minXp) / (nextLevel.minXp - level.minXp)) * 100) : 100;
  const stressTone = normalized.stress >= 75 ? 'bg-red-500' : normalized.stress >= 55 ? 'bg-amber-500' : 'bg-emerald-500';
  const loyaltyTone = normalized.loyalty >= 70 ? 'bg-emerald-500' : normalized.loyalty >= 45 ? 'bg-blue-500' : 'bg-red-500';

  return (
    <div className="mt-2 rounded-lg bg-slate-50 border border-slate-100 p-2">
      <div className="flex items-center justify-between gap-2 text-[10px] mb-1">
        <span className="font-black text-slate-700">Lv.{level.level} {level.title}</span>
        <span className="text-slate-400">经验 {Math.round(normalized.xp)}{nextLevel ? `/${nextLevel.minXp}` : ''}</span>
      </div>
      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden mb-2">
        <div className="h-full bg-indigo-500" style={{ width: `${xpProgress}%` }}></div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <div className="flex justify-between text-[10px] text-slate-500 mb-0.5"><span>忠诚</span><span>{Math.round(normalized.loyalty)}</span></div>
          <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden"><div className={'h-full ' + loyaltyTone} style={{ width: `${normalized.loyalty}%` }}></div></div>
        </div>
        <div>
          <div className="flex justify-between text-[10px] text-slate-500 mb-0.5"><span>压力</span><span>{Math.round(normalized.stress)}</span></div>
          <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden"><div className={'h-full ' + stressTone} style={{ width: `${normalized.stress}%` }}></div></div>
        </div>
      </div>
    </div>
  );
}
