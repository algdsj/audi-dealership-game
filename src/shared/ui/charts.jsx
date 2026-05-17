export const MiniTrendChart = ({ values = [], color = '#2563eb', formatValue = value => value }) => {
  if (values.length === 0) return <div className="h-16 rounded-lg bg-slate-50"></div>;
  const minValue = Math.min(...values, 0);
  const maxValue = Math.max(...values, 1);
  const range = Math.max(1, maxValue - minValue);
  const points = values.map((value, index) => {
    const x = values.length === 1 ? 50 : (index / (values.length - 1)) * 100;
    const y = 58 - ((value - minValue) / range) * 48;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  return (
    <div>
      <svg viewBox="0 0 100 64" className="h-16 w-full overflow-visible">
        <line x1="0" y1="58" x2="100" y2="58" stroke="#e2e8f0" strokeWidth="1" />
        <polyline points={points} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {values.map((value, index) => {
          const x = values.length === 1 ? 50 : (index / (values.length - 1)) * 100;
          const y = 58 - ((value - minValue) / range) * 48;
          return <circle key={index} cx={x} cy={y} r="2.6" fill="white" stroke={color} strokeWidth="2" />;
        })}
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-slate-400">
        <span>{formatValue(values[0])}</span>
        <span>{formatValue(values[values.length - 1])}</span>
      </div>
    </div>
  );
};

export const MarketSharePie = ({ items = [] }) => {
  const segments = items.reduce((acc, item) => {
    const value = Math.max(0, Number(item.value) || 0);
    return {
      total: acc.total + value,
      items: [...acc.items, { ...item, value, offset: acc.total }],
    };
  }, { total: 0, items: [] }).items;
  return (
    <svg viewBox="0 0 120 120" className="h-48 w-48">
      <circle cx="60" cy="60" r="38" fill="none" stroke="#e2e8f0" strokeWidth="18" />
      {segments.map(item => (
        <circle
          key={item.label}
          cx="60"
          cy="60"
          r="38"
          fill="none"
          stroke={item.color}
          strokeWidth="18"
          strokeLinecap="butt"
          pathLength="100"
          strokeDasharray={`${item.value} ${Math.max(0, 100 - item.value)}`}
          strokeDashoffset={-item.offset}
          transform="rotate(-90 60 60)"
        />
      ))}
      <circle cx="60" cy="60" r="27" fill="white" />
      <text x="60" y="56" textAnchor="middle" className="fill-slate-900 text-[14px] font-black">市场</text>
      <text x="60" y="73" textAnchor="middle" className="fill-slate-500 text-[9px] font-bold">份额</text>
    </svg>
  );
};
