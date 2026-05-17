import React from 'react';
import { STAFF_ROLE_META } from '../../game/config/staff.js';
import {
  estimateTurnoverRiskPercent,
  getCareerLevel,
  getEffectiveSkill,
  getStaffRiskHints,
  getTraits,
  normalizeStaffMember,
} from '../../game/engine/staffing.js';
import { Icons } from '../../shared/ui/icons.jsx';
import { StaffAvatar } from '../../shared/ui/StaffAvatar.jsx';
import { StaffCareerLine } from '../../shared/ui/StaffCareerLine.jsx';
import { StaffStoryBadge } from '../../shared/ui/StaffStoryBadge.jsx';
import { Term } from '../../shared/ui/tooltip.jsx';

const getAverageSkill = (type, members) => (
  members.length > 0
    ? Math.round(members.reduce((sum, member) => sum + getEffectiveSkill(type, member), 0) / members.length)
    : 0
);

const getRiskColor = (risk) => {
  if (risk >= 4) return 'text-red-600 bg-red-50 border-red-200';
  if (risk >= 2) return 'text-amber-600 bg-amber-50 border-amber-200';
  return 'text-green-600 bg-green-50 border-green-200';
};

const getTraitToneColor = (tone) => {
  if (tone === 'negative') return 'border-red-200 bg-red-50 text-red-600';
  if (tone === 'steady') return 'border-sky-200 bg-sky-50 text-sky-700';
  return 'border-emerald-200 bg-emerald-50 text-emerald-700';
};

const getStaffStoryTimeline = (staffStoryMemory, memberId) => (
  Array.isArray(staffStoryMemory?.[memberId]?.timeline)
    ? staffStoryMemory[memberId].timeline.slice(-3).reverse()
    : []
);

function StaffMemberCard({
  type,
  member,
  salary,
  activeRegion,
  storyMoments = [],
  trainingCostLabel,
  onToggleRetention,
  onTrainMember,
  compactLock = false,
}) {
  const traits = getTraits(type, member);
  const relationshipRisk = getStaffRiskHints(type, member);
  const effectiveSkill = getEffectiveSkill(type, member);
  const risk = estimateTurnoverRiskPercent(type, member, activeRegion.turnover || 1);
  const effectiveRisk = Number(risk.toFixed(1));
  const riskColor = getRiskColor(risk);
  const roleLabel = STAFF_ROLE_META[type]?.label || '员工';

  return (
    <div className={'p-3 rounded-lg border ' + (member.retained ? 'border-blue-200 bg-blue-50/50' : 'border-slate-100 bg-white')}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <StaffAvatar type={type} member={member} />
          <div>
            <p className="text-sm font-bold text-slate-800">{member.nickname}</p>
            <p className="text-[10px] text-slate-400">{roleLabel} · 日薪 ¥{salary}{member.retained ? ' +留任¥' + salary : ''}</p>
            {traits.length > 0 && (
              <div className="mt-1 flex max-w-[240px] flex-wrap gap-1">
                {traits.map(trait => (
                  <span
                    key={trait.id}
                    title={trait.desc}
                    className={'rounded border px-1.5 py-0.5 text-[10px] font-bold ' + getTraitToneColor(trait.tone)}
                  >
                    {trait.label}
                  </span>
                ))}
              </div>
            )}
            <p className="text-[10px] text-slate-400 mt-0.5">有效能力 {effectiveSkill} · 等级加成 +{getCareerLevel(member).skillBonus}</p>
            {relationshipRisk.hasRisk && (
              <p className="text-[10px] font-bold text-amber-600 mt-0.5">关系风险：{relationshipRisk.hints.join(' / ')}</p>
            )}
            {storyMoments.length > 0 && (
              <div className="mt-1 flex max-w-[220px] flex-wrap gap-1">
                {storyMoments.map(moment => (
                  <StaffStoryBadge key={moment.id} moment={moment} compact />
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={'text-[10px] font-bold px-1.5 py-0.5 rounded border ' + riskColor}>
            {compactLock ? effectiveRisk + '%' : '流失' + effectiveRisk + '%'}
          </span>
          <button
            onClick={() => onToggleRetention(member.id)}
            className={`text-[10px] font-bold px-2 py-1 rounded transition-colors ${
              member.retained
                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                : risk >= 2 ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100' : 'bg-slate-50 text-slate-400 border border-slate-200'
            }`}
          >
            {member.retained ? (compactLock ? '🔒' : '🔒留任') : '留任'}
          </button>
        </div>
      </div>
      <StaffCareerLine type={type} member={member} />
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
          <div className={'h-full rounded-full transition-all ' + (member.skill >= 80 ? 'bg-indigo-500' : member.skill >= 60 ? 'bg-blue-400' : 'bg-slate-300')} style={{ width: member.skill + '%' }}></div>
        </div>
        <span className="text-[10px] font-bold text-slate-500 w-7 text-right">{member.skill}</span>
        <button
          onClick={() => onTrainMember(member.id)}
          disabled={member.skill >= 100}
          className="text-[10px] font-bold px-2 py-1 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
        >
          {trainingCostLabel}
        </button>
      </div>
    </div>
  );
}

function SmallTeamPanel({
  type,
  team,
  activeRegion,
  headline,
  emptyText,
  staffStoryMemory,
  onHireStaff,
  onToggleRetention,
  onTrainMember,
}) {
  const members = team.members || [];
  const avgSkill = getAverageSkill(type, members);

  return (
    <div className="border border-slate-200 rounded-xl p-5">
      <div className="flex justify-between items-center mb-3">
        <div>
          <h3 className="font-bold text-lg">{STAFF_ROLE_META[type].icon} {STAFF_ROLE_META[type].label}团队</h3>
          {headline && <p className="text-[10px] text-slate-400 mt-0.5">{headline}</p>}
        </div>
        <button onClick={() => onHireStaff(type)} className="px-3 py-1.5 border border-slate-300 rounded text-xs font-bold hover:bg-slate-50">+招聘</button>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-slate-50 p-2 rounded text-center"><p className="text-[10px] text-slate-400">人数/日薪</p><p className="font-bold text-sm">{members.length} / ¥{team.salary}</p></div>
        <div className="bg-slate-50 p-2 rounded text-center"><p className="text-[10px] text-slate-400">平均能力</p><p className="font-bold text-sm text-indigo-600">{avgSkill}</p></div>
      </div>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {members.length === 0 && <p className="text-xs text-slate-400 text-center py-4">{emptyText}</p>}
        {members.map(member => (
          <StaffMemberCard
            key={member.id}
            type={type}
            member={member}
            salary={team.salary}
            activeRegion={activeRegion}
            storyMoments={getStaffStoryTimeline(staffStoryMemory, member.id)}
            trainingCostLabel="培训¥2万"
            onToggleRetention={memberId => onToggleRetention(type, memberId)}
            onTrainMember={memberId => onTrainMember(type, memberId)}
          />
        ))}
      </div>
    </div>
  );
}

export function StaffManagementTab({
  staff,
  afterSales,
  facility,
  activeRegion,
  formatMoney,
  onUpgradeFacility,
  onHireStaff,
  onToggleRetention,
  onTrainMember,
  onHireTech,
  onToggleTechRetention,
  onTrainTech,
  staffStoryMemory = {},
}) {
  const dccMembers = staff.dcc.members || [];
  const salesMembers = staff.sales.members || [];
  const serviceTeam = staff.service || { members: [], salary: STAFF_ROLE_META.service.salary };
  const streamerTeam = staff.streamer || { members: [], salary: STAFF_ROLE_META.streamer.salary };
  const techMembers = afterSales.technicians || [];
  const salesAvgSkill = getAverageSkill('sales', salesMembers);
  const techAvgSkill = getAverageSkill('tech', techMembers);
  const careerMembers = [
    ...dccMembers.map(member => ({ type: 'dcc', member })),
    ...salesMembers.map(member => ({ type: 'sales', member })),
    ...(serviceTeam.members || []).map(member => ({ type: 'service', member })),
    ...(streamerTeam.members || []).map(member => ({ type: 'streamer', member })),
    ...techMembers.map(member => ({ type: 'tech', member })),
  ];
  const avgLoyalty = careerMembers.length > 0 ? Math.round(careerMembers.reduce((sum, item) => sum + normalizeStaffMember(item.type, item.member).loyalty, 0) / careerMembers.length) : 0;
  const avgStress = careerMembers.length > 0 ? Math.round(careerMembers.reduce((sum, item) => sum + normalizeStaffMember(item.type, item.member).stress, 0) / careerMembers.length) : 0;
  const topCareerMember = careerMembers
    .map(item => ({ ...item, normalized: normalizeStaffMember(item.type, item.member), level: getCareerLevel(item.member), effectiveSkill: getEffectiveSkill(item.type, item.member) }))
    .sort((a, b) => (b.level.level - a.level.level) || (b.effectiveSkill - a.effectiveSkill))[0];
  const retainedRegularCount = salesMembers.filter(member => member.retained).length
    + dccMembers.filter(member => member.retained).length
    + (serviceTeam.members || []).filter(member => member.retained).length
    + (streamerTeam.members || []).filter(member => member.retained).length;
  const retentionDailyCost = (salesMembers.filter(member => member.retained).length * staff.sales.salary)
    + (dccMembers.filter(member => member.retained).length * staff.dcc.salary)
    + ((serviceTeam.members || []).filter(member => member.retained).length * serviceTeam.salary)
    + ((streamerTeam.members || []).filter(member => member.retained).length * streamerTeam.salary);

  return (
    <div className="animate-fade-in">
      <div className="mb-6 border-b border-slate-100 pb-4 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><Icons.Users /> 人事与设施管理</h2>
          <p className="text-slate-500 text-sm mt-1">员工会随工作和培训升级，也会积累压力。忠诚、压力和留任共同影响离职风险。</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700 max-w-xs">
          <p className="font-bold mb-1">⚠️ 流失风险规则</p>
          <p>能力、区域竞争、压力、忠诚共同作用</p>
          <p>留任津贴会提升忠诚并显著压低风险</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-slate-900 text-white rounded-xl p-4">
          <p className="text-[10px] text-slate-400">组织文化</p>
          <p className="text-2xl font-black">{avgLoyalty >= 70 ? '凝聚' : avgLoyalty >= 45 ? '稳定' : '松动'}</p>
          <p className="text-xs text-slate-400 mt-1">平均忠诚 {avgLoyalty}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-[10px] text-slate-400">团队压力</p>
          <p className={(avgStress >= 70 ? 'text-red-600' : avgStress >= 50 ? 'text-amber-600' : 'text-emerald-600') + ' text-2xl font-black'}>{avgStress}</p>
          <p className="text-xs text-slate-400 mt-1">高压会推高流失风险</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-[10px] text-slate-400">王牌员工</p>
          <p className="text-lg font-black text-slate-800">{topCareerMember ? `${topCareerMember.normalized.nickname} · Lv.${topCareerMember.level.level}` : '暂无'}</p>
          <p className="text-xs text-slate-400 mt-1">{topCareerMember ? `${STAFF_ROLE_META[topCareerMember.type].label}，有效能力${topCareerMember.effectiveSkill}` : '招聘后开始培养'}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-[10px] text-slate-400">生涯阶段</p>
          <p className="text-2xl font-black text-indigo-600">{careerMembers.filter(item => getCareerLevel(item.member).level >= 3).length}</p>
          <p className="text-xs text-slate-400 mt-1">骨干及以上员工数</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border border-slate-200 rounded-xl p-5 bg-gradient-to-br from-slate-50 to-white">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Icons.Store /> 展厅与仓储设施</h3>
          <div className="flex justify-between items-center mb-2">
            <div>
              <p className="text-sm text-slate-500">当前级别: <span className="font-bold text-slate-800">Lv.{facility.level} 标准店</span></p>
              <p className="text-sm text-slate-500">展厅展位: <span className="font-bold text-blue-600">{facility.showroomSpots} 个</span></p>
              <p className="text-sm text-slate-500">仓储容量: <span className="font-bold text-amber-600">{facility.warehouseCapacity} 台</span></p>
            </div>
            <div className="text-right text-xs text-slate-400">
              <p>升级效果: <Term term="展厅展位">展位</Term>+1, <Term term="仓储区">仓储</Term>+8</p>
              <p>展车提升<Term term="销售转化率">转化率</Term>; 仓储车¥50/天</p>
            </div>
          </div>
          <button onClick={onUpgradeFacility} className="w-full py-3 bg-slate-800 text-white font-medium rounded-lg hover:bg-slate-700 transition-colors">升级 ({formatMoney(facility.level * 100000)})</button>
        </div>

        <SmallTeamPanel
          type="dcc"
          team={staff.dcc}
          activeRegion={activeRegion}
          emptyText="团队已空，请招聘新人"
          onHireStaff={onHireStaff}
          staffStoryMemory={staffStoryMemory}
          onToggleRetention={onToggleRetention}
          onTrainMember={onTrainMember}
        />

        {[
          {
            type: 'service',
            team: serviceTeam,
            headline: '提升CSI自然恢复，降低投诉概率，并增加售后回厂台次。',
            emptyText: '团队已空，请招聘新人',
          },
          {
            type: 'streamer',
            team: streamerTeam,
            headline: '配合直播投流，把流量预算转成直播线索。',
            emptyText: '暂无主播，招聘后直播投流无法转化为线索',
          },
        ].map(item => (
          <SmallTeamPanel
            key={item.type}
            type={item.type}
            team={item.team}
            headline={item.headline}
            emptyText={item.emptyText}
            activeRegion={activeRegion}
            onHireStaff={onHireStaff}
            staffStoryMemory={staffStoryMemory}
            onToggleRetention={onToggleRetention}
            onTrainMember={onTrainMember}
          />
        ))}

        <div className="border border-slate-200 rounded-xl p-5 lg:col-span-2">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-lg">🤝 展厅销售顾问</h3>
            <button onClick={() => onHireStaff('sales')} className="px-3 py-1.5 border border-slate-300 rounded text-xs font-bold hover:bg-slate-50">+招聘</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            <div className="bg-slate-50 p-2 rounded text-center"><p className="text-[10px] text-slate-400">人数/日薪</p><p className="font-bold text-sm">{salesMembers.length} / ¥{staff.sales.salary}</p></div>
            <div className="bg-slate-50 p-2 rounded text-center"><p className="text-[10px] text-slate-400">平均能力</p><p className="font-bold text-sm text-indigo-600">{salesAvgSkill}</p></div>
            <div className="bg-slate-50 p-2 rounded text-center"><p className="text-[10px] text-slate-400">留任人数</p><p className="font-bold text-sm text-blue-600">{retainedRegularCount} 人</p></div>
            <div className="bg-slate-50 p-2 rounded text-center"><p className="text-[10px] text-slate-400">留任日支出</p><p className="font-bold text-sm text-orange-600">{formatMoney(retentionDailyCost)}</p></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {salesMembers.length === 0 && <p className="text-xs text-slate-400 text-center py-4 col-span-3">团队已空，请招聘新人</p>}
            {salesMembers.map(member => (
              <StaffMemberCard
                key={member.id}
                type="sales"
                member={member}
                salary={staff.sales.salary}
                activeRegion={activeRegion}
                storyMoments={getStaffStoryTimeline(staffStoryMemory, member.id)}
                trainingCostLabel="培训¥2万"
                compactLock
                onToggleRetention={memberId => onToggleRetention('sales', memberId)}
                onTrainMember={memberId => onTrainMember('sales', memberId)}
              />
            ))}
          </div>
        </div>

        <div className="border border-slate-200 rounded-xl p-5 lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg">🔧 售后技师团队</h3>
            <button onClick={onHireTech} disabled={techMembers.length >= 6} className="px-3 py-1.5 border border-slate-300 rounded text-xs font-bold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              +招聘(¥3,000)
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="bg-slate-50 p-2 rounded text-center"><p className="text-[10px] text-slate-400">人数/日薪</p><p className="font-bold text-sm">{techMembers.length} / ¥{afterSales.salary}</p></div>
            <div className="bg-slate-50 p-2 rounded text-center"><p className="text-[10px] text-slate-400">平均能力</p><p className="font-bold text-sm text-indigo-600">{techAvgSkill}</p></div>
            <div className="bg-slate-50 p-2 rounded text-center"><p className="text-[10px] text-slate-400">维修产能</p><p className="font-bold text-sm text-green-600">{techMembers.length * 3} 单/天</p></div>
            <div className="bg-slate-50 p-2 rounded text-center"><p className="text-[10px] text-slate-400">留任人数</p><p className="font-bold text-sm text-blue-600">{techMembers.filter(member => member.retained).length} 人</p></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {techMembers.length === 0 && <p className="text-xs text-slate-400 text-center py-4 col-span-3">团队已空，请招聘技师</p>}
            {techMembers.map(member => (
              <StaffMemberCard
                key={member.id}
                type="tech"
                member={member}
                salary={afterSales.salary}
                activeRegion={activeRegion}
                storyMoments={getStaffStoryTimeline(staffStoryMemory, member.id)}
                trainingCostLabel="培训¥2千"
                compactLock
                onToggleRetention={onToggleTechRetention}
                onTrainMember={onTrainTech}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
