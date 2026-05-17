import { STAFF_ROLE_META } from '../../game/config/staff.js';
import { STAFF_STORY_TYPES } from '../../game/config/staffStories.js';
import { getCareerLevel, getEffectiveSkill } from '../../game/engine/staffing.js';
import { StaffAvatar } from '../../shared/ui/StaffAvatar.jsx';
import { StaffStoryBadge } from '../../shared/ui/StaffStoryBadge.jsx';

const clampPercent = (value, fallback = 0) => {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return fallback;
  return Math.max(0, Math.min(100, Math.round(numberValue)));
};

const formatRisk = (value) => {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return '未评估';
  return `${numberValue.toFixed(numberValue >= 10 ? 0 : 1)}%`;
};

const getMetricValue = (workstation, key, fallback) => {
  const metrics = workstation?.metrics || {};
  return metrics[key] ?? metrics[`${key}Percent`] ?? fallback;
};

const getRoleLabel = (role) => STAFF_ROLE_META[role]?.label || '员工';

const getEmployeeName = (employee) => employee?.nickname || employee?.name || '未命名员工';

const getRecentStories = (storyMoments = []) => (
  Array.isArray(storyMoments) ? storyMoments.slice(0, 3) : []
);

function MeterLine({ label, value, tone = 'slate' }) {
  const safeValue = clampPercent(value);
  const barTone = {
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    red: 'bg-red-500',
    blue: 'bg-blue-500',
    slate: 'bg-slate-400',
  }[tone] || 'bg-slate-400';

  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2 text-[10px] font-bold text-slate-500">
        <span>{label}</span>
        <span>{safeValue}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className={'h-full rounded-full transition-all ' + barTone} style={{ width: `${safeValue}%` }}></div>
      </div>
    </div>
  );
}

function ActionButton({ children, onClick, tone = 'slate' }) {
  const toneClass = {
    blue: 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100',
    indigo: 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100',
    amber: 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100',
    slate: 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100',
  }[tone] || 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100';

  return (
    <button
      type="button"
      onClick={onClick}
      className={'rounded-md border px-2 py-1.5 text-[10px] font-black transition-colors ' + toneClass}
    >
      {children}
    </button>
  );
}

export function StoreEmployeePopover({
  workstation,
  onClose,
  onOpenStaff,
  onTrainMember,
  onToggleRetention,
}) {
  const employee = workstation?.employee || {};
  const role = workstation?.role || employee.role || employee.type || 'sales';
  const roleLabel = getRoleLabel(role);
  const level = workstation?.metrics?.level || getCareerLevel(employee);
  const levelLabel = workstation?.metrics?.levelLabel || level.title || `Lv.${level.level || 1}`;
  const levelValue = workstation?.metrics?.levelValue || level.level || 1;
  const ability = getMetricValue(workstation, 'ability', getMetricValue(workstation, 'skill', getEffectiveSkill(role, employee)));
  const loyalty = getMetricValue(workstation, 'loyalty', employee.loyalty);
  const stress = getMetricValue(workstation, 'stress', employee.stress);
  const risk = getMetricValue(workstation, 'risk', getMetricValue(workstation, 'turnoverRisk', employee.turnoverRisk));
  const recentStories = getRecentStories(workstation?.storyMoments);
  const loyaltyTone = clampPercent(loyalty, 62) < 45 ? 'red' : clampPercent(loyalty, 62) < 65 ? 'amber' : 'emerald';
  const stressTone = clampPercent(stress, 18) >= 75 ? 'red' : clampPercent(stress, 18) >= 55 ? 'amber' : 'blue';

  const callbackPayload = {
    workstation,
    employee,
    role,
    employeeId: employee.id,
    clickTarget: workstation?.clickTarget,
  };

  return (
    <div
      className="absolute left-1/2 top-full z-40 mt-2 w-[min(320px,calc(100vw-48px))] -translate-x-1/2 rounded-xl border border-slate-200 bg-white p-3 text-left shadow-xl"
      onClick={event => event.stopPropagation()}
      role="dialog"
      aria-label={`${getEmployeeName(employee)}员工故事`}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <StaffAvatar type={role} member={employee} size={44} />
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-slate-900">{getEmployeeName(employee)}</p>
            <p className="truncate text-[10px] font-bold text-slate-400">{roleLabel} · {levelLabel} Lv.{levelValue}</p>
            <p className="truncate text-[10px] font-bold text-indigo-600">能力 {Math.round(Number(ability) || 0)}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-md border border-slate-200 px-2 py-1 text-[10px] font-black text-slate-400 hover:bg-slate-50"
          aria-label="关闭员工浮层"
        >
          关闭
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg border border-slate-100 bg-slate-50 px-2 py-2">
          <p className="text-[10px] text-slate-400">忠诚</p>
          <p className="text-sm font-black text-slate-800">{clampPercent(loyalty, 62)}</p>
        </div>
        <div className="rounded-lg border border-slate-100 bg-slate-50 px-2 py-2">
          <p className="text-[10px] text-slate-400">压力</p>
          <p className="text-sm font-black text-slate-800">{clampPercent(stress, 18)}</p>
        </div>
        <div className="rounded-lg border border-slate-100 bg-slate-50 px-2 py-2">
          <p className="text-[10px] text-slate-400">流失</p>
          <p className="text-sm font-black text-red-600">{formatRisk(risk)}</p>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        <MeterLine label="忠诚度" value={loyalty} tone={loyaltyTone} />
        <MeterLine label="压力值" value={stress} tone={stressTone} />
      </div>

      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between gap-2">
          <p className="text-[10px] font-black text-slate-500">最近故事</p>
          {recentStories.length > 0 && <span className="text-[10px] font-bold text-slate-300">{recentStories.length}/3</span>}
        </div>
        <div className="space-y-1.5">
          {recentStories.length === 0 && (
            <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-2 text-[10px] font-bold text-slate-400">
              暂无员工故事记录。
            </p>
          )}
          {recentStories.map((moment, index) => {
            const meta = STAFF_STORY_TYPES[moment?.type] || {};
            return (
              <div key={moment?.id || `${moment?.type || 'story'}-${index}`} className="rounded-lg border border-slate-100 bg-white p-2">
                <div className="mb-1 flex items-center gap-1.5">
                  <StaffStoryBadge moment={moment} />
                  {moment?.day && <span className="text-[10px] font-bold text-slate-300">D{moment.day}</span>}
                </div>
                <p className="text-[10px] font-bold leading-relaxed text-slate-600">
                  {moment?.summary || moment?.message || meta.label || '员工状态有变化'}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <ActionButton tone="blue" onClick={() => onOpenStaff?.(callbackPayload)}>去人事页</ActionButton>
        <ActionButton tone="indigo" onClick={() => onTrainMember?.(callbackPayload)}>培训</ActionButton>
        <ActionButton tone="amber" onClick={() => onToggleRetention?.(callbackPayload)}>留任</ActionButton>
      </div>
    </div>
  );
}
