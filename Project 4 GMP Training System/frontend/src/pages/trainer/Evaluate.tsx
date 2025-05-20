import { useEffect, useState } from 'react';
import api from '../../api';
import Stamp from '../../components/Stamp';
import { Attempt, ApiResponse } from '../../types';

export default function Evaluate() {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [remarks, setRemarks] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState('');

  const load = () => api.get<ApiResponse<Attempt[]>>('/assessments/attempts/pending').then((r) => setAttempts(r.data.data));
  useEffect(() => { load(); }, []);

  const evaluate = async (id: string, result: 'PASSED' | 'FAILED') => {
    try {
      await api.post(`/assessments/attempts/${id}/evaluate`, { result, remarks: remarks[id] || '' });
      setMsg(`Attempt recorded as ${result}.`);
      load();
    } catch (err: any) {
      setMsg(err.response?.data?.message || 'Evaluation failed');
    }
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <h1 className="text-xl font-semibold">Evaluate attempts</h1>
      {msg && <p className="text-sm text-navy">{msg}</p>}
      {attempts.length === 0 && <p className="text-sm text-slate-400">No attempts awaiting evaluation.</p>}
      {attempts.map((a) => {
        const pct = a.totalMarks ? Math.round((a.score / a.totalMarks) * 100) : 0;
        const passMark = a.assessment?.passMarkPct ?? 80;
        return (
          <div key={a.id} className="card space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium text-sm">{a.user?.employeeId} — {a.user?.name} <span className="text-slate-400">({a.user?.department})</span></p>
                <p className="text-sm text-slate-500">{a.assessment?.training.code}: {a.assessment?.title}</p>
                <p className="text-xs text-slate-400 mt-1">Submitted <Stamp iso={a.submittedAt} /></p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-semibold">{pct}%</p>
                <p className="text-xs text-slate-500">{a.score}/{a.totalMarks} marks · pass ≥ {passMark}%</p>
              </div>
            </div>
            <input
              className="field"
              placeholder="Evaluation remarks (recorded in the audit trail)"
              value={remarks[a.id] || ''}
              onChange={(e) => setRemarks((r) => ({ ...r, [a.id]: e.target.value }))}
            />
            <div className="flex gap-3">
              <button className="btn bg-passed text-white hover:opacity-90" onClick={() => evaluate(a.id, 'PASSED')}>Record PASS</button>
              <button className="btn bg-failed text-white hover:opacity-90" onClick={() => evaluate(a.id, 'FAILED')}>Record FAIL</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
