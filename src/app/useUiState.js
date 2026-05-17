import { useState } from 'react';

export function useUiState() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [financeReportView, setFinanceReportView] = useState('profit');
  const [virtualPlan, setVirtualPlan] = useState({});
  const [selectedLogDay, setSelectedLogDay] = useState(null);
  const [showBriefingModal, setShowBriefingModal] = useState(false);
  const [showInboxModal, setShowInboxModal] = useState(false);
  const [isAdvancingDay, setIsAdvancingDay] = useState(false);
  const [monthlySummaryModal, setMonthlySummaryModal] = useState(null);

  return {
    activeTab,
    financeReportView,
    isAdvancingDay,
    monthlySummaryModal,
    selectedLogDay,
    setActiveTab,
    setFinanceReportView,
    setIsAdvancingDay,
    setMonthlySummaryModal,
    setSelectedLogDay,
    setShowBriefingModal,
    setShowInboxModal,
    setVirtualPlan,
    showBriefingModal,
    showInboxModal,
    virtualPlan,
  };
}
