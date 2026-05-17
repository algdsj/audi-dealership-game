import { useState } from 'react';
import { TERM_HELP } from '../../game/config/glossary.js';

const sanitizeTooltipChildren = (value, fallback) => {
  if (typeof value === 'function') return fallback;
  if (Array.isArray(value)) return value.map(item => sanitizeTooltipChildren(item, fallback));
  return value;
};

export const Tooltip = ({ text, children }) => {
  const [open, setOpen] = useState(false);
  const safeChildren = sanitizeTooltipChildren(children, text);
  return (
    <span
      className="relative inline-flex items-center gap-1 group align-middle"
      onClick={() => setOpen(prev => !prev)}
      onMouseLeave={() => setOpen(false)}
    >
      <span className="underline decoration-dotted decoration-slate-400 underline-offset-2 cursor-help">{safeChildren}</span>
      <span aria-hidden="true" className={(open ? 'opacity-100 visible' : 'opacity-0 invisible') + ' pointer-events-none group-hover:opacity-100 group-hover:visible absolute left-1/2 top-full z-50 mt-2 w-64 -translate-x-1/2 rounded-lg border border-slate-200 bg-white p-3 text-xs font-medium leading-relaxed text-slate-600 shadow-xl transition-all'}>
        {text}
      </span>
    </span>
  );
};

export const Term = ({ term, children }) => (
  <Tooltip text={TERM_HELP[term] || term}>{sanitizeTooltipChildren(children, term) || term}</Tooltip>
);
