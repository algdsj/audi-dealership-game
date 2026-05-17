import { useState } from 'react';
import { createStaffMember } from '../game/engine/staffing.js';

export function useStaffState() {
  const [staff, setStaff] = useState(() => {
    const dccMembers = [
      createStaffMember('dcc', 30),
      createStaffMember('dcc', 30),
    ];
    const salesMembers = [
      createStaffMember('sales', 30),
      createStaffMember('sales', 30),
      createStaffMember('sales', 30),
    ];
    return {
      dcc: { members: dccMembers, salary: 150 },
      sales: { members: salesMembers, salary: 250 },
      service: { members: [createStaffMember('service', 30)], salary: 180 },
      streamer: { members: [], salary: 220 },
    };
  });

  return { staff, setStaff };
}
