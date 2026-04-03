'use client';

import { useMemo, useState } from 'react';
import { useStore } from '@/lib/store';
import type { RequestsHubTab } from '@/components/requests/RequestsHubShell';
import type { ReviewStatusFilter } from './constants';

export function useRequestManagementController() {
  const {
    currentUser,
    leaves,
    users,
    updateLeaveStatus,
    manualTimeRequests,
    approveManualTimeRequest,
    rejectManualTimeRequest,
  } = useStore();

  const [activeTab, setActiveTab] = useState<RequestsHubTab>('leave');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReviewStatusFilter>('All');
  const [activeRejectId, setActiveRejectId] = useState<string | null>(null);
  const [rejectFeedback, setRejectFeedback] = useState('');

  const getUsername = (userId: string) => users.find((u) => u.id === userId)?.name || 'Unknown User';

  const filteredLeaves = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return leaves.filter((leave) => {
      const userName = (users.find((u) => u.id === leave.userId)?.name || 'Unknown User').toLowerCase();
      const matchesSearch = userName.includes(q);
      const matchesStatus = statusFilter === 'All' || leave.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [leaves, searchTerm, statusFilter, users]);

  const filteredManual = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return manualTimeRequests.filter((req) => {
      const userName = (users.find((u) => u.id === req.userId)?.name || 'Unknown User').toLowerCase();
      const matchesSearch = userName.includes(q);
      const matchesStatus = statusFilter === 'All' || req.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [manualTimeRequests, searchTerm, statusFilter, users]);

  const sortedLeaves = useMemo(
    () =>
      [...filteredLeaves].sort((a, b) => {
        if (a.status === 'Pending' && b.status !== 'Pending') return -1;
        if (a.status !== 'Pending' && b.status === 'Pending') return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }),
    [filteredLeaves]
  );

  const sortedManual = useMemo(
    () =>
      [...filteredManual].sort((a, b) => {
        if (a.status === 'Pending' && b.status !== 'Pending') return -1;
        if (a.status !== 'Pending' && b.status === 'Pending') return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }),
    [filteredManual]
  );

  const canReviewLeave = currentUser?.role === 'Admin' || currentUser?.role === 'HR';
  const canReviewManual = currentUser?.role === 'Admin' || currentUser?.role === 'HR';

  const onTabChange = (tab: RequestsHubTab) => {
    setActiveTab(tab);
    setActiveRejectId(null);
    setRejectFeedback('');
  };

  return {
    activeTab,
    onTabChange,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    sortedLeaves,
    sortedManual,
    getUsername,
    canReviewLeave,
    canReviewManual,
    updateLeaveStatus,
    approveManualTimeRequest,
    rejectManualTimeRequest,
    activeRejectId,
    setActiveRejectId,
    rejectFeedback,
    setRejectFeedback,
  };
}
