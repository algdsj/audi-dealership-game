import { CAREER_LEVELS, NICKNAME_POOL, STAFF_TRAITS } from '../config/staff.js';

let nicknameUsed = { dcc: new Set(), sales: new Set(), tech: new Set(), service: new Set(), streamer: new Set() };

export const pickNickname = (type) => {
  const pool = NICKNAME_POOL[type] || NICKNAME_POOL.sales || [];
  if (!nicknameUsed[type]) nicknameUsed[type] = new Set();
  const used = nicknameUsed[type];
  const available = pool.filter(n => !used.has(n));
  if (available.length === 0) {
    nicknameUsed[type] = new Set();
    return pickNickname(type);
  }
  const name = available[Math.floor(Math.random() * available.length)];
  used.add(name);
  return name;
};

export const hashString = (value = '') => {
  let hash = 0;
  for (let i = 0; i < value.length; i++) hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  return hash;
};

export const getAvatarSeed = (type, member = {}) => Number.isFinite(member.avatarId)
  ? member.avatarId
  : hashString(`${type}-${member.id || ''}-${member.nickname || ''}`);

export const getCareerLevel = (member = {}) => {
  const xp = Number(member.xp) || 0;
  return [...CAREER_LEVELS].reverse().find(level => xp >= level.minXp) || CAREER_LEVELS[0];
};

export const getNextCareerLevel = (member = {}) => CAREER_LEVELS.find(level => level.minXp > (Number(member.xp) || 0)) || null;

export const clampNum = (value, min, max) => Math.max(min, Math.min(max, Number(value) || 0));

export const pickTrait = (type) => {
  const pool = STAFF_TRAITS[type] || [];
  return pool[Math.floor(Math.random() * pool.length)] || null;
};

const getTraitDefinition = (type, traitId) => {
  const pool = STAFF_TRAITS[type] || [];
  return pool.find(trait => trait.id === traitId) || null;
};

const normalizeTraitIds = (type, member = {}) => {
  const poolIds = new Set((STAFF_TRAITS[type] || []).map(trait => trait.id));
  const ids = Array.isArray(member.traits)
    ? member.traits
    : (member.traitId ? [member.traitId] : []);
  return [...new Set(ids)].filter(traitId => poolIds.has(traitId));
};

export const pickStaffTraits = (type, random = Math.random) => {
  const pool = STAFF_TRAITS[type] || [];
  if (pool.length === 0) return [];
  const count = pool.length > 1 && random() > 0.62 ? 2 : 1;
  const available = [...pool];
  const selected = [];
  while (selected.length < count && available.length > 0) {
    const index = Math.floor(random() * available.length);
    const [trait] = available.splice(index, 1);
    if (trait) selected.push(trait.id);
  }
  return selected;
};

export const getTraits = (type, member) => normalizeTraitIds(type, member)
  .map(traitId => getTraitDefinition(type, traitId))
  .filter(Boolean);

export const getTrait = (type, member) => {
  const traits = getTraits(type, member);
  return traits[0] || null;
};

export const normalizeStaffMember = (type, member = {}) => {
  const baseSkill = Number(member.skill) || 30;
  const traits = normalizeTraitIds(type, member);
  return {
    ...member,
    id: member.id || `${type}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    skill: clampNum(baseSkill, 1, 100),
    retained: Boolean(member.retained),
    nickname: member.nickname || pickNickname(type),
    traitId: member.traitId || traits[0] || null,
    traits,
    avatarId: Number.isFinite(member.avatarId) ? member.avatarId : getAvatarSeed(type, member),
    xp: Math.max(0, Number.isFinite(member.xp) ? member.xp : Math.max(0, (baseSkill - 25) * 5)),
    loyalty: clampNum(Number.isFinite(member.loyalty) ? member.loyalty : (member.retained ? 74 : 62), 0, 100),
    stress: clampNum(Number.isFinite(member.stress) ? member.stress : 18, 0, 100),
  };
};

export const createStaffMember = (type, skill = 30, random = Math.random) => {
  const traits = pickStaffTraits(type, random);
  return normalizeStaffMember(type, {
    id: `${type}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    skill,
    retained: false,
    nickname: pickNickname(type),
    traitId: traits[0] || null,
    traits,
  });
};

export const getEffectiveSkill = (type, member) => Math.max(1, Math.min(100, (member?.skill || 0) + traitSum(type, [member], 'skillBonus') + (getCareerLevel(member)?.skillBonus || 0)));

export const estimateTurnoverRiskPercent = (type, member, regionTurnover = 1) => {
  const normalized = normalizeStaffMember(type, member);
  const skill = getEffectiveSkill(type, normalized);
  let risk = skill >= 95 ? 6 : skill >= 80 ? 4 : skill >= 60 ? 2 : 0.5;
  risk *= regionTurnover || 1;
  risk *= traitMultiplier(type, [normalized], 'turnoverMult');
  risk *= Math.max(0.55, Math.min(1.75, 1 + (normalized.stress - 35) / 90));
  risk *= Math.max(0.55, Math.min(1.65, 1 + (52 - normalized.loyalty) / 85));
  if (normalized.retained) risk *= 0.15;
  return Math.max(0.1, risk);
};

const isNegativeTrait = trait => trait?.tone === 'negative'
  || (trait?.turnoverRisk || 0) > 0
  || (trait?.turnoverMult || 1) > 1
  || (trait?.stressDelta || 0) > 0;

export const getStaffRiskHints = (type, member) => {
  const normalized = normalizeStaffMember(type, member);
  const traits = getTraits(type, normalized);
  const hints = [];
  if (normalized.stress >= 70) hints.push('高压力');
  if (normalized.loyalty <= 45) hints.push('低忠诚');
  if (traits.some(isNegativeTrait)) hints.push('性格波动');
  return {
    hasRisk: hints.length > 0,
    hints,
  };
};

export const traitSum = (type, members, key) => members.reduce(
  (sum, member) => sum + getTraits(type, member).reduce((innerSum, trait) => innerSum + (trait[key] || 0), 0),
  0,
);

export const traitMultiplier = (type, members, key, fallback = 1) => members.reduce(
  (mult, member) => mult * getTraits(type, member).reduce((innerMult, trait) => innerMult * (trait[key] || fallback), 1),
  1,
);
