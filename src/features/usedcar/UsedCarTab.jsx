import React from 'react';

function calculateUsedCarRetailProfit(usedCars) {
  return usedCars
    .filter(car => car.status === 'retailed')
    .reduce((sum, car) => sum + ((car.soldPrice || car.retailPrice) - car.purchasePrice - (car.prepCost || 0)), 0);
}

function calculateUsedCarWholesaleLoss(usedCars) {
  return usedCars
    .filter(car => car.status === 'wholesaled' || car.status === 'forcedWholesale')
    .reduce((sum, car) => sum + (car.purchasePrice + (car.prepCost || 0) - (car.forcedPrice || Math.round(car.purchasePrice * 0.95))), 0);
}

function getUsedCarSuccessRate(usedCar, usedCarShowroom) {
  const sellPrice = usedCar.customRetailPrice || usedCar.retailPrice;
  const priceRatio = sellPrice / usedCar.purchasePrice;
  let successRate = usedCarShowroom.built && usedCar.prepped ? 0.55 : usedCarShowroom.built ? 0.30 : 0.20;

  if (priceRatio > 1.2) successRate -= Math.floor((priceRatio - 1.2) / 0.1) * 0.05;

  return Math.max(0.15, Math.min(0.65, successRate));
}

export function UsedCarTab({
  usedCars,
  usedCarShowroom,
  monthlyStats,
  formatMoney,
  onBuildShowroom,
  onUpgradeShowroom,
  onPrepUsedCar,
  onUsedCarRetail,
  onUsedCarWholesale,
  onUsedCarPriceChange,
}) {
  const stockUsedCars = usedCars.filter(car => car.status === 'stock');
  const disposedUsedCars = usedCars.filter(car => car.status !== 'stock');
  const retailProfit = calculateUsedCarRetailProfit(usedCars);
  const wholesaleLoss = calculateUsedCarWholesaleLoss(usedCars);

  return (
    <div className="animate-fade-in">
      <div className="mb-6 border-b border-slate-100 pb-4 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><span className="text-2xl">♻️</span> 二手车业务管理</h2>
          <p className="text-slate-500 text-sm mt-1">展厅建设 → 收车整备 → 定价零售，打造二手车利润中心。</p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-5 mb-6 shadow-sm">
        <h3 className="font-bold text-lg text-indigo-900 mb-3 flex items-center gap-2">🏗️ 二手车展厅</h3>
        {!usedCarShowroom.built ? (
          <div className="text-center py-4">
            <p className="text-sm text-slate-600 mb-3">未建设二手车展厅。建设后方可整备零售二手车，否则只能批售。</p>
            <button onClick={onBuildShowroom} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold transition-colors">
              建设展厅（¥150,000）
            </button>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-white p-3 rounded-lg border border-indigo-100 text-center">
                <p className="text-[10px] text-slate-400">展厅等级</p>
                <p className="text-xl font-black text-indigo-600">Lv.{usedCarShowroom.level}</p>
              </div>
              <div className="bg-white p-3 rounded-lg border border-indigo-100 text-center">
                <p className="text-[10px] text-slate-400">展厅容量</p>
                <p className="text-xl font-black text-indigo-600">{usedCarShowroom.capacity} 台</p>
              </div>
              <div className="bg-white p-3 rounded-lg border border-indigo-100 text-center">
                <p className="text-[10px] text-slate-400">在库车辆</p>
                <p className={'text-xl font-black ' + (stockUsedCars.length > usedCarShowroom.capacity ? 'text-red-600' : 'text-green-600')}>{stockUsedCars.length} 台</p>
              </div>
            </div>
            {usedCarShowroom.level < 3 && (
              <div className="text-center">
                <button onClick={onUpgradeShowroom} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-sm transition-colors">
                  升级至Lv.{usedCarShowroom.level + 1}（¥80,000，容量+3）
                </button>
              </div>
            )}
            {usedCarShowroom.level >= 3 && <p className="text-center text-xs text-slate-400">展厅已达最高等级</p>}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-center">
          <p className="text-[10px] text-slate-400">本月置换台数</p>
          <p className="text-xl font-black text-blue-600">{monthlyStats.tradeInCount || 0} 台</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-center">
          <p className="text-[10px] text-slate-400">置换补贴</p>
          <p className="text-xl font-black text-amber-600">{formatMoney(monthlyStats.tradeInSubsidy)}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-center">
          <p className="text-[10px] text-slate-400">零售利润</p>
          <p className={'text-xl font-black ' + (retailProfit >= 0 ? 'text-green-600' : 'text-red-600')}>{formatMoney(retailProfit)}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-center">
          <p className="text-[10px] text-slate-400">批售亏损</p>
          <p className="text-xl font-black text-red-600">{formatMoney(wholesaleLoss)}</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm mb-6">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">📦 二手车库存 ({stockUsedCars.length}台在库{usedCarShowroom.built ? ` / 展厅${usedCarShowroom.capacity}台` : ''})</h3>
        {stockUsedCars.length === 0 && <p className="text-sm text-slate-400 text-center py-4">暂无二手车库存。销售置换客户即可获得二手车！</p>}
        <div className="space-y-2">
          {stockUsedCars.map(usedCar => {
            const ageColor = usedCar.stockDays >= 60 ? 'text-red-600' : usedCar.stockDays >= 30 ? 'text-amber-600' : 'text-slate-700';
            const ageIcon = usedCar.stockDays >= 60 ? '🔴' : usedCar.stockDays >= 30 ? '🟠' : '';
            const ageWarning = usedCar.stockDays >= 90 ? '⚠️超90天即将强制批售！' : usedCar.stockDays >= 60 ? '⚠️库龄过高' : '';
            const sellPrice = usedCar.customRetailPrice || usedCar.retailPrice;
            const successRate = getUsedCarSuccessRate(usedCar, usedCarShowroom);

            return (
              <div key={usedCar.id} className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-bold text-sm text-slate-800">
                      {usedCar.brand}
                      <span className={'text-xs ml-1 ' + ageColor}>{ageIcon}库龄{usedCar.stockDays}天</span>
                      {ageWarning && <span className="text-xs text-red-500 ml-1">{ageWarning}</span>}
                      {!usedCar.prepped && <span className="text-xs text-orange-500 ml-1">🔧未整备</span>}
                      {usedCar.prepped && <span className="text-xs text-green-600 ml-1">✅已整备</span>}
                    </p>
                    <p className="text-xs text-slate-400">收车¥{usedCar.purchasePrice.toLocaleString()} / 批售价¥{Math.round(usedCar.purchasePrice * 0.95).toLocaleString()}</p>
                  </div>
                  <div className="flex gap-2">
                    {!usedCar.prepped && usedCarShowroom.built && (
                      <button onClick={() => onPrepUsedCar(usedCar.id)} className="text-xs font-bold px-3 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors">整备¥3千</button>
                    )}
                    {usedCarShowroom.built && (
                      <button onClick={() => onUsedCarRetail(usedCar.id)} className="text-xs font-bold px-3 py-1 rounded bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors" title={`零售成功率${Math.round(successRate * 100)}%`}>零售({Math.round(successRate * 100)}%)</button>
                    )}
                    <button onClick={() => onUsedCarWholesale(usedCar.id)} className="text-xs font-bold px-3 py-1 rounded bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors">批售</button>
                  </div>
                </div>
                {usedCarShowroom.built && usedCar.prepped && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-500">零售价:</span>
                    <input
                      type="number"
                      value={sellPrice}
                      onChange={event => onUsedCarPriceChange(usedCar.id, event.target.value)}
                      min={Math.round(usedCar.purchasePrice * 1.0)}
                      max={Math.round(usedCar.purchasePrice * 1.5)}
                      step={1000}
                      className="w-28 text-xs px-2 py-1 border border-slate-200 rounded bg-white"
                    />
                    <span className="text-xs text-slate-400">
                      (范围: ¥{Math.round(usedCar.purchasePrice * 1.0).toLocaleString()} ~ ¥{Math.round(usedCar.purchasePrice * 1.5).toLocaleString()})
                    </span>
                    <span className={'text-xs font-bold ' + (sellPrice > usedCar.purchasePrice ? 'text-green-600' : 'text-red-600')}>
                      预估利润: ¥{(sellPrice - usedCar.purchasePrice - (usedCar.prepCost || 0)).toLocaleString()}
                    </span>
                  </div>
                )}
                {!usedCarShowroom.built && (
                  <p className="text-xs text-slate-400 mt-1">💡 建设展厅后可整备、定价零售</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {disposedUsedCars.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h3 className="font-bold text-lg mb-3 flex items-center gap-2">📋 处置记录</h3>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {disposedUsedCars.map(usedCar => (
              <div key={usedCar.id} className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 p-2 rounded">
                <span>{usedCar.brand}</span>
                <span>
                  {usedCar.status === 'retailed' ? `✅ 已零售 ¥${((usedCar.soldPrice || usedCar.retailPrice) || 0).toLocaleString()}` :
                   usedCar.status === 'forcedWholesale' ? `⚠️ 强制批售 ¥${(usedCar.forcedPrice || 0).toLocaleString()}` :
                   `🚚 已批售 ¥${Math.round(usedCar.purchasePrice * 0.95).toLocaleString()}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
