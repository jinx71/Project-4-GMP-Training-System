import { useEffect, useState } from 'react';
import api from '../../api';
import Badge from '../../components/Badge';
import Stamp from '../../components/Stamp';
import { Assignment, ApiResponse } from '../../types';
import { gmpDate } from '../../format';

export default function TrainingStatus() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [status, setStatus] = useState('');
  const [department, setDepartment] = useState('');

  const load = () => {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (department) params.set('department', department);
    api.get<ApiResponse<Assignment[]>>(`/assignments?${params}`).then((r) => setAssignments(r.data.data));
  };
  useEffect(() => { load(); }, [status, department]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Training status</h1>
      <div className="flex gap-3">
        <select className="field max-w-44" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="ASSIGNED">Assigned</option>
          <option value="PENDING">Pending</option>
          <option value="COMPLETED">Completed</option>
        </select>
        <input className="field max-w-56" placeholder="Filter by department" value={department} onChange={(e) => setDepartment(e.target.value)} />
      </div>
      <div className="card p-0 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="th">Employee</th>
              <th className="th">Training</th>
              <th className="th">Due</th>
              <th className="th">Status</th>
              <th className="th">Assigned</th>
            </tr>
          </thead>
          <tbody>
            {assignments.length === 0 && <tr><td className="td text-slate-400" colSpan={5}>No assignments found.</td></tr>}
            {assignments.map((a) => (
              <tr key={a.id}>
                <td className="td">
                  <p className="font-medium">{a.user?.employeeId} — {a.user?.name}</p>
                  <p className="text-xs text-slate-500">{a.user?.department}</p>
                </td>
                <td className="td">{a.training.code} — {a.training.title}</td>
                <td className="td">{gmpDate(a.dueDate)}</td>
                <td className="td"><Badge status={a.status} /></td>
                <td className="td"><Stamp iso={a.assignedAt} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
