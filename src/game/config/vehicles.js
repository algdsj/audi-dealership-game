export const CAR_MODELS = [
  { id: 'A5_L', series: 'A5', trim: '低配', segment: '年轻', name: 'Audi A5 低配', baseCost: 330000, msrp: 380000, rebate: 30000, color: 'bg-red-100' },
  { id: 'A5_M', series: 'A5', trim: '中配', segment: '年轻', name: 'Audi A5 中配', baseCost: 370000, msrp: 420000, rebate: 35000, color: 'bg-red-200' },
  { id: 'A5_H', series: 'A5', trim: '高配', segment: '年轻', name: 'Audi A5 高配', baseCost: 420000, msrp: 480000, rebate: 40000, color: 'bg-red-300' },
  { id: 'A6_L', series: 'A6', trim: '低配', segment: '商务', name: 'Audi A6L 低配', baseCost: 350000, msrp: 427000, rebate: 45000, color: 'bg-slate-200' },
  { id: 'A6_M', series: 'A6', trim: '中配', segment: '商务', name: 'Audi A6L 中配', baseCost: 400000, msrp: 480000, rebate: 55000, color: 'bg-slate-300' },
  { id: 'A6_H', series: 'A6', trim: '高配', segment: '商务', name: 'Audi A6L 高配', baseCost: 550000, msrp: 650000, rebate: 70000, color: 'bg-slate-400' },
  { id: 'Q5_L', series: 'Q5', trim: '低配', segment: '家庭', name: 'Audi Q5L 低配', baseCost: 330000, msrp: 400000, rebate: 40000, color: 'bg-blue-100' },
  { id: 'Q5_M', series: 'Q5', trim: '中配', segment: '家庭', name: 'Audi Q5L 中配', baseCost: 370000, msrp: 450000, rebate: 50000, color: 'bg-blue-200' },
  { id: 'Q5_H', series: 'Q5', trim: '高配', segment: '家庭', name: 'Audi Q5L 高配', baseCost: 410000, msrp: 500000, rebate: 60000, color: 'bg-blue-300' },
];

export const INITIAL_MARKET_PRICES = CAR_MODELS.reduce((prices, car) => {
  prices[car.id] = car.baseCost - (car.rebate * 0.5);
  return prices;
}, {});
