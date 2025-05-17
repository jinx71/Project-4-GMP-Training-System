import { useEffect, useState } from 'react';
import api from '../../api';
import Badge from '../../components/Badge';
import Stamp from '../../components/Stamp';
import { User, Assignment, Attempt, ApiResponse } from '../../types';
import { gmpDate } from '../../format';

interface Report {
  user: User;
  assignments: Assignment[];
  attempts: Attempt[];
}

export default function Reports() {
  const [users, setUsers] = useState<User[]>([]);
  const [selected, setSelected] = useState('');
  const [report, setReport] = useState<Report | null>(null);

  useEffect(() => {
    api.get<ApiResponse<User[]>>('/users').then((r) => setUsers(r.data.data.filter((u) => u.role !== 'ADMIN')));
  }, []);

  useEffect(() => {
    if (!selected) { setReport(null); return; }
    api.get<ApiResponse<Report>>(`/reports/users/${selected}`).then((r) => setReport(r.data.data));
  }, [selected]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Training reports</h1>
      <select className="field max-w-md" value={selected} onChange={(e) => setSelected(e.target.value)}>
        <option value="">Select an employee…</option>
        {users.map((u) => <option key={u.id} value={u.id}>{u.employeeId} — {u.name} ({u.department})</option>)}
      </select>

      {report && (
        <div className="space-y-4">
          <div className="card">
            <p className="font-semibold">{report.user.employeeId} — {report.user.name}</p>
            <p className="text-sm text-slate-500">{report.user.department} · {report.user.role} · {report.user.email}</p>
          </div>

          <div className="card p-0 overflow-x-auto">
            <p className="px-4 pt-4 text-sm font-semibold">Training assignments</p>
            <table className="w-full mt-2">
              <thead><tr><th className="th">Training</th><th className="th">Due</th><th className="th">Status</th><th className="th">Assigned</th><th className="th">Completed</th></tr></thead>
              <tbody>
                {report.assignments.length === 0 && <tr><td className="td text-slate-400" colSpan={5}>No assignments.</td></tr>}
                {report.assignments.map((a) => (
                  <tr key={a.id}>
                    <td className="td">{a.training.code} — {a.training.title}</td>
                    <td className="td">{gmpDate(a.dueDate)}</td>
                    <td className="td"><Badge status={a.status} /></td>
                    <td className="td"><Stamp iso={a.assignedAt} /></td>
                    <td className="td"><Stamp iso={a.completedAt} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card p-0 overflow-x-auto">
            <p className="px-4 pt-4 text-sm font-semibold">Assessment attempts</p>
            <table className="w-full mt-2">
              <thead><tr><th className="th">Assessment</th><th className="th">Score</th><th className="th">Result</th><th className="th">Submitted</th><th className="th">Evaluated</th></tr></thead>
              <tbody>
                {report.attempts.length === 0 && <tr><td className="td text-slate-400" colSpan={5}>No attempts.</td></tr>}
                {report.attempts.map((t) => (
                  <tr key={t.id}>
                    <td className="td">{t.assessment?.training.code}: {t.assessment?.title}</td>
                    <td className="td">{t.score}/{t.totalMarks}</td>
                    <td className="td"><Badge status={t.status} />{t.remarks && <p className="text-xs text-slate-500 mt-1">{t.remarks}</p>}</td>
                    <td className="td"><Stamp iso={t.submittedAt} /></td>
                    <td className="td"><Stamp iso={t.evaluatedAt} />{t.evaluatedBy && <p className="text-xs text-slate-500">{t.evaluatedBy.name}</p>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
