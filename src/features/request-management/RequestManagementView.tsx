'use client';

import { Search } from 'lucide-react';
import { RequestsHubShell, REQUESTS_HUB_TITLES } from '@/components/requests/RequestsHubShell';
import { REVIEW_STATUS_OPTIONS } from './constants';
import type { ReviewStatusFilter } from './constants';
import { LeaveReviewPanel } from './LeaveReviewPanel';
import { ManualReviewPanel } from './ManualReviewPanel';
import { useRequestManagementController } from './useRequestManagementController';

export function RequestManagementView() {
  const c = useRequestManagementController();

  const sectionTitle = REQUESTS_HUB_TITLES[c.activeTab];

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      <RequestsHubShell
        activeTab={c.activeTab}
        onTabChange={c.onTabChange}
        sectionTitle={sectionTitle}
        statusValue={c.statusFilter}
        onStatusChange={(v) => c.setStatusFilter(v as ReviewStatusFilter)}
        statusOptions={REVIEW_STATUS_OPTIONS}
      >
        <>
          <div className="mb-4 flex justify-end">
            <div className="flex w-full max-w-sm items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
              <Search className="h-4 w-4 shrink-0 text-slate-400" />
              <input
                type="search"
                placeholder="Search employee..."
                value={c.searchTerm}
                onChange={(e) => c.setSearchTerm(e.target.value)}
                className="w-full border-0 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          {c.activeTab === 'leave' && (
            <LeaveReviewPanel
              rows={c.sortedLeave}
              getUsername={c.getUsername}
              canReview={c.canReviewLeave}
              onApprove={(id) => {
                c.updateLeavetatus(id, 'Approved');
                alert('Leave approved!');
              }}
              onReject={(id) => {
                c.updateLeavetatus(id, 'Rejected');
                alert('Leave rejected!');
              }}
            />
          )}

          {c.activeTab === 'manual' && (
            <ManualReviewPanel
              rows={c.sortedManual}
              getUsername={c.getUsername}
              canReview={c.canReviewManual}
              activeRejectId={c.activeRejectId}
              rejectFeedback={c.rejectFeedback}
              setRejectFeedback={c.setRejectFeedback}
              setActiveRejectId={c.setActiveRejectId}
              onApprove={(id) => {
                c.approveManualTimeRequest(id);
                alert('Manual time approved!');
              }}
              onRejectConfirm={(id) => {
                const trimmed = c.rejectFeedback.trim();
                if (!trimmed) {
                  alert('Feedback is required.');
                  return;
                }
                c.rejectManualTimeRequest(id, trimmed);
                alert('Manual time rejected!');
                c.setActiveRejectId(null);
                c.setRejectFeedback('');
              }}
            />
          )}
        </>
      </RequestsHubShell>
    </div>
  );
}
