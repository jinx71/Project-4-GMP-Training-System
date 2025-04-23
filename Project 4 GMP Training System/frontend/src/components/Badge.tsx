const STYLES: Record<string, string> = {
  COMPLETED: 'bg-passed/10 text-passed border-passed/30',
  PASSED: 'bg-passed/10 text-passed border-passed/30',
  ASSIGNED: 'bg-assigned/10 text-assigned border-assigned/30',
  PENDING: 'bg-pending/10 text-pending border-pending/30',
  SUBMITTED: 'bg-pending/10 text-pending border-pending/30',
  FAILED: 'bg-failed/10 text-failed border-failed/30'
};

export default function Badge({ status }: { status: string }) {
  return (
    <span className={`inline-block border rounded px-2 py-0.5 text-[11px] font-semibold tracking-wide ${STYLES[status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
      {status}
    </span>
  );
}
