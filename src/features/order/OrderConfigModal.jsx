import { Term } from '../../shared/ui/tooltip.jsx';

export function OrderConfigModal({
  orderForm,
  facility,
  inventory,
  pendingOrders,
  drafts,
  finance,
  formatMoney,
  getDraftFeeRate,
  getAvailableDraftCredit,
  onUpdateOrderForm,
  onCancel,
  onConfirm,
}) {
  if (!orderForm.isOpen || !orderForm.model) return null;

  const totalSlots = facility.showroomSpots + facility.warehouseCapacity;
  const currentTotal = inventory.length + pendingOrders.reduce((sum, o) => sum + o.quantity, 0);
  const available = Math.max(1, totalSlots - currentTotal);
  const paymentMethod = orderForm.paymentMethod || (orderForm.useLoan ? 'draft3' : 'cash');
  const totalCost = orderForm.model.baseCost * orderForm.quantity;
  const draft3Fee = Math.round(totalCost * getDraftFeeRate(3));
  const draft6Fee = Math.round(totalCost * getDraftFeeRate(6));
  const draftDeposit = Math.round(totalCost * 0.2);
  const draft3Cash = draftDeposit + draft3Fee;
  const draft6Cash = draftDeposit + draft6Fee;
  const draftCreditEnough = (drafts.creditUsed || 0) + totalCost <= (drafts.creditLimit || 0);
  const draftAllowed = (drafts.bankReputation || 70) >= 30 && draftCreditEnough;
  const loanCreditEnough = (finance.loan || 0) + totalCost <= (finance.creditLimit || 0);
  const loanAvailable = Math.max(0, (finance.creditLimit || 0) - (finance.loan || 0));
  const draftAvailable = getAvailableDraftCredit();
  const cashNeed = paymentMethod === 'cash' ? totalCost : paymentMethod === 'loan' ? 0 : (paymentMethod === 'draft6' ? draft6Cash : draft3Cash);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-slate-800">配置采购单</h3>
          <span className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">{orderForm.model.name}</span>
        </div>
        <div className="space-y-5 mb-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">采购批量 (台)</label>
            <div className="flex items-center gap-3">
              <input type="range" min="1" max={available} value={Math.min(orderForm.quantity, available)} onChange={e => onUpdateOrderForm(prev => ({ ...prev, quantity: parseInt(e.target.value, 10) }))} className="flex-1 accent-slate-800" />
              <input type="number" min="1" max={available} value={orderForm.quantity} onChange={e => onUpdateOrderForm(prev => ({ ...prev, quantity: Math.max(1, parseInt(e.target.value, 10) || 1) }))} className="w-16 border border-slate-300 rounded-md p-1.5 text-center font-bold outline-none focus:border-blue-500" />
            </div>
            <p className="text-xs text-slate-500 mt-1">剩余空位(含<Term term="在途">在途</Term>): <span className="font-bold">{totalSlots - currentTotal}</span> 台 (<Term term="展厅展位">展厅</Term> {facility.showroomSpots - inventory.filter(c => c.location === 'showroom').length} + <Term term="仓储区">仓储</Term> {facility.warehouseCapacity - inventory.filter(c => c.location === 'warehouse').length} - <Term term="在途">在途</Term> {pendingOrders.reduce((s, o) => s + o.quantity, 0)})</p>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">车辆外观颜色</label>
            <div className="grid grid-cols-4 gap-2">
              {['黑', '白', '灰', '红'].map(c => (
                <button key={c} onClick={() => onUpdateOrderForm(prev => ({ ...prev, color: c }))} className={'py-2 rounded-md border text-sm font-bold transition-all flex items-center justify-center gap-1  ' + (orderForm.color === c ? 'bg-slate-800 text-white border-slate-800 shadow-md' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50')}>
                  <div className={'w-3 h-3 rounded-full border border-slate-300  ' + (c === '黑' ? 'bg-black' : c === '白' ? 'bg-white' : c === '灰' ? 'bg-gray-400' : 'bg-red-500')}></div> {c}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">付款方式 (两套银行<Term term="授信">额度</Term>独立)</label>
            <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
              <div className="rounded-lg bg-blue-50 border border-blue-100 p-2">
                <p className="font-bold text-blue-700"><Term term="库存融资授信">库存融资可用</Term></p>
                <p className="text-slate-600 mt-0.5">{formatMoney(loanAvailable)} / {formatMoney(finance.creditLimit || 0)}</p>
              </div>
              <div className="rounded-lg bg-indigo-50 border border-indigo-100 p-2">
                <p className="font-bold text-indigo-700"><Term term="承兑汇票专项授信">承兑汇票专项可用</Term></p>
                <p className="text-slate-600 mt-0.5">{formatMoney(draftAvailable)} / {formatMoney(drafts.creditLimit || 0)}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <button onClick={() => onUpdateOrderForm(prev => ({ ...prev, paymentMethod: 'cash' }))} className={'py-2.5 rounded-md border text-sm font-bold transition-all  ' + (paymentMethod === 'cash' ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50')}>现金全款</button>
              <button disabled={!loanCreditEnough} onClick={() => onUpdateOrderForm(prev => ({ ...prev, paymentMethod: 'loan' }))} className={'py-2.5 rounded-md border text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed  ' + (paymentMethod === 'loan' ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50')}><Term term="库存融资">库存融资</Term></button>
              <button disabled={!draftAllowed} onClick={() => onUpdateOrderForm(prev => ({ ...prev, paymentMethod: 'draft3' }))} className={'py-2.5 rounded-md border text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed  ' + (paymentMethod === 'draft3' ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50')}><Term term="承兑汇票">3个月汇票</Term></button>
              <button disabled={!draftAllowed} onClick={() => onUpdateOrderForm(prev => ({ ...prev, paymentMethod: 'draft6' }))} className={'py-2.5 rounded-md border text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed  ' + (paymentMethod === 'draft6' ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50')}><Term term="承兑汇票">6个月汇票</Term></button>
            </div>
            {!loanCreditEnough && <p className="text-xs text-red-500 mt-2">库存融资授信不足，当前库存融资可用 {formatMoney(loanAvailable)}。</p>}
            {!draftAllowed && <p className="text-xs text-red-500 mt-2">{(drafts.bankReputation || 70) < 30 ? '银行信用低于30，暂停新开汇票。' : `承兑汇票专项授信不足，可用 ${formatMoney(draftAvailable)}。可改选“库存融资”使用顶部那笔库存融资额度。`}</p>}
          </div>
          <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-sm text-amber-800">
            <p className="font-bold">🚛 物流周期: 3~7天到货</p>
            <p className="text-xs mt-1">下单后车辆需经厂家排产发运，预计3-7个经营日后抵达仓储区。</p>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <p className="flex justify-between text-slate-600 text-sm mb-1"><span>单车成本:</span> <span>¥{orderForm.model.baseCost.toLocaleString()}</span></p>
            <p className="flex justify-between text-slate-600 text-sm mb-1"><span>采购总额:</span> <span className="font-bold">¥{totalCost.toLocaleString()}</span></p>
            {(paymentMethod === 'draft3' || paymentMethod === 'draft6') && (
              <>
                <p className="flex justify-between text-slate-600 text-sm mb-1"><span><Term term="承兑汇票">汇票</Term>保证金(20%):</span> <span>¥{draftDeposit.toLocaleString()}</span></p>
                <p className="flex justify-between text-slate-600 text-sm mb-1"><span>银行手续费:</span> <span>¥{(paymentMethod === 'draft6' ? draft6Fee : draft3Fee).toLocaleString()}</span></p>
                <p className="flex justify-between text-slate-600 text-sm mb-1"><span>到期尾款(80%):</span> <span>¥{Math.round(totalCost * 0.8).toLocaleString()}</span></p>
              </>
            )}
            {paymentMethod === 'loan' && (
              <>
                <p className="flex justify-between text-slate-600 text-sm mb-1"><span>本次新增<Term term="库存融资">银行负债</Term>:</span> <span>¥{totalCost.toLocaleString()}</span></p>
                <p className="flex justify-between text-slate-600 text-sm mb-1"><span>融资后负债余额:</span> <span>¥{((finance.loan || 0) + totalCost).toLocaleString()}</span></p>
              </>
            )}
            <p className="flex justify-between text-lg font-bold text-slate-800 border-t border-slate-200 pt-2 mt-2"><span>本次现金支出:</span> <span className="text-blue-700">¥{cashNeed.toLocaleString()}</span></p>
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors">取消配置</button>
          <button onClick={onConfirm} className="px-5 py-2.5 bg-slate-800 text-white font-medium rounded-lg hover:bg-slate-900 transition-colors shadow-md">确认下单</button>
        </div>
      </div>
    </div>
  );
}
