import React from 'react';
import { Term } from '../../shared/ui/tooltip.jsx';

export function CsiTab({
  csi,
  onCareAction,
  onFollowUpAction,
}) {
  return (
    <div className="animate-fade-in">
      <div className="mb-6 border-b border-slate-100 pb-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">📊 <Term term="CSI">CSI</Term>客户满意度管理</h2>
        <p className="text-slate-500 text-sm mt-1"><Term term="CSI">CSI</Term>直接影响<Term term="销售转化率">销售转化率</Term>、<Term term="转介绍">转介绍</Term>线索和月底<Term term="返利系数">返利系数</Term>，是经营健康度的核心指标。</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className={'rounded-xl p-5 text-center shadow-md border-2 ' + (csi.score >= 95 ? 'bg-green-50 border-green-300' : csi.score >= 90 ? 'bg-blue-50 border-blue-300' : csi.score >= 85 ? 'bg-amber-50 border-amber-300' : 'bg-red-50 border-red-300')}>
          <p className="text-sm text-slate-500 mb-2">当前<Term term="CSI">CSI</Term>分数</p>
          <p className={'text-5xl font-black ' + (csi.score < 85 ? 'text-red-600' : csi.score >= 95 ? 'text-green-600' : csi.score >= 90 ? 'text-blue-600' : 'text-amber-600')}>{Math.round(csi.score)}</p>
          <p className="text-xs text-slate-400 mt-2">满分100 · 厂家考核线90分</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between">
          <div>
            <p className="text-sm text-slate-500 mb-3"><Term term="CSI">CSI</Term>等级与业务影响</p>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-green-700 font-bold">≥95 优秀</span>
                <span>转化率+8% · 返利×1.03 · 转介绍</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-700 font-bold">90-94 达标</span>
                <span>转化率+4% · 返利×1.0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-amber-700 font-bold">85-89 预警</span>
                <span>转化率-3% · 返利×0.95</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-red-700 font-bold">&lt;85 危险</span>
                <span>转化率-8% · 返利×0.85</span>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <p className="text-sm text-slate-500 mb-3">当月投诉统计</p>
          <div className="flex items-center gap-4 mb-3">
            <div className="text-center">
              <p className="text-3xl font-black text-red-600">{csi.complaints}</p>
              <p className="text-xs text-slate-400">投诉次数</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-black text-amber-600">{Math.round(csi.score) < 90 ? '⚠️' : '✅'}</p>
              <p className="text-xs text-slate-400">考核状态</p>
            </div>
          </div>
          <p className="text-xs text-slate-400">每次投诉使<Term term="CSI">CSI</Term>下降3-8分，技师水平≥60可减半影响，销售水平≥60可减轻30%影响。</p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-5 mb-6 border border-slate-200 shadow-sm">
        <h3 className="font-bold text-lg mb-4">🔍 CSI影响因素分析</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4 border border-slate-100">
            <h4 className="font-bold text-sm text-slate-700 mb-2">📉 负面因素（拉低CSI）</h4>
            <ul className="space-y-1.5 text-xs text-slate-600">
              <li>• <span className="text-red-600 font-bold">客户投诉</span>：每天约5%概率发生，CSI下降3-8分/次</li>
              <li>• <span className="text-red-600 font-bold">技师水平低</span>：技能&lt;60时投诉影响无法减半</li>
              <li>• <span className="text-red-600 font-bold">销售水平低</span>：技能&lt;60时投诉影响无法减轻</li>
            </ul>
          </div>
          <div className="bg-white rounded-lg p-4 border border-slate-100">
            <h4 className="font-bold text-sm text-slate-700 mb-2">📈 正面因素（提升CSI）</h4>
            <ul className="space-y-1.5 text-xs text-slate-600">
              <li>• <span className="text-green-600 font-bold">自然回升</span>：无投诉时CSI每天+0.3分</li>
              <li>• <span className="text-green-600 font-bold">客服专员</span>：提升CSI自然恢复，降低投诉概率，并带动回厂台次</li>
              <li>• <span className="text-green-600 font-bold">高CSI转介绍</span>：CSI≥95时每天产生1-3条新线索</li>
              <li>• <span className="text-green-600 font-bold">客户关怀</span>：花费¥2,000/次，立即+2分</li>
              <li>• <span className="text-green-600 font-bold">售后回访</span>：花费¥1,000/次，立即+1分</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-5 mb-6 border border-indigo-200 shadow-sm">
        <h3 className="font-bold text-lg mb-4">🛠️ <Term term="CSI">CSI</Term>改善运营</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4 border border-indigo-100 flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-sm text-indigo-800 mb-1">🎁 客户关怀行动</h4>
              <p className="text-xs text-slate-500 mb-1">组织客户关怀活动（节日问候、小礼品等），提升客户好感度。</p>
              <p className="text-xs text-indigo-600">效果：CSI +2分 · 费用：¥2,000</p>
            </div>
            <button
              onClick={onCareAction}
              className="mt-3 w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold transition-colors"
            >投入 ¥2,000 开展关怀</button>
          </div>
          <div className="bg-white rounded-lg p-4 border border-indigo-100 flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-sm text-indigo-800 mb-1">📞 售后回访计划</h4>
              <p className="text-xs text-slate-500 mb-1">安排专人回访近期维修/购车客户，及时发现问题并补救。</p>
              <p className="text-xs text-indigo-600">效果：CSI +1分 · 费用：¥1,000</p>
            </div>
            <button
              onClick={onFollowUpAction}
              className="mt-3 w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold transition-colors"
            >投入 ¥1,000 安排回访</button>
          </div>
        </div>
        <p className="text-[10px] text-slate-400 mt-3 text-center">提示：提升技师和销售顾问能力可从根本上减少投诉概率，是<Term term="CSI">CSI</Term>的长期保障。</p>
      </div>

      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
        <h3 className="font-bold text-lg mb-3">🔗 <Term term="CSI">CSI</Term>如何影响销售</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="border border-slate-200 px-3 py-2 text-left">CSI区间</th>
                <th className="border border-slate-200 px-3 py-2 text-center">转化率加成</th>
                <th className="border border-slate-200 px-3 py-2 text-center">返利系数</th>
                <th className="border border-slate-200 px-3 py-2 text-center">转介绍</th>
                <th className="border border-slate-200 px-3 py-2 text-left">经营建议</th>
              </tr>
            </thead>
            <tbody>
              <tr className={csi.score >= 95 ? 'bg-green-50 font-bold' : ''}>
                <td className="border border-slate-200 px-3 py-2">≥95分 优秀</td>
                <td className="border border-slate-200 px-3 py-2 text-center text-green-600">+8%</td>
                <td className="border border-slate-200 px-3 py-2 text-center text-green-600">×1.03</td>
                <td className="border border-slate-200 px-3 py-2 text-center text-green-600">每天1-3条</td>
                <td className="border border-slate-200 px-3 py-2">保持即可，享受口碑红利</td>
              </tr>
              <tr className={csi.score >= 90 && csi.score < 95 ? 'bg-blue-50 font-bold' : ''}>
                <td className="border border-slate-200 px-3 py-2">90-94 达标</td>
                <td className="border border-slate-200 px-3 py-2 text-center text-blue-600">+4%</td>
                <td className="border border-slate-200 px-3 py-2 text-center">×1.0</td>
                <td className="border border-slate-200 px-3 py-2 text-center text-slate-400">—</td>
                <td className="border border-slate-200 px-3 py-2">争取冲95，获得转介绍和返利加成</td>
              </tr>
              <tr className={csi.score >= 85 && csi.score < 90 ? 'bg-amber-50 font-bold' : ''}>
                <td className="border border-slate-200 px-3 py-2">85-89 预警</td>
                <td className="border border-slate-200 px-3 py-2 text-center text-amber-600">-3%</td>
                <td className="border border-slate-200 px-3 py-2 text-center text-amber-600">×0.95</td>
                <td className="border border-slate-200 px-3 py-2 text-center text-slate-400">—</td>
                <td className="border border-slate-200 px-3 py-2">立即投入关怀/回访，提升技师能力</td>
              </tr>
              <tr className={csi.score < 85 ? 'bg-red-50 font-bold' : ''}>
                <td className="border border-slate-200 px-3 py-2">&lt;85 危险</td>
                <td className="border border-slate-200 px-3 py-2 text-center text-red-600">-8%</td>
                <td className="border border-slate-200 px-3 py-2 text-center text-red-600">×0.85</td>
                <td className="border border-slate-200 px-3 py-2 text-center text-slate-400">—</td>
                <td className="border border-slate-200 px-3 py-2">紧急！卖不动+返利大缩水，必须大力改善</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
