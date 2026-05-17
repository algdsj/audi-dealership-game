export const MANUFACTURER_ROLE_DEFAULTS = {
  hq: {
    label: '厂家总部',
    relationship: 62,
    focus: ['品牌纪律', '返利质量', 'CSI口碑', '价格体系'],
    desc: '总部更看重品牌纪律、真实销量、CSI和返利政策质量。',
  },
  region: {
    label: '区域大区',
    relationship: 64,
    focus: ['区域份额', '采购配额', '库存消化', '市场共投'],
    desc: '大区更看重采购配合、区域销量、库存消化和本地资源协同。',
  },
};

export const MANUFACTURER_ATTITUDE_LEVELS = [
  { id: 'strained', label: '紧张', min: 0, tone: 'text-red-700 bg-red-50 border-red-200' },
  { id: 'watching', label: '观望', min: 45, tone: 'text-amber-700 bg-amber-50 border-amber-200' },
  { id: 'stable', label: '稳定', min: 60, tone: 'text-blue-700 bg-blue-50 border-blue-200' },
  { id: 'supportive', label: '支持', min: 75, tone: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
];
