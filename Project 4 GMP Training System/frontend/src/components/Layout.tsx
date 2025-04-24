import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../auth';
import { gmpDateTime } from '../format';

interface NavItem { to: string; label: string; show: boolean; }

export default function Layout() {
  const { user, logout, hasLevel } = useAuth();
  const navigate = useNavigate();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!user) return null;
  const isAdmin = user.role === 'ADMIN';

  const nav: NavItem[] = [
    { to: '/', label: 'Dashboard', show: true },
    { to: '/my-trainings', label: 'My trainings', show: !isAdmin },
    { to: '/notifications', label: 'Notifications', show: !isAdmin },
    { to: '/trainer/assessments', label: 'Set assessments', show: hasLevel('TRAINER') },
    { to: '/trainer/evaluate', label: 'Evaluate attempts', show: hasLevel('TRAINER') },
    { to: '/dtc/status', label: 'Training status', show: hasLevel('DTC') },
    { to: '/dtc/assign', label: 'Assign training', show: hasLevel('DTC') },
    { to: '/dtc/notify', label: 'Send notifications', show: hasLevel('DTC') },
    { to: '/stc/reports', label: 'Training reports', show: hasLevel('STC') },
    { to: '/admin/users', label: 'User management', show: isAdmin },
    { to: '/admin/audit', label: 'Audit trail', show: isAdmin }
  ];

  return (
    <div className="min-h-screen flex">
      <aside className="w-60 shrink-0 bg-navydeep text-white flex flex-col">
        <div className="px-5 py-5 border-b border-white/10">
          <p className="font-semibold leading-tight">GMP Training</p>
          <p className="text-xs text-white/60">Management System</p>
        </div>
        <nav className="flex-1 py-3">
          {nav.filter((n) => n.show).map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === '/'}
              className={({ isActive }) =>
                `block px-5 py-2.5 text-sm ${isActive ? 'bg-white/10 text-white border-l-2 border-white' : 'text-white/70 hover:text-white hover:bg-white/5'}`
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-5 py-4 border-t border-white/10 text-sm">
          <p className="font-medium">{user.name}</p>
          <p className="text-xs text-white/60">{user.employeeId} · {user.role}</p>
          <button
            className="mt-3 text-xs underline text-white/70 hover:text-white"
            onClick={async () => { await logout(); navigate('/login'); }}
          >
            Sign out
          </button>
        </div>
      </aside>
      <div className="flex-1 min-w-0">
        <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
          <p className="text-sm text-slate-500">{user.department} department</p>
          <p className="stamp" title="System time">{gmpDateTime(now.toISOString())}</p>
        </header>
        <main className="p-6 max-w-6xl">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
