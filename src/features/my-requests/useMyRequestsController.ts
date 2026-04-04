'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useStore, type LeaveType } from '@/lib/store';
import type { RequestsHubTab } from '@/components/requests/RequestsHubShell';
import type { RequestStatusFilter } from './types';

export function useMyRequestsController() {
  const searchParams = useSearchParams();
  const { currentUser, leaves, applyLeave, manualTimeRequests, applyManualTimeRequest } = useStore();

  const [activeTab, setActiveTab] = useState<RequestsHubTab>('leave');
  const [leaveStatusFilter, setLeaveStatusFilter] = useState<RequestStatusFilter>('Pending');
  const [manualStatusFilter, setManualStatusFilter] = useState<RequestStatusFilter>('Pending');
  const [leaveFormOpen, setLeaveFormOpen] = useState(false);
  const [manualFormOpen, setManualFormOpen] = useState(false);

  const [leaveType, setLeaveType] = useState<LeaveType>('Sick');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  const [manualDate, setManualDate] = useState('');
  const [clockInTime, setClockInTime] = useState('09:00');
  const [clockOutTime, setClockOutTime] = useState('18:00');
  const [breakInTime, setBreakInTime] = useState('');
  const [breakOutTime, setBreakOutTime] = useState('');
  const [manualReason, setManualReason] = useState('');

  const tabParam = searchParams.get('tab');
  useEffect(() => {
    if (tabParam === 'manual') {
      setActiveTab('manual');
      setManualFormOpen(true);
    } else if (tabParam === 'leave') {
      setActiveTab('leave');
      setLeaveFormOpen(true);
    }
  }, [tabParam]);

  const handleTabChange = (tab: RequestsHubTab) => {
    setActiveTab(tab);
    setLeaveFormOpen(false);
    setManualFormOpen(false);
  };

  const myLeaves = useMemo(
    () =>
      leaves
        .filter((l) => l.userId === currentUser?.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [leaves, currentUser?.id]
  );

  const myManualTimeRequests = useMemo(
    () =>
      manualTimeRequests
        .filter((r) => r.userId === currentUser?.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [manualTimeRequests, currentUser?.id]
  );

  const filteredLeaves = useMemo(
    () => myLeaves.filter((l) => leaveStatusFilter === 'All' || l.status === leaveStatusFilter),
    [myLeaves, leaveStatusFilter]
  );

  const filteredManual = useMemo(
    () => myManualTimeRequests.filter((r) => manualStatusFilter === 'All' || r.status === manualStatusFilter),
    [myManualTimeRequests, manualStatusFilter]
  );

  const submitLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!startDate || !endDate) {
      alert('Please fill in both start and end dates.');
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      alert('End date cannot be before start date.');
      return;
    }
    applyLeave({ userId: currentUser.id, type: leaveType, startDate, endDate, reason });
    alert('Leave request submitted successfully.');
    setStartDate('');
    setEndDate('');
    setReason('');
    setLeaveFormOpen(false);
  };

  const submitManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!manualDate) {
      alert('Please select a date.');
      return;
    }
    if (breakInTime && !breakOutTime) {
      alert('If you add Break In, you must also add Break Out.');
      return;
    }
    if (!breakInTime && breakOutTime) {
      alert('If you add Break Out, you must also add Break In.');
      return;
    }
    applyManualTimeRequest({
      date: manualDate,
      clockInTime,
      clockOutTime,
      breakInTime: breakInTime || undefined,
      breakOutTime: breakOutTime || undefined,
      reason: manualReason || undefined,
    });
    alert('Manual time request submitted successfully.');
    setManualDate('');
    setBreakInTime('');
    setBreakOutTime('');
    setManualReason('');
    setManualFormOpen(false);
  };

  const onStatusFilterChange = (v: string) => {
    const next = v as RequestStatusFilter;
    if (activeTab === 'leave') setLeaveStatusFilter(next);
    else setManualStatusFilter(next);
  };

  return {
    activeTab,
    handleTabChange,
    leaveStatusFilter,
    manualStatusFilter,
    onStatusFilterChange,
    leaveFormOpen,
    setLeaveFormOpen,
    manualFormOpen,
    setManualFormOpen,
    myLeaves,
    myManualTimeRequests,
    filteredLeaves,
    filteredManual,
    leaveForm: {
      leaveType,
      setLeaveType,
      startDate,
      setStartDate,
      endDate,
      setEndDate,
      reason,
      setReason,
      onSubmit: submitLeave,
    },
    manualForm: {
      manualDate,
      setManualDate,
      clockInTime,
      setClockInTime,
      clockOutTime,
      setClockOutTime,
      breakInTime,
      setBreakInTime,
      breakOutTime,
      setBreakOutTime,
      manualReason,
      setManualReason,
      onSubmit: submitManual,
    },
  };
}
