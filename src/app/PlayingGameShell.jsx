import { lazy, Suspense } from 'react';
import { ApprovalCenter } from '../features/dashboard/ApprovalCenter.jsx';
import { DashboardOverview } from '../features/dashboard/DashboardOverview.jsx';
import { MessageCenterPanel } from '../features/dashboard/MessageCenterPanel.jsx';
import { GameHeader } from '../features/shell/GameHeader.jsx';
import { ModuleNavigation } from '../features/shell/ModuleNavigation.jsx';
import { OperationReminder } from '../features/shell/OperationReminder.jsx';
import { ScenarioStatusPanel } from '../features/shell/ScenarioStatusPanel.jsx';
import { GameModals } from './GameModals.jsx';

const DraftManagementTab = lazy(() => import('../features/finance/DraftManagementTab.jsx').then(module => ({ default: module.DraftManagementTab })));
const StoreBlueprintTab = lazy(() => import('../features/store/StoreBlueprintTab.jsx').then(module => ({ default: module.StoreBlueprintTab })));
const GmOfficeTab = lazy(() => import('../features/finance/GmOfficeTab.jsx').then(module => ({ default: module.GmOfficeTab })));
const VirtualSprintTab = lazy(() => import('../features/sales/VirtualSprintTab.jsx').then(module => ({ default: module.VirtualSprintTab })));
const ShowroomTab = lazy(() => import('../features/sales/ShowroomTab.jsx').then(module => ({ default: module.ShowroomTab })));
const OrderTab = lazy(() => import('../features/order/OrderTab.jsx').then(module => ({ default: module.OrderTab })));
const MarketingTab = lazy(() => import('../features/marketing/MarketingTab.jsx').then(module => ({ default: module.MarketingTab })));
const CustomerNegotiationTab = lazy(() => import('../features/customer/CustomerNegotiationTab.jsx').then(module => ({ default: module.CustomerNegotiationTab })));
const CustomerCenterTab = lazy(() => import('../features/customer/CustomerCenterTab.jsx').then(module => ({ default: module.CustomerCenterTab })));
const SalesOpportunityTab = lazy(() => import('../features/customer/SalesOpportunityTab.jsx').then(module => ({ default: module.SalesOpportunityTab })));
const OperatingEventsTab = lazy(() => import('../features/events/OperatingEventsTab.jsx').then(module => ({ default: module.OperatingEventsTab })));
const FinancialReportsTab = lazy(() => import('../features/finance/FinancialReportsTab.jsx').then(module => ({ default: module.FinancialReportsTab })));
const FacilityUpgradeTab = lazy(() => import('../features/facility/FacilityUpgradeTab.jsx').then(module => ({ default: module.FacilityUpgradeTab })));
const StaffManagementTab = lazy(() => import('../features/staff/StaffManagementTab.jsx').then(module => ({ default: module.StaffManagementTab })));
const UsedCarTab = lazy(() => import('../features/usedcar/UsedCarTab.jsx').then(module => ({ default: module.UsedCarTab })));
const AfterSalesTab = lazy(() => import('../features/aftersales/AfterSalesTab.jsx').then(module => ({ default: module.AfterSalesTab })));
const DerivativeConfigTab = lazy(() => import('../features/derivative/DerivativeConfigTab.jsx').then(module => ({ default: module.DerivativeConfigTab })));
const CsiTab = lazy(() => import('../features/csi/CsiTab.jsx').then(module => ({ default: module.CsiTab })));
const MarketTab = lazy(() => import('../features/market/MarketTab.jsx').then(module => ({ default: module.MarketTab })));
const RebateTab = lazy(() => import('../features/rebate/RebateTab.jsx').then(module => ({ default: module.RebateTab })));

function TabLoadingFallback() {
  return (
    <div className="flex min-h-[420px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-sm font-black text-slate-400">
      正在打开模块...
    </div>
  );
}

export function PlayingGameShell({ context: c }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans p-4 md:p-8 flex justify-center relative">
      <div className="w-full max-w-6xl flex flex-col gap-6">
        <GameHeader
          dayOfMonth={c.dayOfMonth}
          month={c.month}
          activeScenario={c.activeScenario}
          activeDifficulty={c.activeDifficulty}
          activeInvestor={c.activeInvestor}
          investorRelations={c.investorRelations}
          scenarioProgress={c.scenarioProgress}
          finance={c.finance}
          gameState={c.gameState}
          isAdvancingDay={c.isAdvancingDay}
          hasAnySaveData={c.hasAnySaveData()}
          formatMoney={c.formatMoney}
          onManualRepayLoan={c.handleManualRepayLoan}
          onNextDay={c.handleNextDay}
          onOpenSave={() => c.setShowSaveModal(true)}
          onOpenLoad={() => c.setShowLoadModal(true)}
          onRestart={c.handleRestart}
        />

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 flex flex-col gap-4 overflow-hidden">
            <ModuleNavigation
              moduleGroups={c.moduleGroups}
              activeGroup={c.activeGroup}
              activeTab={c.activeTab}
              onSelectTab={c.setActiveTab}
            />

            <ScenarioStatusPanel
              activeScenario={c.activeScenario}
              scenarioProgress={c.scenarioProgress}
              isFreeScenario={c.isFreeScenario}
              scenarioDurationDays={c.scenarioDurationDays}
              day={c.day}
              ownerEquity={c.ownerEquity}
              activeTutorialStep={c.activeTutorialStep}
              formatMoney={c.formatMoney}
              onDismissTutorial={() => c.setTutorial(prev => ({ ...prev, dismissed: true }))}
              onSelectTab={c.setActiveTab}
            />

            {c.activeTab === 'dashboard' && (
              <>
                <DashboardOverview
                  month={c.month}
                  dayOfMonth={c.dayOfMonth}
                  briefingMetrics={c.briefingMetrics}
                  todoQueue={c.todoQueue}
                  dailyChecklist={c.dailyChecklist}
                  operatingRating={c.operatingRating}
                  operatingScore={c.operatingScore}
                  feedbackState={c.feedbackState}
                  latestBadges={c.latestBadges}
                  hasProfitSample={c.hasProfitSample}
                  netProfit={c.netProfit}
                  currentLossDrivers={c.currentLossDrivers}
                  unlockedAchievements={c.unlockedAchievements}
                  formatMoney={c.formatMoney}
                  onOpenBriefing={() => c.setShowBriefingModal(true)}
                  onOpenTask={c.openTaskTarget}
                />

                <ApprovalCenter
                  pendingApprovalCases={c.pendingApprovalCases}
                  investorRelations={c.investorRelations}
                  formatMoney={c.formatMoney}
                  onPriceApproval={c.handlePriceApproval}
                  onResolveNegotiation={c.resolveNegotiation}
                  onComplaintResolution={c.handleComplaintResolution}
                />
              </>
            )}

            {c.activeTab !== 'dashboard' && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 min-h-[550px]">
                <OperationReminder
                  urgentOperationCount={c.urgentOperationCount}
                  unreadInboxCount={c.unreadInboxCount}
                  onOpenDashboard={() => c.setActiveTab('dashboard')}
                  onOpenInbox={() => c.openInboxForDay(null)}
                />

                <Suspense fallback={<TabLoadingFallback />}>
                {c.activeTab === 'draft' && (
                  <DraftManagementTab
                    unpaidDraftAmount={c.unpaidDraftAmount}
                    drafts={c.drafts}
                    draftCreditUsage={c.draftCreditUsage}
                    nearestDraft={c.nearestDraft}
                    warningDrafts={c.warningDrafts}
                    defaultedDrafts={c.defaultedDrafts}
                    activeDraftList={c.activeDraftList}
                    formatMoney={c.formatMoney}
                    getDraftRemainingDays={c.getDraftRemainingDays}
                    onRepayOverdueDraft={c.handleRepayOverdueDraft}
                  />
                )}

                {c.activeTab === 'store' && (
                  <StoreBlueprintTab
                    inventory={c.inventory}
                    pendingOrders={c.pendingOrders}
                    usedCars={c.usedCars}
                    usedCarShowroom={c.usedCarShowroom}
                    facility={c.facility}
                    afterSales={c.afterSales}
                    staff={c.staff}
                    finance={c.finance}
                    drafts={c.drafts}
                    investorRelations={c.investorRelations}
                    manufacturerPolicy={c.manufacturerPolicy}
                    monthlyStats={c.monthlyStats}
                    csi={c.csi}
                    competitors={c.competitors}
                    marketing={c.marketing}
                    storyState={c.storyState}
                    staffStoryMemory={c.staffStoryMemory}
                    logs={c.logs}
                    carModels={c.carModels}
                    dayOfMonth={c.dayOfMonth}
                    onSelectTab={c.setActiveTab}
                    onTrainMember={c.trainMember}
                    onTrainTech={c.handleTrainTech}
                    onToggleRetention={c.toggleRetention}
                    onToggleTechRetention={c.toggleTechRetention}
                  />
                )}

                {c.activeTab === 'finance' && (
                  <GmOfficeTab
                    gmWealth={c.gmWealth}
                    cashCoverageDays={c.cashCoverageDays}
                    investorRelations={c.investorRelations}
                    currentDay={c.day}
                    formatMoney={c.formatMoney}
                    onAdjustGmSalary={c.handleAdjustGmSalary}
                    onPersonalBailout={c.handlePersonalBailout}
                    onOpenNegotiation={c.openNegotiation}
                    onSelectTab={c.setActiveTab}
                  />
                )}

                {c.activeTab === 'sprint' && (
                  <VirtualSprintTab
                    virtualSales={c.virtualSales}
                    monthlyStats={c.monthlyStats}
                    dayOfMonth={c.dayOfMonth}
                    carModels={c.carModels}
                    inventory={c.inventory}
                    virtualPlan={c.virtualPlan}
                    setVirtualPlan={c.setVirtualPlan}
                    formatMoney={c.formatMoney}
                    getDynamicRebate={c.getDynamicRebate}
                    onVirtualSprint={c.handleVirtualSprint}
                  />
                )}

                {c.activeTab === 'showroom' && (
                  <ShowroomTab
                    inventory={c.inventory}
                    facility={c.facility}
                    carModels={c.carModels}
                    marketPrices={c.marketPrices}
                    manufacturerPolicy={c.manufacturerPolicy}
                    testDriveCars={c.testDriveCars}
                    usedCars={c.usedCars}
                    usedCarShowroom={c.usedCarShowroom}
                    formatMoney={c.formatMoney}
                    getDynamicRebate={c.getDynamicRebate}
                    getDynamicMsrp={c.getDynamicMsrp}
                    onAutoShowroom={c.handleAutoShowroom}
                    onApplySubsidy={c.handleApplySubsidy}
                    onMoveCar={c.handleMoveCar}
                    onWholesale={c.handleWholesale}
                    onRetireTestDrive={c.handleRetireTestDrive}
                    onSetTestDrive={c.handleSetTestDrive}
                    onUpdatePrice={c.handleUpdatePrice}
                    onPriceBlur={c.handlePriceBlur}
                  />
                )}

                {c.activeTab === 'order' && (
                  <OrderTab
                    pendingOrders={c.pendingOrders}
                    currentDay={c.day}
                    carModels={c.carModels}
                    manufacturerPolicy={c.manufacturerPolicy}
                    getDynamicRebate={c.getDynamicRebate}
                    getDynamicMsrp={c.getDynamicMsrp}
                    onOpenOrderForm={c.setOrderForm}
                  />
                )}

                {c.activeTab === 'marketing' && (
                  <MarketingTab
                    marketing={c.marketing}
                    leadChannels={c.leadChannels}
                    totalLeadPool={c.totalLeadPool}
                    monthlyStats={c.monthlyStats}
                    dccCount={c.dccCount}
                    salesCount={c.salesCount}
                    finance={c.finance}
                    currentDay={c.day}
                    aiAdCopy={c.aiAdCopy}
                    isGeneratingAd={c.isGeneratingAd}
                    inventory={c.inventory}
                    formatMoney={c.formatMoney}
                    onMarketingBudgetChange={(budgetKey, value) => c.setMarketing(prev => ({
                      ...prev,
                      [budgetKey]: value,
                      ...(budgetKey === 'leadPurchaseBudget' ? { budget: value } : {}),
                    }))}
                    onLaunchActivity={c.launchActivity}
                    onGenerateAIAd={c.handleGenerateAIAd}
                  />
                )}

                {c.activeTab === 'customer' && (
                  <CustomerNegotiationTab
                    customerDeals={c.customerDeals}
                    estimateDealAddons={c.estimateDealAddons}
                    formatMoney={c.formatMoney}
                    onCustomerDeal={c.handleCustomerDeal}
                  />
                )}

                {c.activeTab === 'opportunities' && (
                  <SalesOpportunityTab
                    currentDay={c.day}
                    formatMoney={c.formatMoney}
                    onOpportunityAction={c.handleSalesOpportunityAction}
                    salesOpportunities={[...(c.salesOpportunities?.active || []), ...(c.salesOpportunities?.history || [])]}
                  />
                )}

                {c.activeTab === 'crm' && (
                  <CustomerCenterTab
                    currentDay={c.day}
                    customerLifecycle={c.customerLifecycle}
                    formatMoney={c.formatMoney}
                    onCustomerFollowUp={c.handleCustomerFollowUp}
                  />
                )}

                {c.activeTab === 'events' && (
                  <OperatingEventsTab
                    activeDifficulty={c.activeDifficulty}
                    currentDay={c.day}
                    formatMoney={c.formatMoney}
                    logs={c.logs}
                    managerInbox={c.managerInbox}
                    onOpenInbox={c.openInboxForDay}
                    onResolveEvent={c.handleResolveOperatingEvent}
                    operatingEvents={c.operatingEvents}
                  />
                )}

                {c.activeTab === 'reports' && (
                  <FinancialReportsTab
                    monthlyStats={c.monthlyStats}
                    drafts={c.drafts}
                    finance={c.finance}
                    gmWealth={c.gmWealth}
                    feedbackState={c.feedbackState}
                    getRatingMeta={c.getRatingMeta}
                    excellentMonthCount={c.excellentMonthCount}
                    ownerEquity={c.ownerEquity}
                    strategy={c.strategy}
                    financeReportView={c.financeReportView}
                    financeSnapshot={c.financeSnapshot}
                    dailyLedger={c.dailyLedger}
                    month={c.month}
                    formatMoney={c.formatMoney}
                    onFinanceReportViewChange={c.setFinanceReportView}
                    onStrategyChange={c.handleStrategyChange}
                  />
                )}

                {c.activeTab === 'facility' && (
                  <FacilityUpgradeTab
                    facility={c.facility}
                    inventory={c.inventory}
                    monthlyStats={c.monthlyStats}
                    formatMoney={c.formatMoney}
                    onUpgradeFacility={c.upgradeFacility}
                  />
                )}

                {c.activeTab === 'staff' && (
                  <StaffManagementTab
                    staff={c.staff}
                    afterSales={c.afterSales}
                    facility={c.facility}
                    activeRegion={c.activeRegion}
                    staffStoryMemory={c.staffStoryMemory}
                    formatMoney={c.formatMoney}
                    onUpgradeFacility={c.upgradeFacility}
                    onHireStaff={c.hireStaff}
                    onToggleRetention={c.toggleRetention}
                    onTrainMember={c.trainMember}
                    onHireTech={c.handleHireTech}
                    onToggleTechRetention={c.toggleTechRetention}
                    onTrainTech={c.handleTrainTech}
                  />
                )}

                {c.activeTab === 'usedcar' && (
                  <UsedCarTab
                    usedCars={c.usedCars}
                    usedCarShowroom={c.usedCarShowroom}
                    monthlyStats={c.monthlyStats}
                    formatMoney={c.formatMoney}
                    onBuildShowroom={c.handleBuildShowroom}
                    onUpgradeShowroom={c.handleUpgradeShowroom}
                    onPrepUsedCar={c.handlePrepUsedCar}
                    onUsedCarRetail={c.handleUsedCarRetail}
                    onUsedCarWholesale={c.handleUsedCarWholesale}
                    onUsedCarPriceChange={c.handleUsedCarPriceChange}
                  />
                )}

                {c.activeTab === 'aftersales' && (
                  <AfterSalesTab
                    techCount={c.techCount}
                    techAvgSkill={c.techAvgSkill}
                    serviceCount={c.serviceCount}
                    serviceAvgSkill={c.serviceAvgSkill}
                    monthlyStats={c.monthlyStats}
                    insuranceRenewals={c.insuranceRenewals}
                    formatMoney={c.formatMoney}
                    onOpenStaff={() => c.setActiveTab('staff')}
                  />
                )}

                {c.activeTab === 'derivConfig' && (
                  <DerivativeConfigTab
                    strategy={c.strategy}
                    monthlyStats={c.monthlyStats}
                    formatMoney={c.formatMoney}
                    onStrategyChange={c.handleStrategyChange}
                  />
                )}

                {c.activeTab === 'csi' && (
                  <CsiTab
                    csi={c.csi}
                    onCareAction={c.handleCsiCareAction}
                    onFollowUpAction={c.handleCsiFollowUpAction}
                  />
                )}

                {c.activeTab === 'market' && (
                  <MarketTab
                    activeDifficulty={c.activeDifficulty}
                    competitors={c.competitors}
                    normalizedMarketShare={c.normalizedMarketShare}
                    marketShareSegments={c.marketShareSegments}
                    visibleCompetitorStores={c.visibleCompetitorStores}
                    hiddenCompetitorCount={c.hiddenCompetitorCount}
                    activeRegion={c.activeRegion}
                    marketEnvironment={c.marketEnvironment}
                    finance={c.finance}
                    formatMoney={c.formatMoney}
                    onCompetitorCountermeasure={c.handleCompetitorCountermeasure}
                    onCompetitorIntelAction={c.handleCompetitorIntelAction}
                  />
                )}

                {c.activeTab === 'rebate' && (
                  <RebateTab
                    aiAdvice={c.aiAdvice}
                    isGeneratingAdvice={c.isGeneratingAdvice}
                    manufacturerPolicy={c.manufacturerPolicy}
                    monthlyStats={c.monthlyStats}
                    targetProgress={c.targetProgress}
                    dayOfMonth={c.dayOfMonth}
                    inviteRateVal={c.inviteRateVal}
                    convertRateVal={c.convertRateVal}
                    csi={c.csi}
                    formatMoney={c.formatMoney}
                    onAskAIConsultant={c.handleAskAIConsultant}
                  />
                )}
                </Suspense>
              </div>
            )}
          </div>

          {c.activeTab === 'dashboard' && (
            <MessageCenterPanel
              messageFeed={c.messageFeed}
              visibleMessageFeed={c.visibleMessageFeed}
              expandedMessageIds={c.expandedMessageIds}
              onOpenInbox={c.openInboxForDay}
              onToggleExpandedMessage={c.toggleExpandedMessage}
            />
          )}
        </div>
      </div>

      <GameModals
        modalConfig={c.modalConfig}
        onCloseModal={c.closeModal}
        currentEnding={c.currentEnding}
        endingMeta={c.endingMeta}
        balanceAssets={c.balanceAssets}
        finance={c.finance}
        ownerEquity={c.ownerEquity}
        formatMoney={c.formatMoney}
        onViewEndingReport={() => {
          c.setActiveTab('reports');
          c.setFinanceReportView('trend');
          c.setEndingModalDismissed(true);
        }}
        onRestart={c.handleRestart}
        monthlySummaryModal={c.monthlySummaryModal}
        onCloseMonthlySummary={() => c.setMonthlySummaryModal(null)}
        onViewMonthlyReports={() => {
          c.setActiveTab('reports');
          c.setFinanceReportView('profit');
          c.setMonthlySummaryModal(null);
        }}
        onViewMonthlyRebate={() => {
          c.setActiveTab('rebate');
          c.setMonthlySummaryModal(null);
        }}
        onOpenMonthlyInbox={(targetDay) => {
          c.openInboxForDay(targetDay);
          c.setMonthlySummaryModal(null);
        }}
        orderForm={c.orderForm}
        facility={c.facility}
        inventory={c.inventory}
        pendingOrders={c.pendingOrders}
        drafts={c.drafts}
        getDraftFeeRate={c.getDraftFeeRate}
        getAvailableDraftCredit={c.getAvailableDraftCredit}
        onUpdateOrderForm={c.setOrderForm}
        onCancelOrder={() => c.setOrderForm({ isOpen: false, model: null, quantity: 1, color: '黑', paymentMethod: 'draft3' })}
        onConfirmOrder={c.executeOrder}
        selectedLogDay={c.selectedLogDay}
        logs={c.logs}
        dailyLedger={c.dailyLedger}
        currentDay={c.day}
        onCloseDayLog={() => c.setSelectedLogDay(null)}
        onSelectLogDay={c.setSelectedLogDay}
        showBriefingModal={c.showBriefingModal}
        month={c.month}
        dayOfMonth={c.dayOfMonth}
        briefingMetrics={c.briefingMetrics}
        marketEnvironment={c.marketEnvironment}
        todoQueue={c.todoQueue}
        onOpenBriefingTask={(item) => {
          c.openTaskTarget(item);
          c.setShowBriefingModal(false);
        }}
        onCloseBriefing={() => c.setShowBriefingModal(false)}
        showInboxModal={c.showInboxModal}
        selectedInboxDay={c.selectedInboxDay}
        inboxFilter={c.inboxFilter}
        setInboxFilter={c.setInboxFilter}
        managerInbox={c.managerInbox}
        filteredInboxMessages={c.filteredInboxMessages}
        readInboxIds={c.readInboxIds}
        expandedInboxIds={c.expandedInboxIds}
        storyState={c.storyState}
        onResolveStoryAction={c.handleResolveStoryAction}
        onCloseInbox={() => c.setShowInboxModal(false)}
        onSelectInboxDay={c.setSelectedInboxDay}
        onToggleRead={c.toggleInboxRead}
        onToggleExpandedInbox={c.toggleExpandedInbox}
        showSaveModal={c.showSaveModal}
        getSaveSlots={c.getSaveSlots}
        renameSlot={c.renameSlot}
        renameValue={c.renameValue}
        setRenameSlot={c.setRenameSlot}
        setRenameValue={c.setRenameValue}
        onRenameSlot={c.handleRenameSlot}
        onDeleteSlot={c.handleDeleteSlot}
        onSaveToSlot={c.handleSaveToSlot}
        onCloseSave={() => c.setShowSaveModal(false)}
        showLoadModal={c.showLoadModal}
        loadEntries={c.getLoadSlotEntries()}
        onLoadFromSlot={c.handleLoadFromSlot}
        onCloseLoad={c.closeLoadModal}
      />
    </div>
  );
}
