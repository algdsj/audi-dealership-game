export const STAFF_TRAITS = {
  dcc: [
    { id: 'diligent', label: '勤奋型', tone: 'positive', desc: '线索处理量更高。', capacityBonus: 25, skillGrowth: 1 },
    { id: 'talker', label: '话术型', tone: 'positive', desc: '邀约到店能力更强。', skillBonus: 8, salesBonus: 0.04 },
    { id: 'chill', label: '佛系型', tone: 'steady', desc: '不容易流失，但邀约效率低。', skillBonus: -4, turnoverMult: 0.65, stressDelta: -1 },
  ],
  sales: [
    { id: 'price_killer', label: '价格杀手', tone: 'negative', desc: '低价成交能力强，但更容易拉低毛利。', skillBonus: 8, priceSensitivity: 0.08, complaintMult: 1.08, turnoverRisk: 0.08 },
    { id: 'relationship', label: '客户关系型', tone: 'positive', desc: '口碑与客诉控制更稳。', skillBonus: 4, complaintMult: 0.78, loyaltyDelta: 1 },
    { id: 'finance', label: '金融高手', tone: 'positive', desc: '金融按揭佣金更高。', financeBonus: 0.22, salesBonus: 0.03 },
    { id: 'business_specialist', label: '商务高手', tone: 'positive', desc: '更擅长A6L商务客户预算、形象和交付确定性沟通。', seriesSalesBonus: { A6L: 0.06 }, skillBonus: 3 },
    { id: 'family_tradein', label: '置换顾问', tone: 'positive', desc: '更擅长Q5L家庭换购和旧车置换方案。', seriesSalesBonus: { Q5L: 0.055 }, skillBonus: 2 },
    { id: 'ev_product', label: '新能源产品专家', tone: 'positive', desc: '更擅长Q6L e-tron智能座舱、补能和竞品对比。', seriesSalesBonus: { 'Q6L e-tron': 0.065 }, skillBonus: 2 },
    { id: 'sporty_young', label: '年轻个性顾问', tone: 'positive', desc: '更擅长A3L预算首购和A5L运动形象客户。', seriesSalesBonus: { A3L: 0.045, A5L: 0.055 }, skillBonus: 2 },
    { id: 'rookie', label: '新人王', tone: 'negative', desc: '成长快但稳定性差。', trainBonus: 4, turnoverMult: 1.12, skillGrowth: 2, turnoverRisk: 0.12 },
  ],
  tech: [
    { id: 'efficient', label: '效率型', tone: 'positive', desc: '每日售后产能更高。', capacityBonus: 1, serviceBonus: 0.04 },
    { id: 'quality', label: '质量型', tone: 'positive', desc: '减少售后返修和投诉。', complaintMult: 0.72, serviceBonus: 0.03 },
    { id: 'rework_risk', label: '返修风险型', tone: 'negative', desc: '产能还行，但更容易引发返修客诉。', capacityBonus: 1, complaintMult: 1.45, skillBonus: -3, turnoverRisk: 0.1 },
  ],
  service: [
    { id: 'patient', label: '耐心型', tone: 'positive', desc: '更擅长安抚客户，CSI恢复更快。', csiBonus: 0.18, complaintMult: 0.88, loyaltyDelta: 1 },
    { id: 'callback', label: '回访型', tone: 'positive', desc: '能带动更多客户回厂保养。', returnVisitBonus: 0.12, serviceBonus: 0.04 },
    { id: 'process', label: '流程型', tone: 'steady', desc: '投诉闭环稳定，但成长稍慢。', complaintMult: 0.82, trainBonus: -1, stressDelta: -1 },
  ],
  streamer: [
    { id: 'traffic', label: '流量型', tone: 'positive', desc: '直播线索产出更高。', leadBonus: 0.16, salesBonus: 0.03 },
    { id: 'product', label: '产品型', tone: 'positive', desc: '讲车专业，直播线索到店率更高。', livestreamWalkinBonus: 0.08, skillGrowth: 1 },
    { id: 'volatile', label: '情绪型', tone: 'negative', desc: '爆发强但稳定性差。', leadBonus: 0.24, turnoverMult: 1.25, stressDelta: 1, turnoverRisk: 0.18 },
  ],
};
