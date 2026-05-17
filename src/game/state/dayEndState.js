import { STAFF_ROLE_META } from '../config/staff.js';

export const buildStaffStateAfterTurn = ({
  staff,
  dccMembers,
  salesMembers,
  serviceMembers,
  streamerMembers,
}) => ({
  ...staff,
  dcc: { ...staff.dcc, members: dccMembers },
  sales: { ...staff.sales, members: salesMembers },
  service: { ...(staff.service || { salary: STAFF_ROLE_META.service.salary }), members: serviceMembers },
  streamer: { ...(staff.streamer || { salary: STAFF_ROLE_META.streamer.salary }), members: streamerMembers },
});

export const buildAfterSalesStateAfterTurn = ({ afterSales, techMembers }) => ({
  ...afterSales,
  technicians: techMembers,
});

export const buildCsiStateAfterTurn = ({
  csi,
  score,
  complaintOccurred,
  expiredComplaintCount,
}) => ({
  ...csi,
  score,
  complaints: (csi.complaints || 0) + (complaintOccurred ? 1 : 0) + expiredComplaintCount,
});

export const buildInsuranceRenewalsAfterTurn = ({
  insuranceRenewals,
  pending,
  dailyRevenue,
}) => ({
  pending,
  renewed: (insuranceRenewals.renewed || 0) + (dailyRevenue > 0 ? 1 : 0),
  revenue: (insuranceRenewals.revenue || 0) + dailyRevenue,
});
