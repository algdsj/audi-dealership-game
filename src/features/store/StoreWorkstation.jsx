import { useState } from 'react';
import { STAFF_ROLE_META } from '../../game/config/staff.js';
import { getEffectiveSkill } from '../../game/engine/staffing.js';
import { StaffAvatar } from '../../shared/ui/StaffAvatar.jsx';
import { StaffStoryBadge } from '../../shared/ui/StaffStoryBadge.jsx';
import { StoreEmployeePopover } from './StoreEmployeePopover.jsx';

const roleToneClass = {
  dcc: 'border-blue-200 bg-blue-50/80 text-blue-700',
  sales: 'border-emerald-200 bg-emerald-50/80 text-emerald-700',
  service: 'border-cyan-200 bg-cyan-50/80 text-cyan-700',
  streamer: 'border-fuchsia-200 bg-fuchsia-50/80 text-fuchsia-700',
  tech: 'border-amber-200 bg-amber-50/80 text-amber-700',
};

const riskBorderClass = {
  safe: 'border-slate-200 hover:border-blue-300',
  story: 'border-blue-300 ring-2 ring-blue-100',
  warn: 'border-amber-300 ring-2 ring-amber-100',
  danger: 'border-red-300 ring-2 ring-red-100',
};

const getRoleLabel = (role) => STAFF_ROLE_META[role]?.label || '员工';

const getEmployeeName = (employee) => employee?.nickname || employee?.name || '未命名员工';

const getMetricValue = (workstation, key, fallback) => {
  const metrics = workstation?.metrics || {};
  return metrics[key] ?? metrics[`${key}Percent`] ?? fallback;
};

const toPercent = (value, fallback = 0) => {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return fallback;
  return Math.max(0, Math.min(100, Math.round(numberValue)));
};

const getRiskTone = (workstation) => {
  if (!workstation?.occupied) return 'safe';

  const loyalty = toPercent(getMetricValue(workstation, 'loyalty', workstation.employee?.loyalty), 62);
  const stress = toPercent(getMetricValue(workstation, 'stress', workstation.employee?.stress), 18);
  const risk = Number(getMetricValue(workstation, 'risk', getMetricValue(workstation, 'turnoverRisk', workstation.employee?.turnoverRisk)));
  const hasStories = Array.isArray(workstation.storyMoments) && workstation.storyMoments.length > 0;

  if (stress >= 78 || loyalty <= 35 || risk >= 4) return 'danger';
  if (stress >= 62 || loyalty <= 48 || risk >= 2) return 'warn';
  if (hasStories) return 'story';
  return 'safe';
};

const getHighlightLabels = (workstation) => {
  const labels = [];
  const loyalty = toPercent(getMetricValue(workstation, 'loyalty', workstation.employee?.loyalty), 62);
  const stress = toPercent(getMetricValue(workstation, 'stress', workstation.employee?.stress), 18);
  const storyCount = Array.isArray(workstation.storyMoments) ? workstation.storyMoments.length : 0;

  if (stress >= 70) labels.push('高压');
  if (loyalty <= 45) labels.push('低忠诚');
  if (storyCount > 0) labels.push(`${storyCount}条故事`);
  return labels;
};

const getStyleValue = (value) => {
  if (value === undefined || value === null) return undefined;
  return typeof value === 'number' ? `${value}%` : value;
};

const getPositionStyle = (workstation) => {
  const position = workstation?.position || workstation?.layout || {};
  const hasPosition = ['left', 'right', 'top', 'bottom', 'width', 'height'].some(key => position[key] !== undefined);
  if (!hasPosition) return {};

  return {
    position: 'absolute',
    left: getStyleValue(position.left),
    right: getStyleValue(position.right),
    top: getStyleValue(position.top),
    bottom: getStyleValue(position.bottom),
    width: getStyleValue(position.width),
    height: getStyleValue(position.height),
  };
};

const getMarkerPositionStyle = (workstation) => {
  const position = workstation?.position || workstation?.layout || {};
  const left = position.left ?? workstation?.x;
  const top = position.top ?? workstation?.y;
  const markerSize = value => {
    if (value === undefined || value === null) return undefined;
    return typeof value === 'number' ? `${value}px` : value;
  };
  return {
    position: 'absolute',
    left: getStyleValue(left),
    top: getStyleValue(top),
    width: markerSize(position.width) || '54px',
    height: markerSize(position.height) || '28px',
    transform: 'translate(-50%, -50%)',
  };
};

function EmptyWorkstation({ workstation }) {
  const roleLabel = workstation.role === 'streamer' ? '展厅直播位' : getRoleLabel(workstation.role);

  return (
    <div className="flex h-full min-h-[96px] flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white/70 p-3 text-center">
      <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full border border-dashed border-slate-300 bg-slate-50 text-lg text-slate-300">
        {STAFF_ROLE_META[workstation.role]?.icon || '+'}
      </div>
      <p className="max-w-full truncate text-xs font-black text-slate-500">{workstation.label || roleLabel}</p>
      <p className="mt-0.5 text-[10px] font-bold text-slate-300">空工位</p>
      {workstation.role === 'streamer' && (
        <span className="mt-2 rounded-full border border-fuchsia-200 bg-fuchsia-50 px-2 py-1 text-[10px] font-black text-fuchsia-700">
          展厅直播位
        </span>
      )}
    </div>
  );
}

export function StoreWorkstation({
  workstation,
  onOpenStaff,
  onTrainMember,
  onToggleRetention,
  variant = 'card',
}) {
  const [open, setOpen] = useState(false);
  const safeWorkstation = workstation || {};
  const employee = safeWorkstation.employee || {};
  const role = safeWorkstation.role || employee.role || employee.type || 'sales';
  const roleLabel = role === 'streamer' ? '展厅直播位' : getRoleLabel(role);
  const occupied = Boolean(safeWorkstation.occupied && safeWorkstation.employee);
  const riskTone = getRiskTone({ ...safeWorkstation, role, employee, occupied });
  const highlights = getHighlightLabels({ ...safeWorkstation, role, employee });
  const storyMoments = Array.isArray(safeWorkstation.storyMoments) ? safeWorkstation.storyMoments.slice(0, 2) : [];
  const ability = getMetricValue(safeWorkstation, 'ability', getMetricValue(safeWorkstation, 'skill', getEffectiveSkill(role, employee)));
  const loyalty = toPercent(getMetricValue(safeWorkstation, 'loyalty', employee.loyalty), 62);
  const stress = toPercent(getMetricValue(safeWorkstation, 'stress', employee.stress), 18);
  const positionStyle = getPositionStyle(safeWorkstation);

  const callbackPayload = {
    workstation: safeWorkstation,
    employee,
    role,
    employeeId: employee.id,
    clickTarget: safeWorkstation.clickTarget,
  };

  const handleOpenStaff = (payload) => onOpenStaff?.(payload || callbackPayload);
  const handleTrainMember = (payload) => onTrainMember?.(payload || callbackPayload);
  const handleToggleRetention = (payload) => onToggleRetention?.(payload || callbackPayload);

  if (variant === 'marker') {
    const markerStyle = getMarkerPositionStyle(safeWorkstation);
    const markerLabel = safeWorkstation.role === 'streamer' ? '直播' : roleLabel.replace('顾问', '').replace('专员', '').replace('接待', 'SA').slice(0, 3);
    const selected = Boolean(safeWorkstation.selected);
    const roleTone = {
      dcc: 'bg-blue-50 text-blue-700',
      sales: 'bg-emerald-50 text-emerald-700',
      service: 'bg-cyan-50 text-cyan-700',
      streamer: 'bg-fuchsia-50 text-fuchsia-700',
      tech: 'bg-amber-50 text-amber-700',
    }[role] || 'bg-slate-50 text-slate-600';

    return (
      <div
        className="absolute z-30"
        style={markerStyle}
        data-workstation-id={safeWorkstation.id}
        data-zone-id={safeWorkstation.zoneId}
        data-role={role}
      >
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            handleOpenStaff(callbackPayload);
          }}
          className={[
            'relative flex h-full w-full items-center gap-1 rounded-md border bg-white/95 px-1 shadow-sm outline-none transition hover:-translate-y-0.5 hover:shadow-md',
            'focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1',
            selected ? 'ring-2 ring-blue-500 ring-offset-1' : '',
            occupied ? (riskBorderClass[riskTone] || riskBorderClass.safe) : 'border-dashed border-slate-300 text-slate-400',
          ].join(' ')}
          aria-expanded={open}
          aria-label={occupied ? `查看${getEmployeeName(employee)}员工故事` : `${roleLabel}空工位`}
          title={occupied ? `${getEmployeeName(employee)} · ${roleLabel}` : `${safeWorkstation.label || roleLabel}空工位`}
        >
          {occupied ? (
            <>
              <StaffAvatar type={role} member={employee} size={22} />
              <span className="min-w-0 flex-1 truncate text-left text-[10px] font-black text-slate-800">{getEmployeeName(employee)}</span>
              {storyMoments.length > 0 && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border border-white bg-blue-500"></span>}
              {(riskTone === 'warn' || riskTone === 'danger') && <span className={(riskTone === 'danger' ? 'bg-red-500' : 'bg-amber-500') + ' absolute -bottom-1 -right-1 h-2.5 w-2.5 rounded-full border border-white'}></span>}
            </>
          ) : (
            <>
              <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border border-current/20 text-[9px] font-black ${roleTone}`}>
                +
              </span>
              <span className="min-w-0 flex-1 truncate text-left text-[10px] font-black">{markerLabel}</span>
            </>
          )}
        </button>
      </div>
    );
  }

  if (!occupied) {
    return (
      <div
        className="relative min-w-[128px]"
        style={positionStyle}
        data-workstation-id={safeWorkstation.id}
        data-zone-id={safeWorkstation.zoneId}
        data-role={role}
      >
        <EmptyWorkstation workstation={{ ...safeWorkstation, role }} />
      </div>
    );
  }

  return (
    <div
      className="relative min-w-[148px]"
      style={positionStyle}
      data-workstation-id={safeWorkstation.id}
      data-zone-id={safeWorkstation.zoneId}
      data-role={role}
    >
      <button
        type="button"
        onClick={() => setOpen(current => !current)}
        className={'group flex h-full min-h-[118px] w-full flex-col rounded-lg border bg-white p-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ' + (riskBorderClass[riskTone] || riskBorderClass.safe)}
        aria-expanded={open}
        aria-label={`查看${getEmployeeName(employee)}员工故事`}
      >
        <div className="mb-2 flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <StaffAvatar type={role} member={employee} size={42} />
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-slate-900">{getEmployeeName(employee)}</p>
              <p className="truncate text-[10px] font-bold text-slate-400">{safeWorkstation.label || roleLabel}</p>
            </div>
          </div>
          <span className={'shrink-0 rounded-full border px-2 py-1 text-[10px] font-black ' + (roleToneClass[role] || 'border-slate-200 bg-slate-50 text-slate-600')}>
            {roleLabel}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          <div className="rounded-md bg-slate-50 px-1.5 py-1">
            <p className="text-[9px] text-slate-400">能力</p>
            <p className="text-xs font-black text-indigo-600">{Math.round(Number(ability) || 0)}</p>
          </div>
          <div className="rounded-md bg-slate-50 px-1.5 py-1">
            <p className="text-[9px] text-slate-400">忠诚</p>
            <p className={(loyalty <= 45 ? 'text-red-600' : 'text-emerald-600') + ' text-xs font-black'}>{loyalty}</p>
          </div>
          <div className="rounded-md bg-slate-50 px-1.5 py-1">
            <p className="text-[9px] text-slate-400">压力</p>
            <p className={(stress >= 70 ? 'text-red-600' : stress >= 55 ? 'text-amber-600' : 'text-blue-600') + ' text-xs font-black'}>{stress}</p>
          </div>
        </div>

        <div className="mt-2 flex min-h-[22px] flex-wrap items-center gap-1">
          {storyMoments.map((moment, index) => (
            <StaffStoryBadge key={moment?.id || `${moment?.type || 'story'}-${index}`} moment={moment} compact />
          ))}
          {highlights.map(label => (
            <span key={label} className="rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-black text-amber-700">
              {label}
            </span>
          ))}
          {highlights.length === 0 && storyMoments.length === 0 && (
            <span className="rounded-md border border-emerald-100 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-black text-emerald-700">
              稳定
            </span>
          )}
        </div>
      </button>

      {open && (
        <StoreEmployeePopover
          workstation={{ ...safeWorkstation, role, employee, occupied }}
          onClose={() => setOpen(false)}
          onOpenStaff={handleOpenStaff}
          onTrainMember={handleTrainMember}
          onToggleRetention={handleToggleRetention}
        />
      )}
    </div>
  );
}
