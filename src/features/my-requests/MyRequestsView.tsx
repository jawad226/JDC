'use client';

import { RequestsHubShell } from '@/components/requests/RequestsHubShell';
import { STATUS_FILTER_OPTIONS } from './constants';
import { leaveSectionTitle, manualSectionTitle } from './copy';
import { LeaveRequestsPanel } from './LeaveRequestsPanel';
import { ManualTimeRequestsPanel } from './ManualTimeRequestsPanel';
import { useMyRequestsController } from './useMyRequestsController';
import type { RequestStatusFilter } from './types';

export function MyRequestsView() {
  const c = useMyRequestsController();

  const sectionTitle =
    c.activeTab === 'leave' ? leaveSectionTitle(c.leaveStatusFilter) : manualSectionTitle(c.manualStatusFilter);

  const statusFilterOptions = STATUS_FILTER_OPTIONS;
  const statusFilterValue =
    c.activeTab === 'leave' ? c.leaveStatusFilter : c.manualStatusFilter;

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      <RequestsHubShell
        activeTab={c.activeTab}
        onTabChange={c.handleTabChange}
        sectionTitle={sectionTitle}
        statusValue={statusFilterValue}
        onStatusChange={(v) => c.onStatusFilterChange(v as RequestStatusFilter)}
        statusOptions={statusFilterOptions}
      >
        <>
          {c.activeTab === 'leave' ? (
            <LeaveRequestsPanel
              leaveStatusFilter={c.leaveStatusFilter}
              rows={c.filteredLeaves}
              totalCount={c.myLeaves.length}
              formOpen={c.leaveFormOpen}
              onCloseModal={() => c.setLeaveFormOpen(false)}
              onOpenModal={() => c.setLeaveFormOpen(true)}
              form={c.leaveForm}
            />
          ) : (
            <ManualTimeRequestsPanel
              manualStatusFilter={c.manualStatusFilter}
              rows={c.filteredManual}
              totalCount={c.myManualTimeRequests.length}
              formOpen={c.manualFormOpen}
              onCloseModal={() => c.setManualFormOpen(false)}
              onOpenModal={() => c.setManualFormOpen(true)}
              form={c.manualForm}
            />
          )}
        </>
      </RequestsHubShell>
    </div>
  );
}
