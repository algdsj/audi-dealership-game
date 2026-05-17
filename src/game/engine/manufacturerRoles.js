import { MANUFACTURER_ATTITUDE_LEVELS, MANUFACTURER_ROLE_DEFAULTS } from '../config/manufacturerRoles.js';

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value));

export const getManufacturerAttitude = relationship => (
  [...MANUFACTURER_ATTITUDE_LEVELS]
    .sort((a, b) => b.min - a.min)
    .find(item => clamp(relationship) >= item.min) || MANUFACTURER_ATTITUDE_LEVELS[0]
);

const normalizeRole = (roleId, role = {}) => {
  const defaults = MANUFACTURER_ROLE_DEFAULTS[roleId];
  const relationship = clamp(Number(role.relationship ?? defaults.relationship));
  const attitude = getManufacturerAttitude(relationship);
  return {
    ...defaults,
    ...role,
    relationship,
    attitude: attitude.id,
    attitudeLabel: attitude.label,
    tone: attitude.tone,
    lastChange: role.lastChange || '开局关系稳定。',
  };
};

export const normalizeManufacturerRoles = (roles = {}) => ({
  hq: normalizeRole('hq', roles.hq),
  region: normalizeRole('region', roles.region),
});

export const normalizeManufacturerPolicyRoles = (manufacturerPolicy = {}) => ({
  ...manufacturerPolicy,
  roles: normalizeManufacturerRoles(manufacturerPolicy.roles),
});

export const adjustManufacturerRole = ({
  manufacturerPolicy,
  role,
  delta,
  reason,
}) => {
  const policy = normalizeManufacturerPolicyRoles(manufacturerPolicy);
  const currentRole = policy.roles[role] || policy.roles.region;
  const relationship = clamp((currentRole.relationship || 0) + delta);
  const attitude = getManufacturerAttitude(relationship);
  return {
    ...policy,
    roles: {
      ...policy.roles,
      [role]: {
        ...currentRole,
        relationship,
        attitude: attitude.id,
        attitudeLabel: attitude.label,
        tone: attitude.tone,
        lastChange: reason || currentRole.lastChange,
      },
    },
  };
};
