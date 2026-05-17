const zoneToneClass = {
  good: 'border-emerald-500/55 bg-emerald-50/45 text-emerald-950',
  warn: 'border-amber-500/60 bg-amber-50/55 text-amber-950',
  danger: 'border-red-500/60 bg-red-50/55 text-red-950',
  neutral: 'border-sky-500/45 bg-sky-50/45 text-slate-800',
};

const zoneTypeClass = {
  showroom: 'border-blue-500/65 bg-blue-50/55',
  streamer: 'border-fuchsia-500/60 bg-fuchsia-50/50',
  negotiation: 'border-cyan-500/60 bg-cyan-50/50',
  finance: 'border-indigo-500/60 bg-indigo-50/50',
  delivery: 'border-violet-500/60 bg-violet-50/50',
  office: 'border-slate-500/55 bg-slate-50/65',
  usedCar: 'border-orange-500/60 bg-orange-50/50',
  warehouse: 'border-stone-500/55 bg-stone-50/65',
  serviceReception: 'border-teal-500/60 bg-teal-50/50',
  workshop: 'border-rose-500/60 bg-rose-50/50',
  parts: 'border-lime-600/60 bg-lime-50/50',
  corridor: 'border-dashed border-slate-300/80 bg-white/35',
};

const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, value));

const toPercent = (value, fallback) => {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return fallback;
  return clamp(numberValue);
};

function getZoneRect(zone = {}) {
  const rect = zone.rect || zone.bounds || zone.position || zone;

  return {
    x: toPercent(rect.x ?? rect.left, 0),
    y: toPercent(rect.y ?? rect.top, 0),
    w: toPercent(rect.w ?? rect.width, 12),
    h: toPercent(rect.h ?? rect.height, 10),
  };
}

function getZoneTone(zone = {}) {
  const statusTone = zone.status?.tone || zone.health?.tone;
  return zone.tone || statusTone || 'neutral';
}

export function StoreBlueprintZone({ zone, onClick, children }) {
  const rect = getZoneRect(zone);
  const tone = getZoneTone(zone);
  const typeClass = zoneTypeClass[zone.type] || zoneTypeClass[zone.kind] || '';
  const toneClass = typeClass || zoneToneClass[tone] || zoneToneClass.neutral;
  const isInteractive = typeof onClick === 'function';
  const Element = isInteractive ? 'button' : 'div';
  const title = zone.label || zone.name || zone.title || zone.id || '未命名区域';
  const subtitle = zone.subtitle || zone.status?.label || zone.meta || zone.description;
  const score = Number.isFinite(Number(zone.score)) ? Math.round(Number(zone.score)) : null;

  return (
    <Element
      type={isInteractive ? 'button' : undefined}
      title={title}
      onClick={isInteractive ? () => onClick(zone) : undefined}
      className={[
        'absolute z-10 overflow-hidden rounded-[3px] border p-2 text-left shadow-[inset_0_0_0_1px_rgba(255,255,255,0.72)] outline-none transition',
        'focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-sky-50',
        isInteractive ? 'cursor-pointer hover:bg-white/65 hover:shadow-sm' : '',
        toneClass,
      ].filter(Boolean).join(' ')}
      style={{
        left: `${rect.x}%`,
        top: `${rect.y}%`,
        width: `${rect.w}%`,
        height: `${rect.h}%`,
      }}
    >
      <div className="flex h-full min-w-0 flex-col justify-between gap-1">
        <div className="pointer-events-none min-w-0 pr-7">
          <div className="flex items-start justify-between gap-1">
            <p className="min-w-0 truncate text-[11px] font-black leading-tight">{title}</p>
            {score !== null && (
              <span className="absolute right-2 top-2 shrink-0 rounded-[3px] border border-current/20 bg-white/75 px-1.5 text-[9px] font-black leading-4">
                {score}
              </span>
            )}
          </div>
          {subtitle && <p className="mt-0.5 truncate text-[9px] font-bold leading-tight opacity-70">{subtitle}</p>}
        </div>
        {children}
      </div>
    </Element>
  );
}
