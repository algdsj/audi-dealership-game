import { STAFF_STORY_TYPES } from '../../game/config/staffStories.js';

const toneClass = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
  danger: 'border-red-200 bg-red-50 text-red-700',
  info: 'border-blue-200 bg-blue-50 text-blue-700',
};

export function StaffStoryBadge({ moment, type, compact = false }) {
  const storyType = moment?.type || type;
  const meta = STAFF_STORY_TYPES[storyType] || { icon: '•', label: moment?.storyType || '员工故事', tone: 'info' };
  const className = toneClass[meta.tone] || toneClass.info;

  return (
    <span
      title={moment?.summary || meta.label}
      className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-black ${className}`}
    >
      <span aria-hidden="true">{meta.icon}</span>
      {!compact && <span>{meta.label}</span>}
    </span>
  );
}
