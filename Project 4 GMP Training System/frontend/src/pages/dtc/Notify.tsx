import { FormEvent, useEffect, useState } from 'react';
import api from '../../api';
import { useAuth } from '../../auth';
import { User, ApiResponse } from '../../types';

export default function Notify() {
  const { user, hasLevel } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [recipients, setRecipients] = useState<string[]>([]);
  const [type, setType] = useState('SUBMIT_REMINDER');
  const [message, setMessage] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.get<ApiResponse<User[]>>('/users').then((r) => setUsers(r.data.data.filter((u) => u.active && u.id !== user?.id)));
  }, []);

  // Notification routing rules per role
  const targetRole =
    type === 'EVALUATE_REMINDER' ? 'TRAINER' :
    type === 'DTC_TRAINING_NOTICE' ? 'DTC' : 'USER';
  const candidates = users.filter((u) => u.role === targetRole);

  const toggle = (id: string) =>
    setRecipients((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const send = async (e: FormEvent) => {
    e.preventDefault();
    setMsg('');
    try {
      const r = await api.post('/notifications', { recipientIds: recipients, type, message });
      setMsg(r.data.message);
      setRecipients([]);
      setMessage('');
    } catch (err: any) {
      setMsg(err.response?.data?.message || 'Failed to send');
    }
  };

  return (
    <form onSubmit={send} className="space-y-4 max-w-2xl">
      <h1 className="text-xl font-semibold">Send notifications</h1>
      <div className="card space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Notification type</label>
          <select className="field" value={type} onChange={(e) => { setType(e.target.value); setRecipients([]); }}>
            <option value="SUBMIT_REMINDER">Notify users — submit assessment</option>
            <option value="EVALUATE_REMINDER">Notify trainer — complete evaluation</option>
            {hasLevel('STC') && <option value="DTC_TRAINING_NOTICE">Notify DTC — training notice (STC only)</option>}
            <option value="TRAINING_INFO">General training information</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Recipients ({targetRole})</label>
          <div className="border border-slate-200 rounded-md max-h-52 overflow-y-auto divide-y divide-slate-100">
            {candidates.length === 0 && <p className="px-3 py-2 text-sm text-slate-400">No {targetRole} accounts available.</p>}
            {candidates.map((u) => (
              <label key={u.id} className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-slate-50">
                <input type="checkbox" checked={recipients.includes(u.id)} onChange={() => toggle(u.id)} />
                {u.employeeId} — {u.name} <span className="text-xs text-slate-400">({u.department})</span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Message</label>
          <textarea className="field" rows={3} value={message} onChange={(e) => setMessage(e.target.value)} required />
        </div>
        <button className="btn-primary" disabled={recipients.length === 0}>Send notification</button>
        {msg && <p className="text-sm text-navy">{msg}</p>}
      </div>
    </form>
  );
}
