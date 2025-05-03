import { useEffect, useState } from 'react';
import api from '../../api';
import Stamp from '../../components/Stamp';
import { AuditLog, ApiResponse } from '../../types';
import { gmpDateTime } from '../../format';

export default function AuditTrail() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [action, setAction] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const load = () => {
    const params = new URLSearchParams();
    if (action) params.set('action', action);
    if (from) params.set('from', new Date(from).toISOString());
    if (to) params.set('to', new Date(to).toISOString());
    api.get<ApiResponse<AuditLog[]>>(`/audit?${params}`).then((r) => setLogs(r.data.data));
  };
  useEffect(() => { load(); }, []);

  const actions = ['LOGIN', 'LOGIN_FAILED', 'LOGOUT', 'USER_CREATED', 'USER_ROLE_CHANGED', 'TRAINING_CREATED',
    'TRAINING_ASSIGNED', 'ASSESSMENT_CREATED', 'ATTEMPT_SUBMITTED', 'ATTEMPT_EVALUATED', 'NOTIFICATION_SENT',
    'REPORT_VIEWED', 'AUDIT_TRAIL_VIEWED'];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Audit trail</h1>
        <button className="btn-primary" onClick={() => window.print()}>Print audit trail</button>
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <select className="field max-w-56" value={action} onChange={(e) => setAction(e.target.value)}>
          <option value="">All actions</option>
          {actions.map((a) => <option key={a}>{a}</option>)}
        </select>
        <input className="field max-w-52" type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} />
        <input className="field max-w-52" type="datetime-local" value={to} onChange={(e) => setTo(e.target.value)} />
        <button className="btn-ghost" onClick={load}>Apply filters</button>
      </div>

      {/* Controlled-document style print region */}
      <div className="print-area card p-0">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">SYSTEM AUDIT TRAIL — CONTROLLED RECORD</p>
            <p className="text-xs text-slate-500">GMP Training Management System · Records are read-only and cannot be modified or deleted.</p>
          </div>
          <p className="stamp">Printed: {gmpDateTime(new Date().toISOString())}</p>
        </div>
        <table className="w-full">
          <thead>
            <tr>
              <th className="th">Date & time</th>
              <th className="th">Performed by</th>
              <th className="th">Action</th>
              <th className="th">Details</th>
              <th className="th">IP</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 && <tr><td className="td text-slate-400" colSpan={5}>No audit records for the selected filters.</td></tr>}
            {logs.map((l) => (
              <tr key={l.id}>
                <td className="td"><Stamp iso={l.timestamp} /></td>
                <td className="td">{l.user ? `${l.user.employeeId} — ${l.user.name} (${l.user.role})` : 'System / unknown'}</td>
                <td className="td"><span className="font-mono text-xs">{l.action}</span></td>
                <td className="td text-sm">{l.details || '—'}</td>
                <td className="td font-mono text-xs">{l.ipAddress || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
