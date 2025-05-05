import { FormEvent, useEffect, useState } from 'react';
import api from '../../api';
import Stamp from '../../components/Stamp';
import { User, Role, ApiResponse } from '../../types';

const ROLES: Role[] = ['USER', 'TRAINER', 'DTC', 'STC', 'ADMIN'];

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [form, setForm] = useState({ employeeId: '', name: '', email: '', password: '', role: 'USER', department: '' });
  const [msg, setMsg] = useState('');

  const load = () => api.get<ApiResponse<User[]>>('/users').then((r) => setUsers(r.data.data));
  useEffect(() => { load(); }, []);

  const create = async (e: FormEvent) => {
    e.preventDefault();
    setMsg('');
    try {
      await api.post('/users', form);
      setMsg(`User ${form.employeeId} created.`);
      setForm({ employeeId: '', name: '', email: '', password: '', role: 'USER', department: '' });
      load();
    } catch (err: any) {
      setMsg(err.response?.data?.message || 'User creation failed');
    }
  };

  const changeRole = async (id: string, role: string) => {
    try {
      await api.patch(`/users/${id}/role`, { role });
      load();
    } catch (err: any) {
      setMsg(err.response?.data?.message || 'Role update failed');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">User management</h1>
      {msg && <p className="text-sm text-navy">{msg}</p>}

      <form onSubmit={create} className="card grid grid-cols-3 gap-3 max-w-3xl">
        <input className="field" placeholder="Employee ID" value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} required />
        <input className="field" placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input className="field" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <input className="field" type="password" placeholder="Initial password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        <input className="field" placeholder="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} required />
        <select className="field" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
          {ROLES.map((r) => <option key={r}>{r}</option>)}
        </select>
        <button className="btn-primary col-span-3 justify-self-start">Create user</button>
      </form>

      <div className="card p-0 overflow-x-auto">
        <table className="w-full">
          <thead><tr><th className="th">Employee</th><th className="th">Email</th><th className="th">Department</th><th className="th">Role</th><th className="th">Created</th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td className="td font-medium">{u.employeeId} — {u.name}</td>
                <td className="td">{u.email}</td>
                <td className="td">{u.department}</td>
                <td className="td">
                  <select className="field py-1 text-xs" value={u.role} onChange={(e) => changeRole(u.id, e.target.value)}>
                    {ROLES.map((r) => <option key={r}>{r}</option>)}
                  </select>
                </td>
                <td className="td"><Stamp iso={u.createdAt} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
