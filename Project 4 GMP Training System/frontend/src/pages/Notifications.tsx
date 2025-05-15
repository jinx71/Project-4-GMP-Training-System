import { useEffect, useState } from 'react';
import api from '../api';
import Stamp from '../components/Stamp';
import { AppNotification, ApiResponse } from '../types';

export default function Notifications() {
  const [items, setItems] = useState<AppNotification[]>([]);

  const load = () => api.get<ApiResponse<AppNotification[]>>('/notifications/me').then((r) => setItems(r.data.data));
  useEffect(() => { load(); }, []);

  const markRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      load();
    } catch { /* non-critical */ }
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <h1 className="text-xl font-semibold">Notifications</h1>
      {items.length === 0 && <p className="text-sm text-slate-400">No notifications yet.</p>}
      {items.map((n) => (
        <div key={n.id} className={`card flex items-start justify-between gap-4 ${n.read ? 'opacity-60' : ''}`}>
          <div>
            <p className="text-xs font-semibold text-navy">{n.type.replace(/_/g, ' ')}</p>
            <p className="text-sm mt-1">{n.message}</p>
            <p className="text-xs text-slate-400 mt-1">From {n.sender.name} ({n.sender.role}) · <Stamp iso={n.createdAt} /></p>
          </div>
          {!n.read && <button className="btn-ghost text-xs" onClick={() => markRead(n.id)}>Mark read</button>}
        </div>
      ))}
    </div>
  );
}
