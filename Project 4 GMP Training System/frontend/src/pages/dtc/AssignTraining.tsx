import { FormEvent, useEffect, useState } from 'react';
import api from '../../api';
import { Training, User, ApiResponse } from '../../types';

export default function AssignTraining() {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [trainingId, setTrainingId] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState('');
  const [msg, setMsg] = useState('');

  // new-training form
  const [nt, setNt] = useState({ code: '', title: '', description: '', sopReference: '', department: '' });

  const load = () => {
    api.get<ApiResponse<Training[]>>('/trainings').then((r) => setTrainings(r.data.data));
    api.get<ApiResponse<User[]>>('/users').then((r) => setUsers(r.data.data.filter((u) => u.role !== 'ADMIN' && u.active)));
  };
  useEffect(() => { load(); }, []);

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const assign = async (e: FormEvent) => {
    e.preventDefault();
    setMsg('');
    try {
      const r = await api.post('/assignments', { trainingId, userIds: selected, dueDate: new Date(dueDate).toISOString() });
      setMsg(r.data.message);
      setSelected([]);
    } catch (err: any) {
      setMsg(err.response?.data?.message || 'Assignment failed');
    }
  };

  const createTraining = async (e: FormEvent) => {
    e.preventDefault();
    setMsg('');
    try {
      await api.post('/trainings', nt);
      setMsg(`Training ${nt.code} created.`);
      setNt({ code: '', title: '', description: '', sopReference: '', department: '' });
      load();
    } catch (err: any) {
      setMsg(err.response?.data?.message || 'Training creation failed');
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-xl font-semibold">Assign training</h1>
      {msg && <p className="text-sm text-navy">{msg}</p>}

      <form onSubmit={assign} className="card space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Training</label>
          <select className="field" value={trainingId} onChange={(e) => setTrainingId(e.target.value)} required>
            <option value="">Select training…</option>
            {trainings.map((t) => <option key={t.id} value={t.id}>{t.code} — {t.title}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Assign to user(s)</label>
          <div className="border border-slate-200 rounded-md max-h-52 overflow-y-auto divide-y divide-slate-100">
            {users.map((u) => (
              <label key={u.id} className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-slate-50">
                <input type="checkbox" checked={selected.includes(u.id)} onChange={() => toggle(u.id)} />
                {u.employeeId} — {u.name} <span className="text-xs text-slate-400">({u.department} · {u.role})</span>
              </label>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-1">{selected.length} user(s) selected — select several to assign as a group.</p>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Due date</label>
          <input className="field max-w-56" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
        </div>
        <button className="btn-primary" disabled={!trainingId || selected.length === 0}>Assign training</button>
      </form>

      <form onSubmit={createTraining} className="card space-y-3">
        <p className="text-sm font-semibold">Create a new training module</p>
        <div className="grid grid-cols-2 gap-3">
          <input className="field" placeholder="Code (e.g. TRN-0002)" value={nt.code} onChange={(e) => setNt({ ...nt, code: e.target.value })} required />
          <input className="field" placeholder="SOP reference (optional)" value={nt.sopReference} onChange={(e) => setNt({ ...nt, sopReference: e.target.value })} />
          <input className="field col-span-2" placeholder="Title" value={nt.title} onChange={(e) => setNt({ ...nt, title: e.target.value })} required />
          <input className="field col-span-2" placeholder="Description" value={nt.description} onChange={(e) => setNt({ ...nt, description: e.target.value })} required />
          <input className="field" placeholder="Department" value={nt.department} onChange={(e) => setNt({ ...nt, department: e.target.value })} required />
        </div>
        <button className="btn-ghost">Create training</button>
      </form>
    </div>
  );
}
