export function AuthAlerts({
  error,
  success,
  compact = false,
}: {
  error: string | null;
  success: string | null;
  compact?: boolean;
}) {
  const box = compact ? 'mb-2.5 rounded-lg px-3 py-2 text-xs' : 'mb-4 rounded-xl px-4 py-3 text-sm';
  return (
    <>
      {error && (
        <div className={`${box} border border-rose-100 bg-rose-50 text-rose-800`}>
          {error}
        </div>
      )}
      {success && (
        <div className={`${box} border border-emerald-100 bg-emerald-50 break-words text-emerald-900`}>
          {success}
        </div>
      )}
    </>
  );
}
