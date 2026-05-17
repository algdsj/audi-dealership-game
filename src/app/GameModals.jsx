import { lazy, Suspense } from 'react';
import { ConfirmModal } from '../shared/ui/modals/ConfirmModal.jsx';

const BriefingModal = lazy(() => import('../features/dashboard/BriefingModal.jsx').then(module => ({ default: module.BriefingModal })));
const DayLogModal = lazy(() => import('../features/logs/DayLogModal.jsx').then(module => ({ default: module.DayLogModal })));
const InboxModal = lazy(() => import('../features/inbox/InboxModal.jsx').then(module => ({ default: module.InboxModal })));
const OrderConfigModal = lazy(() => import('../features/order/OrderConfigModal.jsx').then(module => ({ default: module.OrderConfigModal })));
const EndingModal = lazy(() => import('../features/results/EndingModal.jsx').then(module => ({ default: module.EndingModal })));
const MonthlySummaryModal = lazy(() => import('../features/results/MonthlySummaryModal.jsx').then(module => ({ default: module.MonthlySummaryModal })));
const SaveSlotsModal = lazy(() => import('../features/save/SaveLoadModals.jsx').then(module => ({ default: module.SaveSlotsModal })));
const LoadSlotsModal = lazy(() => import('../features/save/SaveLoadModals.jsx').then(module => ({ default: module.LoadSlotsModal })));

function ModalLoadingFallback() {
  return null;
}

export function GameModals({
  modalConfig,
  onCloseModal,
  currentEnding,
  endingMeta,
  balanceAssets,
  finance,
  ownerEquity,
  formatMoney,
  onViewEndingReport,
  onRestart,
  monthlySummaryModal,
  onCloseMonthlySummary,
  onViewMonthlyReports,
  onViewMonthlyRebate,
  onOpenMonthlyInbox,
  orderForm,
  facility,
  inventory,
  pendingOrders,
  drafts,
  getDraftFeeRate,
  getAvailableDraftCredit,
  onUpdateOrderForm,
  onCancelOrder,
  onConfirmOrder,
  selectedLogDay,
  logs,
  dailyLedger,
  currentDay,
  onCloseDayLog,
  onSelectLogDay,
  showBriefingModal,
  month,
  dayOfMonth,
  briefingMetrics,
  marketEnvironment,
  todoQueue,
  onOpenBriefingTask,
  onCloseBriefing,
  showInboxModal,
  selectedInboxDay,
  inboxFilter,
  setInboxFilter,
  managerInbox,
  filteredInboxMessages,
  readInboxIds,
  expandedInboxIds,
  storyState,
  onResolveStoryAction,
  onCloseInbox,
  onSelectInboxDay,
  onToggleRead,
  onToggleExpandedInbox,
  showSaveModal,
  getSaveSlots,
  renameSlot,
  renameValue,
  setRenameSlot,
  setRenameValue,
  onRenameSlot,
  onDeleteSlot,
  onSaveToSlot,
  onCloseSave,
  showLoadModal,
  loadEntries,
  onLoadFromSlot,
  onCloseLoad,
}) {
  return (
    <>
      <ConfirmModal config={modalConfig} onClose={onCloseModal} />

      <Suspense fallback={<ModalLoadingFallback />}>
        {currentEnding && (
          <EndingModal
            currentEnding={currentEnding}
            endingMeta={endingMeta}
            balanceAssets={balanceAssets}
            finance={finance}
            ownerEquity={ownerEquity}
            formatMoney={formatMoney}
            onViewReport={onViewEndingReport}
            onRestart={onRestart}
          />
        )}

        {monthlySummaryModal && (
          <MonthlySummaryModal
            summary={monthlySummaryModal}
            formatMoney={formatMoney}
            onClose={onCloseMonthlySummary}
            onViewReports={onViewMonthlyReports}
            onViewRebate={onViewMonthlyRebate}
            onOpenInbox={onOpenMonthlyInbox}
          />
        )}

        {orderForm?.isOpen && (
          <OrderConfigModal
            orderForm={orderForm}
            facility={facility}
            inventory={inventory}
            pendingOrders={pendingOrders}
            drafts={drafts}
            finance={finance}
            formatMoney={formatMoney}
            getDraftFeeRate={getDraftFeeRate}
            getAvailableDraftCredit={getAvailableDraftCredit}
            onUpdateOrderForm={onUpdateOrderForm}
            onCancel={onCancelOrder}
            onConfirm={onConfirmOrder}
          />
        )}

        {selectedLogDay !== null && (
          <DayLogModal
            selectedLogDay={selectedLogDay}
            logs={logs}
            dailyLedger={dailyLedger}
            currentDay={currentDay}
            formatMoney={formatMoney}
            onClose={onCloseDayLog}
            onSelectDay={onSelectLogDay}
          />
        )}

        {showBriefingModal && (
          <BriefingModal
            isOpen={showBriefingModal}
            month={month}
            dayOfMonth={dayOfMonth}
            briefingMetrics={briefingMetrics}
            marketEnvironment={marketEnvironment}
            todoQueue={todoQueue}
            onOpenTask={onOpenBriefingTask}
            onClose={onCloseBriefing}
          />
        )}

        {showInboxModal && (
          <InboxModal
            isOpen={showInboxModal}
            selectedInboxDay={selectedInboxDay}
            currentDay={currentDay}
            inboxFilter={inboxFilter}
            setInboxFilter={setInboxFilter}
            managerInbox={managerInbox}
            filteredInboxMessages={filteredInboxMessages}
            readInboxIds={readInboxIds}
            expandedInboxIds={expandedInboxIds}
            logs={logs}
            storyState={storyState}
            onResolveStoryAction={onResolveStoryAction}
            onClose={onCloseInbox}
            onSelectInboxDay={onSelectInboxDay}
            onToggleRead={onToggleRead}
            onToggleExpanded={onToggleExpandedInbox}
          />
        )}

        {showSaveModal && (
          <SaveSlotsModal
            isOpen={showSaveModal}
            getSaveSlots={getSaveSlots}
            renameSlot={renameSlot}
            renameValue={renameValue}
            setRenameSlot={setRenameSlot}
            setRenameValue={setRenameValue}
            onRenameSlot={onRenameSlot}
            onDeleteSlot={onDeleteSlot}
            onSaveToSlot={onSaveToSlot}
            onClose={onCloseSave}
          />
        )}

        {showLoadModal && (
          <LoadSlotsModal
            isOpen={showLoadModal}
            loadEntries={loadEntries}
            renameSlot={renameSlot}
            renameValue={renameValue}
            setRenameSlot={setRenameSlot}
            setRenameValue={setRenameValue}
            onRenameSlot={onRenameSlot}
            onDeleteSlot={onDeleteSlot}
            onLoadFromSlot={onLoadFromSlot}
            onClose={onCloseLoad}
          />
        )}
      </Suspense>
    </>
  );
}
