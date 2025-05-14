import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import Badge from '../components/Badge';
import Stamp from '../components/Stamp';
import { Assignment, ApiResponse, AssignmentStatus } from '../types';
import { gmpDate } from '../format';

const TABS: AssignmentStatus[] = ['ASSIGNED', 'PENDING', 'COMPLETED'];

export default function MyTrainings() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [tab, setTab] = useState<AssignmentStatus>('ASSIGNED');

  useEffect(() => {
    api.get<ApiResponse<Assignment[]>>('/assignments/me').then((r) => setAssignments(r.data.data));
  }, []);

  const rows = assignments.filter((a) => a.status === tab);
  const now = new Date();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">My trainings</h1>
      <div className="flex gap-2">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`btn text-xs ${tab === t ? 'bg-navy text-white' : 'border border-slate-300 text-slate-600 hover:bg-slate-50'}`}>
            {t} ({assignments.filter((a) => a.status === t).length})
          </button>
        ))}
      </div>
      <div className="card p-0 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="th">Training</th>
              <th className="th">Due date</th>
              <th className="th">Assigned</th>
              <th className="th">Status</th>
              <th className="th">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td className="td text-slate-400" colSpan={5}>No {tab.toLowerCase()} trainings.</td></tr>
            )}
            {rows.map((a) => {
              const open = (a.training.assessments || []).find(
                (x) => new Date(x.scheduledFrom) <= now && now <= new Date(x.scheduledTo)
              );
              return (
                <tr key={a.id}>
                  <td className="td">
                    <p className="font-medium">{a.training.code} — {a.training.title}</p>
                    {a.training.sopReference && <p className="text-xs text-slate-500">Ref: {a.training.sopReference}</p>}
                  </td>
                  <td className="td">{gmpDate(a.dueDate)}</td>
                  <td className="td"><Stamp iso={a.assignedAt} /></td>
                  <td className="td"><Badge status={a.status} /></td>
                  <td className="td">
                    {a.status === 'ASSIGNED' && open && (
                      <Link to={`/assessment/${open.id}`} className="btn-primary text-xs">Take assessment</Link>
                    )}
                    {a.status === 'ASSIGNED' && !open && <span className="text-xs text-slate-400">No open assessment window</span>}
                    {a.status === 'PENDING' && <span className="text-xs text-slate-400">Awaiting trainer evaluation</span>}
                    {a.status === 'COMPLETED' && a.completedAt && <Stamp iso={a.completedAt} />}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
