export const MODULE_GROUPS = [
  {
    id: 'dashboard',
    label: '首页',
    desc: '经营看板',
    tabs: [
      { id: 'dashboard', label: '经营看板' },
      { id: 'store', label: '门店总览' },
      { id: 'events', label: '事件中心' },
    ],
  },
  {
    id: 'sales',
    label: '销售运营',
    desc: '库存、订货、营销',
    tabs: [
      { id: 'showroom', label: '展厅定价' },
      { id: 'order', label: '厂家订货' },
      { id: 'marketing', label: '漏斗营销' },
      { id: 'sprint', label: '月底冲刺' },
      { id: 'opportunities', label: '机会池' },
      { id: 'customer', label: '客户谈判' },
      { id: 'crm', label: '客户中心' },
    ],
  },
  {
    id: 'profit',
    label: '利润中心',
    desc: '财务、返利、汇票',
    tabs: [
      { id: 'finance', label: '总经理办公室' },
      { id: 'reports', label: '财务' },
      { id: 'rebate', label: '返利' },
      { id: 'draft', label: '汇票' },
    ],
  },
  {
    id: 'team',
    label: '组织人事',
    desc: '人事、设施',
    tabs: [
      { id: 'staff', label: '人事招聘' },
      { id: 'facility', label: '设施升级' },
    ],
  },
  {
    id: 'diagnosis',
    label: '市场诊断',
    desc: '本地市场、CSI',
    tabs: [
      { id: 'market', label: '本地市场' },
      { id: 'csi', label: 'CSI满意度' },
    ],
  },
  {
    id: 'derivative',
    label: '衍生中心',
    desc: '二手车、售后、配置',
    tabs: [
      { id: 'usedcar', label: '二手车' },
      { id: 'aftersales', label: '售后服务' },
      { id: 'derivConfig', label: '金融衍生' },
    ],
  },
];
