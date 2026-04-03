import { Clock, CheckCircle2, XCircle } from 'lucide-react';

type Status = 'Pending' | 'Approved' | 'Rejected';

export function RequestStatusBadge({ status }: { status: Status }) {
  if (status === 'Pending') {
    return (
      <span className="inline-flex items-center rounded-full border border-orange-100 bg-orange-50 px-2 py-0.5 text-xs font-semibold text-orange-600">
        <Clock className="mr-1 h-3 w-3" /> Pending
      </span>
    );
  }
  if (status === 'Approved') {
    return (
      <span className="inline-flex items-center rounded-full border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-600">
        <CheckCircle2 className="mr-1 h-3 w-3" /> Approved
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full border border-rose-100 bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-600">
      <XCircle className="mr-1 h-3 w-3" /> Rejected
    </span>
  );
}
