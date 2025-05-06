import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../auth';
import { Assignment, Attempt, ApiResponse } from '../types';

export default function Dashboard() {
  const { user, hasLevel } = useAuth();
  const [mine, setMine] = useState<Assignment[]>([]);
  const [pendingEvals, setPendingEvals] = useState<Attempt[]>([]);

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'ADMIN') {
      api.get<ApiResponse<Assignment[]>>('/assignments/me').then((r) => setMine(r.data.data));
    }
    if (hasLevel('TRAINER')) {
      api.get<ApiResponse<Attempt[]>>('/assessments/attempts/pending').then((r) => setPendingEvals(r.data.data));
    }
  }, [user]);

  if (!user) return null;
  const count = (s: string) => mine.filter((a) => a.status === s).length;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Welcome, {user.name}</h1>

      {user.role !== 'ADMIN' && (
        <div className="grid grid-cols-3 gap-4">
          {(['COMPLETED', 'ASSIGNED', 'PENDING'] as const).map((s) => (
            <Link key={s} to="/my-trainings" className="card hover:border-navy/50">
              <p className="text-3xl font-semibold">{count(s)}</p>
              <p className="text-xs uppercase tracking-wider text-slate-500 mt-1">{s.toLowerCase()} trainings</p>
            </Link>
          ))}
        </div>
      )}

      {hasLevel('TRAINER') && (
        <Link to="/trainer/evaluate" className="card block hover:border-navy/50">
          <p className="text-sm font-medium">Evaluation queue</p>
          <p className="text-sm text-slate-500">{pendingEvals.length} attempt(s) awaiting your evaluation</p>
        </Link>
      )}

      {user.role === 'ADMIN' && (
        <div className="grid grid-cols-2 gap-4">
          <Link to="/admin/users" className="card hover:border-navy/50">
            <p className="font-medium">User management</p>
            <p className="text-sm text-slate-500 mt-1">Create accounts and set user roles</p>
          </Link>
          <Link to="/admin/audit" className="card hover:border-navy/50">
            <p className="font-medium">Audit trail</p>
            <p className="text-sm text-slate-500 mt-1">Review and print the system audit trail</p>
          </Link>
        </div>
      )}
    </div>
  );
}
