import { AVATAR_PALETTES } from '../../game/config/staff.js';
import { getAvatarSeed } from '../../game/engine/staffing.js';

export const StaffAvatar = ({ type, member, size = 44 }) => {
  const seed = getAvatarSeed(type, member);
  const palette = AVATAR_PALETTES[seed % AVATAR_PALETTES.length];
  const hairStyle = seed % 4;
  const hasGlasses = seed % 5 === 0;
  const hasHeadset = type === 'dcc' || type === 'service' || type === 'streamer';
  const hasCap = type === 'tech';
  const gradientId = `avatar_grad_${type}_${member?.id || seed}`.replace(/[^a-zA-Z0-9_]/g, '_');
  const hair =
    hairStyle === 0 ? <path d="M17 26c2-10 26-10 30 0 0-12-7-18-15-18S17 14 17 26z" fill={palette.hair} /> :
    hairStyle === 1 ? <path d="M16 27c3-12 12-19 28-15 4 4 5 9 4 15-7-6-20-7-32 0z" fill={palette.hair} /> :
    hairStyle === 2 ? <path d="M18 25c1-9 8-15 16-15 10 0 15 7 15 17-9-5-19-4-31-2z" fill={palette.hair} /> :
    <path d="M17 28c0-13 7-19 16-19 8 0 15 7 15 18-6-8-23-7-31 1z" fill={palette.hair} />;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className="shrink-0 rounded-full shadow-sm border border-white bg-slate-100" aria-label={`${member?.nickname || '员工'}虚拟头像`}>
      <defs>
        <linearGradient id={gradientId} x1="10" y1="8" x2="54" y2="58" gradientUnits="userSpaceOnUse">
          <stop stopColor={palette.bg[0]} />
          <stop offset="1" stopColor={palette.bg[1]} />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="32" fill={`url(#${gradientId})`} />
      <path d="M13 58c3-12 13-18 19-18s16 6 19 18" fill={palette.accent} opacity="0.9" />
      <circle cx="32" cy="29" r="15" fill={palette.skin} />
      {hair}
      {hasCap && <path d="M18 19c6-7 22-8 30 0l-3 5H21l-3-5z" fill={palette.accent} />}
      {hasGlasses ? (
        <>
          <circle cx="26" cy="30" r="4" fill="none" stroke="#0f172a" strokeWidth="1.8" />
          <circle cx="38" cy="30" r="4" fill="none" stroke="#0f172a" strokeWidth="1.8" />
          <path d="M30 30h4" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="26" cy="30" r="1.7" fill="#0f172a" />
          <circle cx="38" cy="30" r="1.7" fill="#0f172a" />
        </>
      )}
      <path d="M27 38c3 3 7 3 10 0" stroke="#7f1d1d" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      {hasHeadset && (
        <>
          <path d="M18 31c0-10 6-17 14-17s14 7 14 17" stroke="#0f172a" strokeWidth="2" fill="none" strokeLinecap="round" />
          <rect x="15" y="29" width="5" height="9" rx="2" fill="#0f172a" />
          <rect x="44" y="29" width="5" height="9" rx="2" fill="#0f172a" />
          <path d="M45 38c-2 6-7 8-13 8" stroke="#0f172a" strokeWidth="2" fill="none" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
};
