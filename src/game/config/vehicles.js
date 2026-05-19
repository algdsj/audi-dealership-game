export const CAR_MODELS = [
  { id: 'A3_L', series: 'A3L', trim: '35 TFSI 进取致雅型', segment: '年轻', name: 'Audi A3L 35 TFSI 进取致雅型', baseCost: 132000, msrp: 159900, rebate: 14000, color: 'bg-rose-100' },
  { id: 'A3_M', series: 'A3L', trim: '35 TFSI 时尚运动型', segment: '年轻', name: 'Audi A3L 35 TFSI 时尚运动型', baseCost: 142000, msrp: 169900, rebate: 16000, color: 'bg-rose-200' },
  { id: 'A3_H', series: 'A3L', trim: '35 TFSI 豪华运动型', segment: '年轻', name: 'Audi A3L 35 TFSI 豪华运动型', baseCost: 154000, msrp: 184900, rebate: 18000, color: 'bg-rose-300' },
  { id: 'A5_L', series: 'A5L', trim: '运动版', segment: '年轻', name: 'Audi A5L 运动版', baseCost: 330000, msrp: 380000, rebate: 30000, color: 'bg-red-100' },
  { id: 'A5_M', series: 'A5L', trim: '运动版 Plus', segment: '年轻', name: 'Audi A5L 运动版 Plus', baseCost: 370000, msrp: 420000, rebate: 35000, color: 'bg-red-200' },
  { id: 'A5_H', series: 'A5L', trim: '运动版 quattro', segment: '年轻', name: 'Audi A5L 运动版 quattro', baseCost: 420000, msrp: 480000, rebate: 40000, color: 'bg-red-300' },
  { id: 'A6_L', series: 'A6L', trim: '40 TFSI 豪华动感型', segment: '商务', name: 'Audi A6L 40 TFSI 豪华动感型', baseCost: 350000, msrp: 427000, rebate: 45000, color: 'bg-slate-200' },
  { id: 'A6_M', series: 'A6L', trim: '45 TFSI 尊享致雅型', segment: '商务', name: 'Audi A6L 45 TFSI 尊享致雅型', baseCost: 400000, msrp: 480000, rebate: 55000, color: 'bg-slate-300' },
  { id: 'A6_H', series: 'A6L', trim: '45 TFSI quattro 尊享动感型', segment: '商务', name: 'Audi A6L 45 TFSI quattro 尊享动感型', baseCost: 550000, msrp: 650000, rebate: 70000, color: 'bg-slate-400' },
  { id: 'Q5_L', series: 'Q5L', trim: '40 TFSI 时尚动感型', segment: '家庭', name: 'Audi Q5L 40 TFSI 时尚动感型', baseCost: 330000, msrp: 400000, rebate: 40000, color: 'bg-blue-100' },
  { id: 'Q5_M', series: 'Q5L', trim: '40 TFSI 豪华动感型', segment: '家庭', name: 'Audi Q5L 40 TFSI 豪华动感型', baseCost: 370000, msrp: 450000, rebate: 50000, color: 'bg-blue-200' },
  { id: 'Q5_H', series: 'Q5L', trim: '45 TFSI 臻选动感型', segment: '家庭', name: 'Audi Q5L 45 TFSI 臻选动感型', baseCost: 410000, msrp: 500000, rebate: 60000, color: 'bg-blue-300' },
  { id: 'Q6_ETRON_L', series: 'Q6L e-tron', trim: '长续航版', segment: '新能源', name: 'Audi Q6L e-tron 长续航版', baseCost: 225000, msrp: 259800, rebate: 16000, color: 'bg-cyan-100' },
  { id: 'Q6_ETRON_M', series: 'Q6L e-tron', trim: '超长续航乾崑智驾版', segment: '新能源', name: 'Audi Q6L e-tron 超长续航乾崑智驾版', baseCost: 238000, msrp: 279800, rebate: 18000, color: 'bg-cyan-200' },
  { id: 'Q6_ETRON_H', series: 'Q6L e-tron', trim: 'quattro 乾崑智驾版', segment: '新能源', name: 'Audi Q6L e-tron quattro 乾崑智驾版', baseCost: 258000, msrp: 309800, rebate: 22000, color: 'bg-cyan-300' },
];

export const INITIAL_MARKET_PRICES = CAR_MODELS.reduce((prices, car) => {
  prices[car.id] = car.baseCost - (car.rebate * 0.5);
  return prices;
}, {});
