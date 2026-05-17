import React from 'react';
import { Icons } from '../../shared/ui/icons.jsx';
import { Term } from '../../shared/ui/tooltip.jsx';

export function ShowroomTab({
  inventory,
  facility,
  carModels,
  marketPrices,
  manufacturerPolicy,
  testDriveCars,
  usedCars,
  usedCarShowroom,
  formatMoney,
  getDynamicRebate,
  getDynamicMsrp,
  onAutoShowroom,
  onApplySubsidy,
  onMoveCar,
  onWholesale,
  onRetireTestDrive,
  onSetTestDrive,
  onUpdatePrice,
  onPriceBlur,
}) {
  const showroomCars = inventory.filter(car => car.location === 'showroom');
  const showroomUsed = showroomCars.length;
  const warehouseUsed = inventory.filter(car => car.location === 'warehouse').length;
  const usedCarStock = usedCars.filter(car => car.status === 'stock');

  return (
    <div>
      <div className="flex justify-between items-end mb-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><Icons.Store /> 展厅布局与定价</h2>
          <p className="text-slate-500 text-sm mt-1">展车提升<Term term="销售转化率">转化率</Term>+12%，展厅车型多样性增加自然客流。<Term term="仓储区">仓储</Term>车辆每日产生¥50/台成本。</p>
        </div>
        <div className="text-right space-y-1">
          <p className="text-sm font-bold text-slate-700">
            <Term term="展厅展位">展厅展位</Term>: <span className="text-blue-600">{showroomUsed}</span> / {facility.showroomSpots}
            <span className="mx-2 text-slate-300">|</span>
            <Term term="仓储区">仓储区</Term>: <span className="text-amber-600">{warehouseUsed}</span> / {facility.warehouseCapacity}
          </p>
          <button onClick={onAutoShowroom} className="text-xs px-3 py-1.5 rounded bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 font-bold transition-colors">
            🏪 一键布展
          </button>
        </div>
      </div>

      <div className="mb-6 bg-gradient-to-r from-slate-50 to-blue-50/30 border border-slate-200 rounded-xl p-4">
        <h3 className="text-sm font-bold text-slate-600 mb-3 uppercase tracking-wider">🏪 展厅展位实况</h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {Array.from({ length: facility.showroomSpots }).map((_, index) => {
            const car = showroomCars[index];

            if (car) {
              const modelDef = carModels.find(model => model.id === car.modelId);

              return (
                <div key={index} className={'w-20 h-16 rounded-lg border-2 border-blue-300 ' + (modelDef?.color || 'bg-slate-100') + ' flex flex-col items-center justify-center shadow-sm'}>
                  <span className="text-[10px] font-black text-slate-700 leading-none">{modelDef?.series || '?'}</span>
                  <span className="text-[9px] text-slate-500 leading-none">{modelDef?.trim || ''}</span>
                </div>
              );
            }

            return (
              <div key={index} className="w-20 h-16 rounded-lg border-2 border-dashed border-slate-200 bg-white flex items-center justify-center">
                <span className="text-slate-300 text-xs">空位</span>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-slate-400">每款展车为对应车型带来 +12% 转化加成；展示车型种类越多，自然进店客流越多 (每款+0.8人/天)</p>
      </div>

      <div className="space-y-6">
        {['A5', 'A6', 'Q5'].map(series => {
          const seriesModels = carModels.filter(model => model.series === series);
          const hasAnyInventory = seriesModels.some(model => inventory.some(car => car.modelId === model.id));

          if (!hasAnyInventory) return null;

          return (
            <div key={series} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-slate-100 px-5 py-3 border-b border-slate-200 flex items-center gap-2">
                <span className="font-black text-xl text-slate-800">{series} 车系</span>
                <span className="text-xs px-2 py-1 bg-slate-200 rounded-full text-slate-600">目标客群: {seriesModels[0].segment}</span>
              </div>
              <div className="divide-y divide-slate-100">
                {seriesModels.map(model => {
                  const modelInventory = inventory.filter(car => car.modelId === model.id);
                  const count = modelInventory.length;

                  if (count === 0) return null;

                  const showroomCount = modelInventory.filter(car => car.location === 'showroom').length;
                  const warehouseCount = modelInventory.filter(car => car.location === 'warehouse').length;
                  const sampleCar = modelInventory[0];
                  const currentMarket = marketPrices[model.id];
                  const singleProfit = sampleCar.price - model.baseCost + getDynamicRebate(model.id);
                  const isPriceInverted = sampleCar.price < model.baseCost;
                  const unsubsidizedCount = modelInventory.filter(car => !car.subsidized && (car.stockDays || 0) >= 30).length;
                  const maxStockDays = Math.max(...modelInventory.map(car => car.stockDays || 0));
                  const colorCounts = {};

                  modelInventory.forEach(car => {
                    colorCounts[car.color || '黑'] = (colorCounts[car.color || '黑'] || 0) + 1;
                  });

                  const colorStr = Object.entries(colorCounts).map(([color, total]) => `${color}:${total}`).join(' / ');

                  return (
                    <div key={model.id} className="p-5 flex flex-col md:flex-row gap-6 items-center hover:bg-slate-50 transition-colors">
                      <div className={'w-14 h-14 rounded-full flex items-center justify-center font-bold text-slate-700 shadow-inner  ' + model.color}>{model.trim}</div>
                      <div className="flex-1 w-full">
                        <h3 className="font-bold text-lg">{model.name}
                          <span className="text-sm font-normal text-slate-500 ml-2">
                            库存 {count} 台
                            <span className="text-xs ml-1">[
                              <span className="text-blue-600">展厅:{showroomCount}</span>
                              <span className="mx-1">|</span>
                              <span className="text-amber-600">仓储:{warehouseCount}</span>
                            ]</span>
                          </span>
                        </h3>
                        <div className="grid grid-cols-2 text-sm mt-2 gap-y-1 text-slate-600">
                          <p>提车成本: ¥{model.baseCost.toLocaleString()}</p>
                          <p>厂家返利: <span className="text-green-600 font-medium">+¥{getDynamicRebate(model.id).toLocaleString()}</span>{manufacturerPolicy.rebateMultiplier !== 1.0 && <span className="text-[10px] text-blue-500 ml-1">×{manufacturerPolicy.rebateMultiplier.toFixed(2)}</span>}</p>
                          <p>指导价: <span className={manufacturerPolicy.msrpTrend !== 0 ? 'text-orange-600 font-bold' : ''}>¥{getDynamicMsrp(model.id).toLocaleString()}</span>{manufacturerPolicy.msrpTrend !== 0 && <span className="text-[10px] text-orange-400 ml-1">({manufacturerPolicy.msrpTrend > 0 ? '+' : ''}{manufacturerPolicy.msrpTrend.toFixed(1)}%)</span>}</p>
                          <p>同城均价: <span className="font-bold text-orange-500">¥{Math.round(currentMarket).toLocaleString()}</span></p>
                          <p className="col-span-2 text-xs text-slate-400">二网批售价: ¥{Math.round(currentMarket * 0.9).toLocaleString()}（同城均价×90%）</p>
                          {colorStr && <p className="col-span-2 text-xs text-slate-400">颜色结构: {colorStr}</p>}
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <p className="text-xs text-slate-400 mr-1">最长库龄: {
                            maxStockDays >= 110 ? <span className="text-red-600 font-bold animate-pulse">🔴 {maxStockDays}天 (距强制批售仅{120-maxStockDays}天！)</span> :
                            maxStockDays >= 90 ? <span className="text-red-600 font-bold">🔴 {maxStockDays}天 (距强制批售{120-maxStockDays}天)</span> :
                            maxStockDays >= 60 ? <span className="text-red-600 font-bold">🔶 {maxStockDays}天</span> :
                            maxStockDays >= 30 ? <span className="text-amber-600">🔶 {maxStockDays}天</span> :
                            `${maxStockDays} 天 (${30 - maxStockDays}天后可申请)`
                          }</p>
                          <button onClick={() => onApplySubsidy(model.id)} disabled={unsubsidizedCount === 0} className="text-xs font-bold px-3 py-1.5 rounded bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                            🎁 补贴 ({unsubsidizedCount}台)
                          </button>
                          <button onClick={() => onMoveCar(model.id, 'showroom')} disabled={warehouseCount === 0 || showroomUsed >= facility.showroomSpots} className="text-xs font-bold px-3 py-1.5 rounded bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                            🏪 上展
                          </button>
                          <button onClick={() => onMoveCar(model.id, 'warehouse')} disabled={showroomCount === 0} className="text-xs font-bold px-3 py-1.5 rounded bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                            📦 入库
                          </button>
                          <button onClick={() => onWholesale(model.id)} disabled={count === 0} className="text-xs font-bold px-3 py-1.5 rounded bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                            🚚 二网批售
                          </button>
                          {testDriveCars.find(car => car.modelId === model.id) ? (
                            <button onClick={() => onRetireTestDrive(model.id)} className="text-xs font-bold px-3 py-1.5 rounded bg-green-50 text-green-600 border border-green-200 hover:bg-green-100 transition-colors">
                              🚗 试驾车 ON
                            </button>
                          ) : (
                            <button onClick={() => onSetTestDrive(model.id)} disabled={warehouseCount === 0 && showroomCount === 0} className="text-xs font-bold px-3 py-1.5 rounded bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                              🚗 设试驾
                            </button>
                          )}
                          {showroomCount > 0 && <span className="text-xs text-green-600 font-bold">✅ +12%转化</span>}
                        </div>
                      </div>
                      <div className="w-full md:w-auto bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">统一标价调整</label>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">¥</span>
                          <input type="number" value={sampleCar.price} onChange={event => onUpdatePrice(model.id, event.target.value)} onBlur={() => onPriceBlur(model.id)} className="w-32 border border-slate-300 rounded-md p-2 text-lg font-bold text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div className="mt-3 text-sm">
                          {isPriceInverted && <span className="block text-xs text-red-500 mb-1">⚠️ 前端价格倒挂 (售价低成本)</span>}
                          <span className="text-slate-500 text-xs">卖车即得: {formatMoney(sampleCar.price - model.baseCost)}</span><br/>
                          理论单车新车利润: <span className={'ml-1 font-bold  ' + (singleProfit >= 0 ? 'text-green-600' : 'text-red-600')}>{singleProfit >= 0 ? '+' : ''}{formatMoney(singleProfit)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        {inventory.length === 0 && <div className="text-center py-16 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">展厅空无一车，请前往"厂家订货"进货。</div>}

        <div className="mt-6 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-5">
          <h3 className="font-bold text-lg text-amber-900 mb-3 flex items-center gap-2">♻️ 二手车库存简览</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
            <div className="bg-white p-3 rounded-lg border border-amber-100 text-center">
              <p className="text-[10px] text-slate-400">库存数量</p>
              <p className="text-xl font-black text-amber-600">{usedCarStock.length} 台</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-amber-100 text-center">
              <p className="text-[10px] text-slate-400">展厅状态</p>
              <p className={'text-xl font-black ' + (usedCarShowroom.built ? 'text-green-600' : 'text-red-600')}>{usedCarShowroom.built ? `Lv.${usedCarShowroom.level}` : '未建设'}</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-amber-100 text-center">
              <p className="text-[10px] text-slate-400">库存总值</p>
              <p className="text-xl font-black text-green-600">
                {formatMoney(usedCarStock.reduce((sum, car) => sum + car.purchasePrice, 0))}
              </p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-amber-100 text-center">
              <p className="text-[10px] text-slate-400">未整备</p>
              <p className="text-xl font-black text-orange-600">{usedCarStock.filter(car => !car.prepped).length} 台</p>
            </div>
          </div>
          <p className="text-xs text-amber-700">💡 详细管理请前往"二手车"Tab 操作整备、定价、零售/批售。</p>
        </div>
      </div>
    </div>
  );
}
