export const NICKNAME_POOL = {
  dcc: ['嘉琪', '思远', '晓婷', '宇轩', '子涵', '浩然', '梦瑶', '诗涵', '雨萱', '梓萱', '一诺', '欣怡', '可馨', '语桐', '若曦'],
  sales: ['大伟', '阿强', '志远', '明辉', '文博', '凯旋', '嘉铭', '国栋', '俊杰', '天翔', '浩宇', '泽远', '鹏飞', '振宇', '海涛'],
  tech: ['老张', '刘师傅', '赵工', '孙师', '周工', '吴技', '郑师', '王工', '李师', '陈师'],
  service: ['小何', '美琳', '佳宁', '文静', '思琪', '雅雯', '晨曦', '舒涵'],
  streamer: ['小北', '阿泽', '可乐', '星野', '大川', '米粒', '阿南', '晴晴'],
};

export const STAFF_ROLE_META = {
  dcc: { label: 'DCC专员', icon: '📞', salary: 150 },
  sales: { label: '销售顾问', icon: '🤝', salary: 250 },
  service: { label: '客服专员', icon: '🎧', salary: 180 },
  streamer: { label: '主播', icon: '🎙️', salary: 220 },
  tech: { label: '售后技师', icon: '🔧', salary: 200 },
};

export const AVATAR_PALETTES = [
  { bg: ['#dbeafe', '#2563eb'], skin: '#f5c7a9', hair: '#1f2937', accent: '#60a5fa' },
  { bg: ['#dcfce7', '#16a34a'], skin: '#f0b88f', hair: '#3f2f24', accent: '#34d399' },
  { bg: ['#fef3c7', '#f59e0b'], skin: '#e9b38d', hair: '#111827', accent: '#fbbf24' },
  { bg: ['#fae8ff', '#c026d3'], skin: '#f3c1b3', hair: '#4c1d95', accent: '#e879f9' },
  { bg: ['#fee2e2', '#dc2626'], skin: '#d99a73', hair: '#2f1f18', accent: '#fb7185' },
  { bg: ['#ccfbf1', '#0f766e'], skin: '#f1c6a8', hair: '#0f172a', accent: '#2dd4bf' },
];

export const CAREER_LEVELS = [
  { level: 1, title: '新人', minXp: 0, skillBonus: 0 },
  { level: 2, title: '熟手', minXp: 80, skillBonus: 2 },
  { level: 3, title: '骨干', minXp: 220, skillBonus: 5 },
  { level: 4, title: '王牌', minXp: 480, skillBonus: 8 },
  { level: 5, title: '明星', minXp: 850, skillBonus: 12 },
];

export { STAFF_TRAITS } from './staffTraits.js';
